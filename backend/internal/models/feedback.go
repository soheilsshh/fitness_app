package models

import "gorm.io/gorm"

// Feedback stores messages sent from the public site (contact / feedback forms).
// It matches the mockFeedbacks structure used in the admin panel UI.
type Feedback struct {
	gorm.Model

	FullName string `gorm:"size:255;not null"`
	Email    string `gorm:"size:255;not null"`
	Phone    string `gorm:"size:50"`
	Message  string `gorm:"type:text;not null"`
}

