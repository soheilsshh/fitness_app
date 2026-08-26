package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// VisualWorkflow represents a node-based visual workflow
type VisualWorkflow struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"type:varchar(255);not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	IsActive    bool      `gorm:"default:false;index" json:"is_active"`
	WebinarID   *uint     `gorm:"index" json:"webinar_id"`
	Webinar     *Webinar  `gorm:"foreignKey:WebinarID" json:"webinar,omitempty"`
	Nodes       []WorkflowNode `gorm:"foreignKey:WorkflowID;constraint:OnDelete:CASCADE" json:"nodes,omitempty"`
	Connections []WorkflowConnection `gorm:"foreignKey:WorkflowID;constraint:OnDelete:CASCADE" json:"connections,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// WorkflowNode represents a single node in visual workflow
type WorkflowNode struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	WorkflowID uint      `gorm:"not null;index" json:"workflow_id"`
	NodeType   string    `gorm:"type:varchar(50);not null" json:"node_type"` // trigger, delay, condition, action
	NodeSubType string   `gorm:"type:varchar(50)" json:"node_subtype"` // send_sms, send_voice, add_tag, etc.
	Label      string    `gorm:"type:varchar(255)" json:"label"`
	PositionX  float64   `json:"position_x"`
	PositionY  float64   `json:"position_y"`
	Config     NodeConfig `gorm:"type:json" json:"config"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// WorkflowConnection represents a connection between nodes
type WorkflowConnection struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	WorkflowID    uint      `gorm:"not null;index" json:"workflow_id"`
	FromNodeID    uint      `gorm:"not null;index" json:"from_node_id"`
	ToNodeID      uint      `gorm:"not null;index" json:"to_node_id"`
	ConditionKey  string    `gorm:"type:varchar(50)" json:"condition_key"` // success, failure, true, false
	CreatedAt     time.Time `json:"created_at"`
}

// NodeConfig stores the configuration for each node type
type NodeConfig map[string]interface{}

// Scan implements sql.Scanner interface
func (nc *NodeConfig) Scan(value interface{}) error {
	if value == nil {
		*nc = make(NodeConfig)
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		*nc = make(NodeConfig)
		return nil
	}

	if len(bytes) == 0 {
		*nc = make(NodeConfig)
		return nil
	}

	return json.Unmarshal(bytes, nc)
}

// Value implements driver.Valuer interface
func (nc NodeConfig) Value() (driver.Value, error) {
	if len(nc) == 0 {
		return "{}", nil
	}
	return json.Marshal(nc)
}

// WorkflowExecution tracks the execution of a workflow for a user
type WorkflowExecution struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	WorkflowID     uint      `gorm:"not null;index" json:"workflow_id"`
	UserID         uint      `gorm:"not null;index" json:"user_id"`
	Status         string    `gorm:"type:varchar(20);not null" json:"status"` // running, completed, failed, stopped
	CurrentNodeID  *uint     `json:"current_node_id"`
	StartedAt      time.Time `gorm:"not null;index" json:"started_at"`
	CompletedAt    *time.Time `json:"completed_at"`
	ErrorMessage   *string   `gorm:"type:text" json:"error_message"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// NodeExecution tracks execution of individual nodes
type NodeExecution struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	WorkflowID      uint      `gorm:"not null;index" json:"workflow_id"`
	ExecutionID     uint      `gorm:"not null;index" json:"execution_id"`
	NodeID          uint      `gorm:"not null;index" json:"node_id"`
	UserID          uint      `gorm:"not null;index" json:"user_id"`
	Status          string    `gorm:"type:varchar(20);not null" json:"status"` // pending, running, success, failed, skipped
	ScheduledFor    *time.Time `gorm:"index" json:"scheduled_for"` // For delay nodes
	ExecutedAt      *time.Time `json:"executed_at"`
	Output          *string   `gorm:"type:text" json:"output"` // JSON output from node
	ErrorMessage    *string   `gorm:"type:text" json:"error_message"`
	NextNodeID      *uint     `json:"next_node_id"` // Which node to execute next (for branching)
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// Common node configurations

// TriggerConfig for trigger nodes
type TriggerConfig struct {
	TriggerType   string `json:"trigger_type"` // on_registration, before_webinar, after_webinar
	HoursBefore   *int   `json:"hours_before"`
	HoursAfter    *int   `json:"hours_after"`
}

// DelayConfig for delay nodes
type DelayConfig struct {
	DelayMinutes int `json:"delay_minutes"`
	DelayHours   int `json:"delay_hours"`
	DelayDays    int `json:"delay_days"`
}

// ConditionConfig for condition nodes
type ConditionConfig struct {
	ConditionType string      `json:"condition_type"` // has_joined, watch_percentage, reached_offer, purchased, has_tag
	Operator      string      `json:"operator"` // equals, greater_than, less_than, contains
	Value         interface{} `json:"value"`
}

// SMSActionConfig for SMS action nodes
type SMSActionConfig struct {
	PatternCode string            `json:"pattern_code"`
	Parameters  map[string]string `json:"parameters"`
	SenderLine  string            `json:"sender_line"`
}

// VoiceActionConfig for voice call action nodes
type VoiceActionConfig struct {
	VoiceID      string `json:"voice_id"`
	RepeatCount  int    `json:"repeat_count"`
	CallWindow   string `json:"call_window"` // e.g., "09:00-21:00"
}

// TagActionConfig for tag action nodes
type TagActionConfig struct {
	TagName string `json:"tag_name"`
	Action  string `json:"action"` // add, remove
}

// UpdateFieldConfig for update user field action nodes
type UpdateFieldConfig struct {
	FieldName  string      `json:"field_name"`
	FieldValue interface{} `json:"field_value"`
}

// StopWorkflowConfig for stop workflow action nodes
type StopWorkflowConfig struct {
	WorkflowIDs []uint `json:"workflow_ids"`
	StopAll     bool   `json:"stop_all"`
}

