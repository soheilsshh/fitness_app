package models

import (
	"time"

	"gorm.io/gorm"
)

type WorkoutProgram struct {
	gorm.Model
	SubscriptionID uint      `gorm:"index;not null"`
	CoachID        uint      `gorm:"index;not null"`
	Version        int       `gorm:"not null;default:1"`
	Title          string    `gorm:"size:255"`
	Notes          string    `gorm:"type:text"`
	DurationWeeks  int       `gorm:"not null;default:4"`
	IsActive       bool      `gorm:"not null;default:true"`
	LastUpdatedAt  time.Time `gorm:"autoUpdateTime"`
}
