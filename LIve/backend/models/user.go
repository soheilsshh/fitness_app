package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// PopupProgress represents a user's progress inside the ThankYou popup flow.
// This is a SINGLE state (never multiple flags).
type PopupProgress string

const (
	PopupProgressNone        PopupProgress = "NONE"
	PopupProgressEntered     PopupProgress = "POPUP_ENTERED"
	PopupProgressGiftClicked PopupProgress = "POPUP_GIFT_CLICKED"
	PopupProgressCommitment  PopupProgress = "POPUP_COMMITMENT"
	PopupProgressCompleted   PopupProgress = "POPUP_COMPLETED"
)

type User struct {
	ID uint `gorm:"primaryKey" json:"id"`
	// IdentityID is a stable identity across multiple registrations (cycles).
	// Each registration creates a new User row, but Identity stays the same for the same phone.
	IdentityID        *uint         `gorm:"index" json:"identity_id,omitempty"`
	Identity          *UserIdentity `gorm:"foreignKey:IdentityID" json:"identity,omitempty"`
	FirstName         string        `json:"first_name"`
	LastName          string        `json:"last_name"`
	Phone             string        `gorm:"index" json:"phone"`                                           // Index for phone lookups
	RegisteredAt      time.Time     `gorm:"index" json:"registered_at"`                                   // Index for date range queries
	PromoterID        *uint         `gorm:"index" json:"promoter_id,omitempty"`                           // ID of admin user who referred this user
	Promoter          *AdminUser    `gorm:"foreignKey:PromoterID" json:"promoter,omitempty"`              // Admin user who referred this user
	WebinarID         *uint         `gorm:"index" json:"webinar_id"`                                      // For workflow targeting
	FirstJoinAt       *time.Time    `gorm:"index" json:"first_join_at"`                                   // First time joined webinar
	LastLeaveAt       *time.Time    `json:"last_leave_at"`                                                // Last time left webinar
	TotalWatchSeconds int           `gorm:"default:0" json:"total_watch_seconds"`                         // Total watch time in seconds
	CTAClickedAt      *time.Time    `json:"cta_clicked_at"`                                               // When user clicked CTA/purchase link
	PurchaseStatus    string        `gorm:"type:varchar(20);default:'none';index" json:"purchase_status"` // none, installment, full
	LicenseCode       *string       `gorm:"size:255;index" json:"license_code,omitempty"`                 // License code assigned to user
	Tags              StringArray   `gorm:"type:json" json:"tags"`                                        // Custom tags for segmentation

	// Popup progress tracking (used for smart SMS follow-ups).
	PopupProgress       PopupProgress `gorm:"type:varchar(32);index;default:'NONE'" json:"popup_progress"`
	LastPopupActivityAt *time.Time    `gorm:"index" json:"last_popup_activity_at,omitempty"`
}

// StringArray is a custom type for storing string arrays in MySQL as JSON
type StringArray []string

// Scan implements the sql.Scanner interface
func (s *StringArray) Scan(value interface{}) error {
	if value == nil {
		*s = []string{}
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		*s = []string{}
		return nil
	}

	if len(bytes) == 0 {
		*s = []string{}
		return nil
	}

	return json.Unmarshal(bytes, s)
}

// Value implements the driver.Valuer interface
func (s StringArray) Value() (driver.Value, error) {
	if len(s) == 0 {
		return "[]", nil
	}
	return json.Marshal(s)
}
