package models

import (
	"time"
	"gorm.io/gorm"
)

// License represents a license code that can be assigned to users
type License struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Code        string         `gorm:"size:255;uniqueIndex;not null" json:"code"` // License code (unique)
	IsUsed      bool           `gorm:"default:false;index" json:"is_used"`        // Whether this license has been used
	UserID      *uint          `gorm:"index" json:"user_id,omitempty"`            // User who received this license
	User        *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	PaymentID   *uint          `gorm:"index" json:"payment_id,omitempty"`          // Payment transaction that triggered license assignment
	Payment     *PaymentTransaction `gorm:"foreignKey:PaymentID" json:"payment,omitempty"`
	AssignedAt  *time.Time     `json:"assigned_at,omitempty"`                      // When license was assigned
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

func (License) TableName() string {
	return "licenses"
}

