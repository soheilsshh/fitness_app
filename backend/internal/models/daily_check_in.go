package models

import (
	"time"

	"gorm.io/gorm"
)

// DailyCheckIn is one row per user per calendar day: morning weight, sleep
// quality, and (only shown to students without an active nutrition plan)
// self-reported protein intake. Feeds both the dashboard quick-entry widgets
// and the weekly AI progress report.
type DailyCheckIn struct {
	gorm.Model
	UserID          uint      `gorm:"not null;index:idx_daily_checkin_user_date,unique"`
	Date            time.Time `gorm:"not null;index:idx_daily_checkin_user_date,unique"` // truncated to the day
	MorningWeightKg *float64
	SleepQuality    *int // 1-5
	ProteinIntakeG  *float64
}
