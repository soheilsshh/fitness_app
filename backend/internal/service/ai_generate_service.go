package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/config"
	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
	"github.com/yourusername/fitness-management/internal/service/ai"
)

const (
	aiGenRateWindow       = time.Minute
	aiGenRateMaxPerWindow = 10
	aiLogTextMaxRunes     = 12000
)

// ErrAINoActiveSubscription is returned when saving an AI-generated program
// requires an active coach subscription (roadmap decision, Fitino_Master_Roadmap.md §2.3)
// and the student doesn't have one yet.
var ErrAINoActiveSubscription = errors.New("no active subscription to save ai plan")

// NutritionPlanResult bundles the AI-generated plan with its deterministic
// targets and (if saved) the resulting program id (roadmap BE-1.1/BE-1.2).
type NutritionPlanResult struct {
	Plan      *ai.NutritionPlanSchema `json:"plan"`
	Targets   NutritionTargets        `json:"targets"`
	ProgramID uint                    `json:"programId,omitempty"`
}

// AIGenerateService orchestrates structured AI generation for phase 0 and,
// starting roadmap phase 1, persists the result into real program tables.
type AIGenerateService struct {
	db          *gorm.DB
	meService   MeService
	logRepo     repository.AIRequestLogRepository
	subRepo     repository.SubscriptionRepository
	programRepo repository.ProgramRepository

	mu    sync.Mutex
	rates map[uint][]time.Time
}

func NewAIGenerateService(
	db *gorm.DB,
	meService MeService,
	logRepo repository.AIRequestLogRepository,
	subRepo repository.SubscriptionRepository,
	programRepo repository.ProgramRepository,
) *AIGenerateService {
	return &AIGenerateService{
		db:          db,
		meService:   meService,
		logRepo:     logRepo,
		subRepo:     subRepo,
		programRepo: programRepo,
		rates:       make(map[uint][]time.Time),
	}
}

// GenerateNutrition asks AI for a plan grounded in deterministically-computed
// BMR/TDEE targets (BE-1.1), validates it, and optionally saves it as the
// student's active nutrition_program (BE-1.2). goal defaults to the user's
// PrimaryGoal / "maintain" when empty.
func (s *AIGenerateService) GenerateNutrition(ctx context.Context, userID uint, goal string, save bool) (*NutritionPlanResult, error) {
	if !s.allow(userID) {
		return nil, ErrAIRateLimited
	}

	profile, err := s.meService.GetProfile(ctx, userID)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(goal) == "" {
		goal = mapPrimaryGoalToPlanGoal(profile.PrimaryGoal)
	}
	targets := CalculateNutritionTargets(NutritionCalcInput{
		Gender:         profile.Gender,
		WeightKg:       derefFloat(profile.WeightKg),
		HeightCm:       derefFloat(profile.HeightCm),
		BirthDate:      profile.BirthDate,
		BodyFatPercent: profile.BodyFatPercent,
		Goal:           goal,
	})

	userContext := buildAIUserContext(profile) + fmt.Sprintf(
		"\nهدف تغذیه‌ای انتخاب‌شده: %s\nهدف کالری روزانه محاسبه‌شده (حتماً نزدیک به همین عدد بمان): %d کیلوکالری، پروتئین %dگرم، کربوهیدرات %dگرم، چربی %dگرم.",
		targets.Goal, targets.TargetCalories, targets.ProteinG, targets.CarbsG, targets.FatG,
	)
	persona := string(ai.PersonaNutrition)

	plan, genRes, genErr := ai.GenerateNutritionPlan(ctx, userContext)
	s.persistLog(ctx, userID, "nutrition_plan", persona, userContext, genRes, genErr)

	if genErr != nil {
		return nil, mapAIGenErr(genErr)
	}
	if err := ai.ValidateNutritionPlan(plan); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrAIInvalidPlan, err.Error())
	}

	result := &NutritionPlanResult{Plan: plan, Targets: targets}
	if save {
		programID, err := s.saveNutritionProgram(ctx, userID, plan, targets)
		if err != nil {
			return nil, err
		}
		result.ProgramID = programID
	}
	return result, nil
}

// saveNutritionProgram persists an AI-generated plan as the student's active
// nutrition_program + nutrition_item rows (roadmap BE-1.2). Requires an active
// coach subscription, mirroring the coach-authored program flow.
func (s *AIGenerateService) saveNutritionProgram(ctx context.Context, userID uint, plan *ai.NutritionPlanSchema, targets NutritionTargets) (uint, error) {
	sub, err := s.subRepo.FindCurrentByUserID(ctx, userID, time.Now())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, ErrAINoActiveSubscription
		}
		return 0, err
	}

	if err := s.programRepo.DeactivateNutritionPrograms(ctx, sub.ID); err != nil {
		return 0, err
	}
	maxVersion, err := s.programRepo.MaxNutritionVersion(ctx, sub.ID)
	if err != nil {
		return 0, err
	}

	program := &models.NutritionProgram{
		SubscriptionID: sub.ID,
		CoachID:        sub.CoachID,
		Version:        maxVersion + 1,
		Title:          "برنامه غذایی هوش مصنوعی",
		Notes:          "این برنامه توسط دستیار هوشمند فیتینو تولید شده است.",
		CaloriesTarget: targets.TargetCalories,
		ProteinTarget:  fmt.Sprintf("%dg", targets.ProteinG),
		Goal:           targets.Goal,
		DurationWeeks:  4,
		IsActive:       true,
	}
	if err := s.programRepo.CreateNutritionProgram(ctx, program); err != nil {
		return 0, err
	}

	items := nutritionPlanToItems(plan)
	for i := range items {
		items[i].NutritionProgramID = program.ID
	}
	if err := s.programRepo.UpsertNutritionItems(ctx, program.ID, items); err != nil {
		return 0, err
	}
	return program.ID, nil
}

func nutritionPlanToItems(plan *ai.NutritionPlanSchema) []models.NutritionItem {
	items := make([]models.NutritionItem, 0)
	for mealIdx, meal := range plan.Meals {
		for itemIdx, food := range meal.Items {
			items = append(items, models.NutritionItem{
				DayNumber:  1,
				MealNumber: mealIdx + 1,
				OrderIndex: itemIdx,
				MealSlot:   mealSlotFromIndex(mealIdx),
				Food:       food.FoodName,
				Quantity:   fmt.Sprintf("%.0f گرم", food.AmountG),
				Multiplier: 1,
				Calories:   food.Calories,
				Protein:    food.ProteinG,
				Carbs:      food.CarbsG,
				Fat:        food.FatG,
				Notes:      meal.Name,
			})
		}
	}
	return items
}

func mealSlotFromIndex(idx int) string {
	slots := []string{"breakfast", "lunch", "snack1", "dinner", "snack2", "snack3"}
	if idx >= 0 && idx < len(slots) {
		return slots[idx]
	}
	return "snack3"
}

func mapPrimaryGoalToPlanGoal(primaryGoal string) string {
	g := strings.ToLower(strings.TrimSpace(primaryGoal))
	switch {
	case strings.Contains(g, "cut") || strings.Contains(g, "loss") || strings.Contains(g, "لاغر") || strings.Contains(g, "کاهش"):
		return ai.GoalCut
	case strings.Contains(g, "bulk") || strings.Contains(g, "gain") || strings.Contains(g, "حجم") || strings.Contains(g, "افزایش"):
		return ai.GoalBulk
	default:
		return ai.GoalMaintain
	}
}

func derefFloat(v *float64) float64 {
	if v == nil {
		return 0
	}
	return *v
}

// SuggestFromIngredients asks AI for an improvised recipe built only from
// ingredients the user currently has (roadmap BE-1.9). Never saved to DB.
func (s *AIGenerateService) SuggestFromIngredients(ctx context.Context, userID uint, ingredients string, calorieMin, calorieMax int) (*ai.IngredientSuggestionSchema, error) {
	if !s.allow(userID) {
		return nil, ErrAIRateLimited
	}
	if strings.TrimSpace(ingredients) == "" {
		return nil, ErrAIInvalidInput
	}

	userContext := buildIngredientUserContext(ingredients, calorieMin, calorieMax)
	persona := string(ai.PersonaNutrition)

	suggestion, genRes, genErr := ai.GenerateIngredientSuggestion(ctx, userContext)
	s.persistLog(ctx, userID, "ingredient_suggestion", persona, userContext, genRes, genErr)

	if genErr != nil {
		return nil, mapAIGenErr(genErr)
	}
	if err := ai.ValidateIngredientSuggestion(suggestion); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrAIInvalidPlan, err.Error())
	}
	return suggestion, nil
}

// SuggestFoodLogFromVoice runs the two-step voice pipeline (roadmap BE-2.3/2.4):
// STT transcription, then structured extraction into food-log items. Never
// saved to DB directly — the caller (FE) previews it and the user confirms via
// the existing POST /user/food-logs endpoint per item.
func (s *AIGenerateService) SuggestFoodLogFromVoice(ctx context.Context, userID uint, audioFilename string, audioData []byte) (*ai.FoodLogSchema, error) {
	if !s.allow(userID) {
		return nil, ErrAIRateLimited
	}
	if len(audioData) == 0 {
		return nil, ErrAIInvalidInput
	}

	transcript, err := ai.TranscribeAudio(ctx, audioFilename, audioData)
	if err != nil {
		s.persistLog(ctx, userID, "food_log_voice", string(ai.PersonaNutrition), "", nil, err)
		return nil, mapAIGenErr(err)
	}

	userContext := "متن پیاده‌سازی‌شده از صدای کاربر: " + transcript
	log, genRes, genErr := ai.GenerateFoodLog(ctx, userContext)
	s.persistLog(ctx, userID, "food_log_voice", string(ai.PersonaNutrition), userContext, genRes, genErr)
	if genErr != nil {
		return nil, mapAIGenErr(genErr)
	}
	if err := ai.ValidateFoodLog(log); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrAIInvalidPlan, err.Error())
	}
	return log, nil
}

// SuggestSetLogFromVoice runs the two-step voice pipeline for workout sets
// (roadmap BE-3.5): STT transcription, then structured extraction, then a
// server-side PR recheck (AI's is_pr is only a hint). Preview only — the user
// confirms via the existing workout-history LogSession endpoint.
func (s *AIGenerateService) SuggestSetLogFromVoice(ctx context.Context, userID uint, audioFilename string, audioData []byte) (*ai.SetLogSchema, error) {
	if !s.allow(userID) {
		return nil, ErrAIRateLimited
	}
	if len(audioData) == 0 {
		return nil, ErrAIInvalidInput
	}

	transcript, err := ai.TranscribeAudio(ctx, audioFilename, audioData)
	if err != nil {
		s.persistLog(ctx, userID, "set_log_voice", string(ai.PersonaWorkout), "", nil, err)
		return nil, mapAIGenErr(err)
	}

	userContext := "متن پیاده‌سازی‌شده از صدای کاربر: " + transcript
	log, genRes, genErr := ai.GenerateSetLog(ctx, userContext)
	s.persistLog(ctx, userID, "set_log_voice", string(ai.PersonaWorkout), userContext, genRes, genErr)
	if genErr != nil {
		return nil, mapAIGenErr(genErr)
	}
	if err := ai.ValidateSetLog(log); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrAIInvalidPlan, err.Error())
	}

	log.IsPR = s.isNewPersonalRecord(ctx, userID, log.ExerciseName, log.WeightKg)
	return log, nil
}

// isNewPersonalRecord checks the user's prior best for an exercise so the
// voice-log preview shows an accurate PR hint (same rule as markPersonalRecords
// in workout_history_service.go).
func (s *AIGenerateService) isNewPersonalRecord(ctx context.Context, userID uint, exerciseName string, weightKg float64) bool {
	if weightKg <= 0 || s.db == nil {
		return false
	}
	key := strings.ToLower(strings.TrimSpace(exerciseName))
	if key == "" {
		return false
	}
	var maxWeight *float64
	_ = s.db.WithContext(ctx).Model(&models.WorkoutSetLog{}).
		Where("user_id = ? AND LOWER(exercise_name) = ?", userID, key).
		Select("MAX(weight_kg)").Scan(&maxWeight).Error
	return maxWeight == nil || weightKg > *maxWeight
}

func buildIngredientUserContext(ingredients string, calorieMin, calorieMax int) string {
	var b strings.Builder
	b.WriteString("مواد غذایی موجود کاربر: " + strings.TrimSpace(ingredients) + "\n")
	if calorieMin > 0 || calorieMax > 0 {
		b.WriteString(fmt.Sprintf("محدوده کالری مدنظر: %d تا %d کیلوکالری\n", calorieMin, calorieMax))
	}
	b.WriteString("فقط با همین مواد (یا معادل بسیار مشابه ایرانی) یک دستور غذای بداهه پیشنهاد بده.")
	return b.String()
}

// WorkoutPlanResult bundles the AI-generated workout plan with the resulting
// program id when saved (roadmap BE-3.3).
type WorkoutPlanResult struct {
	Plan      *ai.WorkoutPlanSchema `json:"plan"`
	ProgramID uint                  `json:"programId,omitempty"`
}

// WorkoutConstraints carries optional per-request hints from the AI program
// wizard (equipment on hand, training days per week, session length). They
// are NOT persisted to the profile — only used to steer this one generation,
// the same way GenerateNutrition's goal override already works.
type WorkoutConstraints struct {
	Equipment      []string
	DaysPerWeek    int
	SessionMinutes int
}

// GenerateWorkout asks AI for a workout plan and optionally saves it as the
// student's active workout_program (roadmap BE-3.3), mirroring GenerateNutrition.
func (s *AIGenerateService) GenerateWorkout(ctx context.Context, userID uint, save bool, constraints WorkoutConstraints) (*WorkoutPlanResult, error) {
	if !s.allow(userID) {
		return nil, ErrAIRateLimited
	}

	profile, err := s.meService.GetProfile(ctx, userID)
	if err != nil {
		return nil, err
	}
	userContext := buildAIUserContext(profile) + buildWorkoutConstraintsContext(constraints)
	persona := string(ai.PersonaWorkout)

	plan, genRes, genErr := ai.GenerateWorkoutPlan(ctx, userContext)
	s.persistLog(ctx, userID, "workout_plan", persona, userContext, genRes, genErr)

	if genErr != nil {
		return nil, mapAIGenErr(genErr)
	}
	if err := ai.ValidateWorkoutPlan(plan); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrAIInvalidPlan, err.Error())
	}

	result := &WorkoutPlanResult{Plan: plan}
	if save {
		programID, err := s.saveWorkoutProgram(ctx, userID, plan)
		if err != nil {
			return nil, err
		}
		result.ProgramID = programID
	}
	return result, nil
}

// saveWorkoutProgram persists an AI-generated plan as the student's active
// workout_program + program_item rows (roadmap BE-3.3). Requires an active
// coach subscription, same rule as saveNutritionProgram.
func (s *AIGenerateService) saveWorkoutProgram(ctx context.Context, userID uint, plan *ai.WorkoutPlanSchema) (uint, error) {
	sub, err := s.subRepo.FindCurrentByUserID(ctx, userID, time.Now())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, ErrAINoActiveSubscription
		}
		return 0, err
	}

	if err := s.programRepo.DeactivateWorkoutPrograms(ctx, sub.ID); err != nil {
		return 0, err
	}
	maxVersion, err := s.programRepo.MaxWorkoutVersion(ctx, sub.ID)
	if err != nil {
		return 0, err
	}

	program := &models.WorkoutProgram{
		SubscriptionID: sub.ID,
		CoachID:        sub.CoachID,
		Version:        maxVersion + 1,
		Title:          "برنامه تمرینی هوش مصنوعی",
		Notes:          "این برنامه توسط دستیار هوشمند فیتینو تولید شده است.",
		DurationWeeks:  4,
		IsActive:       true,
	}
	if err := s.programRepo.CreateWorkoutProgram(ctx, program); err != nil {
		return 0, err
	}

	items := workoutPlanToItems(plan)
	for i := range items {
		items[i].WorkoutProgramID = program.ID
	}
	if err := s.programRepo.UpsertWorkoutItems(ctx, program.ID, items); err != nil {
		return 0, err
	}
	return program.ID, nil
}

func workoutPlanToItems(plan *ai.WorkoutPlanSchema) []models.ProgramItem {
	items := make([]models.ProgramItem, 0)
	for dayIdx, day := range plan.Days {
		for exIdx, ex := range day.Exercises {
			items = append(items, models.ProgramItem{
				WeekNumber:        1,
				DayNumber:         dayIdx + 1,
				OrderIndex:        exIdx,
				Exercise:          ex.ExerciseName,
				Sets:              ex.Sets,
				Reps:              ex.Reps,
				RestTime:          fmt.Sprintf("%d ثانیه", ex.RestSeconds),
				Notes:             day.DayName,
				WorkoutSystemType: "normal",
			})
		}
	}
	return items
}

var ErrAIInvalidPlan = errors.New("ai plan validation failed")

func mapAIGenErr(err error) error {
	switch {
	case errors.Is(err, ai.ErrNotConfigured):
		return ErrAINotConfigured
	case errors.Is(err, ai.ErrUpstream), errors.Is(err, ai.ErrEmptyResponse):
		return ErrAIUpstream
	case errors.Is(err, ai.ErrUnmarshal):
		return fmt.Errorf("%w: خطا در تبدیل جواب AI", ErrAIUpstream)
	default:
		return err
	}
}

func (s *AIGenerateService) allow(userID uint) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-aiGenRateWindow)
	kept := make([]time.Time, 0, len(s.rates[userID]))
	for _, t := range s.rates[userID] {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}
	if len(kept) >= aiGenRateMaxPerWindow {
		s.rates[userID] = kept
		return false
	}
	s.rates[userID] = append(kept, now)
	return true
}

func (s *AIGenerateService) persistLog(
	ctx context.Context,
	userID uint,
	requestType, persona, input string,
	genRes *ai.GenerateResult,
	genErr error,
) {
	if s.logRepo == nil {
		return
	}
	entry := &models.AIRequestLog{
		UserID:      userID,
		RequestType: requestType,
		Persona:     persona,
		InputText:   truncateRunes(input, aiLogTextMaxRunes),
		Success:     genErr == nil,
		ModelName:   strings.TrimSpace(config.Get().OpenAI.Model),
	}
	if genRes != nil {
		entry.OutputJSON = truncateRunes(string(genRes.RawJSON), aiLogTextMaxRunes)
		entry.LatencyMs = genRes.LatencyMs
		entry.PromptTokens = genRes.PromptTokens
		entry.CompletionTokens = genRes.CompletionTokens
		if genRes.Model != "" {
			entry.ModelName = genRes.Model
		}
	}
	if genErr != nil {
		entry.ErrorMsg = truncateRunes(genErr.Error(), 2000)
	}
	_ = s.logRepo.Create(ctx, entry)
}

func buildAIUserContext(profile *MeProfileDTO) string {
	if profile == nil {
		return "اطلاعات پروفایل در دسترس نیست. یک برنامه متعادل عمومی بساز."
	}
	var b strings.Builder
	b.WriteString("اطلاعات کاربر برای ساخت برنامه:\n")
	name := strings.TrimSpace(profile.FirstName + " " + profile.LastName)
	if name != "" {
		b.WriteString("- نام: " + name + "\n")
	}
	if profile.Gender != "" {
		b.WriteString("- جنسیت: " + profile.Gender + "\n")
	}
	if profile.BirthDate != nil && *profile.BirthDate != "" {
		b.WriteString("- تاریخ تولد: " + *profile.BirthDate + "\n")
	}
	if profile.HeightCm != nil {
		b.WriteString(fmt.Sprintf("- قد: %.0f cm\n", *profile.HeightCm))
	}
	if profile.WeightKg != nil {
		b.WriteString(fmt.Sprintf("- وزن: %.1f kg\n", *profile.WeightKg))
	}
	if profile.TargetWeightKg != nil {
		b.WriteString(fmt.Sprintf("- وزن هدف: %.1f kg\n", *profile.TargetWeightKg))
	}
	if profile.BodyFatPercent != nil {
		b.WriteString(fmt.Sprintf("- درصد چربی بدن: %.1f\n", *profile.BodyFatPercent))
	}
	if profile.PrimaryGoal != "" {
		b.WriteString("- هدف اصلی: " + profile.PrimaryGoal + "\n")
	}
	if len(profile.Goals) > 0 {
		b.WriteString("- اهداف: " + strings.Join(profile.Goals, "، ") + "\n")
	}
	if profile.BodyCondition != "" {
		b.WriteString("- وضعیت بدن: " + profile.BodyCondition + "\n")
	}
	if profile.Injuries != "" {
		b.WriteString("- آسیب‌ها (رعایت احتیاط): " + truncateRunes(profile.Injuries, 300) + "\n")
	}
	if profile.PhysicalLimitations != "" {
		b.WriteString("- محدودیت فیزیکی: " + truncateRunes(profile.PhysicalLimitations, 300) + "\n")
	}
	b.WriteString("یک برنامه واقع‌بینانه و مناسب سبک زندگی ایرانی پیشنهاد بده.")
	return b.String()
}

// buildWorkoutConstraintsContext turns wizard-collected hints into extra
// prompt lines. Empty/zero fields are omitted so a bare {} body behaves
// exactly like before this wizard existed.
func buildWorkoutConstraintsContext(c WorkoutConstraints) string {
	var b strings.Builder
	equipment := make([]string, 0, len(c.Equipment))
	for _, e := range c.Equipment {
		if e = strings.TrimSpace(e); e != "" {
			equipment = append(equipment, e)
		}
	}
	if len(equipment) > 0 {
		b.WriteString("\n- تجهیزات در دسترس کاربر (فقط با همین‌ها برنامه بچین): " + strings.Join(equipment, "، "))
	}
	if c.DaysPerWeek > 0 {
		b.WriteString(fmt.Sprintf("\n- تعداد روزهای تمرین در هفته که کاربر می‌خواهد: دقیقاً %d روز (تعداد آیتم‌های days باید همین باشد)", c.DaysPerWeek))
	}
	if c.SessionMinutes > 0 {
		b.WriteString(fmt.Sprintf("\n- مدت زمان هر جلسه تمرین: حدود %d دقیقه (حجم تمرین هر روز را متناسب با این زمان تنظیم کن)", c.SessionMinutes))
	}
	return b.String()
}

func truncateRunes(s string, max int) string {
	if max <= 0 || utf8.RuneCountInString(s) <= max {
		return s
	}
	runes := []rune(s)
	return string(runes[:max]) + "…"
}
