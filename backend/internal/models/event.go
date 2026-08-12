package models

import (
	"time"

	"gorm.io/gorm"
)

const (
	EventTypeOffline = "offline"
	EventTypeOnline  = "online"
)

// Event is a community event/competition (roadmap F2/BE-7.3): in-person or
// virtual, optionally with a prize, always opt-in.
type Event struct {
	gorm.Model
	Title       string    `gorm:"size:255;not null"`
	Description string    `gorm:"type:text"`
	EventType   string    `gorm:"size:20;not null"` // offline | online
	Prize       string    `gorm:"size:255"`
	Location    string    `gorm:"size:255"`
	EventDate   time.Time `gorm:"not null;index"`
	IsActive    bool      `gorm:"not null;default:true"`
}

// EventParticipation records a user's opt-in RSVP to an Event; unique per (event, user).
type EventParticipation struct {
	gorm.Model
	EventID uint `gorm:"not null;uniqueIndex:idx_event_participation_unique"`
	UserID  uint `gorm:"not null;uniqueIndex:idx_event_participation_unique"`
}
