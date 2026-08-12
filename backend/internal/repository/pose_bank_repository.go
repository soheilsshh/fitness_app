package repository

import (
	"context"
	"strings"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type PoseBankFilter struct {
	Category           string
	Query              string
	IncludeUnpublished bool
}

type PoseBankRepository interface {
	List(ctx context.Context, filter PoseBankFilter, page, pageSize int) ([]models.PoseBank, int64, error)
	FindByID(ctx context.Context, id uint) (*models.PoseBank, error)
	Create(ctx context.Context, p *models.PoseBank) error
	Update(ctx context.Context, p *models.PoseBank) error
	Delete(ctx context.Context, id uint) error
}

type poseBankRepository struct {
	db *gorm.DB
}

func NewPoseBankRepository(db *gorm.DB) PoseBankRepository {
	return &poseBankRepository{db: db}
}

func (r *poseBankRepository) List(ctx context.Context, filter PoseBankFilter, page, pageSize int) ([]models.PoseBank, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	db := r.db.WithContext(ctx).Model(&models.PoseBank{})
	if !filter.IncludeUnpublished {
		db = db.Where("is_published = ?", true)
	}
	if cat := strings.TrimSpace(filter.Category); cat != "" {
		db = db.Where("category = ?", cat)
	}
	if q := strings.TrimSpace(filter.Query); q != "" {
		db = db.Where("name LIKE ?", "%"+q+"%")
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	var list []models.PoseBank
	if err := db.Order("id DESC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *poseBankRepository) FindByID(ctx context.Context, id uint) (*models.PoseBank, error) {
	var p models.PoseBank
	if err := r.db.WithContext(ctx).First(&p, id).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *poseBankRepository) Create(ctx context.Context, p *models.PoseBank) error {
	return r.db.WithContext(ctx).Create(p).Error
}

func (r *poseBankRepository) Update(ctx context.Context, p *models.PoseBank) error {
	return r.db.WithContext(ctx).Save(p).Error
}

func (r *poseBankRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.PoseBank{}, id).Error
}
