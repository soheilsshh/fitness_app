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

// TranscribeAudio converts a short voice note to Persian text (workout notes,
// survey notes, free-text fields). Uses fa-calorie-api layer-3 (/transcribe)
// when configured; otherwise calls GapGPT Whisper directly.
// Food-diary "ثبت با صدا" uses LogMealFromVoice (/log-meal) instead.
func TranscribeAudio(ctx context.Context, filename string, data []byte) (string, error) {
	cfg := config.Get()

	if base := strings.TrimRight(strings.TrimSpace(cfg.ASR.CalorieAPIURL), "/"); base != "" {
		text, err := transcribeWithCalorieAPI(ctx, base, filename, data)
		if err == nil {
			return text, nil
		}
		if strings.TrimSpace(cfg.OpenAI.APIKey) == "" {
			if config.IsDevelopment() && isCalorieAPIUnavailable(err) {
				return mockTranscript(), nil
			}
			return "", err
		}
		// Calorie API down but GapGPT configured — same ASR model via direct API.
	}

	if strings.TrimSpace(cfg.OpenAI.APIKey) == "" {
		if config.IsDevelopment() {
			return mockTranscript(), nil
		}
		return "", ErrNotConfigured
	}

	return transcribeWithGapGPT(ctx, filename, data)
}

func transcribeWithCalorieAPI(ctx context.Context, base, filename string, data []byte) (string, error) {
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
		return "", err
	}
	if _, err := part.Write(data); err != nil {
		return "", err
	}
	if err := writer.Close(); err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, base+"/transcribe", &body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("%w: calorie-api transcribe: %v", ErrUpstream, err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	var parsed struct {
		Text  string `json:"text"`
		Error string `json:"detail"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return "", fmt.Errorf("%w: invalid calorie-api transcribe response", ErrUpstream)
	}
	if resp.StatusCode >= 300 {
		msg := strings.TrimSpace(parsed.Error)
		if msg == "" {
			msg = resp.Status
		}
		return "", fmt.Errorf("%w: calorie-api: %s", ErrUpstream, msg)
	}
	if strings.TrimSpace(parsed.Text) == "" {
		return "", ErrEmptyResponse
	}
	return parsed.Text, nil
}

func transcribeWithGapGPT(ctx context.Context, filename string, data []byte) (string, error) {
	cfg := config.Get().OpenAI
	model := strings.TrimSpace(config.Get().ASR.WhisperModel)
	if model == "" {
		model = "gapgpt/whisper-1"
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
		return "", err
	}
	if _, err := part.Write(data); err != nil {
		return "", err
	}
	if err := writer.WriteField("model", model); err != nil {
		return "", err
	}
	if err := writer.Close(); err != nil {
		return "", err
	}

	url := strings.TrimRight(cfg.BaseURL, "/") + "/audio/transcriptions"
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, &body)
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", writer.FormDataContentType())
	httpReq.Header.Set("Authorization", "Bearer "+cfg.APIKey)

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrUpstream, err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	var parsed struct {
		Text  string `json:"text"`
		Error *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return "", fmt.Errorf("%w: invalid transcription response", ErrUpstream)
	}
	if resp.StatusCode >= 300 {
		msg := "upstream error"
		if parsed.Error != nil && parsed.Error.Message != "" {
			msg = parsed.Error.Message
		}
		return "", fmt.Errorf("%w: %s", ErrUpstream, msg)
	}
	if strings.TrimSpace(parsed.Text) == "" {
		return "", ErrEmptyResponse
	}
	return parsed.Text, nil
}

func isCalorieAPIUnavailable(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "connection refused") ||
		strings.Contains(msg, "no such host") ||
		strings.Contains(msg, "actively refused")
}

func mockTranscript() string {
	return "دو تا تخم‌مرغ آب‌پز و یک لیوان شیر کم‌چرب صبحانه خوردم"
}
