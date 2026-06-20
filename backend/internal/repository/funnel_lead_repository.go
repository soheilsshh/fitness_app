package repository

import (
	"context"
	"strings"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
)

// FunnelStats holds aggregate counters for the admin funnel KPI cards.
type FunnelStats struct {
	Total        int64
	Paid         int64
	Pending      int64
	Contacted    int64
	UniquePeople int64 // distinct phones that completed the funnel
	Converted    int64 // distinct phones that later registered on the site
	PaidRevenue  int64
}

type FunnelLeadRepository interface {
	Create(ctx context.Context, lead *models.FunnelLead) error
	FindByCheckoutToken(ctx context.Context, token string) (*models.FunnelLead, error)
	Update(ctx context.Context, lead *models.FunnelLead) error
	List(ctx context.Context, status string, query string, page, pageSize int) ([]models.FunnelLead, int64, error)
	FindByID(ctx context.Context, id uint) (*models.FunnelLead, error)
	Delete(ctx context.Context, id uint) error
	// RegisteredPhones returns phone->userID for any of the given phones that
	// belong to a registered (non-deleted) user — the basis for conversion.
	RegisteredPhones(ctx context.Context, phones []string) (map[string]uint, error)
	Stats(ctx context.Context) (*FunnelStats, error)
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

func (r *funnelLeadRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.FunnelLead{}, id).Error
}

func (r *funnelLeadRepository) RegisteredPhones(ctx context.Context, phones []string) (map[string]uint, error) {
	result := make(map[string]uint)
	if len(phones) == 0 {
		return result, nil
	}
	type row struct {
		Phone string
		ID    uint
	}
	var rows []row
	if err := r.db.WithContext(ctx).
		Model(&models.User{}).
		Select("phone, id").
		Where("phone IN ?", phones).
		Find(&rows).Error; err != nil {
		return nil, err
	}
	for _, x := range rows {
		if _, ok := result[x.Phone]; !ok {
			result[x.Phone] = x.ID
		}
	}
	return result, nil
}

func (r *funnelLeadRepository) Stats(ctx context.Context) (*FunnelStats, error) {
	db := r.db.WithContext(ctx)
	var s FunnelStats

	if err := db.Model(&models.FunnelLead{}).Count(&s.Total).Error; err != nil {
		return nil, err
	}
	if err := db.Model(&models.FunnelLead{}).Where("status = ?", models.FunnelStatusPaid).Count(&s.Paid).Error; err != nil {
		return nil, err
	}
	if err := db.Model(&models.FunnelLead{}).Where("status = ?", models.FunnelStatusPendingPayment).Count(&s.Pending).Error; err != nil {
		return nil, err
	}
	if err := db.Model(&models.FunnelLead{}).Where("status = ?", models.FunnelStatusContacted).Count(&s.Contacted).Error; err != nil {
		return nil, err
	}
	if err := db.Model(&models.FunnelLead{}).Distinct("phone").Count(&s.UniquePeople).Error; err != nil {
		return nil, err
	}
	if err := db.Model(&models.FunnelLead{}).
		Where("status = ?", models.FunnelStatusPaid).
		Select("COALESCE(SUM(amount_cents), 0)").
		Scan(&s.PaidRevenue).Error; err != nil {
		return nil, err
	}
	// Conversion = distinct funnel phones that match a registered user.
	if err := db.
		Raw(`SELECT COUNT(DISTINCT fl.phone)
		     FROM funnel_leads fl
		     JOIN users u ON u.phone = fl.phone AND u.deleted_at IS NULL
		     WHERE fl.deleted_at IS NULL`).
		Scan(&s.Converted).Error; err != nil {
		return nil, err
	}
	return &s, nil
}
