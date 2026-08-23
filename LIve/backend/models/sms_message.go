package models

import "time"

// SMSMessage represents an SMS message configuration
type SMSMessage struct {
	ID                    uint       `gorm:"primaryKey" json:"id"`
	Name                  string     `gorm:"type:varchar(255);not null" json:"name"`                        // نام پیام (مثلاً: خوش‌آمدگویی، یادآوری)
	PatternCode           int        `gorm:"not null" json:"pattern_code"`                                  // کد پترن Melipayamak
	MessageText           string     `gorm:"type:text" json:"message_text"`                                 // متن پیام (برای نمایش/مرجع)
	IsActive              bool       `gorm:"index;default:true" json:"is_active"`                           // Index for filtering active messages
	SendType              string     `gorm:"type:varchar(50);index;default:'automatic'" json:"send_type"`   // Index for filtering by send type
	ScheduledAt           *time.Time `gorm:"index" json:"scheduled_at"`                                     // Index for scheduled message queries
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

// SMSMessageLog represents a log entry for an SMS message send attempt
type SMSMessageLog struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	SMSMessageID uint       `gorm:"not null;index" json:"sms_message_id"` // Already indexed
	SMSMessage   SMSMessage `gorm:"foreignKey:SMSMessageID" json:"sms_message"`
	Recipient    string     `gorm:"type:varchar(20);not null" json:"recipient"`    // شماره گیرنده
	Status       string     `gorm:"type:varchar(50);index;not null" json:"status"` // Index for filtering by status
	ErrorMessage string     `gorm:"type:text" json:"error_message"`                // پیام خطا در صورت عدم موفقیت
	SentAt       time.Time  `gorm:"not null;index" json:"sent_at"`                 // Already indexed
	CreatedAt    time.Time  `json:"created_at"`
}

// SMSMessageCycleLog tracks which 24-hour cycle group has received SMS messages
// Each cycle is from 17:00 (5 PM) to 17:00 next day
// This prevents sending duplicate messages to the same cycle group
type SMSMessageCycleLog struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	SMSMessageID uint       `gorm:"not null;index" json:"sms_message_id"`
	SMSMessage   SMSMessage `gorm:"foreignKey:SMSMessageID" json:"sms_message"`
	CycleStart   time.Time  `gorm:"not null;index" json:"cycle_start"` // Start time of the 24-hour cycle (17:00 of cycle day)
	CycleEnd     time.Time  `gorm:"not null;index" json:"cycle_end"`   // End time of the 24-hour cycle (17:00 of next day)
	SentAt       time.Time  `gorm:"not null" json:"sent_at"`           // When messages were sent to this cycle
	SentCount    int        `gorm:"default:0" json:"sent_count"`       // Number of users who received the message in this cycle
	CreatedAt    time.Time  `json:"created_at"`
}

// TriggeredSMSMessage represents an SMS message that is sent when a specific trigger event occurs
// Unlike regular SMS messages, these are sent immediately when the trigger event happens
type TriggeredSMSMessage struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"type:varchar(255);not null" json:"name"`              // نام پیام (مثلاً: ارسال لایسنس)
	TriggerType string    `gorm:"type:varchar(100);not null;index" json:"trigger_type"` // نوع تریگر (مثلاً: license_assigned, payment_success)
	PatternCode int       `gorm:"not null" json:"pattern_code"`                        // کد پترن Melipayamak
	MessageText string    `gorm:"type:text" json:"message_text"`                      // متن پیام (برای نمایش/مرجع)
	IsActive    bool      `gorm:"index;default:true" json:"is_active"`                 // فعال/غیرفعال بودن پیام
	Params      string    `gorm:"type:text" json:"params"`                            // JSON string describing parameter mapping (e.g., {"0": "user.first_name", "1": "license.code"})
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// TriggeredSMSMessageLog represents a log entry for a triggered SMS message send attempt
type TriggeredSMSMessageLog struct {
	ID                    uint                `gorm:"primaryKey" json:"id"`
	TriggeredSMSMessageID uint                `gorm:"not null;index" json:"triggered_sms_message_id"`
	TriggeredSMSMessage   TriggeredSMSMessage `gorm:"foreignKey:TriggeredSMSMessageID" json:"triggered_sms_message"`
	Recipient             string              `gorm:"type:varchar(20);not null" json:"recipient"`    // شماره گیرنده
	Status                string              `gorm:"type:varchar(50);index;not null" json:"status"` // sent, failed
	ErrorMessage          string              `gorm:"type:text" json:"error_message"`                // پیام خطا در صورت عدم موفقیت
	TriggerData           string              `gorm:"type:text" json:"trigger_data"`                 // JSON string with trigger event data
	SentAt                time.Time           `gorm:"not null;index" json:"sent_at"`                 // زمان ارسال
	CreatedAt             time.Time           `json:"created_at"`
}
