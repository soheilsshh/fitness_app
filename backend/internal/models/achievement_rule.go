package models

import "gorm.io/gorm"

// Achievement rule codes (roadmap BE-6.6's initial set). Kept as Go constants
// rather than free-form strings so AchievementService's switch stays exhaustive.
const (
	AchievementCodeNewPR          = "pr_new"            // repeatable: each new personal record
	AchievementCodeFoodStreak30   = "food_streak_30"     // one-time: 30 consecutive days of food logging
	AchievementCodeWorkoutStreak7 = "workout_streak_7"   // one-time: 7 consecutive days with a workout session
	AchievementCode5YearMember    = "membership_5_years" // one-time: 5 years since registration
)

// AchievementRule defines a gamification rule: what event grants it, and how
// many points it's worth (roadmap BE-6.1). Seeded once at boot; admins can
// tune Points/Title later without touching Go code.
type AchievementRule struct {
	gorm.Model
	Code        string `gorm:"size:64;uniqueIndex;not null"`
	Title       string `gorm:"size:255;not null"`
	Description string `gorm:"type:text"`
	IconURL     string `gorm:"size:512"`
	Points      int    `gorm:"not null;default:0"`
	// Repeatable rules (e.g. pr_new) can be awarded to the same user many times;
	// one-time rules (streaks, membership milestones) are awarded once.
	Repeatable bool `gorm:"not null;default:false"`
}
