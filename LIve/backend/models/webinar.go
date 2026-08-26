package models

import "time"

type Webinar struct {
	ID              uint      `gorm:"primaryKey;index" json:"id"`
	Title           string    `json:"title"`
	StartTime       time.Time `json:"start_time"`
	EndTime         time.Time `json:"end_time"`
	VideoURL        string    `json:"video_url"`
	Capacity        int       `json:"capacity"`
	RegisteredCount int       `json:"registered_count"`
	IsLive          bool      `json:"is_live"`
}
