package models

import "time"

type ChatMessage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    *uint     `json:"user_id"`
	Username  string    `json:"username"`
	Message   string    `json:"message"`
	Timestamp time.Time `gorm:"index" json:"timestamp"`
	IsAdmin   bool      `json:"is_admin"`
	ReplyTo   *uint     `json:"reply_to"`
}
