package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var (
	ErrInvalidMobileStore    = errors.New("invalid mobile store")
	ErrInvalidMobilePlatform = errors.New("invalid mobile platform")
	ErrDeviceIDRequired      = errors.New("deviceId is required")
	ErrMobileReleaseNotFound = errors.New("mobile release not found")
)

var validStores = map[string]bool{
	"myket": true, "bazaar": true, "play": true, "appstore": true,
}
var validPlatforms = map[string]bool{
	"android": true, "ios": true,
}

type MobileHeartbeatRequest struct {
	DeviceID    string `json:"deviceId"`
	Store       string `json:"store"`
	Platform    string `json:"platform"`
	AppVersion  string `json:"appVersion"`
	BuildNumber string `json:"buildNumber"`
	OSVersion   string `json:"osVersion"`
	Model       string `json:"model"`
}

type MobileStoreStat struct {
	Store           string `json:"store"`
	Label           string `json:"label"`
	Devices         int64  `json:"devices"`
	InstallsReported int64 `json:"installsReported"`
	LatestVersion   string `json:"latestVersion"`
	IsPublished     bool   `json:"isPublished"`
}

type MobileOverviewResponse struct {
	TotalDevices     int64             `json:"totalDevices"`
	ActiveLast7Days  int64             `json:"activeLast7Days"`
	ActiveLast30Days int64             `json:"activeLast30Days"`
	LinkedUsers      int64             `json:"linkedUsers"`
	ByStore          []MobileStoreStat `json:"byStore"`
	ByPlatform       map[string]int64  `json:"byPlatform"`
	Versions         []MobileVersionDTO `json:"versions"`
}

type MobileVersionDTO struct {
	Store      string `json:"store"`
	Platform   string `json:"platform"`
	AppVersion string `json:"appVersion"`
	Count      int64  `json:"count"`
}

type MobileDeviceListResponse struct {
	Items    []models.MobileDevice `json:"items"`
	Total    int64                 `json:"total"`
	Page     int                   `json:"page"`
	PageSize int                   `json:"pageSize"`
}

type MobileReleaseUpsertRequest struct {
	Store            string  `json:"store"`
	VersionName      string  `json:"versionName"`
	VersionCode      int     `json:"versionCode"`
	ReleaseNotes     string  `json:"releaseNotes"`
	IsPublished      *bool   `json:"isPublished"`
	DownloadURL      string  `json:"downloadUrl"`
	MinOS            string  `json:"minOs"`
	InstallsReported *int64  `json:"installsReported"`
	ReleasedAt       *string `json:"releasedAt"`
}

type MobileAppService interface {
	Heartbeat(ctx context.Context, userID *uint, req *MobileHeartbeatRequest) error
	Overview(ctx context.Context) (*MobileOverviewResponse, error)
	ListDevices(ctx context.Context, store, platform string, page, pageSize int) (*MobileDeviceListResponse, error)
	ListReleases(ctx context.Context) ([]models.MobileStoreRelease, error)
	CreateRelease(ctx context.Context, req *MobileReleaseUpsertRequest) (*models.MobileStoreRelease, error)
	UpdateRelease(ctx context.Context, id uint, req *MobileReleaseUpsertRequest) (*models.MobileStoreRelease, error)
	DeleteRelease(ctx context.Context, id uint) error
}

type mobileAppService struct {
	devices  repository.MobileDeviceRepository
	releases repository.MobileReleaseRepository
}

func NewMobileAppService(
	devices repository.MobileDeviceRepository,
	releases repository.MobileReleaseRepository,
) MobileAppService {
	return &mobileAppService{devices: devices, releases: releases}
}

func storeLabel(store string) string {
	switch store {
	case "myket":
		return "مایکت"
	case "bazaar":
		return "کافه‌بازار"
	case "play":
		return "گوگل پلی"
	case "appstore":
		return "اپ استور"
	default:
		return store
	}
}

func normalizeStore(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	switch s {
	case "cafebazaar", "cafe_bazaar", "cafe-bazaar":
		return "bazaar"
	case "googleplay", "google_play", "google-play":
		return "play"
	case "ios", "apple":
		return "appstore"
	default:
		return s
	}
}

func (s *mobileAppService) Heartbeat(ctx context.Context, userID *uint, req *MobileHeartbeatRequest) error {
	if req == nil || strings.TrimSpace(req.DeviceID) == "" {
		return ErrDeviceIDRequired
	}
	store := normalizeStore(req.Store)
	platform := strings.ToLower(strings.TrimSpace(req.Platform))
	if !validStores[store] {
		return ErrInvalidMobileStore
	}
	if !validPlatforms[platform] {
		return ErrInvalidMobilePlatform
	}
	now := time.Now()
	return s.devices.UpsertHeartbeat(ctx, &models.MobileDevice{
		UserID:      userID,
		DeviceID:    strings.TrimSpace(req.DeviceID),
		Store:       store,
		Platform:    platform,
		AppVersion:  strings.TrimSpace(req.AppVersion),
		BuildNumber: strings.TrimSpace(req.BuildNumber),
		OSVersion:   strings.TrimSpace(req.OSVersion),
		Model:       strings.TrimSpace(req.Model),
		FirstSeenAt: now,
		LastSeenAt:  now,
	})
}

func (s *mobileAppService) Overview(ctx context.Context) (*MobileOverviewResponse, error) {
	byStore, err := s.devices.CountByStore(ctx)
	if err != nil {
		return nil, err
	}
	byPlatform, err := s.devices.CountByPlatform(ctx)
	if err != nil {
		return nil, err
	}
	active7, err := s.devices.CountActiveSince(ctx, time.Now().AddDate(0, 0, -7))
	if err != nil {
		return nil, err
	}
	active30, err := s.devices.CountActiveSince(ctx, time.Now().AddDate(0, 0, -30))
	if err != nil {
		return nil, err
	}
	linked, err := s.devices.CountLinkedUsers(ctx)
	if err != nil {
		return nil, err
	}
	versions, err := s.devices.VersionBreakdown(ctx)
	if err != nil {
		return nil, err
	}
	releases, err := s.releases.List(ctx)
	if err != nil {
		return nil, err
	}

	latestByStore := map[string]models.MobileStoreRelease{}
	installsByStore := map[string]int64{}
	for _, r := range releases {
		installsByStore[r.Store] += r.InstallsReported
		cur, ok := latestByStore[r.Store]
		if !ok || r.VersionCode > cur.VersionCode {
			latestByStore[r.Store] = r
		}
	}

	storeOrder := []string{"myket", "bazaar", "play", "appstore"}
	stats := make([]MobileStoreStat, 0, len(storeOrder))
	var total int64
	for _, store := range storeOrder {
		total += byStore[store]
		latest := latestByStore[store]
		stats = append(stats, MobileStoreStat{
			Store:            store,
			Label:            storeLabel(store),
			Devices:          byStore[store],
			InstallsReported: installsByStore[store],
			LatestVersion:    latest.VersionName,
			IsPublished:      latest.IsPublished,
		})
	}

	verDTOs := make([]MobileVersionDTO, 0, len(versions))
	for _, v := range versions {
		verDTOs = append(verDTOs, MobileVersionDTO{
			Store:      v.Store,
			Platform:   v.Platform,
			AppVersion: v.AppVersion,
			Count:      v.Count,
		})
	}

	return &MobileOverviewResponse{
		TotalDevices:     total,
		ActiveLast7Days:  active7,
		ActiveLast30Days: active30,
		LinkedUsers:      linked,
		ByStore:          stats,
		ByPlatform:       byPlatform,
		Versions:         verDTOs,
	}, nil
}

func (s *mobileAppService) ListDevices(ctx context.Context, store, platform string, page, pageSize int) (*MobileDeviceListResponse, error) {
	items, total, err := s.devices.List(ctx, normalizeStore(store), strings.ToLower(platform), page, pageSize)
	if err != nil {
		return nil, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	return &MobileDeviceListResponse{Items: items, Total: total, Page: page, PageSize: pageSize}, nil
}

func (s *mobileAppService) ListReleases(ctx context.Context) ([]models.MobileStoreRelease, error) {
	return s.releases.List(ctx)
}

func (s *mobileAppService) CreateRelease(ctx context.Context, req *MobileReleaseUpsertRequest) (*models.MobileStoreRelease, error) {
	item, err := s.buildRelease(0, req)
	if err != nil {
		return nil, err
	}
	if err := s.releases.Create(ctx, item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *mobileAppService) UpdateRelease(ctx context.Context, id uint, req *MobileReleaseUpsertRequest) (*models.MobileStoreRelease, error) {
	existing, err := s.releases.GetByID(ctx, id)
	if err != nil {
		return nil, ErrMobileReleaseNotFound
	}
	item, err := s.buildRelease(id, req)
	if err != nil {
		return nil, err
	}
	item.CreatedAt = existing.CreatedAt
	if req.IsPublished == nil {
		item.IsPublished = existing.IsPublished
	}
	if req.InstallsReported == nil {
		item.InstallsReported = existing.InstallsReported
	}
	if err := s.releases.Update(ctx, item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *mobileAppService) DeleteRelease(ctx context.Context, id uint) error {
	if _, err := s.releases.GetByID(ctx, id); err != nil {
		return ErrMobileReleaseNotFound
	}
	return s.releases.Delete(ctx, id)
}

func (s *mobileAppService) buildRelease(id uint, req *MobileReleaseUpsertRequest) (*models.MobileStoreRelease, error) {
	if req == nil {
		return nil, ErrInvalidMobileStore
	}
	store := normalizeStore(req.Store)
	if !validStores[store] {
		return nil, ErrInvalidMobileStore
	}
	if strings.TrimSpace(req.VersionName) == "" {
		return nil, errors.New("versionName is required")
	}
	item := &models.MobileStoreRelease{
		ID:           id,
		Store:        store,
		VersionName:  strings.TrimSpace(req.VersionName),
		VersionCode:  req.VersionCode,
		ReleaseNotes: strings.TrimSpace(req.ReleaseNotes),
		DownloadURL:  strings.TrimSpace(req.DownloadURL),
		MinOS:        strings.TrimSpace(req.MinOS),
	}
	if item.VersionCode < 1 {
		item.VersionCode = 1
	}
	if req.IsPublished != nil {
		item.IsPublished = *req.IsPublished
	}
	if req.InstallsReported != nil {
		item.InstallsReported = *req.InstallsReported
	}
	if req.ReleasedAt != nil && strings.TrimSpace(*req.ReleasedAt) != "" {
		if t, err := time.Parse(time.RFC3339, strings.TrimSpace(*req.ReleasedAt)); err == nil {
			item.ReleasedAt = &t
		}
	}
	return item, nil
}
