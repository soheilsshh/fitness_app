package repository

import (
	"context"
	"strings"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type ExerciseListFilter struct {
	Query     string
	Category  string
	BodyPart  string
	Equipment string
	CoachID   *uint  // when set with Source, scopes coach panel listing
	Source    string // all | mine | dataset (coach panel only)
}

type ExerciseRepository interface {
	Create(ctx context.Context, e *models.Exercise) error
	Update(ctx context.Context, e *models.Exercise) error
	Delete(ctx context.Context, id uint) error
	FindByID(ctx context.Context, id uint) (*models.Exercise, error)
	FindByExternalID(ctx context.Context, externalID string) (*models.Exercise, error)
	List(ctx context.Context, page, pageSize int, filter ExerciseListFilter) ([]models.Exercise, int64, error)
	ListCategories(ctx context.Context, filter ExerciseListFilter) ([]string, error)
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

func (r *exerciseRepository) applyFilters(db *gorm.DB, filter ExerciseListFilter) *gorm.DB {
	q := strings.TrimSpace(filter.Query)
	if q != "" {
		like := "%" + q + "%"
		db = db.Where("name LIKE ? OR external_id LIKE ? OR target LIKE ?", like, like, like)
	}
	if filter.Category != "" && filter.Category != "all" {
		db = db.Where("category = ?", filter.Category)
	}
	if filter.BodyPart != "" && filter.BodyPart != "all" {
		db = db.Where("body_part = ?", filter.BodyPart)
	}
	if filter.Equipment != "" && filter.Equipment != "all" {
		db = db.Where("equipment = ?", filter.Equipment)
	}
	if filter.CoachID != nil {
		switch strings.ToLower(strings.TrimSpace(filter.Source)) {
		case "mine":
			db = db.Where("coach_id = ?", *filter.CoachID)
		case "dataset":
			db = db.Where("coach_id IS NULL")
		default:
			db = db.Where("coach_id IS NULL OR coach_id = ?", *filter.CoachID)
		}
	}
	return db
}

func (r *exerciseRepository) List(ctx context.Context, page, pageSize int, filter ExerciseListFilter) ([]models.Exercise, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	db := r.applyFilters(
		r.db.WithContext(ctx).Model(&models.Exercise{}).Where("is_active = ?", true),
		filter,
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

func (r *exerciseRepository) ListCategories(ctx context.Context, filter ExerciseListFilter) ([]string, error) {
	var categories []string
	db := r.applyFilters(
		r.db.WithContext(ctx).Model(&models.Exercise{}).
			Where("is_active = ? AND category != ''", true),
		filter,
	)
	err := db.Distinct("category").Order("category ASC").Pluck("category", &categories).Error
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
