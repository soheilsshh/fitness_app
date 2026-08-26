package controllers

import (
	"log"
	"monetizeai-backend/config"
	"monetizeai-backend/models"
	"monetizeai-backend/services"
	"monetizeai-backend/streaming"
	"monetizeai-backend/utils"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type RegisterRequest struct {
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	Phone      string `json:"phone"`
	PromoterID *uint  `json:"promoter_id,omitempty"` // Optional promoter ID from request body
}

type WebinarController struct {
	DB                 *gorm.DB
	MelipayamakService *services.MelipayamakService
	FileConfig         *config.Config
}

func NewWebinarController(db *gorm.DB, melipayamakService *services.MelipayamakService, fileConfig *config.Config) *WebinarController {
	return &WebinarController{
		DB:                 db,
		MelipayamakService: melipayamakService,
		FileConfig:         fileConfig,
	}
}

func (ctrl *WebinarController) RegisterUser(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var webinar models.Webinar
	if err := ctrl.DB.First(&webinar).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Webinar not found"})
		return
	}

	// Log registration attempt
	log.Printf("📊 Registration attempt - Capacity: %d (unlimited), Registered: %d", webinar.Capacity, webinar.RegisteredCount)

	// NOTE: Capacity check removed - unlimited registrations allowed
	// The capacity number (500) is still shown in UI for display purposes only
	// Users can register without any limit

	// Normalize phone number: convert Persian digits to English for database and SMS
	normalizedPhone := utils.NormalizePhoneNumber(req.Phone)

	// Get promoter ID from query parameter or request body
	// Priority: Query parameter > Request body
	var promoterID *uint

	// First check query parameter (from URL)
	if promoterStr := c.Query("promoter"); promoterStr != "" {
		if id, err := strconv.ParseUint(promoterStr, 10, 32); err == nil {
			// Verify that the promoter exists
			var promoter models.AdminUser
			if err := ctrl.DB.First(&promoter, uint(id)).Error; err == nil {
				promoterIDVal := uint(id)
				promoterID = &promoterIDVal
				log.Printf("📌 User registered with promoter ID from query: %d (username: %s)", *promoterID, promoter.Username)
			} else {
				log.Printf("⚠️ Invalid promoter ID in query: %s", promoterStr)
			}
		} else {
			log.Printf("⚠️ Failed to parse promoter ID from query: %s, error: %v", promoterStr, err)
		}
	}

	// If not found in query, check request body
	if promoterID == nil && req.PromoterID != nil {
		// Verify that the promoter exists
		var promoter models.AdminUser
		if err := ctrl.DB.First(&promoter, *req.PromoterID).Error; err == nil {
			promoterID = req.PromoterID
			log.Printf("📌 User registered with promoter ID from body: %d (username: %s)", *promoterID, promoter.Username)
		} else {
			log.Printf("⚠️ Invalid promoter ID in body: %d, error: %v", *req.PromoterID, err)
		}
	}

	// If no promoter specified, assign to admin user (default landing page link)
	if promoterID == nil {
		var adminUser models.AdminUser
		if err := ctrl.DB.Where("username = ?", "admin").First(&adminUser).Error; err == nil {
			promoterID = &adminUser.ID
			log.Printf("📌 User registered without promoter, assigned to admin (ID: %d)", *promoterID)
		} else {
			log.Printf("⚠️ Admin user not found, user will be registered without promoter")
		}
	}

	// Always create new user record (allow duplicate phone numbers)
	// Ensure we have a stable identity for this phone (used for per-cycle SMS dedupe)
	var identity models.UserIdentity
	if err := ctrl.DB.Where("phone = ?", normalizedPhone).First(&identity).Error; err != nil {
		identity = models.UserIdentity{
			Phone: normalizedPhone,
		}
		if err := ctrl.DB.Create(&identity).Error; err != nil {
			log.Printf("⚠️ Failed to create user identity for phone %s: %v", normalizedPhone, err)
			// Fail-safe: continue registration without identity; SMS dedupe will fallback later
		}
	}

	user := models.User{
		IdentityID: func() *uint {
			if identity.ID > 0 {
				return &identity.ID
			}
			return nil
		}(),
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Phone:        normalizedPhone, // Store normalized phone number (English digits)
		RegisteredAt: time.Now(),
		PromoterID:   promoterID,
	}
	if err := ctrl.DB.Create(&user).Error; err != nil {
		log.Printf("❌ Failed to create user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register"})
		return
	}
	log.Printf("✅ Created new user: ID=%d, Phone=%s, Name=%s %s", user.ID, user.Phone, user.FirstName, user.LastName)
	ctrl.DB.Model(&webinar).Update("registered_count", webinar.RegisteredCount+1)

	// Check if SMS should be skipped (for landing page registrations)
	skipSMS := c.Query("skip_sms") == "true"
	if skipSMS {
		log.Printf("⏭️  Skipping registration SMS for landing page user: Phone=%s", normalizedPhone)
	} else {
		// Registration SMS with pattern 395323 has been removed (disabled by request).
		// Smart SMS system now handles behavioral and time-based messages safely.
		log.Printf("ℹ️ Registration SMS is disabled (Phone=%s)", normalizedPhone)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Registration successful",
		"user": gin.H{
			"id":            user.ID,
			"first_name":    user.FirstName,
			"last_name":     user.LastName,
			"phone":         user.Phone,
			"registered_at": user.RegisteredAt.Format(time.RFC3339),
		},
	})
}

// FindUserByPhone finds an existing user by phone number (for login/identification without new registration)
func (ctrl *WebinarController) FindUserByPhone(c *gin.Context) {
	var req struct {
		Phone string `json:"phone" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Phone number is required"})
		return
	}

	// Normalize phone number
	normalizedPhone := utils.NormalizePhoneNumber(req.Phone)

	// Find the most recent user with this phone number
	var user models.User
	if err := ctrl.DB.Where("phone = ?", normalizedPhone).
		Order("registered_at DESC").
		First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "با شماره ای ثبت نام کرده اید وارد شوید",
				"found": false,
			})
			return
		}
		log.Printf("❌ Failed to find user by phone: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search user"})
		return
	}

	log.Printf("✅ Found existing user: ID=%d, Phone=%s, Name=%s %s", user.ID, user.Phone, user.FirstName, user.LastName)

	c.JSON(http.StatusOK, gin.H{
		"found": true,
		"user": gin.H{
			"id":            user.ID,
			"first_name":    user.FirstName,
			"last_name":     user.LastName,
			"phone":         user.Phone,
			"registered_at": user.RegisteredAt.Format(time.RFC3339),
		},
	})
}

func (ctrl *WebinarController) GetWebinarInfo(c *gin.Context, db *gorm.DB) {
	var webinar models.Webinar
	if err := db.First(&webinar).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Webinar not found"})
		return
	}

	// Load Iran timezone to ensure accurate time zone in response
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		// Fallback to UTC if timezone loading fails
		loc = time.UTC
	}

	// CRITICAL: Load config from database (single source of truth)
	// This ensures we always use the latest config values, not the old webinar.StartTime/EndTime
	dynamicConfig := config.LoadConfigFromDB(db, ctrl.FileConfig)
	now := time.Now().In(loc)

	// Load comment offset values from database
	getConfigValue := func(key string, defaultValue string) string {
		var sysConfig models.SystemConfig
		if err := db.Where("`key` = ?", key).First(&sysConfig).Error; err != nil {
			return defaultValue
		}
		return sysConfig.Value
	}
	commentOffset, _ := strconv.ParseFloat(getConfigValue("webinar.comment_offset_seconds", "0"), 64)

	// Get ThankYou page display time (separate from actual webinar time)
	thankyouDisplayTime := getConfigValue("thankyou.display_time", "") // Format: "HH:MM" (e.g., "19:01")

	// Check scheduling mode - CRITICAL: Must check this FIRST before any other logic
	schedulingMode := getConfigValue("webinar.scheduling_mode", "manual")
	persianNow := utils.ToPersian(now)
	log.Printf("📋 GetWebinarInfo - Scheduling mode: %s (current time: %s, Persian: %d/%d/%d)",
		schedulingMode,
		now.Format("2006-01-02 15:04:05"),
		persianNow.Year, persianNow.Month, persianNow.Day)

	// CRITICAL: Use same logic as GetActiveWebinar for consistency
	// Query streaming state
	isStreamRunning := streaming.IsStreamRunning()
	streamEndTime := streaming.GetStreamEndTime()

	// Calculate scheduled start and end times
	var scheduledStartTimeIran, scheduledEndTimeIran time.Time

	if schedulingMode == "appointment" {
		// Use appointment slot for today
		// IMPORTANT: Don't filter by is_completed for display purposes - we need to show the time even if slot is completed
		persianNow := utils.ToPersian(now)
		log.Printf("🔍 GetWebinarInfo - Looking for appointment slot: Persian date = %d/%d/%d", persianNow.Year, persianNow.Month, persianNow.Day)

		// First, check if any slots exist for this month
		var slotCount int64
		db.Model(&models.AppointmentSlot{}).
			Where("persian_year = ? AND persian_month = ?", persianNow.Year, persianNow.Month).
			Count(&slotCount)
		log.Printf("🔍 GetWebinarInfo - Found %d slots for month %d/%d", slotCount, persianNow.Year, persianNow.Month)

		// Also check all slots for today to see what's in database
		var allTodaySlots []models.AppointmentSlot
		db.Where("persian_year = ? AND persian_month = ? AND persian_day = ?",
			persianNow.Year, persianNow.Month, persianNow.Day).
			Find(&allTodaySlots)
		if len(allTodaySlots) > 0 {
			log.Printf("🔍 GetWebinarInfo - Found %d slots for today (day %d):", len(allTodaySlots), persianNow.Day)
			for i, s := range allTodaySlots {
				log.Printf("  Slot[%d]: ID=%d, Day=%d, Start=%02d:%02d, StartDateTime=%s",
					i, s.ID, s.PersianDay, s.StartHour, s.StartMinute, s.StartDateTime.Format("2006-01-02 15:04:05 MST"))
			}
		} else {
			log.Printf("🔍 GetWebinarInfo - No slots found for today (day %d)", persianNow.Day)
		}

		// CRITICAL: Try multiple queries to find the slot
		var slot models.AppointmentSlot
		var err error

		// CRITICAL: In appointment mode, we want the NEXT available slot (not completed)
		// First try to find a non-completed slot for today
		err = db.Where("persian_year = ? AND persian_month = ? AND persian_day = ? AND is_completed = ?",
			persianNow.Year, persianNow.Month, persianNow.Day, false).
			Order("id DESC"). // Get the most recent slot if multiple exist
			First(&slot).Error

		// If today's slot not found (completed or doesn't exist), find next available slot
		if err != nil {
			log.Printf("🔍 Today's non-completed slot not found, searching for next available slot...")

			// Try to find next slot starting from now (to catch slots later today or tomorrow)
			err = db.Where("start_date_time >= ? AND is_completed = ?", now, false).
				Order("start_date_time ASC"). // Get the earliest next slot
				First(&slot).Error

			if err == nil {
				log.Printf("✅ Found next available slot: SlotID=%d, Persian=%d/%d/%d, StartDateTime=%s",
					slot.ID, slot.PersianYear, slot.PersianMonth, slot.PersianDay, slot.StartDateTime.Format("2006-01-02 15:04:05 MST"))
			}
		}

		// If still not found, try by StartDateTime being today (in Iran timezone) - fallback for timezone issues
		if err != nil {
			log.Printf("⚠️  Exact Persian date match failed (query: year=%d, month=%d, day=%d), trying StartDateTime range search...",
				persianNow.Year, persianNow.Month, persianNow.Day)

			// Check what slots exist in the current month
			var monthSlots []models.AppointmentSlot
			db.Where("persian_year = ? AND persian_month = ?", persianNow.Year, persianNow.Month).
				Order("persian_day ASC").
				Find(&monthSlots)
			log.Printf("🔍 GetWebinarInfo - Found %d slots in month %d/%d (looking for day %d)",
				len(monthSlots), persianNow.Year, persianNow.Month, persianNow.Day)

			if len(monthSlots) > 0 {
				log.Printf("🔍 GetWebinarInfo - Sample slots in month:")
				for i, s := range monthSlots {
					if i < 5 { // Show first 5
						log.Printf("  Slot[%d]: Day=%d, Start=%02d:%02d, StartDateTime=%s",
							i, s.PersianDay, s.StartHour, s.StartMinute, s.StartDateTime.Format("2006-01-02 15:04:05 MST"))
					}
				}
			} else {
				log.Printf("⚠️  GetWebinarInfo - No slots found in month %d/%d at all!", persianNow.Year, persianNow.Month)
				// Try to find slots in any month to see what exists
				var anySlots []models.AppointmentSlot
				db.Order("persian_year DESC, persian_month DESC, persian_day DESC").Limit(10).Find(&anySlots)
				if len(anySlots) > 0 {
					log.Printf("🔍 GetWebinarInfo - Found %d slots in database (showing last 10):", len(anySlots))
					for _, s := range anySlots {
						log.Printf("  Slot ID=%d: Persian=%d/%d/%d, Start=%02d:%02d, StartDateTime=%s",
							s.ID, s.PersianYear, s.PersianMonth, s.PersianDay, s.StartHour, s.StartMinute,
							s.StartDateTime.Format("2006-01-02 15:04:05 MST"))
					}
				}
			}

			todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
			todayEnd := todayStart.AddDate(0, 0, 1)
			log.Printf("🔍 GetWebinarInfo - Searching by StartDateTime range: %s to %s",
				todayStart.Format("2006-01-02 15:04:05 MST"), todayEnd.Format("2006-01-02 15:04:05 MST"))

			err = db.Where("start_date_time >= ? AND start_date_time < ? AND is_completed = ?", todayStart, todayEnd, false).
				Order("id DESC").
				First(&slot).Error

			if err == nil {
				log.Printf("✅ Found slot by StartDateTime range: SlotID=%d, Persian=%d/%d/%d, StartDateTime=%s",
					slot.ID, slot.PersianYear, slot.PersianMonth, slot.PersianDay, slot.StartDateTime.Format("2006-01-02 15:04:05 MST"))
				log.Printf("⚠️  WARNING: Persian date mismatch! Looking for %d/%d/%d but found slot with Persian date %d/%d/%d",
					persianNow.Year, persianNow.Month, persianNow.Day,
					slot.PersianYear, slot.PersianMonth, slot.PersianDay)
			} else {
				log.Printf("⚠️  StartDateTime range search also failed: %v", err)
				// Try to find next slot starting from now
				err = db.Where("start_date_time >= ? AND is_completed = ?", now, false).
					Order("start_date_time ASC"). // Get the earliest next slot
					First(&slot).Error
				if err == nil {
					log.Printf("✅ Found next available slot after StartDateTime search: SlotID=%d, Persian=%d/%d/%d, StartDateTime=%s",
						slot.ID, slot.PersianYear, slot.PersianMonth, slot.PersianDay, slot.StartDateTime.Format("2006-01-02 15:04:05 MST"))
				}
			}
		}

		if err == nil {
			// Use appointment slot time
			// CRITICAL: Use StartDateTime directly from slot (it's already in correct timezone)
			scheduledStartTimeIran = slot.StartDateTime.In(loc)

			// CRITICAL: For appointment mode, end time is ALWAYS start time + 102 minutes (1 hour 42 minutes)
			scheduledEndTimeIran = scheduledStartTimeIran.Add(102 * time.Minute)

			log.Printf("✅ GetWebinarInfo - Using appointment slot: Day %d/%d/%d, Start=%02d:%02d, End=%02d:%02d (start + 102 minutes), Completed=%v, StartDateTime=%s, SlotID=%d",
				slot.PersianYear, slot.PersianMonth, slot.PersianDay, slot.StartHour, slot.StartMinute, scheduledEndTimeIran.Hour(), scheduledEndTimeIran.Minute(), slot.IsCompleted,
				scheduledStartTimeIran.Format("2006-01-02 15:04:05"), slot.ID)
			log.Printf("✅ GetWebinarInfo - Slot StartDateTime (raw): %s, In Iran TZ: %s",
				slot.StartDateTime.Format("2006-01-02 15:04:05 MST"), scheduledStartTimeIran.Format("2006-01-02 15:04:05 MST"))
		} else {
			// CRITICAL: If in appointment mode but no slot found, this is an ERROR
			// We should NOT fallback to manual config - this breaks the appointment system
			log.Printf("❌ CRITICAL ERROR: Appointment mode is active but no slot found for today (year=%d, month=%d, day=%d). Error: %v",
				persianNow.Year, persianNow.Month, persianNow.Day, err)
			log.Printf("❌ This should NOT happen! Check if slots are created for this month.")

			// Try to find ANY slot for today (even if completed) - for display purposes
			var anySlot models.AppointmentSlot
			err2 := db.Where("persian_year = ? AND persian_month = ? AND persian_day = ?",
				persianNow.Year, persianNow.Month, persianNow.Day).
				Order("id DESC").
				First(&anySlot).Error

			if err2 == nil {
				// Found a slot (even if completed) - use it for display
				log.Printf("⚠️  Found completed slot for today, using it for display: SlotID=%d, Start=%02d:%02d",
					anySlot.ID, anySlot.StartHour, anySlot.StartMinute)
				scheduledStartTimeIran = anySlot.StartDateTime.In(loc)
				// CRITICAL: For appointment slots, end time is ALWAYS start time + 102 minutes (1 hour 42 minutes)
				scheduledEndTimeIran = scheduledStartTimeIran.Add(102 * time.Minute)
			} else {
				// No slot at all - use tomorrow's slot if available, otherwise use error time
				log.Printf("❌ No slot found at all (even completed ones) for today.")
				// Try to find tomorrow's slot
				tomorrow := now.AddDate(0, 0, 1)
				persianTomorrow := utils.ToPersian(tomorrow)
				var tomorrowSlot models.AppointmentSlot
				err3 := db.Where("persian_year = ? AND persian_month = ? AND persian_day = ?",
					persianTomorrow.Year, persianTomorrow.Month, persianTomorrow.Day).
					Order("id DESC").
					First(&tomorrowSlot).Error

				if err3 == nil {
					log.Printf("⚠️  Using tomorrow's slot for display: SlotID=%d, Start=%02d:%02d",
						tomorrowSlot.ID, tomorrowSlot.StartHour, tomorrowSlot.StartMinute)
					scheduledStartTimeIran = tomorrowSlot.StartDateTime.In(loc)
					// CRITICAL: For appointment slots, end time is ALWAYS start time + 102 minutes (1 hour 42 minutes)
					scheduledEndTimeIran = scheduledStartTimeIran.Add(102 * time.Minute)
				} else {
					// No slot found at all - use a default time far in future to indicate error
					log.Printf("❌ No appointment slots found for today or tomorrow. Using error time.")
					scheduledStartTimeIran = now.AddDate(0, 0, 7) // 7 days in future as error indicator
					scheduledEndTimeIran = scheduledStartTimeIran.Add(2 * time.Hour)
				}
			}
		}
	} else {
		// Use manual config
		scheduledStartTimeIran = time.Date(now.Year(), now.Month(), now.Day(), dynamicConfig.Webinar.StartHour, dynamicConfig.Webinar.StartMinute, 0, 0, loc)
		scheduledEndTimeIran = time.Date(now.Year(), now.Month(), now.Day(), dynamicConfig.Webinar.EndHour, 0, 0, 0, loc)
		if dynamicConfig.Webinar.EndHour < dynamicConfig.Webinar.StartHour ||
			(dynamicConfig.Webinar.EndHour == dynamicConfig.Webinar.StartHour && dynamicConfig.Webinar.StartMinute > 0) {
			scheduledEndTimeIran = scheduledEndTimeIran.AddDate(0, 0, 1)
		}
		log.Printf("📋 GetWebinarInfo - Using manual config: StartHour=%d, StartMinute=%d, EndHour=%d",
			dynamicConfig.Webinar.StartHour, dynamicConfig.Webinar.StartMinute, dynamicConfig.Webinar.EndHour)
	}

	// Determine start and end times to return
	startTimeIran := scheduledStartTimeIran
	endTimeIran := scheduledEndTimeIran

	// CRITICAL FIX: If we're within the webinar time window (after start, before end),
	// ALWAYS use today - scheduler will start stream immediately
	// Only use tomorrow if we're past the end time
	isWithinWebinarWindow := now.After(scheduledStartTimeIran) && now.Before(scheduledEndTimeIran)

	if !isStreamRunning {
		// If we're within webinar window, use today (scheduler will start stream)
		if isWithinWebinarWindow {
			// We're in the webinar window - use today so scheduler can start immediately
			log.Printf("📅 GetWebinarInfo - Within webinar window (start: %s, end: %s, now: %s), using today for immediate start",
				scheduledStartTimeIran.Format("2006-01-02 15:04:05"),
				scheduledEndTimeIran.Format("2006-01-02 15:04:05"),
				now.Format("2006-01-02 15:04:05"))
		} else if now.After(scheduledEndTimeIran) {
			// We're past the end time - use tomorrow
			startTimeIran = scheduledStartTimeIran.AddDate(0, 0, 1)
			endTimeIran = scheduledEndTimeIran.AddDate(0, 0, 1)
			log.Printf("📅 GetWebinarInfo - Past end time, using tomorrow: Start=%s, End=%s",
				startTimeIran.Format("2006-01-02 15:04:05"),
				endTimeIran.Format("2006-01-02 15:04:05"))
		} else {
			// We're before start time - use today
			log.Printf("📅 GetWebinarInfo - Before start time, using today: Start=%s, End=%s",
				startTimeIran.Format("2006-01-02 15:04:05"),
				endTimeIran.Format("2006-01-02 15:04:05"))
		}
	} else {
		// Stream is running - use today's scheduled times
		log.Printf("📅 GetWebinarInfo - Stream is running, using today: Start=%s, End=%s",
			startTimeIran.Format("2006-01-02 15:04:05"),
			endTimeIran.Format("2006-01-02 15:04:05"))
	}

	// Check if manual stop flag is set
	manualStopFlag := getConfigValue("webinar.manual_stop", "false")
	isManuallyStopped := manualStopFlag == "true"

	// Determine if webinar is actually live:
	// 1. Manual stop flag must NOT be set
	// 2. Stream must be running
	// 3. Current time must be within webinar window (start to end)
	// 4. Stream end time must not have passed (if set)
	isActuallyLive := false
	if !isManuallyStopped && isStreamRunning {
		// Check if we're within the webinar time window
		if now.After(startTimeIran) && now.Before(endTimeIran) {
			// Check if stream end time hasn't passed (if end time is set)
			if streamEndTime.IsZero() || now.Before(streamEndTime) {
				isActuallyLive = true
			}
		}
	}

	log.Printf("📊 GetWebinarInfo - Manual stop: %v, Stream running: %v, Within window: %v, Stream ends at: %s, IsLive: %v",
		isManuallyStopped,
		isStreamRunning,
		now.After(startTimeIran) && now.Before(endTimeIran),
		func() string {
			if streamEndTime.IsZero() {
				return "not set"
			}
			return streamEndTime.Format("2006-01-02 15:04:05")
		}(),
		isActuallyLive)

	// Log final times being returned
	log.Printf("📤 GetWebinarInfo - Returning times: Start=%s (%s), End=%s (%s), Mode=%s",
		startTimeIran.Format("2006-01-02 15:04:05"),
		startTimeIran.Format(time.RFC3339),
		endTimeIran.Format("2006-01-02 15:04:05"),
		endTimeIran.Format(time.RFC3339),
		schedulingMode)

	c.JSON(http.StatusOK, gin.H{
		"title":                  webinar.Title,
		"start_time":             startTimeIran.Format(time.RFC3339), // ISO8601 with timezone
		"end_time":               endTimeIran.Format(time.RFC3339),   // ISO8601 with timezone
		"capacity":               webinar.Capacity,
		"registered_count":       webinar.RegisteredCount,
		"is_live":                isActuallyLive,    // Use actual stream status, not database flag
		"is_manually_stopped":    isManuallyStopped, // Flag indicating manual stop
		"timezone":               "Asia/Tehran",     // Explicitly include timezone info
		"comment_offset_seconds": commentOffset,
		"scheduling_mode":        schedulingMode,      // Include scheduling mode for debugging
		"thankyou_display_time":  thankyouDisplayTime, // Custom time for ThankYou page display (format: "HH:MM")
	})
}

// GetActiveWebinar returns streamStartTime, serverNow, and streaming state for client-side sync
// This is the SINGLE SOURCE OF TRUTH for comment timing
// It uses the ACTUAL stream start time if stream is running, otherwise falls back to scheduled time
func (ctrl *WebinarController) GetActiveWebinar(c *gin.Context, db *gorm.DB) {
	// Load Iran timezone
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}

	// Load config from database (single source of truth)
	dynamicConfig := config.LoadConfigFromDB(db, ctrl.FileConfig)
	now := time.Now().In(loc)

	// Load scheduling mode
	getConfigValue := func(key string, defaultValue string) string {
		var sysConfig models.SystemConfig
		if err := db.Where("`key` = ?", key).First(&sysConfig).Error; err != nil {
			return defaultValue
		}
		return sysConfig.Value
	}
	schedulingMode := getConfigValue("webinar.scheduling_mode", "manual")

	// Query streaming state
	isStreamRunning := streaming.IsStreamRunning()
	actualStreamStartTime := streaming.GetStreamStartTime() // Actual start time when stream started
	streamEndTime := streaming.GetStreamEndTime()           // Expected end time

	// Calculate scheduled start time
	var scheduledStartTimeIran, scheduledEndTimeIran time.Time

	if schedulingMode == "appointment" {
		// Use appointment slot for today
		// IMPORTANT: Don't filter by is_completed for display purposes - we need to show the time even if slot is completed
		persianNow := utils.ToPersian(now)
		log.Printf("🔍 GetActiveWebinar - Looking for appointment slot: Persian date = %d/%d/%d", persianNow.Year, persianNow.Month, persianNow.Day)

		var slot models.AppointmentSlot
		err := db.Where("persian_year = ? AND persian_month = ? AND persian_day = ?",
			persianNow.Year, persianNow.Month, persianNow.Day).
			Order("id DESC"). // Get the most recent slot if multiple exist
			First(&slot).Error

		if err == nil {
			// Use appointment slot time
			scheduledStartTimeIran = slot.StartDateTime.In(loc)
			// CRITICAL: For appointment mode, end time is ALWAYS start time + 102 minutes (1 hour 42 minutes)
			scheduledEndTimeIran = scheduledStartTimeIran.Add(102 * time.Minute)
			log.Printf("✅ GetActiveWebinar - Using appointment slot: Day %d, Start=%02d:%02d, End=%02d:%02d (start + 102 minutes), Completed=%v, SlotID=%d",
				slot.PersianDay, slot.StartHour, slot.StartMinute, scheduledEndTimeIran.Hour(), scheduledEndTimeIran.Minute(), slot.IsCompleted, slot.ID)
		} else {
			// CRITICAL: If in appointment mode but no slot found, this is an ERROR
			log.Printf("❌ CRITICAL ERROR: GetActiveWebinar - Appointment mode is active but no slot found (year=%d, month=%d, day=%d). Error: %v",
				persianNow.Year, persianNow.Month, persianNow.Day, err)

			// Try to find tomorrow's slot as fallback for display
			tomorrow := now.AddDate(0, 0, 1)
			persianTomorrow := utils.ToPersian(tomorrow)
			var tomorrowSlot models.AppointmentSlot
			err2 := db.Where("persian_year = ? AND persian_month = ? AND persian_day = ?",
				persianTomorrow.Year, persianTomorrow.Month, persianTomorrow.Day).
				Order("id DESC").
				First(&tomorrowSlot).Error

			if err2 == nil {
				log.Printf("⚠️  GetActiveWebinar - Using tomorrow's slot for display: SlotID=%d, Start=%02d:%02d",
					tomorrowSlot.ID, tomorrowSlot.StartHour, tomorrowSlot.StartMinute)
				scheduledStartTimeIran = tomorrowSlot.StartDateTime.In(loc)
				// CRITICAL: For appointment slots, end time is ALWAYS start time + 102 minutes (1 hour 42 minutes)
				scheduledEndTimeIran = scheduledStartTimeIran.Add(102 * time.Minute)
			} else {
				// No slot found at all - use error time
				log.Printf("❌ GetActiveWebinar - No appointment slots found. Using error time.")
				scheduledStartTimeIran = now.AddDate(0, 0, 7) // 7 days in future as error indicator
				scheduledEndTimeIran = scheduledStartTimeIran.Add(2 * time.Hour)
			}
		}
	} else {
		// Use manual config
		scheduledStartTimeIran = time.Date(now.Year(), now.Month(), now.Day(), dynamicConfig.Webinar.StartHour, dynamicConfig.Webinar.StartMinute, 0, 0, loc)
		scheduledEndTimeIran = time.Date(now.Year(), now.Month(), now.Day(), dynamicConfig.Webinar.EndHour, 0, 0, 0, loc)
		if dynamicConfig.Webinar.EndHour < dynamicConfig.Webinar.StartHour ||
			(dynamicConfig.Webinar.EndHour == dynamicConfig.Webinar.StartHour && dynamicConfig.Webinar.StartMinute > 0) {
			scheduledEndTimeIran = scheduledEndTimeIran.AddDate(0, 0, 1)
		}
	}

	// CRITICAL FIX: If we're within the webinar time window (after start, before end),
	// ALWAYS use today - scheduler will start stream immediately
	// Only use tomorrow if we're past the end time
	isWithinWebinarWindow := now.After(scheduledStartTimeIran) && now.Before(scheduledEndTimeIran)

	if !isStreamRunning {
		// If we're within webinar window, use today (scheduler will start stream)
		if isWithinWebinarWindow {
			// We're in the webinar window - use today so scheduler can start immediately
			log.Printf("📊 GetActiveWebinar: Within webinar window, using today for immediate start")
		} else if now.After(scheduledEndTimeIran) {
			// We're past the end time - use tomorrow
			scheduledStartTimeIran = scheduledStartTimeIran.AddDate(0, 0, 1)
			scheduledEndTimeIran = scheduledEndTimeIran.AddDate(0, 0, 1)
			log.Printf("📊 GetActiveWebinar: Past end time, using tomorrow")
		} else {
			// We're before start time - use today
			log.Printf("📊 GetActiveWebinar: Before start time, using today")
		}
	}

	// Determine which start time to expose:
	// - If stream is running and we have actual start time: use actual start time
	// - Otherwise: use scheduled start time
	var streamStartTimeMs int64
	if isStreamRunning && !actualStreamStartTime.IsZero() {
		// Stream is running - use actual start time (the real moment streaming began)
		streamStartTimeMs = actualStreamStartTime.UnixMilli()
		log.Printf("📊 GetActiveWebinar: Using ACTUAL stream start time: %s", actualStreamStartTime.Format("2006-01-02 15:04:05"))
	} else {
		// Stream not running - use scheduled start time
		streamStartTimeMs = scheduledStartTimeIran.UnixMilli()
		log.Printf("📊 GetActiveWebinar: Using SCHEDULED start time: %s (stream not running)", scheduledStartTimeIran.Format("2006-01-02 15:04:05"))
	}

	var streamEndTimeMs int64 = 0
	if !streamEndTime.IsZero() {
		streamEndTimeMs = streamEndTime.UnixMilli()
	}

	// Return comprehensive timing information
	c.JSON(http.StatusOK, gin.H{
		"streamStartTime":    streamStartTimeMs,                  // Actual or scheduled start time (ms)
		"serverNow":          now.UnixMilli(),                    // Current server time (ms)
		"isStreamRunning":    isStreamRunning,                    // Whether stream is currently active
		"streamEndTime":      streamEndTimeMs,                    // Expected stream end time (ms, 0 if not set)
		"scheduledStartTime": scheduledStartTimeIran.UnixMilli(), // Scheduled start time (ms)
		"scheduledEndTime":   scheduledEndTimeIran.UnixMilli(),   // Scheduled end time (ms)
	})
}
