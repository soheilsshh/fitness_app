package service

import (
	"testing"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/service/ai"
)

func TestReplaceNutritionSlot_swapsOnlyChosenMeal(t *testing.T) {
	existing := []models.NutritionItem{
		{DayNumber: 1, MealNumber: 1, MealSlot: MealSlotBreakfast, Food: "نان", Calories: 200},
		{DayNumber: 1, MealNumber: 2, MealSlot: MealSlotLunch, Food: "مرغ", Calories: 400},
		{DayNumber: 1, MealNumber: 3, MealSlot: MealSlotDinner, Food: "ماهی", Calories: 350},
		{DayNumber: 2, MealNumber: 2, MealSlot: MealSlotLunch, Food: "عدس", Calories: 300},
	}
	incoming := []models.NutritionItem{
		{Food: "سالاد", Calories: 180},
		{Food: "ماست", Calories: 80},
	}
	got := replaceNutritionSlot(existing, 1, MealSlotLunch, incoming)

	foods := map[string]bool{}
	for _, it := range got {
		foods[it.Food] = true
		if it.DayNumber == 1 && it.MealSlot == MealSlotLunch && it.MealNumber != 2 {
			t.Fatalf("replaced lunch mealNumber=%d want 2", it.MealNumber)
		}
	}
	if foods["مرغ"] {
		t.Fatal("old lunch should be gone")
	}
	if !foods["نان"] || !foods["ماهی"] || !foods["عدس"] || !foods["سالاد"] || !foods["ماست"] {
		t.Fatalf("unexpected foods: %#v", foods)
	}
}

func TestGroupTodayMealSlots_fillsCanonicalSlots(t *testing.T) {
	items := []models.NutritionItem{
		{DayNumber: 3, MealSlot: MealSlotBreakfast, Food: "تخم‌مرغ", Calories: 150},
		{DayNumber: 3, MealSlot: MealSlotBreakfast, Food: "نان", Calories: 120},
		{DayNumber: 4, MealSlot: MealSlotLunch, Food: "برنج", Calories: 400},
	}
	slots := groupTodayMealSlots(items, 3)
	if len(slots) != 6 {
		t.Fatalf("slots=%d", len(slots))
	}
	if slots[0].Slot != MealSlotBreakfast || slots[0].Empty || slots[0].Calories != 270 {
		t.Fatalf("breakfast=%#v", slots[0])
	}
	if !slots[1].Empty {
		t.Fatalf("lunch should be empty today, got %#v", slots[1])
	}
}

func TestSuggestionToNutritionItems_usesChosenSlot(t *testing.T) {
	s := &ai.IngredientSuggestionSchema{
		RecipeName:    "املت",
		TotalCalories: 320,
		Items:         []ai.FoodItem{{FoodName: "تخم‌مرغ", AmountG: 100, Calories: 320}},
	}
	got := suggestionToNutritionItems(s, 2, MealSlotBreakfast)
	if len(got) != 1 || got[0].MealSlot != MealSlotBreakfast || got[0].Notes != "املت" {
		t.Fatalf("%#v", got)
	}
}
