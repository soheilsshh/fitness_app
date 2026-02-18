package models

import (
	"time"

	"gorm.io/gorm"
)

// OtpCode stores one-time passwords for login and password reset flows.
type OtpCode struct {
	gorm.Model

	Phone    string    `gorm:"size:50;index;not null"`
	Code     string    `gorm:"size:10;not null"`
	Purpose  string    `gorm:"size:50;index;not null"` // e.g. "login", "password_reset"
	ExpiresAt time.Time `gorm:"index;not null"`
	UsedAt   *time.Time
}

