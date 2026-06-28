package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/yourusername/fitness-management/config"
)

// ErrSMSSendFailed is returned when the SMS provider rejects or fails the request.
var ErrSMSSendFailed = errors.New("failed to send sms")

type kavenegarReturn struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
}

type kavenegarResponse struct {
	Return kavenegarReturn `json:"return"`
}

// SendVerification sends an OTP via Kavenegar Verify Lookup.
func SendVerification(receptor, token, template string) (*kavenegarResponse, error) {
	receptor = strings.TrimSpace(receptor)
	token = strings.TrimSpace(token)
	template = strings.TrimSpace(template)

	if receptor == "" || token == "" || template == "" {
		return nil, errors.New("receptor, token and template are required")
	}
	if strings.Contains(token, " ") {
		return nil, errors.New("token contains spaces")
	}

	cfg := config.Get().SMS
	apiKey := strings.TrimSpace(cfg.APIKey)
	if apiKey == "" {
		log.Printf("sms: api_key not configured — skipping Kavenegar (receptor=%s token=%s template=%s)", receptor, token, template)
		return &kavenegarResponse{Return: kavenegarReturn{Status: 200, Message: "dev log only"}}, nil
	}

	baseURL := fmt.Sprintf("https://api.kavenegar.com/v1/%s/verify/lookup.json", apiKey)

	params := url.Values{}
	params.Set("receptor", receptor)
	params.Set("token", token)
	params.Set("template", template)

	fullURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())

	resp, err := http.Get(fullURL)
	if err != nil {
		return nil, fmt.Errorf("kavenegar request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read kavenegar response: %w", err)
	}

	var result kavenegarResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parse kavenegar response: %w", err)
	}

	if result.Return.Status != 200 {
		return &result, fmt.Errorf("%w: %s", ErrSMSSendFailed, handleKavenegarError(result.Return.Status))
	}

	return &result, nil
}

func handleKavenegarError(status int) string {
	switch status {
	case 404:
		return "invalid API key"
	case 418:
		return "insufficient credit"
	case 424:
		return "template not found or not approved"
	case 432:
		return "token placeholder not defined in template"
	default:
		return fmt.Sprintf("kavenegar error (status %d)", status)
	}
}
