package service

import (
	"context"
	"errors"
	"fmt"
	"math"
	"sort"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

// MeDashboardSummary aggregates a student's own training performance for the
// student dashboard. All figures are scoped to the authenticated user.
type MeDashboardSummary struct {
	TotalSessions     int64           `json:"totalSessions"`
	SessionsThisWeek  int64           `json:"sessionsThisWeek"`
	SessionsThisMonth int64           `json:"sessionsThisMonth"`
	AvgDurationMin    int             `json:"avgDurationMin"`
	StreakWeeks       int             `json:"streakWeeks"`
	Adherence         int             `json:"adherence"`
	WeeklyGoalDays    int             `json:"weeklyGoalDays"`
	CompletedThisWeek int             `json:"completedThisWeek"`
	ProgressSeries    []ProgressPoint `json:"progressSeries"`
}

// PersonalRecord is the student's best logged set for an exercise.
type PersonalRecord struct {
	ExerciseName string  `json:"exerciseName"`
	BestWeightKg float64 `json:"bestWeightKg"`
	BestReps     int     `json:"bestReps"`
	Est1RM       int     `json:"est1rm"`
	AchievedAt   string  `json:"achievedAt"`
}

type MeDashboardService interface {
	Summary(ctx context.Context, userID uint, days int) (*MeDashboardSummary, error)
	PersonalRecords(ctx context.Context, userID uint, limit int) ([]PersonalRecord, error)
}

type meDashboardService struct {
	db      *gorm.DB
	subRepo repository.SubscriptionRepository
}

func NewMeDashboardService(db *gorm.DB, subRepo repository.SubscriptionRepository) MeDashboardService {
	return &meDashboardService{db: db, subRepo: subRepo}
}

func (s *meDashboardService) Summary(ctx context.Context, userID uint, days int) (*MeDashboardSummary, error) {
	if days <= 0 {
		days = 30
	}
	if days > 90 {
		days = 90
	}
	uid := userID
	now := time.Now()

	out := &MeDashboardSummary{ProgressSeries: []ProgressPoint{}}

	base := s.db.WithContext(ctx).Model(&models.WorkoutSession{}).Where("user_id = ?", uid)

	if err := base.Session(&gorm.Session{}).Count(&out.TotalSessions).Error; err != nil {
		return nil, err
	}

	weekStart := startOfISOWeek(now)
	if err := s.db.WithContext(ctx).Model(&models.WorkoutSession{}).
		Where("user_id = ? AND completed_at >= ?", uid, weekStart).
		Count(&out.SessionsThisWeek).Error; err != nil {
		return nil, err
	}

	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.Local)
	if err := s.db.WithContext(ctx).Model(&models.WorkoutSession{}).
		Where("user_id = ? AND completed_at >= ?", uid, monthStart).
		Count(&out.SessionsThisMonth).Error; err != nil {
		return nil, err
	}

	var avg *float64
	if err := s.db.WithContext(ctx).Model(&models.WorkoutSession{}).
		Where("user_id = ?", uid).
		Select("AVG(duration_min)").Scan(&avg).Error; err != nil {
		return nil, err
	}
	if avg != nil {
		out.AvgDurationMin = int(math.Round(*avg))
	}

	// Progress series: completed sessions per day, zero-filled.
	startDay := now.AddDate(0, 0, -(days - 1))
	start := time.Date(startDay.Year(), startDay.Month(), startDay.Day(), 0, 0, 0, 0, time.Local)
	type dayRow struct {
		Day string
		Cnt int
	}
	var rows []dayRow
	if err := s.db.WithContext(ctx).Model(&models.WorkoutSession{}).
		Select("DATE(completed_at) AS day, COUNT(*) AS cnt").
		Where("user_id = ? AND completed_at >= ?", uid, start).
		Group("DATE(completed_at)").
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	counts := make(map[string]int, len(rows))
	for _, r := range rows {
		key := r.Day
		if len(key) > 10 {
			key = key[:10]
		}
		counts[key] = r.Cnt
	}
	series := make([]ProgressPoint, 0, days)
	for i := 0; i < days; i++ {
		key := start.AddDate(0, 0, i).Format("2006-01-02")
		series = append(series, ProgressPoint{Date: key, Value: counts[key]})
	}
	out.ProgressSeries = series

	// Streak: consecutive ISO weeks (ending this week) with >=1 session.
	out.StreakWeeks = s.streakWeeks(ctx, uid, now)

	// Adherence + weekly goal: based on the active subscription's program.
	if err := s.fillAdherence(ctx, uid, now, out); err != nil {
		return nil, err
	}

	return out, nil
}

// streakWeeks counts consecutive ISO weeks (including the current week) that have
// at least one completed session, walking backwards from now.
func (s *meDashboardService) streakWeeks(ctx context.Context, uid uint, now time.Time) int {
	since := now.AddDate(0, 0, -7*30) // look back up to ~30 weeks
	var times []time.Time
	if err := s.db.WithContext(ctx).Model(&models.WorkoutSession{}).
		Where("user_id = ? AND completed_at >= ?", uid, since).
		Order("completed_at DESC").
		Pluck("completed_at", &times).Error; err != nil {
		return 0
	}
	if len(times) == 0 {
		return 0
	}
	active := make(map[string]bool, len(times))
	for _, t := range times {
		y, w := t.ISOWeek()
		active[isoKey(y, w)] = true
	}
	streak := 0
	cur := now
	for {
		y, w := cur.ISOWeek()
		if !active[isoKey(y, w)] {
			break
		}
		streak++
		cur = cur.AddDate(0, 0, -7)
	}
	return streak
}

// fillAdherence sets WeeklyGoalDays (distinct training days in the active
// program) and Adherence (distinct days completed this week / goal, capped).
func (s *meDashboardService) fillAdherence(ctx context.Context, uid uint, now time.Time, out *MeDashboardSummary) error {
	sub, err := s.subRepo.FindCurrentByUserID(ctx, uid, now)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return err
	}

	var goalDays int
	if err := s.db.WithContext(ctx).
		Table("workout_programs wp").
		Select("COUNT(DISTINCT pi.day_number)").
		Joins("JOIN program_items pi ON pi.workout_program_id = wp.id AND pi.deleted_at IS NULL").
		Where("wp.subscription_id = ? AND wp.is_active = ? AND wp.deleted_at IS NULL", sub.ID, true).
		Scan(&goalDays).Error; err != nil {
		return err
	}
	out.WeeklyGoalDays = goalDays
	if goalDays == 0 {
		return nil
	}

	since := now.AddDate(0, 0, -7)
	var completed int
	if err := s.db.WithContext(ctx).Model(&models.WorkoutSession{}).
		Where("subscription_id = ? AND completed_at > ?", sub.ID, since).
		Select("COUNT(DISTINCT day_key)").Scan(&completed).Error; err != nil {
		return err
	}
	out.CompletedThisWeek = completed

	ratio := float64(completed) / float64(goalDays)
	if ratio > 1 {
		ratio = 1
	}
	out.Adherence = int(math.Round(ratio * 100))
	return nil
}

// PersonalRecords returns the heaviest logged set per exercise (Epley 1RM
// estimate), ordered by estimated 1RM descending.
func (s *meDashboardService) PersonalRecords(ctx context.Context, userID uint, limit int) ([]PersonalRecord, error) {
	if limit <= 0 {
		limit = 5
	}
	var logs []models.WorkoutSetLog
	if err := s.db.WithContext(ctx).
		Where("user_id = ? AND weight_kg > 0", userID).
		Order("weight_kg DESC").
		Find(&logs).Error; err != nil {
		return nil, err
	}

	best := make(map[string]models.WorkoutSetLog)
	for _, l := range logs {
		cur, ok := best[l.ExerciseName]
		if !ok || epley(l.WeightKg, l.Reps) > epley(cur.WeightKg, cur.Reps) {
			best[l.ExerciseName] = l
		}
	}

	out := make([]PersonalRecord, 0, len(best))
	for _, l := range best {
		out = append(out, PersonalRecord{
			ExerciseName: l.ExerciseName,
			BestWeightKg: l.WeightKg,
			BestReps:     l.Reps,
			Est1RM:       int(math.Round(epley(l.WeightKg, l.Reps))),
			AchievedAt:   l.PerformedAt.Format(time.RFC3339),
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Est1RM > out[j].Est1RM })
	if len(out) > limit {
		out = out[:limit]
	}
	return out, nil
}

// epley estimates a one-rep max from a weight x reps set (Epley formula).
func epley(weight float64, reps int) float64 {
	if reps <= 1 {
		return weight
	}
	return weight * (1 + float64(reps)/30.0)
}

func startOfISOWeek(t time.Time) time.Time {
	// ISO week starts Monday.
	wd := int(t.Weekday())
	if wd == 0 {
		wd = 7 // Sunday -> 7
	}
	d := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.Local)
	return d.AddDate(0, 0, -(wd - 1))
}

func isoKey(year, week int) string {
	return fmt.Sprintf("%d-%02d", year, week)
}
