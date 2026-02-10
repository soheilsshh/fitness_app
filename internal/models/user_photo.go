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
}


