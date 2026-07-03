package models

import "gorm.io/gorm"

type ProgramItem struct {
	gorm.Model
	WorkoutProgramID uint   `gorm:"not null;index"`
	WeekNumber       int    `gorm:"not null"`
	DayNumber        int    `gorm:"not null"`
	OrderIndex       int    `gorm:"not null"`
	Exercise         string `gorm:"size:255;not null"`
	ExerciseID       *uint  `gorm:"index"`
	// Sets and Reps are legacy aggregate fields kept for backward compatibility.
	// When SetsDetails is populated it takes precedence for reads and writes.
	Sets             int
	Reps             string `gorm:"size:100"`
	RestTime         string `gorm:"size:100"`
	Tempo            string `gorm:"size:50"`
	Notes            string `gorm:"type:text"`
	SetsDetails      []ProgramItemSet `gorm:"foreignKey:ProgramItemID;constraint:OnDelete:CASCADE;"`
	// SupersetID links exercises that are performed back-to-back (shared UUID).
	SupersetID *string `gorm:"size:36;index"`
	// WorkoutSystemType: normal, superset, giant_set, circuit, etc.
	WorkoutSystemType string `gorm:"size:32;not null;default:normal"`
}


