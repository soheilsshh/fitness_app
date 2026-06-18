package models

import "gorm.io/gorm"

type Exercise struct {
	gorm.Model
	ExternalID       string `gorm:"column:external_id;size:20;uniqueIndex;not null"`
	CoachID          *uint  `gorm:"column:coach_id;index"` // nil = global dataset; set = coach-owned custom exercise
	Name             string `gorm:"size:255;not null"`
	Category         string `gorm:"size:100;index"`
	BodyPart         string `gorm:"column:body_part;size:100;index"`
	Equipment        string `gorm:"size:100;index"`
	Description      string `gorm:"type:text"`
	InstructionSteps string `gorm:"column:instruction_steps;type:json"`
	MuscleGroup      string `gorm:"column:muscle_group;size:100"`
	Target           string `gorm:"size:100;index"`
	SecondaryMuscles string `gorm:"column:secondary_muscles;type:json"`
	ImagePath        string `gorm:"column:image_path;size:500"`
	GifPath          string `gorm:"column:gif_path;size:500"`
	IsActive         bool   `gorm:"not null;default:true"`
}
