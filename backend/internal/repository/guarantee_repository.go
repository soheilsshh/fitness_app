package repository

import (
	"context"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type GuaranteeRepository interface {
	Create(ctx context.Context, g *models.GuaranteeCase) error
	Update(ctx context.Context, g *models.GuaranteeCase) error
	FindByID(ctx context.Context, id uint) (*models.GuaranteeCase, error)
	ListByUser(ctx context.Context, userID uint, page, pageSize int) ([]models.GuaranteeCase, int64, error)
	ListAll(ctx context.Context, status string, page, pageSize int) ([]models.GuaranteeCase, int64, error)
	HasOpenCase(ctx context.Context, userID, subscriptionID uint) (bool, error)
}

type guaranteeRepository struct {
	db *gorm.DB
}

func NewGuaranteeRepository(db *gorm.DB) GuaranteeRepository {
	return &guaranteeRepository{db: db}
}

func (r *guaranteeRepository) Create(ctx context.Context, g *models.GuaranteeCase) error {
	return r.db.WithContext(ctx).Create(g).Error
}

func (r *guaranteeRepository) Update(ctx context.Context, g *models.GuaranteeCase) error {
	return r.db.WithContext(ctx).Save(g).Error
}

func (r *guaranteeRepository) FindByID(ctx context.Context, id uint) (*models.GuaranteeCase, error) {
	var g models.GuaranteeCase
	if err := r.db.WithContext(ctx).First(&g, id).Error; err != nil {
		return nil, err
	}
	return &g, nil
}

func (r *guaranteeRepository) ListByUser(ctx context.Context, userID uint, page, pageSize int) ([]models.GuaranteeCase, int64, error) {
	return r.list(ctx, r.db.WithContext(ctx).Model(&models.GuaranteeCase{}).Where("user_id = ?", userID), page, pageSize)
}

func (r *guaranteeRepository) ListAll(ctx context.Context, status string, page, pageSize int) ([]models.GuaranteeCase, int64, error) {
	db := r.db.WithContext(ctx).Model(&models.GuaranteeCase{})
	if status != "" && status != "all" {
		db = db.Where("status = ?", status)
	}
	return r.list(ctx, db, page, pageSize)
}

func (r *guaranteeRepository) list(ctx context.Context, db *gorm.DB, page, pageSize int) ([]models.GuaranteeCase, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * pageSize
	var list []models.GuaranteeCase
	if err := db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *guaranteeRepository) HasOpenCase(ctx context.Context, userID, subscriptionID uint) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.GuaranteeCase{}).
		Where("user_id = ? AND subscription_id = ? AND status = ?", userID, subscriptionID, models.GuaranteeStatusPending).
		Count(&count).Error
	return count > 0, err
}
