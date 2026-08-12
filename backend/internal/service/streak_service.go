package service

import (
	"context"
	"sort"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
)

// StreakMilestones are the day counts that trigger a celebratory popup on the
// frontend (roadmap: استریک و پاپ‌آپ تشویقی). Kept here (not just in the
// frontend) so the API can also report IsMilestone for any future channel
// (push notification, etc.) without duplicating the list.
var StreakMilestones = []int{3, 7, 14, 21, 30, 60, 100, 180, 365}

type StreakDTO struct {
	CurrentStreak int  `json:"currentStreak"`
	LongestStreak int  `json:"longestStreak"`
	ActiveToday   bool `json:"activeToday"`
	IsMilestone   bool `json:"isMilestone"`
}

// StreakService computes a user's "active day" streak: a day counts if the
// user logged at least one workout session or one food entry on it. This is
// intentionally inclusive (not workout-only) so nutrition-only users still
// build a streak.
type StreakService interface {
	GetStreak(ctx context.Context, userID uint) (*StreakDTO, error)
}

type streakService struct {
	db *gorm.DB
}

func NewStreakService(db *gorm.DB) StreakService {
	return &streakService{db: db}
}

func (s *streakService) GetStreak(ctx context.Context, userID uint) (*StreakDTO, error) {
	dateSet := make(map[string]bool)

	var workoutDates []string
	if err := s.db.WithContext(ctx).Model(&models.WorkoutSession{}).
		Where("user_id = ?", userID).
		Distinct("DATE(completed_at) as d").
		Pluck("d", &workoutDates).Error; err != nil {
		return nil, err
	}
	for _, d := range workoutDates {
		dateSet[normalizeStreakDate(d)] = true
	}

	var foodDates []string
	if err := s.db.WithContext(ctx).Model(&models.DailyFoodLog{}).
		Where("user_id = ?", userID).
		Distinct("DATE(log_date) as d").
		Pluck("d", &foodDates).Error; err != nil {
		return nil, err
	}
	for _, d := range foodDates {
		dateSet[normalizeStreakDate(d)] = true
	}

	current, longest, activeToday := computeStreak(dateSet)
	milestone := false
	for _, m := range StreakMilestones {
		if current == m {
			milestone = true
			break
		}
	}

	return &StreakDTO{
		CurrentStreak: current,
		LongestStreak: longest,
		ActiveToday:   activeToday,
		IsMilestone:   milestone,
	}, nil
}

// normalizeStreakDate trims a DATE()-formatted value (may come back with a
// time component depending on driver) down to "2006-01-02".
func normalizeStreakDate(raw string) string {
	if len(raw) >= 10 {
		return raw[:10]
	}
	return raw
}

// computeStreak walks backward from today counting consecutive active days.
// If today has no activity yet, the streak is still considered "alive" as
// long as yesterday was active (so logging once a day, any time, keeps it
// going) — it just won't include today until the user logs something.
func computeStreak(dateSet map[string]bool) (current int, longest int, activeToday bool) {
	today := time.Now().Truncate(24 * time.Hour)
	todayKey := today.Format("2006-01-02")
	activeToday = dateSet[todayKey]

	cursor := today
	if !activeToday {
		cursor = today.AddDate(0, 0, -1)
	}
	for dateSet[cursor.Format("2006-01-02")] {
		current++
		cursor = cursor.AddDate(0, 0, -1)
	}

	// Longest streak: sort all active dates and scan for the longest
	// consecutive run (independent of "today").
	dates := make([]string, 0, len(dateSet))
	for d := range dateSet {
		dates = append(dates, d)
	}
	sort.Strings(dates)

	run := 0
	var prev time.Time
	for i, d := range dates {
		t, err := time.Parse("2006-01-02", d)
		if err != nil {
			continue
		}
		if i > 0 && t.Sub(prev) == 24*time.Hour {
			run++
		} else {
			run = 1
		}
		if run > longest {
			longest = run
		}
		prev = t
	}
	if longest < current {
		longest = current
	}
	return current, longest, activeToday
}
