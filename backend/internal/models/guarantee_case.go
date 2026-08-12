package models

import "gorm.io/gorm"

const (
	GuaranteeTypeResult  = "result"  // conditional result guarantee (roadmap I1)
	GuaranteeTypeQuality = "quality" // service-quality guarantee (roadmap I2)

	GuaranteeStatusPending    = "pending"
	GuaranteeStatusApproved   = "approved"
	GuaranteeStatusRejected   = "rejected"

	GuaranteeResolutionFreeExtension = "free_extension"
	GuaranteeResolutionRefund        = "refund"
	GuaranteeResolutionNone          = ""
)

// GuaranteeCase is a student's claim under the platform guarantees (roadmap
// I1/I2, BE-10.1): the compliance percentages are a snapshot computed at
// request time from nutrition/workout logs and coach sessions, so admin
// review has objective numbers instead of just the student's narrative.
type GuaranteeCase struct {
	gorm.Model
	UserID         uint   `gorm:"not null;index"`
	SubscriptionID uint   `gorm:"not null;index"`
	CoachID        uint   `gorm:"not null;index"`
	Type           string `gorm:"size:20;not null"` // result | quality
	Status         string `gorm:"size:20;not null;default:pending"`
	Reason         string `gorm:"type:text;not null"`

	// Compliance snapshot at submission time (BE-10.2).
	NutritionCompliancePercent float64 `gorm:"not null;default:0"`
	WorkoutCompliancePercent   float64 `gorm:"not null;default:0"`
	CoachSessionsCount         int     `gorm:"not null;default:0"`

	Resolution      string `gorm:"size:30"` // free_extension | refund | ""
	ResolutionNotes string `gorm:"type:text"`
	ReviewedByAdminID *uint
}
