package models

import (
	"time"
)

// Workflow represents an automation workflow for webinar
type Workflow struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"type:varchar(255);not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	IsActive    bool           `gorm:"default:true;index" json:"is_active"`
	Version     int            `gorm:"default:1;not null" json:"version"`                   // Workflow version for tracking changes
	TriggerType string         `gorm:"type:varchar(50);not null;index" json:"trigger_type"` // on_registration, on_webinar_start, on_webinar_end
	WebinarID   *uint          `gorm:"index" json:"webinar_id"`                             // null = applies to all webinars
	Webinar     *Webinar       `gorm:"foreignKey:WebinarID" json:"webinar,omitempty"`
	Steps       []WorkflowStep `gorm:"foreignKey:WorkflowID;constraint:OnDelete:CASCADE" json:"steps,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

// WorkflowStep represents a single step in a workflow
type WorkflowStep struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	WorkflowID uint   `gorm:"not null;index" json:"workflow_id"`
	OrderIndex int    `gorm:"not null" json:"order_index"`
	Name       string `gorm:"type:varchar(255)" json:"name"` // Step name for identification
	Enabled    bool   `gorm:"default:true" json:"enabled"`   // Enable/disable step

	// WHEN: Scheduling (Enhanced)
	RunMode       string  `gorm:"type:varchar(30);default:'OFFSET_FROM_TRIGGER'" json:"run_mode"` // OFFSET_FROM_TRIGGER, OFFSET_FROM_WEBINAR_START, OFFSET_FROM_WEBINAR_END, FIXED_LOCAL_TIME
	OffsetMinutes int     `gorm:"default:0" json:"offset_minutes"`                                // For offset modes (can be negative for "before")
	FixedTime     *string `gorm:"type:varchar(10)" json:"fixed_time"`                             // For FIXED_LOCAL_TIME mode (format: "HH:mm" like "18:30")

	// Legacy fields (deprecated, kept for backward compatibility)
	ScheduleType string `gorm:"type:varchar(20);default:'delay'" json:"schedule_type"` // DEPRECATED: Use run_mode instead
	DelayMinutes int    `gorm:"default:0" json:"delay_minutes"`                        // DEPRECATED: Use offset_minutes instead
	RelativeTo   string `gorm:"type:varchar(30)" json:"relative_to"`                   // DEPRECATED: Use run_mode instead

	// WHO: Target Segment
	TargetSegment string  `gorm:"type:varchar(50);default:'all_registered'" json:"target_segment"` // all_registered, registered_not_joined, joined_less_than_X_minutes, joined_more_than_X_minutes, watched_offer_but_not_bought, buyers_full, buyers_installment, by_tag
	SegmentParams *string `gorm:"type:text" json:"segment_params"`                                 // JSON for segment-specific params (e.g., {"thresholdMinutes": 30, "tag": "hot_lead"})

	// WHO: Conditions (JSON) - Advanced filtering
	Conditions *string `gorm:"type:text" json:"conditions"` // JSON: {operator: "AND"|"OR", rules: [...]}

	// WHAT: Action
	ActionType   string  `gorm:"type:varchar(50);not null" json:"action_type"` // send_sms, send_voice, add_tag, update_participant_field, stop_other_workflows
	ActionParams *string `gorm:"type:text" json:"action_params"`               // JSON for action-specific params

	// Legacy segment support (for backward compatibility)
	SegmentType     string  `gorm:"type:varchar(50)" json:"segment_type"`
	MinWatchMinutes *int    `json:"min_watch_minutes"`
	MaxWatchMinutes *int    `json:"max_watch_minutes"`
	RequiredTag     *string `gorm:"type:varchar(100)" json:"required_tag"`

	// SMS action fields
	SMSPatternCode *string `gorm:"type:varchar(100)" json:"sms_pattern_code"`
	SMSSenderLine  *string `gorm:"type:varchar(50)" json:"sms_sender_line"`
	SMSParamsJSON  *string `gorm:"type:text" json:"sms_params_json"`

	// Voice action fields
	VoicePatternID *string `gorm:"type:varchar(100)" json:"voice_pattern_id"`

	// Update action fields
	UpdateField *string `gorm:"type:varchar(100)" json:"update_field"`
	UpdateValue *string `gorm:"type:varchar(255)" json:"update_value"`

	// Stop workflows action
	TargetWorkflows *string `gorm:"type:text" json:"target_workflows"` // JSON array of workflow IDs or "all"

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// WorkflowRun tracks each user's execution state for a workflow
type WorkflowRun struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	WorkflowID     uint       `gorm:"not null;index:idx_workflow_user" json:"workflow_id"`
	UserID         uint       `gorm:"not null;index:idx_workflow_user;index" json:"user_id"`
	Status         string     `gorm:"type:varchar(20);not null;index" json:"status"` // pending, running, completed, stopped
	CurrentStepID  *uint      `json:"current_step_id"`
	Version        int        `gorm:"not null" json:"version"` // Workflow version at runtime
	LastExecutedAt *time.Time `gorm:"index" json:"last_executed_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// WorkflowRunStep tracks execution of individual steps
type WorkflowRunStep struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	RunID        uint       `gorm:"not null;index" json:"run_id"`
	StepID       uint       `gorm:"not null;index:idx_run_step,priority:1" json:"step_id"`
	ScheduledFor time.Time  `gorm:"not null;index" json:"scheduled_for"`
	ExecutedAt   *time.Time `json:"executed_at"`
	Status       string     `gorm:"type:varchar(20);not null;index" json:"status"` // pending, success, failed, skipped
	ErrorText    *string    `gorm:"type:text" json:"error_text"`
	Output       *string    `gorm:"type:text" json:"output"` // JSON output from action (e.g., SMS response)
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// Legacy: WorkflowExecutionLog for backward compatibility
type WorkflowExecutionLog struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	WorkflowID     uint      `gorm:"not null;index" json:"workflow_id"`
	WorkflowStepID uint      `gorm:"not null;index:idx_step_participant,priority:1" json:"workflow_step_id"`
	ParticipantID  uint      `gorm:"not null;index:idx_step_participant,priority:2;index" json:"participant_id"`
	ExecutedAt     time.Time `gorm:"not null;index" json:"executed_at"`
	Status         string    `gorm:"type:varchar(20);not null" json:"status"`
	ErrorMessage   *string   `gorm:"type:text" json:"error_message"`
	CreatedAt      time.Time `json:"created_at"`
}

// WebinarParticipant extends User model with webinar-specific tracking
// This is essentially the User model with additional webinar activity fields
type WebinarParticipant struct {
	ID                uint        `gorm:"primaryKey" json:"id"`
	WebinarID         *uint       `gorm:"index" json:"webinar_id"`
	Phone             string      `gorm:"index" json:"phone"`
	FirstName         string      `json:"first_name"`
	LastName          string      `json:"last_name"`
	RegisteredAt      time.Time   `gorm:"index" json:"registered_at"`
	FirstJoinAt       *time.Time  `gorm:"index" json:"first_join_at"`
	LastLeaveAt       *time.Time  `json:"last_leave_at"`
	TotalWatchSeconds int         `gorm:"default:0" json:"total_watch_seconds"`
	CTAClickedAt      *time.Time  `json:"cta_clicked_at"`
	PurchaseStatus    string      `gorm:"type:varchar(20);default:'none';index" json:"purchase_status"` // none, installment, full
	Tags              StringArray `gorm:"type:json" json:"tags"`
	CreatedAt         time.Time   `json:"created_at"`
	UpdatedAt         time.Time   `json:"updated_at"`
}

// TableName overrides the table name for WebinarParticipant to use 'users' table
func (WebinarParticipant) TableName() string {
	return "users"
}

// StepConditions represents the condition structure for a workflow step
type StepConditions struct {
	Operator string          `json:"operator"` // AND, OR
	Rules    []ConditionRule `json:"rules"`
}

// ConditionRule represents a single condition rule
type ConditionRule struct {
	Field      string      `json:"field"`      // total_watch_minutes, purchase_status, has_tag, registered_today, joined_webinar, tags, etc.
	Comparator string      `json:"comparator"` // ==, !=, >, >=, <, <=, CONTAINS, NOT_CONTAINS, IN, NOT_IN, is_null, not_null
	Value      interface{} `json:"value"`      // Can be string, number, bool, or array (for IN/NOT_IN)
}

// SegmentParams represents parameters for target segment
type SegmentParams struct {
	ThresholdMinutes *int    `json:"threshold_minutes,omitempty"` // For joined_less_than_X_minutes, joined_more_than_X_minutes
	Tag              *string `json:"tag,omitempty"`               // For by_tag segment
}
