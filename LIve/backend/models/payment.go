package models

import (
	"time"

	"gorm.io/gorm"
)

// PaymentTransaction represents a payment transaction
type PaymentTransaction struct {
	ID                  uint                `gorm:"primaryKey" json:"id"`
	UserID              *uint               `gorm:"index" json:"user_id,omitempty"` // Optional - may not have user account
	User                *User               `gorm:"foreignKey:UserID" json:"user,omitempty"`
	FirstName           string              `gorm:"size:100" json:"first_name"` // Store user info directly
	LastName            string              `gorm:"size:100" json:"last_name"`
	Phone               string              `gorm:"size:20;index" json:"phone"`   // Store phone for lookup
	Type                string              `gorm:"size:50;not null" json:"type"` // "subscription", "roadmap"
	Amount              int                 `gorm:"not null" json:"amount"`       // تومان
	Authority           string              `gorm:"size:100;uniqueIndex" json:"authority"`
	RefID               string              `gorm:"size:100" json:"ref_id"`
	Status              string              `gorm:"size:20;default:'pending'" json:"status"` // "pending", "success", "failed"
	Description         string              `gorm:"size:500" json:"description"`
	LicenseCode         *string             `gorm:"size:255;index" json:"license_code,omitempty"`                       // License code assigned to this payment
	LeadPromoterID      *uint               `gorm:"index" json:"lead_promoter_id,omitempty"`                            // ID of admin user who captured this lead first
	LeadPromoter        *AdminUser          `gorm:"foreignKey:LeadPromoterID" json:"lead_promoter,omitempty"`           // Admin user who captured this lead first
	LandingActivity     *LandingActivity    `gorm:"foreignKey:PaymentTransactionID" json:"landing_activity,omitempty"`  // Landing activity linked to this payment
	PaymentMethod       string              `gorm:"size:50;default:'gateway'" json:"payment_method"`                    // "gateway", "card_to_card", "installment"
	IsInstallment       bool                `gorm:"default:false" json:"is_installment"`                                // Whether this is an installment payment
	InstallmentNumber   *int                `gorm:"default:null" json:"installment_number,omitempty"`                   // 1 or 2 for installment payments
	TotalInstallments   *int                `gorm:"default:null" json:"total_installments,omitempty"`                   // Total number of installments (usually 2)
	NextInstallmentDate *time.Time          `json:"next_installment_date,omitempty"`                                    // Date when next installment is due
	ParentInstallmentID *uint               `gorm:"index" json:"parent_installment_id,omitempty"`                       // ID of first installment (for linking installments)
	ParentInstallment   *PaymentTransaction `gorm:"foreignKey:ParentInstallmentID" json:"parent_installment,omitempty"` // First installment transaction
	WebinarProgramID    *uint               `gorm:"index" json:"webinar_program_id,omitempty"`                          // which WebinarProgram this purchase grants access to (nil = legacy single-webinar payment)
	WebinarProgram      *WebinarProgram     `gorm:"foreignKey:WebinarProgramID" json:"webinar_program,omitempty"`
	CreatedAt           time.Time           `json:"created_at"`
	UpdatedAt           time.Time           `json:"updated_at"`
	DeletedAt           gorm.DeletedAt      `gorm:"index" json:"deleted_at,omitempty"`
}

func (PaymentTransaction) TableName() string {
	return "payment_transactions"
}
