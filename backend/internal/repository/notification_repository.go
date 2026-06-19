package repository

import (
	"context"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type NotificationRepository interface {
	ListRecentByUserID(ctx context.Context, userID uint, limit int) ([]models.Notification, error)
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) ListRecentByUserID(ctx context.Context, userID uint, limit int) ([]models.Notification, error) {
	if limit <= 0 {
		limit = 5
	}
	var list []models.Notification
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&list).Error
	return list, err
}
