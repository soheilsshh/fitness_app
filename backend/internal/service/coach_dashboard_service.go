package service

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/repository"
)

type CoachDashboardStats struct {
	TotalStudents       int64 `json:"totalStudents"`
	ActiveSubscriptions int64 `json:"activeSubscriptions"`
	MonthlySales        int64 `json:"monthlySales"`
}

type CoachDashboardService interface {
	GetStats(ctx context.Context, coachID uint) (*CoachDashboardStats, error)
}

type coachDashboardService struct {
	subRepo   repository.SubscriptionRepository
	orderRepo repository.OrderRepository
}

func NewCoachDashboardService(
	subRepo repository.SubscriptionRepository,
	orderRepo repository.OrderRepository,
) CoachDashboardService {
	return &coachDashboardService{subRepo: subRepo, orderRepo: orderRepo}
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
	return &CoachDashboardStats{
		TotalStudents:       total,
		ActiveSubscriptions: active,
		MonthlySales:        sales,
	}, nil
}
