package models

import "time"

// Subscription links a student User to a ServicePlan.
type Subscription struct {
	ID            uint        `gorm:"primaryKey" json:"id"`
	UserID        uint        `gorm:"not null;index" json:"user_id"`
	User          User        `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user"`
	ServicePlanID uint        `gorm:"not null;index" json:"service_plan_id"`
	ServicePlan   ServicePlan `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"service_plan"`

	StartsAt time.Time  `gorm:"not null" json:"starts_at"`
	EndsAt   *time.Time `json:"ends_at,omitempty"`
	IsActive bool       `gorm:"not null;default:true" json:"is_active"`

	Transactions []Transaction `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"transactions,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}


