package controllers

import (
	"log"
	"fitino-live-backend/models"
	"strconv"

	"gorm.io/gorm"
)

// MapTelegramUserToAdminUser maps a Telegram user ID to an Admin User ID via content license
// Returns admin user ID if found, otherwise returns 0
func MapTelegramUserToAdminUser(db *gorm.DB, telegramUserID int64) uint {
	telegramIDStr := strconv.FormatInt(telegramUserID, 10)

	var license models.ContentLicense
	if err := db.Preload("AdminUser").Where("telegram_id = ? AND is_used = ?", telegramIDStr, true).First(&license).Error; err != nil {
		log.Printf("[BotUserMapper] No active license found for Telegram ID: %s", telegramIDStr)
		return 0
	}

	if license.AdminUserID != nil {
		log.Printf("[BotUserMapper] Mapped Telegram ID %s to Admin User ID %d", telegramIDStr, *license.AdminUserID)
		return *license.AdminUserID
	}

	return 0
}

