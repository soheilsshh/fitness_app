package models

import "time"

// PlanItem is a single exercise or task inside a WorkoutPlan.
type PlanItem struct {
	ID            uint        `gorm:"primaryKey" json:"id"`
	WorkoutPlanID uint        `gorm:"not null;index" json:"workout_plan_id"`
	WorkoutPlan   WorkoutPlan `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"workout_plan"`

	DayIndex   int    `gorm:"not null" json:"day_index"`   // e.g. day number in the plan
	OrderIndex int    `gorm:"not null" json:"order_index"` // order within that day
	Title      string `gorm:"size:255;not null" json:"title"`
	Description string `gorm:"type:text" json:"description"`
	Reps       string `gorm:"size:100" json:"reps"`     // e.g. "3x12"
	Duration   string `gorm:"size:100" json:"duration"` // e.g. "30 min"

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}


