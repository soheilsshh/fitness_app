package notification

import (
	"encoding/json"
	"fmt"
	"log"
	"monetizeai-backend/models"
	"strings"
	"time"

	"gorm.io/gorm"
)

// WorkflowExecutor executes workflow steps
type WorkflowExecutor struct {
	db    *gorm.DB
	sms   *SmsService
	voice *VoiceService
}

// NewWorkflowExecutor creates a new workflow executor
func NewWorkflowExecutor(db *gorm.DB, sms *SmsService, voice *VoiceService) *WorkflowExecutor {
	return &WorkflowExecutor{
		db:    db,
		sms:   sms,
		voice: voice,
	}
}

// RunDueSteps executes all workflow steps that are due
func (e *WorkflowExecutor) RunDueSteps(now time.Time) error {
	log.Printf("🔄 Running workflow executor at %s", now.Format("2006-01-02 15:04:05"))

	// Get all active workflows
	var workflows []models.Workflow
	if err := e.db.Where("is_active = ?", true).Preload("Steps").Find(&workflows).Error; err != nil {
		log.Printf("❌ Failed to fetch active workflows: %v", err)
		return err
	}

	if len(workflows) == 0 {
		log.Printf("ℹ️  No active workflows found")
		return nil
	}

	log.Printf("📋 Found %d active workflow(s)", len(workflows))

	for _, workflow := range workflows {
		if err := e.processWorkflow(workflow, now); err != nil {
			log.Printf("❌ Error processing workflow %d (%s): %v", workflow.ID, workflow.Name, err)
			// Continue with other workflows even if one fails
		}
	}

	return nil
}

// processWorkflow processes a single workflow
func (e *WorkflowExecutor) processWorkflow(workflow models.Workflow, now time.Time) error {
	log.Printf("⚙️  Processing workflow: %s (ID: %d, Trigger: %s)", workflow.Name, workflow.ID, workflow.TriggerType)

	// Get participants based on workflow's webinar_id
	var participants []models.User
	query := e.db.Model(&models.User{})
	
	if workflow.WebinarID != nil {
		query = query.Where("webinar_id = ?", *workflow.WebinarID)
	}
	
	if err := query.Find(&participants).Error; err != nil {
		log.Printf("❌ Failed to fetch participants for workflow %d: %v", workflow.ID, err)
		return err
	}

	if len(participants) == 0 {
		log.Printf("ℹ️  No participants found for workflow %d", workflow.ID)
		return nil
	}

	log.Printf("👥 Found %d participant(s) for workflow %d", len(participants), workflow.ID)

	// Get webinar if specified
	var webinar *models.Webinar
	if workflow.WebinarID != nil {
		var w models.Webinar
		if err := e.db.First(&w, *workflow.WebinarID).Error; err != nil {
			log.Printf("❌ Failed to fetch webinar %d: %v", *workflow.WebinarID, err)
			return err
		}
		webinar = &w
	}

	// Process each step
	for _, step := range workflow.Steps {
		if err := e.processStep(workflow, step, participants, webinar, now); err != nil {
			log.Printf("❌ Error processing step %d of workflow %d: %v", step.ID, workflow.ID, err)
			// Continue with other steps
		}
	}

	return nil
}

// processStep processes a single workflow step for all participants
func (e *WorkflowExecutor) processStep(workflow models.Workflow, step models.WorkflowStep, participants []models.User, webinar *models.Webinar, now time.Time) error {
	log.Printf("  📍 Processing step %d (Order: %d, Action: %s, Segment: %s)", step.ID, step.OrderIndex, step.ActionType, step.SegmentType)

	executedCount := 0
	skippedCount := 0

	for _, participant := range participants {
		// Calculate trigger time for this participant
		triggerTime := e.calculateTriggerTime(workflow.TriggerType, participant, webinar)
		if triggerTime.IsZero() {
			continue
		}

		// Calculate scheduled time for this step
		scheduledTime := triggerTime.Add(time.Duration(step.DelayMinutes) * time.Minute)

		// Check if step is due
		if scheduledTime.After(now) {
			continue // Not yet time for this step
		}

		// Check if already executed
		var existingLog models.WorkflowExecutionLog
		err := e.db.Where("workflow_step_id = ? AND participant_id = ?", step.ID, participant.ID).First(&existingLog).Error
		if err == nil {
			// Already executed
			continue
		}

		// Check if participant matches segment
		if !e.participantMatchesStepSegment(&participant, &step, webinar) {
			skippedCount++
			continue
		}

		// Execute the step action
		if err := e.executeStepAction(&step, &participant, webinar); err != nil {
			// Log failed execution
			errorMsg := err.Error()
			e.db.Create(&models.WorkflowExecutionLog{
				WorkflowID:     workflow.ID,
				WorkflowStepID: step.ID,
				ParticipantID:  participant.ID,
				ExecutedAt:     now,
				Status:         "failed",
				ErrorMessage:   &errorMsg,
			})
			log.Printf("    ❌ Failed to execute step %d for participant %d (%s): %v", step.ID, participant.ID, participant.Phone, err)
			continue
		}

		// Log successful execution
		e.db.Create(&models.WorkflowExecutionLog{
			WorkflowID:     workflow.ID,
			WorkflowStepID: step.ID,
			ParticipantID:  participant.ID,
			ExecutedAt:     now,
			Status:         "success",
		})
		executedCount++
		log.Printf("    ✅ Executed step %d for participant %d (%s)", step.ID, participant.ID, participant.Phone)
	}

	if executedCount > 0 || skippedCount > 0 {
		log.Printf("  📊 Step %d results: %d executed, %d skipped", step.ID, executedCount, skippedCount)
	}

	return nil
}

// calculateTriggerTime calculates the trigger time for a participant based on workflow trigger type
func (e *WorkflowExecutor) calculateTriggerTime(triggerType string, participant models.User, webinar *models.Webinar) time.Time {
	switch triggerType {
	case "on_registration":
		return participant.RegisteredAt
	case "before_webinar", "after_webinar":
		if webinar == nil {
			return time.Time{}
		}
		if triggerType == "before_webinar" {
			return webinar.StartTime
		}
		return webinar.EndTime
	default:
		return time.Time{}
	}
}

// participantMatchesStepSegment checks if a participant matches the step's segment criteria
func (e *WorkflowExecutor) participantMatchesStepSegment(p *models.User, step *models.WorkflowStep, webinar *models.Webinar) bool {
	switch step.SegmentType {
	case "all_registered":
		return true

	case "not_attended":
		return p.FirstJoinAt == nil

	case "left_early":
		if p.FirstJoinAt == nil {
			return false
		}
		watchMinutes := p.TotalWatchSeconds / 60
		if step.MaxWatchMinutes != nil && watchMinutes <= *step.MaxWatchMinutes {
			return true
		}
		return false

	case "attended_not_bought":
		return p.FirstJoinAt != nil && p.PurchaseStatus == "none"

	case "watched_to_offer_not_bought":
		watchMinutes := p.TotalWatchSeconds / 60
		if step.MinWatchMinutes != nil && watchMinutes >= *step.MinWatchMinutes && p.PurchaseStatus == "none" {
			return true
		}
		return false

	case "buyers_installment":
		return p.PurchaseStatus == "installment"

	case "buyers_full":
		return p.PurchaseStatus == "full"

	case "custom_by_tag":
		if step.RequiredTag == nil {
			return false
		}
		for _, tag := range p.Tags {
			if tag == *step.RequiredTag {
				return true
			}
		}
		return false

	default:
		return false
	}
}

// executeStepAction executes the action for a workflow step
func (e *WorkflowExecutor) executeStepAction(step *models.WorkflowStep, participant *models.User, webinar *models.Webinar) error {
	switch step.ActionType {
	case "send_sms":
		return e.executeSMSAction(step, participant, webinar)
	// DISABLED: send_voice (Avanak) has been completely removed
	case "add_tag":
		return e.executeAddTagAction(step, participant)
	case "update_participant_field":
		return e.executeUpdateFieldAction(step, participant)
	case "stop_other_workflows":
		// For now, just log it - can be implemented later if needed
		log.Printf("    ℹ️  Stop other workflows action triggered for participant %d", participant.ID)
		return nil
	default:
		return fmt.Errorf("unknown action type: %s", step.ActionType)
	}
}

// executeSMSAction sends an SMS
func (e *WorkflowExecutor) executeSMSAction(step *models.WorkflowStep, participant *models.User, webinar *models.Webinar) error {
	if step.SMSPatternCode == nil {
		return fmt.Errorf("SMS pattern code is required")
	}

	// Parse SMS params JSON
	params := make(map[string]string)
	if step.SMSParamsJSON != nil && *step.SMSParamsJSON != "" {
		if err := json.Unmarshal([]byte(*step.SMSParamsJSON), &params); err != nil {
			return fmt.Errorf("failed to parse SMS params JSON: %v", err)
		}
	}

	// Replace placeholders
	params = e.replacePlaceholders(params, participant, webinar)

	return e.sms.SendWorkflowPattern(participant.Phone, *step.SMSPatternCode, params)
}

// executeVoiceAction sends a voice call
func (e *WorkflowExecutor) executeVoiceAction(step *models.WorkflowStep, participant *models.User, webinar *models.Webinar) error {
	if step.VoicePatternID == nil {
		return fmt.Errorf("voice pattern ID is required")
	}

	// Voice calls don't typically support dynamic parameters in Avanak
	params := make(map[string]string)
	return e.voice.SendWorkflowPattern(participant.Phone, *step.VoicePatternID, params)
}

// executeAddTagAction adds a tag to a participant
func (e *WorkflowExecutor) executeAddTagAction(step *models.WorkflowStep, participant *models.User) error {
	if step.UpdateValue == nil {
		return fmt.Errorf("update value (tag) is required")
	}

	tag := *step.UpdateValue
	
	// Check if tag already exists
	for _, existingTag := range participant.Tags {
		if existingTag == tag {
			return nil // Tag already exists
		}
	}

	// Add tag
	participant.Tags = append(participant.Tags, tag)
	return e.db.Model(participant).Update("tags", participant.Tags).Error
}

// executeUpdateFieldAction updates a participant field
func (e *WorkflowExecutor) executeUpdateFieldAction(step *models.WorkflowStep, participant *models.User) error {
	if step.UpdateField == nil || step.UpdateValue == nil {
		return fmt.Errorf("update field and value are required")
	}

	field := *step.UpdateField
	value := *step.UpdateValue

	// Update the specified field
	return e.db.Model(participant).Update(field, value).Error
}

// replacePlaceholders replaces placeholders in SMS params
func (e *WorkflowExecutor) replacePlaceholders(params map[string]string, participant *models.User, webinar *models.Webinar) map[string]string {
	result := make(map[string]string)
	
	for key, value := range params {
		// Replace participant placeholders
		value = strings.ReplaceAll(value, "{{first_name}}", participant.FirstName)
		value = strings.ReplaceAll(value, "{{last_name}}", participant.LastName)
		value = strings.ReplaceAll(value, "{{phone}}", participant.Phone)
		
		// Replace webinar placeholders
		if webinar != nil {
			value = strings.ReplaceAll(value, "{{webinar_title}}", webinar.Title)
			value = strings.ReplaceAll(value, "{{webinar_start_time}}", webinar.StartTime.Format("2006-01-02 15:04"))
			value = strings.ReplaceAll(value, "{{webinar_end_time}}", webinar.EndTime.Format("2006-01-02 15:04"))
		}
		
		// Add more placeholders as needed
		// {{cta_link}} can be added from system config if available
		
		result[key] = value
	}
	
	return result
}

