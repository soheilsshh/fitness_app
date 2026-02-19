package repository

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

// MonthlyAggregate holds count and sum for one month (1-12).
type MonthlyAggregate struct {
	Month int
	Count int64
	Sum   int64
}

type TransactionRepository interface {
	CountByUserID(ctx context.Context, userID uint) (int64, error)
	// CountInYear returns number of transactions in the given calendar year.
	CountInYear(ctx context.Context, year int) (int64, error)
	// SumAmountInYear returns total amount_cents in the given calendar year.
	SumAmountInYear(ctx context.Context, year int) (int64, error)
	// GetMonthlyAggregatesByYear returns 12 rows (month 1..12) with count and sum per month.
	GetMonthlyAggregatesByYear(ctx context.Context, year int) ([]MonthlyAggregate, error)
}

type transactionRepository struct {
	db *gorm.DB
}

func NewTransactionRepository(db *gorm.DB) TransactionRepository {
	return &transactionRepository{db: db}
}

func (r *transactionRepository) CountByUserID(ctx context.Context, userID uint) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.Transaction{}).
		Where("user_id = ?", userID).
		Count(&count).Error
	return count, err
}

func (r *transactionRepository) CountInYear(ctx context.Context, year int) (int64, error) {
	start := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(year+1, 1, 1, 0, 0, 0, 0, time.UTC)
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.Transaction{}).
		Where("date >= ? AND date < ?", start, end).
		Count(&count).Error
	return count, err
}

func (r *transactionRepository) SumAmountInYear(ctx context.Context, year int) (int64, error) {
	start := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(year+1, 1, 1, 0, 0, 0, 0, time.UTC)
	var sum int64
	err := r.db.WithContext(ctx).
		Model(&models.Transaction{}).
		Where("date >= ? AND date < ?", start, end).
		Select("COALESCE(SUM(amount_cents),0)").
		Scan(&sum).Error
	return sum, err
}

func (r *transactionRepository) GetMonthlyAggregatesByYear(ctx context.Context, year int) ([]MonthlyAggregate, error) {
	start := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(year+1, 1, 1, 0, 0, 0, 0, time.UTC)
	type row struct {
		Month int
		Count int64
		Sum   int64
	}
	var rows []row
	err := r.db.WithContext(ctx).
		Model(&models.Transaction{}).
		Select("MONTH(date) AS month, COUNT(*) AS count, COALESCE(SUM(amount_cents),0) AS sum").
		Where("date >= ? AND date < ?", start, end).
		Group("MONTH(date)").
		Find(&rows).Error
	if err != nil {
		return nil, err
	}
	byMonth := make(map[int]MonthlyAggregate)
	for _, r := range rows {
		byMonth[r.Month] = MonthlyAggregate{Month: r.Month, Count: r.Count, Sum: r.Sum}
	}
	out := make([]MonthlyAggregate, 12)
	for i := 1; i <= 12; i++ {
		if a, ok := byMonth[i]; ok {
			out[i-1] = a
		} else {
			out[i-1] = MonthlyAggregate{Month: i, Count: 0, Sum: 0}
		}
	}
	return out, nil
}

