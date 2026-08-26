package models

import "time"

// WebinarProgram is one of N scheduled webinar "shows" — its own video,
// its own airtime window, its own selling state, its own marketing
// comments. The older `Webinar` model stays a single row that the scheduler
// still reads (streaming, comment-offset timing, workflows all key off it)
// — a background sync copies whichever WebinarProgram is currently active
// onto that singleton row, so none of that existing machinery needed to
// change to support more than one program.
type WebinarProgram struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Slug      string    `gorm:"uniqueIndex;size:100;not null" json:"slug"`
	Title     string    `json:"title"`
	VideoURL  string    `json:"video_url"`
	StartAt   time.Time `json:"start_at"`
	EndAt     time.Time `json:"end_at"`

	// Selling: both must be true/past for the buy button to show.
	IsSellingEnabled  bool       `gorm:"default:false" json:"is_selling_enabled"`
	BuyButtonRevealAt *time.Time `json:"buy_button_reveal_at"` // the "golden time" — nil means never reveal even if selling is enabled
	Price             int        `json:"price"`

	// CommentsJSON holds the same TimeRange[] shape the legacy
	// src/data/timedComments.ts exported, as JSON text — served live via
	// API instead of baked into a frontend build.
	CommentsJSON string `gorm:"type:longtext" json:"comments_json"`

	IsActive  bool      `gorm:"default:true" json:"is_active"` // soft on/off without deleting
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
