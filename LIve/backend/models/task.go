package models

import "time"

type TaskStatus string

const (
	TaskStatusBacklog    TaskStatus = "backlog"
	TaskStatusTodo       TaskStatus = "todo"
	TaskStatusInProgress TaskStatus = "in_progress"
	TaskStatusReview     TaskStatus = "review"
	TaskStatusDone       TaskStatus = "done"
	TaskStatusArchived   TaskStatus = "archived"
)

type TaskPriority string

const (
	TaskPriorityLow    TaskPriority = "low"
	TaskPriorityMedium TaskPriority = "medium"
	TaskPriorityHigh   TaskPriority = "high"
	TaskPriorityUrgent TaskPriority = "urgent"
)

type Task struct {
	ID          uint         `gorm:"primaryKey" json:"id"`
	Title       string       `gorm:"type:varchar(255);not null" json:"title"`
	Description string       `gorm:"type:text" json:"description"`
	Status      TaskStatus   `gorm:"type:varchar(50);default:'todo';index" json:"status"`
	Priority    TaskPriority `gorm:"type:varchar(50);default:'medium';index" json:"priority"`
	Tags        StringArray  `gorm:"type:json" json:"tags,omitempty"`

	AssigneeID *uint      `json:"assignee_id"`
	Assignee   *AdminUser `json:"assignee,omitempty"`

	CreatorID uint       `json:"creator_id"`
	Creator   *AdminUser `json:"creator,omitempty"`

	DueDate    *time.Time `json:"due_date"`
	BoardOrder int        `gorm:"default:0;index" json:"board_order"`

	ReviewStatus *string `gorm:"type:varchar(50)" json:"review_status,omitempty"` // "approved", "rejected", null
	ReviewNotes  *string `gorm:"type:text" json:"review_notes,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
