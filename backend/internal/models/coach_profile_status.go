package models

// Coach profile approval workflow statuses.
const (
	CoachProfileStatusPending   = "pending"
	CoachProfileStatusReviewing = "reviewing"
	CoachProfileStatusApproved  = "approved"
)

// ValidCoachProfileStatuses returns all supported coach profile status values.
func ValidCoachProfileStatuses() []string {
	return []string{
		CoachProfileStatusPending,
		CoachProfileStatusReviewing,
		CoachProfileStatusApproved,
	}
}

// IsValidCoachProfileStatus reports whether status is a known coach profile status.
func IsValidCoachProfileStatus(status string) bool {
	switch status {
	case CoachProfileStatusPending, CoachProfileStatusReviewing, CoachProfileStatusApproved:
		return true
	default:
		return false
	}
}
