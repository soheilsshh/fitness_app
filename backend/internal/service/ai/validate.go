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
	if len(log.Items) == 0 {
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
