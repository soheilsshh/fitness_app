package service

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
	"gorm.io/gorm"
)

// DashboardStatsResponse matches frontend AdminDashboardClient expectations.
type DashboardStatsResponse struct {
	Year              int   `json:"year"`
	TotalUsers        int64 `json:"totalUsers"`
	ActiveUsers       int64 `json:"activeUsers"`
	PurchasedCourses  int64 `json:"purchasedCourses"`
}

// MonthlySaleItem matches frontend SalesChart data: month (Persian name), courses, sales.
type MonthlySaleItem struct {
	Month   string `json:"month"`
	Courses int64  `json:"courses"`
	Sales   int64  `json:"sales"`
}

var persianMonthNames = []string{
	"فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
	"مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
}

type AdminDashboardService interface {
	GetStats(ctx context.Context, year int) (*DashboardStatsResponse, error)
	GetMonthlySales(ctx context.Context, year int) ([]MonthlySaleItem, error)
}

type adminDashboardService struct {
	db    *gorm.DB
	subRepo repository.SubscriptionRepository
	txRepo  repository.TransactionRepository
}

func NewAdminDashboardService(
	db *gorm.DB,
	subRepo repository.SubscriptionRepository,
	txRepo repository.TransactionRepository,
) AdminDashboardService {
	return &adminDashboardService{db: db, subRepo: subRepo, txRepo: txRepo}
}

func (s *adminDashboardService) GetStats(ctx context.Context, year int) (*DashboardStatsResponse, error) {
	var totalUsers int64
	if err := s.db.WithContext(ctx).Model(&models.User{}).Count(&totalUsers).Error; err != nil {
		return nil, err
	}

	activeUsers, err := s.subRepo.CountUsersWithActiveSubscription(ctx, time.Now())
	if err != nil {
		return nil, err
	}

	purchasedCourses, err := s.subRepo.CountCreatedInYear(ctx, year)
	if err != nil {
		return nil, err
	}

	return &DashboardStatsResponse{
		Year:             year,
		TotalUsers:       totalUsers,
		ActiveUsers:      activeUsers,
		PurchasedCourses: purchasedCourses,
	}, nil
}

// GetMonthlySales returns 12 items (Persian month names) with courses count and sales sum from transactions.
func (s *adminDashboardService) GetMonthlySales(ctx context.Context, year int) ([]MonthlySaleItem, error) {
	agg, err := s.txRepo.GetMonthlyAggregatesByYear(ctx, year)
	if err != nil {
		return nil, err
	}
	out := make([]MonthlySaleItem, 12)
	for i := 0; i < 12; i++ {
		out[i] = MonthlySaleItem{
			Month:   persianMonthNames[i],
			Courses: agg[i].Count,
			Sales:   agg[i].Sum,
		}
	}
	return out, nil
}
