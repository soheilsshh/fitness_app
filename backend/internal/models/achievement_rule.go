package models

import "gorm.io/gorm"

// Achievement rule codes (roadmap BE-6.6's initial set). Kept as Go constants
// rather than free-form strings so AchievementService's switch stays exhaustive.
const (
	AchievementCodeNewPR          = "pr_new"            // repeatable: each new personal record
	AchievementCodeFoodStreak30   = "food_streak_30"     // one-time: 30 consecutive days of food logging
	AchievementCodeWorkoutStreak7 = "workout_streak_7"   // one-time: 7 consecutive days with a workout session
	AchievementCode5YearMember    = "membership_5_years" // one-time: 5 years since registration

	// Gamification MVP phase (points-economy roadmap, phase 1).
	AchievementCodeProfileComplete   = "profile_complete"    // one-time: profile progress reaches 100%
	AchievementCodeInitialPhotoAlbum = "initial_photo_album" // one-time: all 4 required initial body-photo angles uploaded

	// Phase 2 (v2).
	AchievementCodeRegularWeek        = "regular_week"          // repeatable: a training week's planned sessions all logged
	AchievementCodeNutritionDayDone   = "nutrition_day_complete" // repeatable: a day's calorie/macro target met
	AchievementCodeGoldenCheckIn      = "golden_checkin"         // repeatable: weight + measurements + 3 photos same day
	AchievementCodeAIWorkoutArchitect = "ai_workout_architect"   // one-time: first AI-generated workout program saved
	AchievementCodeAINutritionArchitect = "ai_nutrition_architect" // one-time: first AI-generated nutrition program saved

	// Phase 3 (v3).
	AchievementCodeWorkoutStreak30  = "workout_streak_30"  // one-time: 30 consecutive days with a workout session
	AchievementCodeWorkoutStreak90  = "workout_streak_90"  // one-time: 90 consecutive days with a workout session
	AchievementCodeFoodStreak90     = "food_streak_90"     // one-time: 90 consecutive days of food logging
	AchievementCodeTrackingVisual2M = "tracking_visual_2m" // one-time: consistent bi-weekly progress photos across ~2 months
	AchievementCodeTrackingSteady   = "tracking_steady"    // one-time: consistent check-ins across a longer window
	AchievementCodeCommunityActive  = "community_active"   // one-time: 20 posts or 100 interactions
	AchievementCodeAIHumanCollab    = "ai_human_collab"    // repeatable: an AI-generated program approved by a coach

	// Phase 4.
	AchievementCodeCoachSession   = "coach_session"     // repeatable: a completed 1:1 coach session
	AchievementCodeSubRenewal     = "subscription_renewal" // repeatable: a returning-student subscription purchase
	AchievementCode1YearMember    = "membership_1_year"    // one-time: 1 year since registration
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
