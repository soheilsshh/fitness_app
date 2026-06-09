package service

import (
	"fmt"
	"strings"

	"github.com/yourusername/fitness-management/internal/models"
)

var dayKeyToNumber = map[string]int{
	"sat": 1, "sun": 2, "mon": 3, "tue": 4, "wed": 5, "thu": 6, "fri": 7,
}

var dayNumberToKey = map[int]string{
	1: "sat", 2: "sun", 3: "mon", 4: "tue", 5: "wed", 6: "thu", 7: "fri",
}

var allDayKeys = []string{"sat", "sun", "mon", "tue", "wed", "thu", "fri"}

func dayKeyToNum(key string) int {
	if n, ok := dayKeyToNumber[strings.ToLower(key)]; ok {
		return n
	}
	return 0
}

func workoutItemsToPlanByDay(items []models.ProgramItem) (map[string]MeDayPlanDTO, *MeScheduleDTO) {
	planByDay := make(map[string]MeDayPlanDTO)
	if len(items) == 0 {
		return planByDay, &MeScheduleDTO{Weekly: append([]string{}, allDayKeys...), RestDays: []string{}}
	}

	weeklySet := map[string]bool{}

	for _, it := range items {
		key, ok := dayNumberToKey[it.DayNumber]
		if !ok {
			continue
		}
		weeklySet[key] = true
		day := planByDay[key]
		if day.Workout == nil {
			day.Workout = &MeWorkoutDTO{Steps: []string{}}
		}
		step := strings.TrimSpace(it.Exercise)
		if it.Sets > 0 || it.Reps != "" {
			parts := []string{it.Exercise}
			if it.Sets > 0 {
				parts = append(parts, fmt.Sprintf("%d ست", it.Sets))
			}
			if it.Reps != "" {
				parts = append(parts, it.Reps)
			}
			step = strings.Join(parts, " — ")
		}
		if step != "" {
			day.Workout.Steps = append(day.Workout.Steps, step)
		}
		planByDay[key] = day
	}

	weekly := make([]string, 0)
	restDays := make([]string, 0)
	for _, key := range allDayKeys {
		if weeklySet[key] {
			weekly = append(weekly, key)
		} else {
			restDays = append(restDays, key)
		}
	}

	return planByDay, &MeScheduleDTO{Weekly: weekly, RestDays: restDays}
}

func nutritionItemsToPlanByDay(items []models.NutritionItem) map[string]MeDayPlanDTO {
	planByDay := make(map[string]MeDayPlanDTO)
	targetsByDay := map[int]struct {
		calories int
		protein  string
	}{}

	for _, it := range items {
		key, ok := dayNumberToKey[it.DayNumber]
		if !ok {
			continue
		}
		day := planByDay[key]
		if day.Nutrition == nil {
			day.Nutrition = &MeNutritionDTO{Meals: []MeMealDTO{}}
		}
		detail := strings.TrimSpace(it.Quantity)
		if it.Calories > 0 {
			if detail != "" {
				detail += " — "
			}
			detail += fmt.Sprintf("%d کالری", it.Calories)
		}
		day.Nutrition.Meals = append(day.Nutrition.Meals, MeMealDTO{
			Title:  it.Food,
			Detail: detail,
		})
		if it.Calories > 0 {
			t := targetsByDay[it.DayNumber]
			t.calories += it.Calories
			targetsByDay[it.DayNumber] = t
		}
		planByDay[key] = day
	}

	for dayNum, t := range targetsByDay {
		key := dayNumberToKey[dayNum]
		day := planByDay[key]
		if day.Nutrition != nil && t.calories > 0 {
			day.Nutrition.CaloriesTarget = t.calories
			planByDay[key] = day
		}
	}
	return planByDay
}

func planByDayToWorkoutItems(planByDay map[string]MeDayPlanDTO) []models.ProgramItem {
	items := make([]models.ProgramItem, 0)
	for _, key := range allDayKeys {
		day, ok := planByDay[key]
		if !ok || day.Workout == nil {
			continue
		}
		dayNum := dayKeyToNum(key)
		if dayNum == 0 {
			continue
		}
		for i, step := range day.Workout.Steps {
			step = strings.TrimSpace(step)
			if step == "" {
				continue
			}
			items = append(items, models.ProgramItem{
				WeekNumber: 1,
				DayNumber:  dayNum,
				OrderIndex: i + 1,
				Exercise:   step,
			})
		}
	}
	return items
}

func planByDayToNutritionItems(planByDay map[string]MeDayPlanDTO) []models.NutritionItem {
	items := make([]models.NutritionItem, 0)
	for _, key := range allDayKeys {
		day, ok := planByDay[key]
		if !ok || day.Nutrition == nil {
			continue
		}
		dayNum := dayKeyToNum(key)
		if dayNum == 0 {
			continue
		}
		for i, meal := range day.Nutrition.Meals {
			title := strings.TrimSpace(meal.Title)
			if title == "" {
				continue
			}
			items = append(items, models.NutritionItem{
				DayNumber:  dayNum,
				MealNumber: i + 1,
				OrderIndex: i + 1,
				Food:       title,
				Quantity:   strings.TrimSpace(meal.Detail),
			})
		}
	}
	return items
}

func mergePlanByDay(base map[string]MeDayPlanDTO, overlay map[string]MeDayPlanDTO) map[string]MeDayPlanDTO {
	if base == nil {
		base = make(map[string]MeDayPlanDTO)
	}
	for k, v := range overlay {
		existing := base[k]
		if v.Workout != nil {
			existing.Workout = v.Workout
		}
		if v.Nutrition != nil {
			existing.Nutrition = v.Nutrition
		}
		base[k] = existing
	}
	return base
}

func buildFullPlanByDay(workoutItems []models.ProgramItem, nutritionItems []models.NutritionItem) (map[string]MeDayPlanDTO, *MeScheduleDTO) {
	workoutPlan, schedule := workoutItemsToPlanByDay(workoutItems)
	nutritionPlan := nutritionItemsToPlanByDay(nutritionItems)
	return mergePlanByDay(workoutPlan, nutritionPlan), schedule
}
