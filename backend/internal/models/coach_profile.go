package models

import "gorm.io/gorm"

type CoachProfile struct {
	gorm.Model
	UserID uint `gorm:"uniqueIndex;not null"`

	Slug        string `gorm:"size:100;uniqueIndex;not null"`
	DisplayName string `gorm:"size:255;not null"`
	Title       string `gorm:"size:255"`

	Bio          string `gorm:"type:text"`
	AboutCoach   string `gorm:"type:text"`
	Specialty    string `gorm:"size:255"`
	AvatarURL    string `gorm:"size:500"`
	CoverImageURL string `gorm:"size:500"`

	ContactPhone string `gorm:"size:50"`
	Instagram    string `gorm:"size:255"`
	Telegram     string `gorm:"size:100"`
	WhatsApp     string `gorm:"size:50"`
	Website      string `gorm:"size:255"`

	NationalID string `gorm:"size:10"`
	City       string `gorm:"size:100"`

	// Status: pending | reviewing | approved
	Status string `gorm:"size:20;not null;default:pending;index"`

	IsPublished bool `gorm:"not null;default:false"`
	IsActive    bool `gorm:"not null;default:true"`
}
