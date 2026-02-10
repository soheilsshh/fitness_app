package models

import (
	"time"

	"gorm.io/gorm"
)

type RefreshToken struct {
	gorm.Model
	UserID    uint      `gorm:"not null;index"`
	Token     string    `gorm:"size:512;not null;index"`
	ExpiresAt time.Time `gorm:"not null;index"`
}
