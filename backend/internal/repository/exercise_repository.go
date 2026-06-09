package repository

import (
	"context"
	"strings"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type ExerciseRepository interface {
	Create(ctx context.Context, e *models.Exercise) error
	Update(ctx context.Context, e *models.Exercise) error
	Delete(ctx context.Context, id uint) error
	FindByID(ctx context.Context, id uint) (*models.Exercise, error)
	FindByExternalID(ctx context.Context, externalID string) (*models.Exercise, error)
	List(ctx context.Context, page, pageSize int, query, category, bodyPart, equipment string) ([]models.Exercise, int64, error)
	ListCategories(ctx context.Context) ([]string, error)
	FindByIDs(ctx context.Context, ids []uint) ([]models.Exercise, error)
	FindByNames(ctx context.Context, names []string) ([]models.Exercise, error)
	UpsertByExternalID(ctx context.Context, e *models.Exercise) error
}

type exerciseRepository struct {
	db *gorm.DB
}

func NewExerciseRepository(db *gorm.DB) ExerciseRepository {
	return &exerciseRepository{db: db}
}

func (r *exerciseRepository) applyFilters(db *gorm.DB, query, category, bodyPart, equipment string) *gorm.DB {
	q := strings.TrimSpace(query)
	if q != "" {
		like := "%" + q + "%"
		db = db.Where("name LIKE ? OR external_id LIKE ? OR target LIKE ?", like, like, like)
	}
	if category != "" && category != "all" {
		db = db.Where("category = ?", category)
	}
	if bodyPart != "" && bodyPart != "all" {
		db = db.Where("body_part = ?", bodyPart)
	}
	if equipment != "" && equipment != "all" {
		db = db.Where("equipment = ?", equipment)
	}
	return db
}

func (r *exerciseRepository) List(ctx context.Context, page, pageSize int, query, category, bodyPart, equipment string) ([]models.Exercise, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	db := r.applyFilters(
		r.db.WithContext(ctx).Model(&models.Exercise{}).Where("is_active = ?", true),
		query, category, bodyPart, equipment,
	)

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	var list []models.Exercise
	if err := db.Order("name ASC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *exerciseRepository) ListCategories(ctx context.Context) ([]string, error) {
	var categories []string
	err := r.db.WithContext(ctx).Model(&models.Exercise{}).
		Where("is_active = ? AND category != ''", true).
		Distinct("category").
		Order("category ASC").
		Pluck("category", &categories).Error
	return categories, err
}

func (r *exerciseRepository) FindByIDs(ctx context.Context, ids []uint) ([]models.Exercise, error) {
	if len(ids) == 0 {
		return []models.Exercise{}, nil
	}
	var list []models.Exercise
	err := r.db.WithContext(ctx).Where("id IN ? AND is_active = ?", ids, true).Find(&list).Error
	return list, err
}

func (r *exerciseRepository) FindByNames(ctx context.Context, names []string) ([]models.Exercise, error) {
	if len(names) == 0 {
		return []models.Exercise{}, nil
	}
	var list []models.Exercise
	err := r.db.WithContext(ctx).Where("name IN ? AND is_active = ?", names, true).Find(&list).Error
	return list, err
}

func (r *exerciseRepository) FindByID(ctx context.Context, id uint) (*models.Exercise, error) {
	var e models.Exercise
	if err := r.db.WithContext(ctx).First(&e, id).Error; err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *exerciseRepository) FindByExternalID(ctx context.Context, externalID string) (*models.Exercise, error) {
	var e models.Exercise
	if err := r.db.WithContext(ctx).Where("external_id = ?", externalID).First(&e).Error; err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *exerciseRepository) Create(ctx context.Context, e *models.Exercise) error {
	return r.db.WithContext(ctx).Create(e).Error
}

func (r *exerciseRepository) Update(ctx context.Context, e *models.Exercise) error {
	return r.db.WithContext(ctx).Save(e).Error
}

func (r *exerciseRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Exercise{}, id).Error
}

func (r *exerciseRepository) UpsertByExternalID(ctx context.Context, e *models.Exercise) error {
	var existing models.Exercise
	err := r.db.WithContext(ctx).Where("external_id = ?", e.ExternalID).First(&existing).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return r.db.WithContext(ctx).Create(e).Error
		}
		return err
	}
	e.ID = existing.ID
	e.CreatedAt = existing.CreatedAt
	return r.db.WithContext(ctx).Save(e).Error
}
