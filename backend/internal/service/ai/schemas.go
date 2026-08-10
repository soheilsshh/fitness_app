package ai

// Goal types for nutrition plans.
const (
	GoalCut      = "cut"
	GoalBulk     = "bulk"
	GoalMaintain = "maintain"
)

// Workout goal types.
const (
	WorkoutStrength     = "strength"
	WorkoutHypertrophy  = "hypertrophy"
	WorkoutFatLoss      = "fat_loss"
)

// NutritionPlanSchema is the structured AI output for a nutrition plan.
type NutritionPlanSchema struct {
	GoalType      string       `json:"goal_type"` // cut | bulk | maintain
	TotalCalories int          `json:"total_calories"`
	ProteinG      int          `json:"protein_g"`
	CarbsG        int          `json:"carbs_g"`
	FatG          int          `json:"fat_g"`
	Meals         []MealSchema `json:"meals"`
}

// MealSchema is one meal inside a nutrition plan.
type MealSchema struct {
	Name  string     `json:"name"`
	Items []FoodItem `json:"items"`
}

// FoodItem is a single food entry with macros.
type FoodItem struct {
	FoodName string  `json:"food_name"`
	AmountG  float64 `json:"amount_g"`
	Calories int     `json:"calories"`
	ProteinG float64 `json:"protein_g"`
	CarbsG   float64 `json:"carbs_g"`
	FatG     float64 `json:"fat_g"`
}

// WorkoutPlanSchema is the structured AI output for a workout plan.
type WorkoutPlanSchema struct {
	GoalType string             `json:"goal_type"` // strength | hypertrophy | fat_loss
	Days     []WorkoutDaySchema `json:"days"`
}

// WorkoutDaySchema is one training day.
type WorkoutDaySchema struct {
	DayName   string           `json:"day_name"`
	Exercises []ExerciseSchema `json:"exercises"`
}

// ExerciseSchema is one exercise prescription.
type ExerciseSchema struct {
	ExerciseName string `json:"exercise_name"`
	Sets         int    `json:"sets"`
	Reps         string `json:"reps"` // e.g. "8-12"
	RestSeconds  int    `json:"rest_seconds"`
}

// FoodLogSchema is used later for voice food logging (phase 2 roadmap).
type FoodLogSchema struct {
	Items []FoodItem `json:"items"`
	Notes string     `json:"notes"`
}

// SetLogSchema is used later for voice set logging (phase 3 roadmap).
type SetLogSchema struct {
	ExerciseName string  `json:"exercise_name"`
	WeightKg     float64 `json:"weight_kg"`
	Reps         int     `json:"reps"`
	IsPR         bool    `json:"is_pr"`
}

// NutritionPlanJSONSchema returns the OpenAI json_schema object for nutrition plans.
func NutritionPlanJSONSchema() map[string]interface{} {
	foodItem := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"food_name": map[string]string{"type": "string"},
			"amount_g":  map[string]string{"type": "number"},
			"calories":  map[string]string{"type": "integer"},
			"protein_g": map[string]string{"type": "number"},
			"carbs_g":   map[string]string{"type": "number"},
			"fat_g":     map[string]string{"type": "number"},
		},
		"required":             []string{"food_name", "amount_g", "calories", "protein_g", "carbs_g", "fat_g"},
		"additionalProperties": false,
	}
	meal := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"name": map[string]string{"type": "string"},
			"items": map[string]interface{}{
				"type":  "array",
				"items": foodItem,
			},
		},
		"required":             []string{"name", "items"},
		"additionalProperties": false,
	}
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"goal_type":      map[string]interface{}{"type": "string", "enum": []string{GoalCut, GoalBulk, GoalMaintain}},
			"total_calories": map[string]string{"type": "integer"},
			"protein_g":      map[string]string{"type": "integer"},
			"carbs_g":        map[string]string{"type": "integer"},
			"fat_g":          map[string]string{"type": "integer"},
			"meals": map[string]interface{}{
				"type":  "array",
				"items": meal,
			},
		},
		"required":             []string{"goal_type", "total_calories", "protein_g", "carbs_g", "fat_g", "meals"},
		"additionalProperties": false,
	}
}

// WorkoutPlanJSONSchema returns the OpenAI json_schema object for workout plans.
func WorkoutPlanJSONSchema() map[string]interface{} {
	exercise := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"exercise_name": map[string]string{"type": "string"},
			"sets":          map[string]string{"type": "integer"},
			"reps":          map[string]string{"type": "string"},
			"rest_seconds":  map[string]string{"type": "integer"},
		},
		"required":             []string{"exercise_name", "sets", "reps", "rest_seconds"},
		"additionalProperties": false,
	}
	day := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"day_name": map[string]string{"type": "string"},
			"exercises": map[string]interface{}{
				"type":  "array",
				"items": exercise,
			},
		},
		"required":             []string{"day_name", "exercises"},
		"additionalProperties": false,
	}
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"goal_type": map[string]interface{}{
				"type": "string",
				"enum": []string{WorkoutStrength, WorkoutHypertrophy, WorkoutFatLoss},
			},
			"days": map[string]interface{}{
				"type":  "array",
				"items": day,
			},
		},
		"required":             []string{"goal_type", "days"},
		"additionalProperties": false,
	}
}
