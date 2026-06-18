package models

import (
	"time"

	"gorm.io/gorm"
)

type Subscription struct {
	gorm.Model
	UserID              uint       `gorm:"not null;index"`
	CoachID             uint       `gorm:"index;not null;default:0"`
	ServicePlanID       uint       `gorm:"not null;index"`
	StartsAt            time.Time  `gorm:"not null"`
	EndsAt              *time.Time
	LastCheckInDate     *time.Time
	NextCheckInDueDate  *time.Time
	CheckinFrequencyDays int       `gorm:"default:14"`
}
