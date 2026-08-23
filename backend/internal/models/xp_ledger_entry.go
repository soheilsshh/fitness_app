package models

import "gorm.io/gorm"

// XP categories — each has its own daily anti-spam cap (see gamification_service.go).
const (
	XPCategoryWorkout             = "workout"
	XPCategoryNutrition           = "nutrition"
	XPCategoryTracking            = "tracking"
	XPCategoryAI                  = "ai"
	XPCategoryAIChat              = "ai_chat"
	XPCategoryCommunityEngagement = "community_engagement" // likes/comments
	XPCategoryContentView         = "content_view"
)

// XPLedgerEntry is one XP grant — the source of truth for the leaderboard
// (period aggregation) and for enforcing per-category daily caps. Unlike
// UserAchievement (milestone medals, unbounded), every row here already
// reflects the anti-spam cap: the amount actually awarded, not requested.
type XPLedgerEntry struct {
	gorm.Model
	UserID       uint   `gorm:"not null;index"`
	Category     string `gorm:"size:32;not null;index"`
	ActivityCode string `gorm:"size:64;not null"`
	Points       int    `gorm:"not null"`
	RefType      string `gorm:"size:64"`
	RefID        uint
}
