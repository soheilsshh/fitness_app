package services

import (
	"encoding/json"
	"fitino-live-backend/config"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strconv"
)

// kavenegarConfig is set once at boot (SetKavenegarConfig) and read by every
// SendPatternSMS call — Kavenegar isn't wired into the DB-config-override
// system the other providers use (melipayamak/avanak), since this account
// only has one Kavenegar API key across every product, not one per admin
// panel section.
var kavenegarConfig config.KavenegarConfig

func SetKavenegarConfig(cfg config.KavenegarConfig) {
	kavenegarConfig = cfg
}

type kavenegarReturn struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
}

type kavenegarEntry struct {
	MessageID int64  `json:"messageid"`
	Status    int    `json:"status"`
	Receptor  string `json:"receptor"`
}

type kavenegarResponse struct {
	Return  kavenegarReturn  `json:"return"`
	Entries []kavenegarEntry `json:"entries"`
}

// sendKavenegarVerifyLookup mirrors the same Verify Lookup call already used
// by Joftinoo/Fitinoo/the Quantino sites/21-day. Kavenegar only supports
// positional token/token2/token3 placeholders.
func sendKavenegarVerifyLookup(receptor, template string, tokens ...string) error {
	if kavenegarConfig.APIKey == "" {
		return fmt.Errorf("kavenegar api key is not configured")
	}

	baseURL := fmt.Sprintf("https://api.kavenegar.com/v1/%s/verify/lookup.json", kavenegarConfig.APIKey)
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

	resp, err := http.Get(fmt.Sprintf("%s?%s", baseURL, params.Encode()))
	if err != nil {
		return fmt.Errorf("kavenegar request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed reading kavenegar response: %w", err)
	}

	var kavResp kavenegarResponse
	if err := json.Unmarshal(body, &kavResp); err != nil {
		return fmt.Errorf("failed to parse kavenegar response (http=%d): %w", resp.StatusCode, err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("kavenegar http error: %d (%s)", resp.StatusCode, kavResp.Return.Message)
	}

	log.Printf("[kavenegar] sent to %s via template %q: status=%d", receptor, template, kavResp.Return.Status)
	return nil
}

// kavenegarTemplateFor resolves a legacy melipayamak-style numeric pattern
// code to a Kavenegar template name. Every pattern code this codebase
// currently sends is registered in config.yaml under kavenegar.templates —
// a code with no entry there fails loudly instead of silently no-op'ing, so
// a newly-added admin-panel message type doesn't go missing silently.
func kavenegarTemplateFor(bodyId int) (string, bool) {
	t, ok := kavenegarConfig.Templates[strconv.Itoa(bodyId)]
	if !ok || t == "" {
		return "", false
	}
	return t, true
}
