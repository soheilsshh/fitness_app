package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"strings"

	"github.com/yourusername/fitness-management/config"
)

const (
	PaymentGatewayZarinpal = "zarinpal"
	zarinpalSuccessCode    = 100
	zarinpalAlreadyPaid    = 101
)

var ErrZarinpalRequestFailed = errors.New("zarinpal payment request failed")
var ErrZarinpalVerifyFailed = errors.New("zarinpal payment verify failed")

type zarinpalAPIResponse struct {
	Data struct {
		Code      int    `json:"code"`
		Message   string `json:"message"`
		Authority string `json:"authority"`
		RefID     int64  `json:"ref_id"`
	} `json:"data"`
	Errors json.RawMessage `json:"errors"`
}

// ZarinpalClient talks to ZarinPal using payments.zarinpal.* from config.yaml
// (re-read on every call so yaml/env changes after restart are not cached incorrectly).
type ZarinpalClient struct {
	httpClient *http.Client
}

func NewZarinpalClient() *ZarinpalClient {
	return &ZarinpalClient{httpClient: &http.Client{}}
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

func (z *ZarinpalClient) RequestPayment(amountRials int64, description, callbackURL, orderRef string) (authority, paymentURL string, err error) {
	merchantID := z.merchantID()
	if merchantID == "" {
		return "", "", errors.New("zarinpal merchant_id is not configured in config.yaml (payments.zarinpal.merchant_id)")
	}
	if amountRials <= 0 {
		return "", "", errors.New("invalid payment amount")
	}

	body := map[string]interface{}{
		"merchant_id":  merchantID,
		"amount":       amountRials,
		"description":  description,
		"callback_url": callbackURL,
		"metadata": map[string]string{
			"order_id": orderRef,
		},
	}

	var resp zarinpalAPIResponse
	if err := z.postJSON(z.apiBase()+"/request.json", body, &resp); err != nil {
		return "", "", err
	}
	if resp.Data.Code != zarinpalSuccessCode || resp.Data.Authority == "" {
		return "", "", fmt.Errorf("%w: code=%d message=%s", ErrZarinpalRequestFailed, resp.Data.Code, resp.Data.Message)
	}

	authority = resp.Data.Authority
	paymentURL = z.startPayBase() + authority
	return authority, paymentURL, nil
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
		return "", err
	}
	if resp.Data.Code != zarinpalSuccessCode && resp.Data.Code != zarinpalAlreadyPaid {
		return "", fmt.Errorf("%w: code=%d message=%s", ErrZarinpalVerifyFailed, resp.Data.Code, resp.Data.Message)
	}
	if resp.Data.RefID <= 0 {
		return "", fmt.Errorf("%w: missing ref_id", ErrZarinpalVerifyFailed)
	}
	return fmt.Sprintf("%d", resp.Data.RefID), nil
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
		return fmt.Errorf("parse zarinpal response: %w", err)
	}
	return nil
}
