package workflow

import (
	"encoding/json"
	"fmt"
	"log"
	"monetizeai-backend/models"
	"monetizeai-backend/services/notification"
	"strings"
	"time"

	"gorm.io/gorm"
)

// AdvancedWorkflowExecutor is the upgraded workflow executor with proper state management
type AdvancedWorkflowExecutor struct {
	db    *gorm.DB
	sms   *notification.SmsService
	voice *notification.VoiceService
}

// NewAdvancedWorkflowExecutor creates a new advanced workflow executor
func NewAdvancedWorkflowExecutor(db *gorm.DB, sms *notification.SmsService, voice *notification.VoiceService) *AdvancedWorkflowExecutor {
	return &AdvancedWorkflowExecutor{
		db:    db,
		sms:   sms,
		voice: voice,
	}
}

// RunDueSteps executes all pending workflow run steps
func (e *AdvancedWorkflowExecutor) RunDueSteps(now time.Time) error {
	log.Printf("[WORKFLOW] Running advanced workflow executor at %s", now.Format("2006-01-02 15:04:05"))

	// Step 1: Check for new triggers and create workflow runs
	if err := e.checkTriggersAndCreateRuns(now); err != nil {
		log.Printf("[WORKFLOW] ❌ Error checking triggers: %v", err)
		// Don't return error - continue to execute pending steps
	}

	// Step 2: Execute pending run steps
	var pendingSteps []models.WorkflowRunStep
	if err := e.db.Where("status = ? AND scheduled_for <= ?", "pending", now).
		Order("scheduled_for ASC").
		Limit(100).
		Find(&pendingSteps).Error; err != nil {
		log.Printf("[WORKFLOW] ❌ Failed to fetch pending steps: %v", err)
		return err
	}

	if len(pendingSteps) == 0 {
		log.Printf("[WORKFLOW] no due workflows at this tick")
		return nil
	}

	log.Printf("[WORKFLOW] Found %d pending step(s) to execute", len(pendingSteps))

	for _, runStep := range pendingSteps {
		if err := e.executeRunStep(&runStep, now); err != nil {
			log.Printf("[WORKFLOW] ❌ Error executing run step %d: %v", runStep.ID, err)
			// Continue with other steps even if one fails
		}
	}

	return nil
}

// checkTriggersAndCreateRuns checks for workflow triggers and creates runs
func (e *AdvancedWorkflowExecutor) checkTriggersAndCreateRuns(now time.Time) error {
	// Get all active workflows
	var workflows []models.Workflow
	if err := e.db.Where("is_active = ?", true).
		Preload("Steps", func(db *gorm.DB) *gorm.DB {
			return db.Where("enabled = ?", true).Order("order_index ASC")
		}).
		Find(&workflows).Error; err != nil {
		return err
	}

	for _, workflow := range workflows {
		if err := e.checkWorkflowTrigger(&workflow, now); err != nil {
			log.Printf("❌ Error checking workflow %d trigger: %v", workflow.ID, err)
		}
	}

	return nil
}

// checkWorkflowTrigger checks if a workflow should trigger for any users
func (e *AdvancedWorkflowExecutor) checkWorkflowTrigger(workflow *models.Workflow, now time.Time) error {
	var users []models.User
	query := e.db.Model(&models.User{})

	if workflow.WebinarID != nil {
		query = query.Where("webinar_id = ?", *workflow.WebinarID)
	}

	switch workflow.TriggerType {
	case "on_registration", "on_registration_today":
		// Check users registered in last 5 minutes (or today for on_registration_today)
		if workflow.TriggerType == "on_registration_today" {
			// Today's registrations
			todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
			query = query.Where("registered_at >= ? AND registered_at <= ?", todayStart, now)
		} else {
			// Last 5 minutes
			fiveMinutesAgo := now.Add(-5 * time.Minute)
			query = query.Where("registered_at >= ? AND registered_at <= ?", fiveMinutesAgo, now)
		}

	case "before_webinar_start", "on_webinar_start":
		// Check if webinar is starting now (within 5 min window)
		var webinar models.Webinar
		if workflow.WebinarID != nil {
			if err := e.db.First(&webinar, *workflow.WebinarID).Error; err != nil {
				return err
			}
			timeDiff := now.Sub(webinar.StartTime).Minutes()
			if timeDiff < 0 || timeDiff > 5 {
				return nil // Not time yet or already passed
			}
			query = query.Where("webinar_id = ?", webinar.ID)
		}

	case "after_webinar_end", "on_webinar_end":
		// Check if webinar ended recently (within 5 min window)
		var webinar models.Webinar
		if workflow.WebinarID != nil {
			if err := e.db.First(&webinar, *workflow.WebinarID).Error; err != nil {
				return err
			}
			timeDiff := now.Sub(webinar.EndTime).Minutes()
			if timeDiff < 0 || timeDiff > 5 {
				return nil
			}
			query = query.Where("webinar_id = ?", webinar.ID)
		}

	default:
		return fmt.Errorf("unknown trigger type: %s", workflow.TriggerType)
	}

	if err := query.Find(&users).Error; err != nil {
		return err
	}

	// Create workflow runs for eligible users
	for _, user := range users {
		// Check if user already has an active run for this workflow
		var existingRun models.WorkflowRun
		err := e.db.Where("workflow_id = ? AND user_id = ? AND status IN (?)",
			workflow.ID, user.ID, []string{"pending", "running"}).
			First(&existingRun).Error

		if err == nil {
			continue // Already has active run
		}

		// Create new run
		if err := e.createWorkflowRun(workflow, &user, now); err != nil {
			log.Printf("❌ Failed to create workflow run for user %d: %v", user.ID, err)
		}
	}

	return nil
}

// createWorkflowRun creates a new workflow run and schedules its steps
func (e *AdvancedWorkflowExecutor) createWorkflowRun(workflow *models.Workflow, user *models.User, now time.Time) error {
	// Create workflow run
	run := models.WorkflowRun{
		WorkflowID: workflow.ID,
		UserID:     user.ID,
		Status:     "running",
		Version:    workflow.Version,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	if err := e.db.Create(&run).Error; err != nil {
		return err
	}

	// Get webinar for time calculations
	var webinar *models.Webinar
	if workflow.WebinarID != nil {
		var w models.Webinar
		if err := e.db.First(&w, *workflow.WebinarID).Error; err == nil {
			webinar = &w
		}
	}

	// Schedule all steps
	for _, step := range workflow.Steps {
		if !step.Enabled {
			continue
		}

		scheduledFor := e.calculateScheduledTime(&step, workflow.TriggerType, user, webinar, now)

		runStep := models.WorkflowRunStep{
			RunID:        run.ID,
			StepID:       step.ID,
			ScheduledFor: scheduledFor,
			Status:       "pending",
			CreatedAt:    now,
			UpdatedAt:    now,
		}

		if err := e.db.Create(&runStep).Error; err != nil {
			log.Printf("❌ Failed to schedule step %d: %v", step.ID, err)
		}
	}

	log.Printf("[WORKFLOW] Created workflow run %d for user %d (workflow: %s)", run.ID, user.ID, workflow.Name)
	return nil
}

// calculateScheduledTime calculates when a step should execute based on run_mode
func (e *AdvancedWorkflowExecutor) calculateScheduledTime(step *models.WorkflowStep, triggerType string, user *models.User, webinar *models.Webinar, now time.Time) time.Time {
	loc, _ := time.LoadLocation("Asia/Tehran")
	nowInLoc := now.In(loc)

	// Determine run_mode (new field takes precedence, fallback to legacy)
	runMode := step.RunMode
	if runMode == "" {
		// Backward compatibility: convert legacy schedule_type to run_mode
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

	// Get offset (new field takes precedence)
	offsetMinutes := step.OffsetMinutes
	if offsetMinutes == 0 && step.DelayMinutes != 0 {
		offsetMinutes = step.DelayMinutes // Backward compatibility
	}

	switch runMode {
	case "OFFSET_FROM_TRIGGER":
		// X minutes after trigger (registration time)
		return user.RegisteredAt.Add(time.Duration(offsetMinutes) * time.Minute)

	case "OFFSET_FROM_WEBINAR_START":
		// X minutes before/after webinar start
		if webinar != nil {
			return webinar.StartTime.Add(time.Duration(offsetMinutes) * time.Minute)
		}
		return nowInLoc

	case "OFFSET_FROM_WEBINAR_END":
		// X minutes after webinar end
		if webinar != nil {
			return webinar.EndTime.Add(time.Duration(offsetMinutes) * time.Minute)
		}
		return nowInLoc

	case "FIXED_LOCAL_TIME":
		// Fixed time in day (e.g., 18:30 Tehran time)
		if step.FixedTime == nil || *step.FixedTime == "" {
			return nowInLoc
		}

		// Parse fixed_time (format: "HH:mm")
		fixedTimeStr := *step.FixedTime
		var hour, minute int
		_, err := fmt.Sscanf(fixedTimeStr, "%d:%d", &hour, &minute)
		if err != nil {
			log.Printf("[WORKFLOW] Invalid fixed_time format '%s': %v", fixedTimeStr, err)
			return nowInLoc
		}

		// Calculate next occurrence of this time
		todayAtTime := time.Date(nowInLoc.Year(), nowInLoc.Month(), nowInLoc.Day(), hour, minute, 0, 0, loc)
		
		// If time has passed today, use tomorrow
		if nowInLoc.After(todayAtTime) {
			todayAtTime = todayAtTime.AddDate(0, 0, 1)
		}

		return todayAtTime

	default:
		log.Printf("[WORKFLOW] Unknown run_mode '%s', using now", runMode)
		return nowInLoc
	}
}

// executeRunStep executes a single workflow run step
func (e *AdvancedWorkflowExecutor) executeRunStep(runStep *models.WorkflowRunStep, now time.Time) error {
	// Get step details
	var step models.WorkflowStep
	if err := e.db.First(&step, runStep.StepID).Error; err != nil {
		return e.failRunStep(runStep, fmt.Sprintf("Step not found: %v", err))
	}

	// Get run details
	var run models.WorkflowRun
	if err := e.db.First(&run, runStep.RunID).Error; err != nil {
		return e.failRunStep(runStep, fmt.Sprintf("Run not found: %v", err))
	}

	// Check if run is still active
	if run.Status != "running" {
		runStep.Status = "skipped"
		runStep.ErrorText = stringPtr("Run is not active")
		e.db.Save(runStep)
		return nil
	}

	// Get workflow
	var workflow models.Workflow
	if err := e.db.First(&workflow, run.WorkflowID).Error; err != nil {
		return e.failRunStep(runStep, fmt.Sprintf("Workflow not found: %v", err))
	}

	// Get user
	var user models.User
	if err := e.db.First(&user, run.UserID).Error; err != nil {
		return e.failRunStep(runStep, fmt.Sprintf("User not found: %v", err))
	}

	// Get webinar if needed
	var webinar *models.Webinar
	if workflow.WebinarID != nil {
		var w models.Webinar
		if err := e.db.First(&w, *workflow.WebinarID).Error; err == nil {
			webinar = &w
		}
	}

	// Check target segment
	if !e.userMatchesTargetSegment(&user, &step, webinar) {
		runStep.Status = "skipped"
		runStep.ErrorText = stringPtr("User does not match target segment")
		runStep.ExecutedAt = &now
		e.db.Save(runStep)
		log.Printf("[WORKFLOW] Step %d skipped for user %d (segment mismatch)", step.ID, user.ID)
		return nil
	}

	// Evaluate conditions (advanced filtering)
	if step.Conditions != nil && *step.Conditions != "" {
		passed, err := e.evaluateConditions(*step.Conditions, &user, webinar)
		if err != nil {
			return e.failRunStep(runStep, fmt.Sprintf("Condition evaluation error: %v", err))
		}
		if !passed {
			runStep.Status = "skipped"
			runStep.ErrorText = stringPtr("Conditions not met")
			runStep.ExecutedAt = &now
			e.db.Save(runStep)
			log.Printf("[WORKFLOW] Step %d skipped for user %d (conditions not met)", step.ID, user.ID)
			return nil
		}
	}

	// Execute action
	output, err := e.executeAction(&step, &user)
	if err != nil {
		return e.failRunStep(runStep, err.Error())
	}

	// Mark as success
	runStep.Status = "success"
	runStep.ExecutedAt = &now
	if output != "" {
		runStep.Output = &output
	}
	e.db.Save(runStep)

	// Update run last_executed_at
	e.db.Model(&run).Update("last_executed_at", now)

	log.Printf("[WORKFLOW] running workflow %d for user %d, step %d (%s)", run.WorkflowID, user.ID, step.ID, step.Name)

	// Check if this was the last step
	var pendingCount int64
	e.db.Model(&models.WorkflowRunStep{}).
		Where("run_id = ? AND status = ?", run.ID, "pending").
		Count(&pendingCount)

	if pendingCount == 0 {
		// Mark run as completed
		e.db.Model(&run).Updates(map[string]interface{}{
			"status":     "completed",
			"updated_at": now,
		})
		log.Printf("[WORKFLOW] Workflow run %d completed for user %d", run.ID, user.ID)
	}

	return nil
}

// userMatchesTargetSegment checks if user matches the step's target segment
func (e *AdvancedWorkflowExecutor) userMatchesTargetSegment(user *models.User, step *models.WorkflowStep, webinar *models.Webinar) bool {
	targetSegment := step.TargetSegment
	if targetSegment == "" {
		// Backward compatibility: use legacy segment_type
		targetSegment = step.SegmentType
		if targetSegment == "" {
			targetSegment = "all_registered"
		}
	}

	switch targetSegment {
	case "all_registered":
		return true

	case "registered_not_joined":
		return user.FirstJoinAt == nil

	case "joined_less_than_X_minutes":
		if user.FirstJoinAt == nil {
			return false
		}
		watchMinutes := user.TotalWatchSeconds / 60
		// Parse threshold from segment_params or use legacy max_watch_minutes
		threshold := 30 // default
		if step.SegmentParams != nil && *step.SegmentParams != "" {
			var params models.SegmentParams
			if err := json.Unmarshal([]byte(*step.SegmentParams), &params); err == nil && params.ThresholdMinutes != nil {
				threshold = *params.ThresholdMinutes
			}
		} else if step.MaxWatchMinutes != nil {
			threshold = *step.MaxWatchMinutes
		}
		return watchMinutes < threshold

	case "joined_more_than_X_minutes":
		if user.FirstJoinAt == nil {
			return false
		}
		watchMinutes := user.TotalWatchSeconds / 60
		threshold := 10 // default
		if step.SegmentParams != nil && *step.SegmentParams != "" {
			var params models.SegmentParams
			if err := json.Unmarshal([]byte(*step.SegmentParams), &params); err == nil && params.ThresholdMinutes != nil {
				threshold = *params.ThresholdMinutes
			}
		} else if step.MinWatchMinutes != nil {
			threshold = *step.MinWatchMinutes
		}
		return watchMinutes >= threshold

	case "watched_offer_but_not_bought":
		if user.FirstJoinAt == nil || user.PurchaseStatus != "none" {
			return false
		}
		// User clicked CTA or watched significant amount
		return user.CTAClickedAt != nil || (user.TotalWatchSeconds/60) >= 30

	case "buyers_full":
		return user.PurchaseStatus == "full"

	case "buyers_installment":
		return user.PurchaseStatus == "installment"

	case "by_tag":
		tagName := ""
		if step.SegmentParams != nil && *step.SegmentParams != "" {
			var params models.SegmentParams
			if err := json.Unmarshal([]byte(*step.SegmentParams), &params); err == nil && params.Tag != nil {
				tagName = *params.Tag
			}
		}
		if tagName == "" && step.RequiredTag != nil {
			tagName = *step.RequiredTag
		}
		if tagName == "" {
			return false
		}
		for _, tag := range user.Tags {
			if tag == tagName {
				return true
			}
		}
		return false

	default:
		// Legacy segment types for backward compatibility
		return e.userMatchesLegacySegment(user, step, webinar)
	}
}

// userMatchesLegacySegment checks legacy segment types
func (e *AdvancedWorkflowExecutor) userMatchesLegacySegment(user *models.User, step *models.WorkflowStep, webinar *models.Webinar) bool {
	switch step.SegmentType {
	case "not_attended":
		return user.FirstJoinAt == nil
	case "left_early":
		if user.FirstJoinAt == nil {
			return false
		}
		watchMinutes := user.TotalWatchSeconds / 60
		if step.MaxWatchMinutes != nil && watchMinutes <= *step.MaxWatchMinutes {
			return true
		}
		return false
	case "attended_not_bought":
		return user.FirstJoinAt != nil && user.PurchaseStatus == "none"
	case "watched_to_offer_not_bought":
		if user.FirstJoinAt == nil || user.PurchaseStatus != "none" {
			return false
		}
		watchMinutes := user.TotalWatchSeconds / 60
		if step.MinWatchMinutes != nil && watchMinutes >= *step.MinWatchMinutes {
			return true
		}
		return false
	case "buyers_installment":
		return user.PurchaseStatus == "installment"
	case "buyers_full":
		return user.PurchaseStatus == "full"
	case "custom_by_tag":
		if step.RequiredTag != nil && *step.RequiredTag != "" {
			for _, tag := range user.Tags {
				if tag == *step.RequiredTag {
					return true
				}
			}
		}
		return false
	default:
		return true // Default to all_registered
	}
}

// evaluateConditions evaluates step conditions
func (e *AdvancedWorkflowExecutor) evaluateConditions(conditionsJSON string, user *models.User, webinar *models.Webinar) (bool, error) {
	var conditions models.StepConditions
	if err := json.Unmarshal([]byte(conditionsJSON), &conditions); err != nil {
		return false, err
	}

	if len(conditions.Rules) == 0 {
		return true, nil
	}

	results := make([]bool, len(conditions.Rules))
	for i, rule := range conditions.Rules {
		results[i] = e.evaluateRule(&rule, user, webinar)
	}

	// Apply operator
	if conditions.Operator == "OR" {
		for _, result := range results {
			if result {
				return true, nil
			}
		}
		return false, nil
	}

	// Default: AND
	for _, result := range results {
		if !result {
			return false, nil
		}
	}
	return true, nil
}

// evaluateRule evaluates a single condition rule
func (e *AdvancedWorkflowExecutor) evaluateRule(rule *models.ConditionRule, user *models.User, webinar *models.Webinar) bool {
	switch rule.Field {
	case "total_watch_minutes", "watch_minutes":
		watchMinutes := float64(user.TotalWatchSeconds) / 60.0
		return e.compareValues(watchMinutes, rule.Comparator, rule.Value)

	case "joined_webinar", "joined_at":
		if rule.Comparator == "is_null" || rule.Comparator == "==" {
			return user.FirstJoinAt == nil
		} else if rule.Comparator == "not_null" || rule.Comparator == "!=" {
			return user.FirstJoinAt != nil
		}
		// For date comparisons
		if user.FirstJoinAt != nil {
			return e.compareValues(user.FirstJoinAt.Unix(), rule.Comparator, rule.Value)
		}
		return false

	case "purchase_status":
		return e.compareValues(user.PurchaseStatus, rule.Comparator, rule.Value)

	case "has_tag", "tags":
		tagName, ok := rule.Value.(string)
		if !ok {
			// Try array for IN/NOT_IN
			if tagArray, ok := rule.Value.([]interface{}); ok {
				for _, tag := range user.Tags {
					for _, v := range tagArray {
						if tag == fmt.Sprintf("%v", v) {
							return rule.Comparator != "NOT_IN"
						}
					}
				}
				return rule.Comparator == "NOT_IN"
			}
			return false
		}
		for _, tag := range user.Tags {
			if tag == tagName {
				return rule.Comparator != "!=" && rule.Comparator != "NOT_CONTAINS"
			}
		}
		return rule.Comparator == "!=" || rule.Comparator == "NOT_CONTAINS"

	case "registered_today", "registered_at":
		if rule.Field == "registered_today" {
			// Check if registered today
			today := time.Now().In(time.FixedZone("Asia/Tehran", 3*3600+30*60))
			todayStart := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())
			todayEnd := todayStart.AddDate(0, 0, 1)
			registered := user.RegisteredAt.In(today.Location())
			return registered.After(todayStart) && registered.Before(todayEnd)
		}
		// Compare dates
		if valueStr, ok := rule.Value.(string); ok {
			valueTime, err := time.Parse(time.RFC3339, valueStr)
			if err == nil {
				return e.compareValues(user.RegisteredAt.Unix(), rule.Comparator, valueTime.Unix())
			}
		}
		return false

	case "cta_clicked":
		if rule.Comparator == "is_null" || rule.Comparator == "==" {
			return user.CTAClickedAt == nil
		} else if rule.Comparator == "not_null" || rule.Comparator == "!=" {
			return user.CTAClickedAt != nil
		}
		return false

	default:
		return false
	}
}

// compareValues compares two values based on comparator
func (e *AdvancedWorkflowExecutor) compareValues(actual interface{}, comparator string, expected interface{}) bool {
	switch comparator {
	case "=", "==", "equals":
		return fmt.Sprintf("%v", actual) == fmt.Sprintf("%v", expected)
	case "!=", "not_equals":
		return fmt.Sprintf("%v", actual) != fmt.Sprintf("%v", expected)
	case ">", "greater_than":
		return e.compareNumeric(actual, expected, ">")
	case ">=", "greater_than_or_equal":
		return e.compareNumeric(actual, expected, ">=")
	case "<", "less_than":
		return e.compareNumeric(actual, expected, "<")
	case "<=", "less_than_or_equal":
		return e.compareNumeric(actual, expected, "<=")
	case "CONTAINS", "contains":
		return strings.Contains(fmt.Sprintf("%v", actual), fmt.Sprintf("%v", expected))
	case "NOT_CONTAINS", "not_contains":
		return !strings.Contains(fmt.Sprintf("%v", actual), fmt.Sprintf("%v", expected))
	case "IN", "in":
		// Check if actual value is in expected array
		if expectedArray, ok := expected.([]interface{}); ok {
			actualStr := fmt.Sprintf("%v", actual)
			for _, v := range expectedArray {
				if actualStr == fmt.Sprintf("%v", v) {
					return true
				}
			}
		}
		return false
	case "NOT_IN", "not_in":
		// Check if actual value is NOT in expected array
		if expectedArray, ok := expected.([]interface{}); ok {
			actualStr := fmt.Sprintf("%v", actual)
			for _, v := range expectedArray {
				if actualStr == fmt.Sprintf("%v", v) {
					return false
				}
			}
		}
		return true
	default:
		return false
	}
}

// compareNumeric compares numeric values
func (e *AdvancedWorkflowExecutor) compareNumeric(actual interface{}, expected interface{}, op string) bool {
	var actualFloat, expectedFloat float64

	switch v := actual.(type) {
	case float64:
		actualFloat = v
	case int:
		actualFloat = float64(v)
	case int64:
		actualFloat = float64(v)
	default:
		return false
	}

	switch v := expected.(type) {
	case float64:
		expectedFloat = v
	case int:
		expectedFloat = float64(v)
	case int64:
		expectedFloat = float64(v)
	default:
		return false
	}

	switch op {
	case ">":
		return actualFloat > expectedFloat
	case ">=":
		return actualFloat >= expectedFloat
	case "<":
		return actualFloat < expectedFloat
	case "<=":
		return actualFloat <= expectedFloat
	default:
		return false
	}
}

// executeAction executes a step action
func (e *AdvancedWorkflowExecutor) executeAction(step *models.WorkflowStep, user *models.User) (string, error) {
	switch step.ActionType {
	case "send_sms":
		return e.executeSMSAction(step, user)
	// DISABLED: send_voice (Avanak) has been completely removed
	case "add_tag":
		return e.executeAddTagAction(step, user)
	case "update_participant_field":
		return e.executeUpdateFieldAction(step, user)
	case "stop_other_workflows":
		return e.executeStopWorkflowsAction(step, user)
	default:
		return "", fmt.Errorf("unknown action type: %s", step.ActionType)
	}
}

// executeSMSAction sends an SMS
func (e *AdvancedWorkflowExecutor) executeSMSAction(step *models.WorkflowStep, user *models.User) (string, error) {
	if step.SMSPatternCode == nil {
		return "", fmt.Errorf("SMS pattern code is required")
	}

	params := make(map[string]string)
	if step.SMSParamsJSON != nil && *step.SMSParamsJSON != "" {
		if err := json.Unmarshal([]byte(*step.SMSParamsJSON), &params); err != nil {
			return "", fmt.Errorf("failed to parse SMS params: %v", err)
		}
	}

	// Replace placeholders
	for key, value := range params {
		value = strings.ReplaceAll(value, "{{first_name}}", user.FirstName)
		value = strings.ReplaceAll(value, "{{last_name}}", user.LastName)
		value = strings.ReplaceAll(value, "{{phone}}", user.Phone)
		params[key] = value
	}

	if err := e.sms.SendWorkflowPattern(user.Phone, *step.SMSPatternCode, params); err != nil {
		return "", err
	}

	output := map[string]interface{}{
		"action": "send_sms",
		"phone":  user.Phone,
		"pattern": *step.SMSPatternCode,
	}
	outputJSON, _ := json.Marshal(output)
	return string(outputJSON), nil
}

// executeVoiceAction sends a voice call
func (e *AdvancedWorkflowExecutor) executeVoiceAction(step *models.WorkflowStep, user *models.User) (string, error) {
	if step.VoicePatternID == nil {
		return "", fmt.Errorf("voice pattern ID is required")
	}

	if err := e.voice.SendWorkflowPattern(user.Phone, *step.VoicePatternID, nil); err != nil {
		return "", err
	}

	output := map[string]interface{}{
		"action": "send_voice",
		"phone":  user.Phone,
		"voice_id": *step.VoicePatternID,
	}
	outputJSON, _ := json.Marshal(output)
	return string(outputJSON), nil
}

// executeAddTagAction adds a tag to user
func (e *AdvancedWorkflowExecutor) executeAddTagAction(step *models.WorkflowStep, user *models.User) (string, error) {
	if step.UpdateValue == nil {
		return "", fmt.Errorf("tag name is required")
	}

	tagName := *step.UpdateValue

	// Check if tag already exists
	for _, tag := range user.Tags {
		if tag == tagName {
			return fmt.Sprintf(`{"action":"add_tag","tag":"%s","already_exists":true}`, tagName), nil
		}
	}

	user.Tags = append(user.Tags, tagName)
	if err := e.db.Model(user).Update("tags", user.Tags).Error; err != nil {
		return "", err
	}

	return fmt.Sprintf(`{"action":"add_tag","tag":"%s"}`, tagName), nil
}

// executeUpdateFieldAction updates a user field
func (e *AdvancedWorkflowExecutor) executeUpdateFieldAction(step *models.WorkflowStep, user *models.User) (string, error) {
	if step.UpdateField == nil || step.UpdateValue == nil {
		return "", fmt.Errorf("update field and value are required")
	}

	if err := e.db.Model(user).Update(*step.UpdateField, *step.UpdateValue).Error; err != nil {
		return "", err
	}

	return fmt.Sprintf(`{"action":"update_field","field":"%s","value":"%s"}`, *step.UpdateField, *step.UpdateValue), nil
}

// executeStopWorkflowsAction stops other workflows for this user
func (e *AdvancedWorkflowExecutor) executeStopWorkflowsAction(step *models.WorkflowStep, user *models.User) (string, error) {
	query := e.db.Model(&models.WorkflowRun{}).
		Where("user_id = ? AND status IN (?)", user.ID, []string{"pending", "running"})

	if step.TargetWorkflows != nil && *step.TargetWorkflows != "" && *step.TargetWorkflows != "all" {
		var workflowIDs []uint
		if err := json.Unmarshal([]byte(*step.TargetWorkflows), &workflowIDs); err == nil && len(workflowIDs) > 0 {
			query = query.Where("workflow_id IN (?)", workflowIDs)
		}
	}

	result := query.Update("status", "stopped")
	if result.Error != nil {
		return "", result.Error
	}

	return fmt.Sprintf(`{"action":"stop_workflows","count":%d}`, result.RowsAffected), nil
}

// failRunStep marks a run step as failed
func (e *AdvancedWorkflowExecutor) failRunStep(runStep *models.WorkflowRunStep, errorMsg string) error {
	now := time.Now()
	runStep.Status = "failed"
	runStep.ErrorText = &errorMsg
	runStep.ExecutedAt = &now
	e.db.Save(runStep)
	log.Printf("[WORKFLOW] Step %d failed for run %d: %s", runStep.StepID, runStep.RunID, errorMsg)
	return fmt.Errorf("%s", errorMsg)
}

// Helper function
func stringPtr(s string) *string {
	return &s
}

