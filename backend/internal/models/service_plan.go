package models

import "gorm.io/gorm"

// ServicePlan represents a sellable plan in the system.
// It is the backend equivalent of the "plan" model used in the frontend
// (admin plans list, landing page cards, etc.).
type ServicePlan struct {
	gorm.Model

	// Core naming / presentation
	Name         string `gorm:"size:255;uniqueIndex;not null"` // main title (maps to frontend title)
	Subtitle     string `gorm:"size:255"`                      // optional subtitle
	CourseName   string `gorm:"size:255"`                      // e.g. دوره / course name
	Description  string `gorm:"type:text"`                     // optional long description
	FeaturesText string `gorm:"type:text"`                     // multiline bullet-style text for UI

	// Typing / categorisation
	// Type is kept for backward compatibility (e.g. "workout", "nutrition", "both").
	Type string `gorm:"size:50;not null"`

	// Pricing
	PriceCents         int64 `gorm:"not null"`                    // base price in cents
	DiscountPriceCents int64 `gorm:"not null;default:0"`          // discounted price in cents (0 = no discount)
	DiscountPercent    int   `gorm:"not null;default:0"`          // redundant but useful for fast display
	DurationDays       int   `gorm:"not null"`                    // plan duration for dashboard / student UI
	IsPopular          bool  `gorm:"not null;default:false"`      // for highlighting in UI
	IsActive           bool  `gorm:"not null;default:true"`       // soft-enable/disable plan
}

