package repository

import (
	"context"
	"errors"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type CoachProfileRepository interface {
	FindByUserID(ctx context.Context, userID uint) (*models.CoachProfile, error)
	FindBySlug(ctx context.Context, slug string) (*models.CoachProfile, error)
	FindPublishedBySlug(ctx context.Context, slug string) (*models.CoachProfile, error)
	Create(ctx context.Context, profile *models.CoachProfile) error
	Update(ctx context.Context, profile *models.CoachProfile) error
	SlugExists(ctx context.Context, slug string, excludeUserID uint) (bool, error)
}

type coachProfileRepository struct {
	db *gorm.DB
}

func NewCoachProfileRepository(db *gorm.DB) CoachProfileRepository {
	return &coachProfileRepository{db: db}
}

func (r *coachProfileRepository) FindByUserID(ctx context.Context, userID uint) (*models.CoachProfile, error) {
	var profile models.CoachProfile
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&profile).Error; err != nil {
		return nil, err
	}
	return &profile, nil
}

func (r *coachProfileRepository) FindBySlug(ctx context.Context, slug string) (*models.CoachProfile, error) {
	var profile models.CoachProfile
	if err := r.db.WithContext(ctx).Where("slug = ?", slug).First(&profile).Error; err != nil {
		return nil, err
	}
	return &profile, nil
}

func (r *coachProfileRepository) FindPublishedBySlug(ctx context.Context, slug string) (*models.CoachProfile, error) {
	var profile models.CoachProfile
	if err := r.db.WithContext(ctx).
		Where("slug = ? AND is_published = ?", slug, true).
		First(&profile).Error; err != nil {
		return nil, err
	}
	return &profile, nil
}

func (r *coachProfileRepository) Create(ctx context.Context, profile *models.CoachProfile) error {
	return r.db.WithContext(ctx).Create(profile).Error
}

func (r *coachProfileRepository) Update(ctx context.Context, profile *models.CoachProfile) error {
	return r.db.WithContext(ctx).Save(profile).Error
}

func (r *coachProfileRepository) SlugExists(ctx context.Context, slug string, excludeUserID uint) (bool, error) {
	if slug == "" {
		return false, nil
	}
	var count int64
	q := r.db.WithContext(ctx).Model(&models.CoachProfile{}).Where("slug = ?", slug)
	if excludeUserID > 0 {
		q = q.Where("user_id <> ?", excludeUserID)
	}
	if err := q.Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

// ErrCoachProfileNotFound is returned when a coach profile cannot be located.
var ErrCoachProfileNotFound = errors.New("coach profile not found")
