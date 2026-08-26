package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"fitino-live-backend/config"
)

const farazSMSBaseURL = "http://edge.ippanel.com/v1"

// FarazSMSService handles SMS sending via Faraz SMS (IPPanel Edge) API
type FarazSMSService struct {
	config *config.FarazSMSConfig
}

// NewFarazSMSService creates a new instance of FarazSMSService
func NewFarazSMSService(cfg *config.FarazSMSConfig) *FarazSMSService {
	return &FarazSMSService{
		config: cfg,
	}
}

// GetConfig returns the service's configuration
func (s *FarazSMSService) GetConfig() *config.FarazSMSConfig {
	return s.config
}

// FarazSMSRequest represents the request structure for sending SMS
type FarazSMSRequest struct {
	SendingType string                  `json:"sending_type"`
	FromNumber  string                  `json:"from_number"`
	Message     string                  `json:"message"`
	Params      FarazSMSParams          `json:"params"`
	SendTime    string                  `json:"send_time,omitempty"`
}

// FarazSMSParams contains the recipients array
type FarazSMSParams struct {
	Recipients []string `json:"recipients"`
}

// FarazSMSResponse represents the API response structure
type FarazSMSResponse struct {
	Data FarazSMSData `json:"data"`
	Meta FarazSMSMeta `json:"meta"`
}

// FarazSMSData contains the response data
type FarazSMSData struct {
	MessageOutboxIDs []int64 `json:"message_outbox_ids"`
}

// FarazSMSMeta contains response metadata
type FarazSMSMeta struct {
	Status           bool              `json:"status"`
	Message          string            `json:"message"`
	MessageParameters []interface{}    `json:"message_parameters"`
	MessageCode      string            `json:"message_code"`
	Errors           map[string][]string `json:"errors,omitempty"`
}

// SendSimpleSMS sends a simple SMS message to one or more recipients
// This is for plain text messages without patterns
func (s *FarazSMSService) SendSimpleSMS(recipients []string, message string) error {
	log.Printf("🔵 Faraz SMS SendSimpleSMS called - Enabled: %v, Recipients: %v, Message length: %d", 
		s.config.Enabled, recipients, len(message))
	
	if !s.config.Enabled {
		log.Printf("⚠️  Faraz SMS service is disabled. Skipping SMS to %v", recipients)
		return fmt.Errorf("faraz SMS service is disabled")
	}
	
	if s.config.ApiKey == "" {
		log.Printf("❌ Faraz SMS API key is empty")
		return fmt.Errorf("faraz SMS API key is not configured")
	}
	
	if s.config.FromNumber == "" {
		log.Printf("❌ Faraz SMS from number is empty")
		return fmt.Errorf("faraz SMS from number is not configured")
	}

	if len(recipients) == 0 {
		return fmt.Errorf("recipients list is empty")
	}

	if message == "" {
		return fmt.Errorf("message cannot be empty")
	}

	// Ensure all recipients are in E.164 format (add +98 prefix if needed)
	formattedRecipients := make([]string, 0, len(recipients))
	for _, recipient := range recipients {
		formatted := s.formatPhoneNumber(recipient)
		formattedRecipients = append(formattedRecipients, formatted)
	}

	requestBody := FarazSMSRequest{
		SendingType: "webservice",
		FromNumber:  s.config.FromNumber,
		Message:     message,
		Params: FarazSMSParams{
			Recipients: formattedRecipients,
		},
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		log.Printf("❌ Failed to marshal Faraz SMS request: %v", err)
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	// Log request for debugging
	log.Printf("📤 Faraz SMS Request - URL: %s/api/send", farazSMSBaseURL)
	log.Printf("📤 Request body: %s", string(jsonData))

	url := fmt.Sprintf("%s/api/send", farazSMSBaseURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Failed to create Faraz SMS request: %v", err)
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", s.config.ApiKey)

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("❌ Failed to send Faraz SMS request: %v", err)
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()
	
	log.Printf("📡 Faraz SMS API Response Status: %d %s", resp.StatusCode, resp.Status)

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("❌ Failed to read Faraz SMS response: %v", err)
		return fmt.Errorf("failed to read response: %w", err)
	}

	// Log raw response for debugging
	log.Printf("📥 Faraz SMS API Response - Status: %d, Body: %s", resp.StatusCode, string(respBody))

	// Check HTTP status code first
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		log.Printf("❌ Faraz SMS API returned HTTP %d. Response: %s", resp.StatusCode, string(respBody))
		return fmt.Errorf("faraz sms API error: HTTP %d - %s", resp.StatusCode, string(respBody))
	}

	// Try to parse structured response
	var apiResp FarazSMSResponse
	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		// If structured parsing fails, log the actual response structure
		log.Printf("⚠️  Failed to parse Faraz SMS JSON response as structured format: %v", err)
		log.Printf("📋 Raw response body: %s", string(respBody))
		
		// Try to check for simple success indicators in raw response
		respStr := string(respBody)
		if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated {
			// Check for common success indicators
			if strings.Contains(strings.ToLower(respStr), "success") || 
			   strings.Contains(strings.ToLower(respStr), "\"status\":true") ||
			   strings.Contains(strings.ToLower(respStr), "\"status\":\"success\"") {
				log.Printf("✅ Successfully sent SMS via Faraz SMS to %d recipients (HTTP %d, success indicator found)", 
					len(formattedRecipients), resp.StatusCode)
				return nil
			}
			
			// If HTTP is OK but we can't parse, check if response is empty or contains error
			// Don't treat as success if there's any indication of error
			if strings.Contains(strings.ToLower(respStr), "error") || 
			   strings.Contains(strings.ToLower(respStr), "failed") ||
			   strings.Contains(strings.ToLower(respStr), "invalid") {
				log.Printf("❌ HTTP %d but response contains error indicators. Response: %s", 
					resp.StatusCode, string(respBody))
				return fmt.Errorf("faraz SMS API returned error: %s", string(respBody))
			}
			
			// If HTTP is OK and no error indicators, treat as success but log warning
			log.Printf("⚠️  HTTP %d but couldn't parse response. Treating as success. Response: %s", 
				resp.StatusCode, string(respBody))
			return nil
		}
		
		return fmt.Errorf("invalid JSON response from Faraz SMS: %s", string(respBody))
	}

	// Check the status in structured response
	if apiResp.Meta.Status {
		log.Printf("✅ Successfully sent SMS via Faraz SMS to %d recipients. Message IDs: %v", 
			len(formattedRecipients), apiResp.Data.MessageOutboxIDs)
		return nil
	}

	// Handle error response
	errorMsg := apiResp.Meta.Message
	if apiResp.Meta.MessageCode != "" {
		errorMsg = fmt.Sprintf("%s (code: %s)", errorMsg, apiResp.Meta.MessageCode)
	}
	if errorMsg == "" {
		errorMsg = "unknown error"
	}
	log.Printf("❌ Faraz SMS error: %s", errorMsg)
	log.Printf("📋 Full response: %+v", apiResp)
	return fmt.Errorf("faraz sms error: %s", errorMsg)
}

// SendScheduledSMS sends a scheduled SMS message
func (s *FarazSMSService) SendScheduledSMS(recipients []string, message string, sendTime time.Time) error {
	if !s.config.Enabled {
		log.Printf("Faraz SMS service is disabled. Skipping scheduled SMS to %v", recipients)
		return nil
	}

	// Ensure all recipients are in E.164 format
	formattedRecipients := make([]string, 0, len(recipients))
	for _, recipient := range recipients {
		formatted := s.formatPhoneNumber(recipient)
		formattedRecipients = append(formattedRecipients, formatted)
	}

	// Format send_time as YYYY-MM-DD HH:MM:SS (UTC)
	sendTimeStr := sendTime.UTC().Format("2006-01-02 15:04:05")

	requestBody := FarazSMSRequest{
		SendingType: "webservice",
		FromNumber:  s.config.FromNumber,
		Message:     message,
		Params: FarazSMSParams{
			Recipients: formattedRecipients,
		},
		SendTime: sendTimeStr,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		log.Printf("Failed to marshal Faraz SMS scheduled request: %v", err)
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	url := fmt.Sprintf("%s/api/send", farazSMSBaseURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Failed to create Faraz SMS scheduled request: %v", err)
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", s.config.ApiKey)

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Failed to send Faraz SMS scheduled request: %v", err)
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read Faraz SMS scheduled response: %v", err)
		return fmt.Errorf("failed to read response: %w", err)
	}

	// Check HTTP status code first
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		log.Printf("❌ Faraz SMS API returned HTTP %d. Response: %s", resp.StatusCode, string(respBody))
		return fmt.Errorf("faraz sms API error: HTTP %d - %s", resp.StatusCode, string(respBody))
	}

	// Try to parse structured response
	var apiResp FarazSMSResponse
	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		// If structured parsing fails, check if it's a simple success response
		log.Printf("⚠️  Failed to parse Faraz SMS scheduled JSON response as structured format: %v. Body: %s", err, string(respBody))
		
		// Try to check for simple success indicators
		if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated {
			log.Printf("✅ Successfully scheduled SMS via Faraz SMS to %d recipients for %s (HTTP %d)", 
				len(formattedRecipients), sendTimeStr, resp.StatusCode)
			return nil
		}
		
		return fmt.Errorf("invalid JSON response from Faraz SMS: %s", string(respBody))
	}

	if apiResp.Meta.Status {
		log.Printf("✅ Successfully scheduled SMS via Faraz SMS to %d recipients for %s. Message IDs: %v", 
			len(formattedRecipients), sendTimeStr, apiResp.Data.MessageOutboxIDs)
		return nil
	}

	errorMsg := apiResp.Meta.Message
	if apiResp.Meta.MessageCode != "" {
		errorMsg = fmt.Sprintf("%s (code: %s)", errorMsg, apiResp.Meta.MessageCode)
	}
	if errorMsg == "" {
		errorMsg = "unknown error"
	}
	log.Printf("❌ Faraz SMS scheduled error: %s", errorMsg)
	return fmt.Errorf("faraz sms error: %s", errorMsg)
}

// formatPhoneNumber converts phone number to E.164 format
// Assumes Iranian phone numbers: adds +98 prefix if not present
func (s *FarazSMSService) formatPhoneNumber(phone string) string {
	// Remove spaces and dashes
	cleaned := ""
	for _, char := range phone {
		if char >= '0' && char <= '9' || char == '+' {
			cleaned += string(char)
		}
	}

	// If already in E.164 format (starts with +98), return as is
	if len(cleaned) >= 4 && cleaned[:3] == "+98" {
		return cleaned
	}

	// If starts with 0, replace with +98
	if len(cleaned) > 0 && cleaned[0] == '0' {
		return "+98" + cleaned[1:]
	}

	// If starts with 98 (without +), add +
	if len(cleaned) >= 2 && cleaned[:2] == "98" {
		return "+" + cleaned
	}

	// If starts with 9 (10 digits), add +98
	if len(cleaned) == 10 && cleaned[0] == '9' {
		return "+98" + cleaned
	}

	// Default: assume it's a 10-digit number starting with 9
	return "+98" + cleaned
}

