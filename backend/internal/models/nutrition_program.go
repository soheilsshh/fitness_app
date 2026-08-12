package models

import (
	"time"

	"gorm.io/gorm"
)

type NutritionProgram struct {
	gorm.Model
	SubscriptionID uint      `gorm:"index;not null"`
	CoachID        uint      `gorm:"index;not null"`
	Version        int       `gorm:"not null;default:1"`
	Title          string    `gorm:"size:255"`
	Notes          string    `gorm:"type:text"`
	// CaloriesTarget / ProteinTarget are day-level diet goals from the coach or template.
	// Meal rows alone cannot store these, so they live on the program.
	CaloriesTarget int    `gorm:"not null;default:0"`
	ProteinTarget  string `gorm:"size:100"`
	// Goal is the diet objective behind this program: cut | bulk | maintain.
	// Populated by AI-generated plans (roadmap BE-1.3); blank for coach-authored ones.
	Goal           string    `gorm:"size:20"`
	DurationWeeks  int       `gorm:"not null;default:4"`
	IsActive       bool      `gorm:"not null;default:true"`
	LastUpdatedAt  time.Time `gorm:"autoUpdateTime"`
}
