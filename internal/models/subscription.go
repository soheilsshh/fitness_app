package models

import (
	"time"

	"gorm.io/gorm"
)

type Subscription struct {
	gorm.Model
	UserID        uint      `gorm:"not null;index"`
	ServicePlanID uint      `gorm:"not null;index"`
	StartsAt      time.Time `gorm:"not null"`
	EndsAt        *time.Time
}
