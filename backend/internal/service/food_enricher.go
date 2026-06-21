package service

import (
	"context"
	"fmt"
	"math"

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

func nutritionItemToMealDTO(it models.NutritionItem) MeMealDTO {
	multiplier := mealMultiplier(it.Multiplier)
	detail := it.Quantity
	if detail == "" && it.Calories > 0 {
		detail = fmt.Sprintf("%d کالری", it.Calories)
	} else if it.Calories > 0 {
		detail += fmt.Sprintf(" — %d کالری", it.Calories)
	}

	meal := MeMealDTO{
		Title:      it.Food,
		Detail:     detail,
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
