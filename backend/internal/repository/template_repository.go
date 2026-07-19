package repository

import (
	"context"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type TemplateRepository interface {
	WorkoutTemplateExistsBySourceID(ctx context.Context, sourceID int) (bool, error)
	NutritionTemplateExistsBySourceID(ctx context.Context, sourceID int) (bool, error)
	CreateWorkoutTemplate(ctx context.Context, template *models.WorkoutTemplate) error
	CreateNutritionTemplate(ctx context.Context, template *models.NutritionTemplate) error
	FindWorkoutTemplateByID(ctx context.Context, id uint) (*models.WorkoutTemplate, error)
	FindNutritionTemplateByID(ctx context.Context, id uint) (*models.NutritionTemplate, error)
	ListWorkoutTemplates(ctx context.Context) ([]models.WorkoutTemplate, error)
	ListNutritionTemplates(ctx context.Context) ([]models.NutritionTemplate, error)
}

type templateRepository struct {
	db *gorm.DB
}

func NewTemplateRepository(db *gorm.DB) TemplateRepository {
	return &templateRepository{db: db}
}

func (r *templateRepository) WorkoutTemplateExistsBySourceID(ctx context.Context, sourceID int) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.WorkoutTemplate{}).
		Where("source_id = ?", sourceID).
		Count(&count).Error
	return count > 0, err
}

func (r *templateRepository) NutritionTemplateExistsBySourceID(ctx context.Context, sourceID int) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.NutritionTemplate{}).
		Where("source_id = ?", sourceID).
		Count(&count).Error
	return count > 0, err
}

func (r *templateRepository) CreateWorkoutTemplate(ctx context.Context, template *models.WorkoutTemplate) error {
	return r.db.WithContext(ctx).Create(template).Error
}

func (r *templateRepository) CreateNutritionTemplate(ctx context.Context, template *models.NutritionTemplate) error {
	return r.db.WithContext(ctx).Create(template).Error
}

func (r *templateRepository) FindWorkoutTemplateByID(ctx context.Context, id uint) (*models.WorkoutTemplate, error) {
	var template models.WorkoutTemplate
	err := r.db.WithContext(ctx).
		Preload("Items", func(db *gorm.DB) *gorm.DB {
			return db.Order("day_number ASC, order_index ASC")
		}).
		Preload("Items.SetsDetails", func(db *gorm.DB) *gorm.DB {
			return db.Order("set_number ASC")
		}).
		First(&template, id).Error
	if err != nil {
		return nil, err
	}
	return &template, nil
}

func (r *templateRepository) FindNutritionTemplateByID(ctx context.Context, id uint) (*models.NutritionTemplate, error) {
	var template models.NutritionTemplate
	err := r.db.WithContext(ctx).
		Preload("Meals", func(db *gorm.DB) *gorm.DB {
			return db.Order("meal_order ASC")
		}).
		Preload("Meals.Items", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_index ASC")
		}).
		First(&template, id).Error
	if err != nil {
		return nil, err
	}
	return &template, nil
}

func (r *templateRepository) ListWorkoutTemplates(ctx context.Context) ([]models.WorkoutTemplate, error) {
	var templates []models.WorkoutTemplate
	err := r.db.WithContext(ctx).
		Model(&models.WorkoutTemplate{}).
		Order("title ASC, id ASC").
		Find(&templates).Error
	return templates, err
}

func (r *templateRepository) ListNutritionTemplates(ctx context.Context) ([]models.NutritionTemplate, error) {
	var templates []models.NutritionTemplate
	err := r.db.WithContext(ctx).
		Model(&models.NutritionTemplate{}).
		Order("title ASC, id ASC").
		Find(&templates).Error
	return templates, err
}
