package models

import (
	"time"

	"gorm.io/gorm"
)

// Ticket is a simple student->coach support thread.
// It stores the initial message on the ticket row to keep it lightweight.
type Ticket struct {
	gorm.Model

	StudentID uint `gorm:"index;not null"`
	CoachID   uint `gorm:"index;not null"`

	Title    string `gorm:"size:255;not null"`
	Priority string `gorm:"size:20;not null;default:normal"` // low | normal | high

	Status string `gorm:"size:30;not null;default:pending"` // pending | in_review | answered | closed

	Message string `gorm:"type:text;not null"`

	Answer     string     `gorm:"type:text"`
	AnsweredAt *time.Time `gorm:"index"`
}
