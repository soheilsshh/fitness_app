package service

import (
	"context"
	"log"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

type AchievementDTO struct {
	Code        string `json:"code"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	IconURL     string `json:"iconUrl,omitempty"`
	Points      int    `json:"points"`
	Context     string `json:"context,omitempty"`
	AwardedAt   string `json:"awardedAt"`
}

type AchievementSummaryDTO struct {
	TotalPoints int               `json:"totalPoints"`
	Awards      []AchievementDTO  `json:"awards"`
}

// AchievementService implements the event-driven gamification engine (roadmap
// BE-6.1/BE-6.2/BE-6.3): natural app events (food log created, new PR, workout
// session completed) are checked against seeded rules and, when satisfied,
// grant a UserAchievement.
type AchievementService interface {
	SeedDefaultRules(ctx context.Context)
	GetSummary(ctx context.Context, userID uint) (*AchievementSummaryDTO, error)
	HandleNewPR(ctx context.Context, userID uint, exerciseName string)
	HandleFoodLogCreated(ctx context.Context, userID uint)
	HandleWorkoutSessionCompleted(ctx context.Context, userID uint)
}

type achievementService struct {
	db   *gorm.DB
	repo repository.AchievementRepository
}

func NewAchievementService(db *gorm.DB, repo repository.AchievementRepository) AchievementService {
	return &achievementService{db: db, repo: repo}
}

// defaultAchievementRules is the initial rule set (roadmap BE-6.6).
func defaultAchievementRules() []models.AchievementRule {
	return []models.AchievementRule{
		{Code: models.AchievementCodeNewPR, Title: "رکورد جدید", Description: "هر بار که وزنه یا تکرار جدیدی نسبت به قبل رکورد بزنی.", Points: 10, Repeatable: true},
		{Code: models.AchievementCodeFoodStreak30, Title: "پیوستگی ۳۰ روزه ثبت غذا", Description: "۳۰ روز متوالی ثبت غذا.", Points: 100, Repeatable: false},
		{Code: models.AchievementCodeWorkoutStreak7, Title: "تداوم تمرین یک هفته‌ای", Description: "۷ روز متوالی تمرین ثبت‌شده.", Points: 50, Repeatable: false},
		{Code: models.AchievementCode5YearMember, Title: "مدال ۵ سال سابقه", Description: "۵ سال از عضویت تو در فیتینو گذشته.", Points: 500, Repeatable: false},
	}
}

func (s *achievementService) SeedDefaultRules(ctx context.Context) {
	for _, rule := range defaultAchievementRules() {
		r := rule
		if err := s.repo.EnsureRule(ctx, &r); err != nil {
			log.Printf("achievement: failed to seed rule %s: %v", rule.Code, err)
		}
	}
}

func (s *achievementService) award(ctx context.Context, userID uint, code, context_ string) {
	rule, err := s.repo.FindRuleByCode(ctx, code)
	if err != nil {
		return // rule not seeded yet — silently skip, never block the triggering action
	}
	if !rule.Repeatable {
		count, err := s.repo.CountAwardsForRule(ctx, userID, rule.ID)
		if err != nil || count > 0 {
			return
		}
	}
	entry := &models.UserAchievement{
		UserID:            userID,
		AchievementRuleID: rule.ID,
		Points:            rule.Points,
		Context:           context_,
	}
	if err := s.repo.CreateAward(ctx, entry); err != nil {
		log.Printf("achievement: failed to award %s to user=%d: %v", code, userID, err)
	}
}

func (s *achievementService) HandleNewPR(ctx context.Context, userID uint, exerciseName string) {
	s.award(ctx, userID, models.AchievementCodeNewPR, exerciseName)
}

// HandleFoodLogCreated checks for a 30-consecutive-day food-logging streak
// ending today. Best-effort — errors are logged, never propagated, since this
// runs as a side effect of the food-log create flow.
func (s *achievementService) HandleFoodLogCreated(ctx context.Context, userID uint) {
	if s.consecutiveDayStreak(ctx, userID, "daily_food_logs", "log_date", 30) {
		s.award(ctx, userID, models.AchievementCodeFoodStreak30, "")
	}
}

// HandleWorkoutSessionCompleted checks for a 7-consecutive-day workout streak.
func (s *achievementService) HandleWorkoutSessionCompleted(ctx context.Context, userID uint) {
	if s.consecutiveDayStreak(ctx, userID, "workout_sessions", "completed_at", 7) {
		s.award(ctx, userID, models.AchievementCodeWorkoutStreak7, "")
	}
}

// consecutiveDayStreak reports whether the user has at least one row in table
// on each of the last windowDays calendar days (including today).
func (s *achievementService) consecutiveDayStreak(ctx context.Context, userID uint, table, dateColumn string, windowDays int) bool {
	now := time.Now()
	windowStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).AddDate(0, 0, -(windowDays - 1))

	var distinctDays int64
	err := s.db.WithContext(ctx).
		Table(table).
		Where("user_id = ? AND "+dateColumn+" >= ?", userID, windowStart).
		Distinct("DATE(" + dateColumn + ")").
		Count(&distinctDays).Error
	if err != nil {
		log.Printf("achievement: streak query failed table=%s user=%d: %v", table, userID, err)
		return false
	}
	return int(distinctDays) >= windowDays
}

func (s *achievementService) checkMembershipMilestone(ctx context.Context, userID uint) {
	var user models.User
	if err := s.db.WithContext(ctx).Select("created_at").First(&user, userID).Error; err != nil {
		return
	}
	if time.Since(user.CreatedAt) >= 5*365*24*time.Hour {
		s.award(ctx, userID, models.AchievementCode5YearMember, "")
	}
}

func (s *achievementService) GetSummary(ctx context.Context, userID uint) (*AchievementSummaryDTO, error) {
	// Cheap opportunistic check — no scheduler needed for a milestone this rare.
	s.checkMembershipMilestone(ctx, userID)

	awards, err := s.repo.ListAwardsByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	rules, err := s.repo.ListRules(ctx)
	if err != nil {
		return nil, err
	}
	ruleByID := make(map[uint]models.AchievementRule, len(rules))
	for _, r := range rules {
		ruleByID[r.ID] = r
	}

	dtos := make([]AchievementDTO, 0, len(awards))
	total := 0
	for _, a := range awards {
		rule := ruleByID[a.AchievementRuleID]
		dtos = append(dtos, AchievementDTO{
			Code:        rule.Code,
			Title:       rule.Title,
			Description: rule.Description,
			IconURL:     rule.IconURL,
			Points:      a.Points,
			Context:     a.Context,
			AwardedAt:   a.CreatedAt.Format(time.RFC3339),
		})
		total += a.Points
	}

	return &AchievementSummaryDTO{TotalPoints: total, Awards: dtos}, nil
}
