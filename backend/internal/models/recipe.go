package models

import "gorm.io/gorm"

// Recipe is a filterable recipe/food-bank entry (roadmap phase 1, BE-1.6/BE-1.7).
type Recipe struct {
	gorm.Model
	Title        string  `gorm:"size:255;not null;index"`
	DietType     string  `gorm:"size:50;index"` // e.g. fast_food_diet, traditional_diet, keto, ...
	Calories     int     `gorm:"not null;default:0;index"`
	ProteinG     float64
	CarbsG       float64
	FatG         float64
	Ingredients  string `gorm:"type:text"` // free text, one ingredient per line
	Instructions string `gorm:"type:text"`
	VideoURL     string `gorm:"size:512"`
	ImageURL     string `gorm:"size:512"`
	Tags         string `gorm:"type:text"` // comma separated tags
	IsPublished  bool   `gorm:"not null;default:true"`
}
