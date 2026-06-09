package models

import (
	"strings"
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Name         string     `gorm:"size:255;not null"`
	Email        string     `gorm:"size:255;uniqueIndex;not null"`
	Phone        string     `gorm:"size:255;uniqueIndex;not null"`
	Password     string     `gorm:"size:255;not null"`
	Role         string     `gorm:"type:varchar(20);not null;default:'student'"`
	LastActiveAt *time.Time `gorm:"index"`
	HeightCm     *float64   `gorm:"column:height_cm"`
	WeightKg     *float64   `gorm:"column:weight_kg"`
	CoachStatus       string `gorm:"column:coach_status;size:20"`
	AssignedCoachID   *uint  `gorm:"column:assigned_coach_id;index"`

	// Extended student profile (onboarding)
	BirthDate           *time.Time `gorm:"column:birth_date;type:date"`
	NationalID          string     `gorm:"column:national_id;size:10"`
	Gender              string     `gorm:"column:gender;size:20"`
	Goals               string     `gorm:"column:goals;type:json"`
	PrimaryGoal         string     `gorm:"column:primary_goal;size:100"`
	TargetWeightKg      *float64   `gorm:"column:target_weight_kg"`
	BodyCondition       string     `gorm:"column:body_condition;size:50"`
	BodyFatPercent      *float64   `gorm:"column:body_fat_percent"`
	MedicalHistory      string     `gorm:"column:medical_history;type:text"`
	Injuries            string     `gorm:"column:injuries;type:text"`
	PhysicalLimitations string     `gorm:"column:physical_limitations;type:text"`
}

// BeforeSave ensures JSON columns always contain valid JSON for MySQL.
func (u *User) BeforeSave(tx *gorm.DB) error {
	if strings.TrimSpace(u.Goals) == "" {
		u.Goals = "[]"
	}
	return nil
}
