package models

import (
	"time"

	"gorm.io/gorm"
)

// WorkoutSession records a completed workout day by a student.
type WorkoutSession struct {
	gorm.Model
	UserID           uint      `gorm:"not null;index"`
	SubscriptionID   uint      `gorm:"not null;index"`
	WorkoutProgramID uint      `gorm:"index"`
	ProgramTitle     string    `gorm:"size:255"`
	DayKey           string    `gorm:"size:10;not null;index"`
	DayLabel         string    `gorm:"size:50"`
	ExerciseCount    int       `gorm:"not null;default:0"`
	DurationMin      int       `gorm:"not null;default:0"`
	Notes            string    `gorm:"type:text"`
	CompletedAt      time.Time `gorm:"not null;index"`
}
