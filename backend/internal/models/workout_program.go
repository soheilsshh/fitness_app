package models

import (
	"time"

	"gorm.io/gorm"
)

type WorkoutProgram struct {
	gorm.Model
	SubscriptionID uint   `gorm:"index;not null"`
	CoachID        uint   `gorm:"index;not null"`
	Version        int    `gorm:"not null;default:1"`
	Title          string `gorm:"size:255"`
	Notes          string `gorm:"type:text"`
	// Source is who authored the content: coach | ai (models.ProgramSource*).
	Source string `gorm:"size:20;not null;default:coach"`
	// Status is the review/lifecycle state shown to the student as a badge:
	// official | coach_approved | draft (models.ProgramStatus*).
	Status        string    `gorm:"size:20;not null;default:official"`
	DurationWeeks int       `gorm:"not null;default:4"`
	IsActive      bool      `gorm:"not null;default:true"`
	LastUpdatedAt time.Time `gorm:"autoUpdateTime"`
}
