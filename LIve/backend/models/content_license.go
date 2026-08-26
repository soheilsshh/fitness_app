package models

import "time"

// ContentLicense represents a license for content creation mode
// Each admin user can have one content license that enables content mode
type ContentLicense struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	Code        string     `gorm:"size:255;uniqueIndex;not null" json:"code"` // License code (unique)
	IsUsed      bool       `gorm:"default:false;index" json:"is_used"`        // Whether this license has been used
	AdminUserID *uint      `gorm:"index" json:"admin_user_id,omitempty"`       // Admin user who received this license
	AdminUser   *AdminUser `gorm:"foreignKey:AdminUserID" json:"admin_user,omitempty"`
	TelegramID  *string    `gorm:"type:varchar(100);index" json:"telegram_id,omitempty"` // Telegram user ID who activated this license
	AssignedAt  *time.Time `json:"assigned_at,omitempty"`                                 // When license was assigned
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

