package models

// User role constants used across middleware, services, and JWT claims.
const (
	RoleStudent = "student"
	RoleCoach   = "coach"
	RoleAdmin   = "admin"
)

// IsValidRole reports whether role is a known application role.
func IsValidRole(role string) bool {
	switch role {
	case RoleStudent, RoleCoach, RoleAdmin:
		return true
	default:
		return false
	}
}
