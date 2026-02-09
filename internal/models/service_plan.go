package models

import "time"

// ServicePlan represents a pricing/feature plan offered by the coach.
type ServicePlan struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Name        string `gorm:"size:255;not null;uniqueIndex" json:"name"`
	Description string `gorm:"type:text" json:"description"`
	PriceCents  int64  `gorm:"not null" json:"price_cents"`
	IsActive    bool   `gorm:"not null;default:true" json:"is_active"`

	Subscriptions []Subscription `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"subscriptions,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}


