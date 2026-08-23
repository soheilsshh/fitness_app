package models

import (
	"time"

	"gorm.io/gorm"
)

// PersonalRecord is an append-only history of "new PR" events, one row per
// exercise per time the user beat their own previous best weight. This is a
// purpose-built read model on top of WorkoutSetLog.IsPR (which only flags the
// set inline) so a per-exercise PR timeline can be listed without scanning
// every set log.
type PersonalRecord struct {
	gorm.Model
	UserID uint `gorm:"not null;index"`
	// ExerciseName is normalized lower-case/trimmed at write time to match the
	// grouping key already used by markPersonalRecords in workout_history_service.go.
	ExerciseName    string  `gorm:"size:255;not null;index"`
	ExerciseID      *uint   `gorm:"index"`
	WeightKg        float64 `gorm:"not null;default:0"`
	Reps            int     `gorm:"not null;default:0"`
	PreviousBestKg  float64 `gorm:"not null;default:0"`
	WorkoutSetLogID uint    `gorm:"index"`
	AchievedAt      time.Time `gorm:"not null;index"`
}
