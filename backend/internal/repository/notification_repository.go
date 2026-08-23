package repository

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type NotificationRepository interface {
	ListRecentByUserID(ctx context.Context, userID uint, limit int) ([]models.Notification, error)
	Create(ctx context.Context, n *models.Notification) error
	// ExistsRecentByUserAndType dedups reminder jobs (BE-8.3): don't re-notify
	// the same user for the same reason within the given window.
	ExistsRecentByUserAndType(ctx context.Context, userID uint, notifType string, since time.Time) (bool, error)
	// MarkRead sets IsRead/ReadAt for a notification owned by userID.
	MarkRead(ctx context.Context, userID, notificationID uint) error
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

func (r *notificationRepository) Create(ctx context.Context, n *models.Notification) error {
	return r.db.WithContext(ctx).Create(n).Error
}

func (r *notificationRepository) ExistsRecentByUserAndType(ctx context.Context, userID uint, notifType string, since time.Time) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Notification{}).
		Where("user_id = ? AND type = ? AND created_at >= ?", userID, notifType, since).
		Count(&count).Error
	return count > 0, err
}

func (r *notificationRepository) MarkRead(ctx context.Context, userID, notificationID uint) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", notificationID, userID).
		Updates(map[string]any{"is_read": true, "read_at": now}).Error
}
