package models

import "time"

// SmartSMSLog (table name: sms_logs) stores per-user-per-registration-cycle SMS sends.
// This is the hard dedupe layer: a category can be sent only once per (user_id, registration_cycle_id).
type SmartSMSLog struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	UserID              uint      `gorm:"not null;index;uniqueIndex:uniq_user_cycle_category" json:"user_id"`
	RegistrationCycleID uint      `gorm:"not null;index;uniqueIndex:uniq_user_cycle_category" json:"registration_cycle_id"`
	Provider            string    `gorm:"type:varchar(32);not null;index" json:"provider"` // melipayamak | faraz
	PatternCode         string    `gorm:"type:varchar(64)" json:"pattern_code"`            // numeric code for patterns (or empty for plain)
	Category            string    `gorm:"type:varchar(64);not null;index;uniqueIndex:uniq_user_cycle_category" json:"category"`
	SentAt              time.Time `gorm:"not null;index" json:"sent_at"`

	// Optional fields for monitoring/fail-safe debugging
	Status       string `gorm:"type:varchar(32);index;default:'sent'" json:"status"` // sent | failed
	ErrorMessage string `gorm:"type:text" json:"error_message,omitempty"`

	CreatedAt time.Time `json:"created_at"`
}

func (SmartSMSLog) TableName() string {
	return "sms_logs"
}

// SmartSMSScheduleRun tracks daily execution state for fixed time-based campaigns.
type SmartSMSScheduleRun struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	Category      string     `gorm:"type:varchar(64);not null;index;uniqueIndex:uniq_category_date" json:"category"`
	RunDate       time.Time  `gorm:"not null;index;uniqueIndex:uniq_category_date" json:"run_date"` // Date at 00:00 in Asia/Tehran
	Provider      string     `gorm:"type:varchar(32);not null;index" json:"provider"`
	ScheduledAt   time.Time  `gorm:"not null;index" json:"scheduled_at"`
	Status        string     `gorm:"type:varchar(32);not null;index" json:"status"` // pending | sent | cancelled | sending
	EligibleCount int        `gorm:"default:0" json:"eligible_count"`
	SentCount     int        `gorm:"default:0" json:"sent_count"`
	ExecutedAt    *time.Time `gorm:"index" json:"executed_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

func (SmartSMSScheduleRun) TableName() string {
	return "smart_sms_schedule_runs"
}

// SmartSMSScheduledMessage stores configurable scheduled SMS messages (yesterday campaigns)
// This allows admins to edit message text and time without code changes
type SmartSMSScheduledMessage struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Category        string    `gorm:"type:varchar(64);not null;uniqueIndex" json:"category"`     // e.g., "yesterday_0800_faraz"
	Provider        string    `gorm:"type:varchar(32);not null" json:"provider"`                 // "faraz", "melipayamak", or "avanak"
	Hour            int       `gorm:"not null;check:hour >= 0 AND hour <= 23" json:"hour"`       // 0-23
	Minute          int       `gorm:"not null;check:minute >= 0 AND minute <= 59" json:"minute"` // 0-59
	Message         string    `gorm:"type:text" json:"message"`                                  // Message text for Faraz (optional for avanak)
	PatternKey      string    `gorm:"type:varchar(191)" json:"pattern_key,omitempty"`            // SystemConfig key for Melipayamak pattern (optional)
	AvanakMessageID int       `gorm:"default:0" json:"avanak_message_id,omitempty"`              // Avanak message ID for voice calls (optional)
	IsActive        bool      `gorm:"default:true;index" json:"is_active"`                       // Enable/disable this message
	DisplayOrder    int       `gorm:"default:0;index" json:"display_order"`                      // Order for display in admin panel
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func (SmartSMSScheduledMessage) TableName() string {
	return "smart_sms_scheduled_messages"
}
