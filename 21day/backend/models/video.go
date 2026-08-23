package models

type Video struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Duration    string `json:"duration"`
	Code        string `json:"code"`
	Points      int    `json:"points"`
} 