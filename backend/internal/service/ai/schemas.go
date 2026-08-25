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
	// ServingLabel is the household-measure equivalent of AmountG (e.g. "۱ لیوان
	// برنج پخته", "۲ قاشق غذاخوری روغن") so the UI can show grams alongside a
	// measure users actually reach for at home.
	ServingLabel string  `json:"serving_label"`
	Calories     int     `json:"calories"`
	ProteinG     float64 `json:"protein_g"`
	CarbsG       float64 `json:"carbs_g"`
	FatG         float64 `json:"fat_g"`
}

// NutritionWeekDaySchema is one day inside a weekly nutrition plan. DayName
// must be one of شنبه..جمعه, in that order, seven entries — mirrors the
// existing coach day-of-week convention (DayNumber 1..7 = sat..fri, see
// dayNumberToKey in backend/internal/service/program_mapper.go) so a weekly
// AI plan can be reviewed/edited with the coach's existing per-day editor.
type NutritionWeekDaySchema struct {
	DayName string       `json:"day_name"`
	Meals   []MealSchema `json:"meals"`
}

// NutritionWeekSchema is the structured AI output for a 7-day nutrition plan.
type NutritionWeekSchema struct {
	GoalType      string                   `json:"goal_type"`
	TotalCalories int                      `json:"total_calories"`
	ProteinG      int                      `json:"protein_g"`
	CarbsG        int                      `json:"carbs_g"`
	FatG          int                      `json:"fat_g"`
	Days          []NutritionWeekDaySchema `json:"days"`
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

// IngredientSuggestionSchema is an improvised recipe built from ingredients the
// user already has at home (roadmap BE-1.9).
type IngredientSuggestionSchema struct {
	RecipeName    string     `json:"recipe_name"`
	Instructions  string     `json:"instructions"`
	Items         []FoodItem `json:"items"`
	TotalCalories int        `json:"total_calories"`
}

// ProgressAnalysisSchema is the AI-written human summary of a deterministically
// computed weekly/monthly report (roadmap BE-4.3). The numbers themselves are
// always computed in Go beforehand — AI only turns them into readable Persian text.
type ProgressAnalysisSchema struct {
	SummaryText string `json:"summary_text"`
	Highlight   string `json:"highlight"`
	// PainSeverity is empty unless the prompt included pain-note text to
	// assess — one of "خفیف"|"متوسط"|"شدید" when a discomfort area was reported.
	PainSeverity string `json:"pain_severity"`
}

// FoodLogSchema is used later for voice food logging (phase 2 roadmap).
type FoodLogSchema struct {
	Items []FoodItem `json:"items"`
	Notes string     `json:"notes"`
	// Transcript is the raw STT text (Shenava/Whisper). Set by the server after
	// transcription — not produced by the structured LLM schema.
	Transcript string `json:"transcript,omitempty"`
}

// SetLogSchema is used later for voice set logging (phase 3 roadmap).
type SetLogSchema struct {
	ExerciseName string  `json:"exercise_name"`
	WeightKg     float64 `json:"weight_kg"`
	Reps         int     `json:"reps"`
	IsPR         bool    `json:"is_pr"`
}

// WorkoutNoteSummarySchema cleans up a raw voice-transcribed note from the
// post-workout survey into a tidy Persian paragraph — no data extraction,
// just structuring/cleanup of what the user said.
type WorkoutNoteSummarySchema struct {
	Text string `json:"text"`
}

// FunnelChartBarSchema is one axis on the biomechanics radar chart (0–100).
type FunnelChartBarSchema struct {
	Label string `json:"label"`
	Value int    `json:"value"`
}

// FunnelAnalysisSchema is the sales-funnel AI packet shown on the result
// screen (warning, narrative blocks, 12-week trend, radar chart, payment copy).
type FunnelAnalysisSchema struct {
	AIWarning            string                 `json:"ai_warning"`
	StatusSummaryTitle   string                 `json:"status_summary_title"`
	StatusSummaryBody    string                 `json:"status_summary_body"`
	CustomSolutionTitle  string                 `json:"custom_solution_title"`
	CustomSolutionBody   string                 `json:"custom_solution_body"`
	RoutePredictionTitle string                 `json:"route_prediction_title"`
	RoutePredictionBody  string                 `json:"route_prediction_body"`
	SuccessPct           int                    `json:"success_pct"`
	TrendChartTitle      string                 `json:"trend_chart_title"`
	TrendChartYLabel     string                 `json:"trend_chart_y_label"`
	TrendChartValues     []int                  `json:"trend_chart_values"`
	TrendChartYMax       int                    `json:"trend_chart_y_max"`
	ChartBars            []FunnelChartBarSchema `json:"chart_bars"`
	AnalysisReadyTitle   string                 `json:"analysis_ready_title"`
	AnalysisReadyBody    string                 `json:"analysis_ready_body"`
	AIGuard              string                 `json:"ai_guard"`
}

// ProgressAnalysisJSONSchema returns the OpenAI json_schema object for the
// weekly/monthly deep-dive text summary (roadmap BE-4.3).
func ProgressAnalysisJSONSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"summary_text":  map[string]string{"type": "string"},
			"highlight":     map[string]string{"type": "string"},
			"pain_severity": map[string]string{"type": "string"},
		},
		"required":             []string{"summary_text", "highlight", "pain_severity"},
		"additionalProperties": false,
	}
}

// SetLogJSONSchema returns the OpenAI json_schema object for voice-transcribed
// workout set entries (roadmap BE-3.5).
func SetLogJSONSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"exercise_name": map[string]string{"type": "string"},
			"weight_kg":     map[string]string{"type": "number"},
			"reps":          map[string]string{"type": "integer"},
			"is_pr":         map[string]string{"type": "boolean"},
		},
		"required":             []string{"exercise_name", "weight_kg", "reps", "is_pr"},
		"additionalProperties": false,
	}
}

// FunnelAnalysisJSONSchema returns the OpenAI json_schema object for the
// public sales-funnel analysis packet.
func FunnelAnalysisJSONSchema() map[string]interface{} {
	str := map[string]string{"type": "string"}
	chartBar := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"label": str,
			"value": map[string]string{"type": "integer"},
		},
		"required":             []string{"label", "value"},
		"additionalProperties": false,
	}
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"ai_warning":             str,
			"status_summary_title":   str,
			"status_summary_body":    str,
			"custom_solution_title":  str,
			"custom_solution_body":   str,
			"route_prediction_title": str,
			"route_prediction_body":  str,
			"success_pct":            map[string]string{"type": "integer"},
			"trend_chart_title":      str,
			"trend_chart_y_label":    str,
			"trend_chart_values": map[string]interface{}{
				"type":     "array",
				"items":    map[string]string{"type": "integer"},
				"minItems": 12,
				"maxItems": 12,
			},
			"trend_chart_y_max": map[string]string{"type": "integer"},
			"chart_bars": map[string]interface{}{
				"type":     "array",
				"items":    chartBar,
				"minItems": 5,
				"maxItems": 5,
			},
			"analysis_ready_title": str,
			"analysis_ready_body":  str,
			"ai_guard":               str,
		},
		"required": []string{
			"ai_warning",
			"status_summary_title",
			"status_summary_body",
			"custom_solution_title",
			"custom_solution_body",
			"route_prediction_title",
			"route_prediction_body",
			"success_pct",
			"trend_chart_title",
			"trend_chart_y_label",
			"trend_chart_values",
			"trend_chart_y_max",
			"chart_bars",
			"analysis_ready_title",
			"analysis_ready_body",
			"ai_guard",
		},
		"additionalProperties": false,
	}
}

// WorkoutNoteSummaryJSONSchema returns the OpenAI json_schema object for
// cleaning up a raw voice-transcribed post-workout note.
func WorkoutNoteSummaryJSONSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"text": map[string]string{"type": "string"},
		},
		"required":             []string{"text"},
		"additionalProperties": false,
	}
}

// NutritionPlanJSONSchema returns the OpenAI json_schema object for nutrition plans.
func NutritionPlanJSONSchema() map[string]interface{} {
	foodItem := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"food_name":     map[string]string{"type": "string"},
			"amount_g":      map[string]string{"type": "number"},
			"serving_label": map[string]string{"type": "string"},
			"calories":      map[string]string{"type": "integer"},
			"protein_g":     map[string]string{"type": "number"},
			"carbs_g":       map[string]string{"type": "number"},
			"fat_g":         map[string]string{"type": "number"},
		},
		"required":             []string{"food_name", "amount_g", "serving_label", "calories", "protein_g", "carbs_g", "fat_g"},
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

// NutritionWeekJSONSchema returns the OpenAI json_schema object for a 7-day
// nutrition plan (roadmap Phase 3: برنامه هفتگی).
func NutritionWeekJSONSchema() map[string]interface{} {
	foodItem := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"food_name":     map[string]string{"type": "string"},
			"amount_g":      map[string]string{"type": "number"},
			"serving_label": map[string]string{"type": "string"},
			"calories":      map[string]string{"type": "integer"},
			"protein_g":     map[string]string{"type": "number"},
			"carbs_g":       map[string]string{"type": "number"},
			"fat_g":         map[string]string{"type": "number"},
		},
		"required":             []string{"food_name", "amount_g", "serving_label", "calories", "protein_g", "carbs_g", "fat_g"},
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
	day := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"day_name": map[string]string{"type": "string"},
			"meals": map[string]interface{}{
				"type":  "array",
				"items": meal,
			},
		},
		"required":             []string{"day_name", "meals"},
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
			"days": map[string]interface{}{
				"type":  "array",
				"items": day,
			},
		},
		"required":             []string{"goal_type", "total_calories", "protein_g", "carbs_g", "fat_g", "days"},
		"additionalProperties": false,
	}
}

// MealJSONSchema returns the OpenAI json_schema object for a single replacement
// meal (used by "تغییر این وعده" — regenerating one meal of a daily/weekly plan
// without regenerating the whole plan).
func MealJSONSchema() map[string]interface{} {
	foodItem := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"food_name":     map[string]string{"type": "string"},
			"amount_g":      map[string]string{"type": "number"},
			"serving_label": map[string]string{"type": "string"},
			"calories":      map[string]string{"type": "integer"},
			"protein_g":     map[string]string{"type": "number"},
			"carbs_g":       map[string]string{"type": "number"},
			"fat_g":         map[string]string{"type": "number"},
		},
		"required":             []string{"food_name", "amount_g", "serving_label", "calories", "protein_g", "carbs_g", "fat_g"},
		"additionalProperties": false,
	}
	return map[string]interface{}{
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
}

// IngredientSuggestionJSONSchema returns the OpenAI json_schema object for
// improvised ingredient-based recipe suggestions (roadmap BE-1.9).
func IngredientSuggestionJSONSchema() map[string]interface{} {
	foodItem := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"food_name":     map[string]string{"type": "string"},
			"amount_g":      map[string]string{"type": "number"},
			"serving_label": map[string]string{"type": "string"},
			"calories":      map[string]string{"type": "integer"},
			"protein_g":     map[string]string{"type": "number"},
			"carbs_g":       map[string]string{"type": "number"},
			"fat_g":         map[string]string{"type": "number"},
		},
		"required":             []string{"food_name", "amount_g", "serving_label", "calories", "protein_g", "carbs_g", "fat_g"},
		"additionalProperties": false,
	}
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"recipe_name":   map[string]string{"type": "string"},
			"instructions":  map[string]string{"type": "string"},
			"total_calories": map[string]string{"type": "integer"},
			"items": map[string]interface{}{
				"type":  "array",
				"items": foodItem,
			},
		},
		"required":             []string{"recipe_name", "instructions", "items", "total_calories"},
		"additionalProperties": false,
	}
}

// FoodLogJSONSchema returns the OpenAI json_schema object for voice-transcribed
// food log entries (roadmap BE-2.4).
func FoodLogJSONSchema() map[string]interface{} {
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
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"items": map[string]interface{}{
				"type":  "array",
				"items": foodItem,
			},
			"notes": map[string]string{"type": "string"},
		},
		"required":             []string{"items", "notes"},
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
