package models

import (
	"time"

	"gorm.io/gorm"
)

// DailyFoodLog records a single food item consumed by a student on a given day.
type DailyFoodLog struct {
	gorm.Model
	UserID   uint      `gorm:"not null;index:idx_daily_food_log_user_date,priority:1"`
	LogDate  time.Time `gorm:"not null;index:idx_daily_food_log_user_date,priority:2"`
	FoodID   *uint     `gorm:"index"`
	FoodName string    `gorm:"size:255;not null"`
	Quantity string    `gorm:"size:100"`
	Calories float64
	Protein  float64
	Carbs    float64
	Fat      float64
}
