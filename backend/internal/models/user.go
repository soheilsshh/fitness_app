package models

import (
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
	HeightCm     *float64   `gorm:"column:height_cm"` // optional body height for admin/user body section
}

