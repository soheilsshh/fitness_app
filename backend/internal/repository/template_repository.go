package repository

import (
	"context"
	"strings"

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
	ListWorkoutTemplatesPaged(ctx context.Context, page, pageSize int, query string) ([]models.WorkoutTemplate, int64, error)
	UpdateWorkoutTemplateMeta(ctx context.Context, template *models.WorkoutTemplate) error
	ReplaceWorkoutTemplateItems(ctx context.Context, templateID uint, items []models.TemplateProgramItem) error
	DeleteWorkoutTemplate(ctx context.Context, id uint) error
	NextManualWorkoutSourceID(ctx context.Context) (int, error)
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

func (r *templateRepository) ListWorkoutTemplatesPaged(ctx context.Context, page, pageSize int, query string) ([]models.WorkoutTemplate, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	db := r.db.WithContext(ctx).Model(&models.WorkoutTemplate{})
	if q := strings.TrimSpace(query); q != "" {
		like := "%" + q + "%"
		db = db.Where("title LIKE ? OR target LIKE ? OR level LIKE ? OR gender LIKE ? OR location LIKE ?",
			like, like, like, like, like)
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var templates []models.WorkoutTemplate
	err := db.Order("updated_at DESC, id DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&templates).Error
	return templates, total, err
}

func (r *templateRepository) UpdateWorkoutTemplateMeta(ctx context.Context, template *models.WorkoutTemplate) error {
	return r.db.WithContext(ctx).Model(template).
		Select("Title", "Type", "Gender", "Location", "DayCount", "Target", "Injury", "Level", "UpdatedAt").
		Updates(template).Error
}

func (r *templateRepository) ReplaceWorkoutTemplateItems(ctx context.Context, templateID uint, items []models.TemplateProgramItem) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var existing []models.TemplateProgramItem
		if err := tx.Where("workout_template_id = ?", templateID).Find(&existing).Error; err != nil {
			return err
		}
		if len(existing) > 0 {
			ids := make([]uint, 0, len(existing))
			for _, it := range existing {
				ids = append(ids, it.ID)
			}
			if err := tx.Where("template_program_item_id IN ?", ids).Delete(&models.TemplateProgramItemSet{}).Error; err != nil {
				return err
			}
			if err := tx.Where("workout_template_id = ?", templateID).Delete(&models.TemplateProgramItem{}).Error; err != nil {
				return err
			}
		}
		for i := range items {
			items[i].ID = 0
			items[i].WorkoutTemplateID = templateID
			for j := range items[i].SetsDetails {
				items[i].SetsDetails[j].ID = 0
				items[i].SetsDetails[j].TemplateProgramItemID = 0
			}
			if err := tx.Create(&items[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *templateRepository) DeleteWorkoutTemplate(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var items []models.TemplateProgramItem
		if err := tx.Where("workout_template_id = ?", id).Find(&items).Error; err != nil {
			return err
		}
		if len(items) > 0 {
			ids := make([]uint, 0, len(items))
			for _, it := range items {
				ids = append(ids, it.ID)
			}
			if err := tx.Where("template_program_item_id IN ?", ids).Delete(&models.TemplateProgramItemSet{}).Error; err != nil {
				return err
			}
			if err := tx.Where("workout_template_id = ?", id).Delete(&models.TemplateProgramItem{}).Error; err != nil {
				return err
			}
		}
		return tx.Delete(&models.WorkoutTemplate{}, id).Error
	})
}

func (r *templateRepository) NextManualWorkoutSourceID(ctx context.Context) (int, error) {
	var minSource *int
	if err := r.db.WithContext(ctx).Model(&models.WorkoutTemplate{}).
		Select("MIN(source_id)").Scan(&minSource).Error; err != nil {
		return 0, err
	}
	next := -1
	if minSource != nil && *minSource <= next {
		next = *minSource - 1
	}
	return next, nil
}
