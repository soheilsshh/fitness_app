package models

import (
	"time"

	"gorm.io/gorm"
)

// FunnelAIAnalysis stores the AI body-analysis packet from the public /analysis
// funnel, keyed by phone so later nutrition/workout AI can reuse it.
type FunnelAIAnalysis struct {
	gorm.Model

	Phone        string `gorm:"size:20;index:idx_funnel_ai_phone_created,priority:1;not null"`
	UserID       *uint  `gorm:"index"`
	FunnelLeadID *uint  `gorm:"index"`

	Gender             string `gorm:"size:30"`
	PrimaryGoal        string `gorm:"size:30;not null;default:''"`
	ActivityLevel      string `gorm:"size:30"`
	TrainingFrequency  string `gorm:"size:30"`
	TrainingEnv        string `gorm:"size:30"`
	Experience         string `gorm:"size:30"`
	NutritionChallenge string `gorm:"size:30"`
	SleepHours         string `gorm:"size:30"`
	StressLevel        string `gorm:"size:30"`
	MainObstacle       string `gorm:"size:30"`
	Commitment         string `gorm:"size:30"`
	Scenario           string `gorm:"size:1"`

	Age      int     `gorm:"not null;default:0"`
	HeightCm float64 `gorm:"not null;default:0"`
	WeightKg float64 `gorm:"not null;default:0"`

	// AnalysisJSON is the full FunnelAnalysisDTO (charts + narrative).
	AnalysisJSON   string `gorm:"type:longtext"`
	AnalysisSource string `gorm:"size:20"` // openai | mock | fallback
	AIWarning      string `gorm:"type:text"`
	StatusSummary  string `gorm:"type:text"`
	CustomSolution string `gorm:"type:text"`
	RoutePrediction string `gorm:"type:text"`
	SuccessPct     int    `gorm:"not null;default:0"`

	// AnswersJSON keeps a raw quiz snapshot for future fields.
	AnswersJSON string `gorm:"type:text"`

	AnalyzedAt *time.Time
}

func (FunnelAIAnalysis) TableName() string {
	return "funnel_ai_analyses"
}
