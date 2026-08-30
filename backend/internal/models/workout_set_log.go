package models

import (
	"time"

	"gorm.io/gorm"
)

// WorkoutSetLog records a single performed set (weight x reps) for an exercise.
// Used to compute personal records and training volume for the student.
type WorkoutSetLog struct {
	gorm.Model
	UserID           uint    `gorm:"not null;index"`
	WorkoutSessionID uint    `gorm:"index"`
	SubscriptionID   uint    `gorm:"index"`
	ExerciseName     string  `gorm:"size:255;not null"`
	ExerciseID       *uint   `gorm:"index"`
	SetNumber        int     `gorm:"not null;default:1"`
	WeightKg         float64 `gorm:"not null;default:0"`
	Reps             int     `gorm:"not null;default:0"`
	// MetricKind says what a "better" set means for this movement:
	// weight (heaviest kilo), reps (most reps at bodyweight) or hold (longest
	// isometric hold). Bodyweight movements used to be dropped entirely because
	// PRs were weight-only; see service.DetectMetricKind.
	MetricKind string `gorm:"column:metric_kind;size:16;not null;default:weight;index"`
	// MuscleGroup is the canonical group (service.MuscleGroup*). Personal
	// records are browsed by muscle group, and template/AI movements are not in
	// the catalog, so it is resolved from the name at write time.
	MuscleGroup string `gorm:"column:muscle_group;size:32;index"`
	HoldSeconds int    `gorm:"column:hold_seconds;not null;default:0"`
	// BodyweightKg is the student's bodyweight at the time of the set, so
	// calisthenics volume (reps x bodyweight) stays comparable as they lose or
	// gain weight. 0 when unknown.
	BodyweightKg float64 `gorm:"column:bodyweight_kg;not null;default:0"`
	// IsPR marks this set as a new personal record for the user+exercise+metric
	// triple, computed at write time by comparing against prior WorkoutSetLog
	// rows (roadmap BE-3.2).
	IsPR        bool      `gorm:"not null;default:false;index"`
	PerformedAt time.Time `gorm:"not null;index"`
}
