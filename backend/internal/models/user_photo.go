package models

import (
	"time"

	"gorm.io/gorm"
)

type UserPhoto struct {
	gorm.Model
	UserID         uint      `gorm:"not null;index"`
	SubscriptionID uint      `gorm:"index"`
	FilePath       string    `gorm:"size:512;not null"`
	UploadedAt     time.Time `gorm:"not null"`
	Type           string    `gorm:"size:50"`
	Notes          string    `gorm:"type:text"`
	CheckInDate    *time.Time `gorm:"index"` // nil for initial registration photos, non-nil for check-in photos

	// AI progress-photo analysis (roadmap D1/BE-5.2). Observational only, never
	// diagnostic — see AnalyzeBodyPhoto's system prompt for the guardrail.
	AIAnalysisText   string `gorm:"type:text"`
	AIAnalysisStatus string `gorm:"size:20"` // "" | pending | done | failed

	// Coach review of the AI analysis (roadmap Coach-5.5).
	CoachReviewStatus string `gorm:"size:20"` // "" | pending | approved | rejected
	CoachFeedback      string `gorm:"type:text"`
}


