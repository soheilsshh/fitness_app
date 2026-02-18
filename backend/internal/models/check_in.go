package models

import (
	"time"

	"gorm.io/gorm"
)

// CheckIn stores periodic physical check-in data for a student.
type CheckIn struct {
	gorm.Model
	UserID         uint      `gorm:"not null;index"`
	SubscriptionID uint      `gorm:"index"` // optional; allows associating check-in to a specific subscription
	CheckInDate    time.Time `gorm:"not null;index"`
	Weight         float64
	Waist          float64
	Chest          float64
	Hip            float64
	Notes          string `gorm:"type:text"`
}

