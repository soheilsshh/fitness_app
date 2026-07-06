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
	ListCoaches(ctx context.Context, page, pageSize int, query, status string) ([]models.CoachProfile, int64, error)
	ListPublished(ctx context.Context, page, pageSize int) ([]models.CoachProfile, int64, error)
	CountCoaches(ctx context.Context) (int64, error)
	CountActiveCoaches(ctx context.Context) (int64, error)
	CountStudentsByCoachID(ctx context.Context, coachUserID uint) (int64, error)
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
		Where("slug = ? AND is_published = ? AND is_active = ? AND status = ?",
			slug, true, true, models.CoachProfileStatusApproved).
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

func (r *coachProfileRepository) ListCoaches(ctx context.Context, page, pageSize int, query, status string) ([]models.CoachProfile, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	db := r.db.WithContext(ctx).Model(&models.CoachProfile{})
	if query != "" {
		like := "%" + query + "%"
		db = db.Where("display_name LIKE ? OR slug LIKE ? OR title LIKE ?", like, like, like)
	}
	if status != "" && models.IsValidCoachProfileStatus(status) {
		db = db.Where("status = ?", status)
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var list []models.CoachProfile
	offset := (page - 1) * pageSize
	if err := db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *coachProfileRepository) ListPublished(ctx context.Context, page, pageSize int) ([]models.CoachProfile, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	db := r.db.WithContext(ctx).Model(&models.CoachProfile{}).
		Where("is_published = ? AND is_active = ? AND status = ?",
			true, true, models.CoachProfileStatusApproved)
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var list []models.CoachProfile
	offset := (page - 1) * pageSize
	if err := db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *coachProfileRepository) CountCoaches(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.CoachProfile{}).Count(&count).Error
	return count, err
}

func (r *coachProfileRepository) CountActiveCoaches(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.CoachProfile{}).Where("is_active = ?", true).Count(&count).Error
	return count, err
}

func (r *coachProfileRepository) CountStudentsByCoachID(ctx context.Context, coachUserID uint) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.User{}).
		Where("role = ? AND (assigned_coach_id = ? OR id IN (SELECT DISTINCT user_id FROM subscriptions WHERE coach_id = ?))",
			models.RoleStudent, coachUserID, coachUserID).
		Count(&count).Error
	return count, err
}

// ErrCoachProfileNotFound is returned when a coach profile cannot be located.
var ErrCoachProfileNotFound = errors.New("coach profile not found")
