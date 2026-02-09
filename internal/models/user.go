package models

import "time"

// UserRole represents the type of user in the system.
type UserRole string

const (
	RoleAdmin   UserRole = "admin"
	RoleStudent UserRole = "student"
)

// User is the core user entity in the system.
//
// Password is stored as a bcrypt hash.
type User struct {
	ID       uint     `gorm:"primaryKey" json:"id"`
	Name     string   `gorm:"size:255;not null" json:"name"`
	Email    string   `gorm:"size:255;uniqueIndex;not null" json:"email"`
	Password string   `gorm:"size:255;not null" json:"-"`
	Role     UserRole `gorm:"type:varchar(20);not null;default:'student'" json:"role"`

	// Relationships
	CoachProfile  *CoachProfile  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"coach_profile,omitempty"`
	Subscriptions []Subscription `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"subscriptions,omitempty"`
	Transactions  []Transaction  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"transactions,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
