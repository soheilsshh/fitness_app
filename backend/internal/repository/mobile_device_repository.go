package repository

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type MobileDeviceRepository interface {
	UpsertHeartbeat(ctx context.Context, device *models.MobileDevice) error
	List(ctx context.Context, store, platform string, page, pageSize int) ([]models.MobileDevice, int64, error)
	CountByStore(ctx context.Context) (map[string]int64, error)
	CountByPlatform(ctx context.Context) (map[string]int64, error)
	CountActiveSince(ctx context.Context, since time.Time) (int64, error)
	CountLinkedUsers(ctx context.Context) (int64, error)
	VersionBreakdown(ctx context.Context) ([]MobileVersionRow, error)
}

type MobileVersionRow struct {
	Store      string
	Platform   string
	AppVersion string
	Count      int64
}

type mobileDeviceRepository struct{ db *gorm.DB }

func NewMobileDeviceRepository(db *gorm.DB) MobileDeviceRepository {
	return &mobileDeviceRepository{db: db}
}

func (r *mobileDeviceRepository) UpsertHeartbeat(ctx context.Context, device *models.MobileDevice) error {
	now := time.Now()
	if device.FirstSeenAt.IsZero() {
		device.FirstSeenAt = now
	}
	device.LastSeenAt = now
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "device_id"}},
		DoUpdates: clause.Assignments(map[string]any{
			"user_id":      device.UserID,
			"store":        device.Store,
			"platform":     device.Platform,
			"app_version":  device.AppVersion,
			"build_number": device.BuildNumber,
			"os_version":   device.OSVersion,
			"model":        device.Model,
			"last_seen_at": now,
			"updated_at":   now,
		}),
	}).Create(device).Error
}

func (r *mobileDeviceRepository) List(ctx context.Context, store, platform string, page, pageSize int) ([]models.MobileDevice, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	q := r.db.WithContext(ctx).Model(&models.MobileDevice{})
	if store != "" && store != "all" {
		q = q.Where("store = ?", store)
	}
	if platform != "" && platform != "all" {
		q = q.Where("platform = ?", platform)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []models.MobileDevice
	err := q.Order("last_seen_at desc").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error
	return items, total, err
}

func (r *mobileDeviceRepository) CountByStore(ctx context.Context) (map[string]int64, error) {
	type row struct {
		Store string
		Cnt   int64
	}
	var rows []row
	if err := r.db.WithContext(ctx).Model(&models.MobileDevice{}).
		Select("store, count(*) as cnt").Group("store").Scan(&rows).Error; err != nil {
		return nil, err
	}
	out := map[string]int64{}
	for _, r0 := range rows {
		out[r0.Store] = r0.Cnt
	}
	return out, nil
}

func (r *mobileDeviceRepository) CountByPlatform(ctx context.Context) (map[string]int64, error) {
	type row struct {
		Platform string
		Cnt      int64
	}
	var rows []row
	if err := r.db.WithContext(ctx).Model(&models.MobileDevice{}).
		Select("platform, count(*) as cnt").Group("platform").Scan(&rows).Error; err != nil {
		return nil, err
	}
	out := map[string]int64{}
	for _, r0 := range rows {
		out[r0.Platform] = r0.Cnt
	}
	return out, nil
}

func (r *mobileDeviceRepository) CountActiveSince(ctx context.Context, since time.Time) (int64, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&models.MobileDevice{}).
		Where("last_seen_at >= ?", since).Count(&n).Error
	return n, err
}

func (r *mobileDeviceRepository) CountLinkedUsers(ctx context.Context) (int64, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&models.MobileDevice{}).
		Where("user_id is not null").Distinct("user_id").Count(&n).Error
	return n, err
}

func (r *mobileDeviceRepository) VersionBreakdown(ctx context.Context) ([]MobileVersionRow, error) {
	var rows []MobileVersionRow
	err := r.db.WithContext(ctx).Model(&models.MobileDevice{}).
		Select("store, platform, app_version as app_version, count(*) as count").
		Group("store, platform, app_version").
		Order("count desc").
		Scan(&rows).Error
	return rows, err
}

type MobileReleaseRepository interface {
	List(ctx context.Context) ([]models.MobileStoreRelease, error)
	GetByID(ctx context.Context, id uint) (*models.MobileStoreRelease, error)
	Create(ctx context.Context, item *models.MobileStoreRelease) error
	Update(ctx context.Context, item *models.MobileStoreRelease) error
	Delete(ctx context.Context, id uint) error
}

type mobileReleaseRepository struct{ db *gorm.DB }

func NewMobileReleaseRepository(db *gorm.DB) MobileReleaseRepository {
	return &mobileReleaseRepository{db: db}
}

func (r *mobileReleaseRepository) List(ctx context.Context) ([]models.MobileStoreRelease, error) {
	var items []models.MobileStoreRelease
	err := r.db.WithContext(ctx).Order("store asc, version_code desc").Find(&items).Error
	return items, err
}

func (r *mobileReleaseRepository) GetByID(ctx context.Context, id uint) (*models.MobileStoreRelease, error) {
	var item models.MobileStoreRelease
	if err := r.db.WithContext(ctx).First(&item, id).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *mobileReleaseRepository) Create(ctx context.Context, item *models.MobileStoreRelease) error {
	return r.db.WithContext(ctx).Create(item).Error
}

func (r *mobileReleaseRepository) Update(ctx context.Context, item *models.MobileStoreRelease) error {
	return r.db.WithContext(ctx).Save(item).Error
}

func (r *mobileReleaseRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.MobileStoreRelease{}, id).Error
}
