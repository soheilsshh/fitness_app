package service

import (
	"testing"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/service/ai"
)

func TestNutritionWeekToItems_snackNotLabeledLunch(t *testing.T) {
	plan := &ai.NutritionWeekSchema{
		GoalType:      ai.GoalCut,
		TotalCalories: 2315,
		Days: []ai.NutritionWeekDaySchema{
			{
				DayName: "شنبه",
				Meals: []ai.MealSchema{
					{Name: "صبحانه", Items: []ai.FoodItem{{FoodName: "تخم مرغ", Calories: 150}}},
					{Name: "میان وعده صبح", Items: []ai.FoodItem{{FoodName: "سیب", Calories: 100}}},
					{Name: "ناهار", Items: []ai.FoodItem{
						{FoodName: "سینه مرغ", Calories: 250},
						{FoodName: "برنج", Calories: 130},
					}},
					{Name: "میان وعده عصر", Items: []ai.FoodItem{{FoodName: "موز", Calories: 100}}},
					{Name: "شام", Items: []ai.FoodItem{{FoodName: "ماهی", Calories: 300}}},
				},
			},
		},
	}

	items := nutritionWeekToItems(plan)
	slotOf := map[string]string{}
	for _, it := range items {
		slotOf[it.Food] = it.MealSlot
	}
	if slotOf["سیب"] != MealSlotSnack1 {
		t.Fatalf("apple slot=%q want snack1", slotOf["سیب"])
	}
	if slotOf["موز"] != MealSlotSnack2 {
		t.Fatalf("banana slot=%q want snack2", slotOf["موز"])
	}
	if slotOf["سینه مرغ"] != MealSlotLunch {
		t.Fatalf("chicken slot=%q want lunch", slotOf["سینه مرغ"])
	}
	if slotOf["ماهی"] != MealSlotDinner {
		t.Fatalf("fish slot=%q want dinner", slotOf["ماهی"])
	}
}

func TestNutritionItemsToPlanByDay_remapsAINotes(t *testing.T) {
	items := []models.NutritionItem{
		{DayNumber: 1, Food: "سیب", MealSlot: MealSlotLunch, Notes: "میان وعده صبح", Calories: 100},
		{DayNumber: 1, Food: "سینه مرغ", MealSlot: MealSlotSnack1, Notes: "ناهار", Calories: 250},
		{DayNumber: 1, Food: "موز", MealSlot: MealSlotDinner, Notes: "میان وعده عصر", Calories: 100},
		{DayNumber: 1, Food: "ماهی", MealSlot: MealSlotSnack2, Notes: "شام", Calories: 300},
	}
	plan := nutritionItemsToPlanByDay(items)
	day := plan["sat"]
	if day.Nutrition == nil {
		t.Fatal("missing sat nutrition")
	}
	slotOf := map[string]string{}
	for _, m := range day.Nutrition.Meals {
		slotOf[m.Title] = m.MealSlot
	}
	if slotOf["سیب"] != MealSlotSnack1 {
		t.Fatalf("apple displayed as %q", slotOf["سیب"])
	}
	if slotOf["موز"] != MealSlotSnack2 {
		t.Fatalf("banana displayed as %q", slotOf["موز"])
	}
	if slotOf["سینه مرغ"] != MealSlotLunch {
		t.Fatalf("chicken displayed as %q", slotOf["سینه مرغ"])
	}
	if slotOf["ماهی"] != MealSlotDinner {
		t.Fatalf("fish displayed as %q", slotOf["ماهی"])
	}
}
