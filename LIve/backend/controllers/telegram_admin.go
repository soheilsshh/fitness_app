package controllers

import (
	"log"
	"monetizeai-backend/models"
	"monetizeai-backend/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TelegramAdminController struct {
	DB          *gorm.DB
	TelegramBot *services.TelegramBotService
}

func NewTelegramAdminController(db *gorm.DB, telegramBot *services.TelegramBotService) *TelegramAdminController {
	return &TelegramAdminController{
		DB:          db,
		TelegramBot: telegramBot,
	}
}

// SetWebhook sets the Telegram webhook URL
func (ctrl *TelegramAdminController) SetWebhook(c *gin.Context) {
	if !HasPermission(c, ctrl.DB, models.PermissionAdminUsersView) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	if ctrl.TelegramBot == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Telegram Bot Service is not initialized"})
		return
	}

	var req struct {
		WebhookURL string `json:"webhook_url" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	if err := ctrl.TelegramBot.SetWebhook(req.WebhookURL); err != nil {
		log.Printf("Failed to set webhook: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set webhook: " + err.Error()})
		return
	}

	log.Printf("✅ Telegram webhook set successfully: %s", req.WebhookURL)
	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "Webhook set successfully",
		"webhook_url": req.WebhookURL,
	})
}

// GetWebhookInfo gets current webhook information
func (ctrl *TelegramAdminController) GetWebhookInfo(c *gin.Context) {
	if !HasPermission(c, ctrl.DB, models.PermissionAdminUsersView) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	if ctrl.TelegramBot == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Telegram Bot Service is not initialized"})
		return
	}

	// Get bot info
	botInfo, err := ctrl.TelegramBot.GetMe()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get bot info: " + err.Error()})
		return
	}

	// Get webhook info
	webhookInfo, err := ctrl.TelegramBot.GetWebhookInfo()
	if err != nil {
		log.Printf("Failed to get webhook info: %v", err)
		webhookInfo = nil
	}

	c.JSON(http.StatusOK, gin.H{
		"bot_info":    botInfo,
		"webhook_info": webhookInfo,
		"message":     "Use POST /api/admin/telegram/set-webhook to set webhook URL",
	})
}

// TestWebhook sends a test message to verify webhook is working
func (ctrl *TelegramAdminController) TestWebhook(c *gin.Context) {
	if !HasPermission(c, ctrl.DB, models.PermissionAdminUsersView) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	if ctrl.TelegramBot == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Telegram Bot Service is not initialized"})
		return
	}

	var req struct {
		ChatID int64  `json:"chat_id" binding:"required"`
		Text   string `json:"text"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	if req.Text == "" {
		req.Text = "✅ تست اتصال ربات تلگرام\n\nاگر این پیام را دریافت کردید، ربات به درستی کار می‌کند!"
	}

	if err := ctrl.TelegramBot.SendMessageHTML(req.ChatID, req.Text); err != nil {
		log.Printf("Failed to send test message: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Test message sent successfully",
	})
}

