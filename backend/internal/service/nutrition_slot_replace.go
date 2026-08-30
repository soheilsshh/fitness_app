package service

import (
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/service/ai"
)

type TodayMealSlotDTO struct {
	Slot     string   `json:"slot"`
	Label    string   `json:"label"`
	Foods    []string `json:"foods"`
	Calories int      `json:"calories"`
	Empty    bool     `json:"empty"`
}

type TodayNutritionSlotsResult struct {
	HasProgram bool               `json:"hasProgram"`
	DayNumber  int                `json:"dayNumber"`
	Slots      []TodayMealSlotDTO `json:"slots"`
}

func emptyTodaySlots() []TodayMealSlotDTO {
	out := make([]TodayMealSlotDTO, 0, len(mealSlotOrder))
	for _, slot := range mealSlotOrder {
		out = append(out, TodayMealSlotDTO{
			Slot:  slot,
			Label: MealSlotLabel(slot),
			Foods: []string{},
			Empty: true,
		})
	}
	return out
}

func groupTodayMealSlots(items []models.NutritionItem, dayNum int) []TodayMealSlotDTO {
	type acc struct {
		foods []string
		seen  map[string]bool
		cal   int
	}
	by := map[string]*acc{}
	for _, it := range items {
		if it.DayNumber != dayNum {
			continue
		}
		slot := strings.TrimSpace(it.MealSlot)
		if !IsValidMealSlot(slot) {
			continue
		}
		a := by[slot]
		if a == nil {
			a = &acc{seen: map[string]bool{}}
			by[slot] = a
		}
		name := strings.TrimSpace(it.Food)
		if name != "" && !a.seen[name] {
			a.foods = append(a.foods, name)
			a.seen[name] = true
		}
		a.cal += it.Calories
	}
	out := emptyTodaySlots()
	for i := range out {
		if a := by[out[i].Slot]; a != nil {
			out[i].Foods = a.foods
			out[i].Calories = a.cal
			out[i].Empty = len(a.foods) == 0
		}
	}
	return out
}

func suggestionToNutritionItems(suggestion *ai.IngredientSuggestionSchema, dayNum int, slot string) []models.NutritionItem {
	mealName := strings.TrimSpace(suggestion.RecipeName)
	if mealName == "" {
		mealName = MealSlotLabel(slot)
	}
	items := make([]models.NutritionItem, 0, len(suggestion.Items))
	for i, food := range suggestion.Items {
		items = append(items, models.NutritionItem{
			DayNumber:  dayNum,
			OrderIndex: i,
			MealSlot:   slot,
			Food:       food.FoodName,
			Quantity:   fmt.Sprintf("%.0f گرم", food.AmountG),
			Multiplier: 1,
			Calories:   food.Calories,
			Protein:    food.ProteinG,
			Carbs:      food.CarbsG,
			Fat:        food.FatG,
			Notes:      mealName,
		})
	}
	return items
}

func replaceNutritionSlot(existing []models.NutritionItem, dayNum int, slot string, incoming []models.NutritionItem) []models.NutritionItem {
	kept := make([]models.NutritionItem, 0, len(existing))
	mealNum := 0
	for _, it := range existing {
		if it.DayNumber == dayNum && it.MealSlot == slot {
			if mealNum == 0 {
				mealNum = it.MealNumber
			}
			continue
		}
		kept = append(kept, it)
	}
	if mealNum <= 0 {
		maxMeal := 0
		for _, it := range existing {
			if it.DayNumber == dayNum && it.MealNumber > maxMeal {
				maxMeal = it.MealNumber
			}
		}
		mealNum = maxMeal + 1
		if mealNum < 1 {
			mealNum = 1
		}
	}
	for i := range incoming {
		incoming[i].DayNumber = dayNum
		incoming[i].MealSlot = slot
		incoming[i].MealNumber = mealNum
		incoming[i].OrderIndex = i
	}
	merged := make([]models.NutritionItem, 0, len(kept)+len(incoming))
	merged = append(merged, kept...)
	merged = append(merged, incoming...)
	for i := range merged {
		merged[i].ID = 0
		merged[i].CreatedAt = time.Time{}
		merged[i].UpdatedAt = time.Time{}
		merged[i].DeletedAt = gorm.DeletedAt{}
	}
	return merged
}
