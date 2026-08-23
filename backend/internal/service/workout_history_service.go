package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
	"github.com/yourusername/fitness-management/internal/service/ai"
)

var (
	ErrWorkoutSessionNotFound   = errors.New("workout session not found")
	ErrWorkoutSessionForbidden  = errors.New("subscription does not belong to user")
	ErrInvalidWorkoutDay        = errors.New("invalid workout day")
	ErrWorkoutDayEmpty          = errors.New("no workout scheduled for this day")
	ErrWorkoutSubscriptionEnded = errors.New("subscription is not active")
)

var validPainAreas = map[string]bool{
	"shoulder": true, "elbow_wrist": true, "lower_back": true,
	"hip_glute": true, "knee": true, "ankle_calf": true, "none": true,
}

var validDurationEstimates = map[int]bool{30: true, 45: true, 60: true, 75: true, 90: true}

const maxFavoriteExercises = 2

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
	// IsFirstSessionToday tells the frontend whether to pop the optional
	// post-workout micro-survey (only shown once per day).
	IsFirstSessionToday bool `json:"isFirstSessionToday,omitempty"`
}

type WorkoutHistoryListResponse struct {
	Items    []WorkoutHistoryItemDTO `json:"items"`
	Page     int                     `json:"page"`
	PageSize int                     `json:"pageSize"`
	Total    int64                   `json:"total"`
}

// PersonalRecordDTO is one PR-history event for GET /me/personal-records.
type PersonalRecordDTO struct {
	ExerciseName   string  `json:"exerciseName"`
	ExerciseID     *uint   `json:"exerciseId,omitempty"`
	WeightKg       float64 `json:"weightKg"`
	Reps           int     `json:"reps"`
	PreviousBestKg float64 `json:"previousBestKg"`
	AchievedAt     string  `json:"achievedAt"`
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

// WorkoutSessionSurveyRequest is the optional post-workout micro-survey shown
// once per day, right after the first session log succeeds. Every field is
// optional — the frontend only sends what the user filled in.
type WorkoutSessionSurveyRequest struct {
	EffortRPE               int      `json:"effortRpe,omitempty"`     // 6-10 in the UI, stored in the shared 0-10 column
	FeelingAfter             string   `json:"feelingAfter,omitempty"`  // great|good|ok|tired|exhausted
	FavoriteExercises        []string `json:"favoriteExercises,omitempty"` // max 2
	PainArea                 string   `json:"painArea,omitempty"`      // shoulder|elbow_wrist|lower_back|hip_glute|knee|ankle_calf|none
	PainNote                 string   `json:"painNote,omitempty"`
	DurationEstimateMinutes int      `json:"durationEstimateMinutes,omitempty"` // 30|45|60|75|90
	VoiceNoteText            string   `json:"voiceNoteText,omitempty"` // AI-cleaned transcript, already confirmed by the user
}

// WorkoutSessionVoiceNoteResult is the AI-cleaned preview returned before the
// user confirms and includes it in the survey submission.
type WorkoutSessionVoiceNoteResult struct {
	Text string `json:"text"`
}

// PersonalRecordsQuery narrows GET /me/personal-records: by exact exercise
// name, by muscle-group ("target"), and/or a date range. All optional.
type PersonalRecordsQuery struct {
	ExerciseName string
	Target       string
	From         *time.Time
	To           *time.Time
}

type WorkoutHistoryService interface {
	ListHistory(ctx context.Context, userID uint, page, pageSize int, subscriptionID uint) (*WorkoutHistoryListResponse, error)
	LogSession(ctx context.Context, userID uint, req *LogWorkoutSessionRequest) (*WorkoutHistoryItemDTO, error)
	// ListPersonalRecords returns the PR timeline for the user, filtered by
	// PersonalRecordsQuery. With no filter it collapses to the single latest
	// PR per exercise, newest-first; a narrowed query returns every matching
	// record oldest-first (chart-ready).
	ListPersonalRecords(ctx context.Context, userID uint, query PersonalRecordsQuery) ([]PersonalRecordDTO, error)
	// ListExerciseTargets returns the distinct muscle-group values for the
	// personal-records body-part selector.
	ListExerciseTargets(ctx context.Context) ([]string, error)
	// NotifyCoachOfPersonalRecord sends the student's coach an in-app
	// notification about a PR the student chose to share.
	NotifyCoachOfPersonalRecord(ctx context.Context, userID uint, exerciseName string, weightKg float64, reps int) error
	// SubmitSurvey fills in the optional post-workout micro-survey fields on
	// an already-logged session.
	SubmitSurvey(ctx context.Context, userID, sessionID uint, req *WorkoutSessionSurveyRequest) error
	// TranscribeSurveyVoiceNote runs STT then an AI cleanup pass so the survey
	// form can show an editable structured Persian paragraph before submit.
	TranscribeSurveyVoiceNote(ctx context.Context, userID uint, audioFilename string, audioData []byte) (*WorkoutSessionVoiceNoteResult, error)
}

type workoutHistoryService struct {
	db             *gorm.DB
	subRepo        repository.SubscriptionRepository
	planRepo       repository.ServicePlanRepository
	programRepo    repository.ProgramRepository
	achievementSvc AchievementService
	notifications  repository.NotificationRepository
}

func NewWorkoutHistoryService(
	db *gorm.DB,
	subRepo repository.SubscriptionRepository,
	planRepo repository.ServicePlanRepository,
	programRepo repository.ProgramRepository,
	achievementSvc AchievementService,
	notifications repository.NotificationRepository,
) WorkoutHistoryService {
	return &workoutHistoryService{
		db:             db,
		subRepo:        subRepo,
		planRepo:       planRepo,
		programRepo:    programRepo,
		achievementSvc: achievementSvc,
		notifications:  notifications,
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

// ListPersonalRecords implements WorkoutHistoryService.ListPersonalRecords.
// When ExerciseName or Target narrows the result, every matching record in
// the range is returned oldest-first (chart-ready). With neither filter, it
// collapses to the single latest PR per exercise, newest-first.
func (s *workoutHistoryService) ListPersonalRecords(ctx context.Context, userID uint, query PersonalRecordsQuery) ([]PersonalRecordDTO, error) {
	name := strings.TrimSpace(query.ExerciseName)
	target := strings.TrimSpace(query.Target)
	narrowed := name != "" || target != ""

	q := s.db.WithContext(ctx).Model(&models.PersonalRecord{}).Where("user_id = ?", userID)
	if name != "" {
		q = q.Where("LOWER(exercise_name) = ?", strings.ToLower(name))
	}
	if target != "" {
		var exerciseIDs []uint
		var exerciseNames []string
		s.db.WithContext(ctx).Model(&models.Exercise{}).
			Where("target = ? AND is_active = ?", target, true).
			Pluck("id", &exerciseIDs)
		s.db.WithContext(ctx).Model(&models.Exercise{}).
			Where("target = ? AND is_active = ?", target, true).
			Pluck("name", &exerciseNames)
		if len(exerciseIDs) == 0 && len(exerciseNames) == 0 {
			return []PersonalRecordDTO{}, nil
		}
		lowerNames := make([]string, len(exerciseNames))
		for i, n := range exerciseNames {
			lowerNames[i] = strings.ToLower(n)
		}
		q = q.Where("exercise_id IN ? OR LOWER(exercise_name) IN ?", exerciseIDs, lowerNames)
	}
	if query.From != nil {
		q = q.Where("achieved_at >= ?", *query.From)
	}
	if query.To != nil {
		q = q.Where("achieved_at <= ?", *query.To)
	}

	order := "achieved_at DESC"
	if narrowed {
		order = "achieved_at ASC" // oldest-first so a progression chart reads left-to-right
	}

	var records []models.PersonalRecord
	if err := q.Order(order).Find(&records).Error; err != nil {
		return nil, err
	}

	if narrowed {
		return personalRecordsToDTO(records), nil
	}

	// No filter requested: collapse newest-first rows down to the latest PR
	// per exercise (records is already ordered newest-first).
	seen := map[string]bool{}
	latest := make([]models.PersonalRecord, 0, len(records))
	for _, r := range records {
		key := strings.ToLower(strings.TrimSpace(r.ExerciseName))
		if seen[key] {
			continue
		}
		seen[key] = true
		latest = append(latest, r)
	}
	return personalRecordsToDTO(latest), nil
}

// ListExerciseTargets returns the distinct muscle-group ("target") values
// from the active exercise catalog, for the personal-records body-part
// selector — sourced from real seeded data rather than a hardcoded list.
func (s *workoutHistoryService) ListExerciseTargets(ctx context.Context) ([]string, error) {
	var targets []string
	err := s.db.WithContext(ctx).Model(&models.Exercise{}).
		Where("is_active = ? AND target != ''", true).
		Distinct("target").Order("target ASC").Pluck("target", &targets).Error
	return targets, err
}

// NotifyCoachOfPersonalRecord sends the student's assigned coach an in-app
// notification summarizing a PR the student wants to share (roadmap: "ارسال
// برای مربی" button on the Personal Records tab).
func (s *workoutHistoryService) NotifyCoachOfPersonalRecord(ctx context.Context, userID uint, exerciseName string, weightKg float64, reps int) error {
	exerciseName = strings.TrimSpace(exerciseName)
	if exerciseName == "" {
		return ErrAIInvalidInput
	}
	sub, err := s.subRepo.FindCurrentByUserID(ctx, userID, time.Now())
	if err != nil || sub == nil || sub.CoachID == 0 {
		return ErrWorkoutSessionForbidden
	}
	var user models.User
	if err := s.db.WithContext(ctx).Select("name").First(&user, userID).Error; err != nil {
		return err
	}
	return s.notifications.Create(ctx, &models.Notification{
		UserID:  sub.CoachID,
		Type:    models.NotificationTypeStudentPersonalRecord,
		Title:   "رکورد جدید یک دانشجو",
		Message: fmt.Sprintf("%s رکورد تازه‌ای ثبت کرد: %s با %.1f کیلوگرم × %d تکرار", user.Name, exerciseName, weightKg, reps),
	})
}

func personalRecordsToDTO(records []models.PersonalRecord) []PersonalRecordDTO {
	out := make([]PersonalRecordDTO, 0, len(records))
	for _, r := range records {
		out = append(out, PersonalRecordDTO{
			ExerciseName:   r.ExerciseName,
			ExerciseID:     r.ExerciseID,
			WeightKg:       r.WeightKg,
			Reps:           r.Reps,
			PreviousBestKg: r.PreviousBestKg,
			AchievedAt:     r.AchievedAt.Format(time.RFC3339),
		})
	}
	return out
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

	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	var todaySessionCount int64
	if err := s.db.WithContext(ctx).Model(&models.WorkoutSession{}).
		Where("user_id = ? AND completed_at >= ?", userID, todayStart).
		Count(&todaySessionCount).Error; err != nil {
		return nil, err
	}
	isFirstSessionToday := todaySessionCount == 0

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
		var previousBest map[int]float64
		newPRExercises, previousBest = s.markPersonalRecords(ctx, userID, logs)
		if err := s.db.WithContext(ctx).Create(&logs).Error; err != nil {
			return nil, err
		}
		if records := buildPersonalRecords(userID, now, logs, previousBest); len(records) > 0 {
			if err := s.db.WithContext(ctx).Create(&records).Error; err != nil {
				return nil, err
			}
		}
	}

	if s.achievementSvc != nil {
		s.achievementSvc.HandleWorkoutSessionCompleted(ctx, userID, session.ID)
		s.achievementSvc.HandleWeeklyProgramChecked(ctx, userID)
		for _, exerciseName := range newPRExercises {
			s.achievementSvc.HandleNewPR(ctx, userID, exerciseName)
		}
	}

	coachName := s.resolveCoachName(ctx, sub.CoachID)
	dto := workoutSessionToDTO(session, coachName)
	dto.NewPRExercises = newPRExercises
	dto.IsFirstSessionToday = isFirstSessionToday
	return &dto, nil
}

// SubmitSurvey fills in the optional post-workout micro-survey fields on an
// already-logged session. All fields are optional — an empty/zero value on
// the request simply leaves that field unset.
func (s *workoutHistoryService) SubmitSurvey(ctx context.Context, userID, sessionID uint, req *WorkoutSessionSurveyRequest) error {
	var session models.WorkoutSession
	if err := s.db.WithContext(ctx).First(&session, sessionID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrWorkoutSessionNotFound
		}
		return err
	}
	if session.UserID != userID {
		return ErrWorkoutSessionForbidden
	}
	if req == nil {
		return nil
	}

	updates := map[string]any{}
	if req.EffortRPE >= 6 && req.EffortRPE <= 10 {
		updates["effort_rpe"] = req.EffortRPE
	}
	feeling := strings.ToLower(strings.TrimSpace(req.FeelingAfter))
	if validFeelings[feeling] {
		updates["feeling_after"] = feeling
	}
	if len(req.FavoriteExercises) > 0 {
		favorites := req.FavoriteExercises
		if len(favorites) > maxFavoriteExercises {
			favorites = favorites[:maxFavoriteExercises]
		}
		if encoded, err := json.Marshal(favorites); err == nil {
			updates["favorite_exercises"] = string(encoded)
		}
	}
	painArea := strings.ToLower(strings.TrimSpace(req.PainArea))
	if validPainAreas[painArea] {
		updates["pain_area"] = painArea
		if painArea != "none" {
			updates["pain_note"] = strings.TrimSpace(req.PainNote)
		}
	}
	if validDurationEstimates[req.DurationEstimateMinutes] {
		updates["duration_estimate_minutes"] = req.DurationEstimateMinutes
	}
	if note := strings.TrimSpace(req.VoiceNoteText); note != "" {
		updates["voice_note_text"] = note
	}
	if len(updates) == 0 {
		return nil
	}
	return s.db.WithContext(ctx).Model(&session).Updates(updates).Error
}

// TranscribeSurveyVoiceNote runs the same STT + AI-cleanup pipeline as the
// other voice endpoints (SuggestSetLogFromVoice, SuggestFoodLogFromVoice in
// ai_generate_service.go): transcribe, then ask AI to turn the raw text into
// a tidy structured Persian paragraph. Preview only — the frontend shows the
// result for the user to confirm before it's included in SubmitSurvey.
func (s *workoutHistoryService) TranscribeSurveyVoiceNote(ctx context.Context, userID uint, audioFilename string, audioData []byte) (*WorkoutSessionVoiceNoteResult, error) {
	if len(audioData) == 0 {
		return nil, ErrAIInvalidInput
	}
	transcript, err := ai.TranscribeAudio(ctx, audioFilename, audioData)
	if err != nil {
		return nil, mapAIGenErr(err)
	}
	summary, _, err := ai.GenerateWorkoutNoteSummary(ctx, transcript)
	if err != nil {
		return nil, mapAIGenErr(err)
	}
	if err := ai.ValidateWorkoutNoteSummary(summary); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrAIInvalidPlan, err.Error())
	}
	return &WorkoutSessionVoiceNoteResult{Text: summary.Text}, nil
}

// markPersonalRecords compares each new set's weight against the user's prior
// best for the same exercise (case-insensitive) and flags IsPR in place when
// it's a new max. Returns the distinct exercise names that got a new PR, plus
// each flagged log's previous best (by index into logs) so the caller can
// build PersonalRecord history rows once the logs have DB-assigned IDs.
// Uses a running max within the current batch too, so e.g. set 3 beating set 1
// of the same session is still detected correctly.
func (s *workoutHistoryService) markPersonalRecords(ctx context.Context, userID uint, logs []models.WorkoutSetLog) ([]string, map[int]float64) {
	priorMax := map[string]float64{}
	prSet := map[string]bool{}
	previousBest := map[int]float64{}

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
			previousBest[i] = best
			priorMax[key] = logs[i].WeightKg
			prSet[logs[i].ExerciseName] = true
		}
	}

	names := make([]string, 0, len(prSet))
	for name := range prSet {
		names = append(names, name)
	}
	return names, previousBest
}

// buildPersonalRecords turns the IsPR-flagged rows of an already-inserted
// logs batch (so WorkoutSetLogID is populated) into PersonalRecord history
// rows for GET /me/personal-records.
func buildPersonalRecords(userID uint, achievedAt time.Time, logs []models.WorkoutSetLog, previousBest map[int]float64) []models.PersonalRecord {
	records := make([]models.PersonalRecord, 0, len(logs))
	for i := range logs {
		if !logs[i].IsPR {
			continue
		}
		records = append(records, models.PersonalRecord{
			UserID:          userID,
			ExerciseName:    logs[i].ExerciseName,
			ExerciseID:      logs[i].ExerciseID,
			WeightKg:        logs[i].WeightKg,
			Reps:            logs[i].Reps,
			PreviousBestKg:  previousBest[i],
			WorkoutSetLogID: logs[i].ID,
			AchievedAt:      achievedAt,
		})
	}
	return records
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
