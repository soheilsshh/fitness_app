package models

import "time"

type ContentTaskStatus string

const (
	ContentTaskStatusFinalIdeas      ContentTaskStatus = "final_ideas"
	ContentTaskStatusWriting         ContentTaskStatus = "writing"
	ContentTaskStatusPreProduction   ContentTaskStatus = "pre_production"
	ContentTaskStatusRecording       ContentTaskStatus = "recording"
	ContentTaskStatusEditing        ContentTaskStatus = "editing"
	ContentTaskStatusPublished      ContentTaskStatus = "published"
)

type ContentTaskPriority string

const (
	ContentTaskPriorityLow    ContentTaskPriority = "low"
	ContentTaskPriorityMedium ContentTaskPriority = "medium"
	ContentTaskPriorityHigh   ContentTaskPriority = "high"
	ContentTaskPriorityUrgent ContentTaskPriority = "urgent"
)

// ContentTask represents a content creation task (personal workspace)
type ContentTask struct {
	ID          uint                `gorm:"primaryKey" json:"id"`
	Title       string              `gorm:"type:varchar(255);not null" json:"title"`
	Description string              `gorm:"type:text" json:"description"`
	Status      ContentTaskStatus   `gorm:"type:varchar(50);default:'final_ideas';index" json:"status"`
	Priority    ContentTaskPriority `gorm:"type:varchar(50);default:'medium';index" json:"priority"`
	Tags        StringArray         `gorm:"type:json" json:"tags,omitempty"`

	// Personal task - always assigned to creator
	CreatorID uint       `gorm:"index;not null" json:"creator_id"`
	Creator   *AdminUser `gorm:"foreignKey:CreatorID" json:"creator,omitempty"`

	DueDate    *time.Time `json:"due_date"`
	BoardOrder int        `gorm:"default:0;index" json:"board_order"`

	// Social media URLs
	InstagramURL *string `gorm:"type:varchar(500)" json:"instagram_url,omitempty"`
	TwitterURL   *string `gorm:"type:varchar(500)" json:"twitter_url,omitempty"`
	TikTokURL    *string `gorm:"type:varchar(500)" json:"tiktok_url,omitempty"`
	YouTubeURL   *string `gorm:"type:varchar(500)" json:"youtube_url,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

