package models

import (
	"time"

	"gorm.io/gorm"
)

// LandingActivityStatus represents the status of a user's activity on the landing page
type LandingActivityStatus string

const (
	// StatusClickedRegistrationLink - User clicked on registration link from webinar page
	LandingStatusClickedRegistrationLink LandingActivityStatus = "clicked_registration_link"
	// StatusEnteredLanding - User entered the landing page (AIPage)
	LandingStatusEnteredLanding LandingActivityStatus = "entered_landing"
	// StatusInLanding - User is currently on landing page (tracking minutes)
	LandingStatusInLanding LandingActivityStatus = "in_landing"
	// StatusLeftLanding - User left the landing page (closed tab/went to background)
	LandingStatusLeftLanding LandingActivityStatus = "left_landing"
	// StatusClickedCardToCard - User clicked on card-to-card payment button
	LandingStatusClickedCardToCard LandingActivityStatus = "clicked_card_to_card"
	// StatusCopiedCardToCard - User copied card-to-card number
	LandingStatusCopiedCardToCard LandingActivityStatus = "copied_card_to_card"
	// StatusClickedInstallment - User clicked on installment payment button
	LandingStatusClickedInstallment LandingActivityStatus = "clicked_installment"
	// StatusCopiedInstallmentCard - User copied installment card number
	LandingStatusCopiedInstallmentCard LandingActivityStatus = "copied_installment_card"
	// StatusClickedPaymentButton - User clicked on "Permanent Subscription" button
	LandingStatusClickedPaymentButton LandingActivityStatus = "clicked_payment_button"
	// StatusPaymentInitiated - User initiated payment (redirected to payment gateway)
	LandingStatusPaymentInitiated LandingActivityStatus = "payment_initiated"
	// StatusPaymentSuccess - Payment was successful
	LandingStatusPaymentSuccess LandingActivityStatus = "payment_success"
	// StatusPaymentFailed - Payment failed
	LandingStatusPaymentFailed LandingActivityStatus = "payment_failed"
	// StatusLandingPopupViewed - User viewed the "سیستم پولسازی مناسب شما" popup
	LandingStatusLandingPopupViewed LandingActivityStatus = "landing_popup_viewed"
)

// LandingActivity represents a user's activity on the landing page
type LandingActivity struct {
	ID                     uint                  `gorm:"primaryKey" json:"id"`
	Phone                  string                `gorm:"size:20;index" json:"phone"` // User's phone number
	FirstName              string                `gorm:"size:100" json:"first_name,omitempty"`
	LastName               string                `gorm:"size:100" json:"last_name,omitempty"`
	Status                 LandingActivityStatus `gorm:"size:50;index" json:"status"`                   // Current status
	LandingStartTime       *time.Time            `gorm:"index" json:"landing_start_time,omitempty"`     // When user first entered landing
	LandingEndTime         *time.Time            `json:"landing_end_time,omitempty"`                    // When user left landing (if tracked)
	LandingDurationMinutes int                   `gorm:"default:0" json:"landing_duration_minutes"`     // Total minutes spent on landing
	LastStatusUpdate       time.Time             `gorm:"index" json:"last_status_update"`               // Last time status was updated
	Metadata               string                `gorm:"type:text" json:"metadata,omitempty"`           // JSON metadata for additional info
	PaymentTransactionID   *uint                 `gorm:"index" json:"payment_transaction_id,omitempty"` // Link to payment if exists
	PaymentTransaction     *PaymentTransaction   `gorm:"foreignKey:PaymentTransactionID" json:"payment_transaction,omitempty"`
	CreatedAt              time.Time             `json:"created_at"`
	UpdatedAt              time.Time             `json:"updated_at"`
	DeletedAt              gorm.DeletedAt        `gorm:"index" json:"deleted_at,omitempty"`
}

func (LandingActivity) TableName() string {
	return "landing_activities"
}
