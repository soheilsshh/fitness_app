package models

import (
	"time"

	"gorm.io/gorm"
)

type Transaction struct {
	gorm.Model
	SubscriptionID uint      `gorm:"index"`
	UserID         uint      `gorm:"index;not null"`
	AmountCents    int64     `gorm:"not null"`
	Status         string    `gorm:"size:50;not null"`
	Reference      string    `gorm:"size:255;uniqueIndex"`
	Date           time.Time `gorm:"not null"`
}

