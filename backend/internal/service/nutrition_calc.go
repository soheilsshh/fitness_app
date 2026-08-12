package service

import (
	"math"
	"time"

	"github.com/yourusername/fitness-management/internal/service/ai"
)

// NutritionCalcInput are the raw profile fields needed to compute deterministic
// (non-AI) nutrition targets. All fields are optional; sane adult defaults are
// used when data is missing so the calculator never fails.
type NutritionCalcInput struct {
	Gender         string // "male" | "female"
	WeightKg       float64
	HeightCm       float64
	BirthDate      *string // "2006-01-02", optional
	BodyFatPercent *float64
	Goal           string // cut | bulk | maintain (defaults to maintain)
}

// NutritionTargets holds deterministic daily calorie & macro targets, computed
// with the Mifflin-St Jeor formula (Katch-McArdle when body-fat % is known).
// This intentionally does NOT call AI (roadmap BE-1.1): the number crunching is
// exact Go math, AI is only used later to turn targets into a meal plan.
type NutritionTargets struct {
	BMR            int    `json:"bmr"`
	TDEE           int    `json:"tdee"`
	Goal           string `json:"goal"`
	TargetCalories int    `json:"targetCalories"`
	ProteinG       int    `json:"proteinG"`
	CarbsG         int    `json:"carbsG"`
	FatG           int    `json:"fatG"`
}

// defaultActivityMultiplier assumes moderate activity (3-5 workouts/week).
// User has no dedicated activity-level field yet; revisit if one is added.
const defaultActivityMultiplier = 1.55

// CalculateNutritionTargets computes BMR/TDEE/macros without calling AI.
func CalculateNutritionTargets(in NutritionCalcInput) NutritionTargets {
	weight := in.WeightKg
	if weight <= 0 {
		weight = 70
	}
	height := in.HeightCm
	if height <= 0 {
		height = 170
	}
	age := ageFromBirthDate(in.BirthDate)

	var bmr float64
	if in.BodyFatPercent != nil && *in.BodyFatPercent > 3 && *in.BodyFatPercent < 70 {
		leanMass := weight * (1 - *in.BodyFatPercent/100)
		bmr = 370 + 21.6*leanMass // Katch-McArdle
	} else if in.Gender == "female" {
		bmr = 10*weight + 6.25*height - 5*float64(age) - 161
	} else {
		bmr = 10*weight + 6.25*height - 5*float64(age) + 5 // Mifflin-St Jeor
	}
	if bmr < 800 {
		bmr = 800
	}

	tdee := bmr * defaultActivityMultiplier

	goal := in.Goal
	switch goal {
	case ai.GoalCut, ai.GoalBulk:
	default:
		goal = ai.GoalMaintain
	}

	target := tdee
	switch goal {
	case ai.GoalCut:
		target = tdee * 0.8
	case ai.GoalBulk:
		target = tdee * 1.1
	}
	if target < 1200 {
		target = 1200
	}

	proteinPerKg := 1.8
	if goal == ai.GoalCut {
		proteinPerKg = 2.0 // preserve lean mass in a deficit
	}
	proteinG := weight * proteinPerKg
	proteinCalories := proteinG * 4

	fatCalories := target * 0.25
	fatG := fatCalories / 9

	carbCalories := target - proteinCalories - fatCalories
	if carbCalories < 0 {
		carbCalories = 0
	}
	carbsG := carbCalories / 4

	return NutritionTargets{
		BMR:            int(math.Round(bmr)),
		TDEE:           int(math.Round(tdee)),
		Goal:           goal,
		TargetCalories: int(math.Round(target)),
		ProteinG:       int(math.Round(proteinG)),
		CarbsG:         int(math.Round(carbsG)),
		FatG:           int(math.Round(fatG)),
	}
}

func ageFromBirthDate(birthDate *string) int {
	if birthDate == nil || *birthDate == "" {
		return 30
	}
	parsed, err := time.Parse("2006-01-02", *birthDate)
	if err != nil {
		return 30
	}
	now := time.Now()
	age := now.Year() - parsed.Year()
	if now.YearDay() < parsed.YearDay() {
		age--
	}
	if age < 10 || age > 100 {
		return 30
	}
	return age
}
