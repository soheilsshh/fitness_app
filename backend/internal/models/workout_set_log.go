package models

import (
	"time"

	"gorm.io/gorm"
)

// WorkoutSetLog records a single performed set (weight x reps) for an exercise.
// Used to compute personal records and training volume for the student.
type WorkoutSetLog struct {
	gorm.Model
	UserID           uint      `gorm:"not null;index"`
	WorkoutSessionID uint      `gorm:"index"`
	SubscriptionID   uint      `gorm:"index"`
	ExerciseName     string    `gorm:"size:255;not null"`
	ExerciseID       *uint     `gorm:"index"`
	SetNumber        int       `gorm:"not null;default:1"`
	WeightKg         float64   `gorm:"not null;default:0"`
	Reps             int       `gorm:"not null;default:0"`
	PerformedAt      time.Time `gorm:"not null;index"`
}
