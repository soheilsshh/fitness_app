package models

import "gorm.io/gorm"

type ServicePlan struct {
	gorm.Model
	Name         string `gorm:"size:255;uniqueIndex;not null"`
	Description  string `gorm:"type:text"`
	PriceCents   int64  `gorm:"not null"`
	DurationDays int    `gorm:"not null"`
	Type         string `gorm:"size:50;not null"`
	IsActive     bool   `gorm:"not null;default:true"`
}

