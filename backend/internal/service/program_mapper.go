package service

import (
	"fmt"
	"math"
	"strconv"
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

func parseWorkoutStep(step string) (name string, sets int, reps string) {
	step = strings.TrimSpace(step)
	if step == "" {
		return "", 0, ""
	}
	parts := strings.Split(step, " — ")
	name = strings.TrimSpace(parts[0])
	for i := 1; i < len(parts); i++ {
		p := strings.TrimSpace(parts[i])
		if strings.Contains(p, "ست") {
			numStr := strings.TrimSpace(strings.ReplaceAll(p, "ست", ""))
			if n, err := strconv.Atoi(numStr); err == nil {
				sets = n
			}
		} else if strings.Contains(p, "تکرار") {
			reps = strings.TrimSpace(strings.ReplaceAll(p, "تکرار", ""))
		}
	}
	return name, sets, reps
}

func formatWorkoutStep(name string, sets int, reps string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return ""
	}
	parts := []string{name}
	if sets > 0 {
		parts = append(parts, fmt.Sprintf("%d ست", sets))
	}
	if strings.TrimSpace(reps) != "" {
		parts = append(parts, fmt.Sprintf("%s تکرار", strings.TrimSpace(reps)))
	}
	return strings.Join(parts, " — ")
}

func summarizeSetReps(details []models.ProgramItemSet) string {
	parts := make([]string, 0, len(details))
	for _, d := range details {
		if d.IsAMRAP {
			parts = append(parts, "AMRAP")
			continue
		}
		if r := strings.TrimSpace(d.Reps); r != "" {
			parts = append(parts, r)
		}
	}
	return strings.Join(parts, "/")
}

func legacySetsToDetails(sets int, reps string) []models.ProgramItemSet {
	if sets <= 0 {
		return nil
	}
	reps = strings.TrimSpace(reps)
	details := make([]models.ProgramItemSet, 0, sets)
	for i := 1; i <= sets; i++ {
		details = append(details, models.ProgramItemSet{
			SetNumber: i,
			Reps:      reps,
		})
	}
	return details
}

func setsDetailsToDTO(details []models.ProgramItemSet) []MeWorkoutSetDTO {
	out := make([]MeWorkoutSetDTO, 0, len(details))
	for _, d := range details {
		out = append(out, MeWorkoutSetDTO{
			SetNumber: d.SetNumber,
			Reps:      strings.TrimSpace(d.Reps),
			IsAMRAP:   d.IsAMRAP,
		})
	}
	return out
}

func normalizeSetDTOs(dtos []MeWorkoutSetDTO) []MeWorkoutSetDTO {
	out := make([]MeWorkoutSetDTO, 0, len(dtos))
	for i, d := range dtos {
		setNum := d.SetNumber
		if setNum <= 0 {
			setNum = i + 1
		}
		out = append(out, MeWorkoutSetDTO{
			SetNumber: setNum,
			Reps:      strings.TrimSpace(d.Reps),
			IsAMRAP:   d.IsAMRAP,
		})
	}
	return out
}

func setsDetailsFromDTO(dtos []MeWorkoutSetDTO) []models.ProgramItemSet {
	normalized := normalizeSetDTOs(dtos)
	out := make([]models.ProgramItemSet, 0, len(normalized))
	for _, d := range normalized {
		out = append(out, models.ProgramItemSet{
			SetNumber: d.SetNumber,
			Reps:      d.Reps,
			IsAMRAP:   d.IsAMRAP,
		})
	}
	return out
}

func syncLegacySetFields(item *models.ProgramItem) {
	if len(item.SetsDetails) == 0 {
		return
	}
	item.Sets = len(item.SetsDetails)
	item.Reps = summarizeSetReps(item.SetsDetails)
}

func normalizeWorkoutSystemType(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value == "" {
		return "normal"
	}
	return value
}

func programItemToExerciseDTO(it models.ProgramItem) MeWorkoutExerciseDTO {
	name := strings.TrimSpace(it.Exercise)
	sets := it.Sets
	reps := strings.TrimSpace(it.Reps)
	if name == "" {
		name, sets, reps = parseWorkoutStep(it.Exercise)
	}

	exDTO := MeWorkoutExerciseDTO{
		Name:              name,
		Sets:              sets,
		Reps:              reps,
		SupersetID:        it.SupersetID,
		WorkoutSystemType: normalizeWorkoutSystemType(it.WorkoutSystemType),
	}
	if it.ExerciseID != nil && *it.ExerciseID > 0 {
		exDTO.ExerciseID = *it.ExerciseID
	}

	if len(it.SetsDetails) > 0 {
		exDTO.SetsDetails = setsDetailsToDTO(it.SetsDetails)
		exDTO.Sets = len(it.SetsDetails)
		exDTO.Reps = summarizeSetReps(it.SetsDetails)
	} else if sets > 0 {
		exDTO.SetsDetails = setsDetailsToDTO(legacySetsToDetails(sets, reps))
	}

	return exDTO
}

func exerciseDTOToProgramItem(ex MeWorkoutExerciseDTO, dayNum, orderIndex int) models.ProgramItem {
	name := strings.TrimSpace(ex.Name)
	item := models.ProgramItem{
		WeekNumber:        1,
		DayNumber:         dayNum,
		OrderIndex:        orderIndex,
		Exercise:          name,
		Sets:              ex.Sets,
		Reps:              strings.TrimSpace(ex.Reps),
		SupersetID:        ex.SupersetID,
		WorkoutSystemType: normalizeWorkoutSystemType(ex.WorkoutSystemType),
	}
	if ex.ExerciseID > 0 {
		id := ex.ExerciseID
		item.ExerciseID = &id
	}

	if len(ex.SetsDetails) > 0 {
		item.SetsDetails = setsDetailsFromDTO(ex.SetsDetails)
		syncLegacySetFields(&item)
	} else if ex.Sets > 0 {
		item.SetsDetails = legacySetsToDetails(ex.Sets, ex.Reps)
	}

	return item
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
			day.Workout = &MeWorkoutDTO{Steps: []string{}, Exercises: []MeWorkoutExerciseDTO{}}
		}

		exDTO := programItemToExerciseDTO(it)

		step := formatWorkoutStep(exDTO.Name, exDTO.Sets, exDTO.Reps)
		if step != "" {
			day.Workout.Steps = append(day.Workout.Steps, step)
		}

		day.Workout.Exercises = append(day.Workout.Exercises, exDTO)
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

	for _, it := range items {
		key, ok := dayNumberToKey[it.DayNumber]
		if !ok {
			continue
		}
		day := planByDay[key]
		if day.Nutrition == nil {
			day.Nutrition = &MeNutritionDTO{Meals: []MeMealDTO{}}
		}
		day.Nutrition.Meals = append(day.Nutrition.Meals, nutritionItemToMealDTO(it))
		planByDay[key] = day
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

		if len(day.Workout.Exercises) > 0 {
			for i, ex := range day.Workout.Exercises {
				name := strings.TrimSpace(ex.Name)
				if name == "" {
					continue
				}
				items = append(items, exerciseDTOToProgramItem(ex, dayNum, i+1))
			}
			continue
		}

		for i, step := range day.Workout.Steps {
			step = strings.TrimSpace(step)
			if step == "" {
				continue
			}
			name, sets, reps := parseWorkoutStep(step)
			if name == "" {
				name = step
			}
			item := models.ProgramItem{
				WeekNumber: 1,
				DayNumber:  dayNum,
				OrderIndex: i + 1,
				Exercise:   name,
				Sets:       sets,
				Reps:       reps,
			}
			if sets > 0 {
				item.SetsDetails = legacySetsToDetails(sets, reps)
			}
			items = append(items, item)
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

			multiplier := mealMultiplier(meal.Multiplier)
			item := models.NutritionItem{
				DayNumber:  dayNum,
				MealNumber: i + 1,
				OrderIndex: i + 1,
				Food:       title,
				Quantity:   strings.TrimSpace(meal.Detail),
				Multiplier: multiplier,
				Calories:   int(math.Round(meal.Calories)),
				Protein:    meal.Protein,
				Carbs:      meal.Carbs,
				Fat:        meal.Fat,
			}
			if meal.FoodID > 0 {
				id := meal.FoodID
				item.FoodID = &id
			}
			items = append(items, item)
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
