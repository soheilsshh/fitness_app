package service

import "testing"

func TestCalculateNutritionTargets_MaintainMale(t *testing.T) {
	bd := "1995-01-01"
	res := CalculateNutritionTargets(NutritionCalcInput{
		Gender: "male", WeightKg: 80, HeightCm: 180, BirthDate: &bd, Goal: "maintain",
	})
	if res.BMR <= 0 || res.TDEE <= res.BMR {
		t.Fatalf("expected TDEE > BMR > 0, got BMR=%d TDEE=%d", res.BMR, res.TDEE)
	}
	if res.TargetCalories < 1200 || res.TargetCalories > 6000 {
		t.Fatalf("target calories out of sane range: %d", res.TargetCalories)
	}
	if res.ProteinG <= 0 || res.CarbsG <= 0 || res.FatG <= 0 {
		t.Fatalf("expected positive macros, got protein=%d carbs=%d fat=%d", res.ProteinG, res.CarbsG, res.FatG)
	}
}

func TestCalculateNutritionTargets_CutIsLowerThanBulk(t *testing.T) {
	bd := "1995-01-01"
	cut := CalculateNutritionTargets(NutritionCalcInput{Gender: "female", WeightKg: 65, HeightCm: 165, BirthDate: &bd, Goal: "cut"})
	bulk := CalculateNutritionTargets(NutritionCalcInput{Gender: "female", WeightKg: 65, HeightCm: 165, BirthDate: &bd, Goal: "bulk"})
	if cut.TargetCalories >= bulk.TargetCalories {
		t.Fatalf("expected cut (%d) < bulk (%d)", cut.TargetCalories, bulk.TargetCalories)
	}
}

func TestCalculateNutritionTargets_DefaultsWhenMissing(t *testing.T) {
	res := CalculateNutritionTargets(NutritionCalcInput{})
	if res.BMR <= 0 || res.TargetCalories <= 0 {
		t.Fatalf("expected sane defaults, got BMR=%d target=%d", res.BMR, res.TargetCalories)
	}
	if res.Goal != "maintain" {
		t.Fatalf("expected default goal maintain, got %s", res.Goal)
	}
}

func TestCalculateNutritionTargets_OptionalOverride(t *testing.T) {
	base := CalculateNutritionTargets(NutritionCalcInput{Gender: "male", WeightKg: 80, HeightCm: 180, Goal: "maintain"})
	over := CalculateNutritionTargets(NutritionCalcInput{Gender: "male", WeightKg: 80, HeightCm: 180, Goal: "maintain", TargetCalories: 2000})
	if over.TargetCalories != 2000 {
		t.Fatalf("override calories=%d", over.TargetCalories)
	}
	if over.TargetCalories == base.TargetCalories {
		t.Fatal("override should differ from auto target")
	}
}

func TestCalculateNutritionTargets_BodyFatUsesKatchMcArdle(t *testing.T) {
	bf := 15.0
	withBF := CalculateNutritionTargets(NutritionCalcInput{Gender: "male", WeightKg: 80, HeightCm: 180, BodyFatPercent: &bf})
	withoutBF := CalculateNutritionTargets(NutritionCalcInput{Gender: "male", WeightKg: 80, HeightCm: 180})
	if withBF.BMR == withoutBF.BMR {
		t.Fatalf("expected body-fat aware BMR to differ from Mifflin-St Jeor estimate")
	}
}
