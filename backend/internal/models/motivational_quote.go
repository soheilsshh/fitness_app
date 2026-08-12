package models

import "gorm.io/gorm"

// MotivationalQuote powers the "Optimal" dashboard section (roadmap E4/BE-8.5):
// a short motivational line shown to students, picked at random.
type MotivationalQuote struct {
	gorm.Model
	Text     string `gorm:"type:text;not null"`
	Author   string `gorm:"size:255"`
	IsActive bool   `gorm:"not null;default:true"`
}
