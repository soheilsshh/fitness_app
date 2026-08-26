package models

import "time"

// AppointmentSlot represents a scheduled stream slot for appointment-based scheduling
type AppointmentSlot struct {
	ID              uint      `gorm:"primaryKey;index" json:"id"`
	PersianYear     int       `gorm:"index" json:"persian_year"`     // سال شمسی
	PersianMonth    int       `gorm:"index" json:"persian_month"`     // ماه شمسی (1-12)
	PersianDay      int       `gorm:"index" json:"persian_day"`       // روز شمسی (1-30)
	StartDateTime   time.Time `gorm:"index" json:"start_date_time"`   // تاریخ و زمان شروع (Gregorian)
	StartHour       int       `json:"start_hour"`                     // ساعت شروع (0-23)
	StartMinute     int       `json:"start_minute"`                   // دقیقه شروع (0-59)
	EndHour         int       `json:"end_hour"`                       // ساعت پایان (از تنظیمات کارگاه)
	CommentOffset   float64   `json:"comment_offset"`                 // Offset کامنت (از تنظیمات کارگاه)
	IsCompleted     bool      `gorm:"default:false" json:"is_completed"` // آیا این نوبت برگزار شده است
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// TableName specifies the table name for AppointmentSlot
func (AppointmentSlot) TableName() string {
	return "appointment_slots"
}
