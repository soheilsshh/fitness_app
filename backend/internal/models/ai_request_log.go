package models

import "gorm.io/gorm"

// AIRequestLog stores each structured/chat AI call for debugging and cost tracking.
type AIRequestLog struct {
	gorm.Model
	UserID           uint   `gorm:"index;not null"`
	RequestType      string `gorm:"size:64;index;not null"` // nutrition_plan, workout_plan, chat, ...
	Persona          string `gorm:"size:32"`
	// PromptVersion tags which persona/prompt revision produced this call
	// (roadmap Phase 5: prompt versioning) — see ai.PromptVersion.
	PromptVersion    string `gorm:"size:64;index"`
	InputText        string `gorm:"type:text"`
	OutputJSON       string `gorm:"type:text"`
	ModelName        string `gorm:"size:128"`
	Success          bool   `gorm:"not null;default:false"`
	ErrorMsg         string `gorm:"type:text"`
	LatencyMs        int    `gorm:"not null;default:0"`
	PromptTokens     int    `gorm:"not null;default:0"`
	CompletionTokens int    `gorm:"not null;default:0"`
}
