package models

import "gorm.io/gorm"

type CoachProfile struct {
	gorm.Model
	UserID       uint   `gorm:"uniqueIndex;not null"`
	Bio          string `gorm:"type:text"`
	Specialty    string `gorm:"size:255"`
	TelegramID   string `gorm:"size:100"`
	ContactPhone string `gorm:"size:50"`
	AboutCoach   string `gorm:"type:text"`
}

