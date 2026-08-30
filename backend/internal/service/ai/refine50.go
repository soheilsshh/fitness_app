package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"sort"
	"strings"
	"time"
)

type refine50Clip struct {
	ID            int                `json:"id"`
	File          string             `json:"file"`
	Category      string             `json:"category"`
	ReferenceText string             `json:"reference_text"`
	Parsed        calorieAPIResponse `json:"parsed"`
}

type refine50Input struct {
	Clips []refine50Clip `json:"clips"`
}

type refine50ItemSnap struct {
	FoodID string   `json:"food_id"`
	Food   string   `json:"food"`
	Spoken string   `json:"spoken"`
	Meal   string   `json:"meal,omitempty"`
	Kcal   *float64 `json:"kcal"`
}

type refine50Result struct {
	ID               int                 `json:"id"`
	File             string              `json:"file"`
	Category         string              `json:"category"`
	ReferenceText    string              `json:"reference_text"`
	RawText          string              `json:"raw_text"`
	NeedsGemini      bool                `json:"needs_gemini"`
	Skipped          bool                `json:"skipped"`
	SkipReason       string              `json:"skip_reason,omitempty"`
	Error            string              `json:"error,omitempty"`
	UsedMock         bool                `json:"used_mock"`
	Model            string              `json:"model,omitempty"`
	LatencyMs        int                 `json:"latency_ms,omitempty"`
	PromptTokens     int                 `json:"prompt_tokens,omitempty"`
	CompletionTokens int                 `json:"completion_tokens,omitempty"`
	Layer8           layer8GeminiPayload `json:"layer8,omitempty"`
	Refine           *calorieLogRefine   `json:"refine,omitempty"`
	RefineRaw        string              `json:"refine_raw,omitempty"`
	NutritionLeak    []string            `json:"nutrition_leak,omitempty"`
	RejectedIDs      []string            `json:"rejected_choose_ids,omitempty"`
	ItemsBefore      []refine50ItemSnap  `json:"items_before"`
	ItemsAfter       []refine50ItemSnap  `json:"items_after,omitempty"`
	Candidates       []refine50ItemSnap  `json:"candidates"`
	Unmatched        []string            `json:"unmatched"`
	DroppedCount     int                 `json:"dropped_count"`
	PromotedCount    int                 `json:"promoted_count"`
	MealAssigned     int                 `json:"meal_assigned"`
	Questions        []FoodLogQuestion   `json:"questions,omitempty"`
	Notes            string              `json:"notes,omitempty"`
}

type refine50Report struct {
	Meta    map[string]any   `json:"meta"`
	Results []refine50Result `json:"results"`
	Errors  []map[string]any `json:"errors"`
}

func snapItems(rows []calorieAPIItem) []refine50ItemSnap {
	out := make([]refine50ItemSnap, 0, len(rows))
	for _, row := range rows {
		out = append(out, refine50ItemSnap{
			FoodID: strings.TrimSpace(row.FoodID),
			Food:   row.Food,
			Spoken: row.Spoken,
			Meal:   row.Meal,
			Kcal:   row.Kcal,
		})
	}
	return out
}

func allowedFoodIDs(parsed calorieAPIResponse) map[string]struct{} {
	out := map[string]struct{}{}
	for _, row := range append(append([]calorieAPIItem{}, parsed.Items...), parsed.Candidates...) {
		if id := strings.TrimSpace(row.FoodID); id != "" {
			out[id] = struct{}{}
		}
	}
	return out
}

func nutritionLeakKeys(raw string) []string {
	lower := strings.ToLower(raw)
	needles := []string{`"kcal"`, `"calories"`, `"grams"`, `"protein_g"`, `"carbs_g"`, `"fat_g"`, `"amount_g"`}
	var hits []string
	for _, n := range needles {
		if strings.Contains(lower, n) {
			hits = append(hits, strings.Trim(n, `"`))
		}
	}
	return hits
}

func writeRefine50(path string, report refine50Report) error {
	sort.Slice(report.Results, func(i, j int) bool {
		return report.Results[i].ID < report.Results[j].ID
	})
	raw, err := json.MarshalIndent(report, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, raw, 0o644)
}

// RunGeminiRefine50 runs the real layer-9 Gemini referee on prebuilt layer-8 clips.
func RunGeminiRefine50(ctx context.Context, inPath, outPath string) error {
	raw, err := os.ReadFile(inPath)
	if err != nil {
		return err
	}
	var input refine50Input
	if err := json.Unmarshal(raw, &input); err != nil {
		return fmt.Errorf("parse layer-8 file: %w", err)
	}
	if len(input.Clips) == 0 {
		return fmt.Errorf("no clips in %s", inPath)
	}

	report := refine50Report{
		Meta: map[string]any{
			"clip_count":   len(input.Clips),
			"generated_at": time.Now().Format(time.RFC3339),
			"source":       inPath,
			"prompt":       PromptVersion,
		},
		Results: []refine50Result{},
		Errors:  []map[string]any{},
	}
	done := map[int]refine50Result{}
	if prevRaw, err := os.ReadFile(outPath); err == nil {
		var prev refine50Report
		if json.Unmarshal(prevRaw, &prev) == nil {
			for _, row := range prev.Results {
				if row.Error == "" && row.ID > 0 {
					done[row.ID] = row
					report.Results = append(report.Results, row)
				}
			}
			if len(done) > 0 {
				fmt.Printf("Resuming: %d clips already done\n", len(done))
			}
		}
	}

	for i, clip := range input.Clips {
		if existing, ok := done[clip.ID]; ok {
			fmt.Printf("[%d/%d] %s skip (already done)\n", i+1, len(input.Clips), clip.File)
			_ = existing
			continue
		}
		parsed := clip.Parsed
		normalizeCalorieConfidence(&parsed)
		stripCandidateNutrition(&parsed)

		row := refine50Result{
			ID:            clip.ID,
			File:          clip.File,
			Category:      clip.Category,
			ReferenceText: clip.ReferenceText,
			RawText:       parsed.RawText,
			ItemsBefore:   snapItems(parsed.Items),
			Candidates:    snapItems(parsed.Candidates),
			Unmatched:     nonEmptyStrings(parsed.Unmatched),
			Layer8:        layer8ForGemini(parsed),
		}

		if !calorieLogNeedsGemini(parsed) {
			row.NeedsGemini = false
			row.Skipped = true
			row.SkipReason = "clean committed log"
			row.ItemsAfter = row.ItemsBefore
			fmt.Printf("[%d/%d] %s skip Gemini (clean)\n", i+1, len(input.Clips), clip.File)
			report.Results = append(report.Results, row)
			if err := writeRefine50(outPath, report); err != nil {
				return err
			}
			continue
		}

		row.NeedsGemini = true
		fmt.Printf("[%d/%d] %s Gemini...\n", i+1, len(input.Clips), clip.File)
		clipCtx, cancel := context.WithTimeout(ctx, 2*time.Minute)
		refine, gen, rerr := RefineCalorieFoodLog(clipCtx, parsed)
		cancel()
		if gen != nil {
			row.UsedMock = gen.UsedMock
			row.Model = gen.Model
			row.LatencyMs = gen.LatencyMs
			row.PromptTokens = gen.PromptTokens
			row.CompletionTokens = gen.CompletionTokens
			row.RefineRaw = strings.TrimSpace(string(gen.RawJSON))
		}
		if row.UsedMock {
			row.Error = "mock Gemini (OPENAI_API_KEY missing) — live test aborted"
			report.Results = append(report.Results, row)
			report.Errors = append(report.Errors, map[string]any{"id": clip.ID, "error": row.Error})
			_ = writeRefine50(outPath, report)
			return fmt.Errorf("clip %d: %s", clip.ID, row.Error)
		}
		if rerr != nil {
			row.Error = rerr.Error()
			report.Results = append(report.Results, row)
			report.Errors = append(report.Errors, map[string]any{"id": clip.ID, "file": clip.File, "error": row.Error})
			_ = writeRefine50(outPath, report)
			if strings.Contains(strings.ToLower(row.Error), "quota") {
				return fmt.Errorf("GapGPT quota exhausted at clip %d: %w", clip.ID, rerr)
			}
			fmt.Printf("  ERROR: %v\n", rerr)
			continue
		}
		if refine == nil {
			row.Error = "empty refine"
			report.Results = append(report.Results, row)
			_ = writeRefine50(outPath, report)
			continue
		}

		row.Refine = refine
		row.NutritionLeak = nutritionLeakKeys(row.RefineRaw)
		allowed := allowedFoodIDs(parsed)
		for _, id := range refine.ChooseFoodIDs {
			id = strings.TrimSpace(id)
			if id == "" {
				continue
			}
			if _, ok := allowed[id]; !ok {
				row.RejectedIDs = append(row.RejectedIDs, id)
			}
		}

		beforeIDs := map[string]struct{}{}
		for _, it := range parsed.Items {
			if id := strings.TrimSpace(it.FoodID); id != "" {
				beforeIDs[id] = struct{}{}
			}
		}
		applied := applyCalorieRefine(parsed, *refine)
		row.ItemsAfter = snapItems(applied.Items)
		row.DroppedCount = len(refine.DropItemIndexes)
		promoted := 0
		for _, it := range applied.Items {
			id := strings.TrimSpace(it.FoodID)
			if id == "" {
				continue
			}
			if _, ok := beforeIDs[id]; !ok {
				promoted++
			}
		}
		row.PromotedCount = promoted
		row.MealAssigned = len(refine.ItemMeals)
		row.Questions = applied.geminiQuestions
		row.Notes = applied.geminiNotes
		fmt.Printf("  drop=%d choose=%d meals=%d questions=%d leak=%v\n",
			row.DroppedCount, len(refine.ChooseFoodIDs), row.MealAssigned, len(row.Questions), row.NutritionLeak)

		report.Results = append(report.Results, row)
		if err := writeRefine50(outPath, report); err != nil {
			return err
		}
	}

	called, skipped, mockHits := 0, 0, 0
	for _, row := range report.Results {
		if row.UsedMock {
			mockHits++
		}
		if row.Skipped {
			skipped++
		} else if row.NeedsGemini && row.Error == "" {
			called++
		}
	}
	leaks, rejected, questions := 0, 0, 0
	for _, row := range report.Results {
		if len(row.NutritionLeak) > 0 {
			leaks++
		}
		if len(row.RejectedIDs) > 0 {
			rejected++
		}
		questions += len(row.Questions)
	}
	report.Meta["gemini_called"] = called
	report.Meta["gemini_skipped"] = skipped
	report.Meta["error_count"] = len(report.Errors)
	report.Meta["nutrition_leak_clips"] = leaks
	report.Meta["rejected_id_clips"] = rejected
	report.Meta["question_count"] = questions
	report.Meta["mock_hits"] = mockHits
	if err := writeRefine50(outPath, report); err != nil {
		return err
	}
	fmt.Printf("Done: called=%d skipped=%d errors=%d leaks=%d\n", called, skipped, len(report.Errors), leaks)
	fmt.Printf("Report: %s\n", outPath)
	return nil
}
