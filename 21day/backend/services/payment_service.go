package services

import (
	"bytes"
	"encoding/json"
	"fitino-challenge-backend/config"
	"fitino-challenge-backend/database"
	"fitino-challenge-backend/models"
	"fmt"
	"io"
	"net/http"
	"time"
)

type zarinpalRequest struct {
	MerchantID  string `json:"merchant_id"`
	Amount      int    `json:"amount"`
	Currency    string `json:"currency,omitempty"`
	Description string `json:"description"`
	CallbackURL string `json:"callback_url"`
	Metadata    struct {
		Mobile string `json:"mobile,omitempty"`
	} `json:"metadata,omitempty"`
}

type zarinpalRequestResponse struct {
	Data struct {
		Code      int    `json:"code"`
		Message   string `json:"message"`
		Authority string `json:"authority"`
	} `json:"data"`
	Errors []interface{} `json:"errors"`
}

type zarinpalVerify struct {
	MerchantID string `json:"merchant_id"`
	Amount     int    `json:"amount"`
	Authority  string `json:"authority"`
}

type zarinpalVerifyResponse struct {
	Data struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
		RefID   int    `json:"ref_id"`
	} `json:"data"`
	Errors []interface{} `json:"errors"`
}

// CreatePaymentRequest starts a Zarinpal payment for the 21-day program's
// full-access purchase. Amount comes from config (zarinpal.price), not the
// caller, so a client can't alter what it pays.
func CreatePaymentRequest(userID uint, phone string) (*models.Payment, string, error) {
	cfg := config.Config.Zarinpal
	amount := cfg.Price

	payment := models.Payment{
		UserID: userID,
		Phone:  phone,
		Amount: amount,
		Status: "pending",
	}
	if err := database.DB.Create(&payment).Error; err != nil {
		return nil, "", fmt.Errorf("failed to create payment record: %w", err)
	}

	reqBody := zarinpalRequest{
		MerchantID:  cfg.MerchantID,
		Amount:      amount,
		Currency:    "IRT",
		Description: "دسترسی کامل چالش ۲۱ روزه فیتینو",
		CallbackURL: cfg.CallbackURL,
	}
	reqBody.Metadata.Mobile = phone

	apiURL := "https://api.zarinpal.com/pg/v4/payment/request.json"
	if cfg.Sandbox {
		apiURL = "https://sandbox.zarinpal.com/pg/v4/payment/request.json"
	}

	var resp zarinpalRequestResponse
	if err := postJSON(apiURL, reqBody, &resp); err != nil {
		return nil, "", fmt.Errorf("zarinpal request failed: %w", err)
	}
	if resp.Data.Code != 100 {
		return nil, "", fmt.Errorf("zarinpal rejected request: %s", resp.Data.Message)
	}

	payment.Authority = resp.Data.Authority
	if err := database.DB.Save(&payment).Error; err != nil {
		return nil, "", fmt.Errorf("failed to save authority: %w", err)
	}

	payURL := fmt.Sprintf("https://www.zarinpal.com/pg/StartPay/%s", resp.Data.Authority)
	if cfg.Sandbox {
		payURL = fmt.Sprintf("https://sandbox.zarinpal.com/pg/StartPay/%s", resp.Data.Authority)
	}
	return &payment, payURL, nil
}

// VerifyPayment confirms a Zarinpal callback and updates the payment row.
func VerifyPayment(authority string) (*models.Payment, error) {
	var payment models.Payment
	if err := database.DB.Where("authority = ?", authority).First(&payment).Error; err != nil {
		return nil, fmt.Errorf("payment not found: %w", err)
	}
	if payment.Status == "success" {
		return &payment, nil // already verified, idempotent
	}

	cfg := config.Config.Zarinpal
	apiURL := "https://api.zarinpal.com/pg/v4/payment/verify.json"
	if cfg.Sandbox {
		apiURL = "https://sandbox.zarinpal.com/pg/v4/payment/verify.json"
	}

	var resp zarinpalVerifyResponse
	err := postJSON(apiURL, zarinpalVerify{
		MerchantID: cfg.MerchantID,
		Amount:     payment.Amount,
		Authority:  authority,
	}, &resp)
	if err != nil {
		return nil, fmt.Errorf("zarinpal verify request failed: %w", err)
	}

	if resp.Data.Code == 100 || resp.Data.Code == 101 {
		payment.Status = "success"
		payment.RefID = fmt.Sprintf("%d", resp.Data.RefID)
	} else {
		payment.Status = "failed"
	}
	database.DB.Save(&payment)
	return &payment, nil
}

func postJSON(url string, body interface{}, out interface{}) error {
	jsonData, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	return json.Unmarshal(respBody, out)
}
