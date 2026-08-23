package repository

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

// LeaderboardRow is one aggregated ranking result: total XP for a user within
// a given period, joined with the display fields the UI needs.
type LeaderboardRow struct {
	UserID    uint   `gorm:"column:user_id"`
	FullName  string `gorm:"column:name"`
	AvatarURL string `gorm:"column:avatar_url"`
	Points    int    `gorm:"column:points"`
}

type GamificationRepository interface {
	CreateXPEntry(ctx context.Context, entry *models.XPLedgerEntry) error
	// SumPointsSince returns the total XP already awarded to userID in
	// category since the given time (used for the daily anti-spam cap).
	SumPointsSince(ctx context.Context, userID uint, category string, since time.Time) (int, error)
	// SumPointsSinceAllCategories returns total XP across every category
	// since the given time (used for "XP this week").
	SumPointsSinceAllCategories(ctx context.Context, userID uint, since time.Time) (int, error)
	// CountMedals returns how many UserAchievement rows userID has been awarded.
	CountMedals(ctx context.Context, userID uint) (int, error)
	GetOrCreateStats(ctx context.Context, userID uint) (*models.UserGameStats, error)
	SaveStats(ctx context.Context, stats *models.UserGameStats) error
	// QueryLeaderboard aggregates XP per user since `since`, optionally
	// restricted to students assigned to coachID, ordered by points desc.
	QueryLeaderboard(ctx context.Context, since time.Time, coachID *uint, limit int) ([]LeaderboardRow, error)
}

type gamificationRepository struct {
	db *gorm.DB
}

func NewGamificationRepository(db *gorm.DB) GamificationRepository {
	return &gamificationRepository{db: db}
}

func (r *gamificationRepository) CreateXPEntry(ctx context.Context, entry *models.XPLedgerEntry) error {
	return r.db.WithContext(ctx).Create(entry).Error
}

func (r *gamificationRepository) SumPointsSince(ctx context.Context, userID uint, category string, since time.Time) (int, error) {
	var total int
	err := r.db.WithContext(ctx).
		Model(&models.XPLedgerEntry{}).
		Where("user_id = ? AND category = ? AND created_at >= ?", userID, category, since).
		Select("COALESCE(SUM(points), 0)").
		Scan(&total).Error
	return total, err
}

func (r *gamificationRepository) SumPointsSinceAllCategories(ctx context.Context, userID uint, since time.Time) (int, error) {
	var total int
	err := r.db.WithContext(ctx).
		Model(&models.XPLedgerEntry{}).
		Where("user_id = ? AND created_at >= ?", userID, since).
		Select("COALESCE(SUM(points), 0)").
		Scan(&total).Error
	return total, err
}

func (r *gamificationRepository) CountMedals(ctx context.Context, userID uint) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.UserAchievement{}).
		Where("user_id = ?", userID).
		Count(&count).Error
	return int(count), err
}

func (r *gamificationRepository) GetOrCreateStats(ctx context.Context, userID uint) (*models.UserGameStats, error) {
	var stats models.UserGameStats
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&stats).Error
	if err == nil {
		return &stats, nil
	}
	if err != gorm.ErrRecordNotFound {
		return nil, err
	}
	stats = models.UserGameStats{UserID: userID, Level: 1}
	if err := r.db.WithContext(ctx).Create(&stats).Error; err != nil {
		return nil, err
	}
	return &stats, nil
}

func (r *gamificationRepository) SaveStats(ctx context.Context, stats *models.UserGameStats) error {
	return r.db.WithContext(ctx).Save(stats).Error
}

func (r *gamificationRepository) QueryLeaderboard(ctx context.Context, since time.Time, coachID *uint, limit int) ([]LeaderboardRow, error) {
	q := r.db.WithContext(ctx).
		Table("xp_ledger_entries AS x").
		Select("x.user_id AS user_id, u.name AS name, u.avatar_url AS avatar_url, SUM(x.points) AS points").
		Joins("JOIN users AS u ON u.id = x.user_id").
		Where("x.created_at >= ?", since).
		Group("x.user_id, u.name, u.avatar_url").
		Order("points DESC").
		Limit(limit)

	if coachID != nil {
		q = q.Where("u.assigned_coach_id = ?", *coachID)
	}

	var rows []LeaderboardRow
	if err := q.Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}
