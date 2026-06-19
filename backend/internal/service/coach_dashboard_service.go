package service

import (
	"context"
	"math"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

type CoachDashboardStats struct {
	TotalStudents       int64 `json:"totalStudents"`
	ActiveSubscriptions int64 `json:"activeSubscriptions"`
	MonthlySales        int64 `json:"monthlySales"`
	ProgramAdherence    int   `json:"programAdherence"`
}

type CoachDashboardService interface {
	GetStats(ctx context.Context, coachID uint) (*CoachDashboardStats, error)
}

type coachDashboardService struct {
	db        *gorm.DB
	subRepo   repository.SubscriptionRepository
	orderRepo repository.OrderRepository
}

func NewCoachDashboardService(
	db *gorm.DB,
	subRepo repository.SubscriptionRepository,
	orderRepo repository.OrderRepository,
) CoachDashboardService {
	return &coachDashboardService{db: db, subRepo: subRepo, orderRepo: orderRepo}
}

func (s *coachDashboardService) GetStats(ctx context.Context, coachID uint) (*CoachDashboardStats, error) {
	now := time.Now()
	total, err := s.subRepo.CountStudentsByCoachID(ctx, coachID)
	if err != nil {
		return nil, err
	}
	active, err := s.subRepo.CountActiveSubscriptionsByCoachID(ctx, coachID, now)
	if err != nil {
		return nil, err
	}
	sales, err := s.orderRepo.SumPaidAmountByCoachIDInMonth(ctx, coachID, now.Year(), int(now.Month()))
	if err != nil {
		return nil, err
	}
	adherence, err := s.programAdherence(ctx, coachID, now)
	if err != nil {
		return nil, err
	}
	return &CoachDashboardStats{
		TotalStudents:       total,
		ActiveSubscriptions: active,
		MonthlySales:        sales,
		ProgramAdherence:    adherence,
	}, nil
}

// programAdherence returns the average percentage of scheduled workout days that
// active students actually completed in the last 7 days. Per active subscription
// with a workout program, expected = distinct training days per week in the
// program, completed = distinct days logged this week; the per-student ratio is
// capped at 100% and averaged across students.
func (s *coachDashboardService) programAdherence(ctx context.Context, coachID uint, now time.Time) (int, error) {
	var subIDs []uint
	if err := s.db.WithContext(ctx).
		Model(&models.Subscription{}).
		Where("coach_id = ? AND (ends_at IS NULL OR ends_at > ?)", coachID, now).
		Pluck("id", &subIDs).Error; err != nil {
		return 0, err
	}
	if len(subIDs) == 0 {
		return 0, nil
	}

	type aggRow struct {
		SubscriptionID uint
		Days           int
	}

	var expectedRows []aggRow
	if err := s.db.WithContext(ctx).
		Table("workout_programs wp").
		Select("wp.subscription_id AS subscription_id, COUNT(DISTINCT pi.day_number) AS days").
		Joins("JOIN program_items pi ON pi.workout_program_id = wp.id AND pi.deleted_at IS NULL").
		Where("wp.subscription_id IN ? AND wp.is_active = ? AND wp.deleted_at IS NULL", subIDs, true).
		Group("wp.subscription_id").
		Scan(&expectedRows).Error; err != nil {
		return 0, err
	}

	expected := make(map[uint]int, len(expectedRows))
	withProgram := make([]uint, 0, len(expectedRows))
	for _, r := range expectedRows {
		if r.Days > 0 {
			expected[r.SubscriptionID] = r.Days
			withProgram = append(withProgram, r.SubscriptionID)
		}
	}
	if len(expected) == 0 {
		return 0, nil
	}

	since := now.AddDate(0, 0, -7)
	var completedRows []aggRow
	if err := s.db.WithContext(ctx).
		Model(&models.WorkoutSession{}).
		Select("subscription_id, COUNT(DISTINCT day_key) AS days").
		Where("subscription_id IN ? AND completed_at > ?", withProgram, since).
		Group("subscription_id").
		Scan(&completedRows).Error; err != nil {
		return 0, err
	}
	completed := make(map[uint]int, len(completedRows))
	for _, r := range completedRows {
		completed[r.SubscriptionID] = r.Days
	}

	var sum float64
	for subID, expDays := range expected {
		ratio := float64(completed[subID]) / float64(expDays)
		if ratio > 1 {
			ratio = 1
		}
		sum += ratio
	}
	return int(math.Round(sum / float64(len(expected)) * 100)), nil
}
