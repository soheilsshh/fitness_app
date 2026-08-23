package models

import "time"

type ScheduledSMS struct {
	ID      uint      `gorm:"primaryKey"`
	UserID  uint
	Pattern string
	SendAt  time.Time
	Sent    bool
	CreatedAt time.Time
} 