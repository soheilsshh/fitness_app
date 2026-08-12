package models

import (
	"time"

	"gorm.io/gorm"
)

const (
	CoachSessionTypeInPerson = "in_person"
	CoachSessionTypeOnline   = "online"

	CoachSessionStatusScheduled = "scheduled"
	CoachSessionStatusCompleted = "completed"
	CoachSessionStatusCancelled = "cancelled"
)

// CoachSession is a scheduled 1:1 session between a coach and a student
// (roadmap G1/BE-9.1): in-person or online, count/cadence varies by plan.
type CoachSession struct {
	gorm.Model
	CoachID         uint      `gorm:"not null;index"`
	StudentID       uint      `gorm:"not null;index"`
	Type            string    `gorm:"size:20;not null"` // in_person | online
	Status          string    `gorm:"size:20;not null;default:scheduled"`
	ScheduledAt     time.Time `gorm:"not null;index"`
	DurationMinutes int       `gorm:"not null;default:30"`
	Notes           string    `gorm:"type:text"`
}

// CoachReview logs a coach's periodic check-in on a student (roadmap G3/BE-9.3/BE-9.4):
// used both to compute "last reviewed" for the overdue reminder and to store
// the feedback text sent to the student.
type CoachReview struct {
	gorm.Model
	CoachID   uint   `gorm:"not null;index"`
	StudentID uint   `gorm:"not null;index"`
	Feedback  string `gorm:"type:text;not null"`
}
