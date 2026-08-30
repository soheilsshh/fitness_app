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
	Plan           *ai.NutritionPlanSchema `json:"plan"`
	Targets        NutritionTargets        `json:"targets"`
	ProgramID      uint                    `json:"programId,omitempty"`
	SubscriptionID uint                    `json:"subscriptionId,omitempty"`
}

// AIGenerateService orchestrates structured AI generation for phase 0 and,
// starting roadmap phase 1, persists the result into real program tables.
type AIGenerateService struct {
	db             *gorm.DB
	meService      MeService
	logRepo        repository.AIRequestLogRepository
	subRepo        repository.SubscriptionRepository
	programRepo    repository.ProgramRepository
	foodRepo       repository.FoodRepository
	achievementSvc AchievementService
	funnelAIRepo   repository.FunnelAIAnalysisRepository

	mu    sync.Mutex
	rates map[uint][]time.Time

	// mealCache dedupes identical back-to-back "تغییر این وعده" requests
	// (roadmap Phase 5: cache) — a double-click or client retry with the same
	// goal/meal/reason returns the cached meal instead of paying for another
	// AI call. Short TTL only: this is a debounce, not a content cache.
	cacheMu   sync.Mutex
	mealCache map[string]mealCacheEntry
}

type mealCacheEntry struct {
	meal    *ai.MealSchema
	expires time.Time
}

const mealCacheTTL = 45 * time.Second

func NewAIGenerateService(
	db *gorm.DB,
	meService MeService,
	logRepo repository.AIRequestLogRepository,
	subRepo repository.SubscriptionRepository,
	programRepo repository.ProgramRepository,
	foodRepo repository.FoodRepository,
	achievementSvc AchievementService,
	funnelAIRepo repository.FunnelAIAnalysisRepository,
) *AIGenerateService {
	return &AIGenerateService{
		db:             db,
		meService:      meService,
		logRepo:        logRepo,
		subRepo:        subRepo,
		programRepo:    programRepo,
		foodRepo:       foodRepo,
		achievementSvc: achievementSvc,
		funnelAIRepo:   funnelAIRepo,
		rates:          make(map[uint][]time.Time),
		mealCache:      make(map[string]mealCacheEntry),
	}
}

// DailyNutritionCheckIn is the optional same-day questionnaire from the
// "برنامه روزانه با AI" page. It is NOT persisted — it only steers this
// one generation, the same way WorkoutConstraints works for AI workouts.
type DailyNutritionCheckIn struct {
	MealCount      string   `json:"mealCount"`
	Protein        []string `json:"protein"`
	Carbs          []string `json:"carbs"`
	Produce        []string `json:"produce"`
	AvailableExtra []string `json:"availableExtra"`
	Craving        []string `json:"craving"`
	CravingCustom  string   `json:"cravingCustom"`
	Training       string   `json:"training"`
	PrepTime       string   `json:"prepTime"`
	Avoid          []string `json:"avoid"`
	AvoidExtra     []string `json:"avoidExtra"`
	Style          string   `json:"style"`
}

// WeeklyNutritionCheckIn is the optional week-rules questionnaire from the
// "برنامه هفتگی با AI" page. It is NOT persisted — it only steers this one
// generation so the model can pattern the whole week without per-day meals.
type WeeklyNutritionCheckIn struct {
	WeeklyGoal           string   `json:"weeklyGoal"`
	MealCount            string   `json:"mealCount"`
	TrainingDays         []string `json:"trainingDays"`
	TrainingIntensity    string   `json:"trainingIntensity"`
	LikedFoods           []string `json:"likedFoods"`
	FavoriteFood         string   `json:"favoriteFood"`
	Avoid                []string `json:"avoid"`
	AvoidExtra           []string `json:"avoidExtra"`
	Available            []string `json:"available"`
	AvailableExtra       []string `json:"availableExtra"`
	Budget               string   `json:"budget"`
	EatingPlace          string   `json:"eatingPlace"`
	PrepTime             string   `json:"prepTime"`
	RepeatPreference     string   `json:"repeatPreference"`
	SpecialCircumstances string   `json:"specialCircumstances"`
	Style                string   `json:"style"`
}

// GenerateNutrition asks AI for a plan grounded in deterministically-computed
// BMR/TDEE targets (BE-1.1), validates it, and optionally saves it as the
// student's active nutrition_program (BE-1.2). goal defaults to the user's
// PrimaryGoal / "maintain" when empty.
//
// When existingPlan is set (preview already shown in the client), AI is skipped
// and the provided plan is validated and optionally persisted — so a flaky
// second upstream call cannot block save after a successful preview.
func (s *AIGenerateService) GenerateNutrition(ctx context.Context, userID uint, goal string, save bool, existingPlan *ai.NutritionPlanSchema, checkIn DailyNutritionCheckIn, targetCalories int, activate bool) (*NutritionPlanResult, error) {
	var plan *ai.NutritionPlanSchema
	var targets NutritionTargets

	if existingPlan != nil {
		if err := ai.ValidateNutritionPlan(existingPlan); err != nil {
			return nil, fmt.Errorf("%w: %s", ErrAIInvalidPlan, err.Error())
		}
		plan = existingPlan
		targets = nutritionTargetsFromPlan(plan)
	} else {
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
		targets = CalculateNutritionTargets(NutritionCalcInput{
			Gender:         profile.Gender,
			WeightKg:       derefFloat(profile.WeightKg),
			HeightCm:       derefFloat(profile.HeightCm),
			BirthDate:      profile.BirthDate,
			BodyFatPercent: profile.BodyFatPercent,
			Goal:           goal,
			TargetCalories: targetCalories,
		})

		userContext := buildAIUserContext(profile) + s.loadFunnelAIContext(ctx, profile) + fmt.Sprintf(
			"\nهدف تغذیه‌ای انتخاب‌شده: %s\nهدف کالری روزانه محاسبه‌شده (حتماً نزدیک به همین عدد بمان): %d کیلوکالری، پروتئین %dگرم، کربوهیدرات %dگرم، چربی %dگرم.",
			targets.Goal, targets.TargetCalories, targets.ProteinG, targets.CarbsG, targets.FatG,
		) + buildDailyCheckInContext(checkIn)
		persona := string(ai.PersonaNutrition)

		generated, genRes, genErr := ai.GenerateNutritionPlan(ctx, userContext)
		s.persistLog(ctx, userID, "nutrition_plan", persona, userContext, genRes, genErr)

		if genErr != nil {
			return nil, mapAIGenErr(genErr)
		}
		if err := ai.ValidateNutritionPlan(generated); err != nil {
			return nil, fmt.Errorf("%w: %s", ErrAIInvalidPlan, err.Error())
		}
		plan = generated
	}

	result := &NutritionPlanResult{Plan: plan, Targets: targets}
	if save {
		programID, subscriptionID, err := s.saveNutritionProgram(ctx, userID, plan, targets, activate)
		if err != nil {
			return nil, err
		}
		result.ProgramID = programID
		result.SubscriptionID = subscriptionID
	}
	return result, nil
}

// NutritionWeekResult bundles an AI-generated 7-day plan with its
// deterministic targets and (if saved) the resulting program id (roadmap
// Phase 3: برنامه هفتگی).
type NutritionWeekResult struct {
	Plan           *ai.NutritionWeekSchema `json:"plan"`
	Targets        NutritionTargets        `json:"targets"`
	ProgramID      uint                    `json:"programId,omitempty"`
	SubscriptionID uint                    `json:"subscriptionId,omitempty"`
}

// GenerateWeeklyNutrition mirrors GenerateNutrition but produces/saves a
// full 7-day plan instead of a single day. Days are persisted with
// DayNumber 1..7 matching the coach's existing day-of-week convention
// (dayNumberToKey in program_mapper.go), so the coach can review/edit a
// weekly AI plan with the same per-day editor used for coach-authored plans
// — no new coach-side UI needed.
func (s *AIGenerateService) GenerateWeeklyNutrition(ctx context.Context, userID uint, goal string, save bool, existingPlan *ai.NutritionWeekSchema, checkIn WeeklyNutritionCheckIn, targetCalories int) (*NutritionWeekResult, error) {
	var plan *ai.NutritionWeekSchema
	var targets NutritionTargets

	if existingPlan != nil {
		if err := ai.ValidateWeeklyPlan(existingPlan); err != nil {
			return nil, fmt.Errorf("%w: %s", ErrAIInvalidPlan, err.Error())
		}
		plan = existingPlan
		targets = NutritionTargets{
			Goal:           plan.GoalType,
			TargetCalories: plan.TotalCalories,
			ProteinG:       plan.ProteinG,
			CarbsG:         plan.CarbsG,
			FatG:           plan.FatG,
		}
	} else {
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
		targets = CalculateNutritionTargets(NutritionCalcInput{
			Gender:         profile.Gender,
			WeightKg:       derefFloat(profile.WeightKg),
			HeightCm:       derefFloat(profile.HeightCm),
			BirthDate:      profile.BirthDate,
			BodyFatPercent: profile.BodyFatPercent,
			Goal:           goal,
			TargetCalories: targetCalories,
		})

		userContext := buildAIUserContext(profile) + s.loadFunnelAIContext(ctx, profile) + fmt.Sprintf(
			"\nهدف تغذیه‌ای انتخاب‌شده: %s\nهدف کالری روزانه محاسبه‌شده (حتماً هر روز نزدیک به همین عدد بمان): %d کیلوکالری، پروتئین %dگرم، کربوهیدرات %dگرم، چربی %dگرم.",
			targets.Goal, targets.TargetCalories, targets.ProteinG, targets.CarbsG, targets.FatG,
		) + buildWeeklyCheckInContext(checkIn)
		persona := string(ai.PersonaNutrition)

		// Client axios used to abort at 15s while week generation takes ~50s+.
		// Keep the upstream call alive on a detached deadline so a disconnect
		// does not cancel GapGPT mid-response or drop the AI log write.
		aiCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 2*time.Minute)
		defer cancel()
		generated, genRes, genErr := ai.GenerateWeeklyNutritionPlan(aiCtx, userContext)
		s.persistLog(context.WithoutCancel(ctx), userID, "nutrition_week", persona, userContext, genRes, genErr)

		if genErr != nil {
			return nil, mapAIGenErr(genErr)
		}
		if err := ai.ValidateWeeklyPlan(generated); err != nil {
			return nil, fmt.Errorf("%w: %s", ErrAIInvalidPlan, err.Error())
		}
		plan = generated
	}

	result := &NutritionWeekResult{Plan: plan, Targets: targets}
	if save {
		programID, subscriptionID, err := s.saveWeeklyNutritionProgram(ctx, userID, plan, targets)
		if err != nil {
			return nil, err
		}
		result.ProgramID = programID
		result.SubscriptionID = subscriptionID
	}
	return result, nil
}

// saveWeeklyNutritionProgram persists an AI-generated 7-day plan the same way
// saveNutritionProgram does for a single-day one, except items span
// DayNumber 1..7 (one per weekday) instead of all landing on DayNumber 1.
func (s *AIGenerateService) saveWeeklyNutritionProgram(ctx context.Context, userID uint, plan *ai.NutritionWeekSchema, targets NutritionTargets) (programID, subscriptionID uint, err error) {
	sub, err := s.subRepo.FindCurrentByUserID(ctx, userID, time.Now())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, 0, ErrAINoActiveSubscription
		}
		return 0, 0, err
	}

	maxVersion, err := s.programRepo.MaxNutritionVersion(ctx, sub.ID)
	if err != nil {
		return 0, 0, err
	}

	program := &models.NutritionProgram{
		SubscriptionID: sub.ID,
		CoachID:        sub.CoachID,
		Version:        maxVersion + 1,
		Title:          "برنامه غذایی هفتگی هوش مصنوعی",
		Notes:          "این برنامه توسط دستیار هوشمند فیتینو تولید شده است.",
		CaloriesTarget: targets.TargetCalories,
		ProteinTarget:  fmt.Sprintf("%dg", targets.ProteinG),
		Goal:           targets.Goal,
		Source:         models.ProgramSourceAI,
		Status:         models.ProgramStatusDraft,
		DurationWeeks:  4,
		IsActive:       false,
	}
	if err := s.programRepo.CreateNutritionProgram(ctx, program); err != nil {
		return 0, 0, err
	}

	items := nutritionWeekToItems(plan)
	for i := range items {
		items[i].NutritionProgramID = program.ID
	}
	if err := s.programRepo.UpsertNutritionItems(ctx, program.ID, items); err != nil {
		return 0, 0, err
	}
	if s.achievementSvc != nil {
		s.achievementSvc.HandleAIProgramSaved(ctx, userID, "nutrition")
	}
	return program.ID, sub.ID, nil
}

var persianDayNameToNumber = map[string]int{
	"شنبه": 1, "یکشنبه": 2, "دوشنبه": 3,
	"سه شنبه": 4, "سه‌شنبه": 4,
	"چهارشنبه": 5,
	"پنج شنبه": 6, "پنجشنبه": 6, "پنج‌شنبه": 6,
	"جمعه": 7,
}

func nutritionWeekToItems(plan *ai.NutritionWeekSchema) []models.NutritionItem {
	items := make([]models.NutritionItem, 0)
	for dayIdx, day := range plan.Days {
		dayNum, ok := persianDayNameToNumber[strings.TrimSpace(day.DayName)]
		if !ok || dayNum < 1 || dayNum > 7 {
			dayNum = dayIdx + 1
			if dayNum > 7 {
				dayNum = 7
			}
		}
		snackCount := 0
		for mealIdx, meal := range day.Meals {
			slot := NormalizeMealSlot(meal.Name, &snackCount)
			for itemIdx, food := range meal.Items {
				items = append(items, models.NutritionItem{
					DayNumber:  dayNum,
					MealNumber: mealIdx + 1,
					OrderIndex: itemIdx,
					MealSlot:   slot,
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
	}
	return items
}

func nutritionTargetsFromPlan(plan *ai.NutritionPlanSchema) NutritionTargets {
	return NutritionTargets{
		Goal:           plan.GoalType,
		TargetCalories: plan.TotalCalories,
		ProteinG:       plan.ProteinG,
		CarbsG:         plan.CarbsG,
		FatG:           plan.FatG,
	}
}

// saveNutritionProgram persists an AI-generated plan as the student's active
// nutrition_program + nutrition_item rows (roadmap BE-1.2). Requires an active
// coach subscription, mirroring the coach-authored program flow.
func (s *AIGenerateService) saveNutritionProgram(ctx context.Context, userID uint, plan *ai.NutritionPlanSchema, targets NutritionTargets, activate bool) (programID, subscriptionID uint, err error) {
	sub, err := s.subRepo.FindCurrentByUserID(ctx, userID, time.Now())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, 0, ErrAINoActiveSubscription
		}
		return 0, 0, err
	}

	maxVersion, err := s.programRepo.MaxNutritionVersion(ctx, sub.ID)
	if err != nil {
		return 0, 0, err
	}

	// AI-generated plans join the student's inactive pool instead of taking
	// over as the active program — the student picks which one to activate
	// (POST /me/nutrition-programs/:id/activate). This does NOT touch whatever
	// is currently active for the subscription.
	program := &models.NutritionProgram{
		SubscriptionID: sub.ID,
		CoachID:        sub.CoachID,
		Version:        maxVersion + 1,
		Title:          "برنامه غذایی هوش مصنوعی",
		Notes:          "این برنامه توسط دستیار هوشمند فیتینو تولید شده است.",
		CaloriesTarget: targets.TargetCalories,
		ProteinTarget:  fmt.Sprintf("%dg", targets.ProteinG),
		Goal:           targets.Goal,
		Source:         models.ProgramSourceAI,
		Status:         models.ProgramStatusDraft,
		DurationWeeks:  4,
		IsActive:       false,
	}
	if activate {
		program.Status = models.ProgramStatusOfficial
	}
	if err := s.programRepo.CreateNutritionProgram(ctx, program); err != nil {
		return 0, 0, err
	}

	items := nutritionPlanToItems(plan)
	for i := range items {
		items[i].NutritionProgramID = program.ID
	}
	if err := s.programRepo.UpsertNutritionItems(ctx, program.ID, items); err != nil {
		return 0, 0, err
	}
	if activate {
		if err := s.programRepo.SetNutritionProgramActive(ctx, program.ID, true); err != nil {
			return 0, 0, err
		}
	}
	if s.achievementSvc != nil {
		s.achievementSvc.HandleAIProgramSaved(ctx, userID, "nutrition")
	}
	return program.ID, sub.ID, nil
}

func nutritionPlanToItems(plan *ai.NutritionPlanSchema) []models.NutritionItem {
	items := make([]models.NutritionItem, 0)
	snackCount := 0
	for mealIdx, meal := range plan.Meals {
		slot := NormalizeMealSlot(meal.Name, &snackCount)
		for itemIdx, food := range meal.Items {
			items = append(items, models.NutritionItem{
				DayNumber:  1,
				MealNumber: mealIdx + 1,
				OrderIndex: itemIdx,
				MealSlot:   slot,
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
// ingredients the user currently has (roadmap BE-1.9, extended in Phase 1 of
// the standalone "تک‌غذا" flow with an optional goal + free-text preferences).
// Never saved to DB.
func (s *AIGenerateService) SuggestFromIngredients(ctx context.Context, userID uint, ingredients, goal, preferences string, calorieMin, calorieMax int) (*ai.IngredientSuggestionSchema, error) {
	if !s.allow(userID) {
		return nil, ErrAIRateLimited
	}
	if strings.TrimSpace(ingredients) == "" && strings.TrimSpace(preferences) == "" {
		return nil, ErrAIInvalidInput
	}

	userContext := buildIngredientUserContext(ingredients, goal, preferences, calorieMin, calorieMax)
	persona := string(ai.PersonaNutrition)

	suggestion, genRes, genErr := ai.GenerateIngredientSuggestion(ctx, userContext)
	s.persistLog(ctx, userID, "ingredient_suggestion", persona, userContext, genRes, genErr)

	if genErr != nil {
		return nil, mapAIGenErr(genErr)
	}
	if err := ai.ValidateIngredientSuggestion(suggestion); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrAIInvalidPlan, err.Error())
	}

	// AI is never the sole source of truth for amounts: reconcile calories/macros
	// against the food catalog where a confident name match exists, so numbers
	// come from real nutrition data rather than an LLM guess whenever possible.
	suggestion.Items = s.reconcileFoodItemsWithCatalog(ctx, suggestion.Items)
	return suggestion, nil
}

func (s *AIGenerateService) ListTodayNutritionSlots(ctx context.Context, userID uint) (*TodayNutritionSlotsResult, error) {
	dayNum := persianDayNumberNow()
	result := &TodayNutritionSlotsResult{
		HasProgram: false,
		DayNumber:  dayNum,
		Slots:      emptyTodaySlots(),
	}
	sub, err := s.subRepo.FindCurrentByUserID(ctx, userID, time.Now())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return result, nil
		}
		return nil, err
	}
	program, err := s.programRepo.FindActiveNutritionBySubscriptionID(ctx, sub.ID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if program == nil {
		return result, nil
	}
	items, err := s.programRepo.FindNutritionItemsByProgramID(ctx, program.ID)
	if err != nil {
		return nil, err
	}
	result.HasProgram = true
	result.Slots = groupTodayMealSlots(items, dayNum)
	return result, nil
}

// ApplyIngredientSuggestion replaces one meal slot on today's active nutrition
// program with the generated recipe. If none is active, it creates and activates
// a small program that only contains that slot.
func (s *AIGenerateService) ApplyIngredientSuggestion(ctx context.Context, userID uint, suggestion *ai.IngredientSuggestionSchema, replaceSlot string) error {
	if suggestion == nil || !IsValidMealSlot(replaceSlot) {
		return ErrAIInvalidInput
	}
	if err := ai.ValidateIngredientSuggestion(suggestion); err != nil {
		return fmt.Errorf("%w: %s", ErrAIInvalidPlan, err.Error())
	}
	sub, err := s.subRepo.FindCurrentByUserID(ctx, userID, time.Now())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrAINoActiveSubscription
		}
		return err
	}

	program, err := s.programRepo.FindActiveNutritionBySubscriptionID(ctx, sub.ID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	dayNum := persianDayNumberNow()
	newItems := suggestionToNutritionItems(suggestion, dayNum, replaceSlot)

	if program == nil {
		maxVersion, verr := s.programRepo.MaxNutritionVersion(ctx, sub.ID)
		if verr != nil {
			return verr
		}
		program = &models.NutritionProgram{
			SubscriptionID: sub.ID,
			CoachID:        sub.CoachID,
			Version:        maxVersion + 1,
			Title:          "وعده هوش مصنوعی",
			Notes:          "این وعده توسط دستیار هوشمند فیتینو به برنامه اضافه شد.",
			CaloriesTarget: suggestion.TotalCalories,
			Goal:           ai.GoalMaintain,
			Source:         models.ProgramSourceAI,
			Status:         models.ProgramStatusOfficial,
			DurationWeeks:  4,
			IsActive:       false,
		}
		if err := s.programRepo.CreateNutritionProgram(ctx, program); err != nil {
			return err
		}
		for i := range newItems {
			newItems[i].NutritionProgramID = program.ID
			newItems[i].MealNumber = 1
		}
		if err := s.programRepo.UpsertNutritionItems(ctx, program.ID, newItems); err != nil {
			return err
		}
		return s.programRepo.SetNutritionProgramActive(ctx, program.ID, true)
	}

	existing, err := s.programRepo.FindNutritionItemsByProgramID(ctx, program.ID)
	if err != nil {
		return err
	}
	merged := replaceNutritionSlot(existing, dayNum, replaceSlot, newItems)
	for i := range merged {
		merged[i].NutritionProgramID = program.ID
	}
	return s.programRepo.UpsertNutritionItems(ctx, program.ID, merged)
}

func persianDayNumberNow() int {
	return (int(time.Now().Weekday())-int(time.Saturday)+7)%7 + 1
}

// RegenerateMeal produces a single replacement meal ("تغییر این وعده") without
// regenerating the rest of the plan — the client sends back only the changed
// meal and keeps everything else it already has. Never saved to DB directly;
// like GenerateNutrition/SuggestFromIngredients the caller re-submits the full
// plan (with this meal swapped in) via GenerateNutrition's existingPlan path
// if/when it wants to persist.
func (s *AIGenerateService) RegenerateMeal(ctx context.Context, userID uint, goal, mealName string, targetCalories int, reason string) (*ai.MealSchema, error) {
	if strings.TrimSpace(mealName) == "" {
		return nil, ErrAIInvalidInput
	}

	cacheKey := fmt.Sprintf("%d|%s|%s|%d|%s", userID, goal, mealName, targetCalories, reason)
	if cached := s.getCachedMeal(cacheKey); cached != nil {
		return cached, nil
	}

	if !s.allow(userID) {
		return nil, ErrAIRateLimited
	}

	userContext := buildMealRegenerateContext(goal, mealName, targetCalories, reason)
	persona := string(ai.PersonaNutrition)

	meal, genRes, genErr := ai.GenerateMealReplacement(ctx, userContext)
	s.persistLog(ctx, userID, "meal_replacement", persona, userContext, genRes, genErr)

	if genErr != nil {
		return nil, mapAIGenErr(genErr)
	}
	if err := ai.ValidateMeal(meal); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrAIInvalidPlan, err.Error())
	}

	meal.Items = s.reconcileFoodItemsWithCatalog(ctx, meal.Items)
	s.setCachedMeal(cacheKey, meal)
	return meal, nil
}

func (s *AIGenerateService) getCachedMeal(key string) *ai.MealSchema {
	s.cacheMu.Lock()
	defer s.cacheMu.Unlock()
	entry, ok := s.mealCache[key]
	if !ok || time.Now().After(entry.expires) {
		delete(s.mealCache, key)
		return nil
	}
	return entry.meal
}

func (s *AIGenerateService) setCachedMeal(key string, meal *ai.MealSchema) {
	s.cacheMu.Lock()
	defer s.cacheMu.Unlock()
	s.mealCache[key] = mealCacheEntry{meal: meal, expires: time.Now().Add(mealCacheTTL)}
}

func buildMealRegenerateContext(goal, mealName string, targetCalories int, reason string) string {
	var b strings.Builder
	b.WriteString("وعده‌ای که باید جایگزین شود: " + strings.TrimSpace(mealName) + "\n")
	if strings.TrimSpace(goal) != "" {
		b.WriteString("هدف کلی برنامه غذایی: " + strings.TrimSpace(goal) + "\n")
	}
	if targetCalories > 0 {
		b.WriteString(fmt.Sprintf("کالری هدف برای همین وعده (تا حد امکان نزدیک بمان): %d کیلوکالری\n", targetCalories))
	}
	if strings.TrimSpace(reason) != "" {
		b.WriteString("دلیل درخواست تغییر (حتماً رعایت شود): " + strings.TrimSpace(reason) + "\n")
	}
	b.WriteString("فقط همین یک وعده را جایگزین کن، وعده‌های دیگر برنامه را نادیده بگیر.")
	return b.String()
}

// UsageSummary aggregates ai_request_log rows for the admin usage dashboard
// (roadmap Phase 5: token tracking) — grouped by request type + prompt
// version so cost/volume can be tied back to a specific prompt revision.
func (s *AIGenerateService) UsageSummary(ctx context.Context, days int) ([]repository.AIUsageSummaryRow, error) {
	if days <= 0 {
		days = 30
	}
	since := time.Now().AddDate(0, 0, -days)
	return s.logRepo.Summary(ctx, since)
}

// TranscribeOnly converts a voice note to raw Persian text without any
// structured extraction (Voice → STT → متن, step 1 only). The caller (e.g. the
// single-meal free-text field) is responsible for feeding the transcript into
// whichever structured generator it needs next — this keeps voice input decoupled
// from any one downstream schema.
func (s *AIGenerateService) TranscribeOnly(ctx context.Context, userID uint, audioFilename string, audioData []byte) (string, error) {
	if !s.allow(userID) {
		return "", ErrAIRateLimited
	}
	if len(audioData) == 0 {
		return "", ErrAIInvalidInput
	}
	transcript, err := ai.TranscribeAudio(ctx, audioFilename, audioData)
	s.persistLog(ctx, userID, "transcribe_only", string(ai.PersonaGeneral), "", nil, err)
	if err != nil {
		return "", mapAIGenErr(err)
	}
	return transcript, nil
}

// reconcileFoodItemsWithCatalog looks up each AI-suggested food item by name in
// the real food catalog (backend/internal/models/food.go). When a confident
// match is found, calories/protein/carbs/fat for that item are recomputed from
// the catalog's per-100g values scaled to amount_g — overriding the AI's guess.
// Unmatched items keep the AI's numbers as a fallback since the Persian food
// catalog is not exhaustive.
func (s *AIGenerateService) reconcileFoodItemsWithCatalog(ctx context.Context, items []ai.FoodItem) []ai.FoodItem {
	if s.foodRepo == nil {
		return items
	}
	for i := range items {
		name := strings.TrimSpace(items[i].FoodName)
		if name == "" {
			continue
		}
		matches, _, err := s.foodRepo.Search(ctx, name, 1, 1)
		if err != nil || len(matches) == 0 {
			continue
		}
		food := matches[0]
		if !strings.EqualFold(strings.TrimSpace(food.Name), name) {
			continue // only trust an exact (case-insensitive) name match, not a fuzzy LIKE hit
		}
		scale := items[i].AmountG / 100
		items[i].Calories = int(food.Calories * scale)
		items[i].ProteinG = round1(food.Protein * scale)
		items[i].CarbsG = round1(food.Carbs * scale)
		items[i].FatG = round1(food.Fat * scale)
	}
	return items
}

func (s *AIGenerateService) hydrateVoiceItemsFromCatalog(ctx context.Context, items []ai.FoodItem) []ai.FoodItem {
	if s.foodRepo == nil {
		return s.reconcileFoodItemsWithCatalog(ctx, items)
	}
	for i := range items {
		id := strings.TrimSpace(items[i].FoodID)
		if id == "" {
			continue
		}
		food, err := s.foodRepo.FindByExternalID(ctx, id)
		if err != nil {
			continue
		}
		full, err := s.foodRepo.FindByID(ctx, food.ID)
		if err != nil {
			full = food
		}
		grams := items[i].AmountG
		if grams <= 0 {
			if g, ok := gramsFromVoiceUnit(full, items[i].VoiceUnit, items[i].VoiceQty); ok {
				grams = g
			}
		}
		if grams <= 0 {
			continue
		}
		facts := scaleFoodByGrams(full, grams)
		items[i].FoodName = full.Name
		items[i].AmountG = facts.Grams
		items[i].Calories = int(facts.Calories + 0.5)
		items[i].ProteinG = round1(facts.Protein)
		items[i].CarbsG = round1(facts.Carbs)
		items[i].FatG = round1(facts.Fat)
	}
	return items
}

// SuggestFoodLogFromVoice runs Whisper catalog extraction then Gemini JSON
// referee (PIPELINE layer 9) and returns a preview. Never saved to DB directly.
func (s *AIGenerateService) SuggestFoodLogFromVoice(ctx context.Context, userID uint, audioFilename string, audioData []byte) (*ai.FoodLogSchema, error) {
	if !s.allow(userID) {
		return nil, ErrAIRateLimited
	}
	if len(audioData) == 0 {
		return nil, ErrAIInvalidInput
	}

	log, genRes, err := ai.LogMealFromVoice(ctx, audioFilename, audioData)
	userContext := ""
	if log != nil {
		userContext = log.Transcript
	}
	s.persistLog(ctx, userID, "food_log_voice", string(ai.PersonaNutrition), userContext, genRes, err)
	if err != nil {
		return nil, mapAIGenErr(err)
	}
	log.Items = s.hydrateVoiceItemsFromCatalog(ctx, log.Items)
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

func buildIngredientUserContext(ingredients, goal, preferences string, calorieMin, calorieMax int) string {
	var b strings.Builder
	if strings.TrimSpace(ingredients) != "" {
		b.WriteString("مواد غذایی موجود کاربر: " + strings.TrimSpace(ingredients) + "\n")
	}
	if strings.TrimSpace(goal) != "" {
		b.WriteString("هدف این غذا: " + strings.TrimSpace(goal) + "\n")
	}
	if strings.TrimSpace(preferences) != "" {
		b.WriteString("محدودیت‌ها/ترجیحات کاربر (متن آزاد): " + strings.TrimSpace(preferences) + "\n")
	}
	if calorieMin > 0 || calorieMax > 0 {
		b.WriteString(fmt.Sprintf("محدوده کالری مدنظر: %d تا %d کیلوکالری\n", calorieMin, calorieMax))
	}
	b.WriteString("فقط با مواد اعلام‌شده (یا معادل بسیار مشابه ایرانی) و با رعایت محدودیت‌های گفته‌شده یک دستور غذای بداهه پیشنهاد بده.")
	return b.String()
}

// WorkoutPlanResult bundles the AI-generated workout plan with the resulting
// program id when saved (roadmap BE-3.3).
type WorkoutPlanResult struct {
	Plan           *ai.WorkoutPlanSchema `json:"plan"`
	ProgramID      uint                  `json:"programId,omitempty"`
	SubscriptionID uint                  `json:"subscriptionId,omitempty"`
}

// WorkoutConstraints carries optional per-request hints from the AI program
// wizard (equipment on hand, training days per week, session length). They
// are NOT persisted to the profile — only used to steer this one generation,
// the same way GenerateNutrition's goal override already works.
type WorkoutConstraints struct {
	Goal                string
	Equipment           []string
	DaysPerWeek         int
	SessionMinutes      int
	ExperienceLevel     string
	TrainingHistory     string
	TrainingLocation    string
	PhysicalLimitations []string
	LimitationNote      string
	DislikedExercises   []string
	DislikedNote        string
	PreferredStyle      string
	CardioPreference    string
	BodyPartPriority    []string
	VoiceNotes          string
}

// GenerateWorkout asks AI for a workout plan and optionally saves it as the
// student's active workout_program (roadmap BE-3.3), mirroring GenerateNutrition.
//
// When existingPlan is set, AI is skipped and the previewed plan is persisted
// directly — avoiding a second upstream call on save.
func (s *AIGenerateService) GenerateWorkout(ctx context.Context, userID uint, save bool, constraints WorkoutConstraints, existingPlan *ai.WorkoutPlanSchema) (*WorkoutPlanResult, error) {
	var plan *ai.WorkoutPlanSchema

	if existingPlan != nil {
		if err := ai.ValidateWorkoutPlan(existingPlan); err != nil {
			return nil, fmt.Errorf("%w: %s", ErrAIInvalidPlan, err.Error())
		}
		plan = existingPlan
	} else {
		if !s.allow(userID) {
			return nil, ErrAIRateLimited
		}

		profile, err := s.meService.GetProfile(ctx, userID)
		if err != nil {
			return nil, err
		}
		userContext := buildAIUserContext(profile) + s.loadFunnelAIContext(ctx, profile) + buildWorkoutConstraintsContext(constraints)
		persona := string(ai.PersonaWorkout)

		generated, genRes, genErr := ai.GenerateWorkoutPlan(ctx, userContext)
		s.persistLog(ctx, userID, "workout_plan", persona, userContext, genRes, genErr)

		if genErr != nil {
			return nil, mapAIGenErr(genErr)
		}
		if err := ai.ValidateWorkoutPlan(generated); err != nil {
			return nil, fmt.Errorf("%w: %s", ErrAIInvalidPlan, err.Error())
		}
		plan = generated
	}

	result := &WorkoutPlanResult{Plan: plan}
	if save {
		programID, subscriptionID, err := s.saveWorkoutProgram(ctx, userID, plan)
		if err != nil {
			return nil, err
		}
		result.ProgramID = programID
		result.SubscriptionID = subscriptionID
	}
	return result, nil
}

// saveWorkoutProgram persists an AI-generated plan as the student's active
// workout_program + program_item rows (roadmap BE-3.3). Requires an active
// coach subscription, same rule as saveNutritionProgram.
func (s *AIGenerateService) saveWorkoutProgram(ctx context.Context, userID uint, plan *ai.WorkoutPlanSchema) (programID, subscriptionID uint, err error) {
	sub, err := s.subRepo.FindCurrentByUserID(ctx, userID, time.Now())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, 0, ErrAINoActiveSubscription
		}
		return 0, 0, err
	}

	maxVersion, err := s.programRepo.MaxWorkoutVersion(ctx, sub.ID)
	if err != nil {
		return 0, 0, err
	}

	// AI-generated plans join the student's inactive pool instead of taking
	// over as the active program — the student picks which one to activate
	// (POST /me/workout-programs/:id/activate). This does NOT touch whatever
	// is currently active for the subscription.
	program := &models.WorkoutProgram{
		SubscriptionID: sub.ID,
		CoachID:        sub.CoachID,
		Version:        maxVersion + 1,
		Title:          "برنامه تمرینی هوش مصنوعی",
		Notes:          "این برنامه توسط دستیار هوشمند فیتینو تولید شده است.",
		Source:         models.ProgramSourceAI,
		Status:         models.ProgramStatusOfficial,
		DurationWeeks:  4,
		IsActive:       false,
	}
	if err := s.programRepo.CreateWorkoutProgram(ctx, program); err != nil {
		return 0, 0, err
	}

	items := workoutPlanToItems(plan)
	for i := range items {
		items[i].WorkoutProgramID = program.ID
	}
	if err := s.programRepo.UpsertWorkoutItems(ctx, program.ID, items); err != nil {
		return 0, 0, err
	}
	if s.achievementSvc != nil {
		s.achievementSvc.HandleAIProgramSaved(ctx, userID, "workout")
	}
	return program.ID, sub.ID, nil
}

func workoutPlanToItems(plan *ai.WorkoutPlanSchema) []models.ProgramItem {
	items := make([]models.ProgramItem, 0)
	for dayIdx, day := range plan.Days {
		for exIdx, ex := range day.Exercises {
			items = append(items, models.ProgramItem{
				WeekNumber: 1,
				DayNumber:  dayIdx + 1,
				OrderIndex: exIdx,
				Exercise:   ex.ExerciseName,
				// AI plans (home workouts especially) name movements freely and
				// are never linked to the catalog, so the muscle group is
				// classified from the name. Without it these programs would
				// produce set logs that no personal-record filter can find.
				MuscleGroup:       ClassifyMuscleGroup(ex.ExerciseName, ""),
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
		UserID:        userID,
		RequestType:   requestType,
		Persona:       persona,
		PromptVersion: ai.PromptVersion,
		InputText:     truncateRunes(input, aiLogTextMaxRunes),
		Success:       genErr == nil,
		ModelName:     strings.TrimSpace(config.Get().OpenAI.Model),
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

// loadFunnelAIContext appends the latest /analysis funnel AI packet for this
// phone/user so nutrition & workout generators stay aligned with the sales-funnel analysis.
func (s *AIGenerateService) loadFunnelAIContext(ctx context.Context, profile *MeProfileDTO) string {
	if s == nil || s.funnelAIRepo == nil || profile == nil {
		return ""
	}
	var row *models.FunnelAIAnalysis
	var err error
	if phone := strings.TrimSpace(profile.Phone); phone != "" {
		row, err = s.funnelAIRepo.FindLatestByPhone(ctx, phone)
	}
	if (err != nil || row == nil) && profile.ID > 0 {
		row, err = s.funnelAIRepo.FindLatestByUserID(ctx, profile.ID)
	}
	if err != nil || row == nil {
		return ""
	}

	var b strings.Builder
	b.WriteString("\n\nتحلیل اختصاصی فانل /analysis فیتینو (منبع حقیقت — برنامه را با این هم‌راستا کن):\n")
	if row.Gender != "" {
		b.WriteString("- جنسیت فانل: " + row.Gender + "\n")
	}
	if row.PrimaryGoal != "" {
		b.WriteString("- هدف فانل: " + row.PrimaryGoal + "\n")
	}
	if row.ActivityLevel != "" {
		b.WriteString("- فعالیت روزانه: " + row.ActivityLevel + "\n")
	}
	if row.TrainingFrequency != "" {
		b.WriteString("- تعداد جلسات ورزش: " + row.TrainingFrequency + "\n")
	}
	if row.Experience != "" {
		b.WriteString("- سطح آمادگی: " + row.Experience + "\n")
	}
	if row.NutritionChallenge != "" {
		b.WriteString("- وضعیت تغذیه: " + row.NutritionChallenge + "\n")
	}
	if row.SleepHours != "" {
		b.WriteString("- خواب: " + row.SleepHours + "\n")
	}
	if row.StressLevel != "" {
		b.WriteString("- استرس: " + row.StressLevel + "\n")
	}
	if row.Commitment != "" {
		b.WriteString("- تعهد اجرایی: " + row.Commitment + "\n")
	}
	if row.Age > 0 {
		b.WriteString(fmt.Sprintf("- سن فانل: %d\n", row.Age))
	}
	if row.HeightCm > 0 {
		b.WriteString(fmt.Sprintf("- قد فانل: %.0f cm\n", row.HeightCm))
	}
	if row.WeightKg > 0 {
		b.WriteString(fmt.Sprintf("- وزن فانل: %.1f kg\n", row.WeightKg))
	}
	if row.SuccessPct > 0 {
		b.WriteString(fmt.Sprintf("- شاخص موفقیت پیش‌بینی‌شده: %d٪\n", row.SuccessPct))
	}
	if tw := strings.TrimSpace(row.AIWarning); tw != "" {
		b.WriteString("- هشدار AI: " + truncateRunes(tw, 400) + "\n")
	}
	if tw := strings.TrimSpace(row.StatusSummary); tw != "" {
		b.WriteString("- خلاصه وضعیت: " + truncateRunes(tw, 500) + "\n")
	}
	if tw := strings.TrimSpace(row.CustomSolution); tw != "" {
		b.WriteString("- راهکار اختصاصی: " + truncateRunes(tw, 500) + "\n")
	}
	if tw := strings.TrimSpace(row.RoutePrediction); tw != "" {
		b.WriteString("- پیش‌بینی مسیر: " + truncateRunes(tw, 400) + "\n")
	}
	b.WriteString("شدت، حجم و تغذیه برنامه را متناسب با تعهد و موانع بالا تنظیم کن.")
	return b.String()
}

// buildWorkoutConstraintsContext turns wizard-collected hints into extra
// prompt lines. Empty/zero fields are omitted so a bare {} body behaves
// exactly like before this wizard existed.
func buildWorkoutConstraintsContext(c WorkoutConstraints) string {
	var b strings.Builder
	write := func(label, value string) {
		value = strings.TrimSpace(value)
		if value == "" {
			return
		}
		b.WriteString("\n- " + label + ": " + truncateRunes(value, 400))
	}
	writeList := func(label string, items []string) {
		cleaned := cleanPromptList(items)
		if len(cleaned) == 0 {
			return
		}
		b.WriteString("\n- " + label + ": " + strings.Join(cleaned, "، "))
	}

	write("هدف تمرینی", c.Goal)
	writeList("تجهیزات در دسترس (فقط با همین‌ها برنامه بچین)", c.Equipment)
	if c.DaysPerWeek > 0 {
		b.WriteString(fmt.Sprintf("\n- تعداد روزهای تمرین در هفته که کاربر می‌خواهد: دقیقاً %d روز (تعداد آیتم‌های days باید همین باشد)", c.DaysPerWeek))
	}
	if c.SessionMinutes > 0 {
		b.WriteString(fmt.Sprintf("\n- مدت زمان هر جلسه تمرین: حدود %d دقیقه (حجم تمرین هر روز را متناسب با این زمان تنظیم کن)", c.SessionMinutes))
	}
	write("سطح تمرین", c.ExperienceLevel)
	write("سابقه تمرین منظم", c.TrainingHistory)
	write("محل تمرین", c.TrainingLocation)
	writeList("محدودیت حرکتی / ناحیه حساس", c.PhysicalLimitations)
	write("توضیح محدودیت", c.LimitationNote)
	writeList("حرکاتی که نباید در برنامه باشد", c.DislikedExercises)
	write("توضیح حرکات نامطلوب", c.DislikedNote)
	write("سبک تمرین مورد علاقه", c.PreferredStyle)
	write("ترجیح هوازی", c.CardioPreference)
	writeList("اولویت بخش‌های بدن", c.BodyPartPriority)
	write("توضیح صوتی/متنی اضافه کاربر", c.VoiceNotes)

	if b.Len() == 0 {
		return ""
	}
	return "\nپروفایل تمرینی ویزارد (اطلاعات پایه سن/قد/وزن از پروفایل جداگانه آمده؛ این‌ها را حتماً رعایت کن). محدودیت جسمی فقط برای شخصی‌سازی است و برنامه جایگزین ارزیابی پزشکی نیست:" + b.String()
}

// buildDailyCheckInContext turns the daily nutrition questionnaire into extra
// prompt lines. Empty fields are omitted so a bare {} body behaves exactly
// like before this check-in existed (mobile clients included).
func buildDailyCheckInContext(c DailyNutritionCheckIn) string {
	var b strings.Builder
	wrote := false
	write := func(label, value string) {
		value = strings.TrimSpace(value)
		if value == "" {
			return
		}
		wrote = true
		b.WriteString("\n- " + label + ": " + truncateRunes(value, 200))
	}
	writeList := func(label string, items []string) {
		cleaned := cleanPromptList(items)
		if len(cleaned) == 0 {
			return
		}
		wrote = true
		b.WriteString("\n- " + label + ": " + strings.Join(cleaned, "، "))
	}

	write("تعداد وعده امروز", c.MealCount)
	if n := mealCountFromCheckIn(c.MealCount); n > 0 {
		b.WriteString(fmt.Sprintf(" (آرایه meals باید دقیقاً %d عضو داشته باشد)", n))
	}
	writeList("پروتئین در دسترس", c.Protein)
	writeList("کربوهیدرات در دسترس", c.Carbs)
	writeList("سبزیجات و میوه در دسترس", c.Produce)
	writeList("مواد غذایی اضافه‌شده", c.AvailableExtra)
	writeList("هوس امروز", c.Craving)
	write("غذای دلخواه", c.CravingCustom)
	write("تمرین امروز", c.Training)
	write("وقت آماده‌سازی غذا", c.PrepTime)
	writeList("نمی‌خواهد بخورد", c.Avoid)
	writeList("غذاهای اضافه‌ای که نمی‌خواهد", c.AvoidExtra)
	write("سبک برنامه امروز", c.Style)

	if !wrote {
		return ""
	}
	return "\nچک‌این روزانه تغذیه (فقط برای همین امروز؛ این ترجیحات را حتماً در برنامه رعایت کن):" + b.String()
}

// buildWeeklyCheckInContext turns the weekly nutrition questionnaire into extra
// prompt lines. Empty fields are omitted so a bare {} body behaves exactly
// like before this check-in existed (mobile clients included).
func buildWeeklyCheckInContext(c WeeklyNutritionCheckIn) string {
	var b strings.Builder
	wrote := false
	write := func(label, value string) {
		value = strings.TrimSpace(value)
		if value == "" {
			return
		}
		wrote = true
		b.WriteString("\n- " + label + ": " + truncateRunes(value, 400))
	}
	writeList := func(label string, items []string) {
		cleaned := cleanPromptList(items)
		if len(cleaned) == 0 {
			return
		}
		wrote = true
		b.WriteString("\n- " + label + ": " + strings.Join(cleaned, "، "))
	}

	write("هدف این هفته (نیت کاربر)", c.WeeklyGoal)
	write("تعداد وعده در روز", c.MealCount)
	if n := mealCountFromCheckIn(c.MealCount); n > 0 {
		b.WriteString(fmt.Sprintf(" (هر روز آرایه meals باید دقیقاً %d عضو داشته باشد)", n))
	} else if strings.Contains(strings.TrimSpace(c.MealCount), "متغیر") {
		wrote = true
		b.WriteString(" (تعداد وعده را خودت بر اساس وقت آشپزی، محل غذا و تمرین هر روز بین ۳ تا ۶ تعیین کن)")
	}
	writeList("روزهای تمرین", c.TrainingDays)
	write("شدت تمرین هفته", c.TrainingIntensity)
	writeList("سبک غذاهای مورد علاقه", c.LikedFoods)
	write("غذای موردعلاقه", c.FavoriteFood)
	writeList("نمی‌خواهد بخورد", c.Avoid)
	writeList("غذاهای اضافه‌ای که نمی‌خواهد", c.AvoidExtra)
	writeList("مواد غذایی معمولاً در دسترس", c.Available)
	writeList("مواد غذایی اضافه‌شده", c.AvailableExtra)
	write("بودجه خرید", c.Budget)
	write("محل غذا خوردن", c.EatingPlace)
	write("وقت آشپزی", c.PrepTime)
	write("ترجیح تکرار غذا در هفته", c.RepeatPreference)
	write("شرایط خاص این هفته", c.SpecialCircumstances)
	write("سبک برنامه هفتگی", c.Style)

	if !wrote {
		return ""
	}
	return "\nچک‌این هفتگی تغذیه (قواعد کل هفته؛ وعدهٔ تک‌تک روزها را از کاربر نپرسیده‌ایم — خودت الگوی ۷ روز را از این قواعد بساز." +
		" روزهای تمرین را پرحجم‌تر و روزهای استراحت را سبک‌تر بچین." +
		" شرایط خاص همان روز را حتماً override کن." +
		" محل غذا خوردن را در پیچیدگی وعده رعایت کن؛ محل کار/دانشگاه یعنی غذای قابل‌حمل." +
		" بودجه و ترجیح تکرار را در تنوع بین روزها رعایت کن):" + b.String()
}

func mealCountFromCheckIn(s string) int {
	s = strings.TrimSpace(s)
	switch {
	case strings.Contains(s, "۳") || strings.HasPrefix(s, "3"):
		return 3
	case strings.Contains(s, "۴") || strings.HasPrefix(s, "4"):
		return 4
	case strings.Contains(s, "۵") || strings.HasPrefix(s, "5"):
		return 5
	case strings.Contains(s, "۶") || strings.HasPrefix(s, "6"):
		return 6
	default:
		return 0
	}
}

func cleanPromptList(items []string) []string {
	out := make([]string, 0, len(items))
	seen := make(map[string]struct{}, len(items))
	for _, raw := range items {
		s := strings.TrimSpace(raw)
		if s == "" {
			continue
		}
		s = truncateRunes(s, 80)
		if _, ok := seen[s]; ok {
			continue
		}
		seen[s] = struct{}{}
		out = append(out, s)
		if len(out) >= 20 {
			break
		}
	}
	return out
}

func truncateRunes(s string, max int) string {
	if max <= 0 || utf8.RuneCountInString(s) <= max {
		return s
	}
	runes := []rune(s)
	return string(runes[:max]) + "…"
}
