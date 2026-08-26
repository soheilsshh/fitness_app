package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
	"time"

	"github.com/yourusername/fitness-management/config"
)

// TranscribeAudio converts a short voice note to Persian text.
// Prefers local Shenava ASR when enabled; falls back to OpenAI-compatible Whisper.
func TranscribeAudio(ctx context.Context, filename string, data []byte) (string, error) {
	cfg := config.Get()

	if cfg.ASR.ShenavaEnabled {
		text, err := transcribeWithShenava(ctx, filename, data)
		if err == nil {
			return text, nil
		}
		// If Whisper is not configured either, surface the Shenava error.
		if strings.TrimSpace(cfg.OpenAI.APIKey) == "" {
			if config.IsDevelopment() && isShenavaUnavailable(err) {
				return mockTranscript(), nil
			}
			return "", err
		}
		// Otherwise fall through to Whisper.
	}

	if strings.TrimSpace(cfg.OpenAI.APIKey) == "" {
		if config.IsDevelopment() {
			return mockTranscript(), nil
		}
		return "", ErrNotConfigured
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return "", err
	}
	if _, err := part.Write(data); err != nil {
		return "", err
	}
	if err := writer.WriteField("model", "whisper-1"); err != nil {
		return "", err
	}
	if err := writer.Close(); err != nil {
		return "", err
	}

	url := strings.TrimRight(cfg.OpenAI.BaseURL, "/") + "/audio/transcriptions"
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, &body)
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", writer.FormDataContentType())
	httpReq.Header.Set("Authorization", "Bearer "+cfg.OpenAI.APIKey)

	client := &http.Client{Timeout: 60 * time.Second}
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

func isShenavaUnavailable(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "shenava") ||
		strings.Contains(msg, "executable file not found") ||
		strings.Contains(msg, "no module named")
}

func mockTranscript() string {
	return "دو تا تخم‌مرغ آب‌پز و یک لیوان شیر کم‌چرب صبحانه خوردم"
}
