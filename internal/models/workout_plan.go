package models

import "time"

// WorkoutPlan represents a full workout program for a user (usually created by a coach).
type WorkoutPlan struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Title       string `gorm:"size:255;not null" json:"title"`
	Description string `gorm:"type:text" json:"description"`

	CoachID uint `gorm:"index" json:"coach_id"`
	Coach   User `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"coach"`

	StudentID uint `gorm:"index" json:"student_id"`
	Student   User `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"student"`

	PlanItems []PlanItem `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"plan_items,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}


