package models

import "gorm.io/gorm"

// CommunityPost is a student-authored post in the social feed (roadmap F1/BE-7.1):
// share a workout, a body photo, or general progress with other members.
type CommunityPost struct {
	gorm.Model
	UserID   uint   `gorm:"not null;index"`
	Content  string `gorm:"type:text"`
	ImageURL string `gorm:"size:512"`
	// MediaType distinguishes an image vs a video at ImageURL ("image" |
	// "video"); empty when ImageURL is empty. Roadmap: فید عکس/فیلم pass.
	MediaType string `gorm:"size:10"`
	// Category tags which post template the author picked (workout, nutrition,
	// progress, record, question, tip) — empty means a free-form general post.
	// Drives the feed filter tabs (roadmap F1 UX pass).
	Category     string `gorm:"size:20;index"`
	// Metadata is optional JSON for structured share cards (e.g. exercise names
	// on a progress post). Empty for free-form posts.
	Metadata     string `gorm:"type:text"`
	LikeCount    int    `gorm:"not null;default:0"`
	CommentCount int    `gorm:"not null;default:0"`
	// IsHidden lets admins moderate without a hard delete.
	IsHidden bool `gorm:"not null;default:false"`
}

// PostCategory values recognized by the feed's "ready-made post" templates.
const (
	PostCategoryWorkout   = "workout"
	PostCategoryNutrition = "nutrition"
	PostCategoryProgress  = "progress"
	PostCategoryRecord    = "record"
	PostCategoryQuestion  = "question"
	PostCategoryTip       = "tip"
)

// Post media type values.
const (
	PostMediaTypeImage = "image"
	PostMediaTypeVideo = "video"
)

// ValidPostCategories lists all recognized values (empty string is also valid — general post).
var ValidPostCategories = map[string]bool{
	PostCategoryWorkout:   true,
	PostCategoryNutrition: true,
	PostCategoryProgress:  true,
	PostCategoryRecord:    true,
	PostCategoryQuestion:  true,
	PostCategoryTip:       true,
}

// PostComment is a comment on a CommunityPost.
type PostComment struct {
	gorm.Model
	PostID  uint   `gorm:"not null;index"`
	UserID  uint   `gorm:"not null;index"`
	Content string `gorm:"type:text;not null"`
}

// PostLike is a like from a user on a post; unique per (post, user).
type PostLike struct {
	gorm.Model
	PostID uint `gorm:"not null;uniqueIndex:idx_post_like_unique"`
	UserID uint `gorm:"not null;uniqueIndex:idx_post_like_unique"`
}
