package models

import "gorm.io/gorm"

type Food struct {
	gorm.Model
	ExternalID string  `gorm:"column:external_id;size:64;uniqueIndex;not null"`
	Name       string  `gorm:"size:255;not null;index"`
	Unit       string  `gorm:"size:50;not null"`
	Amount     float64 `gorm:"not null"`
	Calories   float64
	Fat        float64
	Protein    float64
	Carbs      float64
	Fiber      *float64
	Sugar      *float64
}
