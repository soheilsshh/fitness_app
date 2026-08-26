package models

import (
	"time"

	"gorm.io/gorm"
)

// NotificationType constants for common notification categories.
const (
	NotificationTypeProgramUpdated   = "program_updated"
	NotificationTypeCheckInReminder  = "checkin_reminder" // daily check-in reminder
	NotificationTypeMessageFromCoach = "message_from_coach"
	// NotificationTypeInactivityReminder marks the 24h/48h "come back" nudge (roadmap BE-8.3).
	NotificationTypeInactivityReminder = "inactivity_reminder"
	// NotificationTypeWeeklyCheckinReminder nudges for the missed weekly (waist) check-in.
	NotificationTypeWeeklyCheckinReminder = "weekly_checkin_reminder"
	// NotificationTypeWeeklyReportReady fires once a new weekly AI progress report is computed.
	NotificationTypeWeeklyReportReady = "weekly_report_ready"
	// NotificationTypeStudentPersonalRecord notifies a coach that their student shared a new PR.
	NotificationTypeStudentPersonalRecord = "student_personal_record"
)

// Notification represents a single user-targeted notification.
type Notification struct {
	gorm.Model
	UserID  uint   `gorm:"not null;index"`
	Type    string `gorm:"size:50;not null"` // e.g. program_updated, checkin_reminder, message_from_coach
	Title   string `gorm:"size:255"`
	Message string `gorm:"type:text"`
	// ActionPath is an in-app route to navigate to when the notification is
	// clicked (e.g. "/user/tracking#daily-checkin"). Empty means no deep link.
	ActionPath string `gorm:"size:255"`
	IsRead     bool   `gorm:"default:false"`
	ReadAt     *time.Time
}

