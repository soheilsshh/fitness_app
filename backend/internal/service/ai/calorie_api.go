package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/yourusername/fitness-management/config"
)

type calorieAvailableUnit struct {
	Unit         string  `json:"unit"`
	GramsPerUnit float64 `json:"grams_per_unit"`
}

type calorieAPIItem struct {
	FoodID            string                 `json:"food_id"`
	Food              string                 `json:"food"`
	Spoken            string                 `json:"spoken"`
	Meal              string                 `json:"meal"`
	Quantity          *float64               `json:"quantity"`
	Unit              string                 `json:"unit"`
	Grams             *float64               `json:"grams"`
	Kcal              *float64               `json:"kcal"`
	ProteinG          *float64               `json:"protein_g"`
	CarbsG            *float64               `json:"carbs_g"`
	FatG              *float64               `json:"fat_g"`
	Estimated         bool                   `json:"estimated"`
	PossibleDuplicate bool                   `json:"possible_duplicate"`
	MatchScore        *float64               `json:"match_score"`
	Note              string                 `json:"note"`
	NeedsQuantity     bool                   `json:"needs_quantity"`
	NeedsConversion   bool                   `json:"needs_conversion"`
	AvailableUnits    []calorieAvailableUnit `json:"available_units"`
	KcalPer100g       *float64               `json:"kcal_per_100g"`
	ProteinPer100g    *float64               `json:"protein_per_100g"`
	CarbsPer100g      *float64               `json:"carbs_per_100g"`
	FatPer100g        *float64               `json:"fat_per_100g"`
}

type calorieConfidence struct {
	Level            string   `json:"level"`
	AvgLogprob       *float64 `json:"avg_logprob"`
	CompressionRatio *float64 `json:"compression_ratio"`
}

type calorieAPIResponse struct {
	Meal          string             `json:"meal"`
	Items         []calorieAPIItem   `json:"items"`
	Candidates    []calorieAPIItem   `json:"candidates"`
	Unmatched     []string           `json:"unmatched"`
	RawText       string             `json:"raw_text"`
	Confidence    *calorieConfidence `json:"confidence"`
	LowConfidence bool               `json:"low_confidence"`

	geminiQuestions []FoodLogQuestion `json:"-"`
	geminiNotes     string            `json:"-"`
}

type calorieItemMeal struct {
	FoodID string `json:"food_id"`
	Meal   string `json:"meal"`
}

type calorieLogRefine struct {
	DropItemIndexes []int               `json:"drop_item_indexes"`
	ChooseFoodIDs   []string            `json:"choose_food_ids"`
	ItemMeals       []calorieItemMeal   `json:"item_meals"`
	Questions       calorieQuestionList `json:"questions"`
	Notes           string              `json:"notes"`
}

// calorieQuestionList accepts Gemini objects or the older []string retry shape.
type calorieQuestionList []FoodLogQuestion

func (list *calorieQuestionList) UnmarshalJSON(b []byte) error {
	b = bytes.TrimSpace(b)
	if len(b) == 0 || string(b) == "null" {
		*list = nil
		return nil
	}
	var raw []json.RawMessage
	if err := json.Unmarshal(b, &raw); err != nil {
		return err
	}
	out := make([]FoodLogQuestion, 0, len(raw))
	for _, item := range raw {
		item = bytes.TrimSpace(item)
		if len(item) == 0 {
			continue
		}
		if item[0] == '"' {
			var s string
			if err := json.Unmarshal(item, &s); err != nil {
				return err
			}
			if t := strings.TrimSpace(s); t != "" {
				out = append(out, FoodLogQuestion{Text: t})
			}
			continue
		}
		var obj struct {
			Text     string   `json:"text"`
			Question string   `json:"question"`
			Options  []string `json:"options"`
			Choices  []string `json:"choices"`
		}
		if err := json.Unmarshal(item, &obj); err != nil {
			return err
		}
		text := strings.TrimSpace(obj.Text)
		if text == "" {
			text = strings.TrimSpace(obj.Question)
		}
		if text == "" {
			continue
		}
		opts := obj.Options
		if len(nonEmptyStrings(opts)) == 0 {
			opts = obj.Choices
		}
		out = append(out, FoodLogQuestion{Text: text, Options: opts})
	}
	*list = out
	return nil
}

// LogMealFromVoice sends audio to fa-calorie-api (GapGPT Whisper + catalog
// matcher), optionally asks Gemini to referee the JSON (negation / ambiguity),
// then maps into FoodLogSchema. Gemini never sees raw audio and cannot invent kcal.
func LogMealFromVoice(ctx context.Context, filename string, data []byte) (*FoodLogSchema, *GenerateResult, error) {
	parsed, err := fetchCalorieLog(ctx, filename, data)
	if err != nil {
		return nil, nil, err
	}
	var genRes *GenerateResult
	if calorieLogNeedsGemini(*parsed) {
		refine, res, rerr := RefineCalorieFoodLog(ctx, *parsed)
		genRes = res
		if rerr == nil && refine != nil {
			applied := applyCalorieRefine(*parsed, *refine)
			parsed = &applied
		}
	}
	return foodLogFromCalorieAPI(*parsed), genRes, nil
}

func fetchCalorieLog(ctx context.Context, filename string, data []byte) (*calorieAPIResponse, error) {
	cfg := config.Get()
	base := strings.TrimRight(strings.TrimSpace(cfg.ASR.CalorieAPIURL), "/")
	if base == "" {
		return nil, fmt.Errorf("%w: calorie api url empty", ErrNotConfigured)
	}

	name := strings.TrimSpace(filename)
	if name == "" {
		name = "voice-note.wav"
	}
	if filepath.Ext(name) == "" {
		name += ".wav"
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile("file", name)
	if err != nil {
		return nil, err
	}
	if _, err := part.Write(data); err != nil {
		return nil, err
	}
	if err := writer.Close(); err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, base+"/log-meal", &body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: calorie-api: %v", ErrUpstream, err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
	if resp.StatusCode >= 300 {
		msg := strings.TrimSpace(string(raw))
		if msg == "" {
			msg = resp.Status
		}
		return nil, fmt.Errorf("%w: calorie-api: %s", ErrUpstream, msg)
	}

	var parsed calorieAPIResponse
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("%w: calorie-api: invalid response", ErrUnmarshal)
	}
	normalizeCalorieConfidence(&parsed)
	stripCandidateNutrition(&parsed)
	return &parsed, nil
}

func stripCandidateNutrition(parsed *calorieAPIResponse) {
	if parsed == nil {
		return
	}
	for i := range parsed.Candidates {
		parsed.Candidates[i].Kcal = nil
		parsed.Candidates[i].Grams = nil
		parsed.Candidates[i].ProteinG = nil
		parsed.Candidates[i].CarbsG = nil
		parsed.Candidates[i].FatG = nil
	}
}

func normalizeCalorieConfidence(parsed *calorieAPIResponse) {
	if parsed == nil {
		return
	}
	if parsed.Confidence != nil && strings.EqualFold(parsed.Confidence.Level, "low") {
		parsed.LowConfidence = true
	}
	if parsed.Confidence == nil {
		level := "high"
		if parsed.LowConfidence {
			level = "low"
		}
		parsed.Confidence = &calorieConfidence{Level: level}
	}
}

func foodLogFromCalorieAPI(parsed calorieAPIResponse) *FoodLogSchema {
	items := make([]FoodItem, 0, len(parsed.Items))
	dupes := false
	for _, row := range parsed.Items {
		name := strings.TrimSpace(row.Food)
		if name == "" {
			continue
		}
		kcal100, protein100, carbs100, fat100 := per100FromCalorieItem(row)
		item := FoodItem{
			FoodName:        name,
			FoodID:          strings.TrimSpace(row.FoodID),
			MealType:        normalizeVoiceMeal(row.Meal),
			ServingLabel:    servingLabelFromCalorieItem(row),
			AmountG:         derefCalorieFloat(row.Grams),
			Calories:        int(derefCalorieFloat(row.Kcal) + 0.5),
			ProteinG:        derefCalorieFloat(row.ProteinG),
			CarbsG:          derefCalorieFloat(row.CarbsG),
			FatG:            derefCalorieFloat(row.FatG),
			Spoken:          strings.TrimSpace(row.Spoken),
			Quantity:        row.Quantity,
			Unit:            strings.TrimSpace(row.Unit),
			NeedsQuantity:   row.NeedsQuantity,
			NeedsConversion: row.NeedsConversion,
			AvailableUnits:  toFoodAvailableUnits(row.AvailableUnits),
			KcalPer100g:     kcal100,
			ProteinPer100g:  protein100,
			CarbsPer100g:    carbs100,
			FatPer100g:      fat100,
			VoiceUnit:       strings.TrimSpace(row.Unit),
			VoiceQty:        row.Quantity,
		}
		if row.PossibleDuplicate {
			dupes = true
		}
		items = append(items, item)
	}

	questions := normalizeFoodLogQuestions(parsed.geminiQuestions)
	if len(questions) == 0 {
		questions = defaultCalorieQuestions(parsed)
	}

	var notes []string
	if n := strings.TrimSpace(parsed.geminiNotes); n != "" {
		notes = append(notes, n)
	}
	if parsed.LowConfidence {
		notes = append(notes, "صدا واضح نبود — موارد را قبل از ثبت بررسی کنید")
	}
	if dupes {
		notes = append(notes, "یک غذا بیش از یک‌بار تشخیص داده شد؛ مقدار را چک کنید")
	}
	if unmatched := nonEmptyStrings(parsed.Unmatched); len(unmatched) > 0 && len(questions) == 0 {
		notes = append(notes, "تشخیص داده نشد: "+strings.Join(unmatched, "، "))
	}

	return &FoodLogSchema{
		Items:      items,
		Notes:      strings.Join(notes, " "),
		Transcript: strings.TrimSpace(parsed.RawText),
		Questions:  questions,
	}
}

func calorieLogNeedsGemini(parsed calorieAPIResponse) bool {
	if parsed.LowConfidence {
		return true
	}
	if parsed.Confidence != nil && strings.EqualFold(parsed.Confidence.Level, "low") {
		return true
	}
	if len(parsed.Candidates) > 0 || len(nonEmptyStrings(parsed.Unmatched)) > 0 {
		return true
	}
	for _, item := range parsed.Items {
		if item.PossibleDuplicate {
			return true
		}
		if item.MatchScore != nil && *item.MatchScore < 90 {
			return true
		}
		if item.Estimated && item.Kcal != nil && *item.Kcal > 0 {
			return true
		}
	}
	text := parsed.RawText
	markers := []string{
		"نخوردم", "نخورد", "بدون", "نه ", "نه،",
		"اشتباه", "بلکه", "در واقع", "نه اینکه",
		"منظورم", "معظورم", "ببخشید", "غلط", "به جاش", "به جایش",
	}
	for _, m := range markers {
		if strings.Contains(text, m) {
			return true
		}
	}
	if spokenMealCount(text) >= 2 {
		return true
	}
	return false
}

func applyCalorieRefine(parsed calorieAPIResponse, refine calorieLogRefine) calorieAPIResponse {
	drop := map[int]struct{}{}
	for _, i := range refine.DropItemIndexes {
		if i >= 0 && i < len(parsed.Items) {
			drop[i] = struct{}{}
		}
	}
	if len(drop) > 0 {
		kept := make([]calorieAPIItem, 0, len(parsed.Items))
		for i, item := range parsed.Items {
			if _, skip := drop[i]; !skip {
				kept = append(kept, item)
			}
		}
		parsed.Items = kept
	}

	allowed := map[string]calorieAPIItem{}
	for _, row := range append(append([]calorieAPIItem{}, parsed.Items...), parsed.Candidates...) {
		id := strings.TrimSpace(row.FoodID)
		if id != "" {
			allowed[id] = row
		}
	}
	have := map[string]struct{}{}
	for _, row := range parsed.Items {
		if id := strings.TrimSpace(row.FoodID); id != "" {
			have[id] = struct{}{}
		}
	}
	for _, id := range refine.ChooseFoodIDs {
		id = strings.TrimSpace(id)
		src, ok := allowed[id]
		if !ok {
			continue
		}
		if _, exists := have[id]; exists {
			continue
		}
		src.Kcal = nil
		src.ProteinG = nil
		src.CarbsG = nil
		src.FatG = nil
		src.Grams = nil
		parsed.Items = append(parsed.Items, src)
		have[id] = struct{}{}
	}

	mealByID := map[string]string{}
	for _, row := range refine.ItemMeals {
		id := strings.TrimSpace(row.FoodID)
		meal := normalizeVoiceMeal(row.Meal)
		if id == "" || meal == "" {
			continue
		}
		mealByID[id] = meal
	}
	for i := range parsed.Items {
		id := strings.TrimSpace(parsed.Items[i].FoodID)
		if meal, ok := mealByID[id]; ok {
			parsed.Items[i].Meal = meal
		}
	}

	parsed.geminiQuestions = normalizeFoodLogQuestions([]FoodLogQuestion(refine.Questions))
	parsed.geminiNotes = strings.TrimSpace(refine.Notes)
	return parsed
}

func defaultCalorieQuestions(parsed calorieAPIResponse) []FoodLogQuestion {
	chosen := map[string]struct{}{}
	for _, row := range parsed.Items {
		if id := strings.TrimSpace(row.FoodID); id != "" {
			chosen[id] = struct{}{}
		}
	}
	var out []FoodLogQuestion
	for _, c := range parsed.Candidates {
		if _, ok := chosen[strings.TrimSpace(c.FoodID)]; ok {
			continue
		}
		food := strings.TrimSpace(c.Food)
		spoken := strings.TrimSpace(c.Spoken)
		if food == "" {
			continue
		}
		text := fmt.Sprintf("آیا منظورت «%s» بود؟", food)
		if spoken != "" && spoken != food {
			text = fmt.Sprintf("آیا منظورت «%s» بود؟ (گفتی: %s)", food, spoken)
		}
		out = append(out, FoodLogQuestion{
			Text:    text,
			Options: padQuestionOptions([]string{"بله، «" + food + "»", "غذای دیگری بود", "نمی‌دانم"}),
		})
	}
	if unmatched := nonEmptyStrings(parsed.Unmatched); len(unmatched) > 0 {
		out = append(out, FoodLogQuestion{
			Text:    "این بخش غذا تشخیص داده نشد: " + strings.Join(unmatched, "، "),
			Options: padQuestionOptions(unmatched),
		})
	}
	return out
}

func foodLogQuestionTexts(qs []FoodLogQuestion) []string {
	var out []string
	for _, q := range qs {
		if t := strings.TrimSpace(q.Text); t != "" {
			out = append(out, t)
		}
	}
	return out
}

func padQuestionOptions(opts []string) []string {
	out := make([]string, 0, 3)
	seen := map[string]struct{}{}
	for _, raw := range opts {
		t := strings.TrimSpace(raw)
		if t == "" {
			continue
		}
		if _, ok := seen[t]; ok {
			continue
		}
		seen[t] = struct{}{}
		out = append(out, t)
		if len(out) == 3 {
			return out
		}
	}
	for _, fallback := range []string{"نمی‌دانم", "غذای دیگری بود", "بعداً انتخاب می‌کنم"} {
		if len(out) >= 3 {
			break
		}
		if _, ok := seen[fallback]; ok {
			continue
		}
		seen[fallback] = struct{}{}
		out = append(out, fallback)
	}
	return out
}

func normalizeFoodLogQuestions(qs []FoodLogQuestion) []FoodLogQuestion {
	var out []FoodLogQuestion
	for _, q := range qs {
		text := strings.TrimSpace(q.Text)
		if text == "" {
			continue
		}
		out = append(out, FoodLogQuestion{
			Text:    text,
			Options: padQuestionOptions(q.Options),
		})
	}
	return out
}

func toFoodAvailableUnits(rows []calorieAvailableUnit) []FoodAvailableUnit {
	out := make([]FoodAvailableUnit, 0, len(rows))
	for _, row := range rows {
		unit := strings.TrimSpace(row.Unit)
		if unit == "" || row.GramsPerUnit <= 0 {
			continue
		}
		out = append(out, FoodAvailableUnit{Unit: unit, GramsPerUnit: row.GramsPerUnit})
	}
	if len(out) == 0 {
		return nil
	}
	return out
}

func per100FromCalorieItem(row calorieAPIItem) (kcal, protein, carbs, fat *float64) {
	kcal, protein, carbs, fat = row.KcalPer100g, row.ProteinPer100g, row.CarbsPer100g, row.FatPer100g
	grams := derefCalorieFloat(row.Grams)
	if grams <= 0 {
		return kcal, protein, carbs, fat
	}
	scale := 100 / grams
	if kcal == nil && row.Kcal != nil {
		v := *row.Kcal * scale
		kcal = &v
	}
	if protein == nil && row.ProteinG != nil {
		v := *row.ProteinG * scale
		protein = &v
	}
	if carbs == nil && row.CarbsG != nil {
		v := *row.CarbsG * scale
		carbs = &v
	}
	if fat == nil && row.FatG != nil {
		v := *row.FatG * scale
		fat = &v
	}
	return kcal, protein, carbs, fat
}

func servingLabelFromCalorieItem(row calorieAPIItem) string {
	unit := strings.TrimSpace(row.Unit)
	if unit == "" {
		return strings.TrimSpace(row.Spoken)
	}
	if row.Quantity != nil {
		return strings.TrimSpace(fmt.Sprintf("%g %s", *row.Quantity, unit))
	}
	return unit
}

func derefCalorieFloat(v *float64) float64 {
	if v == nil {
		return 0
	}
	return *v
}

func toGeminiFoods(rows []calorieAPIItem) []geminiFood {
	out := make([]geminiFood, 0, len(rows))
	for _, row := range rows {
		out = append(out, geminiFood{
			FoodID:   strings.TrimSpace(row.FoodID),
			Food:     row.Food,
			Spoken:   row.Spoken,
			Meal:     normalizeVoiceMeal(row.Meal),
			Quantity: row.Quantity,
			Unit:     row.Unit,
		})
	}
	return out
}

type geminiFood struct {
	FoodID   string   `json:"food_id"`
	Food     string   `json:"food"`
	Spoken   string   `json:"spoken"`
	Meal     string   `json:"meal,omitempty"`
	Quantity *float64 `json:"quantity"`
	Unit     string   `json:"unit"`
}

type layer8GeminiPayload struct {
	RawText    string             `json:"raw_text"`
	Items      []geminiFood       `json:"items"`
	Candidates []geminiFood       `json:"candidates"`
	Unmatched  []string           `json:"unmatched"`
	Confidence *calorieConfidence `json:"confidence"`
}

func layer8ForGemini(parsed calorieAPIResponse) layer8GeminiPayload {
	conf := parsed.Confidence
	if conf == nil {
		level := "high"
		if parsed.LowConfidence {
			level = "low"
		}
		conf = &calorieConfidence{Level: level}
	}
	return layer8GeminiPayload{
		RawText:    parsed.RawText,
		Items:      toGeminiFoods(parsed.Items),
		Candidates: toGeminiFoods(parsed.Candidates),
		Unmatched:  parsed.Unmatched,
		Confidence: conf,
	}
}

func normalizeVoiceMeal(raw string) string {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "breakfast", "lunch", "dinner", "snack":
		return strings.ToLower(strings.TrimSpace(raw))
	default:
		return ""
	}
}

func spokenMealCount(text string) int {
	words := []string{
		"صبحانه", "صبحونه", "ناشتا",
		"ناهار",
		"شام",
		"میانوعده", "میان وعده", "عصرونه", "عصرانه",
	}
	n := 0
	for _, w := range words {
		if strings.Contains(text, w) {
			n++
		}
	}
	return n
}

func nonEmptyStrings(in []string) []string {
	out := make([]string, 0, len(in))
	for _, s := range in {
		s = strings.TrimSpace(s)
		if s != "" {
			out = append(out, s)
		}
	}
	return out
}
