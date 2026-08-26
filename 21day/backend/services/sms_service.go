package services

import (
	"encoding/json"
	"errors"
	"fitino-challenge-backend/config"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type KavenegarReturn struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
}

type KavenegarEntry struct {
	MessageID  int64  `json:"messageid"`
	Message    string `json:"message"`
	Status     int    `json:"status"`
	StatusText string `json:"statustext"`
	Sender     string `json:"sender"`
	Receptor   string `json:"receptor"`
	Date       int64  `json:"date"`
	Cost       int    `json:"cost"`
}

type KavenegarResponse struct {
	Return  KavenegarReturn  `json:"return"`
	Entries []KavenegarEntry `json:"entries"`
}

func GenerateOTP(length int) string {
	rand.New(rand.NewSource(time.Now().UnixNano()))
	digits := "0123456789"
	otp := make([]byte, length)
	for i := range otp {
		otp[i] = digits[rand.Intn(len(digits))]
	}
	return string(otp)
}

// sendVerifyLookup calls Kavenegar's Verify Lookup endpoint. Kavenegar only
// supports positional token/token2/token3 placeholders (not named
// variables), so every pattern here is limited to at most 3 substitutions.
func sendVerifyLookup(receptor, template string, tokens ...string) (*KavenegarResponse, error) {
	apiKey := config.Config.KavenegarAPIKey
	if apiKey == "" {
		return nil, errors.New("kavenegar api key is not configured")
	}

	baseURL := fmt.Sprintf("https://api.kavenegar.com/v1/%s/verify/lookup.json", apiKey)

	params := url.Values{}
	params.Set("receptor", receptor)
	params.Set("template", template)
	for i, t := range tokens {
		key := "token"
		if i > 0 {
			key = fmt.Sprintf("token%d", i+1)
		}
		params.Set(key, t)
	}

	fullURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())

	resp, err := http.Get(fullURL)
	if err != nil {
		return nil, fmt.Errorf("kavenegar request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed reading kavenegar response: %w", err)
	}

	var kavResp KavenegarResponse
	if err := json.Unmarshal(body, &kavResp); err != nil {
		return nil, fmt.Errorf("failed to parse kavenegar response (http=%d): %w", resp.StatusCode, err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return &kavResp, fmt.Errorf("kavenegar http error: %d (%s)", resp.StatusCode, kavResp.Return.Message)
	}

	return &kavResp, nil
}

// SendSMS keeps the same signature every caller in this codebase already
// uses (phone, {"name": ...}, patternKey) — patternKey now looks up a
// Kavenegar Verify Lookup template name (config.Patterns) instead of an
// ippanel pattern code, and params["name"] becomes Kavenegar's `token`.
// An optional params["day"] becomes `token2` — used by the winback nudge
// so one template can reference whichever day the user is stuck on.
func SendSMS(phone string, params map[string]string, patternKey string) error {
	template, ok := config.Config.Patterns[patternKey]
	if !ok || template == "" {
		return fmt.Errorf("no kavenegar template configured for pattern %q", patternKey)
	}

	name := params["name"]
	if strings.Contains(name, " ") {
		// Verify Lookup tokens can't contain spaces; collapse to first word.
		name = strings.SplitN(name, " ", 2)[0]
	}

	tokens := []string{name}
	if day := params["day"]; day != "" {
		tokens = append(tokens, day)
	}

	resp, err := sendVerifyLookup(phone, template, tokens...)
	if err != nil {
		log.Printf("[SMS] Kavenegar send failed (phone=%s, template=%s): %v", phone, template, err)
		return err
	}

	log.Printf("[SMS] Sent to %s via template %q (pattern: %s): status=%d", phone, template, patternKey, resp.Return.Status)
	return nil
}
