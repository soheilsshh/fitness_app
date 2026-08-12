package repository

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type ProgressReportRepository interface {
	Create(ctx context.Context, r *models.ProgressReport) error
	ListByUser(ctx context.Context, userID uint, periodType string, page, pageSize int) ([]models.ProgressReport, int64, error)
	FindLatestBefore(ctx context.Context, userID uint, periodType string, before time.Time) (*models.ProgressReport, error)
	ExistsForPeriod(ctx context.Context, userID uint, periodType string, periodStart time.Time) (bool, error)
}

type progressReportRepository struct {
	db *gorm.DB
}

func NewProgressReportRepository(db *gorm.DB) ProgressReportRepository {
	return &progressReportRepository{db: db}
}

func (r *progressReportRepository) Create(ctx context.Context, rep *models.ProgressReport) error {
	return r.db.WithContext(ctx).Create(rep).Error
}

func (r *progressReportRepository) ListByUser(ctx context.Context, userID uint, periodType string, page, pageSize int) ([]models.ProgressReport, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}
	if pageSize > 50 {
		pageSize = 50
	}

	db := r.db.WithContext(ctx).Model(&models.ProgressReport{}).Where("user_id = ?", userID)
	if periodType != "" {
		db = db.Where("period_type = ?", periodType)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	var list []models.ProgressReport
	if err := db.Order("period_start DESC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *progressReportRepository) FindLatestBefore(ctx context.Context, userID uint, periodType string, before time.Time) (*models.ProgressReport, error) {
	var rep models.ProgressReport
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND period_type = ? AND period_start < ?", userID, periodType, before).
		Order("period_start DESC").
		First(&rep).Error
	if err != nil {
		return nil, err
	}
	return &rep, nil
}

func (r *progressReportRepository) ExistsForPeriod(ctx context.Context, userID uint, periodType string, periodStart time.Time) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.ProgressReport{}).
		Where("user_id = ? AND period_type = ? AND period_start = ?", userID, periodType, periodStart).
		Count(&count).Error
	return count > 0, err
}
