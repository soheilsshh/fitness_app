package models

import "time"

type Payment struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	UserID    uint       `json:"user_id"`
	Phone     string     `json:"phone"`
	Amount    int        `json:"amount"`
	Authority string     `json:"authority" gorm:"index"`
	RefID     string     `json:"ref_id"`
	Status    string     `json:"status" gorm:"default:pending"` // pending, success, failed
	CreatedAt *time.Time `json:"created_at"`
}
