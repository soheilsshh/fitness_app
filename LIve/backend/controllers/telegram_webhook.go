package controllers

import (
	"fmt"
	"io"
	"log"
	"fitino-live-backend/models"
	"fitino-live-backend/services"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TelegramWebhookController struct {
	DB          *gorm.DB
	TelegramBot *services.TelegramBotService
}

func NewTelegramWebhookController(db *gorm.DB, telegramBot *services.TelegramBotService) *TelegramWebhookController {
	return &TelegramWebhookController{
		DB:          db,
		TelegramBot: telegramBot,
	}
}

// HandleWebhook handles incoming webhook updates from Telegram
func (ctrl *TelegramWebhookController) HandleWebhook(c *gin.Context) {
	log.Printf("[Telegram Webhook] Received webhook request from %s", c.ClientIP())
	
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("[Telegram Webhook] Failed to read webhook body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	log.Printf("[Telegram Webhook] Request body length: %d bytes", len(body))
	
	if ctrl.TelegramBot == nil {
		log.Printf("[Telegram Webhook] ERROR: TelegramBot service is nil!")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Telegram bot service not available"})
		return
	}

	update, err := services.ParseUpdate(body)
	if err != nil {
		log.Printf("[Telegram Webhook] Failed to parse update: %v", err)
		log.Printf("[Telegram Webhook] Raw body: %s", string(body))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid update format"})
		return
	}

	log.Printf("[Telegram Webhook] Successfully parsed update. Message: %v, CallbackQuery: %v", 
		update.Message != nil, update.CallbackQuery != nil)

	// Handle message
	if update.Message != nil && update.Message.Text != "" {
		log.Printf("[Telegram Webhook] Handling message from user %d: %s", 
			update.Message.From.ID, update.Message.Text)
		ctrl.handleMessage(update.Message.From.ID, update.Message.Chat.ID, update.Message.Text, update.Message.From.Username)
	}

	// Handle callback query
	if update.CallbackQuery != nil {
		log.Printf("[Telegram Webhook] Handling callback query from user %d", update.CallbackQuery.From.ID)
		ctrl.handleCallbackQuery(update.CallbackQuery)
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (ctrl *TelegramWebhookController) handleMessage(telegramUserID int64, chatID int64, text string, username string) {
	text = strings.TrimSpace(text)
	log.Printf("[Telegram Webhook] handleMessage called: userID=%d, chatID=%d, text=%s", 
		telegramUserID, chatID, text)
	
	if ctrl.TelegramBot == nil {
		log.Printf("[Telegram Webhook] ERROR: TelegramBot is nil in handleMessage!")
		return
	}
	
	// Handle /start command
	if text == "/start" {
		log.Printf("[Telegram Webhook] Processing /start command from user %d", telegramUserID)
		welcomeMsg := `🎬 <b>خوش آمدید به ربات مدیریت محتوا</b>

برای فعال‌سازی حالت محتوا سازی، لطفاً کد لایسنس خود را ارسال کنید.

کد لایسنس را می‌توانید از پنل ادمین > بخش محتوا سازی دریافت کنید.`
		
		if err := ctrl.TelegramBot.SendMessageHTML(chatID, welcomeMsg); err != nil {
			log.Printf("Failed to send welcome message: %v", err)
		}
		return
	}

	// Handle /help command
	if text == "/help" {
		helpMsg := `📖 <b>راهنمای استفاده</b>

<b>دستورات:</b>
/start - شروع ربات
/help - نمایش این راهنما
/my_license - نمایش لایسنس فعال شما

<b>فعال‌سازی لایسنس:</b>
کد لایسنس خود را ارسال کنید (فرمت: CONT-XXXX-XXXX-XXXX)

<b>پس از فعال‌سازی:</b>
بخش مدیریت محتوا در پنل ادمین برای شما فعال می‌شود.`
		
		if err := ctrl.TelegramBot.SendMessageHTML(chatID, helpMsg); err != nil {
			log.Printf("Failed to send help message: %v", err)
		}
		return
	}

	// Handle /my_license command
	if text == "/my_license" {
		telegramIDStr := strconv.FormatInt(telegramUserID, 10)
		var license models.ContentLicense
		if err := ctrl.DB.Preload("AdminUser").Where("telegram_id = ? AND is_used = ?", telegramIDStr, true).First(&license).Error; err != nil {
			msg := `❌ شما هنوز لایسنس فعالی ندارید.

لطفاً کد لایسنس خود را ارسال کنید.`
			ctrl.TelegramBot.SendMessageHTML(chatID, msg)
			return
		}

		msg := fmt.Sprintf(`✅ <b>لایسنس فعال شما:</b>

<b>کد لایسنس:</b> <code>%s</code>
<b>وضعیت:</b> فعال
<b>تاریخ فعال‌سازی:</b> %s

حالت محتوا سازی در پنل ادمین برای شما فعال است.`,
			license.Code,
			license.AssignedAt.Format("2006-01-02 15:04:05"))
		
		if license.AdminUser != nil {
			msg += fmt.Sprintf("\n\n<b>کاربر:</b> %s", license.AdminUser.Username)
		}

		ctrl.TelegramBot.SendMessageHTML(chatID, msg)
		return
	}

	// Check if text looks like a license code (starts with CONT-)
	if strings.HasPrefix(strings.ToUpper(text), "CONT-") {
		ctrl.handleLicenseActivation(telegramUserID, chatID, text, username)
		return
	}

	// Unknown command
	unknownMsg := `❓ دستور ناشناخته

برای راهنمایی از دستور /help استفاده کنید.`
	ctrl.TelegramBot.SendMessageHTML(chatID, unknownMsg)
}

func (ctrl *TelegramWebhookController) handleLicenseActivation(telegramUserID int64, chatID int64, licenseCode string, username string) {
	telegramIDStr := strconv.FormatInt(telegramUserID, 10)
	licenseCode = strings.ToUpper(strings.TrimSpace(licenseCode))

	// Find license
	var license models.ContentLicense
	if err := ctrl.DB.Preload("AdminUser").Where("code = ?", licenseCode).First(&license).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			msg := `❌ <b>کد لایسنس یافت نشد</b>

لطفاً کد لایسنس را دوباره بررسی کنید و مطمئن شوید که به درستی وارد شده است.`
			ctrl.TelegramBot.SendMessageHTML(chatID, msg)
			return
		}
		log.Printf("Error finding license: %v", err)
		msg := `❌ خطا در بررسی لایسنس. لطفاً دوباره تلاش کنید.`
		ctrl.TelegramBot.SendMessageHTML(chatID, msg)
		return
	}

	// Check if already used by another Telegram ID
	if license.IsUsed && license.TelegramID != nil && *license.TelegramID != telegramIDStr {
		msg := `❌ <b>این لایسنس قبلاً فعال شده است</b>

این کد لایسنس به حساب تلگرام دیگری اختصاص داده شده است.`
		ctrl.TelegramBot.SendMessageHTML(chatID, msg)
		return
	}

	// Check if already activated by this user
	if license.IsUsed && license.TelegramID != nil && *license.TelegramID == telegramIDStr {
		msg := fmt.Sprintf(`✅ <b>این لایسنس قبلاً توسط شما فعال شده است</b>

<b>کد لایسنس:</b> <code>%s</code>
<b>تاریخ فعال‌سازی:</b> %s

حالت محتوا سازی در پنل ادمین برای شما فعال است.`,
			license.Code,
			license.AssignedAt.Format("2006-01-02 15:04:05"))
		ctrl.TelegramBot.SendMessageHTML(chatID, msg)
		return
	}

	// Activate license
	now := time.Now()
	license.IsUsed = true
	license.TelegramID = &telegramIDStr
	license.AssignedAt = &now

	// Enable content mode for admin user
	if license.AdminUserID != nil {
		var adminUser models.AdminUser
		if err := ctrl.DB.First(&adminUser, *license.AdminUserID).Error; err == nil {
			adminUser.ContentModeEnabled = true
			if err := ctrl.DB.Save(&adminUser).Error; err != nil {
				log.Printf("Failed to enable content mode for user: %v", err)
			} else {
				log.Printf("✅ Content mode enabled for admin user %d via Telegram activation", adminUser.ID)
			}
		}
	}

	if err := ctrl.DB.Save(&license).Error; err != nil {
		log.Printf("Failed to activate license: %v", err)
		msg := `❌ خطا در فعال‌سازی لایسنس. لطفاً دوباره تلاش کنید.`
		ctrl.TelegramBot.SendMessageHTML(chatID, msg)
		return
	}

	log.Printf("✅ Content license activated via Telegram: %s for Telegram ID %s (Admin User ID: %d)", 
		licenseCode, telegramIDStr, *license.AdminUserID)

	successMsg := fmt.Sprintf(`✅ <b>لایسنس با موفقیت فعال شد!</b>

<b>کد لایسنس:</b> <code>%s</code>
<b>تاریخ فعال‌سازی:</b> %s

حالت محتوا سازی در پنل ادمین برای شما فعال شد.

اکنون می‌توانید به پنل ادمین بروید و از بخش "حالت محتوا سازی" استفاده کنید.`,
		license.Code,
		now.Format("2006-01-02 15:04:05"))

	if license.AdminUser != nil {
		successMsg += fmt.Sprintf("\n\n<b>کاربر:</b> %s", license.AdminUser.Username)
	}

	ctrl.TelegramBot.SendMessageHTML(chatID, successMsg)
}

func (ctrl *TelegramWebhookController) handleCallbackQuery(callbackQuery *struct {
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
}) {
	// Answer callback query
	if err := ctrl.TelegramBot.AnswerCallbackQuery(callbackQuery.ID, "در حال پردازش...", false); err != nil {
		log.Printf("Failed to answer callback query: %v", err)
	}

	// Handle callback data if needed
	// For now, just acknowledge
}

