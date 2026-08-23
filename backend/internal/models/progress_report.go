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
	HeaviestReps        int
	LongestSessionMin   int
	ShortestSessionMin  int
	AvgCaloriesLogged   float64
	AvgProteinLogged    float64
	PrevPeriodVolumeKg  float64
	VolumeChangePercent float64

	// --- Card 1 (عملکرد تمرین) extras ---
	AvgSessionMin        int
	LegSessionCount      int
	UpperSessionCount    int
	MostImprovedExercise string `gorm:"size:255"`
	MostImprovedPercent  float64

	// --- Card 2 (تغییرات بدنی), from DailyCheckIn/WeeklyCheckIn ---
	WaistChangeCm      float64
	AvgWeightChangeKg  float64
	BodyTrendLabel     string `gorm:"size:30"` // improving | stable | needs_attention
	CheckInCount       int
	StartWeightKg      float64
	CurrentWeightKg    float64
	StartWaistCm       float64
	CurrentWaistCm     float64

	// --- Card 3 (ریکاوری و وضعیت بدن), from DailyCheckIn + post-workout survey ---
	AvgSleepQuality         float64
	AvgFeelingScore         float64
	StreakDays              int
	CommonPainArea          string `gorm:"size:20"`
	PainSeverityLabel       string `gorm:"size:20"` // AI-inferred from PainNote text — the one non-deterministic field on this row
	GoodSleepNights         int
	GoodSleepNightsTotal    int
	HighEnergySessions      int
	HighEnergySessionsTotal int
	DiscomfortSessions      int

	// AnalysisText is the AI-generated human summary of the numbers above (BE-4.3).
	AnalysisText string `gorm:"type:text"`

	// PainNotesForAI is a transient scratch field (never persisted — gorm:"-")
	// carrying the raw PainNote text for CommonPainArea from computeRecovery to
	// generateAnalysisText within a single ComputeAndSaveReport call, so the AI
	// prompt can infer PainSeverityLabel from the actual wording.
	PainNotesForAI string `gorm:"-"`
}
