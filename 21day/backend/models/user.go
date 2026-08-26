package models

import "time"

type User struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	FirstName string     `json:"first_name"`
	LastName  string     `json:"last_name"`
	Phone     string     `json:"phone" gorm:"unique"`
	CreatedAt *time.Time `json:"created_at"`
}
