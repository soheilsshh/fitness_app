package ai

import (
	"errors"
	"fmt"
	"strings"
)

var (
	ErrInvalidPlan = errors.New("invalid ai plan")
)

// ValidateNutritionPlan rejects unrealistic or empty nutrition plans.
func ValidateNutritionPlan(plan *NutritionPlanSchema) error {
	if plan == nil {
		return fmt.Errorf("%w: plan is nil", ErrInvalidPlan)
	}
	if plan.TotalCalories < 800 || plan.TotalCalories > 6000 {
		return fmt.Errorf("%w: کالری کل خارج از محدوده منطقی است", ErrInvalidPlan)
	}
	if plan.ProteinG < 0 || plan.CarbsG < 0 || plan.FatG < 0 {
		return fmt.Errorf("%w: مقادیر ماکرو نمی‌تواند منفی باشد", ErrInvalidPlan)
	}
	goal := strings.ToLower(strings.TrimSpace(plan.GoalType))
	if goal != GoalCut && goal != GoalBulk && goal != GoalMaintain {
		return fmt.Errorf("%w: goal_type نامعتبر است", ErrInvalidPlan)
	}
	if len(plan.Meals) == 0 {
		return fmt.Errorf("%w: هیچ وعده‌ای در برنامه وجود ندارد", ErrInvalidPlan)
	}
	itemCalSum := 0
	for _, meal := range plan.Meals {
		if err := ValidateMeal(&meal); err != nil {
			return err
		}
		for _, item := range meal.Items {
			itemCalSum += item.Calories
		}
	}
	// Soft check: item sum should not wildly diverge from declared total.
	if itemCalSum > 0 {
		diff := itemCalSum - plan.TotalCalories
		if diff < 0 {
			diff = -diff
		}
		if diff > plan.TotalCalories/2 && diff > 400 {
			return fmt.Errorf("%w: مجموع کالری آیتم‌ها با total_calories هم‌خوانی ندارد", ErrInvalidPlan)
		}
	}
	return nil
}

// ValidateWeeklyPlan rejects unrealistic or empty weekly nutrition plans
// (roadmap Phase 3: برنامه هفتگی).
func ValidateWeeklyPlan(plan *NutritionWeekSchema) error {
	if plan == nil {
		return fmt.Errorf("%w: plan is nil", ErrInvalidPlan)
	}
	if plan.TotalCalories < 800 || plan.TotalCalories > 6000 {
		return fmt.Errorf("%w: کالری کل خارج از محدوده منطقی است", ErrInvalidPlan)
	}
	if plan.ProteinG < 0 || plan.CarbsG < 0 || plan.FatG < 0 {
		return fmt.Errorf("%w: مقادیر ماکرو نمی‌تواند منفی باشد", ErrInvalidPlan)
	}
	goal := strings.ToLower(strings.TrimSpace(plan.GoalType))
	if goal != GoalCut && goal != GoalBulk && goal != GoalMaintain {
		return fmt.Errorf("%w: goal_type نامعتبر است", ErrInvalidPlan)
	}
	if len(plan.Days) == 0 {
		return fmt.Errorf("%w: هیچ روزی در برنامه هفتگی وجود ندارد", ErrInvalidPlan)
	}
	for _, day := range plan.Days {
		if strings.TrimSpace(day.DayName) == "" {
			return fmt.Errorf("%w: نام روز خالی است", ErrInvalidPlan)
		}
		if len(day.Meals) == 0 {
			return fmt.Errorf("%w: روز %s وعده‌ای ندارد", ErrInvalidPlan, day.DayName)
		}
		for _, meal := range day.Meals {
			if err := ValidateMeal(&meal); err != nil {
				return err
			}
		}
	}
	return nil
}

// ValidateMeal rejects an empty or nonsensical single meal — shared by
// ValidateNutritionPlan (per-meal check inside a full plan) and the standalone
// "تغییر این وعده" regenerate-single-meal flow.
func ValidateMeal(meal *MealSchema) error {
	if meal == nil {
		return fmt.Errorf("%w: meal is nil", ErrInvalidPlan)
	}
	if strings.TrimSpace(meal.Name) == "" {
		return fmt.Errorf("%w: نام وعده خالی است", ErrInvalidPlan)
	}
	if len(meal.Items) == 0 {
		return fmt.Errorf("%w: وعده %s آیتم غذایی ندارد", ErrInvalidPlan, meal.Name)
	}
	for _, item := range meal.Items {
		if strings.TrimSpace(item.FoodName) == "" {
			return fmt.Errorf("%w: نام غذا خالی است", ErrInvalidPlan)
		}
		if item.Calories < 0 || item.ProteinG < 0 || item.CarbsG < 0 || item.FatG < 0 || item.AmountG < 0 {
			return fmt.Errorf("%w: مقادیر آیتم غذایی نامعتبر است", ErrInvalidPlan)
		}
	}
	if isMainMealName(meal.Name) {
		cal := 0
		for _, item := range meal.Items {
			cal += item.Calories
		}
		if cal < 300 {
			return fmt.Errorf("%w: وعده %s باید غذای اصلی باشد نه میان‌وعده", ErrInvalidPlan, meal.Name)
		}
	}
	return nil
}

func isMainMealName(name string) bool {
	n := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(name), "‌", " "))
	if strings.Contains(n, "میان") {
		return false
	}
	return strings.Contains(n, "ناهار") || strings.Contains(n, "نهار") ||
		strings.Contains(n, "شام") || strings.Contains(n, "lunch") || strings.Contains(n, "dinner")
}

// ValidateWorkoutPlan rejects empty or nonsensical workout plans.
func ValidateWorkoutPlan(plan *WorkoutPlanSchema) error {
	if plan == nil {
		return fmt.Errorf("%w: plan is nil", ErrInvalidPlan)
	}
	goal := strings.ToLower(strings.TrimSpace(plan.GoalType))
	if goal != WorkoutStrength && goal != WorkoutHypertrophy && goal != WorkoutFatLoss {
		return fmt.Errorf("%w: goal_type تمرین نامعتبر است", ErrInvalidPlan)
	}
	if len(plan.Days) == 0 {
		return fmt.Errorf("%w: هیچ روز تمرینی وجود ندارد", ErrInvalidPlan)
	}
	for _, day := range plan.Days {
		if strings.TrimSpace(day.DayName) == "" {
			return fmt.Errorf("%w: نام روز خالی است", ErrInvalidPlan)
		}
		if len(day.Exercises) == 0 {
			return fmt.Errorf("%w: روز %s حرکتی ندارد", ErrInvalidPlan, day.DayName)
		}
		for _, ex := range day.Exercises {
			if strings.TrimSpace(ex.ExerciseName) == "" {
				return fmt.Errorf("%w: نام حرکت خالی است", ErrInvalidPlan)
			}
			if ex.Sets <= 0 || ex.Sets > 20 {
				return fmt.Errorf("%w: تعداد ست نامعتبر است", ErrInvalidPlan)
			}
			if strings.TrimSpace(ex.Reps) == "" {
				return fmt.Errorf("%w: تکرار خالی است", ErrInvalidPlan)
			}
			if ex.RestSeconds < 0 || ex.RestSeconds > 600 {
				return fmt.Errorf("%w: استراحت بین ست نامعتبر است", ErrInvalidPlan)
			}
		}
	}
	return nil
}

// ValidateIngredientSuggestion rejects empty or unrealistic improvised recipes (roadmap BE-1.9).
func ValidateIngredientSuggestion(s *IngredientSuggestionSchema) error {
	if s == nil {
		return fmt.Errorf("%w: suggestion is nil", ErrInvalidPlan)
	}
	if strings.TrimSpace(s.RecipeName) == "" {
		return fmt.Errorf("%w: نام دستور غذا خالی است", ErrInvalidPlan)
	}
	if len(s.Items) == 0 {
		return fmt.Errorf("%w: هیچ آیتم غذایی پیشنهاد نشده", ErrInvalidPlan)
	}
	if s.TotalCalories < 50 || s.TotalCalories > 3000 {
		return fmt.Errorf("%w: کالری کل خارج از محدوده منطقی است", ErrInvalidPlan)
	}
	for _, item := range s.Items {
		if strings.TrimSpace(item.FoodName) == "" {
			return fmt.Errorf("%w: نام غذا خالی است", ErrInvalidPlan)
		}
		if item.Calories < 0 || item.ProteinG < 0 || item.CarbsG < 0 || item.FatG < 0 || item.AmountG < 0 {
			return fmt.Errorf("%w: مقادیر آیتم غذایی نامعتبر است", ErrInvalidPlan)
		}
	}
	return nil
}

// ValidateBodyPhotoAnalysis rejects an empty vision analysis (roadmap BE-5.2).
func ValidateBodyPhotoAnalysis(a *BodyPhotoAnalysisSchema) error {
	if a == nil {
		return fmt.Errorf("%w: analysis is nil", ErrInvalidPlan)
	}
	if strings.TrimSpace(a.ObservationText) == "" {
		return fmt.Errorf("%w: متن مشاهده خالی است", ErrInvalidPlan)
	}
	return nil
}

var funnelBannedNames = []string{
	"علی رشیدآبادی",
	"علی رشیدابادی",
	"علی رشید آبادی",
	"مربی علی رشیدآبادی",
	"مربی علی",
}

func sanitizeFunnelText(s string) string {
	out := s
	for _, banned := range funnelBannedNames {
		out = strings.ReplaceAll(out, banned, "ایجنت‌های فیتینو")
	}
	return strings.TrimSpace(out)
}

// SanitizeFunnelAnalysis strips banned personal names from model output.
func SanitizeFunnelAnalysis(a *FunnelAnalysisSchema) {
	if a == nil {
		return
	}
	a.AIWarning = sanitizeFunnelText(a.AIWarning)
	a.StatusSummaryTitle = sanitizeFunnelText(a.StatusSummaryTitle)
	a.StatusSummaryBody = sanitizeFunnelText(a.StatusSummaryBody)
	a.CustomSolutionTitle = sanitizeFunnelText(a.CustomSolutionTitle)
	a.CustomSolutionBody = sanitizeFunnelText(a.CustomSolutionBody)
	a.RoutePredictionTitle = sanitizeFunnelText(a.RoutePredictionTitle)
	a.RoutePredictionBody = sanitizeFunnelText(a.RoutePredictionBody)
	a.AnalysisReadyTitle = sanitizeFunnelText(a.AnalysisReadyTitle)
	a.AnalysisReadyBody = sanitizeFunnelText(a.AnalysisReadyBody)
	a.AIGuard = sanitizeFunnelText(a.AIGuard)
	a.TrendChartTitle = sanitizeFunnelText(a.TrendChartTitle)
	a.TrendChartYLabel = sanitizeFunnelText(a.TrendChartYLabel)
	if a.TrendChartYMax < 10 {
		a.TrendChartYMax = 40
	}
	if a.TrendChartYMax > 100 {
		a.TrendChartYMax = 100
	}
	for i := range a.TrendChartValues {
		if a.TrendChartValues[i] < 0 {
			a.TrendChartValues[i] = 0
		}
		if a.TrendChartValues[i] > a.TrendChartYMax {
			a.TrendChartValues[i] = a.TrendChartYMax
		}
	}
	for i := range a.ChartBars {
		a.ChartBars[i].Label = sanitizeFunnelText(a.ChartBars[i].Label)
		if a.ChartBars[i].Value < 0 {
			a.ChartBars[i].Value = 0
		}
		if a.ChartBars[i].Value > 100 {
			a.ChartBars[i].Value = 100
		}
	}
	if a.SuccessPct < 55 {
		a.SuccessPct = 55
	}
	if a.SuccessPct > 95 {
		a.SuccessPct = 95
	}
}

// ValidateFunnelAnalysis rejects an empty or incomplete funnel analysis packet.
func ValidateFunnelAnalysis(a *FunnelAnalysisSchema) error {
	if a == nil {
		return fmt.Errorf("%w: analysis is nil", ErrInvalidPlan)
	}
	if strings.TrimSpace(a.AIWarning) == "" ||
		strings.TrimSpace(a.StatusSummaryBody) == "" ||
		strings.TrimSpace(a.CustomSolutionBody) == "" ||
		strings.TrimSpace(a.RoutePredictionBody) == "" ||
		strings.TrimSpace(a.AnalysisReadyBody) == "" ||
		strings.TrimSpace(a.AIGuard) == "" {
		return fmt.Errorf("%w: متن آنالیز فانل ناقص است", ErrInvalidPlan)
	}
	if len(a.TrendChartValues) != 12 {
		return fmt.Errorf("%w: trend_chart_values باید ۱۲ مقدار داشته باشد", ErrInvalidPlan)
	}
	if strings.TrimSpace(a.TrendChartTitle) == "" || strings.TrimSpace(a.TrendChartYLabel) == "" {
		return fmt.Errorf("%w: trend chart ناقص است", ErrInvalidPlan)
	}
	if len(a.ChartBars) != 5 {
		return fmt.Errorf("%w: chart_bars باید ۵ محور داشته باشد", ErrInvalidPlan)
	}
	for _, bar := range a.ChartBars {
		if strings.TrimSpace(bar.Label) == "" {
			return fmt.Errorf("%w: chart_bars.label خالی است", ErrInvalidPlan)
		}
	}
	return nil
}

// ValidateProgressAnalysis rejects an empty AI-written deep-dive summary (roadmap BE-4.3).
func ValidateProgressAnalysis(a *ProgressAnalysisSchema) error {
	if a == nil {
		return fmt.Errorf("%w: analysis is nil", ErrInvalidPlan)
	}
	if strings.TrimSpace(a.SummaryText) == "" {
		return fmt.Errorf("%w: متن خلاصه خالی است", ErrInvalidPlan)
	}
	return nil
}

// ValidateFoodLog rejects empty or nonsensical voice food-log suggestions (roadmap BE-2.4).
func ValidateFoodLog(log *FoodLogSchema) error {
	if log == nil {
		return fmt.Errorf("%w: food log is nil", ErrInvalidPlan)
	}
	if len(log.Items) == 0 && len(foodLogQuestionTexts(log.Questions)) == 0 {
		return fmt.Errorf("%w: هیچ آیتم غذایی ثبت نشده", ErrInvalidPlan)
	}
	for _, item := range log.Items {
		if strings.TrimSpace(item.FoodName) == "" {
			return fmt.Errorf("%w: نام غذا خالی است", ErrInvalidPlan)
		}
		if item.Calories < 0 || item.ProteinG < 0 || item.CarbsG < 0 || item.FatG < 0 || item.AmountG < 0 {
			return fmt.Errorf("%w: مقادیر آیتم غذایی نامعتبر است", ErrInvalidPlan)
		}
	}
	return nil
}

// ValidateSetLog is a stub for roadmap phase 3.
func ValidateSetLog(log *SetLogSchema) error {
	if log == nil {
		return fmt.Errorf("%w: set log is nil", ErrInvalidPlan)
	}
	if strings.TrimSpace(log.ExerciseName) == "" {
		return fmt.Errorf("%w: نام حرکت خالی است", ErrInvalidPlan)
	}
	if log.Reps <= 0 {
		return fmt.Errorf("%w: تعداد تکرار نامعتبر است", ErrInvalidPlan)
	}
	return nil
}

// ValidateWorkoutNoteSummary rejects an empty voice-note cleanup result.
func ValidateWorkoutNoteSummary(s *WorkoutNoteSummarySchema) error {
	if s == nil || strings.TrimSpace(s.Text) == "" {
		return fmt.Errorf("%w: متن خالی است", ErrInvalidPlan)
	}
	return nil
}
