package models

import "time"

// AvanakMessage represents an Avanak voice call message configuration
type AvanakMessage struct {
	ID                    uint       `gorm:"primaryKey" json:"id"`
	Name                  string     `gorm:"type:varchar(255);not null" json:"name"`                        // نام پیام (مثلاً: یادآوری صوتی)
	MessageID             int        `gorm:"not null" json:"message_id"`                                    // کد فایل صوتی Avanak
	IsActive              bool       `gorm:"index;default:true" json:"is_active"`                           // فعال/غیرفعال بودن
	SendType              string     `gorm:"type:varchar(50);index;default:'automatic'" json:"send_type"`   // "automatic" یا "scheduled"
	ScheduledAt           *time.Time `gorm:"index" json:"scheduled_at"`                                     // تاریخ و زمان ارسال (برای send_type=scheduled)
	SendHour              *int       `json:"send_hour"`                                                     // ساعت ارسال (برای send_type=automatic)
	SendMinute            *int       `json:"send_minute"`                                                   // دقیقه ارسال (برای send_type=automatic)
	RegistrationTimeRange string     `gorm:"type:varchar(50);default:'all'" json:"registration_time_range"` // "all", "today", "yesterday", "week", "last_week", "month"
	RegistrationStartHour *int       `json:"registration_start_hour"`                                       // ساعت شروع بازه ثبت‌نام (0-23, null = no filter)
	RegistrationEndHour   *int       `json:"registration_end_hour"`                                         // ساعت پایان بازه ثبت‌نام (0-23, null = no filter)
	LastSentAt            *time.Time `json:"last_sent_at"`                                                  // آخرین زمان ارسال (برای جلوگیری از ارسال تکراری)
	AutoCycleEnabled      bool       `gorm:"index;default:false" json:"auto_cycle_enabled"`                 // فعال بودن چرخه خودکار 24 ساعته (17:00 تا 17:00 فردا)
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
}

// AvanakMessageLog represents a log entry for an Avanak voice call send attempt
type AvanakMessageLog struct {
	ID              uint          `gorm:"primaryKey" json:"id"`
	AvanakMessageID uint          `gorm:"not null;index" json:"avanak_message_id"`
	AvanakMessage   AvanakMessage `gorm:"foreignKey:AvanakMessageID" json:"avanak_message"`
	Recipient       string        `gorm:"type:varchar(20);not null" json:"recipient"`    // شماره گیرنده
	Status          string        `gorm:"type:varchar(50);index;not null" json:"status"` // "sent", "failed"
	ErrorMessage    string        `gorm:"type:text" json:"error_message"`                // پیام خطا در صورت عدم موفقیت
	SentAt          time.Time     `gorm:"not null;index" json:"sent_at"`                 // زمان ارسال
	CreatedAt       time.Time     `json:"created_at"`
}

// AvanakMessageCycleLog tracks which 24-hour cycle group has received Avanak voice calls
// Each cycle is from 17:00 (5 PM) to 17:00 next day (or 14:00 to 14:00 for 14:00 messages)
// This prevents sending duplicate calls to the same cycle group
type AvanakMessageCycleLog struct {
	ID               uint          `gorm:"primaryKey" json:"id"`
	AvanakMessageID  uint          `gorm:"not null;index" json:"avanak_message_id"`
	AvanakMessage    AvanakMessage `gorm:"foreignKey:AvanakMessageID" json:"avanak_message"`
	CycleStart       time.Time     `gorm:"not null;index" json:"cycle_start"` // Start time of the 24-hour cycle
	CycleEnd         time.Time     `gorm:"not null;index" json:"cycle_end"`   // End time of the 24-hour cycle
	SentAt           time.Time     `gorm:"not null" json:"sent_at"`           // When calls were sent to this cycle
	SentCount        int           `gorm:"default:0" json:"sent_count"`       // Number of users who received the call in this cycle
	CreatedAt        time.Time     `json:"created_at"`
}
