package controllers

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"fitino-live-backend/config"
	"fitino-live-backend/models"
	"fitino-live-backend/streaming"
	"fitino-live-backend/utils"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ConfigController struct {
	DB         *gorm.DB
	FileConfig *config.Config
}

func NewConfigController(db *gorm.DB, fileConfig *config.Config) *ConfigController {
	return &ConfigController{
		DB:         db,
		FileConfig: fileConfig,
	}
}

// GetConfig returns current system configuration
// Also handles PUT requests for payment config updates (fallback)
func (ctrl *ConfigController) GetConfig(c *gin.Context) {
	// If PUT request with subscription_price in body, handle as payment update
	if c.Request.Method == "PUT" {
		var req struct {
			SubscriptionPrice *int `json:"subscription_price"`
		}
		if err := c.ShouldBindJSON(&req); err == nil && req.SubscriptionPrice != nil {
			// This is a payment config update request
			ctrl.UpdatePaymentConfig(c)
			return
		}
	}

	// Get webinar config
	webinarConfig := ctrl.getWebinarConfig()

	// Get payment config (subscription price) - ALWAYS from database first
	// Force fresh read from database
	subscriptionPrice := ctrl.FileConfig.Payment.SubscriptionPrice
	// OPTIMIZED: Only log in debug mode to reduce I/O overhead
	utils.LogDebug("💰 GetConfig: Starting with file config price: %d", subscriptionPrice)

	// Use direct raw SQL query to bypass any caching
	// FIXED: Use proper struct for Scan instead of anonymous struct
	type priceResult struct {
		ID    uint
		Value string
	}
	var priceRes priceResult
	err := ctrl.DB.Raw("SELECT id, value FROM system_configs WHERE `key` = ? LIMIT 1", "payment.subscription_price").
		Scan(&priceRes).Error

	if err == nil && priceRes.Value != "" {
		if intVal, parseErr := strconv.Atoi(priceRes.Value); parseErr == nil {
			subscriptionPrice = intVal
			utils.LogDebug("💰 GetConfig: Using DB value (from raw SQL) for subscription_price: %d (ID: %d, Raw: '%s')", subscriptionPrice, priceRes.ID, priceRes.Value)
		} else {
			utils.LogWarn("GetConfig: Failed to parse DB value '%s': %v, using file config: %d", priceRes.Value, parseErr, subscriptionPrice)
		}
	} else {
		utils.LogDebug("💰 GetConfig: No DB value found (err: %v), using file config: %d", err, subscriptionPrice)
	}

	// Also try with getConfigValueFromDB for double check
	if val, found := ctrl.getConfigValueFromDB("payment.subscription_price"); found {
		if intVal, err := strconv.Atoi(val); err == nil {
			if intVal != subscriptionPrice {
				utils.LogWarn("GetConfig: Price mismatch! Raw SQL: %d, getConfigValueFromDB: %d - Using getConfigValueFromDB value", subscriptionPrice, intVal)
				subscriptionPrice = intVal
			}
		}
	}

	// Add cache-busting headers
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")

	// Get Melipayamak config
	meliConfig := ctrl.getMelipayamakConfig()

	// Get Avanak config
	avanakConfig := ctrl.getAvanakConfig()

	// Get Faraz SMS config
	farazConfig := ctrl.getFarazConfig()

	c.JSON(http.StatusOK, gin.H{
		"webinar":     webinarConfig,
		"payment":     gin.H{"subscription_price": subscriptionPrice},
		"melipayamak": meliConfig,
		"avanak":      avanakConfig,
		"faraz_sms":   farazConfig,
	})
}

// GetPaymentConfig returns payment configuration (public endpoint)
// ALWAYS reads from database to ensure latest value is returned
func (ctrl *ConfigController) GetPaymentConfig(c *gin.Context) {
	// ALWAYS get from database first (database overrides file config)
	subscriptionPrice := ctrl.FileConfig.Payment.SubscriptionPrice
	utils.LogDebug("💰 GetPaymentConfig: Starting with file config price: %d", subscriptionPrice)

	// Use direct raw SQL query to bypass any caching
	// FIXED: Use proper struct for Scan instead of anonymous struct
	type priceResult struct {
		ID    uint
		Value string
	}
	var priceRes priceResult
	err := ctrl.DB.Raw("SELECT id, value FROM system_configs WHERE `key` = ? LIMIT 1", "payment.subscription_price").
		Scan(&priceRes).Error

	if err == nil && priceRes.Value != "" {
		if intVal, parseErr := strconv.Atoi(priceRes.Value); parseErr == nil {
			subscriptionPrice = intVal
			utils.LogDebug("💰 GetPaymentConfig: Using DB value (from raw SQL): %d (ID: %d, Raw: '%s')", subscriptionPrice, priceRes.ID, priceRes.Value)
		} else {
			utils.LogWarn("GetPaymentConfig: Failed to parse DB value '%s': %v, using file config: %d", priceRes.Value, parseErr, subscriptionPrice)
		}
	} else {
		utils.LogDebug("💰 GetPaymentConfig: No DB value found (err: %v), using file config: %d", err, subscriptionPrice)
	}

	// Add cache-busting headers to prevent browser caching
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")

	c.JSON(http.StatusOK, gin.H{
		"subscription_price": subscriptionPrice,
	})
}

func (ctrl *ConfigController) getConfigValueFromDB(key string) (string, bool) {
	var sysConfig models.SystemConfig
	// Use fresh query with no cache to ensure we get latest value
	// Use Session with PrepareStmt: false to bypass statement cache
	if err := ctrl.DB.Session(&gorm.Session{PrepareStmt: false}).Where("`key` = ?", key).First(&sysConfig).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			log.Printf("ℹ️ Config key '%s' not found in database", key)
		} else {
			log.Printf("⚠️ Error reading config key '%s' from database: %v", key, err)
		}
		return "", false
	}
	log.Printf("📖 Read config from DB: %s = %s (ID: %d, UpdatedAt: %s)", key, sysConfig.Value, sysConfig.ID, sysConfig.UpdatedAt.Format("2006-01-02 15:04:05"))
	return sysConfig.Value, true
}

// UpdateWebinarConfig updates webinar schedule configuration
// Also handles subscription_price if provided in the request
func (ctrl *ConfigController) UpdateWebinarConfig(c *gin.Context) {
	// Log raw request body for debugging
	bodyBytes, _ := c.GetRawData()
	log.Printf("🔍 UpdateWebinarConfig - Raw request body: %s", string(bodyBytes))
	// Restore body for binding
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var req struct {
		StartHour            *int    `json:"start_hour" binding:"required,min=0,max=23"`
		StartMinute          *int    `json:"start_minute" binding:"required,min=0,max=59"`
		EndHour              *int    `json:"end_hour" binding:"required,min=0,max=23"`
		CommentOffsetSeconds float64 `json:"comment_offset_seconds"` // Unified offset for all devices
		SubscriptionPrice    *int    `json:"subscription_price"`     // Optional: if provided, update price too
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("❌ UpdateWebinarConfig: Binding error - %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Validate required fields
	if req.StartHour == nil {
		log.Printf("❌ UpdateWebinarConfig: StartHour is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "start_hour is required"})
		return
	}
	if req.StartMinute == nil {
		log.Printf("❌ UpdateWebinarConfig: StartMinute is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "start_minute is required"})
		return
	}
	if req.EndHour == nil {
		log.Printf("❌ UpdateWebinarConfig: EndHour is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "end_hour is required"})
		return
	}

	log.Printf("🔍 UpdateWebinarConfig - Parsed request - SubscriptionPrice: %v", req.SubscriptionPrice)
	if req.SubscriptionPrice != nil {
		log.Printf("🔍 UpdateWebinarConfig - SubscriptionPrice value: %d", *req.SubscriptionPrice)
	}

	// Save to database
	log.Printf("💾 Saving config to database - StartHour: %d, StartMinute: %d, EndHour: %d", *req.StartHour, *req.StartMinute, *req.EndHour)
	ctrl.setConfigValue("webinar.start_hour", strconv.Itoa(*req.StartHour))
	ctrl.setConfigValue("webinar.start_minute", strconv.Itoa(*req.StartMinute))
	ctrl.setConfigValue("webinar.end_hour", strconv.Itoa(*req.EndHour))

	// Calculate duration (support for next-day end time)
	// If EndHour < StartHour, it means the webinar ends the next day
	startMinutes := *req.StartHour*60 + *req.StartMinute
	endMinutes := *req.EndHour * 60

	var duration int
	if endMinutes <= startMinutes {
		// Webinar ends the next day - add 24 hours (1440 minutes)
		duration = (1440 - startMinutes) + endMinutes
		log.Printf("📅 Webinar spans midnight: Start %02d:%02d -> End next day %02d:00 (duration: %d minutes)",
			*req.StartHour, *req.StartMinute, *req.EndHour, duration)
	} else {
		// Same day
		duration = endMinutes - startMinutes
		log.Printf("📅 Webinar same day: Start %02d:%02d -> End %02d:00 (duration: %d minutes)",
			*req.StartHour, *req.StartMinute, *req.EndHour, duration)
	}

	ctrl.setConfigValue("webinar.duration_minutes", strconv.Itoa(duration))

	// Save unified comment offset value
	log.Printf("💾 Saving unified comment offset: %.2f seconds", req.CommentOffsetSeconds)
	ctrl.setConfigValue("webinar.comment_offset_seconds", strconv.FormatFloat(req.CommentOffsetSeconds, 'f', -1, 64))
	log.Printf("✅ Unified comment offset saved successfully")

	// If subscription_price is provided, update it too
	log.Printf("🔍 Checking subscription_price - req.SubscriptionPrice: %v", req.SubscriptionPrice)
	if req.SubscriptionPrice != nil {
		log.Printf("🔍 subscription_price is not nil, value: %d", *req.SubscriptionPrice)
		if *req.SubscriptionPrice > 0 {
			log.Printf("💾 Also updating subscription price: %d", *req.SubscriptionPrice)
			ctrl.setConfigValue("payment.subscription_price", strconv.Itoa(*req.SubscriptionPrice))
			log.Printf("✅ Subscription price updated: %d", *req.SubscriptionPrice)

			// Verify it was saved - wait a bit first
			time.Sleep(100 * time.Millisecond)
			if val, found := ctrl.getConfigValueFromDB("payment.subscription_price"); found {
				log.Printf("✅ Verified: subscription_price in DB = '%s' (expected: '%s')", val, strconv.Itoa(*req.SubscriptionPrice))
				if val != strconv.Itoa(*req.SubscriptionPrice) {
					log.Printf("⚠️ WARNING: Price mismatch! Expected: %d (string: '%s'), Got in DB: '%s'", *req.SubscriptionPrice, strconv.Itoa(*req.SubscriptionPrice), val)
					// Try to parse both to see the difference
					if gotInt, err := strconv.Atoi(val); err == nil {
						log.Printf("⚠️ DB value as int: %d (difference: %d)", gotInt, gotInt-*req.SubscriptionPrice)
					}
				} else {
					log.Printf("✅ Price verification successful: %d = '%s'", *req.SubscriptionPrice, val)
				}
			} else {
				log.Printf("⚠️ WARNING: subscription_price not found in DB after save!")
			}
		} else {
			log.Printf("⚠️ subscription_price is <= 0: %d", *req.SubscriptionPrice)
		}
	} else {
		log.Printf("⚠️ subscription_price is nil - not updating price")
	}

	// CRITICAL: Clear manual stop flag when admin updates webinar config
	// This allows stream to start again at the new scheduled time
	ctrl.setConfigValue("webinar.manual_stop", "false")
	log.Printf("✅ Manual stop flag cleared - stream will start at new scheduled time")

	// Update webinar table in database with new times
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}

	var webinar models.Webinar
	if err := ctrl.DB.First(&webinar).Error; err == nil {
		now := time.Now().In(loc)

		// CRITICAL: Check if stream is currently running
		// If stream is running, STOP IT immediately when config changes
		// This ensures stream stops and waits for new schedule
		if streaming.IsStreamRunning() {
			log.Printf("🛑 Stream is currently running. Stopping it due to config change...")
			streaming.StopStream("rtmp://localhost:1935/live/stream")
			// Wait a moment for cleanup to complete
			time.Sleep(1 * time.Second)
		}

		// CRITICAL: Check if webinar is currently active
		// If active, only update config in database, but DON'T change StartTime/EndTime
		// This preserves the current session
		if !webinar.StartTime.IsZero() && !webinar.EndTime.IsZero() {
			startTimeInLoc := webinar.StartTime.In(loc)
			endTimeInLoc := webinar.EndTime.In(loc)

			if now.After(startTimeInLoc) && now.Before(endTimeInLoc) {
				log.Printf("⏸️  Webinar is currently active (started at %s, ends at %s). Config updated in database, stream stopped. New config will be applied at new start time.",
					startTimeInLoc.Format("2006-01-02 15:04:05"),
					endTimeInLoc.Format("2006-01-02 15:04:05"))
				log.Printf("💡 Stream has been stopped. It will start again at the new scheduled time.")
				// Don't update StartTime/EndTime - preserve current session
			} else {
				// Webinar is not active - safe to update times
				// Calculate new start and end times - allow any time, even past times
				// Always use today's date for start time calculation
				startTime := time.Date(now.Year(), now.Month(), now.Day(), *req.StartHour, *req.StartMinute, 0, 0, loc)
				timeDiff := now.Sub(startTime)
				// Only move to tomorrow if start time is more than 1 minute in the past
				// This allows setting time for immediate start (within 1 minute)
				if timeDiff > 1*time.Minute {
					startTime = startTime.AddDate(0, 0, 1) // Use tomorrow if past start time by more than 1 minute
					log.Printf("📅 Start time is more than 1 minute in the past. Using tomorrow: %s", startTime.Format("2006-01-02 15:04:05"))
				} else {
					log.Printf("📅 Using start time for today: %s", startTime.Format("2006-01-02 15:04:05"))
				}

				// Calculate end time based on start time
				// First, set end time to the same day as start time
				endTime := time.Date(startTime.Year(), startTime.Month(), startTime.Day(), *req.EndHour, 0, 0, 0, loc)

				// If EndHour < StartHour, it means webinar spans midnight (e.g., 0:20 to 2:30)
				// In this case, end time should be the next day
				// Also handle case where EndHour == StartHour but StartMinute > 0 (e.g., 0:20 to 0:30)
				if *req.EndHour < *req.StartHour || (*req.EndHour == *req.StartHour && *req.StartMinute > 0) {
					endTime = endTime.AddDate(0, 0, 1)
					log.Printf("📅 Webinar spans midnight: End time moved to next day: %s", endTime.Format("2006-01-02 15:04:05"))
				} else if endTime.Before(startTime) || endTime.Equal(startTime) {
					// Safety check: if end time is before or equal to start time, move to next day
					endTime = endTime.AddDate(0, 0, 1)
					log.Printf("📅 End time is before/equal to start time. Moved to next day: %s", endTime.Format("2006-01-02 15:04:05"))
				} else {
					log.Printf("📅 End time same day as start: %s", endTime.Format("2006-01-02 15:04:05"))
				}

				// Update webinar times with error handling
				if err := ctrl.DB.Model(&webinar).Updates(map[string]interface{}{
					"StartTime": startTime,
					"EndTime":   endTime,
				}).Error; err != nil {
					log.Printf("❌ Failed to update webinar times in database: %v", err)
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update webinar times: " + err.Error()})
					return
				}

				log.Printf("✅ Webinar table updated: StartTime=%s, EndTime=%s",
					startTime.Format("2006-01-02 15:04:05"),
					endTime.Format("2006-01-02 15:04:05"))
			}
		} else {
			// Webinar times not set - safe to update
			// Calculate new start and end times - allow any time, even past times
			// Always use today's date for start time calculation
			startTime := time.Date(now.Year(), now.Month(), now.Day(), *req.StartHour, *req.StartMinute, 0, 0, loc)
			timeDiff := now.Sub(startTime)
			// Only move to tomorrow if start time is more than 1 minute in the past
			// This allows setting time for immediate start (within 1 minute)
			if timeDiff > 1*time.Minute {
				startTime = startTime.AddDate(0, 0, 1) // Use tomorrow if past start time by more than 1 minute
				log.Printf("📅 Start time is more than 1 minute in the past. Using tomorrow: %s", startTime.Format("2006-01-02 15:04:05"))
			} else {
				log.Printf("📅 Using start time for today: %s", startTime.Format("2006-01-02 15:04:05"))
			}

			// Calculate end time based on start time
			// First, set end time to the same day as start time
			endTime := time.Date(startTime.Year(), startTime.Month(), startTime.Day(), *req.EndHour, 0, 0, 0, loc)

			// If EndHour < StartHour, it means webinar spans midnight (e.g., 0:20 to 2:30)
			// In this case, end time should be the next day
			// Also handle case where EndHour == StartHour but StartMinute > 0 (e.g., 0:20 to 0:30)
			if *req.EndHour < *req.StartHour || (*req.EndHour == *req.StartHour && *req.StartMinute > 0) {
				endTime = endTime.AddDate(0, 0, 1)
				log.Printf("📅 Webinar spans midnight: End time moved to next day: %s", endTime.Format("2006-01-02 15:04:05"))
			} else if endTime.Before(startTime) || endTime.Equal(startTime) {
				// Safety check: if end time is before or equal to start time, move to next day
				endTime = endTime.AddDate(0, 0, 1)
				log.Printf("📅 End time is before/equal to start time. Moved to next day: %s", endTime.Format("2006-01-02 15:04:05"))
			} else {
				log.Printf("📅 End time same day as start: %s", endTime.Format("2006-01-02 15:04:05"))
			}

			// Update webinar times with error handling
			if err := ctrl.DB.Model(&webinar).Updates(map[string]interface{}{
				"StartTime": startTime,
				"EndTime":   endTime,
			}).Error; err != nil {
				log.Printf("❌ Failed to update webinar times in database: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update webinar times: " + err.Error()})
				return
			}

			log.Printf("✅ Webinar table updated: StartTime=%s, EndTime=%s",
				startTime.Format("2006-01-02 15:04:05"),
				endTime.Format("2006-01-02 15:04:05"))
		}
	}

	log.Printf("✅ Webinar config updated: Start=%02d:%02d, End=%02d:00", *req.StartHour, *req.StartMinute, *req.EndHour)

	// CRITICAL: After stopping stream (if it was running), check when new stream should start
	// The scheduler's periodic check will handle starting the stream at the new time
	go func() {
		// Wait a moment for database update and stream stop to complete
		time.Sleep(1 * time.Second)

		// Reload config from database to get the values we just saved
		dynamicConfig := config.LoadConfigFromDB(ctrl.DB, ctrl.FileConfig)

		// Check when new stream should start
		loc, err := time.LoadLocation("Asia/Tehran")
		if err != nil {
			loc = time.UTC
		}

		now := time.Now().In(loc)

		// DEBUG: Log the config values we loaded
		log.Printf("🔍 DEBUG: Loaded config from DB - StartHour: %d, StartMinute: %d, EndHour: %d",
			dynamicConfig.Webinar.StartHour, dynamicConfig.Webinar.StartMinute, dynamicConfig.Webinar.EndHour)

		expectedStartTime := time.Date(now.Year(), now.Month(), now.Day(), dynamicConfig.Webinar.StartHour, dynamicConfig.Webinar.StartMinute, 0, 0, loc)
		expectedEndTime := time.Date(now.Year(), now.Month(), now.Day(), dynamicConfig.Webinar.EndHour, 0, 0, 0, loc)

		// DEBUG: Log current time and expected start time
		log.Printf("🔍 DEBUG: Current time: %s, Expected start time (today): %s",
			now.Format("2006-01-02 15:04:05"), expectedStartTime.Format("2006-01-02 15:04:05"))
		log.Printf("🔍 DEBUG: Is now after expected start? %v", now.After(expectedStartTime))

		// CRITICAL: Only move to tomorrow if start time has already passed TODAY by more than 1 minute
		// If start time is in the future today or within 1 minute, use today
		// This allows setting time for immediate start
		timeDiff := now.Sub(expectedStartTime)
		if timeDiff > 1*time.Minute {
			// Start time has passed by more than 1 minute - use tomorrow
			expectedStartTime = expectedStartTime.AddDate(0, 0, 1)
			expectedEndTime = expectedEndTime.AddDate(0, 0, 1)
			log.Printf("📅 Start time has passed today by more than 1 minute. Using tomorrow: %s", expectedStartTime.Format("2006-01-02 15:04:05"))
		} else {
			log.Printf("📅 Start time is in the future today or within 1 minute. Using today: %s", expectedStartTime.Format("2006-01-02 15:04:05"))
		}

		// Check if we're within the new webinar time window
		if now.After(expectedStartTime) && now.Before(expectedEndTime) {
			log.Printf("🚀 New config: Webinar is currently active (new time window). Stream will be started by scheduler within 1 minute.")
		} else {
			timeUntilStart := expectedStartTime.Sub(now)
			log.Printf("⏰ New config: Webinar will start at %s (in %v). Stream will start automatically at that time.",
				expectedStartTime.Format("2006-01-02 15:04:05"), timeUntilStart)
		}
	}()

	log.Printf("💡 NOTE: Stream has been stopped (if it was running). Scheduler will start it at the new scheduled time.")
	log.Printf("💡 NOTE: Scheduler periodic check (every minute) will use new config and start stream at the right time.")

	c.JSON(http.StatusOK, gin.H{
		"message": "Webinar configuration updated successfully",
		"config": gin.H{
			"start_hour":       *req.StartHour,
			"start_minute":     *req.StartMinute,
			"end_hour":         *req.EndHour,
			"duration_minutes": duration,
		},
	})
}

// UpdateMelipayamakConfig updates Melipayamak SMS service configuration
func (ctrl *ConfigController) UpdateMelipayamakConfig(c *gin.Context) {
	var req struct {
		Username             string `json:"username"`
		ApiKey               string `json:"api_key"`
		BodyIdWelcome        int    `json:"body_id_welcome"`
		BodyIdWelcomeNextDay int    `json:"body_id_welcome_next_day"`
		BodyIdReminder2PM    int    `json:"body_id_reminder_2pm"`
		BodyIdReminder30Min  int    `json:"body_id_reminder_30min"`
		Enabled              bool   `json:"enabled"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Save to database
	if req.Username != "" {
		ctrl.setConfigValue("melipayamak.username", req.Username)
	}
	if req.ApiKey != "" {
		ctrl.setConfigValue("melipayamak.api_key", req.ApiKey)
	}
	if req.BodyIdWelcome > 0 {
		ctrl.setConfigValue("melipayamak.body_id_welcome", strconv.Itoa(req.BodyIdWelcome))
	}
	if req.BodyIdWelcomeNextDay > 0 {
		ctrl.setConfigValue("melipayamak.body_id_welcome_next_day", strconv.Itoa(req.BodyIdWelcomeNextDay))
	}
	if req.BodyIdReminder2PM > 0 {
		ctrl.setConfigValue("melipayamak.body_id_reminder_2pm", strconv.Itoa(req.BodyIdReminder2PM))
	}
	if req.BodyIdReminder30Min > 0 {
		ctrl.setConfigValue("melipayamak.body_id_reminder_30min", strconv.Itoa(req.BodyIdReminder30Min))
	}
	ctrl.setConfigValue("melipayamak.enabled", strconv.FormatBool(req.Enabled))

	log.Printf("✅ Melipayamak config updated")

	c.JSON(http.StatusOK, gin.H{
		"message": "Melipayamak configuration updated successfully",
	})
}

// UpdateAvanakConfig updates Avanak voice call service configuration
func (ctrl *ConfigController) UpdateAvanakConfig(c *gin.Context) {
	var req struct {
		Token     string `json:"token"`
		MessageID int    `json:"message_id"`
		BaseURL   string `json:"base_url"`
		Enabled   bool   `json:"enabled"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Save to database
	if req.Token != "" {
		ctrl.setConfigValue("avanak.token", req.Token)
	}
	if req.MessageID > 0 {
		ctrl.setConfigValue("avanak.message_id", strconv.Itoa(req.MessageID))
	}
	if req.BaseURL != "" {
		ctrl.setConfigValue("avanak.base_url", req.BaseURL)
	}
	ctrl.setConfigValue("avanak.enabled", strconv.FormatBool(req.Enabled))

	log.Printf("✅ Avanak config updated")

	c.JSON(http.StatusOK, gin.H{
		"message": "Avanak configuration updated successfully",
	})
}

// UpdateFarazConfig updates Faraz SMS service configuration
func (ctrl *ConfigController) UpdateFarazConfig(c *gin.Context) {
	var req struct {
		ApiKey     string `json:"api_key"`
		FromNumber string `json:"from_number"`
		Enabled    bool   `json:"enabled"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Save to database
	if req.ApiKey != "" {
		ctrl.setConfigValue("faraz_sms.api_key", req.ApiKey)
	}
	if req.FromNumber != "" {
		ctrl.setConfigValue("faraz_sms.from_number", req.FromNumber)
	}
	ctrl.setConfigValue("faraz_sms.enabled", strconv.FormatBool(req.Enabled))

	log.Printf("✅ Faraz SMS config updated")

	c.JSON(http.StatusOK, gin.H{
		"message": "Faraz SMS configuration updated successfully",
	})
}

// UpdateWebinarCapacity updates webinar capacity and optionally resets registered count
func (ctrl *ConfigController) UpdateWebinarCapacity(c *gin.Context) {
	var req struct {
		Capacity        *int  `json:"capacity"`         // New capacity (null = don't change)
		ResetRegistered *bool `json:"reset_registered"` // If true, reset registered_count to 0
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	var webinar models.Webinar
	if err := ctrl.DB.First(&webinar).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Webinar not found"})
		return
	}

	updates := make(map[string]interface{})

	if req.Capacity != nil {
		oldCapacity := webinar.Capacity
		updates["Capacity"] = *req.Capacity
		log.Printf("📊 Updating webinar capacity: %d -> %d", oldCapacity, *req.Capacity)
	}

	if req.ResetRegistered != nil && *req.ResetRegistered {
		oldCount := webinar.RegisteredCount
		updates["RegisteredCount"] = 0
		log.Printf("🔄 Resetting registered count: %d -> 0", oldCount)
	}

	if len(updates) > 0 {
		ctrl.DB.Model(&webinar).Updates(updates)
		log.Printf("✅ Webinar capacity updated successfully")
	}

	// Reload to get updated values
	ctrl.DB.First(&webinar)

	c.JSON(http.StatusOK, gin.H{
		"message": "Webinar capacity updated successfully",
		"webinar": gin.H{
			"capacity":         webinar.Capacity,
			"registered_count": webinar.RegisteredCount,
		},
	})
}

// PreGenerateHLS generates HLS files from video file before webinar starts
// This reduces lag during streaming by pre-encoding the video
func (ctrl *ConfigController) PreGenerateHLS(c *gin.Context) {
	// Default video file path
	videoFilePath := "./videos/video1.mp4"

	// Check if video file exists
	if _, err := os.Stat(videoFilePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Video file not found",
			"message": fmt.Sprintf("Video file not found: %s", videoFilePath),
		})
		return
	}

	// Run pre-generation in a goroutine to avoid blocking
	go func() {
		log.Printf("🎬 Starting HLS pre-generation from admin panel...")
		if err := streaming.PreGenerateHLSFromFile(videoFilePath); err != nil {
			log.Printf("❌ Failed to pre-generate HLS files: %v", err)
		} else {
			log.Printf("✅ HLS pre-generation completed successfully!")
			// Set flag in database to indicate HLS files are pre-generated
			// This prevents the system from cleaning up HLS files
			ctrl.setConfigValue("hls.pre_generated", "true")
			log.Printf("✅ HLS pre-generated flag set in database")
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "HLS pre-generation started. This may take a few minutes. Check server logs for progress.",
	})
}

// CheckPreGeneratedHLSStatus checks if pre-generated HLS files exist and returns progress
func (ctrl *ConfigController) CheckPreGeneratedHLSStatus(c *gin.Context) {
	hasPreGenerated := streaming.HasPreGeneratedHLS()

	// Get generation progress
	videoFilePath := "./videos/video1.mp4"
	progress, status, err := streaming.GetHLSGenerationProgress(videoFilePath)
	if err != nil {
		// If error getting progress, just return status
		c.JSON(http.StatusOK, gin.H{
			"has_pre_generated": hasPreGenerated,
			"message": func() string {
				if hasPreGenerated {
					return "Pre-generated HLS files are ready"
				}
				return "Pre-generated HLS files not found. Please generate them before the webinar."
			}(),
			"progress": 0,
			"status":   "نامشخص",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"has_pre_generated": hasPreGenerated,
		"message": func() string {
			if hasPreGenerated {
				return "Pre-generated HLS files are ready"
			}
			if progress > 0 {
				return fmt.Sprintf("در حال تولید... (%d%%)", progress)
			}
			return "Pre-generated HLS files not found. Please generate them before the webinar."
		}(),
		"progress": progress,
		"status":   status,
	})
}

// ListHLSFiles lists all files in the hls_media directory
func (ctrl *ConfigController) ListHLSFiles(c *gin.Context) {
	hlsPath := "hls_media"

	// Check if directory exists
	dir, err := os.Open(hlsPath)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"files": []string{},
			"error": "Directory not found or cannot be accessed",
		})
		return
	}
	defer dir.Close()

	// Read directory contents
	files, err := dir.Readdir(-1)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to read directory: %v", err),
		})
		return
	}

	// Collect file names and sizes
	type FileInfo struct {
		Name string `json:"name"`
		Size int64  `json:"size"`
	}

	fileList := make([]FileInfo, 0, len(files))
	for _, file := range files {
		if !file.IsDir() {
			fileList = append(fileList, FileInfo{
				Name: file.Name(),
				Size: file.Size(),
			})
		}
	}

	// Sort files like `ls` command (natural sort with numbers)
	sort.Slice(fileList, func(i, j int) bool {
		// Extract numbers from filenames for natural sorting
		getNumber := func(name string) int {
			// Try to extract number from filename (e.g., stream123.ts -> 123)
			re := regexp.MustCompile(`(\d+)`)
			matches := re.FindAllString(name, -1)
			if len(matches) > 0 {
				if num, err := strconv.Atoi(matches[len(matches)-1]); err == nil {
					return num
				}
			}
			return 0
		}

		// Sort .m3u8 files first
		if strings.HasSuffix(fileList[i].Name, ".m3u8") && !strings.HasSuffix(fileList[j].Name, ".m3u8") {
			return true
		}
		if !strings.HasSuffix(fileList[i].Name, ".m3u8") && strings.HasSuffix(fileList[j].Name, ".m3u8") {
			return false
		}

		// Natural sort by number
		numI := getNumber(fileList[i].Name)
		numJ := getNumber(fileList[j].Name)
		if numI != numJ {
			return numI < numJ
		}

		// If numbers are equal, sort alphabetically
		return fileList[i].Name < fileList[j].Name
	})

	c.JSON(http.StatusOK, gin.H{
		"files": fileList,
		"count": len(fileList),
	})
}

// DeleteHLSFiles deletes all files in the hls_media directory
func (ctrl *ConfigController) DeleteHLSFiles(c *gin.Context) {
	hlsPath := "hls_media"

	// Check if directory exists
	dir, err := os.Open(hlsPath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Directory not found or cannot be accessed",
		})
		return
	}
	defer dir.Close()

	// Read directory contents
	files, err := dir.Readdir(-1)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to read directory: %v", err),
		})
		return
	}

	// Delete all files
	deletedCount := 0
	var errors []string
	for _, file := range files {
		if !file.IsDir() {
			filePath := filepath.Join(hlsPath, file.Name())
			if err := os.Remove(filePath); err != nil {
				errors = append(errors, fmt.Sprintf("Failed to delete %s: %v", file.Name(), err))
				log.Printf("❌ Failed to delete file %s: %v", filePath, err)
			} else {
				deletedCount++
				log.Printf("✅ Deleted file: %s", filePath)
			}
		}
	}

	// Clear the pre-generated flag in database
	ctrl.setConfigValue("hls.pre_generated", "false")
	log.Printf("✅ HLS pre-generated flag cleared in database")

	if len(errors) > 0 {
		c.JSON(http.StatusPartialContent, gin.H{
			"message":       fmt.Sprintf("Deleted %d files, but some errors occurred", deletedCount),
			"deleted_count": deletedCount,
			"errors":        errors,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       fmt.Sprintf("Successfully deleted %d files", deletedCount),
		"deleted_count": deletedCount,
	})
}

// StopStream manually stops the stream and sets a flag to prevent it from restarting
func (ctrl *ConfigController) StopStream(c *gin.Context) {
	log.Printf("🛑 Manual stream stop requested by admin")

	// Stop the stream immediately
	if streaming.IsStreamRunning() {
		log.Printf("🛑 Stopping currently running stream...")
		streaming.StopStream("rtmp://localhost:1935/live/stream")
		// Wait a moment for cleanup
		time.Sleep(1 * time.Second)
		log.Printf("✅ Stream stopped successfully")
	} else {
		log.Printf("ℹ️  No stream is currently running")
	}

	// Set a flag in database to prevent stream from restarting
	// This flag will be checked by scheduler and GetWebinarInfo
	ctrl.setConfigValue("webinar.manual_stop", "true")
	log.Printf("✅ Manual stop flag set in database")

	// Also update webinar IsLive to false
	var webinar models.Webinar
	if err := ctrl.DB.First(&webinar).Error; err == nil {
		ctrl.DB.Model(&webinar).Update("IsLive", false)
		log.Printf("✅ Webinar IsLive set to false")
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Stream stopped successfully and will not restart until flag is cleared",
	})
}

// Helper functions to get/set config values from database
func (ctrl *ConfigController) getConfigValue(key string, defaultValue string) string {
	var config models.SystemConfig
	if err := ctrl.DB.Where("`key` = ?", key).First(&config).Error; err != nil {
		return defaultValue
	}
	return config.Value
}

func (ctrl *ConfigController) setConfigValue(key string, value string) {
	// Use raw SQL with INSERT ... ON DUPLICATE KEY UPDATE to ensure atomic operation
	// This is the most reliable way to ensure the value is saved
	// Note: Using backticks for MySQL column name
	sqlQuery := "INSERT INTO system_configs (`key`, value, created_at, updated_at) VALUES (?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()"

	result := ctrl.DB.Exec(sqlQuery, key, value)
	if result.Error != nil {
		log.Printf("❌ Failed to set config %s: %v", key, result.Error)
		return
	}

	if result.RowsAffected == 0 {
		log.Printf("⚠️ WARNING: No rows affected when setting config %s", key)
	} else {
		log.Printf("✅ Set config: %s = %s (rows affected: %d)", key, value, result.RowsAffected)
	}

	// PERFORMANCE OPTIMIZATION: Invalidate cache for this specific key
	// This ensures the updated config value is immediately available
	config.InvalidateConfigCacheKey(key)

	// Verify it was saved immediately with a fresh query (no cache)
	var verifyConfig models.SystemConfig
	if err := ctrl.DB.Session(&gorm.Session{PrepareStmt: false}).Where("`key` = ?", key).First(&verifyConfig).Error; err != nil {
		log.Printf("⚠️ WARNING: Could not verify saved config %s: %v", key, err)
	} else if verifyConfig.Value != value {
		log.Printf("⚠️ WARNING: Config %s value mismatch! Expected: %s, Got: %s", key, value, verifyConfig.Value)
	} else {
		log.Printf("✅ Verified config %s = %s (ID: %d, UpdatedAt: %s)", key, verifyConfig.Value, verifyConfig.ID, verifyConfig.UpdatedAt.Format("2006-01-02 15:04:05"))
	}
}

// UpdatePaymentConfig updates payment configuration (subscription price)
func (ctrl *ConfigController) UpdatePaymentConfig(c *gin.Context) {
	log.Printf("🔍 UpdatePaymentConfig called - Method: %s, Path: %s", c.Request.Method, c.Request.URL.Path)

	// Log raw request body
	bodyBytes, _ := c.GetRawData()
	log.Printf("🔍 UpdatePaymentConfig - Raw request body: %s", string(bodyBytes))
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var req struct {
		SubscriptionPrice int `json:"subscription_price" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("❌ UpdatePaymentConfig: Invalid request - %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	log.Printf("🔍 UpdatePaymentConfig - Parsed subscription_price: %d", req.SubscriptionPrice)

	// Validate subscription price
	if req.SubscriptionPrice <= 0 {
		log.Printf("❌ UpdatePaymentConfig: Invalid price - %d", req.SubscriptionPrice)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Subscription price must be greater than 0"})
		return
	}

	// Save to database using raw SQL for maximum reliability
	log.Printf("💾 Saving subscription_price to database: %d (as string: '%s')", req.SubscriptionPrice, strconv.Itoa(req.SubscriptionPrice))
	ctrl.setConfigValue("payment.subscription_price", strconv.Itoa(req.SubscriptionPrice))

	// Wait a bit and verify
	time.Sleep(200 * time.Millisecond)
	if val, found := ctrl.getConfigValueFromDB("payment.subscription_price"); found {
		log.Printf("✅ Verified subscription_price in DB: '%s' (expected: '%s')", val, strconv.Itoa(req.SubscriptionPrice))
		if val != strconv.Itoa(req.SubscriptionPrice) {
			log.Printf("⚠️ WARNING: Price mismatch! Expected: %d (string: '%s'), Got in DB: '%s'", req.SubscriptionPrice, strconv.Itoa(req.SubscriptionPrice), val)
			// Try to parse both to see the difference
			if expectedInt, _ := strconv.Atoi(strconv.Itoa(req.SubscriptionPrice)); expectedInt != req.SubscriptionPrice {
				log.Printf("⚠️ CRITICAL: String conversion issue! Original: %d, Converted back: %d", req.SubscriptionPrice, expectedInt)
			}
			if gotInt, err := strconv.Atoi(val); err == nil {
				log.Printf("⚠️ DB value as int: %d (difference: %d)", gotInt, gotInt-req.SubscriptionPrice)
			}
		} else {
			log.Printf("✅ Price verification successful: %d = '%s'", req.SubscriptionPrice, val)
		}
	} else {
		log.Printf("⚠️ WARNING: Could not verify subscription_price after save!")
	}

	log.Printf("✅ Payment config updated: SubscriptionPrice=%d", req.SubscriptionPrice)

	c.JSON(http.StatusOK, gin.H{
		"message":            "Payment configuration updated successfully",
		"subscription_price": req.SubscriptionPrice,
	})
}

func (ctrl *ConfigController) getWebinarConfig() gin.H {
	// Use file config as default values
	defaultStartHour := strconv.Itoa(ctrl.FileConfig.Webinar.StartHour)
	defaultStartMinute := strconv.Itoa(ctrl.FileConfig.Webinar.StartMinute)
	defaultEndHour := strconv.Itoa(ctrl.FileConfig.Webinar.EndHour)
	defaultDuration := strconv.Itoa(ctrl.FileConfig.Webinar.DurationMinutes)

	startHour, _ := strconv.Atoi(ctrl.getConfigValue("webinar.start_hour", defaultStartHour))
	startMinute, _ := strconv.Atoi(ctrl.getConfigValue("webinar.start_minute", defaultStartMinute))
	endHour, _ := strconv.Atoi(ctrl.getConfigValue("webinar.end_hour", defaultEndHour))
	duration, _ := strconv.Atoi(ctrl.getConfigValue("webinar.duration_minutes", defaultDuration))

	// Get unified comment offset value (default to 0)
	commentOffsetStr := ctrl.getConfigValue("webinar.comment_offset_seconds", "0")
	commentOffset, err := strconv.ParseFloat(commentOffsetStr, 64)
	if err != nil {
		log.Printf("⚠️  Failed to parse comment_offset_seconds '%s', using 0: %v", commentOffsetStr, err)
		commentOffset = 0
	}

	log.Printf("📋 getWebinarConfig - Loaded unified comment offset from DB: %.2f seconds", commentOffset)

	return gin.H{
		"start_hour":             startHour,
		"start_minute":           startMinute,
		"end_hour":               endHour,
		"duration_minutes":       duration,
		"comment_offset_seconds": commentOffset,
	}
}

func (ctrl *ConfigController) getMelipayamakConfig() gin.H {
	// Use file config as default values
	defaultEnabled := strconv.FormatBool(ctrl.FileConfig.Melipayamak.Enabled)
	defaultBodyIdWelcome := strconv.Itoa(ctrl.FileConfig.Melipayamak.BodyIdWelcome)
	defaultBodyIdWelcomeNextDay := strconv.Itoa(ctrl.FileConfig.Melipayamak.BodyIdWelcomeNextDay)
	defaultBodyIdReminder2PM := strconv.Itoa(ctrl.FileConfig.Melipayamak.BodyIdReminder2PM)
	defaultBodyIdReminder30Min := strconv.Itoa(ctrl.FileConfig.Melipayamak.BodyIdReminder30Min)

	enabled, _ := strconv.ParseBool(ctrl.getConfigValue("melipayamak.enabled", defaultEnabled))
	bodyIdWelcome, _ := strconv.Atoi(ctrl.getConfigValue("melipayamak.body_id_welcome", defaultBodyIdWelcome))
	bodyIdWelcomeNextDay, _ := strconv.Atoi(ctrl.getConfigValue("melipayamak.body_id_welcome_next_day", defaultBodyIdWelcomeNextDay))
	bodyIdReminder2PM, _ := strconv.Atoi(ctrl.getConfigValue("melipayamak.body_id_reminder_2pm", defaultBodyIdReminder2PM))
	bodyIdReminder30Min, _ := strconv.Atoi(ctrl.getConfigValue("melipayamak.body_id_reminder_30min", defaultBodyIdReminder30Min))

	return gin.H{
		"username":                 ctrl.getConfigValue("melipayamak.username", ctrl.FileConfig.Melipayamak.Username),
		"api_key":                  ctrl.getConfigValue("melipayamak.api_key", ctrl.FileConfig.Melipayamak.ApiKey),
		"body_id_welcome":          bodyIdWelcome,
		"body_id_welcome_next_day": bodyIdWelcomeNextDay,
		"body_id_reminder_2pm":     bodyIdReminder2PM,
		"body_id_reminder_30min":   bodyIdReminder30Min,
		"enabled":                  enabled,
	}
}

func (ctrl *ConfigController) getAvanakConfig() gin.H {
	// Use file config as default values
	defaultEnabled := strconv.FormatBool(ctrl.FileConfig.Avanak.Enabled)
	defaultMessageID := strconv.Itoa(ctrl.FileConfig.Avanak.MessageID)

	enabled, _ := strconv.ParseBool(ctrl.getConfigValue("avanak.enabled", defaultEnabled))
	messageID, _ := strconv.Atoi(ctrl.getConfigValue("avanak.message_id", defaultMessageID))

	return gin.H{
		"token":      ctrl.getConfigValue("avanak.token", ctrl.FileConfig.Avanak.Token),
		"message_id": messageID,
		"base_url":   ctrl.getConfigValue("avanak.base_url", ctrl.FileConfig.Avanak.BaseURL),
		"enabled":    enabled,
	}
}

func (ctrl *ConfigController) getFarazConfig() gin.H {
	// Use file config as default values
	defaultEnabled := strconv.FormatBool(ctrl.FileConfig.FarazSMS.Enabled)

	enabled, _ := strconv.ParseBool(ctrl.getConfigValue("faraz_sms.enabled", defaultEnabled))

	return gin.H{
		"api_key":     ctrl.getConfigValue("faraz_sms.api_key", ctrl.FileConfig.FarazSMS.ApiKey),
		"from_number": ctrl.getConfigValue("faraz_sms.from_number", ctrl.FileConfig.FarazSMS.FromNumber),
		"enabled":     enabled,
	}
}

// GetWebinarConfigFromDB returns webinar config from database (for use in scheduler/main.go)
// Falls back to file config if not found in database
func GetWebinarConfigFromDB(db *gorm.DB, fileConfig *config.WebinarConfig) config.WebinarConfig {
	var cfg models.SystemConfig

	startHour := fileConfig.StartHour
	startMinute := fileConfig.StartMinute
	endHour := fileConfig.EndHour
	duration := fileConfig.DurationMinutes

	// Try to get from database
	if db.Where("`key` = ?", "webinar.start_hour").First(&cfg).Error == nil {
		if val, err := strconv.Atoi(cfg.Value); err == nil {
			startHour = val
		}
	}
	if db.Where("`key` = ?", "webinar.start_minute").First(&cfg).Error == nil {
		if val, err := strconv.Atoi(cfg.Value); err == nil {
			startMinute = val
		}
	}
	if db.Where("`key` = ?", "webinar.end_hour").First(&cfg).Error == nil {
		if val, err := strconv.Atoi(cfg.Value); err == nil {
			endHour = val
		}
	}
	if db.Where("`key` = ?", "webinar.duration_minutes").First(&cfg).Error == nil {
		if val, err := strconv.Atoi(cfg.Value); err == nil {
			duration = val
		}
	}

	return config.WebinarConfig{
		StartHour:       startHour,
		StartMinute:     startMinute,
		EndHour:         endHour,
		DurationMinutes: duration,
	}
}

// UpdateThankYouDisplayTime updates the custom time displayed on ThankYou page
func (ctrl *ConfigController) UpdateThankYouDisplayTime(c *gin.Context) {
	var req struct {
		DisplayTime string `json:"display_time" binding:"required"` // Format: "HH:MM" (e.g., "19:01")
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Validate time format (HH:MM)
	timeRegex := `^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$`
	matched, _ := regexp.MatchString(timeRegex, req.DisplayTime)
	if !matched {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid time format. Expected HH:MM (e.g., 19:01)"})
		return
	}

	// Save to database
	ctrl.setConfigValue("thankyou.display_time", req.DisplayTime)
	log.Printf("✅ ThankYou display time updated: %s", req.DisplayTime)

	c.JSON(http.StatusOK, gin.H{
		"message":      "ThankYou display time updated successfully",
		"display_time": req.DisplayTime,
	})
}
