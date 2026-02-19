package repository

import (
	"context"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

const defaultSiteSettingsID = 1

type SiteSettingsRepository interface {
	FindByID(ctx context.Context, id uint) (*models.SiteSettings, error)
	FirstOrCreate(ctx context.Context, settings *models.SiteSettings) error
	Save(ctx context.Context, settings *models.SiteSettings) error
}

type siteSettingsRepository struct {
	db *gorm.DB
}

func NewSiteSettingsRepository(db *gorm.DB) SiteSettingsRepository {
	return &siteSettingsRepository{db: db}
}

func (r *siteSettingsRepository) FindByID(ctx context.Context, id uint) (*models.SiteSettings, error) {
	var s models.SiteSettings
	if err := r.db.WithContext(ctx).First(&s, id).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *siteSettingsRepository) FirstOrCreate(ctx context.Context, settings *models.SiteSettings) error {
	err := r.db.WithContext(ctx).First(settings, defaultSiteSettingsID).Error
	if err == gorm.ErrRecordNotFound {
		settings.ID = defaultSiteSettingsID
		return r.db.WithContext(ctx).Create(settings).Error
	}
	return err
}

func (r *siteSettingsRepository) Save(ctx context.Context, settings *models.SiteSettings) error {
	return r.db.WithContext(ctx).Save(settings).Error
}
