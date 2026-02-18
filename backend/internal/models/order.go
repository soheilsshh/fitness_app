package models

import (
	"time"

	"gorm.io/gorm"
)

// Order represents a purchase initiated by a user.
// This is the backend counterpart of the "order" model used in the frontend
// (mockOrders in the user panel).
type Order struct {
	gorm.Model

	UserID uint `gorm:"index;not null"`

	// Status: pending | paid | failed | refunded
	Status string `gorm:"size:20;not null"`

	// PaymentMethod: e.g. "درگاه آنلاین"
	PaymentMethod string `gorm:"size:100;not null"`

	// TrackingCode is a human‑readable code like "TRX-7A21B3".
	TrackingCode string `gorm:"size:100;uniqueIndex"`

	DiscountPercent int    `gorm:"not null;default:0"`
	Note            string `gorm:"type:text"`

	// TotalAmountCents stores the final payable amount in smallest currency unit.
	TotalAmountCents int64 `gorm:"not null"`

	// PaidAt is set when payment succeeds.
	PaidAt *time.Time
}

// OrderItem represents a single line item inside an order.
// It corresponds to items in mockOrders (type, refId, title, qty, price).
type OrderItem struct {
	gorm.Model

	OrderID uint `gorm:"index;not null"`

	// ItemType: "program" | "addon" | ...
	ItemType string `gorm:"size:20;not null"`

	// PlanID links to ServicePlan when the item is a sellable plan.
	PlanID uint `gorm:"index"`

	// RefID is an optional external reference (e.g. p1, a1) used by the frontend.
	RefID string `gorm:"size:100"`

	Title string `gorm:"size:255;not null"`
	Qty   int    `gorm:"not null;default:1"`

	UnitPriceCents  int64 `gorm:"not null"`
	LineTotalCents  int64 `gorm:"not null"` // normally Qty * UnitPriceCents
}

