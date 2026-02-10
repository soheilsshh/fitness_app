package models

import (
	"time"

	"gorm.io/gorm"
)

// NotificationType constants for common notification categories.
const (
	NotificationTypeProgramUpdated    = "program_updated"
	NotificationTypeCheckInReminder   = "checkin_reminder"
	NotificationTypeMessageFromCoach  = "message_from_coach"
)

// Notification represents a single user-targeted notification.
type Notification struct {
	gorm.Model
	UserID  uint       `gorm:"not null;index"`
	Type    string     `gorm:"size:50;not null"` // e.g. program_updated, checkin_reminder, message_from_coach
	Title   string     `gorm:"size:255"`
	Message string     `gorm:"type:text"`
	IsRead  bool       `gorm:"default:false"`
	ReadAt  *time.Time
}

