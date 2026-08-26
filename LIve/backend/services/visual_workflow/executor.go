package visual_workflow

import (
	"encoding/json"
	"fmt"
	"log"
	"fitino-live-backend/models"
	"fitino-live-backend/services/notification"
	"strings"
	"time"

	"gorm.io/gorm"
)

// VisualWorkflowExecutor executes node-based visual workflows
type VisualWorkflowExecutor struct {
	db    *gorm.DB
	sms   *notification.SmsService
	voice *notification.VoiceService
}

// NewVisualWorkflowExecutor creates a new visual workflow executor
func NewVisualWorkflowExecutor(db *gorm.DB, sms *notification.SmsService, voice *notification.VoiceService) *VisualWorkflowExecutor {
	return &VisualWorkflowExecutor{
		db:    db,
		sms:   sms,
		voice: voice,
	}
}

// RunDueExecutions processes all pending node executions
func (e *VisualWorkflowExecutor) RunDueExecutions(now time.Time) error {
	log.Printf("🔄 Running visual workflow executor at %s", now.Format("2006-01-02 15:04:05"))

	// Find all pending node executions that are due
	var pendingExecutions []models.NodeExecution
	if err := e.db.Where("status = ? AND scheduled_for <= ?", "pending", now).
		Order("scheduled_for ASC").
		Limit(100). // Process in batches
		Find(&pendingExecutions).Error; err != nil {
		log.Printf("❌ Failed to fetch pending executions: %v", err)
		return err
	}

	if len(pendingExecutions) == 0 {
		// Check for new workflow triggers
		return e.checkNewTriggers(now)
	}

	log.Printf("📋 Found %d pending node execution(s)", len(pendingExecutions))

	for _, nodeExec := range pendingExecutions {
		if err := e.executeNode(&nodeExec, now); err != nil {
			log.Printf("❌ Error executing node %d: %v", nodeExec.NodeID, err)
			// Continue with other nodes
		}
	}

	return nil
}

// checkNewTriggers checks for new workflow triggers
func (e *VisualWorkflowExecutor) checkNewTriggers(now time.Time) error {
	// Get all active visual workflows
	var workflows []models.VisualWorkflow
	if err := e.db.Where("is_active = ?", true).
		Preload("Nodes").
		Preload("Connections").
		Find(&workflows).Error; err != nil {
		return err
	}

	for _, workflow := range workflows {
		// Find trigger node
		var triggerNode *models.WorkflowNode
		for _, node := range workflow.Nodes {
			if node.NodeType == "trigger" {
				triggerNode = &node
				break
			}
		}

		if triggerNode == nil {
			continue
		}

		// Check if trigger conditions are met
		if err := e.checkTrigger(&workflow, triggerNode, now); err != nil {
			log.Printf("❌ Error checking trigger for workflow %d: %v", workflow.ID, err)
		}
	}

	return nil
}

// checkTrigger checks if a trigger node should fire
func (e *VisualWorkflowExecutor) checkTrigger(workflow *models.VisualWorkflow, triggerNode *models.WorkflowNode, now time.Time) error {
	var config models.TriggerConfig
	configBytes, _ := json.Marshal(triggerNode.Config)
	if err := json.Unmarshal(configBytes, &config); err != nil {
		return err
	}

	// Get users who should trigger this workflow
	var users []models.User
	query := e.db.Model(&models.User{})

	if workflow.WebinarID != nil {
		query = query.Where("webinar_id = ?", *workflow.WebinarID)
	}

	switch config.TriggerType {
	case "on_registration":
		// Find users registered in last 5 minutes who don't have an active execution
		fiveMinutesAgo := now.Add(-5 * time.Minute)
		query = query.Where("registered_at >= ? AND registered_at <= ?", fiveMinutesAgo, now)

	case "before_webinar":
		if config.HoursBefore == nil {
			return fmt.Errorf("hours_before is required for before_webinar trigger")
		}
		// Get users for webinars starting around this time (within 5 min window)
		var webinar models.Webinar
		if workflow.WebinarID != nil {
			if err := e.db.First(&webinar, *workflow.WebinarID).Error; err != nil {
				return err
			}
			timeDiff := webinar.StartTime.Sub(now).Hours()
			if timeDiff >= float64(*config.HoursBefore-1) && timeDiff <= float64(*config.HoursBefore) {
				query = query.Where("webinar_id = ?", webinar.ID)
			} else {
				return nil // Not time yet
			}
		}

	case "after_webinar":
		if config.HoursAfter == nil {
			return fmt.Errorf("hours_after is required for after_webinar trigger")
		}
		// Similar logic for after webinar
		var webinar models.Webinar
		if workflow.WebinarID != nil {
			if err := e.db.First(&webinar, *workflow.WebinarID).Error; err != nil {
				return err
			}
			timeDiff := now.Sub(webinar.EndTime).Hours()
			if timeDiff >= float64(*config.HoursAfter-1) && timeDiff <= float64(*config.HoursAfter) {
				query = query.Where("webinar_id = ?", webinar.ID)
			} else {
				return nil
			}
		}
	}

	if err := query.Find(&users).Error; err != nil {
		return err
	}

	// Create executions for eligible users
	for _, user := range users {
		// Check if user already has an active execution for this workflow
		var existingExec models.WorkflowExecution
		err := e.db.Where("workflow_id = ? AND user_id = ? AND status IN (?)", 
			workflow.ID, user.ID, []string{"running", "pending"}).
			First(&existingExec).Error
		
		if err == nil {
			continue // Already has active execution
		}

		// Create new execution
		execution := models.WorkflowExecution{
			WorkflowID:    workflow.ID,
			UserID:        user.ID,
			Status:        "running",
			CurrentNodeID: &triggerNode.ID,
			StartedAt:     now,
		}

		if err := e.db.Create(&execution).Error; err != nil {
			log.Printf("❌ Failed to create execution: %v", err)
			continue
		}

		// Schedule first node after trigger
		if err := e.scheduleNextNodes(workflow, triggerNode.ID, execution.ID, user.ID, now); err != nil {
			log.Printf("❌ Failed to schedule next nodes: %v", err)
		}

		log.Printf("✅ Started workflow %d for user %d", workflow.ID, user.ID)
	}

	return nil
}

// executeNode executes a single node
func (e *VisualWorkflowExecutor) executeNode(nodeExec *models.NodeExecution, now time.Time) error {
	// Update status to running
	nodeExec.Status = "running"
	executedAt := now
	nodeExec.ExecutedAt = &executedAt
	e.db.Save(nodeExec)

	// Get node details
	var node models.WorkflowNode
	if err := e.db.First(&node, nodeExec.NodeID).Error; err != nil {
		return e.failNodeExecution(nodeExec, fmt.Sprintf("Node not found: %v", err))
	}

	// Get user
	var user models.User
	if err := e.db.First(&user, nodeExec.UserID).Error; err != nil {
		return e.failNodeExecution(nodeExec, fmt.Sprintf("User not found: %v", err))
	}

	// Execute based on node type
	var err error
	var nextNodeID *uint

	switch node.NodeType {
	case "delay":
		// Delay nodes are handled by scheduling, so just mark as success
		err = nil
	case "condition":
		nextNodeID, err = e.executeConditionNode(&node, &user, nodeExec)
	case "action":
		err = e.executeActionNode(&node, &user, nodeExec)
	default:
		err = fmt.Errorf("unknown node type: %s", node.NodeType)
	}

	if err != nil {
		return e.failNodeExecution(nodeExec, err.Error())
	}

	// Mark as success
	nodeExec.Status = "success"
	nodeExec.NextNodeID = nextNodeID
	e.db.Save(nodeExec)

	// Get workflow
	var workflow models.VisualWorkflow
	if err := e.db.Preload("Connections").First(&workflow, node.WorkflowID).Error; err != nil {
		return err
	}

	// Schedule next nodes
	return e.scheduleNextNodes(&workflow, node.ID, nodeExec.ExecutionID, user.ID, now)
}

// executeConditionNode evaluates a condition and returns next node ID
func (e *VisualWorkflowExecutor) executeConditionNode(node *models.WorkflowNode, user *models.User, nodeExec *models.NodeExecution) (*uint, error) {
	var config models.ConditionConfig
	configBytes, _ := json.Marshal(node.Config)
	if err := json.Unmarshal(configBytes, &config); err != nil {
		return nil, err
	}

	result := e.evaluateCondition(&config, user)
	
	// Store result in output
	output := map[string]interface{}{
		"condition_type": config.ConditionType,
		"result": result,
	}
	outputJSON, _ := json.Marshal(output)
	outputStr := string(outputJSON)
	nodeExec.Output = &outputStr

	// Return the branch to take (will be used to find next node)
	// The actual next node will be determined by connections
	return nil, nil
}

// evaluateCondition evaluates a condition against user data
func (e *VisualWorkflowExecutor) evaluateCondition(config *models.ConditionConfig, user *models.User) bool {
	switch config.ConditionType {
	case "has_joined":
		return user.FirstJoinAt != nil

	case "watch_percentage":
		// Assume webinar is 100 minutes for now
		watchPercentage := float64(user.TotalWatchSeconds) / 60.0 / 100.0 * 100.0
		valueFloat, ok := config.Value.(float64)
		if !ok {
			return false
		}
		
		switch config.Operator {
		case "greater_than":
			return watchPercentage > valueFloat
		case "less_than":
			return watchPercentage < valueFloat
		case "equals":
			return watchPercentage == valueFloat
		}

	case "reached_offer":
		return user.CTAClickedAt != nil

	case "purchased_full":
		return user.PurchaseStatus == "full"

	case "purchased_installment":
		return user.PurchaseStatus == "installment"

	case "purchased_any":
		return user.PurchaseStatus == "full" || user.PurchaseStatus == "installment"

	case "has_tag":
		tagName, ok := config.Value.(string)
		if !ok {
			return false
		}
		for _, tag := range user.Tags {
			if tag == tagName {
				return true
			}
		}
		return false
	}

	return false
}

// executeActionNode executes an action node
func (e *VisualWorkflowExecutor) executeActionNode(node *models.WorkflowNode, user *models.User, nodeExec *models.NodeExecution) error {
	switch node.NodeSubType {
	case "send_sms":
		return e.executeSMSAction(node, user)
	// DISABLED: send_voice (Avanak) has been completely removed
	case "add_tag":
		return e.executeAddTagAction(node, user)
	case "remove_tag":
		return e.executeRemoveTagAction(node, user)
	case "update_field":
		return e.executeUpdateFieldAction(node, user)
	case "stop_workflows":
		return e.executeStopWorkflowsAction(node, user)
	default:
		return fmt.Errorf("unknown action subtype: %s", node.NodeSubType)
	}
}

// executeSMSAction sends an SMS
func (e *VisualWorkflowExecutor) executeSMSAction(node *models.WorkflowNode, user *models.User) error {
	var config models.SMSActionConfig
	configBytes, _ := json.Marshal(node.Config)
	if err := json.Unmarshal(configBytes, &config); err != nil {
		return err
	}

	// Replace placeholders
	params := make(map[string]string)
	for key, value := range config.Parameters {
		value = strings.ReplaceAll(value, "{{first_name}}", user.FirstName)
		value = strings.ReplaceAll(value, "{{last_name}}", user.LastName)
		value = strings.ReplaceAll(value, "{{phone}}", user.Phone)
		params[key] = value
	}

	return e.sms.SendWorkflowPattern(user.Phone, config.PatternCode, params)
}

// executeVoiceAction sends a voice call
func (e *VisualWorkflowExecutor) executeVoiceAction(node *models.WorkflowNode, user *models.User) error {
	var config models.VoiceActionConfig
	configBytes, _ := json.Marshal(node.Config)
	if err := json.Unmarshal(configBytes, &config); err != nil {
		return err
	}

	return e.voice.SendWorkflowPattern(user.Phone, config.VoiceID, nil)
}

// executeAddTagAction adds a tag to user
func (e *VisualWorkflowExecutor) executeAddTagAction(node *models.WorkflowNode, user *models.User) error {
	var config models.TagActionConfig
	configBytes, _ := json.Marshal(node.Config)
	if err := json.Unmarshal(configBytes, &config); err != nil {
		return err
	}

	// Check if tag already exists
	for _, tag := range user.Tags {
		if tag == config.TagName {
			return nil
		}
	}

	user.Tags = append(user.Tags, config.TagName)
	return e.db.Model(user).Update("tags", user.Tags).Error
}

// executeRemoveTagAction removes a tag from user
func (e *VisualWorkflowExecutor) executeRemoveTagAction(node *models.WorkflowNode, user *models.User) error {
	var config models.TagActionConfig
	configBytes, _ := json.Marshal(node.Config)
	if err := json.Unmarshal(configBytes, &config); err != nil {
		return err
	}

	newTags := []string{}
	for _, tag := range user.Tags {
		if tag != config.TagName {
			newTags = append(newTags, tag)
		}
	}

	user.Tags = newTags
	return e.db.Model(user).Update("tags", user.Tags).Error
}

// executeUpdateFieldAction updates a user field
func (e *VisualWorkflowExecutor) executeUpdateFieldAction(node *models.WorkflowNode, user *models.User) error {
	var config models.UpdateFieldConfig
	configBytes, _ := json.Marshal(node.Config)
	if err := json.Unmarshal(configBytes, &config); err != nil {
		return err
	}

	return e.db.Model(user).Update(config.FieldName, config.FieldValue).Error
}

// executeStopWorkflowsAction stops other workflows for this user
func (e *VisualWorkflowExecutor) executeStopWorkflowsAction(node *models.WorkflowNode, user *models.User) error {
	var config models.StopWorkflowConfig
	configBytes, _ := json.Marshal(node.Config)
	if err := json.Unmarshal(configBytes, &config); err != nil {
		return err
	}

	query := e.db.Model(&models.WorkflowExecution{}).
		Where("user_id = ? AND status IN (?)", user.ID, []string{"running", "pending"})

	if !config.StopAll && len(config.WorkflowIDs) > 0 {
		query = query.Where("workflow_id IN (?)", config.WorkflowIDs)
	}

	return query.Update("status", "stopped").Error
}

// scheduleNextNodes schedules the next nodes to execute
func (e *VisualWorkflowExecutor) scheduleNextNodes(workflow *models.VisualWorkflow, currentNodeID uint, executionID uint, userID uint, now time.Time) error {
	// Find connections from current node
	var connections []models.WorkflowConnection
	for _, conn := range workflow.Connections {
		if conn.FromNodeID == currentNodeID {
			connections = append(connections, conn)
		}
	}

	if len(connections) == 0 {
		// No more nodes, mark execution as completed
		return e.db.Model(&models.WorkflowExecution{}).
			Where("id = ?", executionID).
			Updates(map[string]interface{}{
				"status": "completed",
				"completed_at": now,
			}).Error
	}

	// For condition nodes, we need to check the output to determine which branch
	var currentNodeExec models.NodeExecution
	if err := e.db.Where("execution_id = ? AND node_id = ?", executionID, currentNodeID).
		Order("created_at DESC").
		First(&currentNodeExec).Error; err == nil {
		
		if currentNodeExec.Output != nil {
			var output map[string]interface{}
			json.Unmarshal([]byte(*currentNodeExec.Output), &output)
			
			if result, ok := output["result"].(bool); ok {
				// Filter connections based on condition result
				var filteredConns []models.WorkflowConnection
				for _, conn := range connections {
					if (result && conn.ConditionKey == "true") || (!result && conn.ConditionKey == "false") {
						filteredConns = append(filteredConns, conn)
					}
				}
				connections = filteredConns
			}
		}
	}

	// Schedule next nodes
	for _, conn := range connections {
		// Get next node
		var nextNode models.WorkflowNode
		if err := e.db.First(&nextNode, conn.ToNodeID).Error; err != nil {
			continue
		}

		scheduledFor := now

		// If next node is a delay, calculate scheduled time
		if nextNode.NodeType == "delay" {
			var delayConfig models.DelayConfig
			configBytes, _ := json.Marshal(nextNode.Config)
			json.Unmarshal(configBytes, &delayConfig)
			
			totalMinutes := delayConfig.DelayMinutes + 
				(delayConfig.DelayHours * 60) + 
				(delayConfig.DelayDays * 24 * 60)
			
			scheduledFor = now.Add(time.Duration(totalMinutes) * time.Minute)
		}

		// Create node execution
		nodeExec := models.NodeExecution{
			WorkflowID:   workflow.ID,
			ExecutionID:  executionID,
			NodeID:       nextNode.ID,
			UserID:       userID,
			Status:       "pending",
			ScheduledFor: &scheduledFor,
		}

		if err := e.db.Create(&nodeExec).Error; err != nil {
			log.Printf("❌ Failed to schedule node %d: %v", nextNode.ID, err)
		}
	}

	return nil
}

// failNodeExecution marks a node execution as failed
func (e *VisualWorkflowExecutor) failNodeExecution(nodeExec *models.NodeExecution, errorMsg string) error {
	nodeExec.Status = "failed"
	nodeExec.ErrorMessage = &errorMsg
	e.db.Save(nodeExec)

	// Mark workflow execution as failed
	return e.db.Model(&models.WorkflowExecution{}).
		Where("id = ?", nodeExec.ExecutionID).
		Updates(map[string]interface{}{
			"status": "failed",
			"error_message": errorMsg,
		}).Error
}

