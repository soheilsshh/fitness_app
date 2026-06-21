package repository

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type DailyFoodLogRepository interface {
	Create(ctx context.Context, log *models.DailyFoodLog) error
	Delete(ctx context.Context, logID uint, userID uint) error
	FindByUserIDAndDate(ctx context.Context, userID uint, date time.Time) ([]models.DailyFoodLog, error)
}

type dailyFoodLogRepository struct {
	db *gorm.DB
}

func NewDailyFoodLogRepository(db *gorm.DB) DailyFoodLogRepository {
	return &dailyFoodLogRepository{db: db}
}

func (r *dailyFoodLogRepository) Create(ctx context.Context, log *models.DailyFoodLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}

func (r *dailyFoodLogRepository) Delete(ctx context.Context, logID uint, userID uint) error {
	res := r.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", logID, userID).
		Delete(&models.DailyFoodLog{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *dailyFoodLogRepository) FindByUserIDAndDate(ctx context.Context, userID uint, date time.Time) ([]models.DailyFoodLog, error) {
	dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	dayEnd := dayStart.Add(24 * time.Hour)

	var list []models.DailyFoodLog
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND log_date >= ? AND log_date < ?", userID, dayStart, dayEnd).
		Order("created_at ASC").
		Find(&list).Error
	return list, err
}
