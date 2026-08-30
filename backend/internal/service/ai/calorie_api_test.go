package ai

import (
	"encoding/json"
	"strings"
	"testing"
)

func ptrFloat(v float64) *float64 { return &v }

func TestFoodLogFromCalorieAPI(t *testing.T) {
	got := foodLogFromCalorieAPI(calorieAPIResponse{
		RawText:       "یک لیوان شیر خوردم",
		LowConfidence: true,
		Unmatched:     []string{"قند"},
		Items: []calorieAPIItem{
			{
				Food:     "شیر 3 درصد چربی پاستوریزه",
				Spoken:   "شیر",
				Quantity: ptrFloat(1),
				Unit:     "لیوان",
				Grams:    ptrFloat(240),
				Kcal:     ptrFloat(148.8),
				ProteinG: ptrFloat(7.7),
				CarbsG:   ptrFloat(11.5),
				FatG:     ptrFloat(8.2),
			},
			{Food: ""},
		},
	})

	if got.Transcript != "یک لیوان شیر خوردم" {
		t.Fatalf("transcript=%q", got.Transcript)
	}
	if len(got.Items) != 1 {
		t.Fatalf("items=%d", len(got.Items))
	}
	item := got.Items[0]
	if item.FoodName != "شیر 3 درصد چربی پاستوریزه" {
		t.Fatalf("food=%q", item.FoodName)
	}
	if item.ServingLabel != "1 لیوان" {
		t.Fatalf("label=%q", item.ServingLabel)
	}
	if item.AmountG != 240 || item.Calories != 149 {
		t.Fatalf("amount=%v calories=%d", item.AmountG, item.Calories)
	}
	if item.ProteinG != 7.7 || item.CarbsG != 11.5 || item.FatG != 8.2 {
		t.Fatalf("macros p=%v c=%v f=%v", item.ProteinG, item.CarbsG, item.FatG)
	}
	if item.Spoken != "شیر" || item.Unit != "لیوان" || item.Quantity == nil || *item.Quantity != 1 {
		t.Fatalf("voice qty/unit spoken=%q unit=%q qty=%v", item.Spoken, item.Unit, item.Quantity)
	}
	if got.Notes == "" {
		t.Fatal("expected low-confidence note")
	}
	if len(got.Questions) != 1 || !strings.Contains(got.Questions[0].Text, "قند") {
		t.Fatalf("questions=%v", got.Questions)
	}
	if len(got.Questions[0].Options) != 3 {
		t.Fatalf("question options=%v", got.Questions[0].Options)
	}
}

func TestFoodLogFromCalorieAPIPassesReviewFields(t *testing.T) {
	kcal100 := 130.0
	got := foodLogFromCalorieAPI(calorieAPIResponse{
		RawText: "یه کم برنج",
		Items: []calorieAPIItem{{
			Food:           "برنج سفید بدون گلوتن پخته",
			Spoken:         "برنج",
			NeedsQuantity:  true,
			KcalPer100g:    &kcal100,
			ProteinPer100g: ptrFloat(2.7),
			AvailableUnits: []calorieAvailableUnit{
				{Unit: "گرم", GramsPerUnit: 1},
				{Unit: " ", GramsPerUnit: 9},
			},
		}},
	})
	if len(got.Items) != 1 {
		t.Fatalf("items=%d", len(got.Items))
	}
	item := got.Items[0]
	if !item.NeedsQuantity {
		t.Fatal("expected needs_quantity")
	}
	if item.KcalPer100g == nil || *item.KcalPer100g != 130 {
		t.Fatalf("kcal_per_100g=%v", item.KcalPer100g)
	}
	if len(item.AvailableUnits) != 1 || item.AvailableUnits[0].Unit != "گرم" {
		t.Fatalf("units=%v", item.AvailableUnits)
	}
}

func TestPer100FallbackFromServing(t *testing.T) {
	got := foodLogFromCalorieAPI(calorieAPIResponse{
		Items: []calorieAPIItem{{
			Food:     "شیر",
			Grams:    ptrFloat(200),
			Kcal:     ptrFloat(120),
			ProteinG: ptrFloat(8),
		}},
	})
	if len(got.Items) != 1 {
		t.Fatalf("items=%d", len(got.Items))
	}
	item := got.Items[0]
	if item.KcalPer100g == nil || *item.KcalPer100g != 60 {
		t.Fatalf("kcal_per_100g=%v", item.KcalPer100g)
	}
	if item.ProteinPer100g == nil || *item.ProteinPer100g != 4 {
		t.Fatalf("protein_per_100g=%v", item.ProteinPer100g)
	}
}

func TestApplyCalorieRefineDropsNegatedItem(t *testing.T) {
	parsed := calorieAPIResponse{
		RawText: "قند نخوردم یک لیوان شیر خوردم",
		Items: []calorieAPIItem{
			{Food: "قند"},
			{Food: "شیر 3 درصد چربی پاستوریزه", Grams: ptrFloat(200), Kcal: ptrFloat(120)},
		},
	}
	got := applyCalorieRefine(parsed, calorieLogRefine{
		DropItemIndexes: []int{0, 99, -1},
		Questions:       calorieQuestionList{{Text: "  "}},
		Notes:           "قند حذف شد",
	})
	if len(got.Items) != 1 || got.Items[0].Food != "شیر 3 درصد چربی پاستوریزه" {
		t.Fatalf("items=%v", got.Items)
	}
	log := foodLogFromCalorieAPI(got)
	if log.Notes != "قند حذف شد" {
		t.Fatalf("notes=%q", log.Notes)
	}
}

func TestApplyCalorieRefineChoosesCandidateFoodID(t *testing.T) {
	parsed := calorieAPIResponse{
		RawText: "نان پنی",
		Candidates: []calorieAPIItem{
			{FoodID: "abc", Food: "نان قندی", Spoken: "نان پنی", Quantity: ptrFloat(1), Unit: "عدد"},
		},
	}
	got := applyCalorieRefine(parsed, calorieLogRefine{
		ChooseFoodIDs: []string{"abc", "not-in-json"},
	})
	if len(got.Items) != 1 || got.Items[0].FoodID != "abc" {
		t.Fatalf("items=%v", got.Items)
	}
	if got.Items[0].Kcal != nil {
		t.Fatal("Gemini path must not carry invented kcal")
	}
}

func TestCalorieLogNeedsGemini(t *testing.T) {
	if calorieLogNeedsGemini(calorieAPIResponse{
		RawText: "یک لیوان شیر خوردم",
		Items: []calorieAPIItem{{
			Food:       "شیر",
			MatchScore: ptrFloat(100),
		}},
	}) {
		t.Fatal("clean committed log should skip Gemini")
	}
	if !calorieLogNeedsGemini(calorieAPIResponse{
		RawText: "گوجه کبابی",
		Items: []calorieAPIItem{{
			Food:       "جوجه کباب",
			MatchScore: ptrFloat(84.2),
			Kcal:       ptrFloat(159),
		}},
	}) {
		t.Fatal("low match_score with committed kcal should call Gemini")
	}
	if !calorieLogNeedsGemini(calorieAPIResponse{
		RawText: "ماکارونی",
		Items: []calorieAPIItem{{
			Food:       "ماکارونی",
			MatchScore: ptrFloat(100),
			Kcal:       ptrFloat(300),
			Estimated:  true,
		}},
	}) {
		t.Fatal("estimated kcal should call Gemini")
	}
	if !calorieLogNeedsGemini(calorieAPIResponse{
		RawText:    "قند نخوردم",
		Items:      []calorieAPIItem{{Food: "قند"}},
		Unmatched:  nil,
		Candidates: nil,
	}) {
		t.Fatal("negation should call Gemini")
	}
	if !calorieLogNeedsGemini(calorieAPIResponse{
		RawText: "صبحانه نان خوردم ناهار برنج خوردم",
		Items:   []calorieAPIItem{{Food: "نان"}, {Food: "برنج"}},
	}) {
		t.Fatal("multi-meal speech should call Gemini")
	}
}

func TestApplyCalorieRefineItemMeals(t *testing.T) {
	parsed := calorieAPIResponse{
		RawText: "صبحانه شیر ناهار برنج",
		Items: []calorieAPIItem{
			{FoodID: "milk", Food: "شیر"},
			{FoodID: "rice", Food: "برنج"},
		},
	}
	got := applyCalorieRefine(parsed, calorieLogRefine{
		ItemMeals: []calorieItemMeal{
			{FoodID: "milk", Meal: "breakfast"},
			{FoodID: "rice", Meal: "lunch"},
			{FoodID: "rice", Meal: "not-a-meal"},
		},
	})
	if got.Items[0].Meal != "breakfast" || got.Items[1].Meal != "lunch" {
		t.Fatalf("meals=%q %q", got.Items[0].Meal, got.Items[1].Meal)
	}
	log := foodLogFromCalorieAPI(got)
	if log.Items[0].MealType != "breakfast" || log.Items[1].MealType != "lunch" {
		t.Fatalf("meal_type=%q %q", log.Items[0].MealType, log.Items[1].MealType)
	}
}

func TestStripCandidateNutrition(t *testing.T) {
	parsed := calorieAPIResponse{
		Candidates: []calorieAPIItem{{Food: "نان قندی", Kcal: ptrFloat(900), Grams: ptrFloat(80), ProteinG: ptrFloat(2)}},
	}
	stripCandidateNutrition(&parsed)
	if parsed.Candidates[0].Kcal != nil || parsed.Candidates[0].Grams != nil || parsed.Candidates[0].ProteinG != nil {
		t.Fatal("candidates must not keep nutrition")
	}
}

func TestLayer8ForGeminiHasNoKcal(t *testing.T) {
	kcal := 900.0
	payload := layer8ForGemini(calorieAPIResponse{
		RawText:    "نان پنی",
		Confidence: &calorieConfidence{Level: "high"},
		Candidates: []calorieAPIItem{
			{FoodID: "abc", Food: "نان قندی", Spoken: "نان پنی", Kcal: &kcal, Grams: ptrFloat(80)},
		},
		Unmatched: []string{"پیلزا"},
	})
	if payload.RawText != "نان پنی" {
		t.Fatalf("raw_text=%q", payload.RawText)
	}
	if len(payload.Candidates) != 1 || payload.Candidates[0].FoodID != "abc" {
		t.Fatalf("candidates=%v", payload.Candidates)
	}
	if payload.Confidence == nil || payload.Confidence.Level != "high" {
		t.Fatal("expected confidence")
	}
	if len(payload.Unmatched) != 1 {
		t.Fatalf("unmatched=%v", payload.Unmatched)
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(raw), "kcal") || strings.Contains(string(raw), `"grams"`) {
		t.Fatalf("gemini payload leaked nutrition: %s", raw)
	}
}

func TestCalorieRefinePromptKeepsCommittedWhenOtherFoodUnmatched(t *testing.T) {
	if !strings.Contains(calorieRefineSystemPrompt, "قانون بحرانی drop") {
		t.Fatal("missing critical drop rule heading")
	}
	if !strings.Contains(calorieRefineSystemPrompt, "غذای اصلی گم‌شده دلیل حذف بقیه") {
		t.Fatal("missing independent-item drop rule")
	}
	if !strings.Contains(calorieRefineSystemPrompt, "شواهد معنایی قوی") {
		t.Fatal("missing wrong-match drop clause")
	}
	if !strings.Contains(calorieRefineSystemPrompt, "در غیر این صورت KEEP") {
		t.Fatal("missing otherwise-keep clause")
	}
	if !strings.Contains(calorieRefineSystemPrompt, "برنج و گوجه را KEEP") {
		t.Fatal("missing chelo-kebab keep example")
	}
	if !strings.Contains(calorieRefineSystemPrompt, "گوشت را drop نکن") {
		t.Fatal("missing ground-meat keep example")
	}
	if !strings.Contains(calorieRefineSystemPrompt, "دقیقاً ۳ گزینه") {
		t.Fatal("missing three-option question rule")
	}
}

func TestCalorieQuestionListUnmarshal(t *testing.T) {
	var fromStrings calorieQuestionList
	if err := json.Unmarshal([]byte(`["چه نوع سوپی میل کردید؟"]`), &fromStrings); err != nil {
		t.Fatal(err)
	}
	got := normalizeFoodLogQuestions([]FoodLogQuestion(fromStrings))
	if len(got) != 1 || got[0].Text != "چه نوع سوپی میل کردید؟" || len(got[0].Options) != 3 {
		t.Fatalf("string questions=%v", got)
	}

	var fromObjs calorieQuestionList
	raw := `[{"text":"چه نوع کباب میل کردید؟","options":["کباب کوبیده","جوجه کباب","کباب برگ"]}]`
	if err := json.Unmarshal([]byte(raw), &fromObjs); err != nil {
		t.Fatal(err)
	}
	got = normalizeFoodLogQuestions([]FoodLogQuestion(fromObjs))
	if len(got) != 1 || got[0].Options[1] != "جوجه کباب" {
		t.Fatalf("object questions=%v", got)
	}
}

func TestPadQuestionOptions(t *testing.T) {
	got := padQuestionOptions([]string{"سوپ جو", "سوپ جو", " "})
	if len(got) != 3 || got[0] != "سوپ جو" {
		t.Fatalf("pad=%v", got)
	}
}

func TestApplyCalorieRefineKeepsQuestionOptions(t *testing.T) {
	got := applyCalorieRefine(calorieAPIResponse{RawText: "سوپ خوردم"}, calorieLogRefine{
		Questions: calorieQuestionList{{
			Text:    "چه نوع سوپی میل کردید؟",
			Options: []string{"سوپ سبزیجات", "سوپ جو", "سوپ مرغ"},
		}},
	})
	log := foodLogFromCalorieAPI(got)
	if len(log.Questions) != 1 || len(log.Questions[0].Options) != 3 {
		t.Fatalf("questions=%v", log.Questions)
	}
	if log.Questions[0].Options[2] != "سوپ مرغ" {
		t.Fatalf("options=%v", log.Questions[0].Options)
	}
}
