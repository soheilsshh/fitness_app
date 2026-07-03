package models

import "gorm.io/gorm"

// ProgramItemSet stores per-set prescription for a workout program item
// (reps and AMRAP flag for each set).
type ProgramItemSet struct {
	gorm.Model
	ProgramItemID uint   `gorm:"not null;index"`
	SetNumber     int    `gorm:"not null"`
	Reps          string `gorm:"size:100"`
	IsAMRAP       bool   `gorm:"not null;default:false"`
}
