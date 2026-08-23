package models

import (
	"time"

	"gorm.io/gorm"
)

// WeeklyCheckIn is one row per user per week (WeekStart = the Saturday that
// starts the week, matching the rest of the codebase's Saturday-anchored
// weekly conventions — e.g. the progress-report scheduler). Currently just
// waist circumference; body weight moved to DailyCheckIn.
type WeeklyCheckIn struct {
	gorm.Model
	UserID    uint      `gorm:"not null;index:idx_weekly_checkin_user_week,unique"`
	WeekStart time.Time `gorm:"not null;index:idx_weekly_checkin_user_week,unique"`
	WaistCm   *float64  `gorm:""`
}
