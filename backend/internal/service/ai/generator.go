package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/yourusername/fitness-management/config"
)

var (
	ErrNotConfigured = errors.New("openai api key not configured")
	ErrUpstream      = errors.New("openai upstream error")
	ErrEmptyResponse = errors.New("empty ai response")
	ErrUnmarshal     = errors.New("failed to unmarshal ai json")
)

// GenerateResult holds raw + metadata from a structured generation call.
type GenerateResult struct {
	RawJSON          []byte
	Model            string
	LatencyMs        int
	PromptTokens     int
	CompletionTokens int
	UsedMock         bool
}

type usageInfo struct {
	PromptTokens     int
	CompletionTokens int
}

type structuredRequest struct {
	Model          string          `json:"model"`
	Messages       []message       `json:"messages"`
	ResponseFormat *responseFormat `json:"response_format,omitempty"`
	Temperature    float32         `json:"temperature"`
	MaxTokens      int             `json:"max_tokens"`
}

type message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type responseFormat struct {
	Type       string      `json:"type"`
	JSONSchema *jsonSchema `json:"json_schema,omitempty"`
}

type jsonSchema struct {
	Name   string      `json:"name"`
	Strict bool        `json:"strict"`
	Schema interface{} `json:"schema"`
}

type apiResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Usage *struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
	} `json:"usage"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

var defaultHTTPClient = &http.Client{Timeout: 45 * time.Second}

// GenerateStructured calls the configured OpenAI-compatible API and returns raw JSON content.
func GenerateStructured(ctx context.Context, schemaName string, schema map[string]interface{}, systemPrompt, userContext string) (*GenerateResult, error) {
	cfg := config.Get()
	model := strings.TrimSpace(cfg.OpenAI.Model)
	if model == "" {
		model = "gpt-4o-mini"
	}

	if strings.TrimSpace(cfg.OpenAI.APIKey) == "" {
		if config.IsDevelopment() {
			return mockStructured(schemaName, model), nil
		}
		return nil, ErrNotConfigured
	}

	start := time.Now()
	raw, usage, err := callWithSchema(ctx, model, schemaName, schema, systemPrompt, userContext, true)
	if err != nil && isSchemaUnsupported(err) {
		raw, usage, err = callWithSchema(
			ctx, model, schemaName, schema,
			systemPrompt+"\nفقط یک JSON معتبر مطابق اسکیما برگردان.",
			userContext, false,
		)
	}
	if err != nil {
		return nil, err
	}

	res := &GenerateResult{
		RawJSON:   raw,
		Model:     model,
		LatencyMs: int(time.Since(start).Milliseconds()),
	}
	if usage != nil {
		res.PromptTokens = usage.PromptTokens
		res.CompletionTokens = usage.CompletionTokens
	}
	return res, nil
}

func callWithSchema(
	ctx context.Context,
	model, schemaName string,
	schema map[string]interface{},
	systemPrompt, userContext string,
	strictSchema bool,
) ([]byte, *usageInfo, error) {
	cfg := config.Get().OpenAI

	reqBody := structuredRequest{
		Model: model,
		Messages: []message{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userContext},
		},
		Temperature: 0.3,
		MaxTokens:   2500,
	}
	if strictSchema {
		reqBody.ResponseFormat = &responseFormat{
			Type: "json_schema",
			JSONSchema: &jsonSchema{
				Name:   schemaName,
				Strict: true,
				Schema: schema,
			},
		}
	} else {
		reqBody.ResponseFormat = &responseFormat{Type: "json_object"}
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, nil, err
	}

	url := strings.TrimRight(cfg.BaseURL, "/") + "/chat/completions"
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+cfg.APIKey)

	resp, err := defaultHTTPClient.Do(httpReq)
	if err != nil {
		return nil, nil, fmt.Errorf("%w: %v", ErrUpstream, err)
	}
	defer resp.Body.Close()

	rawResp, _ := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
	var parsed apiResponse
	if err := json.Unmarshal(rawResp, &parsed); err != nil {
		return nil, nil, fmt.Errorf("%w: invalid response body", ErrUpstream)
	}
	if resp.StatusCode >= 300 {
		msg := "upstream error"
		if parsed.Error != nil && parsed.Error.Message != "" {
			msg = parsed.Error.Message
		}
		return nil, nil, fmt.Errorf("%w: %s", ErrUpstream, msg)
	}
	if len(parsed.Choices) == 0 || strings.TrimSpace(parsed.Choices[0].Message.Content) == "" {
		return nil, nil, ErrEmptyResponse
	}

	content := stripCodeFence(strings.TrimSpace(parsed.Choices[0].Message.Content))
	var usage *usageInfo
	if parsed.Usage != nil {
		usage = &usageInfo{
			PromptTokens:     parsed.Usage.PromptTokens,
			CompletionTokens: parsed.Usage.CompletionTokens,
		}
	}
	return []byte(content), usage, nil
}

func isSchemaUnsupported(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "json_schema") ||
		strings.Contains(msg, "response_format") ||
		strings.Contains(msg, "strict") ||
		strings.Contains(msg, "unsupported") ||
		strings.Contains(msg, "invalid_request")
}

func stripCodeFence(s string) string {
	s = strings.TrimSpace(s)
	if !strings.HasPrefix(s, "```") {
		return s
	}
	s = strings.TrimPrefix(s, "```json")
	s = strings.TrimPrefix(s, "```JSON")
	s = strings.TrimPrefix(s, "```")
	if idx := strings.LastIndex(s, "```"); idx >= 0 {
		s = s[:idx]
	}
	return strings.TrimSpace(s)
}

// GenerateNutritionPlan produces a nutrition plan struct (caller should Validate).
func GenerateNutritionPlan(ctx context.Context, userContext string) (*NutritionPlanSchema, *GenerateResult, error) {
	system := PersonaNutrition.SystemPrompt() + "\nخروجی باید دقیقاً JSON مطابق اسکیما باشد. وعده‌ها واقع‌بینانه و به فارسی نام‌گذاری شوند."
	res, err := GenerateStructured(ctx, "nutrition_plan", NutritionPlanJSONSchema(), system, userContext)
	if err != nil {
		return nil, res, err
	}
	var plan NutritionPlanSchema
	if err := json.Unmarshal(res.RawJSON, &plan); err != nil {
		return nil, res, fmt.Errorf("%w: %v", ErrUnmarshal, err)
	}
	return &plan, res, nil
}

// GenerateWorkoutPlan produces a workout plan struct (caller should Validate).
func GenerateWorkoutPlan(ctx context.Context, userContext string) (*WorkoutPlanSchema, *GenerateResult, error) {
	system := PersonaWorkout.SystemPrompt() + "\nخروجی باید دقیقاً JSON مطابق اسکیما باشد. نام روزها و حرکات به فارسی باشند."
	res, err := GenerateStructured(ctx, "workout_plan", WorkoutPlanJSONSchema(), system, userContext)
	if err != nil {
		return nil, res, err
	}
	var plan WorkoutPlanSchema
	if err := json.Unmarshal(res.RawJSON, &plan); err != nil {
		return nil, res, fmt.Errorf("%w: %v", ErrUnmarshal, err)
	}
	return &plan, res, nil
}

func mockStructured(schemaName, model string) *GenerateResult {
	var raw []byte
	switch schemaName {
	case "workout_plan":
		raw = []byte(`{
  "goal_type": "hypertrophy",
  "days": [
    {
      "day_name": "روز ۱ - سینه و سرشانه",
      "exercises": [
        {"exercise_name": "پرس سینه هالتر", "sets": 4, "reps": "8-12", "rest_seconds": 90},
        {"exercise_name": "نشر جانب دمبل", "sets": 3, "reps": "12-15", "rest_seconds": 60}
      ]
    }
  ]
}`)
	default:
		raw = []byte(`{
  "goal_type": "maintain",
  "total_calories": 2100,
  "protein_g": 150,
  "carbs_g": 220,
  "fat_g": 70,
  "meals": [
    {
      "name": "صبحانه",
      "items": [
        {"food_name": "تخم‌مرغ آب‌پز", "amount_g": 100, "calories": 155, "protein_g": 13, "carbs_g": 1.1, "fat_g": 11},
        {"food_name": "نان سنگک", "amount_g": 80, "calories": 220, "protein_g": 7, "carbs_g": 42, "fat_g": 1.5},
        {"food_name": "پنیر کم‌چرب", "amount_g": 40, "calories": 80, "protein_g": 8, "carbs_g": 1, "fat_g": 5}
      ]
    },
    {
      "name": "ناهار",
      "items": [
        {"food_name": "سینه مرغ گریل", "amount_g": 180, "calories": 300, "protein_g": 55, "carbs_g": 0, "fat_g": 6},
        {"food_name": "برنج سفید", "amount_g": 200, "calories": 260, "protein_g": 5, "carbs_g": 56, "fat_g": 0.5},
        {"food_name": "سالاد سبزیجات", "amount_g": 150, "calories": 50, "protein_g": 2, "carbs_g": 8, "fat_g": 1}
      ]
    },
    {
      "name": "میان‌وعده",
      "items": [
        {"food_name": "ماست یونانی", "amount_g": 200, "calories": 150, "protein_g": 18, "carbs_g": 8, "fat_g": 4},
        {"food_name": "بادام", "amount_g": 20, "calories": 120, "protein_g": 4, "carbs_g": 4, "fat_g": 10}
      ]
    },
    {
      "name": "شام",
      "items": [
        {"food_name": "ماهی سفید", "amount_g": 150, "calories": 200, "protein_g": 35, "carbs_g": 0, "fat_g": 5},
        {"food_name": "سیب‌زمینی پخته", "amount_g": 200, "calories": 180, "protein_g": 4, "carbs_g": 40, "fat_g": 0.2},
        {"food_name": "خیار و گوجه", "amount_g": 200, "calories": 40, "protein_g": 2, "carbs_g": 8, "fat_g": 0.2}
      ]
    },
    {
      "name": "قبل خواب",
      "items": [
        {"food_name": "کازئین / شیر کم‌چرب", "amount_g": 250, "calories": 130, "protein_g": 10, "carbs_g": 12, "fat_g": 3},
        {"food_name": "موز", "amount_g": 100, "calories": 90, "protein_g": 1, "carbs_g": 23, "fat_g": 0.3}
      ]
    }
  ]
}`)
	}
	return &GenerateResult{
		RawJSON:   raw,
		Model:     model,
		LatencyMs: 1,
		UsedMock:  true,
	}
}
