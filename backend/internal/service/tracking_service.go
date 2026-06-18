package service

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var (
	ErrTrackingNoSubscription = errors.New("no active subscription found")
	ErrInvalidTrackingPhoto   = errors.New("invalid tracking photo type")
	ErrInvalidWeight          = errors.New("weight must be between 20 and 300 kg")
)

type TrackingAlert struct {
	Type    string `json:"type"` // weight | photos
	Days    int    `json:"days"`
	Message string `json:"message"`
}

type TrackingPhotoDTO struct {
	ID          uint   `json:"id"`
	URL         string `json:"url"`
	Type        string `json:"type"`
	UploadedAt  string `json:"uploadedAt"`
	CheckInDate string `json:"checkInDate,omitempty"`
}

type PhotoTypeHistory struct {
	Type   string             `json:"type"`
	Label  string             `json:"label"`
	Photos []TrackingPhotoDTO `json:"photos"`
}

type WeightPointDTO struct {
	Date   string  `json:"date"`
	Weight float64 `json:"weight"`
}

type TrackingStatusDTO struct {
	NextDueDate            string            `json:"nextDueDate,omitempty"`
	FrequencyDays          int               `json:"frequencyDays"`
	WeightSubmitted        bool              `json:"weightSubmitted"`
	PhotosSubmitted        map[string]bool   `json:"photosSubmitted"`
	Alerts                 []TrackingAlert   `json:"alerts"`
	WeightHistory          []WeightPointDTO  `json:"weightHistory"`
	PhotoHistories         []PhotoTypeHistory `json:"photoHistories"`
	LastWeightKg           *float64          `json:"lastWeightKg,omitempty"`
	SubscriptionID         uint              `json:"subscriptionId,omitempty"`
}

type CoachTrackingStudentItem struct {
	ID              uint            `json:"id"`
	FullName        string          `json:"fullName"`
	Phone           string          `json:"phone"`
	NextDueDate     string          `json:"nextDueDate,omitempty"`
	Alerts          []TrackingAlert `json:"alerts"`
	WeightOverdue   bool            `json:"weightOverdue"`
	PhotosOverdue   bool            `json:"photosOverdue"`
	MaxOverdueDays  int             `json:"maxOverdueDays"`
}

type CoachTrackingListResponse struct {
	Items    []CoachTrackingStudentItem `json:"items"`
	Page     int                          `json:"page"`
	PageSize int                          `json:"pageSize"`
	Total    int64                        `json:"total"`
}

type CoachStudentTrackingDTO struct {
	StudentID      uint               `json:"studentId"`
	FullName       string             `json:"fullName"`
	Phone          string             `json:"phone"`
	TrackingStatus TrackingStatusDTO  `json:"tracking"`
}

type TrackingService interface {
	GetMyTracking(ctx context.Context, userID uint) (*TrackingStatusDTO, error)
	SubmitWeight(ctx context.Context, userID uint, weight float64) (*TrackingStatusDTO, error)
	UploadTrackingPhoto(ctx context.Context, userID uint, file io.Reader, filename, photoType string) (*TrackingPhotoDTO, error)
	ListCoachTrackingStudents(ctx context.Context, coachID uint, page, pageSize int, query string) (*CoachTrackingListResponse, error)
	GetCoachStudentTracking(ctx context.Context, coachID, studentID uint) (*CoachStudentTrackingDTO, error)
}

type trackingService struct {
	db              *gorm.DB
	subRepo         repository.SubscriptionRepository
	coachStudentSvc CoachStudentService
}

func NewTrackingService(db *gorm.DB, subRepo repository.SubscriptionRepository, coachStudentSvc CoachStudentService) TrackingService {
	return &trackingService{db: db, subRepo: subRepo, coachStudentSvc: coachStudentSvc}
}

var trackingPhotoLabels = map[string]string{
	models.PhotoTypeFront: "جلو",
	models.PhotoTypeBack:  "پشت",
	models.PhotoTypeSide:  "بغل",
}

func (s *trackingService) GetMyTracking(ctx context.Context, userID uint) (*TrackingStatusDTO, error) {
	sub, err := s.activeSubscription(ctx, userID)
	if err != nil {
		return nil, err
	}
	return s.buildTrackingStatus(ctx, userID, sub)
}

func (s *trackingService) SubmitWeight(ctx context.Context, userID uint, weight float64) (*TrackingStatusDTO, error) {
	if weight < 20 || weight > 300 {
		return nil, ErrInvalidWeight
	}
	sub, err := s.activeSubscription(ctx, userID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	checkIn := models.CheckIn{
		UserID:         userID,
		SubscriptionID: sub.ID,
		CheckInDate:    now,
		Weight:         weight,
	}
	if err := s.db.WithContext(ctx).Create(&checkIn).Error; err != nil {
		return nil, err
	}

	if err := s.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", userID).
		Update("weight_kg", weight).Error; err != nil {
		return nil, err
	}

	s.maybeAdvanceCheckInPeriod(ctx, sub)
	return s.buildTrackingStatus(ctx, userID, sub)
}

func (s *trackingService) UploadTrackingPhoto(ctx context.Context, userID uint, file io.Reader, filename, photoType string) (*TrackingPhotoDTO, error) {
	photoType = strings.ToLower(strings.TrimSpace(photoType))
	if !containsMeString(models.TrackingPhotoTypes, photoType) {
		return nil, ErrInvalidTrackingPhoto
	}

	sub, err := s.activeSubscription(ctx, userID)
	if err != nil {
		return nil, err
	}

	baseDir := meGetUploadDir()
	relDir := filepath.Join("users", fmt.Sprintf("%d", userID), "tracking")
	dir := filepath.Join(baseDir, relDir)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("creating upload dir: %w", err)
	}

	ext := filepath.Ext(filename)
	if ext == "" {
		ext = ".jpg"
	}
	uniqueName := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), photoType, ext)
	fullPath := filepath.Join(dir, uniqueName)

	dst, err := os.Create(fullPath)
	if err != nil {
		return nil, fmt.Errorf("creating file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		_ = os.Remove(fullPath)
		return nil, fmt.Errorf("writing file: %w", err)
	}

	now := time.Now()
	urlPath := "/" + filepath.ToSlash(filepath.Join("uploads", relDir, uniqueName))
	checkInDate := now

	photo := models.UserPhoto{
		UserID:         userID,
		SubscriptionID: sub.ID,
		FilePath:       urlPath,
		Type:           photoType,
		UploadedAt:     now,
		CheckInDate:    &checkInDate,
	}
	if err := s.db.WithContext(ctx).Create(&photo).Error; err != nil {
		_ = os.Remove(fullPath)
		return nil, err
	}

	s.maybeAdvanceCheckInPeriod(ctx, sub)

	return &TrackingPhotoDTO{
		ID:          photo.ID,
		URL:         photo.FilePath,
		Type:        photo.Type,
		UploadedAt:  photo.UploadedAt.Format(time.RFC3339),
		CheckInDate: checkInDate.Format(time.RFC3339),
	}, nil
}

func (s *trackingService) ListCoachTrackingStudents(ctx context.Context, coachID uint, page, pageSize int, query string) (*CoachTrackingListResponse, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	listResp, err := s.coachStudentSvc.ListStudents(ctx, coachID, page, pageSize, "active", query)
	if err != nil {
		return nil, err
	}

	items := make([]CoachTrackingStudentItem, 0, len(listResp.Items))
	for _, st := range listResp.Items {
		sub, subErr := s.activeSubscriptionForStudent(ctx, st.ID, coachID)
		if subErr != nil {
			continue
		}
		status, err := s.buildTrackingStatus(ctx, st.ID, sub)
		if err != nil {
			continue
		}
		weightOverdue, photosOverdue, maxDays := summarizeAlerts(status.Alerts)
		coachAlerts := coachAlertsFromStudent(status.Alerts, st.FullName)
		items = append(items, CoachTrackingStudentItem{
			ID:             st.ID,
			FullName:       st.FullName,
			Phone:          st.Phone,
			NextDueDate:    status.NextDueDate,
			Alerts:         coachAlerts,
			WeightOverdue:  weightOverdue,
			PhotosOverdue:  photosOverdue,
			MaxOverdueDays: maxDays,
		})
	}

	return &CoachTrackingListResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
		Total:    listResp.Total,
	}, nil
}

func (s *trackingService) GetCoachStudentTracking(ctx context.Context, coachID, studentID uint) (*CoachStudentTrackingDTO, error) {
	ok, err := s.coachStudentSvc.CanAccessStudent(ctx, coachID, studentID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrCoachStudentForbidden
	}

	var user models.User
	if err := s.db.WithContext(ctx).First(&user, studentID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoachStudentNotFound
		}
		return nil, err
	}

	sub, err := s.activeSubscriptionForStudent(ctx, studentID, coachID)
	if err != nil {
		return nil, err
	}

	status, err := s.buildTrackingStatus(ctx, studentID, sub)
	if err != nil {
		return nil, err
	}
	status.Alerts = coachAlertsFromStudent(status.Alerts, user.Name)

	return &CoachStudentTrackingDTO{
		StudentID:      studentID,
		FullName:       user.Name,
		Phone:          user.Phone,
		TrackingStatus: *status,
	}, nil
}

func (s *trackingService) activeSubscription(ctx context.Context, userID uint) (*models.Subscription, error) {
	now := time.Now()
	var sub models.Subscription
	err := s.db.WithContext(ctx).
		Where("user_id = ? AND (ends_at IS NULL OR ends_at > ?)", userID, now).
		Order("starts_at DESC").
		First(&sub).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTrackingNoSubscription
		}
		return nil, err
	}
	s.ensureSubscriptionDueDates(ctx, &sub)
	return &sub, nil
}

func (s *trackingService) activeSubscriptionForStudent(ctx context.Context, studentID, coachID uint) (*models.Subscription, error) {
	now := time.Now()
	var sub models.Subscription
	err := s.db.WithContext(ctx).
		Where("user_id = ? AND coach_id = ? AND (ends_at IS NULL OR ends_at > ?)", studentID, coachID, now).
		Order("starts_at DESC").
		First(&sub).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTrackingNoSubscription
		}
		return nil, err
	}
	s.ensureSubscriptionDueDates(ctx, &sub)
	return &sub, nil
}

func (s *trackingService) ensureSubscriptionDueDates(ctx context.Context, sub *models.Subscription) {
	if sub == nil {
		return
	}
	changed := false
	if sub.CheckinFrequencyDays <= 0 {
		sub.CheckinFrequencyDays = models.DefaultCheckinFrequencyDays
		changed = true
	}
	if sub.NextCheckInDueDate == nil {
		due := sub.StartsAt.AddDate(0, 0, sub.CheckinFrequencyDays)
		sub.NextCheckInDueDate = &due
		changed = true
	}
	if changed {
		_ = s.db.WithContext(ctx).Save(sub).Error
	}
}

func (s *trackingService) periodStart(sub *models.Subscription) time.Time {
	if sub.LastCheckInDate != nil {
		return *sub.LastCheckInDate
	}
	return sub.StartsAt
}

func (s *trackingService) hasWeightInPeriod(ctx context.Context, userID uint, sub *models.Subscription) bool {
	start := s.periodStart(sub)
	var count int64
	s.db.WithContext(ctx).Model(&models.CheckIn{}).
		Where("user_id = ? AND check_in_date > ?", userID, start).
		Count(&count)
	return count > 0
}

func (s *trackingService) photosInPeriod(ctx context.Context, userID uint, sub *models.Subscription) map[string]bool {
	start := s.periodStart(sub)
	result := map[string]bool{
		models.PhotoTypeFront: false,
		models.PhotoTypeBack:  false,
		models.PhotoTypeSide:  false,
	}
	var photos []models.UserPhoto
	s.db.WithContext(ctx).
		Where("user_id = ? AND check_in_date IS NOT NULL AND check_in_date > ?", userID, start).
		Find(&photos)
	for _, p := range photos {
		t := strings.ToLower(strings.TrimSpace(p.Type))
		if _, ok := result[t]; ok {
			result[t] = true
		}
	}
	return result
}

func (s *trackingService) maybeAdvanceCheckInPeriod(ctx context.Context, sub *models.Subscription) {
	if sub == nil {
		return
	}
	var fresh models.Subscription
	if err := s.db.WithContext(ctx).First(&fresh, sub.ID).Error; err != nil {
		return
	}
	sub = &fresh

	if !s.hasWeightInPeriod(ctx, sub.UserID, sub) {
		return
	}
	photos := s.photosInPeriod(ctx, sub.UserID, sub)
	for _, t := range models.TrackingPhotoTypes {
		if !photos[t] {
			return
		}
	}

	now := time.Now()
	sub.LastCheckInDate = &now
	nextDue := now.AddDate(0, 0, sub.CheckinFrequencyDays)
	sub.NextCheckInDueDate = &nextDue
	_ = s.db.WithContext(ctx).Save(sub).Error
}

func (s *trackingService) buildTrackingStatus(ctx context.Context, userID uint, sub *models.Subscription) (*TrackingStatusDTO, error) {
	s.ensureSubscriptionDueDates(ctx, sub)

	weightSubmitted := s.hasWeightInPeriod(ctx, userID, sub)
	photosSubmitted := s.photosInPeriod(ctx, userID, sub)

	var alerts []TrackingAlert
	if sub.NextCheckInDueDate != nil && time.Now().After(*sub.NextCheckInDueDate) {
		days := daysBetween(*sub.NextCheckInDueDate, time.Now())
		if !weightSubmitted {
			alerts = append(alerts, TrackingAlert{
				Type:    "weight",
				Days:    days,
				Message: fmt.Sprintf("شما %d روز است که وزن خود را وارد نکرده‌اید", days),
			})
		}
		missingPhotos := missingPhotoTypes(photosSubmitted)
		if len(missingPhotos) > 0 {
			alerts = append(alerts, TrackingAlert{
				Type:    "photos",
				Days:    days,
				Message: fmt.Sprintf("شما %d روز است که عکس‌های پایش (جلو، پشت، بغل) را آپلود نکرده‌اید", days),
			})
		}
	}

	weightHistory := s.loadWeightHistory(ctx, userID)
	photoHistories := s.loadPhotoHistories(ctx, userID)

	var lastWeight *float64
	if len(weightHistory) > 0 {
		w := weightHistory[len(weightHistory)-1].Weight
		lastWeight = &w
	}

	nextDue := ""
	if sub.NextCheckInDueDate != nil {
		nextDue = sub.NextCheckInDueDate.Format(time.RFC3339)
	}

	return &TrackingStatusDTO{
		NextDueDate:     nextDue,
		FrequencyDays:   sub.CheckinFrequencyDays,
		WeightSubmitted: weightSubmitted,
		PhotosSubmitted: photosSubmitted,
		Alerts:          alerts,
		WeightHistory:   weightHistory,
		PhotoHistories:  photoHistories,
		LastWeightKg:    lastWeight,
		SubscriptionID:  sub.ID,
	}, nil
}

func (s *trackingService) loadWeightHistory(ctx context.Context, userID uint) []WeightPointDTO {
	var checkIns []models.CheckIn
	s.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("check_in_date ASC").
		Find(&checkIns)

	points := make([]WeightPointDTO, 0, len(checkIns))
	for _, c := range checkIns {
		points = append(points, WeightPointDTO{
			Date:   c.CheckInDate.Format("2006-01-02"),
			Weight: c.Weight,
		})
	}
	return points
}

func (s *trackingService) loadPhotoHistories(ctx context.Context, userID uint) []PhotoTypeHistory {
	histories := make([]PhotoTypeHistory, 0, len(models.TrackingPhotoTypes))
	for _, t := range models.TrackingPhotoTypes {
		var photos []models.UserPhoto
		s.db.WithContext(ctx).
			Where("user_id = ? AND type = ? AND check_in_date IS NOT NULL", userID, t).
			Order("uploaded_at DESC").
			Find(&photos)

		dtos := make([]TrackingPhotoDTO, 0, len(photos))
		for _, p := range photos {
			dto := TrackingPhotoDTO{
				ID:         p.ID,
				URL:        p.FilePath,
				Type:       p.Type,
				UploadedAt: p.UploadedAt.Format(time.RFC3339),
			}
			if p.CheckInDate != nil {
				dto.CheckInDate = p.CheckInDate.Format(time.RFC3339)
			}
			dtos = append(dtos, dto)
		}

		label := trackingPhotoLabels[t]
		if label == "" {
			label = t
		}
		histories = append(histories, PhotoTypeHistory{
			Type:   t,
			Label:  label,
			Photos: dtos,
		})
	}
	return histories
}

func daysBetween(from, to time.Time) int {
	d := int(to.Sub(from).Hours() / 24)
	if d < 1 {
		return 1
	}
	return d
}

func missingPhotoTypes(submitted map[string]bool) []string {
	var missing []string
	for _, t := range models.TrackingPhotoTypes {
		if !submitted[t] {
			missing = append(missing, t)
		}
	}
	return missing
}

func summarizeAlerts(alerts []TrackingAlert) (weightOverdue, photosOverdue bool, maxDays int) {
	for _, a := range alerts {
		if a.Days > maxDays {
			maxDays = a.Days
		}
		switch a.Type {
		case "weight":
			weightOverdue = true
		case "photos":
			photosOverdue = true
		}
	}
	return
}

func coachAlertsFromStudent(alerts []TrackingAlert, studentName string) []TrackingAlert {
	if len(alerts) == 0 {
		return alerts
	}
	out := make([]TrackingAlert, len(alerts))
	for i, a := range alerts {
		out[i] = a
		switch a.Type {
		case "weight":
			out[i].Message = fmt.Sprintf("دانشجو %s، %d روز است که وزن خود را وارد نکرده است", studentName, a.Days)
		case "photos":
			out[i].Message = fmt.Sprintf("دانشجو %s، %d روز است که عکس‌های پایش را آپلود نکرده است", studentName, a.Days)
		}
	}
	return out
}
