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

// TranscribeAudio converts a short voice note to Persian text via an
// OpenAI-compatible Whisper endpoint (roadmap BE-2.3/2.4: voice-to-data pipeline,
// step 1). The transcript is then fed into GenerateStructured by the caller.
func TranscribeAudio(ctx context.Context, filename string, data []byte) (string, error) {
	cfg := config.Get()
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

func mockTranscript() string {
	return "دو تا تخم‌مرغ آب‌پز و یک لیوان شیر کم‌چرب صبحانه خوردم"
}
