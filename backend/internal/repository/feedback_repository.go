package repository

import (
	"context"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type FeedbackRepository interface {
	Create(ctx context.Context, f *models.Feedback) error
	List(ctx context.Context, page, pageSize int) ([]models.Feedback, int64, error)
}

type feedbackRepository struct {
	db *gorm.DB
}

func NewFeedbackRepository(db *gorm.DB) FeedbackRepository {
	return &feedbackRepository{db: db}
}

func (r *feedbackRepository) Create(ctx context.Context, f *models.Feedback) error {
	return r.db.WithContext(ctx).Create(f).Error
}

func (r *feedbackRepository) List(ctx context.Context, page, pageSize int) ([]models.Feedback, int64, error) {
	db := r.db.WithContext(ctx).Model(&models.Feedback{})
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize
	var list []models.Feedback
	if err := db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}
