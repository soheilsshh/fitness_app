package controllers

import (
	"io"
	"log"
	"monetizeai-backend/services"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var (
	globalTelegramWebhookControllerV2 *TelegramWebhookControllerV2
	telegramWebhookControllerV2Mu     sync.RWMutex
)

// TelegramWebhookControllerV2 handles Telegram webhooks using API client architecture
type TelegramWebhookControllerV2 struct {
	DB          *gorm.DB
	BotHandler  *services.TelegramBotHandler
	APIBaseURL  string
}

// NewTelegramWebhookControllerV2 creates a new webhook controller
func NewTelegramWebhookControllerV2(db *gorm.DB, botService *services.TelegramBotService, apiBaseURL, apiKey string) *TelegramWebhookControllerV2 {
	// Create API client
	apiClient := services.NewBotAPIClient(apiBaseURL, apiKey)
	
	// Create bot handler
	botHandler := services.NewTelegramBotHandler(botService, apiClient, db)

	return &TelegramWebhookControllerV2{
		DB:         db,
		BotHandler: botHandler,
		APIBaseURL: apiBaseURL,
	}
}

// HandleWebhook handles incoming webhook updates from Telegram
func (ctrl *TelegramWebhookControllerV2) HandleWebhook(c *gin.Context) {
	// Log webhook hit immediately
	log.Printf("[Telegram Webhook V2] ✅ POST /webhook/telegram from %s", c.ClientIP())
	
	// Read body first (must read before responding)
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("[Telegram Webhook V2] ❌ Failed to read webhook body: %v", err)
		c.JSON(http.StatusOK, gin.H{"ok": true, "error": "failed to read body"})
		return
	}

	log.Printf("[Telegram Webhook V2] Request body length: %d bytes", len(body))
	
	// Always return 200 OK immediately to Telegram (before processing)
	// This prevents Telegram from retrying if processing takes time
	c.JSON(http.StatusOK, gin.H{"ok": true})
	
	if ctrl.BotHandler == nil {
		log.Printf("[Telegram Webhook V2] ⚠️  BotHandler is nil - cannot process update")
		return // Already responded with 200
	}

	// Parse and process update in background (non-blocking)
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[Telegram Webhook V2] ❌ PANIC in webhook processing: %v", r)
			}
		}()

		update, err := services.ParseUpdate(body)
		if err != nil {
			log.Printf("[Telegram Webhook V2] ❌ Failed to parse update: %v", err)
			log.Printf("[Telegram Webhook V2] Raw body: %s", string(body))
			return
		}

		log.Printf("[Telegram Webhook V2] Successfully parsed update. Message: %v, CallbackQuery: %v", 
			update.Message != nil, update.CallbackQuery != nil)

		// Handle message
		if update.Message != nil {
			chatID := int64(0)
			userID := int64(0)
			if update.Message.Chat != nil {
				chatID = update.Message.Chat.ID
			}
			if update.Message.From != nil {
				userID = update.Message.From.ID
			}
			
			// Handle text message
			if update.Message.Text != "" {
				log.Printf("[Telegram Webhook V2] 📨 Message from chat_id=%d, user_id=%d, text=%s", 
					chatID, userID, update.Message.Text)
				ctrl.BotHandler.HandleMessage(chatID, userID, update.Message.Text)
			}
			
			// Handle document (file upload)
			if update.Message.Document != nil {
				fileID := update.Message.Document.FileID
				fileName := update.Message.Document.FileName
				log.Printf("[Telegram Webhook V2] 📎 Document from chat_id=%d, user_id=%d, file_id=%s, file_name=%s", 
					chatID, userID, fileID, fileName)
				ctrl.BotHandler.HandleDocument(chatID, userID, fileID, fileName)
			}
		}

		// Handle callback query
		if update.CallbackQuery != nil {
			chatID := int64(0)
			userID := int64(0)
			messageID := int64(0)
			callbackQueryID := update.CallbackQuery.ID
			if update.CallbackQuery.Message != nil {
				if update.CallbackQuery.Message.Chat != nil {
					chatID = update.CallbackQuery.Message.Chat.ID
				}
				messageID = update.CallbackQuery.Message.MessageID
			}
			if update.CallbackQuery.From != nil {
				userID = update.CallbackQuery.From.ID
			}
			log.Printf("[Telegram Webhook V2] 🔘 Callback from chat_id=%d, user_id=%d, data=%s", 
				chatID, userID, update.CallbackQuery.Data)
			ctrl.BotHandler.HandleCallback(
				chatID,
				userID,
				update.CallbackQuery.Data,
				callbackQueryID,
				messageID,
			)
		}
	}()
}

// SetTelegramWebhookControllerV2 sets the global controller instance
func SetTelegramWebhookControllerV2(ctrl *TelegramWebhookControllerV2) {
	telegramWebhookControllerV2Mu.Lock()
	defer telegramWebhookControllerV2Mu.Unlock()
	globalTelegramWebhookControllerV2 = ctrl
}

// TelegramWebhookHandlerV2 is a package-level handler function for Telegram webhooks
func TelegramWebhookHandlerV2(c *gin.Context) {
	log.Printf("[Telegram Webhook V2] Incoming request")
	
	telegramWebhookControllerV2Mu.RLock()
	ctrl := globalTelegramWebhookControllerV2
	telegramWebhookControllerV2Mu.RUnlock()
	
	if ctrl == nil {
		log.Printf("[Telegram Webhook V2] ⚠️  Controller not initialized")
		c.JSON(http.StatusOK, gin.H{"ok": true, "error": "controller not initialized"})
		return
	}
	
	ctrl.HandleWebhook(c)
}

