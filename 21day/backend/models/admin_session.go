package models

import "time"

type AdminSession struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Token     string    `json:"-" gorm:"unique;size:64"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}
