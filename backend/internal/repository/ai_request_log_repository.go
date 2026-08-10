package repository

import (
	"context"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type AIRequestLogRepository interface {
	Create(ctx context.Context, log *models.AIRequestLog) error
}

type aiRequestLogRepository struct {
	db *gorm.DB
}

func NewAIRequestLogRepository(db *gorm.DB) AIRequestLogRepository {
	return &aiRequestLogRepository{db: db}
}

func (r *aiRequestLogRepository) Create(ctx context.Context, log *models.AIRequestLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}
