package models

import (
	"time"

	"gorm.io/gorm"
)

// ProgressReport stores the deterministic weekly/monthly rollup numbers (computed
// in Go, never by AI) plus an optional AI-written Persian summary of them
// (roadmap BE-4.1/BE-4.2/BE-4.3 — the Deep Dive dashboard).
type ProgressReport struct {
	gorm.Model
	UserID      uint      `gorm:"not null;index"`
	PeriodType  string    `gorm:"size:10;not null;index"` // weekly | monthly
	PeriodStart time.Time `gorm:"not null;index"`
	PeriodEnd   time.Time `gorm:"not null"`

	TotalSessions      int
	TotalSets          int
	TotalVolumeKg       float64
	TotalPRs            int
	BestDayLabel        string `gorm:"size:50"`
	HeaviestExercise    string `gorm:"size:255"`
	HeaviestWeightKg    float64
	LongestSessionMin   int
	ShortestSessionMin  int
	AvgCaloriesLogged   float64
	PrevPeriodVolumeKg  float64
	VolumeChangePercent float64

	// AnalysisText is the AI-generated human summary of the numbers above (BE-4.3).
	AnalysisText string `gorm:"type:text"`
}
