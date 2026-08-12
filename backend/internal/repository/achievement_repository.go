package repository

import (
	"context"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type AchievementRepository interface {
	FindRuleByCode(ctx context.Context, code string) (*models.AchievementRule, error)
	// EnsureRule creates the rule if its code doesn't exist yet; a no-op
	// otherwise, so admin edits to Points/Title survive restarts.
	EnsureRule(ctx context.Context, rule *models.AchievementRule) error
	CountAwardsForRule(ctx context.Context, userID, ruleID uint) (int64, error)
	CreateAward(ctx context.Context, award *models.UserAchievement) error
	ListAwardsByUser(ctx context.Context, userID uint) ([]models.UserAchievement, error)
	ListRules(ctx context.Context) ([]models.AchievementRule, error)
}

type achievementRepository struct {
	db *gorm.DB
}

func NewAchievementRepository(db *gorm.DB) AchievementRepository {
	return &achievementRepository{db: db}
}

func (r *achievementRepository) FindRuleByCode(ctx context.Context, code string) (*models.AchievementRule, error) {
	var rule models.AchievementRule
	if err := r.db.WithContext(ctx).Where("code = ?", code).First(&rule).Error; err != nil {
		return nil, err
	}
	return &rule, nil
}

func (r *achievementRepository) EnsureRule(ctx context.Context, rule *models.AchievementRule) error {
	var existing models.AchievementRule
	err := r.db.WithContext(ctx).Where("code = ?", rule.Code).First(&existing).Error
	if err == nil {
		return nil
	}
	if err != gorm.ErrRecordNotFound {
		return err
	}
	return r.db.WithContext(ctx).Create(rule).Error
}

func (r *achievementRepository) CountAwardsForRule(ctx context.Context, userID, ruleID uint) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.UserAchievement{}).
		Where("user_id = ? AND achievement_rule_id = ?", userID, ruleID).
		Count(&count).Error
	return count, err
}

func (r *achievementRepository) CreateAward(ctx context.Context, award *models.UserAchievement) error {
	return r.db.WithContext(ctx).Create(award).Error
}

func (r *achievementRepository) ListAwardsByUser(ctx context.Context, userID uint) ([]models.UserAchievement, error) {
	var list []models.UserAchievement
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at DESC").Find(&list).Error
	return list, err
}

func (r *achievementRepository) ListRules(ctx context.Context) ([]models.AchievementRule, error) {
	var list []models.AchievementRule
	err := r.db.WithContext(ctx).Find(&list).Error
	return list, err
}
