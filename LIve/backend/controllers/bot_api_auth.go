package controllers

import (
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// BotAPIAuthMiddleware validates API key for bot API calls
// This allows the Telegram bot to authenticate with the backend API
// Also maps Telegram user ID to Admin user ID if provided
func BotAPIAuthMiddleware(apiKey string, db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		if apiKey == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Bot API key not configured"})
			c.Abort()
			return
		}

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Remove "Bearer " prefix if present
		token := strings.TrimPrefix(authHeader, "Bearer ")
		token = strings.TrimSpace(token)

		// Constant-time comparison to prevent timing attacks
		if !SecureStringCompare(token, apiKey) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API key"})
			c.Abort()
			return
		}

		// Set a flag to indicate this is a bot request
		c.Set("is_bot_request", true)
		
		// First, try to use X-Admin-User-ID if directly provided (preferred method)
		adminUserIDStr := c.GetHeader("X-Admin-User-ID")
		if adminUserIDStr != "" {
			if adminUserID, err := strconv.ParseUint(adminUserIDStr, 10, 32); err == nil {
				c.Set("user_id", uint(adminUserID))
				c.Set("username", "telegram_bot") // Placeholder username for bot requests
				log.Printf("[BotAPIAuth] Using X-Admin-User-ID: %d", adminUserID)
				c.Next()
				return
			}
		}
		
		// Fallback: Map Telegram user ID to Admin user ID if provided
		telegramUserIDStr := c.GetHeader("X-Telegram-User-ID")
		if telegramUserIDStr != "" {
			if telegramUserID, err := strconv.ParseInt(telegramUserIDStr, 10, 64); err == nil {
				adminUserID := MapTelegramUserToAdminUser(db, telegramUserID)
				if adminUserID > 0 {
					c.Set("user_id", adminUserID)
					c.Set("username", "telegram_bot") // Placeholder username for bot requests
					log.Printf("[BotAPIAuth] Mapped Telegram User ID %d to Admin User ID %d", telegramUserID, adminUserID)
				} else {
					log.Printf("[BotAPIAuth] Warning: Could not map Telegram User ID %d to Admin User ID", telegramUserID)
				}
			}
		}
		
		c.Next()
	}
}

