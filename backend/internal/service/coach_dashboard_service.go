package service

import (
	"context"
	"math"
	"sort"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

type CoachDashboardStats struct {
	TotalStudents             int64 `json:"totalStudents"`
	ActiveSubscriptions       int64 `json:"activeSubscriptions"`
	MonthlySales              int64 `json:"monthlySales"`
	MonthlySalesDeltaPct      *int  `json:"monthlySalesDeltaPct,omitempty"`
	CompletedSessions         int64 `json:"completedSessions"`
	CompletedSessionsDeltaPct *int  `json:"completedSessionsDeltaPct,omitempty"`
	ProgramAdherence          int   `json:"programAdherence"`
}

type RecentStudent struct {
	StudentID uint   `json:"studentId"`
	FullName  string `json:"fullName"`
	JoinedAt  string `json:"joinedAt"`
}

type TopStudent struct {
	StudentID uint   `json:"studentId"`
	FullName  string `json:"fullName"`
	Adherence int    `json:"adherence"`
}

type ProgressPoint struct {
	Date  string `json:"date"`
	Value int    `json:"value"`
}

type CoachDashboardService interface {
	GetStats(ctx context.Context, coachID uint) (*CoachDashboardStats, error)
	RecentStudents(ctx context.Context, coachID uint, limit int) ([]RecentStudent, error)
	TopStudents(ctx context.Context, coachID uint, limit int) ([]TopStudent, error)
	ProgressSeries(ctx context.Context, coachID uint, days int) ([]ProgressPoint, error)
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

	year, month := now.Year(), int(now.Month())
	pYear, pMonth := prevMonth(year, month)

	sales, err := s.orderRepo.SumPaidAmountByCoachIDInMonth(ctx, coachID, year, month)
	if err != nil {
		return nil, err
	}
	salesPrev, err := s.orderRepo.SumPaidAmountByCoachIDInMonth(ctx, coachID, pYear, pMonth)
	if err != nil {
		return nil, err
	}

	sessions, err := s.countCompletedSessions(ctx, coachID, year, month)
	if err != nil {
		return nil, err
	}
	sessionsPrev, err := s.countCompletedSessions(ctx, coachID, pYear, pMonth)
	if err != nil {
		return nil, err
	}

	adherence, err := s.programAdherence(ctx, coachID, now)
	if err != nil {
		return nil, err
	}

	return &CoachDashboardStats{
		TotalStudents:             total,
		ActiveSubscriptions:       active,
		MonthlySales:              sales,
		MonthlySalesDeltaPct:      deltaPct(sales, salesPrev),
		CompletedSessions:         sessions,
		CompletedSessionsDeltaPct: deltaPct(sessions, sessionsPrev),
		ProgramAdherence:          adherence,
	}, nil
}

// countCompletedSessions counts workout sessions completed within a calendar
// month across all of the coach's subscriptions.
func (s *coachDashboardService) countCompletedSessions(ctx context.Context, coachID uint, year, month int) (int64, error) {
	start := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.Local)
	end := start.AddDate(0, 1, 0)
	var n int64
	err := s.db.WithContext(ctx).
		Model(&models.WorkoutSession{}).
		Joins("JOIN subscriptions ON subscriptions.id = workout_sessions.subscription_id AND subscriptions.deleted_at IS NULL").
		Where("subscriptions.coach_id = ? AND workout_sessions.completed_at >= ? AND workout_sessions.completed_at < ?", coachID, start, end).
		Count(&n).Error
	return n, err
}

// RecentStudents returns the most recently subscribed students for the coach,
// de-duplicated to one entry per student.
func (s *coachDashboardService) RecentStudents(ctx context.Context, coachID uint, limit int) ([]RecentStudent, error) {
	if limit <= 0 {
		limit = 5
	}
	type row struct {
		UserID    uint
		FullName  string
		CreatedAt time.Time
	}
	var rows []row
	if err := s.db.WithContext(ctx).
		Table("subscriptions s").
		Select("s.user_id AS user_id, u.name AS full_name, s.created_at AS created_at").
		Joins("JOIN users u ON u.id = s.user_id").
		Where("s.coach_id = ? AND s.deleted_at IS NULL", coachID).
		Order("s.created_at DESC").
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	out := make([]RecentStudent, 0, limit)
	seen := make(map[uint]bool)
	for _, r := range rows {
		if seen[r.UserID] {
			continue
		}
		seen[r.UserID] = true
		out = append(out, RecentStudent{
			StudentID: r.UserID,
			FullName:  r.FullName,
			JoinedAt:  r.CreatedAt.Format(time.RFC3339),
		})
		if len(out) >= limit {
			break
		}
	}
	return out, nil
}

// TopStudents ranks the coach's active students by program adherence (desc).
func (s *coachDashboardService) TopStudents(ctx context.Context, coachID uint, limit int) ([]TopStudent, error) {
	if limit <= 0 {
		limit = 3
	}
	now := time.Now()
	adherence, err := s.adherenceBySub(ctx, coachID, now)
	if err != nil {
		return nil, err
	}
	out := make([]TopStudent, 0, len(adherence))
	if len(adherence) == 0 {
		return out, nil
	}

	subIDs := make([]uint, 0, len(adherence))
	for id := range adherence {
		subIDs = append(subIDs, id)
	}

	type row struct {
		SubscriptionID uint
		UserID         uint
		FullName       string
	}
	var rows []row
	if err := s.db.WithContext(ctx).
		Table("subscriptions s").
		Select("s.id AS subscription_id, s.user_id AS user_id, u.name AS full_name").
		Joins("JOIN users u ON u.id = s.user_id").
		Where("s.id IN ?", subIDs).
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	seen := make(map[uint]bool)
	for _, r := range rows {
		if seen[r.UserID] {
			continue
		}
		seen[r.UserID] = true
		out = append(out, TopStudent{
			StudentID: r.UserID,
			FullName:  r.FullName,
			Adherence: adherence[r.SubscriptionID],
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Adherence > out[j].Adherence })
	if len(out) > limit {
		out = out[:limit]
	}
	return out, nil
}

// ProgressSeries returns the count of completed workout sessions per day across
// the coach's subscriptions for the trailing `days` window, zero-filled.
func (s *coachDashboardService) ProgressSeries(ctx context.Context, coachID uint, days int) ([]ProgressPoint, error) {
	if days <= 0 {
		days = 30
	}
	if days > 90 {
		days = 90
	}
	now := time.Now()
	startDay := now.AddDate(0, 0, -(days - 1))
	start := time.Date(startDay.Year(), startDay.Month(), startDay.Day(), 0, 0, 0, 0, time.Local)

	type row struct {
		Day string
		Cnt int
	}
	var rows []row
	if err := s.db.WithContext(ctx).
		Model(&models.WorkoutSession{}).
		Select("DATE(workout_sessions.completed_at) AS day, COUNT(*) AS cnt").
		Joins("JOIN subscriptions ON subscriptions.id = workout_sessions.subscription_id AND subscriptions.deleted_at IS NULL").
		Where("subscriptions.coach_id = ? AND workout_sessions.completed_at >= ?", coachID, start).
		Group("DATE(workout_sessions.completed_at)").
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

	out := make([]ProgressPoint, 0, days)
	for i := 0; i < days; i++ {
		key := start.AddDate(0, 0, i).Format("2006-01-02")
		out = append(out, ProgressPoint{Date: key, Value: counts[key]})
	}
	return out, nil
}

// programAdherence returns the average percentage of scheduled workout days that
// active students actually completed in the last 7 days. Per active subscription
// with a workout program, expected = distinct training days per week in the
// program, completed = distinct days logged this week; the per-student ratio is
// capped at 100% and averaged across students.
func (s *coachDashboardService) programAdherence(ctx context.Context, coachID uint, now time.Time) (int, error) {
	m, err := s.adherenceBySub(ctx, coachID, now)
	if err != nil {
		return 0, err
	}
	if len(m) == 0 {
		return 0, nil
	}
	sum := 0
	for _, v := range m {
		sum += v
	}
	return int(math.Round(float64(sum) / float64(len(m)))), nil
}

// adherenceBySub returns per-subscription adherence percentage (0-100) for every
// active subscription of the coach that has an active workout program.
func (s *coachDashboardService) adherenceBySub(ctx context.Context, coachID uint, now time.Time) (map[uint]int, error) {
	result := make(map[uint]int)

	var subIDs []uint
	if err := s.db.WithContext(ctx).
		Model(&models.Subscription{}).
		Where("coach_id = ? AND (ends_at IS NULL OR ends_at > ?)", coachID, now).
		Pluck("id", &subIDs).Error; err != nil {
		return nil, err
	}
	if len(subIDs) == 0 {
		return result, nil
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
		return nil, err
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
		return result, nil
	}

	since := now.AddDate(0, 0, -7)
	var completedRows []aggRow
	if err := s.db.WithContext(ctx).
		Model(&models.WorkoutSession{}).
		Select("subscription_id, COUNT(DISTINCT day_key) AS days").
		Where("subscription_id IN ? AND completed_at > ?", withProgram, since).
		Group("subscription_id").
		Scan(&completedRows).Error; err != nil {
		return nil, err
	}
	completed := make(map[uint]int, len(completedRows))
	for _, r := range completedRows {
		completed[r.SubscriptionID] = r.Days
	}

	for subID, expDays := range expected {
		ratio := float64(completed[subID]) / float64(expDays)
		if ratio > 1 {
			ratio = 1
		}
		result[subID] = int(math.Round(ratio * 100))
	}
	return result, nil
}

func prevMonth(year, month int) (int, int) {
	if month == 1 {
		return year - 1, 12
	}
	return year, month - 1
}

func deltaPct(cur, prev int64) *int {
	if prev == 0 {
		return nil
	}
	d := int(math.Round(float64(cur-prev) / float64(prev) * 100))
	return &d
}
