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
	ExerciseName string `json:"exerciseName"`
	ExerciseID   *uint  `json:"exerciseId,omitempty"`
	// MetricKind is "weight", "reps" or "hold" — which of the value pairs below
	// the client should render as the record.
	MetricKind          string  `json:"metricKind"`
	// MuscleGroup is the canonical group code; MuscleGroupLabel is its Persian name.
	MuscleGroup      string `json:"muscleGroup,omitempty"`
	MuscleGroupLabel string `json:"muscleGroupLabel,omitempty"`
	WeightKg            float64 `json:"weightKg"`
	Reps                int     `json:"reps"`
	HoldSeconds         int     `json:"holdSeconds,omitempty"`
	PreviousBestKg      float64 `json:"previousBestKg"`
	PreviousBestReps    int     `json:"previousBestReps,omitempty"`
	PreviousBestHoldSec int     `json:"previousBestHoldSec,omitempty"`
	AchievedAt          string  `json:"achievedAt"`
}

type LogSetInput struct {
	ExerciseName string  `json:"exerciseName"`
	ExerciseID   *uint   `json:"exerciseId,omitempty"`
	SetNumber    int     `json:"setNumber"`
	WeightKg     float64 `json:"weightKg"`
	Reps         int     `json:"reps"`
	// HoldSeconds is the duration of an isometric set (plank, wall sit, L-sit).
	HoldSeconds int `json:"holdSeconds,omitempty"`
	// MetricKind overrides the automatic weight/reps/hold detection. Optional —
	// the frontend sends it so the user's choice of input wins over the guess.
	MetricKind string `json:"metricKind,omitempty"`
	// Equipment is the catalog equipment label, passed through so bodyweight
	// movements are recognised without a second database lookup.
	Equipment string `json:"equipment,omitempty"`
	// Target is the catalog muscle ("target") when the set came from a catalog
	// exercise. Empty for coach-template and AI-generated movements, which are
	// then classified from their name.
	Target string `json:"target,omitempty"`
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
// PersonalRecordShareRequest is the "ارسال برای مربی" payload. MetricKind
// decides which value the notification text quotes — a bodyweight record has
// no kilos to report.
type PersonalRecordShareRequest struct {
	ExerciseName string  `json:"exerciseName"`
	MetricKind   string  `json:"metricKind,omitempty"`
	WeightKg     float64 `json:"weightKg,omitempty"`
	Reps         int     `json:"reps,omitempty"`
	HoldSeconds  int     `json:"holdSeconds,omitempty"`
}

// formatPersonalRecord renders a record the way it should read in Persian for
// its metric kind.
func formatPersonalRecord(exerciseName string, req PersonalRecordShareRequest) string {
	kind := strings.ToLower(strings.TrimSpace(req.MetricKind))
	if !ValidMetricKind(kind) {
		kind = MetricKindWeight
		if req.WeightKg <= 0 {
			if req.HoldSeconds > 0 {
				kind = MetricKindHold
			} else {
				kind = MetricKindReps
			}
		}
	}
	switch kind {
	case MetricKindReps:
		return fmt.Sprintf("%s با %d تکرار", exerciseName, req.Reps)
	case MetricKindHold:
		if req.HoldSeconds >= 60 && req.HoldSeconds%60 == 0 {
			return fmt.Sprintf("%s با %d دقیقه نگه‌داشتن", exerciseName, req.HoldSeconds/60)
		}
		return fmt.Sprintf("%s با %d ثانیه نگه‌داشتن", exerciseName, req.HoldSeconds)
	default:
		if req.Reps > 0 {
			return fmt.Sprintf("%s با %.1f کیلوگرم × %d تکرار", exerciseName, req.WeightKg, req.Reps)
		}
		return fmt.Sprintf("%s با %.1f کیلوگرم", exerciseName, req.WeightKg)
	}
}

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
	// ListMuscleGroups returns the standard taxonomy with Persian labels.
	ListMuscleGroups(ctx context.Context) []MuscleGroupInfo
	// NotifyCoachOfPersonalRecord sends the student's coach an in-app
	// notification about a PR the student chose to share.
	NotifyCoachOfPersonalRecord(ctx context.Context, userID uint, req PersonalRecordShareRequest) error
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
		// `target` is a canonical muscle-group code (service.MuscleGroup*).
		// Records store it directly, so template- and AI-sourced movements are
		// filterable too — they were never in the catalog and so never had a
		// catalog `target` to join against.
		if MuscleGroupLabel(target) == "" {
			return []PersonalRecordDTO{}, nil
		}
		q = q.Where("muscle_group = ?", target)
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
	// Keyed by exercise *and* metric kind: a student can hold both a weighted
	// PR and a bodyweight rep PR on the same movement, and both should show.
	seen := map[string]bool{}
	latest := make([]models.PersonalRecord, 0, len(records))
	for _, r := range records {
		key := strings.ToLower(strings.TrimSpace(r.ExerciseName)) + "|" + r.MetricKind
		if seen[key] {
			continue
		}
		seen[key] = true
		latest = append(latest, r)
	}
	return personalRecordsToDTO(latest), nil
}

// ListExerciseTargets returns the standard muscle-group taxonomy for the
// personal-records picker, as canonical group codes. It used to return whatever
// distinct `target` strings the catalog happened to hold, which meant
// coach-template and AI-generated movements — neither of which is in the
// catalog — could never be selected.
func (s *workoutHistoryService) ListExerciseTargets(ctx context.Context) ([]string, error) {
	codes := make([]string, 0, len(MuscleGroupCatalog))
	for _, group := range MuscleGroupCatalog {
		if group.Recordable {
			codes = append(codes, group.Code)
		}
	}
	return codes, nil
}

// ListMuscleGroups returns the standard taxonomy with Persian labels, for a
// picker that needs more than the bare codes.
func (s *workoutHistoryService) ListMuscleGroups(ctx context.Context) []MuscleGroupInfo {
	return MuscleGroupCatalog
}

// NotifyCoachOfPersonalRecord sends the student's assigned coach an in-app
// notification summarizing a PR the student wants to share (roadmap: "ارسال
// برای مربی" button on the Personal Records tab).
func (s *workoutHistoryService) NotifyCoachOfPersonalRecord(ctx context.Context, userID uint, req PersonalRecordShareRequest) error {
	exerciseName := strings.TrimSpace(req.ExerciseName)
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
		Message: fmt.Sprintf("%s رکورد تازه‌ای ثبت کرد: %s", user.Name, formatPersonalRecord(exerciseName, req)),
	})
}

func personalRecordsToDTO(records []models.PersonalRecord) []PersonalRecordDTO {
	out := make([]PersonalRecordDTO, 0, len(records))
	for _, r := range records {
		kind := r.MetricKind
		if kind == "" {
			kind = MetricKindWeight // rows written before metric kinds existed
		}
		out = append(out, PersonalRecordDTO{
			ExerciseName:        r.ExerciseName,
			ExerciseID:          r.ExerciseID,
			MetricKind:          kind,
			MuscleGroup:         r.MuscleGroup,
			MuscleGroupLabel:    MuscleGroupLabel(r.MuscleGroup),
			WeightKg:            r.WeightKg,
			Reps:                r.Reps,
			HoldSeconds:         r.HoldSeconds,
			PreviousBestKg:      r.PreviousBestKg,
			PreviousBestReps:    r.PreviousBestReps,
			PreviousBestHoldSec: r.PreviousBestHoldSec,
			AchievedAt:          r.AchievedAt.Format(time.RFC3339),
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
	var loggedSets []models.WorkoutSetLog
	if logs := buildSetLogs(userID, sub.ID, session.ID, now, s.currentBodyweight(ctx, userID), req.Sets); len(logs) > 0 {
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
		loggedSets = logs
	}

	if s.achievementSvc != nil {
		s.achievementSvc.HandleWorkoutSessionCompleted(ctx, userID, session.ID)
		s.achievementSvc.HandleWeeklyProgramChecked(ctx, userID)
		for _, exerciseName := range newPRExercises {
			s.achievementSvc.HandleNewPR(ctx, userID, exerciseName)
		}
		// Calisthenics ladders are checked on every set, not only PR sets: a
		// student can cross the 25-push-up tier on a set that ties, rather than
		// beats, their previous best.
		for i := range loggedSets {
			switch loggedSets[i].MetricKind {
			case MetricKindReps:
				s.achievementSvc.HandleBodyweightSet(ctx, userID, loggedSets[i].ExerciseName, MetricKindReps, loggedSets[i].Reps)
			case MetricKindHold:
				s.achievementSvc.HandleBodyweightSet(ctx, userID, loggedSets[i].ExerciseName, MetricKindHold, loggedSets[i].HoldSeconds)
			}
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

// setMetricValue is the number that has to go up for a set to be a new record:
// kilos for weight PRs, reps for bodyweight PRs, seconds for isometric holds.
func setMetricValue(log models.WorkoutSetLog) float64 {
	switch log.MetricKind {
	case MetricKindReps:
		return float64(log.Reps)
	case MetricKindHold:
		return float64(log.HoldSeconds)
	default:
		return log.WeightKg
	}
}

// prColumnForKind maps a metric kind onto the WorkoutSetLog column that holds
// its value, for the "previous best" lookup.
func prColumnForKind(kind string) string {
	switch kind {
	case MetricKindReps:
		return "reps"
	case MetricKindHold:
		return "hold_seconds"
	default:
		return "weight_kg"
	}
}

// markPersonalRecords compares each new set against the user's prior best for
// the same exercise *and the same metric kind* (case-insensitive on the name)
// and flags IsPR in place when it's a new best. Returns the distinct exercise
// names that got a new PR, plus each flagged log's previous best (by index into
// logs) so the caller can build PersonalRecord history rows once the logs have
// DB-assigned IDs. Uses a running max within the current batch too, so e.g.
// set 3 beating set 1 of the same session is still detected correctly.
//
// Keying on the metric kind is what lets a bodyweight student set records:
// "شنا 30 تکرار" is compared against their previous best rep count, never
// against a weight.
func (s *workoutHistoryService) markPersonalRecords(ctx context.Context, userID uint, logs []models.WorkoutSetLog) ([]string, map[int]float64) {
	type prKey struct {
		name string
		kind string
	}
	priorMax := map[prKey]float64{}
	prSet := map[string]bool{}
	previousBest := map[int]float64{}

	for i := range logs {
		name := strings.ToLower(strings.TrimSpace(logs[i].ExerciseName))
		if name == "" {
			continue
		}
		key := prKey{name: name, kind: logs[i].MetricKind}
		best, known := priorMax[key]
		if !known {
			var maxValue *float64
			_ = s.db.WithContext(ctx).Model(&models.WorkoutSetLog{}).
				Where("user_id = ? AND LOWER(exercise_name) = ? AND metric_kind = ?", userID, name, key.kind).
				Select("MAX(" + prColumnForKind(key.kind) + ")").Scan(&maxValue).Error
			if maxValue != nil {
				best = *maxValue
			}
			priorMax[key] = best
		}
		value := setMetricValue(logs[i])
		if value > best && value > 0 {
			logs[i].IsPR = true
			previousBest[i] = best
			priorMax[key] = value
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
		record := models.PersonalRecord{
			UserID:          userID,
			ExerciseName:    logs[i].ExerciseName,
			ExerciseID:      logs[i].ExerciseID,
			MetricKind:      logs[i].MetricKind,
			MuscleGroup:     logs[i].MuscleGroup,
			WeightKg:        logs[i].WeightKg,
			Reps:            logs[i].Reps,
			HoldSeconds:     logs[i].HoldSeconds,
			WorkoutSetLogID: logs[i].ID,
			AchievedAt:      achievedAt,
		}
		switch logs[i].MetricKind {
		case MetricKindReps:
			record.PreviousBestReps = int(previousBest[i])
		case MetricKindHold:
			record.PreviousBestHoldSec = int(previousBest[i])
		default:
			record.PreviousBestKg = previousBest[i]
		}
		records = append(records, record)
	}
	return records
}

// buildSetLogs converts validated set inputs into WorkoutSetLog rows. A set is
// kept when it records *any* effort — a weight, a rep count, or a hold in
// seconds — so bodyweight and isometric work is no longer silently dropped.
func buildSetLogs(userID, subID, sessionID uint, performedAt time.Time, bodyweightKg float64, inputs []LogSetInput) []models.WorkoutSetLog {
	logs := make([]models.WorkoutSetLog, 0, len(inputs))
	for i, in := range inputs {
		name := strings.TrimSpace(in.ExerciseName)
		if name == "" {
			continue
		}
		weight := in.WeightKg
		if weight < 0 {
			weight = 0
		}
		reps := in.Reps
		if reps < 0 {
			reps = 0
		}
		hold := in.HoldSeconds
		if hold < 0 {
			hold = 0
		}
		if weight == 0 && reps == 0 && hold == 0 {
			continue
		}

		kind := strings.ToLower(strings.TrimSpace(in.MetricKind))
		if !ValidMetricKind(kind) {
			kind = DetectMetricKind(name, in.Equipment, weight > 0)
		}
		// A kind the set carries no value for would never beat anything; fall
		// back to whatever the user did enter.
		switch {
		case kind == MetricKindWeight && weight == 0:
			if hold > 0 {
				kind = MetricKindHold
			} else {
				kind = MetricKindReps
			}
		case kind == MetricKindHold && hold == 0:
			if weight > 0 {
				kind = MetricKindWeight
			} else {
				kind = MetricKindReps
			}
		case kind == MetricKindReps && reps == 0:
			if weight > 0 {
				kind = MetricKindWeight
			} else if hold > 0 {
				kind = MetricKindHold
			} else {
				continue
			}
		}

		setNo := in.SetNumber
		if setNo <= 0 {
			setNo = i + 1
		}

		logs = append(logs, models.WorkoutSetLog{
			UserID:           userID,
			SubscriptionID:   subID,
			WorkoutSessionID: sessionID,
			ExerciseName:     name,
			ExerciseID:       in.ExerciseID,
			SetNumber:        setNo,
			WeightKg:         weight,
			Reps:             reps,
			HoldSeconds:      hold,
			MetricKind:       kind,
			MuscleGroup:      ClassifyMuscleGroup(name, in.Target),
			BodyweightKg:     bodyweightKg,
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

// currentBodyweight snapshots the student's latest recorded weight so that
// bodyweight sets carry the load they were actually performed against.
// Returns 0 when unknown, which callers treat as "not recorded".
func (s *workoutHistoryService) currentBodyweight(ctx context.Context, userID uint) float64 {
	var user models.User
	if err := s.db.WithContext(ctx).Select("weight_kg").First(&user, userID).Error; err != nil {
		return 0
	}
	if user.WeightKg == nil || *user.WeightKg <= 0 {
		return 0
	}
	return *user.WeightKg
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
