package repository

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type SubscriptionRepository interface {
	FindCurrentByUserID(ctx context.Context, userID uint, now time.Time) (*models.Subscription, error)
	FindByUserIDPaginated(ctx context.Context, userID uint, page, limit int) ([]models.Subscription, error)
}

type subscriptionRepository struct {
	db *gorm.DB
}

func NewSubscriptionRepository(db *gorm.DB) SubscriptionRepository {
	return &subscriptionRepository{db: db}
}

func (r *subscriptionRepository) FindCurrentByUserID(ctx context.Context, userID uint, now time.Time) (*models.Subscription, error) {
	var sub models.Subscription
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND (ends_at IS NULL OR ends_at > ?)", userID, now).
		Order("starts_at DESC").
		First(&sub).Error
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

func (r *subscriptionRepository) FindByUserIDPaginated(ctx context.Context, userID uint, page, limit int) ([]models.Subscription, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}
	offset := (page - 1) * limit

	var subs []models.Subscription
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("starts_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&subs).Error
	if err != nil {
		return nil, err
	}
	return subs, nil
}

