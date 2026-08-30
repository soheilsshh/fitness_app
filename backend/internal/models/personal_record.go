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
	ExerciseName string `gorm:"size:255;not null;index"`
	ExerciseID   *uint  `gorm:"index"`
	// MetricKind mirrors WorkoutSetLog.MetricKind: which of the three value
	// pairs below actually moved. Records are only ever compared within one kind.
	MetricKind string `gorm:"column:metric_kind;size:16;not null;default:weight;index"`
	// MuscleGroup is the canonical group (service.MuscleGroup*), copied from
	// the set log so the records screen can filter without a join.
	MuscleGroup         string    `gorm:"column:muscle_group;size:32;index"`
	WeightKg            float64   `gorm:"not null;default:0"`
	Reps                int       `gorm:"not null;default:0"`
	HoldSeconds         int       `gorm:"column:hold_seconds;not null;default:0"`
	PreviousBestKg      float64   `gorm:"not null;default:0"`
	PreviousBestReps    int       `gorm:"column:previous_best_reps;not null;default:0"`
	PreviousBestHoldSec int       `gorm:"column:previous_best_hold_sec;not null;default:0"`
	WorkoutSetLogID     uint      `gorm:"index"`
	AchievedAt          time.Time `gorm:"not null;index"`
}
