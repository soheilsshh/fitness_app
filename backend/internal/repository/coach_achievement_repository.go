package repository

import (
	"context"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type CoachAchievementRepository interface {
	FindByID(ctx context.Context, id uint) (*models.CoachAchievement, error)
	ListByCoachUserID(ctx context.Context, coachUserID uint) ([]models.CoachAchievement, error)
	ListVisibleByCoachUserID(ctx context.Context, coachUserID uint) ([]models.CoachAchievement, error)
	MaxSortOrder(ctx context.Context, coachUserID uint) (int, error)
	Create(ctx context.Context, achievement *models.CoachAchievement) error
	Update(ctx context.Context, achievement *models.CoachAchievement) error
	Delete(ctx context.Context, id uint) error
}

type coachAchievementRepository struct {
	db *gorm.DB
}

func NewCoachAchievementRepository(db *gorm.DB) CoachAchievementRepository {
	return &coachAchievementRepository{db: db}
}

func (r *coachAchievementRepository) FindByID(ctx context.Context, id uint) (*models.CoachAchievement, error) {
	var achievement models.CoachAchievement
	if err := r.db.WithContext(ctx).First(&achievement, id).Error; err != nil {
		return nil, err
	}
	return &achievement, nil
}

func (r *coachAchievementRepository) ListByCoachUserID(ctx context.Context, coachUserID uint) ([]models.CoachAchievement, error) {
	var list []models.CoachAchievement
	if err := r.db.WithContext(ctx).
		Where("coach_user_id = ?", coachUserID).
		Order("sort_order ASC, id ASC").
		Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *coachAchievementRepository) ListVisibleByCoachUserID(ctx context.Context, coachUserID uint) ([]models.CoachAchievement, error) {
	var list []models.CoachAchievement
	if err := r.db.WithContext(ctx).
		Where("coach_user_id = ? AND is_visible = ?", coachUserID, true).
		Order("sort_order ASC, id ASC").
		Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *coachAchievementRepository) MaxSortOrder(ctx context.Context, coachUserID uint) (int, error) {
	var max *int
	err := r.db.WithContext(ctx).
		Model(&models.CoachAchievement{}).
		Where("coach_user_id = ?", coachUserID).
		Select("MAX(sort_order)").
		Scan(&max).Error
	if err != nil {
		return 0, err
	}
	if max == nil {
		return 0, nil
	}
	return *max, nil
}

func (r *coachAchievementRepository) Create(ctx context.Context, achievement *models.CoachAchievement) error {
	return r.db.WithContext(ctx).Create(achievement).Error
}

func (r *coachAchievementRepository) Update(ctx context.Context, achievement *models.CoachAchievement) error {
	return r.db.WithContext(ctx).Save(achievement).Error
}

func (r *coachAchievementRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.CoachAchievement{}, id).Error
}
