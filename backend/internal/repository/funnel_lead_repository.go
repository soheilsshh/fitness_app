package repository

import (
	"context"
	"strings"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
)

type FunnelLeadRepository interface {
	Create(ctx context.Context, lead *models.FunnelLead) error
	FindByCheckoutToken(ctx context.Context, token string) (*models.FunnelLead, error)
	Update(ctx context.Context, lead *models.FunnelLead) error
	List(ctx context.Context, status string, query string, page, pageSize int) ([]models.FunnelLead, int64, error)
	FindByID(ctx context.Context, id uint) (*models.FunnelLead, error)
}

type funnelLeadRepository struct {
	db *gorm.DB
}

func NewFunnelLeadRepository(db *gorm.DB) FunnelLeadRepository {
	return &funnelLeadRepository{db: db}
}

func (r *funnelLeadRepository) Create(ctx context.Context, lead *models.FunnelLead) error {
	return r.db.WithContext(ctx).Create(lead).Error
}

func (r *funnelLeadRepository) FindByCheckoutToken(ctx context.Context, token string) (*models.FunnelLead, error) {
	var lead models.FunnelLead
	if err := r.db.WithContext(ctx).Where("checkout_token = ?", token).First(&lead).Error; err != nil {
		return nil, err
	}
	return &lead, nil
}

func (r *funnelLeadRepository) Update(ctx context.Context, lead *models.FunnelLead) error {
	return r.db.WithContext(ctx).Save(lead).Error
}

func (r *funnelLeadRepository) List(ctx context.Context, status string, query string, page, pageSize int) ([]models.FunnelLead, int64, error) {
	db := r.db.WithContext(ctx).Model(&models.FunnelLead{})
	if status != "" && status != "all" {
		db = db.Where("status = ?", status)
	}
	if q := strings.TrimSpace(query); q != "" {
		like := "%" + q + "%"
		db = db.Where(
			"first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR CONCAT(first_name, ' ', last_name) LIKE ?",
			like, like, like, like,
		)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var leads []models.FunnelLead
	offset := (page - 1) * pageSize
	if err := db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&leads).Error; err != nil {
		return nil, 0, err
	}
	return leads, total, nil
}

func (r *funnelLeadRepository) FindByID(ctx context.Context, id uint) (*models.FunnelLead, error) {
	var lead models.FunnelLead
	if err := r.db.WithContext(ctx).First(&lead, id).Error; err != nil {
		return nil, err
	}
	return &lead, nil
}
