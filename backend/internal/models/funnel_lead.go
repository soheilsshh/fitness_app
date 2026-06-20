package models

import (
	"time"

	"gorm.io/gorm"
)

const (
	FunnelStatusPendingPayment = "pending_payment"
	FunnelStatusPaid           = "paid"
	FunnelStatusFailed         = "failed"
	FunnelStatusContacted      = "contacted"
)

// FunnelLead stores guest submissions from the /leadfunnel sales funnel.
type FunnelLead struct {
	gorm.Model

	CheckoutToken string `gorm:"size:64;uniqueIndex;not null"`
	CoachID       uint   `gorm:"index;not null;default:0"`
	CoachName     string `gorm:"size:120;not null"`

	FirstName string `gorm:"size:60;not null"`
	LastName  string `gorm:"size:60;not null"`
	Phone     string `gorm:"size:20;index;not null"`

	PrimaryGoal   string `gorm:"size:30;not null"`
	ActivityLevel string `gorm:"size:30;not null"`
	MainObstacle  string `gorm:"size:30;not null"`
	Scenario      string `gorm:"size:1;not null"`

	AnalysisTitle string `gorm:"size:255;not null"`
	AnalysisBody  string `gorm:"type:text;not null"`

	PackageTitle  string `gorm:"size:255;not null"`
	AmountCents   int64  `gorm:"not null"`
	Status        string `gorm:"size:30;not null;index"`
	TrackingCode  string `gorm:"size:100;uniqueIndex"`
	PaymentMethod string `gorm:"size:100"`
	UTMSource     string `gorm:"size:120"`
	UTMCampaign   string `gorm:"size:120"`

	PaidAt      *time.Time
	ContactedAt *time.Time
}

func (FunnelLead) TableName() string {
	return "funnel_leads"
}
