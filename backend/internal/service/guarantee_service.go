package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var (
	ErrGuaranteeTypeInvalid   = errors.New("guarantee type must be result or quality")
	ErrGuaranteeReasonRequired = errors.New("reason is required")
	ErrGuaranteeNoSubscription = errors.New("no active subscription")
	ErrGuaranteeAlreadyOpen   = errors.New("an open guarantee case already exists for this subscription")
	ErrGuaranteeNotFound      = errors.New("guarantee case not found")
	ErrGuaranteeResolutionInvalid = errors.New("resolution must be free_extension or refund when approving")
)

type ComplianceSnapshotDTO struct {
	SubscriptionID             uint    `json:"subscriptionId"`
	PeriodDays                 int     `json:"periodDays"`
	NutritionCompliancePercent float64 `json:"nutritionCompliancePercent"`
	WorkoutCompliancePercent   float64 `json:"workoutCompliancePercent"`
	CoachSessionsCount         int     `json:"coachSessionsCount"`
}

type GuaranteeCaseDTO struct {
	ID                         uint    `json:"id"`
	UserID                     uint    `json:"userId"`
	SubscriptionID             uint    `json:"subscriptionId"`
	CoachID                    uint    `json:"coachId"`
	Type                       string  `json:"type"`
	Status                     string  `json:"status"`
	Reason                     string  `json:"reason"`
	NutritionCompliancePercent float64 `json:"nutritionCompliancePercent"`
	WorkoutCompliancePercent   float64 `json:"workoutCompliancePercent"`
	CoachSessionsCount         int     `json:"coachSessionsCount"`
	Resolution                 string  `json:"resolution,omitempty"`
	ResolutionNotes            string  `json:"resolutionNotes,omitempty"`
	CreatedAt                  string  `json:"createdAt"`
}

type GuaranteeListResponse struct {
	Items    []GuaranteeCaseDTO `json:"items"`
	Total    int64              `json:"total"`
	Page     int                `json:"page"`
	PageSize int                `json:"pageSize"`
}

type GuaranteeRequest struct {
	Type   string `json:"type"`
	Reason string `json:"reason"`
}

type GuaranteeReviewRequest struct {
	Status          string `json:"status"` // approved | rejected
	Resolution      string `json:"resolution"`
	ResolutionNotes string `json:"resolutionNotes"`
}

// GuaranteeService implements the platform guarantees (roadmap I1/I2):
// a student's claim carries an objective compliance snapshot computed from
// their own logs, so admin review (BE-10.2/Admin-10.3) isn't just narrative.
type GuaranteeService interface {
	ComputeCompliance(ctx context.Context, userID uint) (*ComplianceSnapshotDTO, error)
	Submit(ctx context.Context, userID uint, req *GuaranteeRequest) (*GuaranteeCaseDTO, error)
	ListMine(ctx context.Context, userID uint, page, pageSize int) (*GuaranteeListResponse, error)
	ListAll(ctx context.Context, status string, page, pageSize int) (*GuaranteeListResponse, error)
	Review(ctx context.Context, adminID, caseID uint, req *GuaranteeReviewRequest) (*GuaranteeCaseDTO, error)
}

type guaranteeService struct {
	db            *gorm.DB
	repo          repository.GuaranteeRepository
	subscriptions repository.SubscriptionRepository
	sessions      repository.CoachSessionRepository
}

func NewGuaranteeService(
	db *gorm.DB,
	repo repository.GuaranteeRepository,
	subscriptions repository.SubscriptionRepository,
	sessions repository.CoachSessionRepository,
) GuaranteeService {
	return &guaranteeService{db: db, repo: repo, subscriptions: subscriptions, sessions: sessions}
}

func (s *guaranteeService) ComputeCompliance(ctx context.Context, userID uint) (*ComplianceSnapshotDTO, error) {
	sub, err := s.findCurrentSubscription(ctx, userID)
	if err != nil {
		return nil, err
	}
	return s.computeForSubscription(ctx, userID, sub)
}

// findCurrentSubscription normalizes FindCurrentByUserID's "no rows" case
// (gorm.ErrRecordNotFound, not a nil subscription) into ErrGuaranteeNoSubscription.
func (s *guaranteeService) findCurrentSubscription(ctx context.Context, userID uint) (*models.Subscription, error) {
	sub, err := s.subscriptions.FindCurrentByUserID(ctx, userID, time.Now())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrGuaranteeNoSubscription
		}
		return nil, err
	}
	if sub == nil {
		return nil, ErrGuaranteeNoSubscription
	}
	return sub, nil
}

func (s *guaranteeService) computeForSubscription(ctx context.Context, userID uint, sub *models.Subscription) (*ComplianceSnapshotDTO, error) {
	since := sub.StartsAt
	until := time.Now()
	if sub.EndsAt != nil && sub.EndsAt.Before(until) {
		until = *sub.EndsAt
	}
	days := int(until.Sub(since).Hours() / 24)
	if days <= 0 {
		days = 1
	}

	var nutritionDaysLogged int64
	if err := s.db.WithContext(ctx).Model(&models.DailyFoodLog{}).
		Where("user_id = ? AND log_date >= ? AND log_date <= ?", userID, since, until).
		Distinct("DATE(log_date)").Count(&nutritionDaysLogged).Error; err != nil {
		return nil, err
	}

	var workoutSessionDays int64
	if err := s.db.WithContext(ctx).Model(&models.WorkoutSession{}).
		Where("user_id = ? AND completed_at >= ? AND completed_at <= ?", userID, since, until).
		Distinct("DATE(completed_at)").Count(&workoutSessionDays).Error; err != nil {
		return nil, err
	}

	_, sessionTotal, err := s.sessions.ListByStudent(ctx, userID, 1, 1)
	if err != nil {
		return nil, err
	}

	nutritionPct := percentOf(nutritionDaysLogged, int64(days))
	// Roadmap plans are typically 3-4 workout days/week; use days/2 as the
	// expected-sessions denominator so "compliant" caps near 100% for a
	// realistic split-day program rather than requiring a daily workout.
	expectedWorkoutDays := int64(days) / 2
	if expectedWorkoutDays <= 0 {
		expectedWorkoutDays = 1
	}
	workoutPct := percentOf(workoutSessionDays, expectedWorkoutDays)

	return &ComplianceSnapshotDTO{
		SubscriptionID:             sub.ID,
		PeriodDays:                 days,
		NutritionCompliancePercent: nutritionPct,
		WorkoutCompliancePercent:   workoutPct,
		CoachSessionsCount:         int(sessionTotal),
	}, nil
}

func percentOf(actual, expected int64) float64 {
	if expected <= 0 {
		return 0
	}
	pct := float64(actual) / float64(expected) * 100
	if pct > 100 {
		pct = 100
	}
	return pct
}

func (s *guaranteeService) Submit(ctx context.Context, userID uint, req *GuaranteeRequest) (*GuaranteeCaseDTO, error) {
	guaranteeType := strings.ToLower(strings.TrimSpace(req.Type))
	if guaranteeType != models.GuaranteeTypeResult && guaranteeType != models.GuaranteeTypeQuality {
		return nil, ErrGuaranteeTypeInvalid
	}
	reason := strings.TrimSpace(req.Reason)
	if reason == "" {
		return nil, ErrGuaranteeReasonRequired
	}

	sub, err := s.findCurrentSubscription(ctx, userID)
	if err != nil {
		return nil, err
	}
	open, err := s.repo.HasOpenCase(ctx, userID, sub.ID)
	if err != nil {
		return nil, err
	}
	if open {
		return nil, ErrGuaranteeAlreadyOpen
	}

	snapshot, err := s.computeForSubscription(ctx, userID, sub)
	if err != nil {
		return nil, err
	}

	gc := &models.GuaranteeCase{
		UserID: userID, SubscriptionID: sub.ID, CoachID: sub.CoachID,
		Type: guaranteeType, Status: models.GuaranteeStatusPending, Reason: reason,
		NutritionCompliancePercent: snapshot.NutritionCompliancePercent,
		WorkoutCompliancePercent:   snapshot.WorkoutCompliancePercent,
		CoachSessionsCount:         snapshot.CoachSessionsCount,
	}
	if err := s.repo.Create(ctx, gc); err != nil {
		return nil, err
	}
	dto := guaranteeToDTO(*gc)
	return &dto, nil
}

func (s *guaranteeService) ListMine(ctx context.Context, userID uint, page, pageSize int) (*GuaranteeListResponse, error) {
	items, total, err := s.repo.ListByUser(ctx, userID, page, pageSize)
	if err != nil {
		return nil, err
	}
	return toGuaranteeListResponse(items, total, page, pageSize), nil
}

func (s *guaranteeService) ListAll(ctx context.Context, status string, page, pageSize int) (*GuaranteeListResponse, error) {
	items, total, err := s.repo.ListAll(ctx, status, page, pageSize)
	if err != nil {
		return nil, err
	}
	return toGuaranteeListResponse(items, total, page, pageSize), nil
}

func (s *guaranteeService) Review(ctx context.Context, adminID, caseID uint, req *GuaranteeReviewRequest) (*GuaranteeCaseDTO, error) {
	gc, err := s.repo.FindByID(ctx, caseID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrGuaranteeNotFound
		}
		return nil, err
	}
	status := strings.ToLower(strings.TrimSpace(req.Status))
	switch status {
	case models.GuaranteeStatusApproved:
		resolution := strings.ToLower(strings.TrimSpace(req.Resolution))
		if resolution != models.GuaranteeResolutionFreeExtension && resolution != models.GuaranteeResolutionRefund {
			return nil, ErrGuaranteeResolutionInvalid
		}
		gc.Resolution = resolution
	case models.GuaranteeStatusRejected:
		gc.Resolution = models.GuaranteeResolutionNone
	default:
		return nil, ErrGuaranteeResolutionInvalid
	}
	gc.Status = status
	gc.ResolutionNotes = strings.TrimSpace(req.ResolutionNotes)
	id := adminID
	gc.ReviewedByAdminID = &id
	if err := s.repo.Update(ctx, gc); err != nil {
		return nil, err
	}
	dto := guaranteeToDTO(*gc)
	return &dto, nil
}

func guaranteeToDTO(g models.GuaranteeCase) GuaranteeCaseDTO {
	return GuaranteeCaseDTO{
		ID: g.ID, UserID: g.UserID, SubscriptionID: g.SubscriptionID, CoachID: g.CoachID,
		Type: g.Type, Status: g.Status, Reason: g.Reason,
		NutritionCompliancePercent: g.NutritionCompliancePercent,
		WorkoutCompliancePercent:   g.WorkoutCompliancePercent,
		CoachSessionsCount:         g.CoachSessionsCount,
		Resolution:                 g.Resolution, ResolutionNotes: g.ResolutionNotes,
		CreatedAt: g.CreatedAt.Format(time.RFC3339),
	}
}

func toGuaranteeListResponse(items []models.GuaranteeCase, total int64, page, pageSize int) *GuaranteeListResponse {
	dtos := make([]GuaranteeCaseDTO, 0, len(items))
	for _, it := range items {
		dtos = append(dtos, guaranteeToDTO(it))
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	return &GuaranteeListResponse{Items: dtos, Total: total, Page: page, PageSize: pageSize}
}
