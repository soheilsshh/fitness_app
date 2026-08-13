package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var (
	ErrWorkoutSessionNotFound   = errors.New("workout session not found")
	ErrWorkoutSessionForbidden  = errors.New("subscription does not belong to user")
	ErrInvalidWorkoutDay        = errors.New("invalid workout day")
	ErrWorkoutDayEmpty          = errors.New("no workout scheduled for this day")
	ErrWorkoutSubscriptionEnded = errors.New("subscription is not active")
)

type WorkoutHistoryItemDTO struct {
	ID                 uint     `json:"id"`
	SubscriptionID     uint     `json:"subscriptionId"`
	ProgramTitle       string   `json:"programTitle"`
	DayKey             string   `json:"dayKey"`
	DayLabel           string   `json:"dayLabel"`
	ExerciseCount      int      `json:"exerciseCount"`
	DurationMin        int      `json:"durationMin"`
	Notes              string   `json:"notes,omitempty"`
	EffortRPE          int      `json:"effortRpe,omitempty"`
	FeelingAfter       string   `json:"feelingAfter,omitempty"`
	SatisfactionRating int      `json:"satisfactionRating,omitempty"`
	NewPRExercises     []string `json:"newPrExercises,omitempty"`
	CompletedAt        string   `json:"completedAt"`
	CoachName          string   `json:"coachName,omitempty"`
}

type WorkoutHistoryListResponse struct {
	Items    []WorkoutHistoryItemDTO `json:"items"`
	Page     int                     `json:"page"`
	PageSize int                     `json:"pageSize"`
	Total    int64                   `json:"total"`
}

type LogSetInput struct {
	ExerciseName string  `json:"exerciseName"`
	ExerciseID   *uint   `json:"exerciseId,omitempty"`
	SetNumber    int     `json:"setNumber"`
	WeightKg     float64 `json:"weightKg"`
	Reps         int     `json:"reps"`
}

type LogWorkoutSessionRequest struct {
	SubscriptionID uint   `json:"subscriptionId"`
	DayKey         string `json:"dayKey"`
	DurationMin    int    `json:"durationMin"`
	Notes          string `json:"notes"`
	// EffortRPE (1-10) and SatisfactionRating (1-5) are self-reported; 0 = not reported.
	EffortRPE          int           `json:"effortRpe,omitempty"`
	FeelingAfter       string        `json:"feelingAfter,omitempty"`
	SatisfactionRating int           `json:"satisfactionRating,omitempty"`
	Sets               []LogSetInput `json:"sets,omitempty"`
}

var validFeelings = map[string]bool{
	"great": true, "good": true, "ok": true, "tired": true, "exhausted": true,
}

type WorkoutHistoryService interface {
	ListHistory(ctx context.Context, userID uint, page, pageSize int, subscriptionID uint) (*WorkoutHistoryListResponse, error)
	LogSession(ctx context.Context, userID uint, req *LogWorkoutSessionRequest) (*WorkoutHistoryItemDTO, error)
}

type workoutHistoryService struct {
	db             *gorm.DB
	subRepo        repository.SubscriptionRepository
	planRepo       repository.ServicePlanRepository
	programRepo    repository.ProgramRepository
	achievementSvc AchievementService
}

func NewWorkoutHistoryService(
	db *gorm.DB,
	subRepo repository.SubscriptionRepository,
	planRepo repository.ServicePlanRepository,
	programRepo repository.ProgramRepository,
	achievementSvc AchievementService,
) WorkoutHistoryService {
	return &workoutHistoryService{
		db:             db,
		subRepo:        subRepo,
		planRepo:       planRepo,
		programRepo:    programRepo,
		achievementSvc: achievementSvc,
	}
}

var workoutDayLabels = map[string]string{
	"sat": "شنبه",
	"sun": "یکشنبه",
	"mon": "دوشنبه",
	"tue": "سه‌شنبه",
	"wed": "چهارشنبه",
	"thu": "پنجشنبه",
	"fri": "جمعه",
}

func (s *workoutHistoryService) ListHistory(ctx context.Context, userID uint, page, pageSize int, subscriptionID uint) (*WorkoutHistoryListResponse, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	db := s.db.WithContext(ctx).Model(&models.WorkoutSession{}).Where("user_id = ?", userID)
	if subscriptionID > 0 {
		db = db.Where("subscription_id = ?", subscriptionID)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}

	var sessions []models.WorkoutSession
	offset := (page - 1) * pageSize
	if err := db.Order("completed_at DESC").Offset(offset).Limit(pageSize).Find(&sessions).Error; err != nil {
		return nil, err
	}

	coachNames := map[uint]string{}
	items := make([]WorkoutHistoryItemDTO, 0, len(sessions))
	for _, sess := range sessions {
		coachName := ""
		var sub models.Subscription
		if err := s.db.WithContext(ctx).First(&sub, sess.SubscriptionID).Error; err == nil {
			if name, ok := coachNames[sub.CoachID]; ok {
				coachName = name
			} else {
				coachName = s.resolveCoachName(ctx, sub.CoachID)
				coachNames[sub.CoachID] = coachName
			}
		}

		items = append(items, workoutSessionToDTO(sess, coachName))
	}

	return &WorkoutHistoryListResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	}, nil
}

func (s *workoutHistoryService) LogSession(ctx context.Context, userID uint, req *LogWorkoutSessionRequest) (*WorkoutHistoryItemDTO, error) {
	if req == nil || req.SubscriptionID == 0 {
		return nil, fmt.Errorf("%w: subscriptionId is required", ErrInvalidWorkoutDay)
	}

	dayKey := strings.ToLower(strings.TrimSpace(req.DayKey))
	if dayKey == "" || workoutDayLabels[dayKey] == "" {
		return nil, ErrInvalidWorkoutDay
	}

	var sub models.Subscription
	if err := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", req.SubscriptionID, userID).First(&sub).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkoutSessionForbidden
		}
		return nil, err
	}

	now := time.Now()
	if sub.EndsAt != nil && !sub.EndsAt.After(now) {
		return nil, ErrWorkoutSubscriptionEnded
	}

	wp, err := s.programRepo.FindActiveWorkoutBySubscriptionID(ctx, sub.ID)
	if err != nil || wp == nil {
		return nil, ErrWorkoutDayEmpty
	}

	items, err := s.programRepo.FindWorkoutItemsByProgramID(ctx, wp.ID)
	if err != nil {
		return nil, err
	}

	planByDay, _ := buildFullPlanByDay(items, nil)
	dayPlan, ok := planByDay[dayKey]
	if !ok || dayPlan.Workout == nil {
		return nil, ErrWorkoutDayEmpty
	}

	exerciseCount := len(dayPlan.Workout.Exercises)
	if exerciseCount == 0 {
		exerciseCount = len(dayPlan.Workout.Steps)
	}
	if exerciseCount == 0 {
		return nil, ErrWorkoutDayEmpty
	}

	durationMin := req.DurationMin
	if durationMin <= 0 {
		durationMin = dayPlan.Workout.DurationMin
	}
	if durationMin <= 0 {
		durationMin = exerciseCount * 5
	}

	programTitle := strings.TrimSpace(wp.Title)
	if programTitle == "" {
		if plan, err := s.planRepo.FindByID(ctx, sub.ServicePlanID); err == nil && plan != nil {
			programTitle = plan.Name
		}
	}

	feeling := strings.ToLower(strings.TrimSpace(req.FeelingAfter))
	if feeling != "" && !validFeelings[feeling] {
		feeling = ""
	}
	effort := req.EffortRPE
	if effort < 0 || effort > 10 {
		effort = 0
	}
	satisfaction := req.SatisfactionRating
	if satisfaction < 0 || satisfaction > 5 {
		satisfaction = 0
	}

	session := models.WorkoutSession{
		UserID:             userID,
		SubscriptionID:     sub.ID,
		WorkoutProgramID:   wp.ID,
		ProgramTitle:       programTitle,
		DayKey:             dayKey,
		DayLabel:           workoutDayLabels[dayKey],
		ExerciseCount:      exerciseCount,
		DurationMin:        durationMin,
		Notes:              strings.TrimSpace(req.Notes),
		EffortRPE:          effort,
		FeelingAfter:       feeling,
		SatisfactionRating: satisfaction,
		CompletedAt:        now,
	}
	if err := s.db.WithContext(ctx).Create(&session).Error; err != nil {
		return nil, err
	}

	// Persist any logged sets (weight x reps), flagging new personal records
	// (roadmap BE-3.2) before writing them.
	var newPRExercises []string
	if logs := buildSetLogs(userID, sub.ID, session.ID, now, req.Sets); len(logs) > 0 {
		newPRExercises = s.markPersonalRecords(ctx, userID, logs)
		if err := s.db.WithContext(ctx).Create(&logs).Error; err != nil {
			return nil, err
		}
	}

	if s.achievementSvc != nil {
		s.achievementSvc.HandleWorkoutSessionCompleted(ctx, userID)
		for _, exerciseName := range newPRExercises {
			s.achievementSvc.HandleNewPR(ctx, userID, exerciseName)
		}
	}

	coachName := s.resolveCoachName(ctx, sub.CoachID)
	dto := workoutSessionToDTO(session, coachName)
	dto.NewPRExercises = newPRExercises
	return &dto, nil
}

// markPersonalRecords compares each new set's weight against the user's prior
// best for the same exercise (case-insensitive) and flags IsPR in place when
// it's a new max. Returns the distinct exercise names that got a new PR.
// Uses a running max within the current batch too, so e.g. set 3 beating set 1
// of the same session is still detected correctly.
func (s *workoutHistoryService) markPersonalRecords(ctx context.Context, userID uint, logs []models.WorkoutSetLog) []string {
	priorMax := map[string]float64{}
	prSet := map[string]bool{}

	for i := range logs {
		key := strings.ToLower(strings.TrimSpace(logs[i].ExerciseName))
		if key == "" {
			continue
		}
		best, known := priorMax[key]
		if !known {
			var maxWeight *float64
			_ = s.db.WithContext(ctx).Model(&models.WorkoutSetLog{}).
				Where("user_id = ? AND LOWER(exercise_name) = ?", userID, key).
				Select("MAX(weight_kg)").Scan(&maxWeight).Error
			if maxWeight != nil {
				best = *maxWeight
			}
			priorMax[key] = best
		}
		if logs[i].WeightKg > best && logs[i].WeightKg > 0 {
			logs[i].IsPR = true
			priorMax[key] = logs[i].WeightKg
			prSet[logs[i].ExerciseName] = true
		}
	}

	names := make([]string, 0, len(prSet))
	for name := range prSet {
		names = append(names, name)
	}
	return names
}

// buildSetLogs converts validated set inputs into WorkoutSetLog rows, skipping
// entries with no exercise name or a non-positive weight.
func buildSetLogs(userID, subID, sessionID uint, performedAt time.Time, inputs []LogSetInput) []models.WorkoutSetLog {
	logs := make([]models.WorkoutSetLog, 0, len(inputs))
	for i, in := range inputs {
		name := strings.TrimSpace(in.ExerciseName)
		if name == "" || in.WeightKg <= 0 {
			continue
		}
		setNo := in.SetNumber
		if setNo <= 0 {
			setNo = i + 1
		}
		reps := in.Reps
		if reps < 0 {
			reps = 0
		}
		logs = append(logs, models.WorkoutSetLog{
			UserID:           userID,
			SubscriptionID:   subID,
			WorkoutSessionID: sessionID,
			ExerciseName:     name,
			ExerciseID:       in.ExerciseID,
			SetNumber:        setNo,
			WeightKg:         in.WeightKg,
			Reps:             reps,
			PerformedAt:      performedAt,
		})
	}
	return logs
}

func workoutSessionToDTO(sess models.WorkoutSession, coachName string) WorkoutHistoryItemDTO {
	label := sess.DayLabel
	if label == "" {
		label = workoutDayLabels[sess.DayKey]
	}
	return WorkoutHistoryItemDTO{
		ID:                 sess.ID,
		SubscriptionID:     sess.SubscriptionID,
		ProgramTitle:       sess.ProgramTitle,
		DayKey:             sess.DayKey,
		DayLabel:           label,
		ExerciseCount:      sess.ExerciseCount,
		DurationMin:        sess.DurationMin,
		Notes:              sess.Notes,
		EffortRPE:          sess.EffortRPE,
		FeelingAfter:       sess.FeelingAfter,
		SatisfactionRating: sess.SatisfactionRating,
		CompletedAt:        sess.CompletedAt.Format(time.RFC3339),
		CoachName:          coachName,
	}
}

func (s *workoutHistoryService) resolveCoachName(ctx context.Context, coachID uint) string {
	if coachID == 0 {
		return ""
	}
	var user models.User
	if err := s.db.WithContext(ctx).Select("name").First(&user, coachID).Error; err != nil {
		return ""
	}
	return user.Name
}
