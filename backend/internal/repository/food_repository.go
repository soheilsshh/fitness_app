package repository

import (
	"context"
	"strings"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type FoodRepository interface {
	FindByExternalID(ctx context.Context, externalID string) (*models.Food, error)
	FindByID(ctx context.Context, id uint) (*models.Food, error)
	FindByIDs(ctx context.Context, ids []uint) ([]models.Food, error)
	Search(ctx context.Context, query string, page, limit int) ([]models.Food, int64, error)
	UpsertByExternalID(ctx context.Context, f *models.Food) error
}

type foodRepository struct {
	db *gorm.DB
}

func NewFoodRepository(db *gorm.DB) FoodRepository {
	return &foodRepository{db: db}
}

func (r *foodRepository) FindByExternalID(ctx context.Context, externalID string) (*models.Food, error) {
	var f models.Food
	if err := r.db.WithContext(ctx).Where("external_id = ?", externalID).First(&f).Error; err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *foodRepository) FindByID(ctx context.Context, id uint) (*models.Food, error) {
	var f models.Food
	if err := r.db.WithContext(ctx).First(&f, id).Error; err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *foodRepository) FindByIDs(ctx context.Context, ids []uint) ([]models.Food, error) {
	if len(ids) == 0 {
		return []models.Food{}, nil
	}
	var list []models.Food
	err := r.db.WithContext(ctx).Where("id IN ?", ids).Find(&list).Error
	return list, err
}

func (r *foodRepository) Search(ctx context.Context, query string, page, limit int) ([]models.Food, int64, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	db := r.db.WithContext(ctx).Model(&models.Food{})
	q := strings.TrimSpace(query)
	if q != "" {
		like := "%" + q + "%"
		db = db.Where("name LIKE ?", like)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	var list []models.Food
	if err := db.Order("name ASC").Offset(offset).Limit(limit).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *foodRepository) UpsertByExternalID(ctx context.Context, f *models.Food) error {
	var existing models.Food
	err := r.db.WithContext(ctx).Where("external_id = ?", f.ExternalID).First(&existing).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return r.db.WithContext(ctx).Create(f).Error
		}
		return err
	}
	f.ID = existing.ID
	f.CreatedAt = existing.CreatedAt
	return r.db.WithContext(ctx).Save(f).Error
}
