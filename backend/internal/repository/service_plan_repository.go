package repository

import (
	"context"
	"strings"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type ServicePlanRepository interface {
	FindByID(ctx context.Context, id uint) (*models.ServicePlan, error)
	List(ctx context.Context, page, pageSize int, query, tag string) ([]models.ServicePlan, int64, error)
	Create(ctx context.Context, plan *models.ServicePlan) error
	Update(ctx context.Context, plan *models.ServicePlan) error
	Delete(ctx context.Context, id uint) error
}

type servicePlanRepository struct {
	db *gorm.DB
}

func NewServicePlanRepository(db *gorm.DB) ServicePlanRepository {
	return &servicePlanRepository{db: db}
}

func (r *servicePlanRepository) FindByID(ctx context.Context, id uint) (*models.ServicePlan, error) {
	var plan models.ServicePlan
	if err := r.db.WithContext(ctx).First(&plan, id).Error; err != nil {
		return nil, err
	}
	return &plan, nil
}

func (r *servicePlanRepository) List(ctx context.Context, page, pageSize int, query, tag string) ([]models.ServicePlan, int64, error) {
	db := r.db.WithContext(ctx).Model(&models.ServicePlan{})

	if q := strings.TrimSpace(query); q != "" {
		like := "%" + q + "%"
		db = db.Where("name LIKE ? OR subtitle LIKE ? OR course_name LIKE ?", like, like, like)
	}
	switch tag {
	case "discounted":
		db = db.Where("discount_percent > ? OR discount_price_cents > ?", 0, 0)
	case "popular":
		db = db.Where("is_popular = ?", true)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	var list []models.ServicePlan
	if err := db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *servicePlanRepository) Create(ctx context.Context, plan *models.ServicePlan) error {
	return r.db.WithContext(ctx).Create(plan).Error
}

func (r *servicePlanRepository) Update(ctx context.Context, plan *models.ServicePlan) error {
	return r.db.WithContext(ctx).Save(plan).Error
}

func (r *servicePlanRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.ServicePlan{}, id).Error
}

