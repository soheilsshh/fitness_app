package controllers

import (
	"encoding/json"
	"fmt"
	"log"
	"fitino-live-backend/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdminWorkflowController struct {
	DB *gorm.DB
}

func NewAdminWorkflowController(db *gorm.DB) *AdminWorkflowController {
	return &AdminWorkflowController{DB: db}
}

// GetWorkflows returns all workflows with step counts
func (ctrl *AdminWorkflowController) GetWorkflows(c *gin.Context) {
	var workflows []models.Workflow
	
	// Preload steps and webinar
	if err := ctrl.DB.Preload("Webinar").Preload("Steps").Order("created_at DESC").Find(&workflows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch workflows"})
		return
	}

	// Add steps count to response
	type WorkflowWithCount struct {
		models.Workflow
		StepsCount int `json:"steps_count"`
	}

	var response []WorkflowWithCount
	for _, workflow := range workflows {
		response = append(response, WorkflowWithCount{
			Workflow:   workflow,
			StepsCount: len(workflow.Steps),
		})
	}

	c.JSON(http.StatusOK, gin.H{"workflows": response})
}

// GetWorkflow returns a single workflow with all its steps
func (ctrl *AdminWorkflowController) GetWorkflow(c *gin.Context) {
	id := c.Param("id")
	
	var workflow models.Workflow
	if err := ctrl.DB.Preload("Webinar").Preload("Steps", func(db *gorm.DB) *gorm.DB {
		return db.Order("order_index ASC")
	}).First(&workflow, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Workflow not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch workflow"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"workflow": workflow})
}

// CreateWorkflow creates a new workflow with steps
func (ctrl *AdminWorkflowController) CreateWorkflow(c *gin.Context) {
	var input struct {
		Name        string                `json:"name" binding:"required"`
		Description string                `json:"description"`
		IsActive    bool                  `json:"is_active"`
		TriggerType string                `json:"trigger_type" binding:"required"`
		WebinarID   *uint                 `json:"webinar_id"`
		Steps       []models.WorkflowStep `json:"steps"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate trigger type
	validTriggers := map[string]bool{
		"on_registration":        true,
		"on_registration_today":  true,
		"before_webinar_start":   true,
		"on_webinar_start":       true,
		"after_webinar_end":      true,
		"on_webinar_end":         true,
		// Legacy support
		"before_webinar": true,
		"after_webinar":  true,
	}
	if !validTriggers[input.TriggerType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid trigger type"})
		return
	}

	// Start transaction
	tx := ctrl.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create workflow
	workflow := models.Workflow{
		Name:        input.Name,
		Description: input.Description,
		IsActive:    input.IsActive,
		TriggerType: input.TriggerType,
		WebinarID:   input.WebinarID,
	}

	if err := tx.Create(&workflow).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create workflow"})
		return
	}

	// Create steps
	for _, step := range input.Steps {
		step.WorkflowID = workflow.ID
		if err := tx.Create(&step).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create workflow steps"})
			return
		}
	}

	tx.Commit()

	log.Printf("✅ Created workflow: %s (ID: %d) with %d steps", workflow.Name, workflow.ID, len(input.Steps))
	c.JSON(http.StatusCreated, gin.H{"workflow": workflow})
}

// UpdateWorkflow updates a workflow and its steps
func (ctrl *AdminWorkflowController) UpdateWorkflow(c *gin.Context) {
	id := c.Param("id")
	
	var input struct {
		Name        string                `json:"name" binding:"required"`
		Description string                `json:"description"`
		IsActive    bool                  `json:"is_active"`
		TriggerType string                `json:"trigger_type" binding:"required"`
		WebinarID   *uint                 `json:"webinar_id"`
		Steps       []models.WorkflowStep `json:"steps"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate trigger type
	validTriggers := map[string]bool{
		"on_registration":        true,
		"on_registration_today":  true,
		"before_webinar_start":   true,
		"on_webinar_start":       true,
		"after_webinar_end":      true,
		"on_webinar_end":         true,
		// Legacy support
		"before_webinar": true,
		"after_webinar":  true,
	}
	if !validTriggers[input.TriggerType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid trigger type"})
		return
	}

	// Start transaction
	tx := ctrl.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Check if workflow exists
	var workflow models.Workflow
	if err := tx.First(&workflow, id).Error; err != nil {
		tx.Rollback()
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Workflow not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch workflow"})
		return
	}

	// Update workflow
	workflow.Name = input.Name
	workflow.Description = input.Description
	workflow.IsActive = input.IsActive
	workflow.TriggerType = input.TriggerType
	workflow.WebinarID = input.WebinarID

	if err := tx.Save(&workflow).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update workflow"})
		return
	}

	// Delete old steps
	if err := tx.Where("workflow_id = ?", workflow.ID).Delete(&models.WorkflowStep{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete old steps"})
		return
	}

	// Create new steps
	for _, step := range input.Steps {
		step.WorkflowID = workflow.ID
		step.ID = 0 // Reset ID to create new record
		if err := tx.Create(&step).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create workflow steps"})
			return
		}
	}

	tx.Commit()

	log.Printf("✅ Updated workflow: %s (ID: %d) with %d steps", workflow.Name, workflow.ID, len(input.Steps))
	c.JSON(http.StatusOK, gin.H{"workflow": workflow})
}

// DeleteWorkflow deletes a workflow (soft delete by setting is_active = false)
func (ctrl *AdminWorkflowController) DeleteWorkflow(c *gin.Context) {
	id := c.Param("id")
	
	var workflow models.Workflow
	if err := ctrl.DB.First(&workflow, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Workflow not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch workflow"})
		return
	}

	// Soft delete by setting is_active = false
	workflow.IsActive = false
	if err := ctrl.DB.Save(&workflow).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete workflow"})
		return
	}

	log.Printf("✅ Deleted (deactivated) workflow: %s (ID: %d)", workflow.Name, workflow.ID)
	c.JSON(http.StatusOK, gin.H{"message": "Workflow deleted successfully"})
}

// ToggleWorkflow toggles the is_active status of a workflow
func (ctrl *AdminWorkflowController) ToggleWorkflow(c *gin.Context) {
	id := c.Param("id")
	
	var input struct {
		IsActive bool `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var workflow models.Workflow
	if err := ctrl.DB.First(&workflow, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Workflow not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch workflow"})
		return
	}

	workflow.IsActive = input.IsActive
	if err := ctrl.DB.Save(&workflow).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to toggle workflow"})
		return
	}

	status := "deactivated"
	if input.IsActive {
		status = "activated"
	}
	log.Printf("✅ Workflow %s (ID: %d) %s", workflow.Name, workflow.ID, status)
	
	c.JSON(http.StatusOK, gin.H{"workflow": workflow})
}

// GetWorkflowLogs returns execution logs for workflows
func (ctrl *AdminWorkflowController) GetWorkflowLogs(c *gin.Context) {
	workflowIDStr := c.Query("workflow_id")
	participantIDStr := c.Query("participant_id")
	limitStr := c.DefaultQuery("limit", "50")

	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 200 {
		limit = 50
	}

	query := ctrl.DB.Model(&models.WorkflowExecutionLog{}).Order("executed_at DESC").Limit(limit)

	if workflowIDStr != "" {
		workflowID, err := strconv.ParseUint(workflowIDStr, 10, 32)
		if err == nil {
			query = query.Where("workflow_id = ?", workflowID)
		}
	}

	if participantIDStr != "" {
		participantID, err := strconv.ParseUint(participantIDStr, 10, 32)
		if err == nil {
			query = query.Where("participant_id = ?", participantID)
		}
	}

	var logs []models.WorkflowExecutionLog
	if err := query.Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch workflow logs"})
		return
	}

	// Enrich logs with workflow and participant info
	type EnrichedLog struct {
		models.WorkflowExecutionLog
		WorkflowName   string `json:"workflow_name"`
		ParticipantPhone string `json:"participant_phone"`
		StepOrderIndex int    `json:"step_order_index"`
	}

	var enrichedLogs []EnrichedLog
	for _, log := range logs {
		enriched := EnrichedLog{
			WorkflowExecutionLog: log,
		}

		// Get workflow name
		var workflow models.Workflow
		if err := ctrl.DB.Select("name").First(&workflow, log.WorkflowID).Error; err == nil {
			enriched.WorkflowName = workflow.Name
		}

		// Get participant phone
		var participant models.User
		if err := ctrl.DB.Select("phone").First(&participant, log.ParticipantID).Error; err == nil {
			enriched.ParticipantPhone = participant.Phone
		}

		// Get step order index
		var step models.WorkflowStep
		if err := ctrl.DB.Select("order_index").First(&step, log.WorkflowStepID).Error; err == nil {
			enriched.StepOrderIndex = step.OrderIndex
		}

		enrichedLogs = append(enrichedLogs, enriched)
	}

	c.JSON(http.StatusOK, gin.H{"logs": enrichedLogs, "count": len(enrichedLogs)})
}

// PreviewWorkflowRun shows what would happen for a specific user
func (ctrl *AdminWorkflowController) PreviewWorkflowRun(c *gin.Context) {
	workflowID := c.Param("id")
	userIDStr := c.Query("user_id")

	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
		return
	}

	// Get workflow
	var workflow models.Workflow
	if err := ctrl.DB.Preload("Steps", func(db *gorm.DB) *gorm.DB {
		return db.Where("enabled = ?", true).Order("order_index ASC")
	}).Preload("Webinar").First(&workflow, workflowID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Workflow not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch workflow"})
		return
	}

	// Get user
	var user models.User
	if err := ctrl.DB.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	// Get webinar if specified
	var webinar *models.Webinar
	if workflow.WebinarID != nil {
		var w models.Webinar
		if err := ctrl.DB.First(&w, *workflow.WebinarID).Error; err == nil {
			webinar = &w
		}
	}

	// Calculate preview
	now := time.Now()
	loc, _ := time.LoadLocation("Asia/Tehran")
	nowInLoc := now.In(loc)

	type StepPreview struct {
		StepID          uint      `json:"step_id"`
		StepName        string    `json:"step_name"`
		OrderIndex      int       `json:"order_index"`
		ScheduledTime   time.Time `json:"scheduled_time"`
		HumanReadable   string    `json:"human_readable"`
		SegmentMatch    bool      `json:"segment_match"`
		ConditionsMatch bool      `json:"conditions_match"`
		WillExecute     bool      `json:"will_execute"`
		ActionType      string    `json:"action_type"`
	}

	var preview []StepPreview

	for _, step := range workflow.Steps {
		// Calculate scheduled time
		scheduledTime := ctrl.calculateScheduledTimePreview(&step, workflow.TriggerType, &user, webinar, nowInLoc)

		// Check segment match
		segmentMatch := ctrl.checkSegmentMatch(&user, &step, webinar)

		// Check conditions match
		conditionsMatch := true
		if step.Conditions != nil && *step.Conditions != "" {
			conditionsMatch = ctrl.checkConditionsMatch(*step.Conditions, &user, webinar)
		}

		willExecute := segmentMatch && conditionsMatch

		preview = append(preview, StepPreview{
			StepID:          step.ID,
			StepName:        step.Name,
			OrderIndex:      step.OrderIndex,
			ScheduledTime:   scheduledTime,
			HumanReadable:   scheduledTime.Format("2006-01-02 15:04:05"),
			SegmentMatch:    segmentMatch,
			ConditionsMatch: conditionsMatch,
			WillExecute:     willExecute,
			ActionType:      step.ActionType,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"workflow": map[string]interface{}{
			"id":   workflow.ID,
			"name": workflow.Name,
		},
		"user": map[string]interface{}{
			"id":    user.ID,
			"name":  user.FirstName + " " + user.LastName,
			"phone": user.Phone,
		},
		"preview": preview,
	})
}

// Helper functions for preview
func (ctrl *AdminWorkflowController) calculateScheduledTimePreview(step *models.WorkflowStep, triggerType string, user *models.User, webinar *models.Webinar, now time.Time) time.Time {
	loc, _ := time.LoadLocation("Asia/Tehran")
	nowInLoc := now.In(loc)

	runMode := step.RunMode
	if runMode == "" {
		if step.ScheduleType == "fixed_time" {
			switch step.RelativeTo {
			case "registration_time":
				runMode = "OFFSET_FROM_TRIGGER"
			case "webinar_start":
				runMode = "OFFSET_FROM_WEBINAR_START"
			case "webinar_end":
				runMode = "OFFSET_FROM_WEBINAR_END"
			default:
				runMode = "OFFSET_FROM_TRIGGER"
			}
		} else {
			runMode = "OFFSET_FROM_TRIGGER"
		}
	}

	offsetMinutes := step.OffsetMinutes
	if offsetMinutes == 0 && step.DelayMinutes != 0 {
		offsetMinutes = step.DelayMinutes
	}

	switch runMode {
	case "OFFSET_FROM_TRIGGER":
		return user.RegisteredAt.Add(time.Duration(offsetMinutes) * time.Minute)
	case "OFFSET_FROM_WEBINAR_START":
		if webinar != nil {
			return webinar.StartTime.Add(time.Duration(offsetMinutes) * time.Minute)
		}
		return nowInLoc
	case "OFFSET_FROM_WEBINAR_END":
		if webinar != nil {
			return webinar.EndTime.Add(time.Duration(offsetMinutes) * time.Minute)
		}
		return nowInLoc
	case "FIXED_LOCAL_TIME":
		if step.FixedTime == nil || *step.FixedTime == "" {
			return nowInLoc
		}
		var hour, minute int
		if _, err := fmt.Sscanf(*step.FixedTime, "%d:%d", &hour, &minute); err == nil {
			todayAtTime := time.Date(nowInLoc.Year(), nowInLoc.Month(), nowInLoc.Day(), hour, minute, 0, 0, loc)
			if nowInLoc.After(todayAtTime) {
				todayAtTime = todayAtTime.AddDate(0, 0, 1)
			}
			return todayAtTime
		}
		return nowInLoc
	default:
		return nowInLoc
	}
}

func (ctrl *AdminWorkflowController) checkSegmentMatch(user *models.User, step *models.WorkflowStep, webinar *models.Webinar) bool {
	// Simplified version - full logic is in executor
	targetSegment := step.TargetSegment
	if targetSegment == "" {
		targetSegment = step.SegmentType
		if targetSegment == "" {
			return true
		}
	}

	switch targetSegment {
	case "all_registered":
		return true
	case "registered_not_joined":
		return user.FirstJoinAt == nil
	case "buyers_full":
		return user.PurchaseStatus == "full"
	case "buyers_installment":
		return user.PurchaseStatus == "installment"
	default:
		return true // Default match
	}
}

func (ctrl *AdminWorkflowController) checkConditionsMatch(conditionsJSON string, user *models.User, webinar *models.Webinar) bool {
	var conditions models.StepConditions
	if err := json.Unmarshal([]byte(conditionsJSON), &conditions); err != nil {
		return false
	}
	// Simplified - full evaluation in executor
	return true
}

// GetStepLogs returns execution logs for a specific workflow step
func (ctrl *AdminWorkflowController) GetStepLogs(c *gin.Context) {
	workflowID := c.Param("id") // Changed from "workflow_id" to "id" to match route
	stepID := c.Param("step_id")

	// Parse IDs
	workflowIDUint, err := strconv.ParseUint(workflowID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid workflow_id"})
		return
	}

	stepIDUint, err := strconv.ParseUint(stepID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid step_id"})
		return
	}

	// Get limit
	limitStr := c.DefaultQuery("limit", "100")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 500 {
		limit = 100
	}

	// Fetch run steps for this workflow and step
	var runSteps []models.WorkflowRunStep
	query := ctrl.DB.
		Joins("JOIN workflow_runs ON workflow_run_steps.run_id = workflow_runs.id").
		Where("workflow_runs.workflow_id = ? AND workflow_run_steps.step_id = ?", workflowIDUint, stepIDUint).
		Order("workflow_run_steps.executed_at DESC").
		Limit(limit).
		Find(&runSteps)

	if query.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch step logs"})
		return
	}

	// Enrich with user and run info
	type EnrichedStepLog struct {
		ID           uint       `json:"id"`
		UserID       uint       `json:"user_id"`
		UserName     string     `json:"user_name"`
		UserPhone    string     `json:"user_phone"`
		ScheduledFor time.Time  `json:"scheduled_for"`
		ExecutedAt   *time.Time `json:"executed_at"`
		Status       string     `json:"status"`
		ErrorText    *string    `json:"error_text"`
		Output       *string    `json:"output"`
		RunID        uint       `json:"run_id"`
		RunStatus    string     `json:"run_status"`
	}

	var enrichedLogs []EnrichedStepLog
	for _, runStep := range runSteps {
		// Get run info
		var run models.WorkflowRun
		if err := ctrl.DB.First(&run, runStep.RunID).Error; err != nil {
			continue
		}

		// Get user info
		var user models.User
		userName := "Unknown"
		userPhone := ""
		if err := ctrl.DB.First(&user, run.UserID).Error; err == nil {
			userName = user.FirstName + " " + user.LastName
			userPhone = user.Phone
		}

		enrichedLogs = append(enrichedLogs, EnrichedStepLog{
			ID:           runStep.ID,
			UserID:       run.UserID,
			UserName:     userName,
			UserPhone:    userPhone,
			ScheduledFor: runStep.ScheduledFor,
			ExecutedAt:   runStep.ExecutedAt,
			Status:       runStep.Status,
			ErrorText:    runStep.ErrorText,
			Output:       runStep.Output,
			RunID:        runStep.RunID,
			RunStatus:    run.Status,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"workflow_id": workflowIDUint,
		"step_id":     stepIDUint,
		"logs":        enrichedLogs,
		"count":       len(enrichedLogs),
	})
}

// TestWorkflowRun runs a workflow in test mode (dry run) for a specific user
func (ctrl *AdminWorkflowController) TestWorkflowRun(c *gin.Context) {
	workflowID := c.Param("id")

	var input struct {
		UserID   uint  `json:"user_id" binding:"required"`
		WebinarID *uint `json:"webinar_id"`
		DryRun   bool  `json:"dry_run"` // Always true for test mode
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get workflow
	var workflow models.Workflow
	if err := ctrl.DB.Preload("Steps", func(db *gorm.DB) *gorm.DB {
		return db.Where("enabled = ?", true).Order("order_index ASC")
	}).Preload("Webinar").First(&workflow, workflowID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Workflow not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch workflow"})
		return
	}

	// Get user
	var user models.User
	if err := ctrl.DB.First(&user, input.UserID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	// Get webinar
	var webinar *models.Webinar
	if input.WebinarID != nil {
		var w models.Webinar
		if err := ctrl.DB.First(&w, *input.WebinarID).Error; err == nil {
			webinar = &w
		}
	} else if workflow.WebinarID != nil {
		var w models.Webinar
		if err := ctrl.DB.First(&w, *workflow.WebinarID).Error; err == nil {
			webinar = &w
		}
	}

	// Calculate execution plan (same as preview but with more details)
	now := time.Now()
	loc, _ := time.LoadLocation("Asia/Tehran")
	nowInLoc := now.In(loc)

	type TestStepResult struct {
		StepID          uint      `json:"step_id"`
		StepName        string    `json:"step_name"`
		OrderIndex      int       `json:"order_index"`
		ScheduledTime   time.Time `json:"scheduled_time"`
		HumanReadable   string    `json:"human_readable"`
		SegmentMatch    bool      `json:"segment_match"`
		ConditionsMatch bool      `json:"conditions_match"`
		WillExecute     bool      `json:"will_execute"`
		ActionType      string    `json:"action_type"`
		ActionPayload   string    `json:"action_payload"` // JSON string of what would be sent
		Reason          string    `json:"reason"`          // Why it will/won't execute
	}

	var testResults []TestStepResult

	for _, step := range workflow.Steps {
		// Calculate scheduled time
		scheduledTime := ctrl.calculateScheduledTimePreview(&step, workflow.TriggerType, &user, webinar, nowInLoc)

		// Check segment match
		segmentMatch := ctrl.checkSegmentMatch(&user, &step, webinar)

		// Check conditions match
		conditionsMatch := true
		if step.Conditions != nil && *step.Conditions != "" {
			conditionsMatch = ctrl.checkConditionsMatch(*step.Conditions, &user, webinar)
		}

		willExecute := segmentMatch && conditionsMatch

		// Build action payload preview
		actionPayload := "{}"
		switch step.ActionType {
		case "send_sms":
			payload := map[string]interface{}{
				"pattern_code": step.SMSPatternCode,
				"sender_line":  step.SMSSenderLine,
				"params":       step.SMSParamsJSON,
			}
			if jsonBytes, err := json.Marshal(payload); err == nil {
				actionPayload = string(jsonBytes)
			}
		// DISABLED: send_voice (Avanak) has been completely removed
		case "add_tag":
			payload := map[string]interface{}{
				"tag": step.UpdateValue,
			}
			if jsonBytes, err := json.Marshal(payload); err == nil {
				actionPayload = string(jsonBytes)
			}
		case "update_participant_field":
			payload := map[string]interface{}{
				"field": step.UpdateField,
				"value": step.UpdateValue,
			}
			if jsonBytes, err := json.Marshal(payload); err == nil {
				actionPayload = string(jsonBytes)
			}
		case "stop_other_workflows":
			payload := map[string]interface{}{
				"target_workflows": step.TargetWorkflows,
			}
			if jsonBytes, err := json.Marshal(payload); err == nil {
				actionPayload = string(jsonBytes)
			}
		}

		// Build reason
		reason := ""
		if !segmentMatch {
			reason = "User does not match target segment"
		} else if !conditionsMatch {
			reason = "Conditions not met"
		} else {
			reason = "Will execute (dry run - no actual action)"
		}

		testResults = append(testResults, TestStepResult{
			StepID:          step.ID,
			StepName:        step.Name,
			OrderIndex:      step.OrderIndex,
			ScheduledTime:   scheduledTime,
			HumanReadable:   scheduledTime.Format("2006-01-02 15:04:05"),
			SegmentMatch:    segmentMatch,
			ConditionsMatch: conditionsMatch,
			WillExecute:     willExecute,
			ActionType:      step.ActionType,
			ActionPayload:   actionPayload,
			Reason:          reason,
		})
	}

	// Calculate summary manually (avoiding generic function for compatibility)
	willExecuteCount := 0
	willSkipCount := 0
	segmentFailedCount := 0
	conditionsFailedCount := 0
	for _, r := range testResults {
		if r.WillExecute {
			willExecuteCount++
		} else {
			willSkipCount++
		}
		if !r.SegmentMatch {
			segmentFailedCount++
		}
		if r.SegmentMatch && !r.ConditionsMatch {
			conditionsFailedCount++
		}
	}

	var webinarData interface{}
	if webinar != nil {
		webinarData = map[string]interface{}{
			"id":    webinar.ID,
			"title": webinar.Title,
			"start": webinar.StartTime,
			"end":   webinar.EndTime,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"workflow": map[string]interface{}{
			"id":   workflow.ID,
			"name": workflow.Name,
		},
		"user": map[string]interface{}{
			"id":    user.ID,
			"name":  user.FirstName + " " + user.LastName,
			"phone": user.Phone,
		},
		"webinar":      webinarData,
		"dry_run":      true,
		"test_results": testResults,
		"summary": map[string]interface{}{
			"total_steps":       len(testResults),
			"will_execute":      willExecuteCount,
			"will_skip":         willSkipCount,
			"segment_failed":    segmentFailedCount,
			"conditions_failed": conditionsFailedCount,
		},
	})
}

