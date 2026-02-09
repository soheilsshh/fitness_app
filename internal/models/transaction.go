package models

import "time"

// Transaction records payment or billing events for a subscription.
type Transaction struct {
	ID             uint          `gorm:"primaryKey" json:"id"`
	SubscriptionID uint          `gorm:"index" json:"subscription_id"`
	Subscription   *Subscription `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"subscription,omitempty"`

	UserID uint `gorm:"index" json:"user_id"`
	User   User `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"user"`

	AmountCents int64  `gorm:"not null" json:"amount_cents"`
	Currency    string `gorm:"size:10;not null;default:'USD'" json:"currency"`
	Status      string `gorm:"size:50;not null" json:"status"`
	Reference   string `gorm:"size:255;uniqueIndex" json:"reference"`
	Meta        string `gorm:"type:text" json:"meta"` // optional extra data, JSON, etc.

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}


