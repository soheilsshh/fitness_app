package models

import "time"

// WebinarActivity tracks user activity on webinar (clicks, views, etc)
type WebinarActivity struct {
	ID                 uint       `gorm:"primaryKey" json:"id"`
	UserID             *uint      `json:"user_id"`                      // Nullable - for unregistered users
	Phone              string     `gorm:"index" json:"phone"`           // Index for phone lookups (frequently queried)
	ActivityType       string     `gorm:"index" json:"activity_type"`   // Index for filtering by activity type
	ClickedAt          time.Time  `gorm:"index" json:"clicked_at"`      // Index for date range queries
	ViewStartTime      *time.Time `gorm:"index" json:"view_start_time"` // Index for viewer queries
	ViewEndTime        *time.Time `json:"view_end_time"`                // When user stopped watching
	TotalViewMinutes   int        `json:"total_view_minutes"`           // Total minutes watched (includes background time)
	ActiveWatchMinutes int        `json:"active_watch_minutes"`         // Active watch minutes (only when page is visible, not in background)
	LastUpdated        time.Time  `gorm:"index" json:"last_updated"`    // Index for online viewers check
	CreatedAt          time.Time  `json:"created_at"`
}

// AdminUser moved to models/admin_user.go
