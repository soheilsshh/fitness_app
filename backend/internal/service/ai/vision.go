package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/yourusername/fitness-management/config"
)

// BodyPhotoAnalysisSchema is a strictly observational (never diagnostic) read
// of a body-progress photo (roadmap D1/BE-5.2). The service layer always
// overwrites Disclaimer with a canonical Persian notice rather than trusting
// the model to include one — see tracking_service.go's AnalyzePhoto.
type BodyPhotoAnalysisSchema struct {
	ObservationText string `json:"observation_text"`
	PostureNotes    string `json:"posture_notes"`
	Disclaimer      string `json:"disclaimer"`
}

// BodyPhotoAnalysisJSONSchema returns the OpenAI json_schema object for body-photo analysis.
func BodyPhotoAnalysisJSONSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"observation_text": map[string]string{"type": "string"},
			"posture_notes":    map[string]string{"type": "string"},
			"disclaimer":       map[string]string{"type": "string"},
		},
		"required":             []string{"observation_text", "posture_notes", "disclaimer"},
		"additionalProperties": false,
	}
}

const bodyPhotoSystemPrompt = "تو یک دستیار مشاهده‌گر تناسب اندام فیتینو هستی، نه پزشک. فقط بر اساس ظاهر بصری عکس، مشاهدات کلی و غیرتشخیصی درباره وضعیت بدنی (مثلاً حالت قرارگیری، تقارن ظاهری، تغییر نسبت به توضیح کاربر) بنویس. هرگز تشخیص پزشکی، نام بیماری، یا درصد چربی دقیق اعلام نکن. لحن محترمانه و غیرقضاوتی داشته باش."

// AnalyzeBodyPhoto sends a body-progress photo to an OpenAI-compatible vision
// model and returns an observation-only analysis (roadmap BE-5.2). imageBase64
// must not include the data: prefix. Caller should Validate.
func AnalyzeBodyPhoto(ctx context.Context, imageBase64, mimeType, userContext string) (*BodyPhotoAnalysisSchema, *GenerateResult, error) {
	cfg := config.Get()
	model := strings.TrimSpace(cfg.OpenAI.Model)
	if model == "" {
		model = "gpt-4o-mini"
	}
	if strings.TrimSpace(cfg.OpenAI.APIKey) == "" {
		if config.IsDevelopment() {
			return mockBodyPhotoAnalysis(), &GenerateResult{Model: model, UsedMock: true}, nil
		}
		return nil, nil, ErrNotConfigured
	}

	dataURI := fmt.Sprintf("data:%s;base64,%s", mimeType, imageBase64)
	reqBody := map[string]interface{}{
		"model": model,
		"messages": []map[string]interface{}{
			{"role": "system", "content": bodyPhotoSystemPrompt},
			{"role": "user", "content": []map[string]interface{}{
				{"type": "text", "text": userContext},
				{"type": "image_url", "image_url": map[string]string{"url": dataURI}},
			}},
		},
		"response_format": map[string]interface{}{
			"type": "json_schema",
			"json_schema": map[string]interface{}{
				"name":   "body_photo_analysis",
				"strict": true,
				"schema": BodyPhotoAnalysisJSONSchema(),
			},
		},
		"temperature": 0.2,
		"max_tokens":  600,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, nil, err
	}

	url := strings.TrimRight(cfg.OpenAI.BaseURL, "/") + "/chat/completions"
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+cfg.OpenAI.APIKey)

	start := time.Now()
	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, nil, fmt.Errorf("%w: %v", ErrUpstream, err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
	var parsed apiResponse
	if err := json.Unmarshal(raw, &parsed); err != nil {
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
	var analysis BodyPhotoAnalysisSchema
	if err := json.Unmarshal([]byte(content), &analysis); err != nil {
		return nil, nil, fmt.Errorf("%w: %v", ErrUnmarshal, err)
	}

	res := &GenerateResult{RawJSON: []byte(content), Model: model, LatencyMs: int(time.Since(start).Milliseconds())}
	if parsed.Usage != nil {
		res.PromptTokens = parsed.Usage.PromptTokens
		res.CompletionTokens = parsed.Usage.CompletionTokens
	}
	return &analysis, res, nil
}

func mockBodyPhotoAnalysis() *BodyPhotoAnalysisSchema {
	return &BodyPhotoAnalysisSchema{
		ObservationText: "بر اساس عکس، وضعیت کلی بدن نسبت به دوره قبل ثابت به نظر می‌رسد.",
		PostureNotes:    "حالت قرارگیری قابل قبول است؛ برای مقایسه دقیق‌تر از زاویه و نور یکسان با عکس قبلی استفاده کن.",
		Disclaimer:      "این یک مشاهده بصری ساده است، نه تشخیص پزشکی.",
	}
}
