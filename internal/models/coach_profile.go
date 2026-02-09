package models

import "time"

// CoachProfile stores coach-specific profile data for a User with Role=admin.
type CoachProfile struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	UserID    uint   `gorm:"uniqueIndex;not null" json:"user_id"`
	User      User   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user"`
	Bio       string `gorm:"type:text" json:"bio"`
	Specialty string `gorm:"size:255" json:"specialty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}


