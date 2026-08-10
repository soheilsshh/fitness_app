package ai

import "testing"

func TestValidateNutritionPlan_RejectsBadCalories(t *testing.T) {
	badPlan := &NutritionPlanSchema{
		GoalType:      GoalCut,
		TotalCalories: 50,
		Meals: []MealSchema{
			{Name: "صبحانه", Items: []FoodItem{{FoodName: "نان", Calories: 50}}},
		},
	}
	err := ValidateNutritionPlan(badPlan)
	if err == nil {
		t.Error("انتظار داشتیم خطا بگیریم ولی نگرفتیم — یعنی validation کار نمی‌کنه")
	}
}

func TestValidateNutritionPlan_RejectsEmptyMeals(t *testing.T) {
	badPlan := &NutritionPlanSchema{
		GoalType:      GoalBulk,
		TotalCalories: 2000,
		Meals:         []MealSchema{},
	}
	err := ValidateNutritionPlan(badPlan)
	if err == nil {
		t.Error("انتظار داشتیم خطا بگیریم ولی نگرفتیم")
	}
}

func TestValidateNutritionPlan_AcceptsValid(t *testing.T) {
	plan := &NutritionPlanSchema{
		GoalType:      GoalMaintain,
		TotalCalories: 920,
		ProteinG:      150,
		CarbsG:        220,
		FatG:          70,
		Meals: []MealSchema{
			{
				Name: "صبحانه",
				Items: []FoodItem{
					{FoodName: "تخم‌مرغ", AmountG: 100, Calories: 155, ProteinG: 13},
					{FoodName: "نان", AmountG: 60, Calories: 165, ProteinG: 5},
				},
			},
			{
				Name: "ناهار",
				Items: []FoodItem{
					{FoodName: "مرغ", AmountG: 150, Calories: 250, ProteinG: 40},
					{FoodName: "برنج", AmountG: 150, Calories: 200, ProteinG: 4},
				},
			},
			{
				Name: "شام",
				Items: []FoodItem{
					{FoodName: "ماست", AmountG: 200, Calories: 150, ProteinG: 12},
				},
			},
		},
	}
	if err := ValidateNutritionPlan(plan); err != nil {
		t.Fatalf("valid plan rejected: %v", err)
	}
}

func TestValidateWorkoutPlan_RejectsEmptyDays(t *testing.T) {
	bad := &WorkoutPlanSchema{GoalType: WorkoutHypertrophy, Days: nil}
	if err := ValidateWorkoutPlan(bad); err == nil {
		t.Fatal("expected error for empty days")
	}
}

func TestValidateWorkoutPlan_AcceptsValid(t *testing.T) {
	plan := &WorkoutPlanSchema{
		GoalType: WorkoutStrength,
		Days: []WorkoutDaySchema{
			{
				DayName: "روز ۱",
				Exercises: []ExerciseSchema{
					{ExerciseName: "ددلیفت", Sets: 3, Reps: "5", RestSeconds: 180},
				},
			},
		},
	}
	if err := ValidateWorkoutPlan(plan); err != nil {
		t.Fatalf("valid workout rejected: %v", err)
	}
}

func TestParsePersona(t *testing.T) {
	if ParsePersona("nutrition") != PersonaNutrition {
		t.Fatal("nutrition")
	}
	if ParsePersona("nope") != PersonaGeneral {
		t.Fatal("fallback")
	}
}
