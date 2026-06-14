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
	CountByUserID(ctx context.Context, userID uint) (int64, error)
	// CountCreatedInYear returns number of subscriptions created in the given calendar year.
	CountCreatedInYear(ctx context.Context, year int) (int64, error)
	// CountUsersWithActiveSubscription returns count of distinct user_ids that have an active subscription at now.
	CountUsersWithActiveSubscription(ctx context.Context, now time.Time) (int64, error)
	Create(ctx context.Context, sub *models.Subscription) error
	HasActiveSubscription(ctx context.Context, userID uint, now time.Time) (bool, error)
	FindCurrentByUserIDAndCoachID(ctx context.Context, userID, coachID uint, now time.Time) (*models.Subscription, error)
	CountStudentsByCoachID(ctx context.Context, coachID uint) (int64, error)
	CountActiveSubscriptionsByCoachID(ctx context.Context, coachID uint, now time.Time) (int64, error)
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

func (r *subscriptionRepository) CountByUserID(ctx context.Context, userID uint) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.Subscription{}).
		Where("user_id = ?", userID).
		Count(&count).Error
	return count, err
}

func (r *subscriptionRepository) CountCreatedInYear(ctx context.Context, year int) (int64, error) {
	start := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(year+1, 1, 1, 0, 0, 0, 0, time.UTC)
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.Subscription{}).
		Where("created_at >= ? AND created_at < ?", start, end).
		Count(&count).Error
	return count, err
}

func (r *subscriptionRepository) Create(ctx context.Context, sub *models.Subscription) error {
	return r.db.WithContext(ctx).Create(sub).Error
}

func (r *subscriptionRepository) HasActiveSubscription(ctx context.Context, userID uint, now time.Time) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.Subscription{}).
		Where("user_id = ? AND (ends_at IS NULL OR ends_at > ?)", userID, now).
		Count(&count).Error
	return count > 0, err
}

func (r *subscriptionRepository) CountUsersWithActiveSubscription(ctx context.Context, now time.Time) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.Subscription{}).
		Where("ends_at IS NULL OR ends_at > ?", now).
		Select("COUNT(DISTINCT user_id)").
		Scan(&count).Error
	return count, err
}

func (r *subscriptionRepository) FindCurrentByUserIDAndCoachID(ctx context.Context, userID, coachID uint, now time.Time) (*models.Subscription, error) {
	var sub models.Subscription
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND coach_id = ? AND (ends_at IS NULL OR ends_at > ?)", userID, coachID, now).
		Order("starts_at DESC").
		First(&sub).Error
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

func (r *subscriptionRepository) CountStudentsByCoachID(ctx context.Context, coachID uint) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.User{}).
		Where("role = ? AND (assigned_coach_id = ? OR id IN (SELECT DISTINCT user_id FROM subscriptions WHERE coach_id = ?))",
			models.RoleStudent, coachID, coachID).
		Count(&count).Error
	return count, err
}

func (r *subscriptionRepository) CountActiveSubscriptionsByCoachID(ctx context.Context, coachID uint, now time.Time) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.Subscription{}).
		Where("coach_id = ? AND (ends_at IS NULL OR ends_at > ?)", coachID, now).
		Count(&count).Error
	return count, err
}
