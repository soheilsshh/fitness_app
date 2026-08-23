package models

import "time"

// UserIdentity is a stable identity for a phone number across multiple registrations.
// A "registration cycle" is represented by a User row (users.id).
type UserIdentity struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Phone     string    `gorm:"size:20;uniqueIndex" json:"phone"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (UserIdentity) TableName() string {
	return "user_identities"
}
