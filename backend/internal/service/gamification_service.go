package service

import (
	"context"
	"log"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

// dailyXPCap enforces the anti-spam design (points-economy roadmap §سقف‌های
// ضداسپم): each category's ledger sum for "today" is capped independently.
// A very large cap effectively means "no cap yet" for low-frequency,
// high-value categories the user's table didn't set an explicit ceiling for.
var dailyXPCap = map[string]int{
	models.XPCategoryWorkout:             60,
	models.XPCategoryNutrition:           20,
	models.XPCategoryTracking:            1 << 30,
	models.XPCategoryAI:                  1 << 30,
	models.XPCategoryAIChat:              10,
	models.XPCategoryCommunityEngagement: 10,
	models.XPCategoryContentView:         10,
}

type GameSummaryDTO struct {
	Level            int    `json:"level"`
	LevelTitle       string `json:"levelTitle"`
	TotalXP          int    `json:"totalXP"`
	XPThisWeek       int    `json:"xpThisWeek"`
	XPIntoLevel      int    `json:"xpIntoLevel"`
	XPNeededForLevel int    `json:"xpNeededForLevel"`
	TotalMedalPoints int    `json:"totalMedalPoints"`
	MedalCount       int    `json:"medalCount"`
	Reputation       int    `json:"reputation"`
}

type LeaderboardEntryDTO struct {
	Rank          int    `json:"rank"`
	UserID        uint   `json:"userId"`
	FullName      string `json:"fullName"`
	AvatarURL     string `json:"avatarUrl,omitempty"`
	Points        int    `json:"points"`
	IsCurrentUser bool   `json:"isCurrentUser"`
}

type LeaderboardPeriod string

const (
	LeaderboardDaily     LeaderboardPeriod = "daily"
	LeaderboardWeekly    LeaderboardPeriod = "weekly"
	LeaderboardMonthly   LeaderboardPeriod = "monthly"
	LeaderboardQuarterly LeaderboardPeriod = "quarterly"
	LeaderboardYearly    LeaderboardPeriod = "yearly"
)

func periodStart(period LeaderboardPeriod, now time.Time) time.Time {
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	switch period {
	case LeaderboardDaily:
		return today
	case LeaderboardMonthly:
		return today.AddDate(0, 0, -29)
	case LeaderboardQuarterly:
		return today.AddDate(0, 0, -89)
	case LeaderboardYearly:
		return today.AddDate(0, 0, -364)
	case LeaderboardWeekly:
		fallthrough
	default:
		return today.AddDate(0, 0, -6)
	}
}

// GamificationService is the XP ledger + level + leaderboard engine (points-
// economy roadmap). Medal grants stay in AchievementService — this service
// only owns the XP layer and the denormalized stats rollup, and exposes
// AddMedalPoints so AchievementService can keep UserGameStats.TotalMedalPoints
// in sync without this package importing that one (avoids an import cycle).
type GamificationService interface {
	// AwardXP grants up to `points` XP, clamped by the category's remaining
	// daily budget. Returns the amount actually awarded (may be 0). Never
	// returns an error to callers that treat gamification as best-effort —
	// errors are logged and swallowed, matching AchievementService's style.
	AwardXP(ctx context.Context, userID uint, category, activityCode string, points int, refType string, refID uint) int
	AddMedalPoints(ctx context.Context, userID uint, delta int)
	GetMySummary(ctx context.Context, userID uint) (*GameSummaryDTO, error)
	GetLeaderboard(ctx context.Context, period LeaderboardPeriod, coachID *uint, limit int, requestingUserID uint) ([]LeaderboardEntryDTO, error)
}

type gamificationService struct {
	repo repository.GamificationRepository
}

func NewGamificationService(repo repository.GamificationRepository) GamificationService {
	return &gamificationService{repo: repo}
}

func (s *gamificationService) AwardXP(ctx context.Context, userID uint, category, activityCode string, points int, refType string, refID uint) int {
	if points <= 0 {
		return 0
	}
	cap_, ok := dailyXPCap[category]
	if !ok {
		cap_ = points // unknown category: no accumulation cap beyond the single grant
	}

	todayStart := time.Now().Truncate(24 * time.Hour)
	alreadyToday, err := s.repo.SumPointsSince(ctx, userID, category, todayStart)
	if err != nil {
		log.Printf("gamification: daily-cap lookup failed user=%d category=%s: %v", userID, category, err)
		return 0
	}

	remaining := cap_ - alreadyToday
	if remaining <= 0 {
		return 0
	}
	awarded := points
	if awarded > remaining {
		awarded = remaining
	}

	entry := &models.XPLedgerEntry{
		UserID:       userID,
		Category:     category,
		ActivityCode: activityCode,
		Points:       awarded,
		RefType:      refType,
		RefID:        refID,
	}
	if err := s.repo.CreateXPEntry(ctx, entry); err != nil {
		log.Printf("gamification: failed to record XP user=%d activity=%s: %v", userID, activityCode, err)
		return 0
	}

	s.applyStatsDelta(ctx, userID, awarded, 0)
	return awarded
}

func (s *gamificationService) AddMedalPoints(ctx context.Context, userID uint, delta int) {
	if delta == 0 {
		return
	}
	s.applyStatsDelta(ctx, userID, 0, delta)
}

func (s *gamificationService) applyStatsDelta(ctx context.Context, userID uint, xpDelta, medalDelta int) {
	stats, err := s.repo.GetOrCreateStats(ctx, userID)
	if err != nil {
		log.Printf("gamification: failed to load stats user=%d: %v", userID, err)
		return
	}
	stats.TotalXP += xpDelta
	stats.TotalMedalPoints += medalDelta
	stats.Level = LevelForXP(stats.TotalXP)
	if err := s.repo.SaveStats(ctx, stats); err != nil {
		log.Printf("gamification: failed to save stats user=%d: %v", userID, err)
	}
}

func (s *gamificationService) GetMySummary(ctx context.Context, userID uint) (*GameSummaryDTO, error) {
	stats, err := s.repo.GetOrCreateStats(ctx, userID)
	if err != nil {
		return nil, err
	}
	weekStart := periodStart(LeaderboardWeekly, time.Now())
	xpThisWeek, err := s.repo.SumPointsSinceAllCategories(ctx, userID, weekStart)
	if err != nil {
		log.Printf("gamification: xpThisWeek lookup failed user=%d: %v", userID, err)
		xpThisWeek = 0
	}

	level, xpIntoLevel, xpNeeded := XPForNextLevel(stats.TotalXP)
	medalCount, err := s.repo.CountMedals(ctx, userID)
	if err != nil {
		log.Printf("gamification: medal count lookup failed user=%d: %v", userID, err)
		medalCount = 0
	}

	return &GameSummaryDTO{
		Level:            level,
		LevelTitle:       LevelTitle(level),
		TotalXP:          stats.TotalXP,
		XPThisWeek:       xpThisWeek,
		XPIntoLevel:      xpIntoLevel,
		XPNeededForLevel: xpNeeded,
		TotalMedalPoints: stats.TotalMedalPoints,
		MedalCount:       medalCount,
		Reputation:       stats.TotalXP + stats.TotalMedalPoints*3,
	}, nil
}

func (s *gamificationService) GetLeaderboard(ctx context.Context, period LeaderboardPeriod, coachID *uint, limit int, requestingUserID uint) ([]LeaderboardEntryDTO, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	since := periodStart(period, time.Now())
	rows, err := s.repo.QueryLeaderboard(ctx, since, coachID, limit)
	if err != nil {
		return nil, err
	}

	entries := make([]LeaderboardEntryDTO, 0, len(rows))
	for i, row := range rows {
		entries = append(entries, LeaderboardEntryDTO{
			Rank:          i + 1,
			UserID:        row.UserID,
			FullName:      row.FullName,
			AvatarURL:     row.AvatarURL,
			Points:        row.Points,
			IsCurrentUser: row.UserID == requestingUserID,
		})
	}
	return entries, nil
}
