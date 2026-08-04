package service

import (
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/yourusername/fitness-management/internal/models"
)

func remapSupersetID(old *string, remap map[string]string) *string {
	if old == nil {
		return nil
	}
	key := strings.TrimSpace(*old)
	if key == "" {
		return nil
	}
	if mapped, ok := remap[key]; ok {
		return &mapped
	}
	newID := uuid.NewString()
	remap[key] = newID
	return &newID
}

func workoutTemplateToPlanByDay(template *models.WorkoutTemplate) map[string]MeDayPlanDTO {
	planByDay := make(map[string]MeDayPlanDTO)
	if template == nil || len(template.Items) == 0 {
		return planByDay
	}

	supersetRemap := map[string]string{}

	for _, item := range template.Items {
		key, ok := dayNumberToKey[item.DayNumber]
		if !ok {
			continue
		}

		day := planByDay[key]
		if day.Workout == nil {
			day.Workout = &MeWorkoutDTO{Steps: []string{}, Exercises: []MeWorkoutExerciseDTO{}}
		}

		setDTOs := make([]MeWorkoutSetDTO, 0, len(item.SetsDetails))
		for _, s := range item.SetsDetails {
			setDTOs = append(setDTOs, MeWorkoutSetDTO{
				SetNumber: s.SetNumber,
				Reps:      strings.TrimSpace(s.Reps),
				IsAMRAP:   s.IsAMRAP,
			})
		}

		ex := MeWorkoutExerciseDTO{
			Name:              strings.TrimSpace(item.Exercise),
			SupersetID:        remapSupersetID(item.SupersetID, supersetRemap),
			WorkoutSystemType: normalizeWorkoutSystemType(item.WorkoutSystemType),
			SetsDetails:       setDTOs,
		}
		if item.ExerciseID != nil && *item.ExerciseID > 0 {
			ex.ExerciseID = *item.ExerciseID
		}
		if len(setDTOs) > 0 {
			ex.Sets = len(setDTOs)
			ex.Reps = summarizeSetReps(templateSetsToProgramSets(setDTOs))
		}

		step := formatWorkoutStep(ex.Name, ex.Sets, ex.Reps)
		if step != "" {
			day.Workout.Steps = append(day.Workout.Steps, step)
		}
		day.Workout.Exercises = append(day.Workout.Exercises, ex)
		planByDay[key] = day
	}

	return planByDay
}

func templateSetsToProgramSets(dtos []MeWorkoutSetDTO) []models.ProgramItemSet {
	out := make([]models.ProgramItemSet, 0, len(dtos))
	for _, d := range dtos {
		out = append(out, models.ProgramItemSet{
			SetNumber: d.SetNumber,
			Reps:      d.Reps,
			IsAMRAP:   d.IsAMRAP,
		})
	}
	return out
}

func nutritionTemplateToPlanByDay(template *models.NutritionTemplate) map[string]MeDayPlanDTO {
	planByDay := make(map[string]MeDayPlanDTO)
	if template == nil || len(template.Meals) == 0 {
		return planByDay
	}

	snackCount := 0
	meals := make([]MeMealDTO, 0)
	for _, meal := range template.Meals {
		slot := NormalizeMealSlot(meal.MealName, &snackCount)
		for _, item := range meal.Items {
			title := strings.TrimSpace(item.FoodName)
			if menuName := strings.TrimSpace(item.MenuName); menuName != "" {
				title = fmt.Sprintf("%s — %s", menuName, title)
			}

			mealDTO := MeMealDTO{
				Title:      title,
				Detail:     formatTemplateFoodQuantity(item.Value, item.Unit),
				MealSlot:   slot,
				Multiplier: mealMultiplier(item.Value),
				Unit:       strings.TrimSpace(item.Unit),
				Amount:     item.Value,
			}
			if item.FoodID != nil && *item.FoodID > 0 {
				mealDTO.FoodID = *item.FoodID
			}
			meals = append(meals, mealDTO)
		}
	}
	sortMealsBySlot(meals)

	for _, dayKey := range allDayKeys {
		copied := make([]MeMealDTO, len(meals))
		copy(copied, meals)
		day := MeDayPlanDTO{
			Nutrition: &MeNutritionDTO{
				CaloriesTarget: template.Calorie,
				Meals:          copied,
			},
		}
		if len(copied) > 0 {
			planByDay[dayKey] = day
		}
	}

	return planByDay
}

func sortMealsBySlot(meals []MeMealDTO) {
	for i := 0; i < len(meals); i++ {
		for j := i + 1; j < len(meals); j++ {
			if mealSlotRank(meals[j].MealSlot) < mealSlotRank(meals[i].MealSlot) {
				meals[i], meals[j] = meals[j], meals[i]
			}
		}
	}
}

func formatTemplateFoodQuantity(value float64, unit string) string {
	unit = strings.TrimSpace(unit)
	if value <= 0 {
		return unit
	}
	if unit == "" {
		return fmt.Sprintf("%g", value)
	}
	return fmt.Sprintf("%g %s", value, unit)
}
