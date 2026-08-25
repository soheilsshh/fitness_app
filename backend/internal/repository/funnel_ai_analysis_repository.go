package repository

import (
	"context"
	"strings"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type FunnelAIAnalysisRepository interface {
	Create(ctx context.Context, row *models.FunnelAIAnalysis) error
	Update(ctx context.Context, row *models.FunnelAIAnalysis) error
	FindLatestByPhone(ctx context.Context, phone string) (*models.FunnelAIAnalysis, error)
	FindLatestByUserID(ctx context.Context, userID uint) (*models.FunnelAIAnalysis, error)
	LinkUserIDByPhone(ctx context.Context, phone string, userID uint) error
}

type funnelAIAnalysisRepository struct {
	db *gorm.DB
}

func NewFunnelAIAnalysisRepository(db *gorm.DB) FunnelAIAnalysisRepository {
	return &funnelAIAnalysisRepository{db: db}
}

func (r *funnelAIAnalysisRepository) Create(ctx context.Context, row *models.FunnelAIAnalysis) error {
	return r.db.WithContext(ctx).Create(row).Error
}

func (r *funnelAIAnalysisRepository) Update(ctx context.Context, row *models.FunnelAIAnalysis) error {
	return r.db.WithContext(ctx).Save(row).Error
}

func (r *funnelAIAnalysisRepository) FindLatestByPhone(ctx context.Context, phone string) (*models.FunnelAIAnalysis, error) {
	phone = strings.TrimSpace(phone)
	var row models.FunnelAIAnalysis
	err := r.db.WithContext(ctx).
		Where("phone = ?", phone).
		Order("created_at DESC").
		First(&row).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *funnelAIAnalysisRepository) FindLatestByUserID(ctx context.Context, userID uint) (*models.FunnelAIAnalysis, error) {
	var row models.FunnelAIAnalysis
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		First(&row).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *funnelAIAnalysisRepository) LinkUserIDByPhone(ctx context.Context, phone string, userID uint) error {
	phone = strings.TrimSpace(phone)
	if phone == "" || userID == 0 {
		return nil
	}
	return r.db.WithContext(ctx).
		Model(&models.FunnelAIAnalysis{}).
		Where("phone = ? AND (user_id IS NULL OR user_id = 0)", phone).
		Update("user_id", userID).Error
}
