package models

import "gorm.io/gorm"

type ProgramItem struct {
	gorm.Model
	WorkoutProgramID uint   `gorm:"not null;index"`
	WeekNumber       int    `gorm:"not null"`
	DayNumber        int    `gorm:"not null"`
	OrderIndex       int    `gorm:"not null"`
	Exercise         string `gorm:"size:255;not null"`
	Sets             int
	Reps             string `gorm:"size:100"`
	RestTime         string `gorm:"size:100"`
	Tempo            string `gorm:"size:50"`
	Notes            string `gorm:"type:text"`
}


