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
	TotalPoints int              `json:"totalPoints"`
	Awards      []AchievementDTO `json:"awards"`
}

// AchievementService implements the event-driven gamification engine (roadmap
// BE-6.1/BE-6.2/BE-6.3): natural app events (food log created, new PR, workout
// session completed) are checked against seeded rules and, when satisfied,
// grant a UserAchievement.
type AchievementService interface {
	SeedDefaultRules(ctx context.Context)
	GetSummary(ctx context.Context, userID uint) (*AchievementSummaryDTO, error)
	HandleNewPR(ctx context.Context, userID uint, exerciseName string)
	HandleFoodLogCreated(ctx context.Context, userID uint, logID uint)
	HandleWorkoutSessionCompleted(ctx context.Context, userID uint, sessionID uint)
	// HandleProfileUpdated re-checks profile completion after every profile
	// write and grants AchievementCodeProfileComplete once 100% is reached.
	HandleProfileUpdated(ctx context.Context, userID uint)
	// HandlePhotoUploaded re-checks the initial 4-angle body-photo album after
	// every upload and grants AchievementCodeInitialPhotoAlbum once complete.
	HandlePhotoUploaded(ctx context.Context, userID uint)

	// Phase 2 (v2)
	// HandleAIProgramSaved awards AI-architect XP/medal. kind is "workout" or "nutrition".
	HandleAIProgramSaved(ctx context.Context, userID uint, kind string)
	// HandleTrackingUpdated re-checks the golden check-in (weight + measurements
	// + 3 photos same day) and the longer-window tracking-consistency medals.
	// Call after any check-in write (daily weight, weekly measurements, photo upload).
	HandleTrackingUpdated(ctx context.Context, userID uint)
	// HandleWeeklyProgramChecked re-checks whether this week's planned training
	// days are all logged. Call after a workout session is completed.
	HandleWeeklyProgramChecked(ctx context.Context, userID uint)

	// Phase 3 (v3)
	// HandleAIProgramApproved grants the repeatable ai_human_collab medal when
	// a coach approves a student's AI-generated program.
	HandleAIProgramApproved(ctx context.Context, userID uint)
	// HandleCommunityEvent awards community XP (capped) and re-checks the
	// active-community-member medal. kind is "post", "like", or "comment".
	HandleCommunityEvent(ctx context.Context, userID uint, kind string)

	// Phase 4
	// HandleCoachSessionCompleted grants the repeatable coach_session medal.
	HandleCoachSessionCompleted(ctx context.Context, userID uint)
	// HandleSubscriptionCreated grants the repeatable subscription_renewal
	// medal when isRenewal is true (a returning student, not a first purchase).
	HandleSubscriptionCreated(ctx context.Context, userID uint, isRenewal bool)
}

type achievementService struct {
	db             *gorm.DB
	repo           repository.AchievementRepository
	gamificationSvc GamificationService
}

func NewAchievementService(db *gorm.DB, repo repository.AchievementRepository, gamificationSvc GamificationService) AchievementService {
	return &achievementService{db: db, repo: repo, gamificationSvc: gamificationSvc}
}

// defaultAchievementRules is the initial rule set (roadmap BE-6.6).
func defaultAchievementRules() []models.AchievementRule {
	return []models.AchievementRule{
		{Code: models.AchievementCodeNewPR, Title: "رکورد جدید", Description: "هر بار که وزنه یا تکرار جدیدی نسبت به قبل رکورد بزنی.", Points: 10, Repeatable: true},
		{Code: models.AchievementCodeFoodStreak30, Title: "پیوستگی ۳۰ روزه ثبت غذا", Description: "۳۰ روز متوالی ثبت غذا.", Points: 100, Repeatable: false},
		{Code: models.AchievementCodeWorkoutStreak7, Title: "تداوم تمرین یک هفته‌ای", Description: "۷ روز متوالی تمرین ثبت‌شده.", Points: 50, Repeatable: false},
		{Code: models.AchievementCode5YearMember, Title: "مدال ۵ سال سابقه", Description: "۵ سال از عضویت تو در فیتینو گذشته.", Points: 500, Repeatable: false},
		{Code: models.AchievementCodeProfileComplete, Title: "پروفایل ۱۰۰٪", Description: "تمام بخش‌های پروفایل تکمیل شد.", Points: 75, Repeatable: false},
		{Code: models.AchievementCodeInitialPhotoAlbum, Title: "آلبوم اولیه کامل", Description: "۴ زاویه عکس اولیه ثبت شد.", Points: 40, Repeatable: false},

		// Phase 2 (v2)
		{Code: models.AchievementCodeRegularWeek, Title: "هفته منظم", Description: "تمام جلسات تمرینی برنامه‌ریزی‌شده‌ی این هفته را ثبت کردی.", Points: 25, Repeatable: true},
		{Code: models.AchievementCodeNutritionDayDone, Title: "روز تغذیه‌ای کامل", Description: "هدف کالری/ماکروی امروز محقق شد.", Points: 15, Repeatable: true},
		{Code: models.AchievementCodeGoldenCheckIn, Title: "چک‌این طلایی", Description: "وزن، اندازه‌ها و ۳ عکس پایش در یک روز ثبت شد.", Points: 60, Repeatable: true},
		{Code: models.AchievementCodeAIWorkoutArchitect, Title: "معمار تمرین AI", Description: "اولین برنامه‌ی تمرینی با هوش مصنوعی ساخته شد.", Points: 20, Repeatable: false},
		{Code: models.AchievementCodeAINutritionArchitect, Title: "معمار تغذیه AI", Description: "اولین برنامه‌ی غذایی با هوش مصنوعی ساخته شد.", Points: 20, Repeatable: false},

		// Phase 3 (v3)
		{Code: models.AchievementCodeWorkoutStreak30, Title: "تداوم تمرین ۳۰ روزه", Description: "۳۰ روز متوالی تمرین ثبت‌شده.", Points: 150, Repeatable: false},
		{Code: models.AchievementCodeWorkoutStreak90, Title: "تداوم تمرین ۹۰ روزه", Description: "۹۰ روز متوالی تمرین ثبت‌شده.", Points: 400, Repeatable: false},
		{Code: models.AchievementCodeFoodStreak90, Title: "پیوستگی ۹۰ روزه ثبت غذا", Description: "۹۰ روز متوالی ثبت غذا.", Points: 250, Repeatable: false},
		{Code: models.AchievementCodeTrackingVisual2M, Title: "پایداری بصری ۲ ماهه", Description: "عکس‌های پایش را به‌طور منظم طی ۲ ماه ثبت کردی.", Points: 120, Repeatable: false},
		{Code: models.AchievementCodeTrackingSteady, Title: "پایداری پایش", Description: "پایش وزن و اندازه‌ها را به‌طور منظم و بلندمدت ادامه دادی.", Points: 150, Repeatable: false},
		{Code: models.AchievementCodeCommunityActive, Title: "عضو فعال جامعه", Description: "۲۰ پست یا ۱۰۰ تعامل مفید در اجتماع فیتینو.", Points: 50, Repeatable: false},
		{Code: models.AchievementCodeAIHumanCollab, Title: "همکاری انسان و AI", Description: "برنامه‌ی ساخته‌شده با AI را مربی تأیید کرد.", Points: 50, Repeatable: true},

		// Phase 4
		{Code: models.AchievementCodeCoachSession, Title: "جلسه با مربی", Description: "یک جلسه‌ی یک‌به‌یک با مربی برگزار شد.", Points: 25, Repeatable: true},
		{Code: models.AchievementCodeSubRenewal, Title: "ادامه مسیر", Description: "اشتراک خود را تمدید کردی.", Points: 20, Repeatable: true},
		{Code: models.AchievementCode1YearMember, Title: "یک سال همراه فیتینو", Description: "۱ سال از عضویت تو در فیتینو گذشته.", Points: 200, Repeatable: false},
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
		return
	}
	if s.gamificationSvc != nil {
		s.gamificationSvc.AddMedalPoints(ctx, userID, rule.Points)
	}
}

func (s *achievementService) HandleNewPR(ctx context.Context, userID uint, exerciseName string) {
	if s.gamificationSvc != nil {
		s.gamificationSvc.AwardXP(ctx, userID, models.XPCategoryWorkout, "personal_record", 10, "personal_record", 0)
	}
	s.award(ctx, userID, models.AchievementCodeNewPR, exerciseName)
}

// HandleFoodLogCreated awards XP for the logged meal and checks for a
// 30-consecutive-day food-logging streak ending today. Best-effort — errors
// are logged, never propagated, since this runs as a side effect of the
// food-log create flow.
func (s *achievementService) HandleFoodLogCreated(ctx context.Context, userID uint, logID uint) {
	if s.gamificationSvc != nil {
		s.gamificationSvc.AwardXP(ctx, userID, models.XPCategoryNutrition, "meal_logged", 3, "daily_food_log", logID)
	}
	if s.consecutiveDayStreak(ctx, userID, "daily_food_logs", "log_date", 30) {
		s.award(ctx, userID, models.AchievementCodeFoodStreak30, "")
	}
	if s.consecutiveDayStreak(ctx, userID, "daily_food_logs", "log_date", 90) {
		s.award(ctx, userID, models.AchievementCodeFoodStreak90, "")
	}
	s.checkNutritionDayGoal(ctx, userID)
}

// HandleWorkoutSessionCompleted awards XP for the logged session and checks
// for a 7-consecutive-day workout streak.
func (s *achievementService) HandleWorkoutSessionCompleted(ctx context.Context, userID uint, sessionID uint) {
	if s.gamificationSvc != nil {
		s.gamificationSvc.AwardXP(ctx, userID, models.XPCategoryWorkout, "workout_session_logged", 15, "workout_session", sessionID)
	}
	if s.consecutiveDayStreak(ctx, userID, "workout_sessions", "completed_at", 7) {
		s.award(ctx, userID, models.AchievementCodeWorkoutStreak7, "")
	}
	if s.consecutiveDayStreak(ctx, userID, "workout_sessions", "completed_at", 30) {
		s.award(ctx, userID, models.AchievementCodeWorkoutStreak30, "")
	}
	if s.consecutiveDayStreak(ctx, userID, "workout_sessions", "completed_at", 90) {
		s.award(ctx, userID, models.AchievementCodeWorkoutStreak90, "")
	}
}

// HandleProfileUpdated re-checks profile completion (reusing the same
// models.StudentProfileProgress used by the profile-progress UI) and grants
// the one-time profile_complete medal once every section is done.
func (s *achievementService) HandleProfileUpdated(ctx context.Context, userID uint) {
	var user models.User
	if err := s.db.WithContext(ctx).First(&user, userID).Error; err != nil {
		return
	}
	if user.Role != models.RoleStudent {
		return
	}
	initialPhotos := s.loadInitialPhotos(ctx, userID)
	_, _, _, _, percent := models.StudentProfileProgress(&user, initialPhotos)
	if percent >= 100 {
		s.award(ctx, userID, models.AchievementCodeProfileComplete, "")
	}
}

// HandlePhotoUploaded re-checks the initial 4-angle body-photo album after
// every upload and grants the one-time initial_photo_album medal once complete.
func (s *achievementService) HandlePhotoUploaded(ctx context.Context, userID uint) {
	var user models.User
	if err := s.db.WithContext(ctx).First(&user, userID).Error; err != nil {
		return
	}
	initialPhotos := s.loadInitialPhotos(ctx, userID)
	_, _, _, photosDone, _ := models.StudentProfileProgress(&user, initialPhotos)
	if photosDone {
		s.award(ctx, userID, models.AchievementCodeInitialPhotoAlbum, "")
	}
}

func (s *achievementService) loadInitialPhotos(ctx context.Context, userID uint) []models.UserPhoto {
	var photos []models.UserPhoto
	if err := s.db.WithContext(ctx).
		Where("user_id = ? AND check_in_date IS NULL", userID).
		Find(&photos).Error; err != nil {
		log.Printf("achievement: failed to load initial photos user=%d: %v", userID, err)
		return nil
	}
	return photos
}

// currentSubscription returns the student's active subscription (StartsAt <=
// now <= EndsAt, or EndsAt unset), mirroring subscriptionRepo.FindCurrentByUserID
// without adding a repository dependency to this service.
func (s *achievementService) currentSubscription(ctx context.Context, userID uint) (*models.Subscription, bool) {
	now := time.Now()
	var sub models.Subscription
	err := s.db.WithContext(ctx).
		Where("user_id = ? AND starts_at <= ? AND (ends_at IS NULL OR ends_at >= ?)", userID, now, now).
		Order("starts_at DESC").
		First(&sub).Error
	if err != nil {
		return nil, false
	}
	return &sub, true
}

// checkNutritionDayGoal awards nutrition_day_complete when today's logged
// calories land within ±10% of the student's active nutrition program target
// (a tolerance band, not "over target counts too" — avoids rewarding wild
// overeating just because it crossed the number).
func (s *achievementService) checkNutritionDayGoal(ctx context.Context, userID uint) {
	sub, ok := s.currentSubscription(ctx, userID)
	if !ok {
		return
	}
	var program models.NutritionProgram
	if err := s.db.WithContext(ctx).
		Where("subscription_id = ? AND is_active = ? AND deleted_at IS NULL", sub.ID, true).
		First(&program).Error; err != nil {
		return
	}
	if program.CaloriesTarget <= 0 {
		return
	}

	now := time.Now()
	dayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	dayEnd := dayStart.AddDate(0, 0, 1)
	var totalCalories float64
	if err := s.db.WithContext(ctx).Model(&models.DailyFoodLog{}).
		Where("user_id = ? AND log_date >= ? AND log_date < ?", userID, dayStart, dayEnd).
		Select("COALESCE(SUM(calories), 0)").Scan(&totalCalories).Error; err != nil {
		log.Printf("achievement: nutrition-goal query failed user=%d: %v", userID, err)
		return
	}

	target := float64(program.CaloriesTarget)
	if totalCalories < target*0.9 || totalCalories > target*1.1 {
		return
	}
	if s.gamificationSvc != nil {
		s.gamificationSvc.AwardXP(ctx, userID, models.XPCategoryNutrition, "nutrition_day_complete", 15, "", 0)
	}
	s.award(ctx, userID, models.AchievementCodeNutritionDayDone, "")
}

// checkRegularWeek awards regular_week when every distinct training day
// defined by the active workout program has a logged session in the last 7
// days (same query shape as meDashboardService.fillAdherence).
func (s *achievementService) checkRegularWeek(ctx context.Context, userID uint) {
	sub, ok := s.currentSubscription(ctx, userID)
	if !ok {
		return
	}
	var goalDays int
	if err := s.db.WithContext(ctx).
		Table("workout_programs wp").
		Select("COUNT(DISTINCT pi.day_number)").
		Joins("JOIN program_items pi ON pi.workout_program_id = wp.id AND pi.deleted_at IS NULL").
		Where("wp.subscription_id = ? AND wp.is_active = ? AND wp.deleted_at IS NULL", sub.ID, true).
		Scan(&goalDays).Error; err != nil || goalDays == 0 {
		return
	}

	since := time.Now().AddDate(0, 0, -7)
	var completed int
	if err := s.db.WithContext(ctx).Model(&models.WorkoutSession{}).
		Where("subscription_id = ? AND completed_at > ?", sub.ID, since).
		Select("COUNT(DISTINCT day_key)").Scan(&completed).Error; err != nil {
		log.Printf("achievement: regular-week query failed user=%d: %v", userID, err)
		return
	}
	if completed >= goalDays {
		s.award(ctx, userID, models.AchievementCodeRegularWeek, "")
	}
}

func (s *achievementService) HandleWeeklyProgramChecked(ctx context.Context, userID uint) {
	s.checkRegularWeek(ctx, userID)
}

func (s *achievementService) HandleAIProgramSaved(ctx context.Context, userID uint, kind string) {
	if s.gamificationSvc != nil {
		s.gamificationSvc.AwardXP(ctx, userID, models.XPCategoryAI, "ai_"+kind+"_generated", 20, "", 0)
	}
	switch kind {
	case "workout":
		s.award(ctx, userID, models.AchievementCodeAIWorkoutArchitect, "")
	case "nutrition":
		s.award(ctx, userID, models.AchievementCodeAINutritionArchitect, "")
	}
}

func (s *achievementService) HandleAIProgramApproved(ctx context.Context, userID uint) {
	s.award(ctx, userID, models.AchievementCodeAIHumanCollab, "")
}

// HandleTrackingUpdated re-checks three things after any check-in write:
//  1. golden_checkin — weight + measurements + 3 distinct photo angles all
//     logged today (measurements checked as "this week" since WeeklyCheckIn
//     is week-granular, not daily).
//  2. tracking_visual_2m — at least 4 distinct days with a check-in photo in
//     the last 60 days (roughly bi-weekly cadence).
//  3. tracking_steady — at least 6 distinct WeeklyCheckIn rows in the last 90
//     days (consistent longer-term measurement tracking).
func (s *achievementService) HandleTrackingUpdated(ctx context.Context, userID uint) {
	now := time.Now()
	dayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	dayEnd := dayStart.AddDate(0, 0, 1)
	weekStart := now.AddDate(0, 0, -7)

	var hasWeightToday int64
	s.db.WithContext(ctx).Model(&models.DailyCheckIn{}).
		Where("user_id = ? AND date >= ? AND date < ?", userID, dayStart, dayEnd).
		Count(&hasWeightToday)

	var hasMeasurementsThisWeek int64
	s.db.WithContext(ctx).Model(&models.WeeklyCheckIn{}).
		Where("user_id = ? AND week_start >= ?", userID, weekStart).
		Count(&hasMeasurementsThisWeek)

	var photoTypesToday int64
	s.db.WithContext(ctx).Model(&models.UserPhoto{}).
		Where("user_id = ? AND check_in_date >= ? AND check_in_date < ?", userID, dayStart, dayEnd).
		Distinct("type").
		Count(&photoTypesToday)

	if hasWeightToday > 0 && hasMeasurementsThisWeek > 0 && photoTypesToday >= 3 {
		s.award(ctx, userID, models.AchievementCodeGoldenCheckIn, "")
	}

	twoMonthsAgo := now.AddDate(0, 0, -60)
	var distinctPhotoDays int64
	s.db.WithContext(ctx).Model(&models.UserPhoto{}).
		Where("user_id = ? AND check_in_date >= ?", userID, twoMonthsAgo).
		Distinct("DATE(check_in_date)").
		Count(&distinctPhotoDays)
	if distinctPhotoDays >= 4 {
		s.award(ctx, userID, models.AchievementCodeTrackingVisual2M, "")
	}

	ninetyDaysAgo := now.AddDate(0, 0, -90)
	var distinctCheckinWeeks int64
	s.db.WithContext(ctx).Model(&models.WeeklyCheckIn{}).
		Where("user_id = ? AND week_start >= ?", userID, ninetyDaysAgo).
		Distinct("week_start").
		Count(&distinctCheckinWeeks)
	if distinctCheckinWeeks >= 6 {
		s.award(ctx, userID, models.AchievementCodeTrackingSteady, "")
	}
}

// HandleCommunityEvent awards small, capped community XP and re-checks the
// active-community-member medal (20 posts OR 100 combined likes+comments).
func (s *achievementService) HandleCommunityEvent(ctx context.Context, userID uint, kind string) {
	if s.gamificationSvc != nil {
		switch kind {
		case "post":
			s.gamificationSvc.AwardXP(ctx, userID, models.XPCategoryCommunityEngagement, "community_post", 5, "", 0)
		case "like":
			s.gamificationSvc.AwardXP(ctx, userID, models.XPCategoryCommunityEngagement, "community_like", 1, "", 0)
		case "comment":
			s.gamificationSvc.AwardXP(ctx, userID, models.XPCategoryCommunityEngagement, "community_comment", 1, "", 0)
		}
	}

	var postCount int64
	s.db.WithContext(ctx).Model(&models.CommunityPost{}).Where("user_id = ?", userID).Count(&postCount)
	var likeCount int64
	s.db.WithContext(ctx).Model(&models.PostLike{}).Where("user_id = ?", userID).Count(&likeCount)
	var commentCount int64
	s.db.WithContext(ctx).Model(&models.PostComment{}).Where("user_id = ?", userID).Count(&commentCount)

	if postCount >= 20 || (likeCount+commentCount) >= 100 {
		s.award(ctx, userID, models.AchievementCodeCommunityActive, "")
	}
}

func (s *achievementService) HandleCoachSessionCompleted(ctx context.Context, userID uint) {
	s.award(ctx, userID, models.AchievementCodeCoachSession, "")
}

// HandleSubscriptionCreated grants subscription_renewal only for a returning
// student (isRenewal=true) — a first purchase is not "renewing" anything.
func (s *achievementService) HandleSubscriptionCreated(ctx context.Context, userID uint, isRenewal bool) {
	if isRenewal {
		s.award(ctx, userID, models.AchievementCodeSubRenewal, "")
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
	elapsed := time.Since(user.CreatedAt)
	if elapsed >= 365*24*time.Hour {
		s.award(ctx, userID, models.AchievementCode1YearMember, "")
	}
	if elapsed >= 5*365*24*time.Hour {
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
