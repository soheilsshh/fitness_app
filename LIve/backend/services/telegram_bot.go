package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strconv"
)

type TelegramBotService struct {
	BotToken string
	APIURL   string
}

type TelegramMessage struct {
	ChatID    int64  `json:"chat_id"`
	Text      string `json:"text"`
	ParseMode string `json:"parse_mode,omitempty"`
}

type TelegramUpdate struct {
	UpdateID int64 `json:"update_id"`
	Message  *struct {
		MessageID int64 `json:"message_id"`
		From      *struct {
			ID        int64  `json:"id"`
			IsBot     bool   `json:"is_bot"`
			FirstName string `json:"first_name"`
			LastName  string `json:"last_name,omitempty"`
			Username  string `json:"username,omitempty"`
		} `json:"from"`
		Chat *struct {
			ID        int64  `json:"id"`
			Type      string `json:"type"`
			FirstName string `json:"first_name,omitempty"`
			LastName  string `json:"last_name,omitempty"`
			Username  string `json:"username,omitempty"`
		} `json:"chat"`
		Text     string `json:"text"`
		Date     int64  `json:"date"`
		Document *struct {
			FileID       string `json:"file_id"`
			FileName     string `json:"file_name,omitempty"`
			MimeType     string `json:"mime_type,omitempty"`
			FileSize     int64  `json:"file_size,omitempty"`
		} `json:"document,omitempty"`
	} `json:"message"`
	CallbackQuery *struct {
		ID      string `json:"id"`
		From    *struct {
			ID        int64  `json:"id"`
			IsBot     bool   `json:"is_bot"`
			FirstName string `json:"first_name"`
			Username  string `json:"username,omitempty"`
		} `json:"from"`
		Message *struct {
			MessageID int64 `json:"message_id"`
			Chat      *struct {
				ID int64 `json:"id"`
			} `json:"chat"`
		} `json:"message"`
		Data string `json:"data"`
	} `json:"callback_query"`
}

type TelegramResponse struct {
	OK          bool   `json:"ok"`
	Description string `json:"description,omitempty"`
	Result      interface{} `json:"result,omitempty"`
}

type InlineButton struct {
	Text string
	Data string
}

func NewTelegramBotService(botToken string) *TelegramBotService {
	// Initialize queue and monitor on service creation
	InitTelegramQueue()
	monitor := InitTelegramMonitor()
	monitor.Start()
	
	return &TelegramBotService{
		BotToken: botToken,
		APIURL:   fmt.Sprintf("https://api.telegram.org/bot%s", botToken), // Only used for admin operations (GetMe, SetWebhook, etc.)
	}
}

// SendMessage sends a message to a Telegram chat directly (no queue)
func (s *TelegramBotService) SendMessage(chatID int64, text string, parseMode string) error {
	// Prepare form data
	formData := url.Values{}
	formData.Set("chat_id", strconv.FormatInt(chatID, 10))
	formData.Set("text", text)
	if parseMode != "" {
		formData.Set("parse_mode", parseMode)
	}

	// Send directly via relay (no queue)
	_, _, err := SendViaRelay(strconv.FormatInt(chatID, 10), formData, "SendMessage")
	if err != nil {
		log.Printf("[TELEGRAM] SendMessage failed: %v", err)
		return err
	}

	return nil
}

// SendMessageHTML sends an HTML formatted message
func (s *TelegramBotService) SendMessageHTML(chatID int64, text string) error {
	return s.SendMessage(chatID, text, "HTML")
}

// SendMessageMarkdown sends a Markdown formatted message
func (s *TelegramBotService) SendMessageMarkdown(chatID int64, text string) error {
	return s.SendMessage(chatID, text, "Markdown")
}

// GetMe gets bot information
func (s *TelegramBotService) GetMe() (map[string]interface{}, error) {
	resp, err := http.Get(fmt.Sprintf("%s/getMe", s.APIURL))
	if err != nil {
		return nil, fmt.Errorf("failed to get bot info: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var telegramResp TelegramResponse
	if err := json.Unmarshal(body, &telegramResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if !telegramResp.OK {
		return nil, fmt.Errorf("telegram API error: %s", telegramResp.Description)
	}

	if result, ok := telegramResp.Result.(map[string]interface{}); ok {
		return result, nil
	}

	return nil, fmt.Errorf("unexpected result format")
}

// SetWebhook sets the webhook URL for the bot
func (s *TelegramBotService) SetWebhook(url string) error {
	webhookURL := fmt.Sprintf("%s/setWebhook?url=%s", s.APIURL, url)
	resp, err := http.Get(webhookURL)
	if err != nil {
		return fmt.Errorf("failed to set webhook: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	var telegramResp TelegramResponse
	if err := json.Unmarshal(body, &telegramResp); err != nil {
		return fmt.Errorf("failed to parse response: %w", err)
	}

	if !telegramResp.OK {
		return fmt.Errorf("telegram API error: %s", telegramResp.Description)
	}

	log.Printf("✅ Telegram webhook set successfully: %s", url)
	return nil
}

// GetWebhookInfo gets current webhook information from Telegram
func (s *TelegramBotService) GetWebhookInfo() (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/getWebhookInfo", s.APIURL)
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to get webhook info: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var telegramResp TelegramResponse
	if err := json.Unmarshal(body, &telegramResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if !telegramResp.OK {
		return nil, fmt.Errorf("telegram API error: %s", telegramResp.Description)
	}

	if result, ok := telegramResp.Result.(map[string]interface{}); ok {
		return result, nil
	}

	return nil, fmt.Errorf("unexpected result format")
}

// ParseUpdate parses a webhook update from Telegram
func ParseUpdate(body []byte) (*TelegramUpdate, error) {
	var update TelegramUpdate
	if err := json.Unmarshal(body, &update); err != nil {
		return nil, fmt.Errorf("failed to parse update: %w", err)
	}
	return &update, nil
}

// AnswerCallbackQuery answers a callback query IMMEDIATELY
// Uses shared relay client with connection pooling for instant UX feedback
// This MUST complete quickly (< 20ms) to remove spinner instantly
func (s *TelegramBotService) AnswerCallbackQuery(callbackQueryID string, text string, showAlert bool) error {
	// Use relay endpoint for answerCallbackQuery
	relayURL := "https://ttte.sianacademy.com/relay/answerCallbackQuery"
	
	data := map[string]interface{}{
		"callback_query_id": callbackQueryID,
		"text":              text,
		"show_alert":         showAlert,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		log.Printf("[TELEGRAM][ACK][ERROR] marshal failed: %v", err)
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	// Use shared relay client (same connection pool as SendViaRelay)
	// This ensures connection reuse and fast response
	client := getRelayClient()

	// Send request synchronously - shared client has fast timeout (1s)
	req, err := http.NewRequest("POST", relayURL, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("[TELEGRAM][ACK][ERROR] request creation failed: %v", err)
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	// Send request - shared client ensures connection reuse
	resp, err := client.Do(req)
	if err != nil {
		// Timeout or network error - log but don't fail (ACK attempt was made)
		log.Printf("[TELEGRAM][ACK][TIMEOUT] callback=%s error=%v (non-blocking)", callbackQueryID, err)
		return nil // Don't block on ACK errors - UI should still feel responsive
	}
	
	// Quickly read status code, then close (don't wait for full body)
	defer resp.Body.Close()
	
	// Read just a small chunk to verify response, then close
	buf := make([]byte, 64)
	resp.Body.Read(buf) // Read minimal data, don't wait for full response
	
	log.Printf("[TELEGRAM][ACK][DELIVERY] callback=%s status=%d", callbackQueryID, resp.StatusCode)
	return nil
}

// SendKeyboard sends a message with inline keyboard directly (no queue)
func (s *TelegramBotService) SendKeyboard(chatID int64, text string, keyboard [][]map[string]string) error {
	log.Printf("[TELEGRAM] SendKeyboard called | chat_id=%d", chatID)

	// Prepare reply_markup as JSON string
	replyMarkup := map[string]interface{}{
			"inline_keyboard": keyboard,
	}
	keyboardJSON, err := json.Marshal(replyMarkup)
	if err != nil {
		return fmt.Errorf("failed to marshal keyboard: %w", err)
	}

	// Prepare form data
	formData := url.Values{}
	formData.Set("chat_id", strconv.FormatInt(chatID, 10))
	formData.Set("text", text)
	formData.Set("parse_mode", "HTML")
	formData.Set("reply_markup", string(keyboardJSON))

	// Send directly via relay (no queue)
	_, _, err = SendViaRelay(strconv.FormatInt(chatID, 10), formData, "SendMessage")
	if err != nil {
		log.Printf("[TELEGRAM] SendKeyboard failed: %v", err)
		return err
	}

	return nil
}

// SendReplyKeyboard sends a message with reply keyboard (persistent chat keyboard)
func (s *TelegramBotService) SendReplyKeyboard(chatID int64, text string, buttons [][]string) error {
	// Log the exact keyboard being sent
	totalButtons := 0
	for _, row := range buttons {
		totalButtons += len(row)
	}
	log.Printf("[TELEGRAM] SendReplyKeyboard | chat_id=%d | total_buttons=%d | rows=%d", chatID, totalButtons, len(buttons))
	for i, row := range buttons {
		log.Printf("[TELEGRAM] SendReplyKeyboard | row %d: %v", i, row)
	}

	rows := make([][]map[string]string, 0)
	for _, row := range buttons {
		btnRow := make([]map[string]string, 0)
		for _, label := range row {
			btnRow = append(btnRow, map[string]string{"text": label})
		}
		rows = append(rows, btnRow)
	}

	markup := map[string]interface{}{
		"keyboard":          rows,
		"resize_keyboard":   true,
		"one_time_keyboard": false,
	}

	markupJSON, _ := json.Marshal(markup)

	payload := url.Values{}
	payload.Set("chat_id", strconv.FormatInt(chatID, 10))
	payload.Set("text", text)
	payload.Set("reply_markup", string(markupJSON))

	// Send directly via relay (no queue)
	_, _, err := SendViaRelay(strconv.FormatInt(chatID, 10), payload, "SendMessage")
	if err != nil {
		log.Printf("[TELEGRAM] SendReplyKeyboard failed: %v", err)
		return err
	}

	return nil
}

// SendInlineKeyboard sends a message with inline keyboard buttons via queue
func (s *TelegramBotService) SendInlineKeyboard(chatID int64, text string, buttons [][]InlineButton) error {
	log.Printf("[TELEGRAM] SendInlineKeyboard | chat_id=%d | text=%s", chatID, text)

	rows := make([][]map[string]string, 0)
	for _, row := range buttons {
		btnRow := make([]map[string]string, 0)
		for _, btn := range row {
			btnRow = append(btnRow, map[string]string{
				"text":          btn.Text,
				"callback_data": btn.Data,
			})
		}
		rows = append(rows, btnRow)
	}

	markup := map[string]interface{}{
		"inline_keyboard": rows,
	}

	markupJSON, _ := json.Marshal(markup)

	payload := url.Values{}
	payload.Set("chat_id", strconv.FormatInt(chatID, 10))
	payload.Set("text", text)
	payload.Set("reply_markup", string(markupJSON))

	// Send directly via relay (no queue)
	_, _, err := SendViaRelay(strconv.FormatInt(chatID, 10), payload, "SendMessage")
	if err != nil {
		log.Printf("[TELEGRAM] SendInlineKeyboard failed: %v", err)
		return err
	}

	return nil
}

// SendImmediate sends a message with inline keyboard DIRECTLY
// NOTE: Now all sends are direct, this is kept for compatibility
func (s *TelegramBotService) SendImmediate(chatID int64, text string, keyboard [][]map[string]string) error {
	// Use SendKeyboard which now sends directly
	return s.SendKeyboard(chatID, text, keyboard)
}

// EditMessageText edits an existing message with new text and inline keyboard
// Uses queue system like SendKeyboard and SendReplyKeyboard for consistent performance
// NOTE: For inline callback responses, prefer SendImmediate with new message instead
func (s *TelegramBotService) EditMessageText(chatID int64, messageID int64, text string, keyboard [][]map[string]string) error {
	log.Printf("[TELEGRAM] EditMessageText called | chat_id=%d | message_id=%d", chatID, messageID)

	// Prepare reply_markup as JSON string
	replyMarkup := map[string]interface{}{
		"inline_keyboard": keyboard,
	}
	keyboardJSON, err := json.Marshal(replyMarkup)
	if err != nil {
		return fmt.Errorf("failed to marshal keyboard: %w", err)
	}

	// Prepare form data
	formData := url.Values{}
	formData.Set("chat_id", strconv.FormatInt(chatID, 10))
	formData.Set("message_id", strconv.FormatInt(messageID, 10))
	formData.Set("text", text)
	formData.Set("parse_mode", "HTML")
	formData.Set("reply_markup", string(keyboardJSON))

	// Send directly via relay (no queue)
	_, _, err = SendViaRelay(strconv.FormatInt(chatID, 10), formData, "EditMessageText")
	if err != nil {
		log.Printf("[TELEGRAM] EditMessageText failed: %v", err)
		return err
	}

	return nil
}

