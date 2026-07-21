package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/yourusername/fitness-management/config"
)

const (
	PaymentGatewayZarinpal = "zarinpal"
	zarinpalSuccessCode    = 100
	zarinpalAlreadyPaid    = 101
)

var ErrZarinpalRequestFailed = errors.New("zarinpal payment request failed")
var ErrZarinpalVerifyFailed = errors.New("zarinpal payment verify failed")

// zarinpalAPIResponse tolerates ZarinPal's dual shapes:
// success → data is an object; errors is []
// failure → data is often [] and errors is an object {code,message}
type zarinpalAPIResponse struct {
	Data   json.RawMessage `json:"data"`
	Errors json.RawMessage `json:"errors"`
}

type zarinpalData struct {
	Code      int    `json:"code"`
	Message   string `json:"message"`
	Authority string `json:"authority"`
	RefID     int64  `json:"ref_id"`
}

type zarinpalErrObj struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// ZarinpalClient talks to ZarinPal using payments.zarinpal.* from config.yaml
// (re-read on every call so yaml/env changes after restart are not cached incorrectly).
type ZarinpalClient struct {
	httpClient *http.Client
}

func NewZarinpalClient() *ZarinpalClient {
	return &ZarinpalClient{httpClient: &http.Client{Timeout: 45 * time.Second}}
}

func (z *ZarinpalClient) merchantID() string {
	return strings.TrimSpace(config.Get().Payments.Zarinpal.MerchantID)
}

func (z *ZarinpalClient) sandbox() bool {
	return config.Get().Payments.Zarinpal.Sandbox
}

func (z *ZarinpalClient) apiBase() string {
	if z.sandbox() {
		return "https://sandbox.zarinpal.com/pg/v4/payment"
	}
	return "https://api.zarinpal.com/pg/v4/payment"
}

func (z *ZarinpalClient) startPayBase() string {
	if z.sandbox() {
		return "https://sandbox.zarinpal.com/pg/StartPay/"
	}
	return "https://www.zarinpal.com/pg/StartPay/"
}

// ZarinpalAmountRials converts stored toman amounts to ZarinPal rials.
func ZarinpalAmountRials(tomans int64) int64 {
	return int64(math.Round(float64(tomans) * 10))
}

func parseZarinpalPayload(raw *zarinpalAPIResponse) (data zarinpalData, errCode int, errMsg string) {
	if raw == nil {
		return zarinpalData{}, -1, "empty zarinpal response"
	}
	trimmed := bytes.TrimSpace(raw.Data)
	if len(trimmed) > 0 && trimmed[0] == '{' {
		_ = json.Unmarshal(trimmed, &data)
	}
	et := bytes.TrimSpace(raw.Errors)
	if len(et) > 0 && et[0] == '{' {
		var eo zarinpalErrObj
		if json.Unmarshal(et, &eo) == nil && (eo.Code != 0 || eo.Message != "") {
			return data, eo.Code, eo.Message
		}
	}
	return data, 0, ""
}

func (z *ZarinpalClient) RequestPayment(amountRials int64, description, callbackURL, mobile string) (authority, paymentURL string, err error) {
	merchantID := z.merchantID()
	if merchantID == "" {
		return "", "", errors.New("zarinpal merchant_id is not configured in config.yaml (payments.zarinpal.merchant_id)")
	}
	if amountRials <= 0 {
		return "", "", errors.New("invalid payment amount")
	}
	callbackURL = strings.TrimSpace(callbackURL)
	if callbackURL == "" {
		return "", "", errors.New("zarinpal callback_url is empty")
	}
	description = strings.TrimSpace(description)
	if description == "" {
		description = "Fitinoo payment"
	}
	if len([]rune(description)) > 500 {
		description = string([]rune(description)[:500])
	}

	// ZarinPal metadata only allows mobile / email — custom keys (e.g. order_id) cause -9/-40.
	body := map[string]interface{}{
		"merchant_id":  merchantID,
		"amount":       amountRials,
		"description":  description,
		"callback_url": callbackURL,
	}
	if m := strings.TrimSpace(mobile); m != "" {
		body["metadata"] = map[string]string{"mobile": m}
	}

	log.Printf("zarinpal: request sandbox=%v amount_rials=%d callback=%s merchant=%s…",
		z.sandbox(), amountRials, callbackURL, merchantID[:min(8, len(merchantID))])

	var resp zarinpalAPIResponse
	if err := z.postJSON(z.apiBase()+"/request.json", body, &resp); err != nil {
		log.Printf("zarinpal: request http/parse error: %v", err)
		return "", "", err
	}
	data, errCode, errMsg := parseZarinpalPayload(&resp)
	if data.Code == zarinpalSuccessCode && strings.TrimSpace(data.Authority) != "" {
		authority = data.Authority
		paymentURL = z.startPayBase() + authority
		return authority, paymentURL, nil
	}
	if errCode == 0 {
		errCode = data.Code
	}
	if errMsg == "" {
		errMsg = data.Message
	}
	if errMsg == "" {
		errMsg = "unknown zarinpal error"
	}
	log.Printf("zarinpal: request rejected code=%d message=%q raw_errors=%s", errCode, errMsg, string(resp.Errors))
	return "", "", fmt.Errorf("%w: code=%d message=%s", ErrZarinpalRequestFailed, errCode, zarinpalPersianMessage(errCode, errMsg))
}

func (z *ZarinpalClient) VerifyPayment(amountRials int64, authority string) (refID string, err error) {
	merchantID := z.merchantID()
	if merchantID == "" {
		return "", errors.New("zarinpal merchant_id is not configured in config.yaml (payments.zarinpal.merchant_id)")
	}
	if strings.TrimSpace(authority) == "" {
		return "", errors.New("authority is required")
	}

	body := map[string]interface{}{
		"merchant_id": merchantID,
		"amount":      amountRials,
		"authority":   authority,
	}

	var resp zarinpalAPIResponse
	if err := z.postJSON(z.apiBase()+"/verify.json", body, &resp); err != nil {
		log.Printf("zarinpal: verify http/parse error: %v", err)
		return "", err
	}
	data, errCode, errMsg := parseZarinpalPayload(&resp)
	if data.Code == zarinpalSuccessCode || data.Code == zarinpalAlreadyPaid {
		if data.RefID <= 0 {
			return "", fmt.Errorf("%w: missing ref_id", ErrZarinpalVerifyFailed)
		}
		return fmt.Sprintf("%d", data.RefID), nil
	}
	if errCode == 0 {
		errCode = data.Code
	}
	if errMsg == "" {
		errMsg = data.Message
	}
	log.Printf("zarinpal: verify rejected code=%d message=%q", errCode, errMsg)
	return "", fmt.Errorf("%w: code=%d message=%s", ErrZarinpalVerifyFailed, errCode, zarinpalPersianMessage(errCode, errMsg))
}

func (z *ZarinpalClient) postJSON(url string, payload interface{}, out *zarinpalAPIResponse) error {
	raw, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(raw))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	res, err := z.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("zarinpal http: %w", err)
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return err
	}
	if err := json.Unmarshal(body, out); err != nil {
		snippet := string(body)
		if len(snippet) > 300 {
			snippet = snippet[:300]
		}
		return fmt.Errorf("parse zarinpal response: %w body=%s", err, snippet)
	}
	return nil
}

func zarinpalPersianMessage(code int, fallback string) string {
	switch code {
	case -9:
		return "خطای اعتبارسنجی زرین‌پال (مرچنت، مبلغ، توضیحات یا آدرس بازگشت را بررسی کنید)"
	case -10, -11, -12:
		return "کد درگاه (merchant_id) نامعتبر است یا با محیط sandbox/live هم‌خوان نیست"
	case -15:
		return "درگاه زرین‌پال برای این پذیرنده فعال نیست"
	case -16:
		return "سطح تایید پذیرنده برای این تراکنش کافی نیست"
	case -30:
		return "آدرس بازگشت (callback_url) مجاز نیست — دامنه را در پنل زرین‌پال ثبت کنید"
	case -50:
		return "مبلغ پرداخت با مبلغ تایید هم‌خوان نیست"
	case -51:
		return "پرداخت ناموفق بود"
	case -54:
		return "اتوریتی نامعتبر است"
	default:
		if strings.TrimSpace(fallback) != "" {
			return fallback
		}
		return fmt.Sprintf("خطای زرین‌پال (کد %d)", code)
	}
}
