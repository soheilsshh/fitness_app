package models

import "gorm.io/gorm"

// WorkoutTemplate stores a reusable workout program imported from crul JSON (morabiha).
type WorkoutTemplate struct {
	gorm.Model
	SourceID  int    `gorm:"uniqueIndex;not null"`
	Title     string `gorm:"size:255;not null"`
	Type      string `gorm:"size:50"`
	Gender    string `gorm:"size:50"`
	Location  string `gorm:"size:100"`
	DayCount  int    `gorm:"not null;default:1"`
	Target    string `gorm:"size:100"`
	Injury    string `gorm:"size:100"`
	Level     string `gorm:"size:100"`
	CoachID   *uint  `gorm:"index"`
	Items     []TemplateProgramItem `gorm:"foreignKey:WorkoutTemplateID;constraint:OnDelete:CASCADE;"`
}

// TemplateProgramItem is one exercise slot inside a workout template day.
type TemplateProgramItem struct {
	gorm.Model
	WorkoutTemplateID uint   `gorm:"not null;index"`
	DayNumber         int    `gorm:"not null"`
	OrderIndex        int    `gorm:"not null"`
	ExerciseID        *uint  `gorm:"index"`
	Exercise          string `gorm:"size:255;not null"`
	Notes             string `gorm:"type:text"`
	SupersetID        *string `gorm:"size:36;index"`
	WorkoutSystemType string  `gorm:"size:32;not null;default:normal"`
	SetsDetails       []TemplateProgramItemSet `gorm:"foreignKey:TemplateProgramItemID;constraint:OnDelete:CASCADE;"`
}

// TemplateProgramItemSet stores per-set prescription inside a template item.
type TemplateProgramItemSet struct {
	gorm.Model
	TemplateProgramItemID uint   `gorm:"not null;index"`
	SetNumber             int    `gorm:"not null"`
	SetType               string `gorm:"size:100"`
	Reps                  string `gorm:"size:100"`
	IsAMRAP               bool   `gorm:"not null;default:false"`
	SetHash               string `gorm:"size:32;index"`
}
