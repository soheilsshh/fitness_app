package models

import (
	"time"

	"gorm.io/gorm"
)

// PaymentSMSTriggerType represents the trigger type for payment SMS messages
type PaymentSMSTriggerType string

const (
	// PaymentSMSTriggerClickedCardToCard - User clicked on card-to-card payment button
	PaymentSMSTriggerClickedCardToCard PaymentSMSTriggerType = "clicked_card_to_card"
	// PaymentSMSTriggerCopiedCardToCard - User copied card-to-card number
	PaymentSMSTriggerCopiedCardToCard PaymentSMSTriggerType = "copied_card_to_card"
	// PaymentSMSTriggerClickedInstallment - User clicked on installment payment button
	PaymentSMSTriggerClickedInstallment PaymentSMSTriggerType = "clicked_installment"
	// PaymentSMSTriggerCopiedInstallmentCard - User copied installment card number
	PaymentSMSTriggerCopiedInstallmentCard PaymentSMSTriggerType = "copied_installment_card"
	// PaymentSMSTriggerClickedPaymentButton - User clicked on "Permanent Subscription" button
	PaymentSMSTriggerClickedPaymentButton PaymentSMSTriggerType = "clicked_payment_button"
	// PaymentSMSTriggerEnteredLanding - User entered the landing page
	PaymentSMSTriggerEnteredLanding PaymentSMSTriggerType = "entered_landing"
)

// PaymentSMSMessage represents a scheduled SMS message configuration for payment triggers
type PaymentSMSMessage struct {
	ID           uint                  `gorm:"primaryKey" json:"id"`
	TriggerType  PaymentSMSTriggerType `gorm:"size:50;index;uniqueIndex:idx_trigger_delay" json:"trigger_type"` // Type of trigger (e.g., copied_card_to_card)
	DelayMinutes int                   `gorm:"default:0;uniqueIndex:idx_trigger_delay" json:"delay_minutes"`    // Delay in minutes after trigger (e.g., 10, 30)
	MessageText  string                `gorm:"type:text" json:"message_text"`                                   // SMS message content
	IsActive     bool                  `gorm:"default:true;index" json:"is_active"`                             // Whether this message is active
	CreatedAt    time.Time             `json:"created_at"`
	UpdatedAt    time.Time             `json:"updated_at"`
	DeletedAt    gorm.DeletedAt        `gorm:"index" json:"deleted_at,omitempty"`
}

func (PaymentSMSMessage) TableName() string {
	return "payment_sms_messages"
}

// PaymentSMSMessageLog represents a log entry for sent payment SMS messages
type PaymentSMSMessageLog struct {
	ID                  uint                  `gorm:"primaryKey" json:"id"`
	PaymentSMSMessageID uint                  `gorm:"index" json:"payment_sms_message_id"` // Reference to PaymentSMSMessage
	PaymentSMSMessage   *PaymentSMSMessage    `gorm:"foreignKey:PaymentSMSMessageID" json:"payment_sms_message,omitempty"`
	LandingActivityID   *uint                 `gorm:"index" json:"landing_activity_id,omitempty"` // Reference to LandingActivity that triggered this
	LandingActivity     *LandingActivity      `gorm:"foreignKey:LandingActivityID" json:"landing_activity,omitempty"`
	Phone               string                `gorm:"size:20;index" json:"phone"`         // Recipient phone number
	TriggerType         PaymentSMSTriggerType `gorm:"size:50;index" json:"trigger_type"`  // Type of trigger
	MessageText         string                `gorm:"type:text" json:"message_text"`      // Message that was sent
	TriggeredAt         time.Time             `gorm:"index" json:"triggered_at"`          // When the trigger occurred
	ScheduledSendTime   time.Time             `gorm:"index" json:"scheduled_send_time"`   // When the message was scheduled to be sent
	SentAt              *time.Time            `gorm:"index" json:"sent_at,omitempty"`     // When the message was actually sent
	Success             bool                  `gorm:"default:false;index" json:"success"` // Whether sending was successful
	Error               string                `gorm:"type:text" json:"error,omitempty"`   // Error message if failed
	CreatedAt           time.Time             `json:"created_at"`
}

func (PaymentSMSMessageLog) TableName() string {
	return "payment_sms_message_logs"
}

// LicenseSMSMessage represents a license SMS message configuration
// This is sent immediately after successful gateway payment
type LicenseSMSMessage struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	PatternCode int            `gorm:"not null;default:403249" json:"pattern_code"` // Melipayamak pattern code
	IsActive    bool           `gorm:"default:true;index" json:"is_active"`         // Whether this message is active
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

func (LicenseSMSMessage) TableName() string {
	return "license_sms_messages"
}

// LicenseSMSMessageLog represents a log entry for sent license SMS messages
type LicenseSMSMessageLog struct {
	ID                   uint                `gorm:"primaryKey" json:"id"`
	LicenseSMSMessageID  *uint               `gorm:"index" json:"license_sms_message_id,omitempty"`
	LicenseSMSMessage    *LicenseSMSMessage  `gorm:"foreignKey:LicenseSMSMessageID" json:"license_sms_message,omitempty"`
	PaymentTransactionID *uint               `gorm:"index" json:"payment_transaction_id,omitempty"` // Reference to PaymentTransaction
	PaymentTransaction   *PaymentTransaction `gorm:"foreignKey:PaymentTransactionID" json:"payment_transaction,omitempty"`
	Phone                string              `gorm:"size:20;index" json:"phone"`         // Recipient phone number
	FullName             string              `gorm:"size:200" json:"full_name"`          // Full name (variable {0})
	LicenseCode          string              `gorm:"size:100" json:"license_code"`       // License code (variable {1})
	PatternCode          int                 `gorm:"not null" json:"pattern_code"`       // Pattern code used
	SentAt               time.Time           `gorm:"index" json:"sent_at"`               // When the message was sent
	Success              bool                `gorm:"default:false;index" json:"success"` // Whether sending was successful
	Error                string              `gorm:"type:text" json:"error,omitempty"`   // Error message if failed
	CreatedAt            time.Time           `json:"created_at"`
}

func (LicenseSMSMessageLog) TableName() string {
	return "license_sms_message_logs"
}
