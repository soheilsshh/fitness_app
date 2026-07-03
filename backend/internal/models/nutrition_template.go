package models

import "gorm.io/gorm"

// NutritionTemplate stores a reusable diet program imported from crul JSON (morabiha).
type NutritionTemplate struct {
	gorm.Model
	SourceID    int    `gorm:"uniqueIndex;not null"`
	Title       string `gorm:"size:255;not null"`
	Type        string `gorm:"size:50"`
	Gender      string `gorm:"size:50"`
	Target      string `gorm:"size:100"`
	Limitation  string `gorm:"size:100"`
	Calorie     int
	Description string `gorm:"type:text"`
	IsPro       bool   `gorm:"not null;default:false"`
	Version     int    `gorm:"not null;default:1"`
	CoachID     *uint  `gorm:"index"`
	Meals       []TemplateMeal `gorm:"foreignKey:NutritionTemplateID;constraint:OnDelete:CASCADE;"`
}

// TemplateMeal is one meal slot (e.g. breakfast) inside a nutrition template.
type TemplateMeal struct {
	gorm.Model
	NutritionTemplateID uint   `gorm:"not null;index"`
	MealOrder           int    `gorm:"not null"`
	MealName            string `gorm:"size:100;not null"`
	MealCalorie         int
	StartTime           string `gorm:"size:20"`
	EndTime             string `gorm:"size:20"`
	Items               []TemplateMealItem `gorm:"foreignKey:TemplateMealID;constraint:OnDelete:CASCADE;"`
}

// TemplateMealItem is one food line inside a template meal menu option.
type TemplateMealItem struct {
	gorm.Model
	TemplateMealID uint    `gorm:"not null;index"`
	MenuName       string  `gorm:"size:255"`
	OrderIndex     int     `gorm:"not null"`
	FoodID         *uint   `gorm:"index"`
	FoodName       string  `gorm:"size:255;not null"`
	FoodImage      string  `gorm:"size:500"`
	Unit           string  `gorm:"size:50"`
	Value          float64
	Description    string  `gorm:"type:text"`
}
