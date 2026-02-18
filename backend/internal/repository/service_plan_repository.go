package repository

import (
	"context"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type ServicePlanRepository interface {
	FindByID(ctx context.Context, id uint) (*models.ServicePlan, error)
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

