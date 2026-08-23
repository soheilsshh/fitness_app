package services

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"monetizeai-backend/config"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

type AvanakService struct {
	config *config.AvanakConfig
}

// Default Avanak token (fallback if not provided in config)
const DefaultAvanakToken = "D1C37716DAF5F47AC66290DCC591A0AC07FC943B"

// AvanakResponse represents the response from Avanak QuickSend API
type AvanakResponse struct {
	QuickSendID              int    `json:"QuickSendID"`              // If > 0, operation was successful (this is the quickSendId)
	ReturnValue              int    `json:"ReturnValue"`              // Alternative field name (for backward compatibility)
	MessageID                int    `json:"MessageID"`                // The message ID used
	MessageLength            int    `json:"MessageLength"`            // Length of the message
	CreditDecrease_InSeconds int    `json:"CreditDecrease_InSeconds"` // Credit decrease in seconds
	CreditDecrease_InPulses  int    `json:"CreditDecrease_InPulses"`  // Credit decrease in pulses
	CreditDecrease_InPrice   int    `json:"CreditDecrease_InPrice"`   // Credit decrease in price
	Status                   string `json:"Status"`                   // Status message (e.g., "User_Expired")
}

func NewAvanakService(avanakConfig *config.AvanakConfig) *AvanakService {
	return &AvanakService{
		config: avanakConfig,
	}
}

// GetConfig returns the Avanak configuration
func (s *AvanakService) GetConfig() *config.AvanakConfig {
	return s.config
}

// SendVoiceCall sends a voice call using Avanak QuickSend API
// According to official documentation: https://portal.avanak.ir/Rest/QuickSend
// messageID is optional - if provided, uses it instead of config
func (s *AvanakService) SendVoiceCall(phoneNumber string, messageID ...int) error {
	if !s.config.Enabled {
		log.Printf("⚠️ Avanak service is disabled, skipping voice call to %s", phoneNumber)
		return nil
	}

	// Use token from config or fallback to default token
	tokenVal := strings.TrimSpace(s.config.Token)
	if tokenVal == "" {
		tokenVal = DefaultAvanakToken
		log.Printf("ℹ️ Using default Avanak token from code (config token was empty)")
	}

	// Use provided messageID or fallback to config
	msgID := s.config.MessageID
	if len(messageID) > 0 && messageID[0] > 0 {
		msgID = messageID[0]
	}

	if msgID <= 0 {
		return fmt.Errorf("avanak message ID is required")
	}

	// Use configured BaseURL or default to official QuickSend endpoint
	endpoint := s.config.BaseURL
	if endpoint == "" {
		endpoint = "https://portal.avanak.ir/Rest/QuickSend"
	}

	// Prepare query parameters according to QuickSend API documentation (PHP example)
	// Using GET method with query parameters as shown in PHP sample code
	params := url.Values{}
	params.Set("Token", tokenVal)
	params.Set("MessageID", strconv.Itoa(msgID))
	params.Set("Number", phoneNumber)
	params.Set("Vote", "false") // Optional: disable voting
	params.Set("ServerID", "0") // Optional: auto server selection

	// Build URL with query parameters
	fullURL := endpoint + "?" + params.Encode()

	// Log request details for debugging (without sensitive token value)
	log.Printf("📤 Avanak API request: method=GET, endpoint=%s, MessageID=%d, Number=%s, Token length=%d, Vote=false, ServerID=0",
		endpoint, msgID, phoneNumber, len(tokenVal))

	// Create HTTP GET request
	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	// Send request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %v", err)
	}

	// Log raw response for debugging
	log.Printf("📋 Avanak API raw response (Status: %d, Content-Length: %d): %s",
		resp.StatusCode, len(respBody), string(respBody))

	// Check HTTP status code first
	if resp.StatusCode != http.StatusOK {
		log.Printf("⚠️ Avanak API returned non-200 status: %d, Response: %s", resp.StatusCode, string(respBody))
		// Still try to parse the response body for error details
	}

	// Parse JSON response
	var apiResp AvanakResponse
	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		// Try to parse as plain integer (some responses might be just a number)
		if id, convErr := strconv.Atoi(strings.TrimSpace(string(respBody))); convErr == nil {
			if id > 0 && resp.StatusCode == 200 {
				// Success: ReturnValue is the quickSendId
				log.Printf("✅ Avanak voice call sent to %s (MessageID: %d, QuickSendID: %d)", phoneNumber, msgID, id)
				return nil
			} else if id == 0 {
				// Code 0 might indicate a specific error - check if it's actually an error or success
				// According to docs: ReturnValue > 0 means success, so 0 is likely an error
				errorMsg := s.getErrorMessage(0)
				log.Printf("❌ Avanak API error: %s (code: %d, HTTP Status: %d, raw response: %s)",
					errorMsg, id, resp.StatusCode, string(respBody))
				return fmt.Errorf("avanak API error: %s (code: %d)", errorMsg, id)
			} else if id < 0 {
				// Error code returned
				errorMsg := s.getErrorMessage(id)
				log.Printf("❌ Avanak API error: %s (code: %d, HTTP Status: %d)", errorMsg, id, resp.StatusCode)
				return fmt.Errorf("avanak API error: %s (code: %d)", errorMsg, id)
			}
		}
		log.Printf("⚠️ Failed to parse Avanak response as JSON or integer: %v, Body: %s", err, string(respBody))
		// If HTTP status is OK but we can't parse, it might be a different response format
		if resp.StatusCode == http.StatusOK {
			log.Printf("⚠️ HTTP 200 but unparseable response - might be success with unexpected format")
		}
		return fmt.Errorf("invalid response from Avanak: %s", string(respBody))
	}

	// Determine the response ID: prefer QuickSendID, fallback to ReturnValue
	responseID := apiResp.QuickSendID
	if responseID == 0 {
		responseID = apiResp.ReturnValue
	}

	// Check if operation was successful: if > 0, operation was successful
	if responseID > 0 {
		log.Printf("✅ Avanak voice call sent to %s (MessageID: %d, QuickSendID: %d)", phoneNumber, msgID, responseID)
		return nil
	}

	// responseID is negative or zero, which indicates an error
	// Use Status field if available for better error message
	errorMsg := s.getErrorMessage(responseID)
	if apiResp.Status != "" {
		// Combine the status message with the error code message
		errorMsg = fmt.Sprintf("%s (Status: %s)", errorMsg, apiResp.Status)
	}
	log.Printf("❌ Avanak API error: %s (code: %d, HTTP Status: %d, raw response: %s)",
		errorMsg, responseID, resp.StatusCode, string(respBody))
	return fmt.Errorf("avanak API error: %s (code: %d)", errorMsg, responseID)
}

// getErrorMessage returns human-readable error message for Avanak error codes
func (s *AvanakService) getErrorMessage(errorCode int) string {
	switch errorCode {
	// خطاهای اصلی
	case -25:
		return "ثبت ارسال سریع غیرفعال میباشد"
	case -2:
		return "شماره اشتباه میباشد"
	case -3:
		return "عدم موجودی کافی"
	case -6:
		return "زمان ارسال غیرمجاز میباشد"
	case -8:
		return "کد فایل صوتی اشتباه میباشد"
	case -71:
		return "مدت ضبط صدا غیرمجاز میباشد"
	case -72:
		return "عدم مجوز ضبط صدا"

	// خطاهای احراز هویت
	case -1:
		return "نام کاربری یا گذرواژه اشتباه است"
	case -20:
		return "خطای ناشناخته"
	case -102:
		return "عدم احراز موبایل"
	case -103:
		return "کاربری غیرفعال شده"
	case -104:
		return "کاربری منقضی شده"
	case -105:
		return "دسترسی به وب سرویس مسدود شده"
	case -106:
		return "عدم مجوز وب سرویس"
	case -107:
		return "آی پی غیرمجاز"
	case -108:
		return "عدم مجوز متد"
	case -109:
		return "عدم مجوز استفاده از پروتکل Http"

	// خطاهای توکن
	case -201:
		return "توکن اشتباه است"
	case -202:
		return "توکن اشتباه است"
	case -203:
		return "توکن غیرفعال است"
	case -204:
		return "توکن منقضی شده است"
	case -207:
		return "آی پی غیرمجاز"
	case -208:
		return "عدم مجوز متد"

	// خطاهای سیستم
	case -300:
		return "سیستم غیرفعال است"

	// کد 0 - ممکن است به معنای خطای خاصی باشد
	case 0:
		return "خطای نامشخص - احتمالاً مشکل در احراز هویت یا تنظیمات API (کد: 0)"

	default:
		return fmt.Sprintf("خطای نامشخص (کد: %d)", errorCode)
	}
}
