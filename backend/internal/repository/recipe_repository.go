package repository

import (
	"context"
	"strings"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

// RecipeFilter holds the filterable fields for the recipe bank (roadmap BE-1.7).
type RecipeFilter struct {
	CalorieMin int
	CalorieMax int
	DietType   string
	Ingredient string
	Query      string
	// IncludeUnpublished lets admin callers see drafts; public/student callers must leave this false.
	IncludeUnpublished bool
}

type RecipeRepository interface {
	List(ctx context.Context, filter RecipeFilter, page, pageSize int) ([]models.Recipe, int64, error)
	FindByID(ctx context.Context, id uint) (*models.Recipe, error)
	Create(ctx context.Context, r *models.Recipe) error
	Update(ctx context.Context, r *models.Recipe) error
	Delete(ctx context.Context, id uint) error
}

type recipeRepository struct {
	db *gorm.DB
}

func NewRecipeRepository(db *gorm.DB) RecipeRepository {
	return &recipeRepository{db: db}
}

func (r *recipeRepository) List(ctx context.Context, filter RecipeFilter, page, pageSize int) ([]models.Recipe, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	db := r.db.WithContext(ctx).Model(&models.Recipe{})
	if !filter.IncludeUnpublished {
		db = db.Where("is_published = ?", true)
	}
	if filter.CalorieMin > 0 {
		db = db.Where("calories >= ?", filter.CalorieMin)
	}
	if filter.CalorieMax > 0 {
		db = db.Where("calories <= ?", filter.CalorieMax)
	}
	if dt := strings.TrimSpace(filter.DietType); dt != "" {
		db = db.Where("diet_type = ?", dt)
	}
	if ing := strings.TrimSpace(filter.Ingredient); ing != "" {
		db = db.Where("ingredients LIKE ?", "%"+ing+"%")
	}
	if q := strings.TrimSpace(filter.Query); q != "" {
		db = db.Where("title LIKE ?", "%"+q+"%")
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	var list []models.Recipe
	if err := db.Order("id DESC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *recipeRepository) FindByID(ctx context.Context, id uint) (*models.Recipe, error) {
	var rec models.Recipe
	if err := r.db.WithContext(ctx).First(&rec, id).Error; err != nil {
		return nil, err
	}
	return &rec, nil
}

func (r *recipeRepository) Create(ctx context.Context, rec *models.Recipe) error {
	return r.db.WithContext(ctx).Create(rec).Error
}

func (r *recipeRepository) Update(ctx context.Context, rec *models.Recipe) error {
	return r.db.WithContext(ctx).Save(rec).Error
}

func (r *recipeRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Recipe{}, id).Error
}
