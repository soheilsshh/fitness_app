package models

import "gorm.io/gorm"

type NutritionItem struct {
	gorm.Model
	NutritionProgramID uint    `gorm:"not null;index"`
	DayNumber          int     `gorm:"not null"`
	MealNumber         int     `gorm:"not null"`
	OrderIndex         int     `gorm:"not null"`
	Food               string  `gorm:"size:255;not null"`
	Quantity           string  `gorm:"size:100"`
	Calories           int
	Protein            float64
	Carbs              float64
	Fat                float64
	Notes              string `gorm:"type:text"`
}


