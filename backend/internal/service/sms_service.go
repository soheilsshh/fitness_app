package service

import (
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"unicode"

	"github.com/yourusername/fitness-management/config"
)

// ErrSMSSendFailed is returned when the SMS provider rejects or fails the request.
var ErrSMSSendFailed = errors.New("failed to send sms")

// Kavenegar Verify Lookup — https://api.kavenegar.com/v1/{API-KEY}/verify/lookup.json
// Required: receptor, token, template. Optional: type=sms (default), token2, token3, tag.

type kavenegarReturn struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
}

type kavenegarEntry struct {
	MessageID  int64  `json:"messageid"`
	Message    string `json:"message"`
	Status     int    `json:"status"`
	StatusText string `json:"statustext"`
	Sender     string `json:"sender"`
	Receptor   string `json:"receptor"`
	Cost       int    `json:"cost"`
}

type kavenegarResponse struct {
	Return   kavenegarReturn  `json:"return"`
	Entries  []kavenegarEntry `json:"entries"`
}

var (
	hexKeyPattern    = regexp.MustCompile(`^[0-9A-Fa-f]+$`)
	invalidTokenChar = regexp.MustCompile(`[\s_\n\r\t]`)
)

func normalizeKavenegarAPIKey(raw string) string {
	key := strings.TrimSpace(raw)
	if key == "" {
		return ""
	}
	if len(key) >= 32 && len(key)%2 == 0 && hexKeyPattern.MatchString(key) {
		decoded, err := hex.DecodeString(key)
		if err == nil {
			if decodedKey := strings.TrimSpace(string(decoded)); decodedKey != "" {
				return decodedKey
			}
		}
	}
	return key
}

// escapeAPIKeyForPath keeps "=" intact; only "/" breaks the REST path segment.
func escapeAPIKeyForPath(apiKey string) string {
	return strings.ReplaceAll(apiKey, "/", "%2F")
}

func validateLookupToken(token string) error {
	token = strings.TrimSpace(token)
	if token == "" {
		return errors.New("token is required")
	}
	if len([]rune(token)) > 100 {
		return errors.New("token exceeds 100 characters")
	}
	if invalidTokenChar.MatchString(token) {
		return fmt.Errorf("%w: token format is invalid", ErrSMSSendFailed)
	}
	return nil
}

// SendVerification sends an OTP via Kavenegar Verify Lookup (اعتبارسنجی).
func SendVerification(receptor, token, template string) (*kavenegarResponse, error) {
	receptor = strings.TrimSpace(receptor)
	template = strings.TrimSpace(template)
	token = strings.TrimSpace(token)

	if receptor == "" || template == "" {
		return nil, errors.New("receptor and template are required")
	}
	if err := validateLookupToken(token); err != nil {
		if errors.Is(err, ErrSMSSendFailed) {
			return nil, fmt.Errorf("%w: %s", ErrSMSSendFailed, "فرمت کد OTP برای کاوه‌نگار نامعتبر است")
		}
		return nil, err
	}

	cfg := config.Get().SMS
	apiKey := normalizeKavenegarAPIKey(cfg.APIKey)
	if apiKey == "" {
		log.Printf("sms: api_key not configured — skipping Kavenegar (receptor=%s template=%s)", receptor, template)
		return &kavenegarResponse{Return: kavenegarReturn{Status: 200, Message: "dev log only"}}, nil
	}

	endpoint := fmt.Sprintf(
		"https://api.kavenegar.com/v1/%s/verify/lookup.json",
		escapeAPIKeyForPath(apiKey),
	)

	params := url.Values{}
	params.Set("receptor", receptor)
	params.Set("token", token)
	params.Set("template", template)
	params.Set("type", "sms")

	resp, err := http.PostForm(endpoint, params)
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
		log.Printf("sms: failed to parse kavenegar response: %v body=%s", err, string(body))
		return nil, fmt.Errorf("parse kavenegar response: %w", err)
	}

	if result.Return.Status != 200 {
		detail := persianKavenegarError(result.Return.Status, result.Return.Message, template)
		log.Printf("sms: kavenegar lookup failed status=%d message=%q receptor=%s template=%s",
			result.Return.Status, result.Return.Message, receptor, template)
		return &result, fmt.Errorf("%w: %s", ErrSMSSendFailed, detail)
	}

	if len(result.Entries) > 0 {
		entry := result.Entries[0]
		log.Printf("sms: sent lookup messageid=%d status=%d receptor=%s cost=%d",
			entry.MessageID, entry.Status, entry.Receptor, entry.Cost)
	}

	return &result, nil
}

func persianKavenegarError(status int, providerMessage, template string) string {
	if template == "" {
		template = "fittino-otp"
	}
	switch status {
	case 404:
		return "کلید API کاوه‌نگار نامعتبر است یا آدرس درخواست اشتباه است. api_key را از پنل کاوه‌نگار بررسی کنید."
	case 418:
		return "اعتبار حساب کاوه‌نگار کافی نیست."
	case 422:
		return "داده‌های ارسالی (شماره یا کد) حاوی کاراکتر نامناسب است."
	case 424:
		return fmt.Sprintf("الگوی «%s» در پنل کاوه‌نگار یافت نشد یا هنوز تأیید نشده است.", template)
	case 426:
		return "برای ارسال اعتبارسنجی باید سرویس پیشرفته کاوه‌نگار فعال باشد."
	case 428:
		return "ارسال کد از طریق تماس تلفنی برای این توکن امکان‌پذیر نیست."
	case 431:
		return "ساختار کد OTP نامعتبر است (فاصله، خط جدید یا کاراکتر جداکننده مجاز نیست)."
	case 432:
		return fmt.Sprintf("در الگوی «%s» پارامتر %%token%% تعریف نشده است.", template)
	case 607:
		return "نام tag ارسالی در پنل کاوه‌نگار تعریف نشده است."
	default:
		if msg := strings.TrimSpace(providerMessage); msg != "" {
			return fmt.Sprintf("خطای کاوه‌نگار (%d): %s", status, msg)
		}
		return fmt.Sprintf("خطای ناشناخته کاوه‌نگار (کد %d)", status)
	}
}

// SMSErrorMessage extracts a user-facing Persian message from an SMS error.
func SMSErrorMessage(err error) string {
	if err == nil {
		return "ارسال پیامک با خطا مواجه شد"
	}
	if errors.Is(err, ErrSMSSendFailed) {
		raw := err.Error()
		const prefix = "failed to send sms: "
		if strings.HasPrefix(raw, prefix) {
			return strings.TrimSpace(raw[len(prefix):])
		}
		if idx := strings.LastIndex(raw, ": "); idx >= 0 {
			return strings.TrimSpace(raw[idx+2:])
		}
	}
	if msg := strings.TrimSpace(err.Error()); msg != "" && containsPersian(msg) {
		return msg
	}
	return "ارسال پیامک با خطا مواجه شد"
}

func containsPersian(s string) bool {
	for _, r := range s {
		if unicode.In(r, unicode.Arabic) {
			return true
		}
	}
	return false
}
