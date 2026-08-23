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
	// EffortRPE (1-10, rate of perceived exertion), FeelingAfter and
	// SatisfactionRating (1-5) are self-reported after a session and feed the
	// AI deep-dive analysis (roadmap C2 / BE-3.1). 0 means "not reported".
	EffortRPE          int    `gorm:"not null;default:0"`
	FeelingAfter       string `gorm:"size:20"` // great|good|ok|tired|exhausted
	SatisfactionRating int    `gorm:"not null;default:0"`
	// The fields below are the optional post-workout micro-survey shown after
	// the first session logged in a day. All are nullable/blank when skipped.
	FavoriteExercises      string `gorm:"type:text"` // JSON array of exercise names, max 2
	PainArea               string `gorm:"size:20"`   // shoulder|elbow_wrist|lower_back|hip_glute|knee|ankle_calf|none
	PainNote               string `gorm:"type:text"`
	DurationEstimateMinutes int   `gorm:"not null;default:0"` // 30|45|60|75|90
	VoiceNoteText          string `gorm:"type:text"`          // AI-cleaned transcript of an optional voice note
	CompletedAt            time.Time `gorm:"not null;index"`
}
