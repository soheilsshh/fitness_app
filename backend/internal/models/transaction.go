package models

import (
	"time"

	"gorm.io/gorm"
)

type Transaction struct {
	gorm.Model
	OrderID        uint      `gorm:"index"`
	SubscriptionID uint      `gorm:"index"`
	UserID         uint      `gorm:"index;not null"`
	AmountCents    int64     `gorm:"not null"`
	Status         string    `gorm:"size:50;not null"`
	Reference      string    `gorm:"size:255;uniqueIndex"`
	Gateway        string    `gorm:"size:30"`
	Date           time.Time `gorm:"not null"`
}

