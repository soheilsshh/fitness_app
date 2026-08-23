package scheduler

import (
	"fmt"
	"log"
	"monetizeai-backend/config"
	"monetizeai-backend/models"
	"monetizeai-backend/services"
	"monetizeai-backend/utils"
	"strconv"
	"time"

	"gorm.io/gorm"
)

type smartProvider string

const (
	providerMelipayamak smartProvider = "melipayamak"
	providerFaraz       smartProvider = "faraz"
	providerAvanak      smartProvider = "avanak"
)

// Hard fail-safe provider windows (Asia/Tehran) to prevent night sends.
// If a send is outside these windows, it MUST NOT be sent.
func isProviderTimeAllowed(provider smartProvider, now time.Time) bool {
	// Allowed: 08:00 - 21:59
	h := now.Hour()
	if h < 8 || h > 21 {
		return false
	}
	return true
}

func todayMidnightTehran(now time.Time, loc *time.Location) time.Time {
	n := now.In(loc)
	return time.Date(n.Year(), n.Month(), n.Day(), 0, 0, 0, 0, loc)
}

// yesterdayRangeJalali returns [start,end) for yesterday in Jalali day boundaries, in Asia/Tehran.
func yesterdayRangeJalali(now time.Time, loc *time.Location) (time.Time, time.Time) {
	// Use Jalali conversion to determine yesterday date, then convert to Gregorian midnight.
	y := utils.ToPersian(now.In(loc).AddDate(0, 0, -1))
	start := utils.PersianToGregorian(y.Year, y.Month, y.Day).In(loc)
	end := start.AddDate(0, 0, 1)
	return start, end
}

func ensureIdentityForUser(db *gorm.DB, u *models.User) {
	if u == nil {
		return
	}
	if u.IdentityID != nil && *u.IdentityID > 0 {
		return
	}
	var identity models.UserIdentity
	if err := db.Where("phone = ?", u.Phone).First(&identity).Error; err != nil {
		identity = models.UserIdentity{Phone: u.Phone}
		if err := db.Create(&identity).Error; err != nil {
			log.Printf("⚠️ smart_sms: failed to create identity for phone=%s: %v", u.Phone, err)
			return
		}
	}
	u.IdentityID = &identity.ID
	_ = db.Model(&models.User{}).Where("id = ?", u.ID).Update("identity_id", identity.ID).Error
}

// alreadySent checks if a message has already been sent to a user (IdentityID) for a specific category on the same runDate.
// Changed: Now checks by userID (IdentityID), category, AND runDate (date of execution).
// This ensures each phone number receives the message only once per category per day, allowing re-sending on different days.
func alreadySent(db *gorm.DB, userID uint, cycleID uint, category string, runDate time.Time) bool {
	var count int64
	// Check by userID (IdentityID), category, AND runDate (same day)
	// This ensures each phone number receives the message only once per category per day
	// Users can receive the same message again on different days (different runDate)
	runDateEnd := runDate.AddDate(0, 0, 1) // End of runDate day (start of next day)
	db.Model(&models.SmartSMSLog{}).
		Where("user_id = ? AND category = ? AND sent_at >= ? AND sent_at < ?", userID, category, runDate, runDateEnd).
		Count(&count)
	return count > 0
}

func logSent(db *gorm.DB, userID uint, cycleID uint, provider smartProvider, patternCode string, category string, now time.Time) error {
	entry := models.SmartSMSLog{
		UserID:              userID,
		RegistrationCycleID: cycleID,
		Provider:            string(provider),
		PatternCode:         patternCode,
		Category:            category,
		SentAt:              now,
		Status:              "sent",
		CreatedAt:           now,
	}
	return db.Create(&entry).Error
}

// processSmartPopupFollowups sends event-based popup messages.
// NOTE: This function is now DEPRECATED - SMS is sent immediately on exit via sendPopupExitSMSImmediate
// This function is kept for backward compatibility but should not send any messages
// All popup exit SMS are now handled immediately in TrackLandingActivity when status = "left_landing"
func processSmartPopupFollowups(db *gorm.DB, melipayamak *services.MelipayamakService, loc *time.Location) {
	// DEPRECATED: SMS is now sent immediately on exit, not via scheduler
	// This function is kept for backward compatibility but does nothing
	// All logic moved to sendPopupExitSMSImmediate in landing_activity.go
	return

	// OLD CODE (disabled):
	/*
		now := time.Now().In(loc)
		if melipayamak == nil || melipayamak.GetConfig() == nil || !melipayamak.GetConfig().Enabled {
			return
		}

		cutoff := now.Add(-2 * time.Minute)

		// Eligible users:
		// - Completed: always eligible immediately (no cutoff, no time window restriction)
		// - Others: eligible after cutoff (no time window restriction - can send anytime)
		var users []models.User
		query := db.Where("last_popup_activity_at IS NOT NULL").
			Where(
				"popup_progress = ? OR (last_popup_activity_at <= ? AND popup_progress IN ?)",
				models.PopupProgressCompleted,
				cutoff,
				[]models.PopupProgress{
					models.PopupProgressEntered,
					models.PopupProgressGiftClicked,
					models.PopupProgressCommitment,
				},
			)

	*/
}

type smartYesterdayMessage struct {
	Category        string
	Provider        smartProvider
	Hour            int
	Minute          int
	Message         string // used for faraz
	PatternKey      string // used for melipayamak (pattern code stored in SystemConfig)
	AvanakMessageID int    // used for avanak (message ID for voice call)
}

func getSystemConfigValue(db *gorm.DB, key string) (string, bool) {
	var cfg models.SystemConfig
	if err := db.Where("`key` = ?", key).First(&cfg).Error; err != nil {
		return "", false
	}
	if cfg.Value == "" {
		return "", false
	}
	return cfg.Value, true
}

// refreshAvanakConfigFromDB updates the Avanak service config in-place from system_configs to avoid stale values.
// Returns the refreshed config pointer (or nil if service/config is unavailable).
func refreshAvanakConfigFromDB(db *gorm.DB, avanak *services.AvanakService) *config.AvanakConfig {
	if avanak == nil {
		return nil
	}

	cfg := avanak.GetConfig()
	if cfg == nil {
		return nil
	}

	// Update fields from DB if present (fallback to existing values otherwise)
	if val, ok := getSystemConfigValue(db, "avanak.enabled"); ok {
		if enabled, err := strconv.ParseBool(val); err == nil {
			cfg.Enabled = enabled
		}
	}
	if val, ok := getSystemConfigValue(db, "avanak.token"); ok && val != "" {
		cfg.Token = val
	}
	if val, ok := getSystemConfigValue(db, "avanak.base_url"); ok && val != "" {
		cfg.BaseURL = val
	}
	if val, ok := getSystemConfigValue(db, "avanak.message_id"); ok {
		if mid, err := strconv.Atoi(val); err == nil && mid > 0 {
			cfg.MessageID = mid
		}
	}

	return cfg
}

// getDefaultScheduledMessages returns the default hard-coded schedule (for backward compatibility)
func getDefaultScheduledMessages() []smartYesterdayMessage {
	return []smartYesterdayMessage{
		{
			Category: "yesterday_0800_faraz",
			Provider: providerFaraz,
			Hour:     8,
			Minute:   0,
			Message:  "میدونی مشکل چیه؟ بیشتر آدما مشکلشون تنبلی یا کم‌هوشی نیست\n\nمشکلشون اینه که مسیر درست رو ندیدن❌\n\nکارگاه امروز دقیقاً برای همینه!",
		},
		{
			Category: "yesterday_1400_faraz",
			Provider: providerFaraz,
			Hour:     14,
			Minute:   0,
			Message:  "این کارگاه برای آدمایی ساخته شده که دیگه از سردرگمی خسته شدن\nو دنبال یه مسیر و سیستم واقعین🚀\n\nامروز ساعت ۱۹ مسیر روشن می‌شه💫",
		},
		{
			Category: "yesterday_1700_faraz",
			Provider: providerFaraz,
			Hour:     17,
			Minute:   0,
			Message:  "کارگاه امشب زنده برگزار می‌شه و ضبط نمیشه\nنه برای هیجان، برای اینکه تغییر واقعی زنده اتفاق می‌افته",
		},
		{
			Category: "yesterday_1815_melipayamak",
			Provider: providerFaraz,
			Hour:     18,
			Minute:   15,
			Message:  "۳۰ دقیقه تا شروع کارگاه مونده.\nلینک ورود سر ساعت ارسال میشه",
		},
		{
			Category: "yesterday_1855_melipayamak",
			Provider: providerFaraz,
			Hour:     18,
			Minute:   55,
			Message:  "🔴کارگاه شروع شد..\nهمین الان وارد شو:\nhttps://webinar.sianacademy.com/webinar",
		},
		{
			Category: "yesterday_1915_faraz",
			Provider: providerFaraz,
			Hour:     19,
			Minute:   15,
			Message:  "کارگاه در حال اجراست...\nاز دستش ندی👇🏼\nwebinar.sianacademy.com/webinar",
		},
		{
			Category:        "yesterday_1715_avanak",
			Provider:        providerAvanak,
			Hour:            17,
			Minute:          15,
			Message:         "",
			AvanakMessageID: 0, // fallback به MessageID کانفیگ در زمان اجرا
		},
	}
}

// loadScheduledMessagesFromDB loads scheduled messages from database, with fallback to defaults
func loadScheduledMessagesFromDB(db *gorm.DB) []smartYesterdayMessage {
	var dbMessages []models.SmartSMSScheduledMessage
	if err := db.Where("is_active = ?", true).Order("display_order ASC, hour ASC, minute ASC").Find(&dbMessages).Error; err != nil {
		log.Printf("⚠️ smart_sms: failed to load scheduled messages from DB, using defaults: %v", err)
		return getDefaultScheduledMessages()
	}

	// If no messages in DB, use defaults
	if len(dbMessages) == 0 {
		return getDefaultScheduledMessages()
	}

	// Convert DB messages to scheduler format
	schedule := make([]smartYesterdayMessage, 0, len(dbMessages))
	hasAvanak := false
	for _, msg := range dbMessages {
		provider := providerFaraz
		if msg.Provider == "melipayamak" {
			provider = providerMelipayamak
		} else if msg.Provider == "avanak" {
			provider = providerAvanak
			hasAvanak = true
		}
		schedule = append(schedule, smartYesterdayMessage{
			Category:        msg.Category,
			Provider:        provider,
			Hour:            msg.Hour,
			Minute:          msg.Minute,
			Message:         msg.Message,
			PatternKey:      msg.PatternKey,
			AvanakMessageID: msg.AvanakMessageID,
		})
		if msg.Provider == "avanak" {
			log.Printf("📋 smart_sms: loaded Avanak message - category=%s, hour=%d, minute=%d, messageID=%d", msg.Category, msg.Hour, msg.Minute, msg.AvanakMessageID)
		}
	}

	// Fail-safe: اگر در DB هیچ پیام آوانکی نبود، یک مورد پیش‌فرض از کانفیگ/Defaults اضافه شود تا Scheduler آن را بررسی کند.
	if !hasAvanak {
		for _, def := range getDefaultScheduledMessages() {
			if def.Provider == providerAvanak {
				schedule = append(schedule, def)
				log.Printf("ℹ️ smart_sms: no Avanak message in DB, added default fallback (category=%s, %02d:%02d)", def.Category, def.Hour, def.Minute)
			}
		}
	}

	return schedule
}

// ProcessSmartYesterdayCampaigns sends time-based messages to users who registered "yesterday" (Jalali day),
// at fixed times, with strict idempotency via SmartSMSScheduleRun.
// This function is exported so it can be called directly from controllers when time is changed.
func ProcessSmartYesterdayCampaigns(db *gorm.DB, melipayamak *services.MelipayamakService, faraz *services.FarazSMSService, avanak *services.AvanakService, loc *time.Location) {
	processSmartYesterdayCampaignsInternal(db, melipayamak, faraz, avanak, loc)
}

// processSmartYesterdayCampaignsInternal is the internal implementation
func processSmartYesterdayCampaignsInternal(db *gorm.DB, melipayamak *services.MelipayamakService, faraz *services.FarazSMSService, avanak *services.AvanakService, loc *time.Location) {
	now := time.Now().In(loc)

	// CRITICAL: Log that scheduler is running
	log.Printf("⏰ smart_sms: scheduler tick - checking scheduled messages (current time: %02d:%02d:%02d)", now.Hour(), now.Minute(), now.Second())

	// Load schedule from database (with fallback to defaults)
	schedule := loadScheduledMessagesFromDB(db)
	log.Printf("🔍 smart_sms: loaded %d scheduled messages from DB (current time: %02d:%02d)", len(schedule), now.Hour(), now.Minute())

	// Always refresh Avanak config from DB to avoid using stale values loaded at startup
	runtimeAvanakConfig := refreshAvanakConfigFromDB(db, avanak)

	// Debug: Log all Avanak messages in schedule
	for i := range schedule {
		if schedule[i].Provider == providerAvanak {
			log.Printf("📋 smart_sms: Avanak message in schedule - category=%s, hour=%d, minute=%d, messageID=%d",
				schedule[i].Category, schedule[i].Hour, schedule[i].Minute, schedule[i].AvanakMessageID)
		}
	}

	// Find scheduled message that should be sent
	// Priority 1: Exact time match (current minute)
	// Priority 2: Recently changed time (UpdatedAt in last 20 minutes) - send immediately if time has arrived
	// Priority 3: Past time that hasn't been sent yet
	var due *smartYesterdayMessage
	var isPastTime bool

	// First, try exact time match
	// This is the PRIMARY way messages are sent - at the exact scheduled minute
	for i := range schedule {
		if now.Hour() == schedule[i].Hour && now.Minute() == schedule[i].Minute {
			due = &schedule[i]
			isPastTime = false
			log.Printf("✅ smart_sms: exact time match found for category=%s, provider=%s at %02d:%02d",
				schedule[i].Category, schedule[i].Provider, now.Hour(), now.Minute())
			if schedule[i].Provider == providerAvanak {
				log.Printf("📞 smart_sms: Avanak message matched - messageID=%d", schedule[i].AvanakMessageID)
			}
			break
		}
	}

	// If no exact match, check for past times that haven't been sent
	// PRIORITY: Check for recently changed times first (UpdatedAt in last 20 minutes)
	if due == nil {
		runDate := todayMidnightTehran(now, loc)
		log.Printf("🔍 smart_sms: checking past times (runDate=%s, now=%s)", runDate.Format("2006-01-02 15:04:05"), now.Format("2006-01-02 15:04:05"))

		// FIRST PASS: Check for recently updated messages (time was just changed)
		// This handles the case where time is changed to a future time - we need to send at that exact time
		for i := range schedule {
			var scheduledMsg models.SmartSMSScheduledMessage
			if err := db.Where("category = ?", schedule[i].Category).First(&scheduledMsg).Error; err != nil {
				if schedule[i].Provider == providerAvanak {
					log.Printf("⚠️ smart_sms: Avanak message category=%s not found in DB", schedule[i].Category)
				}
				continue
			}

			timeSinceUpdate := now.Sub(scheduledMsg.UpdatedAt)
			// If updated recently (within 20 minutes), it means time was just changed
			if timeSinceUpdate <= 20*time.Minute {
				scheduledTime := time.Date(runDate.Year(), runDate.Month(), runDate.Day(), schedule[i].Hour, schedule[i].Minute, 0, 0, loc)
				timeDiff := now.Sub(scheduledTime)

				if schedule[i].Provider == providerAvanak {
					log.Printf("🔄 smart_sms: Avanak category=%s recently updated (updated %v ago, scheduled: %02d:%02d, now: %02d:%02d, diff: %v, messageID=%d)",
						schedule[i].Category, timeSinceUpdate, schedule[i].Hour, schedule[i].Minute, now.Hour(), now.Minute(), timeDiff, schedule[i].AvanakMessageID)
				} else {
					log.Printf("🔄 smart_sms: category=%s recently updated (updated %v ago, scheduled: %02d:%02d, now: %02d:%02d, diff: %v)",
						schedule[i].Category, timeSinceUpdate, schedule[i].Hour, schedule[i].Minute, now.Hour(), now.Minute(), timeDiff)
				}

				// If time has arrived (past or exactly now), send immediately
				// If time is in the future but very close (within 1 minute), also send (handles exact minute match)
				// This ensures that if time is changed to a future time, it will send at that exact minute
				// Example: if time is changed from 18:10 to 18:15 at 18:10, scheduler will check every minute
				// and when it reaches 18:15, timeDiff will be 0 or very close to 0, so it will send
				if timeDiff >= -1*time.Minute && timeDiff <= 4*time.Hour {
					// Delete existing run record to force re-send
					deletedCount := db.Where("category = ? AND run_date = ?", schedule[i].Category, runDate).
						Delete(&models.SmartSMSScheduleRun{}).RowsAffected
					log.Printf("🗑️ smart_sms: deleted %d existing run records for category=%s (forcing re-send)", deletedCount, schedule[i].Category)

					due = &schedule[i]
					isPastTime = true
					log.Printf("✅ smart_sms: FOUND recently changed time for category=%s, provider=%s (scheduled: %02d:%02d, now: %02d:%02d, diff: %v) - will send immediately",
						schedule[i].Category, schedule[i].Provider, schedule[i].Hour, schedule[i].Minute, now.Hour(), now.Minute(), timeDiff)
					if schedule[i].Provider == providerAvanak {
						log.Printf("📞 smart_sms: Avanak message will be sent - messageID=%d", schedule[i].AvanakMessageID)
					}
					break
				} else {
					// Time is in the future (more than 1 minute away) - scheduler will catch it at exact time
					// This is OK - the normal scheduler (every minute) will catch it when time arrives
					if schedule[i].Provider == providerAvanak {
						log.Printf("⏭️ smart_sms: Avanak category=%s recently updated but time is in future (diff=%v, scheduled: %02d:%02d, now: %02d:%02d) - will send at exact time via normal scheduler",
							schedule[i].Category, timeDiff, schedule[i].Hour, schedule[i].Minute, now.Hour(), now.Minute())
					} else {
						log.Printf("⏭️ smart_sms: category=%s recently updated but time is in future (diff=%v, scheduled: %02d:%02d, now: %02d:%02d) - will send at exact time via normal scheduler",
							schedule[i].Category, timeDiff, schedule[i].Hour, schedule[i].Minute, now.Hour(), now.Minute())
					}
				}
			}
		}

		// SECOND PASS: If no recently updated message found, check normal flow
		if due == nil {
			for i := range schedule {
				scheduledTime := time.Date(runDate.Year(), runDate.Month(), runDate.Day(), schedule[i].Hour, schedule[i].Minute, 0, 0, loc)
				timeDiff := now.Sub(scheduledTime)

				// Check if run record exists
				var existingRun models.SmartSMSScheduleRun
				runExists := db.Where("category = ? AND run_date = ?", schedule[i].Category, runDate).First(&existingRun).Error == nil

				// Debug: Log Avanak messages being checked
				if schedule[i].Provider == providerAvanak {
					log.Printf("🔍 smart_sms: checking Avanak message - category=%s, scheduled: %02d:%02d, now: %02d:%02d, diff: %v, runExists: %v, status: %s",
						schedule[i].Category, schedule[i].Hour, schedule[i].Minute, now.Hour(), now.Minute(), timeDiff, runExists, func() string {
							if runExists {
								return existingRun.Status
							}
							return "none"
						}())
				}

				// If no run record exists and time is in the past (within 4 hours), send
				if !runExists && timeDiff > 0 && timeDiff <= 4*time.Hour {
					due = &schedule[i]
					isPastTime = true
					log.Printf("✅ smart_sms: FOUND past time (no run record) for category=%s, provider=%s (scheduled: %02d:%02d, now: %02d:%02d, diff: %v) - will send immediately",
						schedule[i].Category, schedule[i].Provider, schedule[i].Hour, schedule[i].Minute, now.Hour(), now.Minute(), timeDiff)
					if schedule[i].Provider == providerAvanak {
						log.Printf("📞 smart_sms: Avanak message will be sent - messageID=%d", schedule[i].AvanakMessageID)
					}
					break
				} else if runExists && existingRun.Status != "sent" && existingRun.Status != "cancelled" {
					// Status is "sending" or "pending" - allow retry within extended window (up to 4 hours)
					if timeDiff > 0 && timeDiff <= 4*time.Hour {
						due = &schedule[i]
						isPastTime = true
						log.Printf("✅ smart_sms: FOUND unsent scheduled time for category=%s, provider=%s (scheduled: %02d:%02d, status: %s, diff: %v)",
							schedule[i].Category, schedule[i].Provider, schedule[i].Hour, schedule[i].Minute, existingRun.Status, timeDiff)
						if schedule[i].Provider == providerAvanak {
							log.Printf("📞 smart_sms: Avanak message will be retried - messageID=%d", schedule[i].AvanakMessageID)
						}
						break
					}
				}
			}
		}
	}

	if due == nil {
		// Log when no message is found (only occasionally to reduce log spam)
		if now.Second() < 5 {
			log.Printf("ℹ️ smart_sms: no scheduled message found for current time %02d:%02d (checked %d messages)", now.Hour(), now.Minute(), len(schedule))
		}
		return
	}

	if isPastTime {
		log.Printf("⏰ smart_sms: processing past scheduled time for category=%s (will send immediately)", due.Category)
	}

	log.Printf("🕐 smart_sms: found scheduled message at %02d:%02d - category=%s, provider=%s", now.Hour(), now.Minute(), due.Category, due.Provider)

	// Provider time window fail-safe
	// NOTE: For Avanak, we still check time window but it should be within 8:00-21:59
	if !isProviderTimeAllowed(due.Provider, now) {
		log.Printf("⏭️ smart_sms: provider time window blocked (%s) for category=%s at %02d:%02d (allowed: 8:00-21:59)",
			due.Provider, due.Category, now.Hour(), now.Minute())
		return
	}

	// NOTE: Avanak service checks are done in the sending loop (like SMS messages)
	// This ensures consistent behavior with other providers

	runDate := todayMidnightTehran(now, loc)
	scheduledAt := time.Date(runDate.Year(), runDate.Month(), runDate.Day(), due.Hour, due.Minute, 0, 0, loc)

	// Idempotency: check if run already exists (unique per category+date)
	var run models.SmartSMSScheduleRun

	// برای آوانک: همیشه Run امروز را پاک می‌کنیم تا در هر تنظیم زمان جدید، ارسال حتماً تریگر شود.
	// ددیوپ ارسال توسط sms_logs انجام می‌شود، پس حذف Run باعث ارسال تکراری نمی‌شود.
	if due.Provider == providerAvanak {
		db.Where("category = ? AND run_date = ?", due.Category, runDate).Delete(&models.SmartSMSScheduleRun{})
	}

	if err := db.Where("category = ? AND run_date = ?", due.Category, runDate).First(&run).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create new run row with status=sending
			run = models.SmartSMSScheduleRun{
				Category:    due.Category,
				RunDate:     runDate,
				Provider:    string(due.Provider),
				ScheduledAt: scheduledAt,
				Status:      "sending",
				CreatedAt:   now,
				UpdatedAt:   now,
			}
			if err := db.Create(&run).Error; err != nil {
				log.Printf("❌ smart_sms: failed to create run row (category=%s): %v", due.Category, err)
				return
			}
			log.Printf("✅ smart_sms: created new run row (category=%s, runDate=%s)", due.Category, runDate.Format("2006-01-02"))
		} else {
			log.Printf("❌ smart_sms: failed to check existing run (category=%s): %v", due.Category, err)
			return
		}
	} else {
		// Run already exists - check status
		log.Printf("ℹ️ smart_sms: run row already exists (category=%s, status=%s, eligible=%d, sent=%d)",
			due.Category, run.Status, run.EligibleCount, run.SentCount)

		// Check if message was recently updated (time was changed)
		// If updated recently, force re-send even if status is "sent"
		var scheduledMsg models.SmartSMSScheduledMessage
		var timeSinceUpdate time.Duration
		var shouldForceResend bool
		if err := db.Where("category = ?", due.Category).First(&scheduledMsg).Error; err == nil {
			timeSinceUpdate = now.Sub(scheduledMsg.UpdatedAt)
			// If updated within last 60 minutes, it means time was just changed - force re-send
			shouldForceResend = timeSinceUpdate <= 60*time.Minute
			if shouldForceResend {
				if due.Provider == providerAvanak {
					log.Printf("🔄 smart_sms: Avanak message recently updated (updated %v ago) for category=%s, messageID=%d - will force re-send if needed",
						timeSinceUpdate, due.Category, due.AvanakMessageID)
				} else {
					log.Printf("🔄 smart_sms: message recently updated (updated %v ago) for category=%s - will force re-send if needed",
						timeSinceUpdate, due.Category)
				}
			}
		} else {
			if due.Provider == providerAvanak {
				log.Printf("⚠️ smart_sms: Avanak message category=%s not found in DB when checking for force re-send", due.Category)
			}
		}

		// If message was recently updated (time changed), force re-send even if status is "sent"
		if shouldForceResend && run.Status == "sent" {
			if due.Provider == providerAvanak {
				log.Printf("🔄 smart_sms: Avanak time recently changed (updated %v ago) for category=%s, messageID=%d - forcing re-send (deleting existing run with status=sent)",
					timeSinceUpdate, due.Category, due.AvanakMessageID)
			} else {
				log.Printf("🔄 smart_sms: time recently changed (updated %v ago) for category=%s - forcing re-send (deleting existing run with status=sent)",
					timeSinceUpdate, due.Category)
			}
			// CRITICAL: Delete SmartSMSLog entries for this category to allow re-sending
			// This ensures alreadySent() won't reject all users
			deletedLogs := db.Where("category = ?", due.Category).Delete(&models.SmartSMSLog{}).RowsAffected
			if deletedLogs > 0 {
				log.Printf("🗑️ smart_sms: deleted %d SmartSMSLog entries for category=%s to allow re-send", deletedLogs, due.Category)
			}
			// Delete the existing run to force re-send
			if err := db.Delete(&run).Error; err != nil {
				log.Printf("❌ smart_sms: failed to delete existing run for re-send: %v", err)
				return
			}
			// Create new run row with status=sending
			run = models.SmartSMSScheduleRun{
				Category:    due.Category,
				RunDate:     runDate,
				Provider:    string(due.Provider),
				ScheduledAt: scheduledAt,
				Status:      "sending",
				CreatedAt:   now,
				UpdatedAt:   now,
			}
			if err := db.Create(&run).Error; err != nil {
				log.Printf("❌ smart_sms: failed to create new run row for re-send (category=%s): %v", due.Category, err)
				return
			}
			log.Printf("✅ smart_sms: created new run row for re-send (category=%s, runDate=%s)", due.Category, runDate.Format("2006-01-02"))
		} else if run.Status == "sent" && !shouldForceResend {
			// Run already completed and not recently updated - skip
			log.Printf("⏭️ smart_sms: run already completed (category=%s, sent=%d), skipping", due.Category, run.SentCount)
			return
		} else if run.Status == "cancelled" {
			log.Printf("⏭️ smart_sms: run was cancelled (category=%s), skipping", due.Category)
			return
		} else {
			// Status is "sending" or "pending" - continue processing
			log.Printf("🔄 smart_sms: continuing with existing run (category=%s, status=%s)", due.Category, run.Status)
			// Update status to "sending" and update timestamp
			db.Model(&run).Updates(map[string]interface{}{
				"status":     "sending",
				"updated_at": now,
			})
		}
	}

	start, end := yesterdayRangeJalali(now, loc)

	// Fetch all users registered yesterday (Jalali range)
	// Note: alreadySent() will ensure only one message per phone number, even if user registered multiple times
	var users []models.User
	if err := db.Where("registered_at >= ? AND registered_at < ?", start, end).Find(&users).Error; err != nil {
		log.Printf("❌ smart_sms: failed to fetch yesterday users: %v", err)
		db.Model(&run).Updates(map[string]interface{}{"status": "cancelled", "updated_at": time.Now().In(loc)})
		return
	}

	log.Printf("📊 smart_sms: found %d registration records yesterday (Jalali: %s to %s) for category=%s", len(users), start.Format("2006-01-02 15:04:05"), end.Format("2006-01-02 15:04:05"), due.Category)

	eligible := 0
	sent := 0
	skippedNoIdentity := 0
	skippedAlreadySent := 0
	skippedWatchedMoreThan10Min := 0

	for i := range users {
		u := &users[i]
		ensureIdentityForUser(db, u)
		if u.IdentityID == nil || *u.IdentityID == 0 {
			skippedNoIdentity++
			continue
		}

		// Dedupe: Check if message already sent to this phone number (IdentityID) for this category on the same runDate
		// This ensures each phone number receives the message only once per category per day, regardless of registration count
		// Users can receive the same message again on different days (different runDate)
		if alreadySent(db, *u.IdentityID, u.ID, due.Category, runDate) {
			skippedAlreadySent++
			continue
		}

		// CRITICAL: Skip users who watched more than 10 minutes
		// These users should not receive SMS/Avanak messages
		// Get watch time from webinar_activities (most accurate)
		var maxWatchMinutes int
		db.Table("webinar_activities").
			Where("phone = ?", u.Phone).
			Select("COALESCE(MAX(total_view_minutes), 0)").
			Scan(&maxWatchMinutes)
		
		// Fallback to users.total_watch_seconds if no webinar_activities record
		if maxWatchMinutes == 0 && u.TotalWatchSeconds > 0 {
			maxWatchMinutes = u.TotalWatchSeconds / 60
		}

		if maxWatchMinutes > 10 {
			skippedWatchedMoreThan10Min++
			log.Printf("⏭️ smart_sms: skipping user (watched %d minutes > 10): phone=%s, cycle=%d, category=%s", maxWatchMinutes, u.Phone, u.ID, due.Category)
			continue
		}

		eligible++

		switch due.Provider {
		case providerFaraz:
			// Plain SMS via Faraz
			if err := faraz.SendSimpleSMS([]string{u.Phone}, due.Message); err != nil {
				log.Printf("❌ smart_sms: faraz send failed (cycle=%d, phone=%s): %v", u.ID, u.Phone, err)
				continue
			}
			if err := logSent(db, *u.IdentityID, u.ID, providerFaraz, "", due.Category, now); err != nil {
				log.Printf("❌ smart_sms: failed to write sms log (cycle=%d, category=%s): %v", u.ID, due.Category, err)
				continue
			}
			sent++
		case providerMelipayamak:
			if melipayamak == nil || melipayamak.GetConfig() == nil || !melipayamak.GetConfig().Enabled {
				// Fail-safe: provider disabled => do not send and do not mark as sent
				continue
			}
			// MeliPayamak MUST use pattern codes (fail-safe: if missing, do not send)
			if due.PatternKey == "" {
				continue
			}
			patternStr, ok := getSystemConfigValue(db, due.PatternKey)
			if !ok {
				// Fail-safe: ambiguous -> don't send
				continue
			}
			var pattern int
			_, err := fmt.Sscanf(patternStr, "%d", &pattern)
			if err != nil || pattern <= 0 {
				continue
			}

			// Time-based messages are sent via a pre-approved template (pattern).
			// Do NOT pass params unless the template requires them (fail-safe).
			if err := melipayamak.SendPatternSMS(u.Phone, pattern); err != nil {
				log.Printf("❌ smart_sms: melipayamak send failed (cycle=%d, phone=%s, pattern=%d): %v", u.ID, u.Phone, pattern, err)
				continue
			}
			if err := logSent(db, *u.IdentityID, u.ID, providerMelipayamak, fmt.Sprintf("%d", pattern), due.Category, now); err != nil {
				log.Printf("❌ smart_sms: failed to write sms log (cycle=%d, category=%s): %v", u.ID, due.Category, err)
				continue
			}
			sent++
		case providerAvanak:
			if avanak == nil {
				log.Printf("⚠️ smart_sms: avanak service is nil for category=%s, skipping", due.Category)
				continue
			}
			if runtimeAvanakConfig == nil {
				log.Printf("⚠️ smart_sms: avanak config is nil for category=%s, skipping (cannot send)", due.Category)
				continue
			}
			if !runtimeAvanakConfig.Enabled {
				log.Printf("⚠️ smart_sms: avanak service is disabled (runtime config) for category=%s, skipping", due.Category)
				continue
			}

			// Determine effective message ID (scheduled message overrides config)
			effectiveMessageID := due.AvanakMessageID
			if effectiveMessageID <= 0 && runtimeAvanakConfig.MessageID > 0 {
				effectiveMessageID = runtimeAvanakConfig.MessageID
				log.Printf("ℹ️ smart_sms: using Avanak message ID from config (%d) for category=%s", effectiveMessageID, due.Category)
			}
			if effectiveMessageID <= 0 {
				log.Printf("⚠️ smart_sms: avanak message ID missing for category=%s (scheduled=%d, config=%d), skipping",
					due.Category, due.AvanakMessageID, runtimeAvanakConfig.MessageID)
				continue
			}
			// CRITICAL: Normalize phone number before sending (like SMS messages)
			normalizedPhone := utils.NormalizePhoneNumber(u.Phone)
			// Send voice call via Avanak
			log.Printf("📞 smart_sms: sending avanak voice call (cycle=%d, phone=%s, normalized=%s, messageID=%d, category=%s)",
				u.ID, u.Phone, normalizedPhone, effectiveMessageID, due.Category)
			if err := avanak.SendVoiceCall(normalizedPhone, effectiveMessageID); err != nil {
				log.Printf("❌ smart_sms: avanak send failed (cycle=%d, phone=%s, messageID=%d): %v", u.ID, normalizedPhone, effectiveMessageID, err)
				continue
			}
			// Log as sent (using providerAvanak)
			if err := logSent(db, *u.IdentityID, u.ID, providerAvanak, fmt.Sprintf("%d", effectiveMessageID), due.Category, now); err != nil {
				log.Printf("❌ smart_sms: failed to write avanak log (cycle=%d, category=%s): %v", u.ID, due.Category, err)
				continue
			}
			log.Printf("✅ smart_sms: avanak voice call sent successfully (cycle=%d, phone=%s, messageID=%d, category=%s)",
				u.ID, normalizedPhone, effectiveMessageID, due.Category)
			sent++
		}
	}

	doneAt := time.Now().In(loc)
	log.Printf("📊 smart_sms: completed category=%s, provider=%s, total_users=%d, eligible=%d, sent=%d, skipped_no_identity=%d, skipped_already_sent=%d, skipped_watched_more_than_10min=%d",
		due.Category, due.Provider, len(users), eligible, sent, skippedNoIdentity, skippedAlreadySent, skippedWatchedMoreThan10Min)
	runStatus := "sent"
	executedAt := &doneAt
	if sent == 0 && eligible > 0 {
		// هنوز چیزی ارسال نشده؛ وضعیت را pending نگه می‌داریم تا امکان Retry باشد و UI «فعال/ارسال‌شده» نشان ندهد
		runStatus = "pending"
		executedAt = nil
		log.Printf("⚠️ smart_sms: category=%s had %d eligible users but 0 successful sends - keeping status pending for retry", due.Category, eligible)
	}

	updateFields := map[string]interface{}{
		"status":         runStatus,
		"eligible_count": eligible,
		"sent_count":     sent,
		"updated_at":     doneAt,
	}
	if executedAt != nil {
		updateFields["executed_at"] = executedAt
	} else {
		updateFields["executed_at"] = nil
	}

	db.Model(&run).Updates(updateFields)
}
