package models

import "time"

// TaskMessage represents a direct conversation message between a team member and managers.
type TaskMessage struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	UserID          uint       `gorm:"index;not null" json:"user_id"`
	ManagerID       *uint      `gorm:"index" json:"manager_id,omitempty"`
	SenderID        uint       `gorm:"index;not null" json:"sender_id"`
	Sender          *AdminUser `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
	TaskID          *uint      `gorm:"index" json:"task_id,omitempty"`
	Task            *Task      `gorm:"foreignKey:TaskID" json:"task,omitempty"`
	Topic           string     `gorm:"type:varchar(150)" json:"topic"`
	Body            string     `gorm:"type:text;not null" json:"body"`
	IsFromManager   bool       `gorm:"default:false" json:"is_from_manager"`
	CreatedAt       time.Time  `json:"created_at"`
	ReadByManagerAt *time.Time `json:"read_by_manager_at,omitempty"`
	ReadByUserAt    *time.Time `json:"read_by_user_at,omitempty"`
}
