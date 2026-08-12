package models

import "gorm.io/gorm"

// UserAchievement is one grant of an AchievementRule to a student (roadmap BE-6.2).
type UserAchievement struct {
	gorm.Model
	UserID            uint `gorm:"not null;index"`
	AchievementRuleID uint `gorm:"not null;index"`
	Points            int  `gorm:"not null;default:0"` // snapshot of the rule's points at award time
	Context           string `gorm:"size:255"`          // optional detail, e.g. exercise name for a PR
}
