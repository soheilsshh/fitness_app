package service

import (
	"context"
	"fmt"
	"math"
	"strings"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

func mealMultiplier(value float64) float64 {
	if value <= 0 {
		return 1
	}
	return value
}

func scaleNullableFloat(v *float64, multiplier float64) *float64 {
	if v == nil {
		return nil
	}
	out := *v * multiplier
	return &out
}

func formatFoodQuantity(amount float64, unit string) string {
	if amount <= 0 {
		return unit
	}
	rounded := math.Round(amount*100) / 100
	if rounded == math.Trunc(rounded) {
		return fmt.Sprintf("%.0f %s", rounded, unit)
	}
	return fmt.Sprintf("%g %s", rounded, unit)
}

// NutritionFacts is the full per-serving nutrition panel, scaled from a Food's
// per-100g baseline by grams/100. Pointer fields stay nil when the source Food
// hasn't been enriched for that nutrient yet — never backfilled with a guess.
type NutritionFacts struct {
	Grams        float64  `json:"grams"`
	Calories     float64  `json:"calories"`
	Protein      float64  `json:"protein"`
	Fat          float64  `json:"fat"`
	Carbs        float64  `json:"carbs"`
	Sugar        *float64 `json:"sugar,omitempty"`
	Sodium       *float64 `json:"sodium,omitempty"`
	Cholesterol  *float64 `json:"cholesterol,omitempty"`
	Calcium      *float64 `json:"calcium,omitempty"`
	Iron         *float64 `json:"iron,omitempty"`
	Fiber        *float64 `json:"fiber,omitempty"`
	Magnesium    *float64 `json:"magnesium,omitempty"`
	Potassium    *float64 `json:"potassium,omitempty"`
	Phosphorus   *float64 `json:"phosphorus,omitempty"`
	TransFat     *float64 `json:"transFat,omitempty"`
	SaturatedFat *float64 `json:"saturatedFat,omitempty"`
}

// scaleFoodByGrams is the single source of truth for "enter grams, get the full
// nutrition panel": every field scales linearly from the food's per-100g baseline.
// This is what powers the spoon/gram/cup serving picker end to end.
func scaleFoodByGrams(f *models.Food, grams float64) NutritionFacts {
	if f == nil {
		return NutritionFacts{}
	}
	if grams < 0 {
		grams = 0
	}
	factor := grams / 100
	return NutritionFacts{
		Grams:        grams,
		Calories:     f.Calories * factor,
		Protein:      f.Protein * factor,
		Fat:          f.Fat * factor,
		Carbs:        f.Carbs * factor,
		Sugar:        scaleNullableFloat(f.Sugar, factor),
		Sodium:       scaleNullableFloat(f.Sodium, factor),
		Cholesterol:  scaleNullableFloat(f.Cholesterol, factor),
		Calcium:      scaleNullableFloat(f.Calcium, factor),
		Iron:         scaleNullableFloat(f.Iron, factor),
		Fiber:        scaleNullableFloat(f.Fiber, factor),
		Magnesium:    scaleNullableFloat(f.Magnesium, factor),
		Potassium:    scaleNullableFloat(f.Potassium, factor),
		Phosphorus:   scaleNullableFloat(f.Phosphorus, factor),
		TransFat:     scaleNullableFloat(f.TransFat, factor),
		SaturatedFat: scaleNullableFloat(f.SaturatedFat, factor),
	}
}

func foodModelToMealDTO(food *models.Food, multiplier float64, existing MeMealDTO) MeMealDTO {
	multiplier = mealMultiplier(multiplier)
	servingAmount := food.Amount * multiplier

	dto := existing
	if dto.Title == "" {
		dto.Title = food.Name
	}
	dto.FoodID = food.ID
	dto.Multiplier = multiplier
	dto.Unit = food.Unit
	dto.Amount = servingAmount
	dto.Calories = food.Calories * multiplier
	dto.Protein = food.Protein * multiplier
	dto.Carbs = food.Carbs * multiplier
	dto.Fat = food.Fat * multiplier
	dto.Fiber = scaleNullableFloat(food.Fiber, multiplier)
	dto.Sugar = scaleNullableFloat(food.Sugar, multiplier)

	if dto.Detail == "" {
		dto.Detail = formatFoodQuantity(servingAmount, food.Unit)
	}
	return dto
}

// foodModelToMealDTOByGrams mirrors foodModelToMealDTO but scales from an
// explicit gram amount instead of a unit multiplier — the entry point for the
// spoon/gram/cup serving picker. food must be the canonical (per-100g) row.
func foodModelToMealDTOByGrams(food *models.Food, grams float64, existing MeMealDTO) MeMealDTO {
	if grams <= 0 {
		grams = food.Amount
	}
	facts := scaleFoodByGrams(food, grams)

	dto := existing
	if dto.Title == "" {
		dto.Title = food.Name
	}
	dto.FoodID = food.ID
	dto.Multiplier = grams / mealMultiplier(food.Amount)
	dto.Unit = "گرم"
	dto.Amount = grams
	dto.Calories = facts.Calories
	dto.Protein = facts.Protein
	dto.Carbs = facts.Carbs
	dto.Fat = facts.Fat
	dto.Fiber = facts.Fiber
	dto.Sugar = facts.Sugar

	if dto.Detail == "" {
		dto.Detail = formatFoodQuantity(grams, "گرم")
	}
	return dto
}

func nutritionItemToMealDTO(it models.NutritionItem) MeMealDTO {
	multiplier := mealMultiplier(it.Multiplier)
	detail := it.Quantity
	if detail == "" && it.Calories > 0 {
		detail = fmt.Sprintf("%d کالری", it.Calories)
	} else if it.Calories > 0 {
		detail += fmt.Sprintf(" — %d کالری", it.Calories)
	}

	slot := strings.TrimSpace(it.MealSlot)
	if slot == "" {
		slot = mealSlotFromLegacyNumber(it.MealNumber)
	}

	meal := MeMealDTO{
		Title:      it.Food,
		Detail:     detail,
		MealSlot:   slot,
		Multiplier: multiplier,
		Calories:   float64(it.Calories),
		Protein:    it.Protein,
		Carbs:      it.Carbs,
		Fat:        it.Fat,
	}
	if it.FoodID != nil && *it.FoodID > 0 {
		meal.FoodID = *it.FoodID
	}
	return meal
}

func mealSlotFromLegacyNumber(n int) string {
	switch n {
	case 1:
		return MealSlotBreakfast
	case 2:
		return MealSlotLunch
	case 3:
		return MealSlotDinner
	case 4:
		return MealSlotSnack1
	case 5:
		return MealSlotSnack2
	case 6:
		return MealSlotSnack3
	default:
		if n > 6 {
			return MealSlotSnack3
		}
		return ""
	}
}

func mealSlotToNumber(slot string) int {
	switch slot {
	case MealSlotBreakfast:
		return 1
	case MealSlotLunch:
		return 2
	case MealSlotDinner:
		return 3
	case MealSlotSnack1:
		return 4
	case MealSlotSnack2:
		return 5
	case MealSlotSnack3:
		return 6
	default:
		return 0
	}
}

func enrichNutritionPlan(ctx context.Context, foodRepo repository.FoodRepository, planByDay map[string]MeDayPlanDTO) map[string]MeDayPlanDTO {
	if foodRepo == nil || len(planByDay) == 0 {
		return planByDay
	}

	idSet := map[uint]bool{}
	for _, day := range planByDay {
		if day.Nutrition == nil {
			continue
		}
		for _, meal := range day.Nutrition.Meals {
			if meal.FoodID > 0 {
				idSet[meal.FoodID] = true
			}
		}
	}

	ids := make([]uint, 0, len(idSet))
	for id := range idSet {
		ids = append(ids, id)
	}

	byID := map[uint]*models.Food{}
	if list, err := foodRepo.FindByIDs(ctx, ids); err == nil {
		for i := range list {
			byID[list[i].ID] = &list[i]
		}
	}

	for key, day := range planByDay {
		if day.Nutrition == nil || len(day.Nutrition.Meals) == 0 {
			continue
		}

		enrichedMeals := make([]MeMealDTO, 0, len(day.Nutrition.Meals))
		dayCalories := 0.0
		for _, meal := range day.Nutrition.Meals {
			next := meal
			if meal.FoodID > 0 {
				if food, ok := byID[meal.FoodID]; ok {
					next = foodModelToMealDTO(food, meal.Multiplier, meal)
				}
			}
			enrichedMeals = append(enrichedMeals, next)
			dayCalories += next.Calories
		}

		day.Nutrition.Meals = enrichedMeals
		if day.Nutrition.CaloriesTarget == 0 && dayCalories > 0 {
			day.Nutrition.CaloriesTarget = int(math.Round(dayCalories))
		}
		planByDay[key] = day
	}

	return planByDay
}
