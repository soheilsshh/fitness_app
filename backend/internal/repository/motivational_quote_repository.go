package repository

import (
	"context"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type MotivationalQuoteRepository interface {
	Create(ctx context.Context, q *models.MotivationalQuote) error
	FindByID(ctx context.Context, id uint) (*models.MotivationalQuote, error)
	Update(ctx context.Context, q *models.MotivationalQuote) error
	Delete(ctx context.Context, id uint) error
	List(ctx context.Context, page, pageSize int) ([]models.MotivationalQuote, int64, error)
	RandomActive(ctx context.Context) (*models.MotivationalQuote, error)
	CountActive(ctx context.Context) (int64, error)
}

type motivationalQuoteRepository struct {
	db *gorm.DB
}

func NewMotivationalQuoteRepository(db *gorm.DB) MotivationalQuoteRepository {
	return &motivationalQuoteRepository{db: db}
}

func (r *motivationalQuoteRepository) Create(ctx context.Context, q *models.MotivationalQuote) error {
	return r.db.WithContext(ctx).Create(q).Error
}

func (r *motivationalQuoteRepository) FindByID(ctx context.Context, id uint) (*models.MotivationalQuote, error) {
	var q models.MotivationalQuote
	if err := r.db.WithContext(ctx).First(&q, id).Error; err != nil {
		return nil, err
	}
	return &q, nil
}

func (r *motivationalQuoteRepository) Update(ctx context.Context, q *models.MotivationalQuote) error {
	return r.db.WithContext(ctx).Save(q).Error
}

func (r *motivationalQuoteRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.MotivationalQuote{}, id).Error
}

func (r *motivationalQuoteRepository) List(ctx context.Context, page, pageSize int) ([]models.MotivationalQuote, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	db := r.db.WithContext(ctx).Model(&models.MotivationalQuote{})
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * pageSize
	var list []models.MotivationalQuote
	if err := db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *motivationalQuoteRepository) CountActive(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.MotivationalQuote{}).Where("is_active = ?", true).Count(&count).Error
	return count, err
}

// RandomActive picks one active quote at random via SQL RAND() — the table is
// small (dozens of rows), so ORDER BY RAND() is fine without a cache layer.
func (r *motivationalQuoteRepository) RandomActive(ctx context.Context) (*models.MotivationalQuote, error) {
	var q models.MotivationalQuote
	err := r.db.WithContext(ctx).Where("is_active = ?", true).Order("RAND()").First(&q).Error
	if err != nil {
		return nil, err
	}
	return &q, nil
}
