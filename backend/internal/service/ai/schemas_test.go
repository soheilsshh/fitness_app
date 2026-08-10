package ai

import (
	"encoding/json"
	"testing"
)

func TestSchemaNutritionFixtureUnmarshal(t *testing.T) {
	raw := []byte(`{
  "goal_type": "cut",
  "total_calories": 2100,
  "protein_g": 160,
  "carbs_g": 200,
  "fat_g": 60,
  "meals": [
    {
      "name": "صبحانه",
      "items": [
        {"food_name": "تخم‌مرغ آب‌پز", "amount_g": 100, "calories": 155, "protein_g": 13, "carbs_g": 1.1, "fat_g": 11}
      ]
    }
  ]
}`)
	var plan NutritionPlanSchema
	if err := json.Unmarshal(raw, &plan); err != nil {
		t.Fatalf("unmarshal nutrition fixture: %v", err)
	}
	if plan.TotalCalories != 2100 || len(plan.Meals) != 1 {
		t.Fatalf("unexpected plan: %+v", plan)
	}
	if plan.Meals[0].Items[0].FoodName == "" {
		t.Fatal("food_name empty")
	}
}

func TestSchemaWorkoutFixtureUnmarshal(t *testing.T) {
	raw := []byte(`{
  "goal_type": "hypertrophy",
  "days": [
    {
      "day_name": "روز ۱",
      "exercises": [
        {"exercise_name": "اسکوات", "sets": 4, "reps": "8-10", "rest_seconds": 120}
      ]
    }
  ]
}`)
	var plan WorkoutPlanSchema
	if err := json.Unmarshal(raw, &plan); err != nil {
		t.Fatalf("unmarshal workout fixture: %v", err)
	}
	if len(plan.Days) != 1 || plan.Days[0].Exercises[0].Sets != 4 {
		t.Fatalf("unexpected plan: %+v", plan)
	}
}

func TestNutritionPlanJSONSchemaShape(t *testing.T) {
	s := NutritionPlanJSONSchema()
	if s["type"] != "object" {
		t.Fatal("expected object schema")
	}
	props, ok := s["properties"].(map[string]interface{})
	if !ok || props["meals"] == nil || props["total_calories"] == nil {
		t.Fatal("nutrition schema missing required properties")
	}
}
