package scheduler

import (
	"fmt"
	"log"
	"strconv"
	"sync"
	"time"

	"monetizeai-backend/config"
	"monetizeai-backend/models"
	"monetizeai-backend/services"
	"monetizeai-backend/services/notification"
	"monetizeai-backend/services/workflow"
	"monetizeai-backend/streaming"
	"monetizeai-backend/utils"

	"github.com/go-co-op/gocron"
	"gorm.io/gorm"
)

// Track which test users have already received reminder (to avoid duplicate sends)
var testReminderSent = make(map[uint]bool)
var testReminderMutex = &sync.Mutex{}

func StartScheduler(db *gorm.DB, avanakService *services.AvanakService, melipayamakService *services.MelipayamakService, farazSMSService *services.FarazSMSService, testMode *config.TestModeConfig, cfg *config.Config) {
	log.Println("🚀 StartScheduler called - Initializing scheduler...")

	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		log.Fatalf("Failed to load timezone for scheduler: %v", err)
	}

	s := gocron.NewScheduler(loc)
	log.Println("✅ Scheduler created successfully")

	// Initialize advanced workflow executor (NEW ENGINE)
	log.Println("🔧 Initializing advanced workflow executor...")
	smsProvider := notification.NewMeliPayamakSmsProvider(&cfg.Melipayamak)
	if smsProvider == nil {
		log.Printf("⚠️  WARNING: SMS provider is nil, workflow executor may not work correctly")
	}
	smsService := notification.NewSmsService(smsProvider)
	if smsService == nil {
		log.Printf("⚠️  WARNING: SMS service is nil, workflow executor may not work correctly")
	}
	voiceProvider := notification.NewAvanakVoiceProvider(&cfg.Avanak)
	if voiceProvider == nil {
		log.Printf("⚠️  WARNING: Voice provider is nil, workflow executor may not work correctly")
	}
	voiceService := notification.NewVoiceService(voiceProvider)
	if voiceService == nil {
		log.Printf("⚠️  WARNING: Voice service is nil, workflow executor may not work correctly")
	}
	advancedWorkflowExecutor := workflow.NewAdvancedWorkflowExecutor(db, smsService, voiceService)
	if advancedWorkflowExecutor == nil {
		log.Printf("❌ ERROR: Advanced workflow executor is nil!")
	} else {
		log.Println("✅ Advanced workflow executor initialized (NEW ENGINE)")
	}

	// CRITICAL: Load config from database (not from file) for initial scheduling
	// Database is the single source of truth
	log.Println("📋 Loading config from database for scheduler initialization...")
	dbConfig := config.LoadConfigFromDB(db, cfg)
	webinarStartHour := dbConfig.Webinar.StartHour
	webinarStartMinute := dbConfig.Webinar.StartMinute

	log.Printf("📋 Scheduler using config from database: Start=%02d:%02d, End=%02d:00",
		webinarStartHour, webinarStartMinute, dbConfig.Webinar.EndHour)

	// NOTE: Job 1 and Job 2 (reminders at 14:00 and 30 min before webinar) have been removed.
	// All SMS and Avanak messages are now managed through processAutomaticSMSMessages,
	// processAutomaticAvanakMessages, processScheduledSMSMessages, and processScheduledAvanakMessages
	// which use send_hour/send_minute or scheduled_at from the database (set by admin via frontend).
	// This gives admin full control over send times without dependency on webinar start time.

	// Test Mode Job: Send reminder 1 minute after registration for test phone only
	log.Printf("🔍 DEBUG: Checking test mode - testMode: %+v", testMode)
	if testMode != nil {
		log.Printf("🔍 DEBUG: testMode is not nil - Enabled: %v, TestPhone: '%s'", testMode.Enabled, testMode.TestPhone)
	} else {
		log.Printf("🔍 DEBUG: testMode is nil!")
	}

	if testMode != nil && testMode.Enabled && testMode.TestPhone != "" {
		log.Printf("🧪 Test mode enabled - Reminder will be sent 1 minute after registration for test phone: %s", testMode.TestPhone)

		// Normalize test phone number
		testPhoneNormalized := utils.NormalizePhoneNumber(testMode.TestPhone)
		log.Printf("🧪 TEST MODE: Normalized test phone: %s (original: %s)", testPhoneNormalized, testMode.TestPhone)

		// Check every minute for test phone registrations
		s.Every(1).Minute().Do(func() {
			log.Printf("🧪 TEST MODE: Checking for test phone %s registrations...", testPhoneNormalized)
			now := time.Now().In(loc)

			// Find ALL users with test phone who registered in the last 10 minutes (to catch any recent registration)
			tenMinutesAgo := now.Add(-10 * time.Minute)
			var testUsers []models.User

			// Try to find users with exact phone match
			db.Where("phone = ? AND registered_at >= ?", testPhoneNormalized, tenMinutesAgo).Order("registered_at DESC").Find(&testUsers)

			// If not found, try with original phone (in case normalization didn't match)
			if len(testUsers) == 0 {
				log.Printf("🧪 TEST MODE: No users found with normalized phone %s, trying original phone %s", testPhoneNormalized, testMode.TestPhone)
				db.Where("phone = ? AND registered_at >= ?", testMode.TestPhone, tenMinutesAgo).Order("registered_at DESC").Find(&testUsers)
			}

			log.Printf("🧪 TEST MODE: Found %d test phone users in last 10 minutes", len(testUsers))

			// Log all found users for debugging
			for _, u := range testUsers {
				log.Printf("🧪 TEST MODE: Found user ID %d, Phone: %s, Registered at: %v", u.ID, u.Phone, u.RegisteredAt.Format("2006-01-02 15:04:05"))
			}

			for _, user := range testUsers {
				// Check if we already sent reminder to this user
				testReminderMutex.Lock()
				alreadySent := testReminderSent[user.ID]
				testReminderMutex.Unlock()

				if !alreadySent {
					// Check if at least 1 minute has passed since registration
					timeSinceRegistration := now.Sub(user.RegisteredAt)
					log.Printf("🧪 TEST MODE: User ID %d - Time since registration: %v (registered at: %v)",
						user.ID, timeSinceRegistration, user.RegisteredAt.Format("2006-01-02 15:04:05"))

					// Send reminder if at least 1 minute has passed (up to 5 minutes to catch late checks)
					if timeSinceRegistration >= 55*time.Second && timeSinceRegistration <= 10*time.Minute {
						log.Printf("🧪 TEST MODE: ✅ Sending reminder to test phone %s (registered %v ago, ID: %d)",
							testPhoneNormalized, timeSinceRegistration, user.ID)

						// Mark as sent
						testReminderMutex.Lock()
						testReminderSent[user.ID] = true
						testReminderMutex.Unlock()

						// Send reminder (both voice and SMS)
						// Try to get from database first, fallback to config
						var smsMessage models.SMSMessage
						var bodyId int
						if err := db.Where("name = ? AND is_active = ?", "یادآوری ساعت 14", true).First(&smsMessage).Error; err != nil {
							bodyId = melipayamakService.GetConfig().BodyIdReminder2PM
							log.Printf("⚠️  SMS message 'یادآوری ساعت 14' not found in database, using config fallback")
						} else {
							bodyId = smsMessage.PatternCode
						}
						go sendReminders(user, avanakService, melipayamakService, bodyId, db)
					} else {
						log.Printf("🧪 TEST MODE: ⏳ Not yet - User ID %d registered %v ago (need 55-65 seconds)",
							user.ID, timeSinceRegistration)
					}
				} else {
					log.Printf("🧪 TEST MODE: ✅ Already sent reminder to User ID %d", user.ID)
				}
			}
		})
	} else {
		log.Println("ℹ️  Test mode is disabled")
	}

	// Job 3: Update webinar schedule daily at midnight (00:00)
	// This ensures the webinar time is updated for the next day automatically
	s.Every(1).Day().At("00:00").Do(func() {
		log.Println("🔄 Running job: Daily webinar schedule update")
		updateWebinarSchedule(db, cfg)
	})

	// Job 4: Start streaming for today's webinar (at the same time as webinar start)
	// CRITICAL: This job now works differently based on scheduling mode:
	// - Manual mode: Uses fixed time from config (legacy behavior)
	// - Appointment mode: Periodic check (every 5 seconds) handles this, but we keep this job as backup
	// The periodic check (every 5 seconds) is the PRIMARY method for starting streams in appointment mode
	// This job is kept for manual mode compatibility and as a backup trigger

	// Check scheduling mode to decide how to schedule
	schedulingMode := getSchedulingMode(db)

	if schedulingMode == "appointment" {
		// Appointment mode: Don't use fixed-time job - periodic check (every 5 seconds) handles this
		// This allows different times for different days
		log.Printf("📹 Appointment mode active - Stream start will be handled by periodic check (every 5 seconds)")
		log.Printf("💡 NOTE: Each day's stream time comes from appointment_slots table")
	} else {
		// Manual mode: Use fixed time from config (legacy behavior)
		streamTimeStr := fmt.Sprintf("%02d:%02d", webinarStartHour, webinarStartMinute)
		log.Printf("📹 Scheduling stream start at %s (manual mode, from database config)", streamTimeStr)
		log.Printf("💡 NOTE: Config will be reloaded from database when job runs (allows dynamic updates from admin panel)")

		s.Every(1).Day().At(streamTimeStr).Do(func() {
			now := time.Now().In(loc)
			log.Printf("⏰ Scheduler triggered at %s for stream start (scheduled for %s)",
				now.Format("2006-01-02 15:04:05"), streamTimeStr)

			// CRITICAL: Reload config from database to get latest values from admin panel
			// This ensures we use the most up-to-date config even if it was changed after server startup
			log.Println("🔄 Reloading config from database to get latest webinar schedule...")
			dynamicConfig := config.LoadConfigFromDB(db, cfg)

			// In manual mode, use config directly
			expectedTime := time.Date(now.Year(), now.Month(), now.Day(), dynamicConfig.Webinar.StartHour, dynamicConfig.Webinar.StartMinute, 0, 0, loc)
			timeDiff := now.Sub(expectedTime)

			if timeDiff.Abs() > 2*time.Minute {
				log.Printf("⚠️  WARNING: Scheduler triggered %v away from expected time %s (manual mode)",
					timeDiff, expectedTime.Format("2006-01-02 15:04:05"))
			} else {
				log.Printf("✅ Scheduler triggered at correct time (within 2 minutes tolerance, manual mode)")
			}

			log.Println("📹 Running job: Start streaming for today's webinar (manual mode)")
			startStreamingForToday(db, dynamicConfig)
		})
	}

	log.Println("✅ Scheduler started with daily loop support...")
	s.StartAsync()

	// CRITICAL: Also check immediately if we should start streaming now
	// This handles cases where server restarts after scheduled time
	// or when config changes and we need to start immediately
	go func() {
		// Wait a moment for scheduler to initialize
		time.Sleep(3 * time.Second)

		log.Println("🔍 Checking if stream should start immediately...")
		now := time.Now().In(loc)

		// Check scheduling mode and get expected times
		schedulingMode := getSchedulingMode(db)
		var expectedStartTime, expectedEndTime time.Time

		if schedulingMode == "appointment" {
			slot, err := getTodayAppointmentSlot(db)
			if err != nil {
				// CRITICAL: In appointment mode, we MUST have a slot
				persianNow := utils.ToPersian(now)
				log.Printf("❌ CRITICAL ERROR: Initial check - Appointment mode active but no slot found for today (year=%d, month=%d, day=%d). Error: %v",
					persianNow.Year, persianNow.Month, persianNow.Day, err)
				log.Printf("❌ Cannot start stream without appointment slot. Please create appointment slots for this month.")
				return // Don't start stream without slot
			}

			// CRITICAL: Check that slot is NOT completed before starting stream
			if slot.IsCompleted {
				log.Printf("🛑 Initial check - Appointment slot #%d is already completed. Stream will NOT start for this slot.", slot.ID)
				return // Don't start stream for completed slot
			}

			expectedStartTime = slot.StartDateTime.In(loc)
			// CRITICAL: For appointment mode, end time is ALWAYS start time + 102 minutes (1 hour 42 minutes)
			expectedEndTime = expectedStartTime.Add(102 * time.Minute)
			log.Printf("🔍 Initial check (appointment mode): Using slot Day %d, Start=%02d:%02d, End=%02d:%02d (start + 102 minutes), SlotID=%d, Completed=%v",
				slot.PersianDay, slot.StartHour, slot.StartMinute, expectedEndTime.Hour(), expectedEndTime.Minute(), slot.ID, slot.IsCompleted)
		} else {
			dynamicConfig := config.LoadConfigFromDB(db, cfg)
			expectedStartTime = time.Date(now.Year(), now.Month(), now.Day(), dynamicConfig.Webinar.StartHour, dynamicConfig.Webinar.StartMinute, 0, 0, loc)
			expectedEndTime = time.Date(now.Year(), now.Month(), now.Day(), dynamicConfig.Webinar.EndHour, 0, 0, 0, loc)
			if dynamicConfig.Webinar.EndHour < dynamicConfig.Webinar.StartHour ||
				(dynamicConfig.Webinar.EndHour == dynamicConfig.Webinar.StartHour && dynamicConfig.Webinar.StartMinute > 0) {
				expectedEndTime = expectedEndTime.AddDate(0, 0, 1)
			}
		}

		if now.After(expectedStartTime) {
			// If past today's start time, check if we're within the webinar duration
			if now.Before(expectedEndTime) {
				// We're within today's webinar time window - start streaming immediately!
				log.Printf("🚀 Webinar is currently active (started at %s, ends at %s). Starting stream immediately!",
					expectedStartTime.Format("2006-01-02 15:04:05"),
					expectedEndTime.Format("2006-01-02 15:04:05"))
				dynamicConfig := config.LoadConfigFromDB(db, cfg)
				startStreamingForToday(db, dynamicConfig)
			} else {
				log.Printf("ℹ️  Today's webinar has ended (ended at %s). Will start tomorrow.",
					expectedEndTime.Format("2006-01-02 15:04:05"))
			}
		} else {
			// Not yet time, but check if we're very close (within 5 minutes)
			timeUntilStart := expectedStartTime.Sub(now)
			if timeUntilStart <= 5*time.Minute && timeUntilStart > 0 {
				log.Printf("⏰ Webinar starts in %v. Will start streaming at scheduled time %s",
					timeUntilStart, expectedStartTime.Format("2006-01-02 15:04:05"))
			} else {
				log.Printf("⏰ Webinar starts at %s (in %v). Stream will start automatically at that time.",
					expectedStartTime.Format("2006-01-02 15:04:05"), timeUntilStart)
			}
		}
	}()

	// CRITICAL: Also add a periodic check job (every 5 seconds) to catch missed schedules
	// This ensures stream starts at the exact scheduled time (maximum 5 seconds delay)
	// This job ALWAYS reads config from database or appointment slots, so it picks up admin panel changes immediately
	// NEW: Supports both manual and appointment-based scheduling
	s.Every(5).Seconds().Do(func() {
		now := time.Now().In(loc)

		// Check scheduling mode
		schedulingMode := getSchedulingMode(db)

		var expectedStartTime, expectedEndTime time.Time

		if schedulingMode == "appointment" {
			// Use appointment slot for today
			slot, err := getTodayAppointmentSlot(db)
			if err != nil {
				// CRITICAL: In appointment mode, we MUST have a slot - don't fallback to manual
				// Log error and skip this check - will retry next interval
				persianNow := utils.ToPersian(now)
				log.Printf("❌ CRITICAL ERROR: Appointment mode active but no slot found for today (year=%d, month=%d, day=%d). Error: %v",
					persianNow.Year, persianNow.Month, persianNow.Day, err)
				log.Printf("⚠️  Skipping stream start - will retry next interval. Please create appointment slots for this month.")
				return // Skip this check, will retry in 5 seconds
			}

			// CRITICAL: Check that slot is NOT completed before starting stream
			if slot.IsCompleted {
				log.Printf("🛑 Periodic check - Appointment slot #%d is already completed. Stream will NOT start for this slot.", slot.ID)
				return // Don't start stream for completed slot
			}

			// Use appointment slot time
			expectedStartTime = slot.StartDateTime.In(loc)
			// CRITICAL: For appointment mode, end time is ALWAYS start time + 102 minutes (1 hour 42 minutes)
			expectedEndTime = expectedStartTime.Add(102 * time.Minute)
			log.Printf("🔍 Periodic check (appointment mode): Using slot Day %d, Start=%02d:%02d, End=%02d:%02d (start + 102 minutes), SlotID=%d, Completed=%v",
				slot.PersianDay, slot.StartHour, slot.StartMinute, expectedEndTime.Hour(), expectedEndTime.Minute(), slot.ID, slot.IsCompleted)
		} else {
			// Use manual config
			dynamicConfig := config.LoadConfigFromDB(db, cfg)
			expectedStartTime = time.Date(now.Year(), now.Month(), now.Day(), dynamicConfig.Webinar.StartHour, dynamicConfig.Webinar.StartMinute, 0, 0, loc)
			expectedEndTime = time.Date(now.Year(), now.Month(), now.Day(), dynamicConfig.Webinar.EndHour, 0, 0, 0, loc)
			if dynamicConfig.Webinar.EndHour < dynamicConfig.Webinar.StartHour ||
				(dynamicConfig.Webinar.EndHour == dynamicConfig.Webinar.StartHour && dynamicConfig.Webinar.StartMinute > 0) {
				expectedEndTime = expectedEndTime.AddDate(0, 0, 1)
			}
		}

		// Check if we're within today's webinar time window
		timeUntilStart := expectedStartTime.Sub(now)
		timeSinceStart := now.Sub(expectedStartTime)

		// CRITICAL FIX: Skip periodic check if stream is already running to prevent unnecessary restarts
		// This prevents the "restart from beginning" bug and reduces lag
		if streaming.IsStreamRunning() {
			currentStreamEndTime := streaming.GetStreamEndTime()
			// Only log occasionally to reduce log spam (every 30 seconds)
			if int(now.Unix())%30 == 0 {
				if !currentStreamEndTime.IsZero() {
					log.Printf("🔍 Periodic check: Stream is running (ends at %s). Skipping to avoid interruption.",
						currentStreamEndTime.Format("2006-01-02 15:04:05"))
				}
			}
			return
		}

		// CRITICAL FIX: Check if we're at or past the start time (even if just 1 second past)
		// This ensures stream starts immediately when admin changes time to current/past time
		if now.After(expectedStartTime) || now.Equal(expectedStartTime) {
			if now.Before(expectedEndTime) {
				// We're within the webinar window - MUST start streaming immediately
				// startStreamingForToday will check internally if stream is already running
				log.Printf("🔍 Periodic check: Webinar is active (started %v ago, ends in %v). Starting stream immediately...",
					timeSinceStart, expectedEndTime.Sub(now))
				dynamicConfig := config.LoadConfigFromDB(db, cfg)
				startStreamingForToday(db, dynamicConfig)
			} else {
				// Past end time - don't start
				log.Printf("🔍 Periodic check: Past end time (%s), not starting stream", expectedEndTime.Format("2006-01-02 15:04:05"))
			}
		} else if now.Before(expectedStartTime) {
			// Not yet time - check if we're very close (within 10 seconds for precise start)
			if timeUntilStart <= 10*time.Second && timeUntilStart > 0 {
				log.Printf("🔍 Periodic check: Webinar starts in %v (at %s). Will start stream precisely...",
					timeUntilStart, expectedStartTime.Format("2006-01-02 15:04:05"))
				// Start immediately if we're within 10 seconds (job runs every 5 seconds, so this catches it)
				dynamicConfig := config.LoadConfigFromDB(db, cfg)
				startStreamingForToday(db, dynamicConfig)
			} else if timeUntilStart <= 2*time.Minute && timeUntilStart > 0 {
				log.Printf("🔍 Periodic check: Webinar starts in %v. Will start stream at scheduled time %s",
					timeUntilStart, expectedStartTime.Format("2006-01-02 15:04:05"))
			}
		}
	})

	// Job 4: Check and send automatic SMS messages (every minute)
	// Uses send_hour and send_minute from database (set by admin via frontend)
	s.Every(1).Minute().Do(func() {
		processAutomaticSMSMessages(db, melipayamakService, avanakService, loc)
	})

	// Job 5: Check and send scheduled SMS messages (every minute)
	// Uses scheduled_at from database (set by admin via frontend)
	s.Every(1).Minute().Do(func() {
		processScheduledSMSMessages(db, melipayamakService, avanakService, loc)
	})

	// Job 6: Check and send automatic Avanak messages (every minute)
	// DISABLED: Avanak service has been completely removed
	// s.Every(1).Minute().Do(func() {
	// 	processAutomaticAvanakMessages(db, avanakService, loc)
	// })

	// Job 7: Check and send scheduled Avanak messages (every minute)
	// DISABLED: Avanak service has been completely removed
	// s.Every(1).Minute().Do(func() {
	// 	processScheduledAvanakMessages(db, avanakService, loc)
	// })

	// Job 8: Process auto cycle SMS messages (every minute)
	// Sends messages to 24-hour cycle groups (17:00 to 17:00 next day)
	s.Every(1).Minute().Do(func() {
		processAutoCycleSMSMessages(db, melipayamakService, loc)
	})

	// Smart SMS system:
	// - Popup-based (event-based) follow-ups: every minute, with strict dedupe
	// - Yesterday time-based campaigns: checked every minute, only sends at exact scheduled times
	s.Every(1).Minute().Do(func() {
		processSmartPopupFollowups(db, melipayamakService, loc)
	})
	s.Every(1).Minute().Do(func() {
		processSmartYesterdayCampaignsInternal(db, melipayamakService, farazSMSService, avanakService, loc)
	})

	// Process payment SMS messages (triggered by landing activities)
	s.Every(1).Minute().Do(func() {
		processPaymentSMSMessages(db, farazSMSService, loc)
	})

	// Job 9: Process auto cycle Avanak messages (every minute)
	// DISABLED: Avanak service has been completely removed
	// s.Every(1).Minute().Do(func() {
	// 	processAutoCycleAvanakMessages(db, avanakService, loc)
	// })

	// Job 10: Process advanced workflow automation (every 1 minute)
	log.Println("📋 Scheduling Job 10: Advanced workflow automation executor (every 1 minute)")
	s.Every(1).Minute().Do(func() {
		now := time.Now().In(loc)
		log.Printf("[WORKFLOW] scheduler tick: checking due workflows at %s", now.Format("2006-01-02 15:04:05"))
		if err := advancedWorkflowExecutor.RunDueSteps(now); err != nil {
			log.Printf("[WORKFLOW] error running advanced workflow executor: %v", err)
		}
	})

	// Job 8: Check if stream duration has elapsed and stop stream if needed (every 10 seconds for precision)
	// For appointment mode: Stop after 1 hour 42 minutes (102 minutes = 6120 seconds)
	// For manual mode: Use existing video duration (1:43:36 = 6216 seconds)
	s.Every(10).Seconds().Do(func() {
		now := time.Now().In(loc)

		// Check if stream is running
		if streaming.IsStreamRunning() {
			streamStartTime := streaming.GetStreamStartTime()
			if !streamStartTime.IsZero() {
				// Check scheduling mode to determine duration
				schedulingMode := getSchedulingMode(db)
				var targetDuration time.Duration

				if schedulingMode == "appointment" {
					// Appointment mode: 1 hour 42 minutes = 102 minutes = 6120 seconds
					targetDuration = 1*time.Hour + 42*time.Minute
				} else {
					// Manual mode: Use existing video duration (1:43:36 = 6216 seconds)
					targetDuration = 1*time.Hour + 43*time.Minute + 36*time.Second
				}

				elapsed := now.Sub(streamStartTime)
				if elapsed >= targetDuration {
					log.Printf("⏰ Stream duration has elapsed (started: %s, now: %s, elapsed: %v, target: %v). Stopping stream.",
						streamStartTime.Format("2006-01-02 15:04:05"),
						now.Format("2006-01-02 15:04:05"),
						elapsed,
						targetDuration)

					// Stop the stream
					streaming.StopStream("rtmp://localhost:1935/live/stream")

					// Mark appointment slot as completed if in appointment mode
					if schedulingMode == "appointment" {
						slot, err := getTodayAppointmentSlot(db)
						if err == nil && slot != nil {
							db.Model(&models.AppointmentSlot{}).Where("id = ?", slot.ID).Update("is_completed", true)
							log.Printf("✅ Appointment slot #%d marked as completed (stream ended naturally after 102 minutes)", slot.ID)
						}
						// CRITICAL: For appointment mode, don't set is_manually_stopped when stream ends naturally
						// This allows frontend to show next slot's countdown timer automatically
						// The frontend will detect the end based on stream not being live and show appropriate message
					} else {
						// For manual mode, set is_manually_stopped to show thank you message
						var webinar models.Webinar
						if err := db.First(&webinar).Error; err == nil {
							db.Model(&webinar).Update("is_manually_stopped", true)
							log.Printf("✅ Webinar marked as manually stopped (manual mode) - thank you message will be shown")
						}
					}
				} else {
					remaining := targetDuration - elapsed
					if elapsed.Seconds() > 0 && int(elapsed.Seconds())%60 == 0 {
						// Log every minute
						log.Printf("⏰ Stream running. Started: %s, elapsed: %v, remaining: %v",
							streamStartTime.Format("2006-01-02 15:04:05"),
							elapsed,
							remaining)
					}
				}
			} else {
				log.Printf("⚠️  Stream is running but start time not set yet. Will check again next interval.")
			}
		}
	})
}

// getSchedulingMode returns the current scheduling mode (manual or appointment)
func getSchedulingMode(db *gorm.DB) string {
	var sysConfig models.SystemConfig
	if err := db.Where("`key` = ?", "webinar.scheduling_mode").First(&sysConfig).Error; err != nil {
		return "manual" // Default to manual
	}
	return sysConfig.Value
}

// getTodayAppointmentSlot returns today's appointment slot if scheduling mode is appointment
// IMPORTANT: For scheduler, we only want non-completed slots (to start new streams)
// For display purposes (GetWebinarInfo), we want all slots (even completed ones)
func getTodayAppointmentSlot(db *gorm.DB) (*models.AppointmentSlot, error) {
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}

	now := time.Now().In(loc)
	persianNow := utils.ToPersian(now)

	log.Printf("🔍 getTodayAppointmentSlot - Current time: %s (Gregorian), Persian date = %d/%d/%d",
		now.Format("2006-01-02 15:04:05 MST"), persianNow.Year, persianNow.Month, persianNow.Day)

	// CRITICAL: First try to find by Persian date
	var slot models.AppointmentSlot
	err = db.Where("persian_year = ? AND persian_month = ? AND persian_day = ? AND is_completed = ?",
		persianNow.Year, persianNow.Month, persianNow.Day, false).
		Order("id DESC"). // Get the most recent slot if multiple exist
		First(&slot).Error

	// If not found by Persian date, try by StartDateTime range (CRITICAL FALLBACK)
	if err != nil {
		log.Printf("⚠️  getTodayAppointmentSlot - Persian date match failed (looking for %d/%d/%d), trying StartDateTime range...",
			persianNow.Year, persianNow.Month, persianNow.Day)

		// Use a wider range to catch slots that might be slightly off
		// CRITICAL: Use current time minus 1 hour to start of next day to catch slots for today
		todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
		todayEnd := todayStart.AddDate(0, 0, 1)

		log.Printf("🔍 getTodayAppointmentSlot - Searching StartDateTime range: %s to %s",
			todayStart.Format("2006-01-02 15:04:05 MST"), todayEnd.Format("2006-01-02 15:04:05 MST"))

		// Try exact day match first
		err = db.Where("start_date_time >= ? AND start_date_time < ? AND is_completed = ?", todayStart, todayEnd, false).
			Order("id DESC").
			First(&slot).Error

		// If still not found, try a wider range (yesterday to tomorrow) to catch timezone issues
		if err != nil {
			log.Printf("⚠️  getTodayAppointmentSlot - StartDateTime exact match failed, trying wider range...")
			yesterdayStart := todayStart.AddDate(0, 0, -1)
			tomorrowEnd := todayEnd.AddDate(0, 0, 1)
			log.Printf("🔍 getTodayAppointmentSlot - Searching wider StartDateTime range: %s to %s",
				yesterdayStart.Format("2006-01-02 15:04:05 MST"), tomorrowEnd.Format("2006-01-02 15:04:05 MST"))

			err = db.Where("start_date_time >= ? AND start_date_time < ? AND is_completed = ?", yesterdayStart, tomorrowEnd, false).
				Order("id DESC").
				First(&slot).Error
		}

		if err == nil {
			log.Printf("✅ getTodayAppointmentSlot - Found slot by StartDateTime range: SlotID=%d, Persian=%d/%d/%d, StartDateTime=%s",
				slot.ID, slot.PersianYear, slot.PersianMonth, slot.PersianDay, slot.StartDateTime.Format("2006-01-02 15:04:05 MST"))
			log.Printf("⚠️  WARNING: Persian date mismatch! Looking for %d/%d/%d but found slot with Persian date %d/%d/%d",
				persianNow.Year, persianNow.Month, persianNow.Day,
				slot.PersianYear, slot.PersianMonth, slot.PersianDay)
		} else {
			// If still not found, try to find ANY slot for debugging
			var allSlots []models.AppointmentSlot
			db.Where("is_completed = ?", false).Order("persian_year DESC, persian_month DESC, persian_day DESC").Limit(5).Find(&allSlots)
			if len(allSlots) > 0 {
				log.Printf("🔍 getTodayAppointmentSlot - Found %d non-completed slots in database (showing last 5):", len(allSlots))
				for _, s := range allSlots {
					log.Printf("  Slot ID=%d: Persian=%d/%d/%d, StartDateTime=%s, StartTime=%02d:%02d",
						s.ID, s.PersianYear, s.PersianMonth, s.PersianDay,
						s.StartDateTime.Format("2006-01-02 15:04:05 MST"), s.StartHour, s.StartMinute)
				}
			}
		}
	}

	if err != nil {
		log.Printf("⚠️  getTodayAppointmentSlot - No non-completed slot found for today (year=%d, month=%d, day=%d). Error: %v",
			persianNow.Year, persianNow.Month, persianNow.Day, err)
		return nil, err
	}

	log.Printf("✅ getTodayAppointmentSlot - Found slot: ID=%d, Persian=%d/%d/%d, Day=%d, Start=%02d:%02d, StartDateTime=%s",
		slot.ID, slot.PersianYear, slot.PersianMonth, slot.PersianDay, slot.PersianDay, slot.StartHour, slot.StartMinute, slot.StartDateTime.Format("2006-01-02 15:04:05 MST"))

	return &slot, nil
}

// updateWebinarSchedule updates the webinar start and end times for today
// CRITICAL: Reload config from database to ensure we use latest values from admin panel
// IMPORTANT: Only updates if webinar is NOT currently active (to preserve current session)
// NEW: Supports both manual and appointment-based scheduling
func updateWebinarSchedule(db *gorm.DB, cfg *config.Config) {
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		log.Printf("❌ Failed to load timezone: %v", err)
		return
	}

	var webinar models.Webinar
	if err := db.First(&webinar).Error; err != nil {
		log.Printf("❌ Failed to find webinar: %v", err)
		return
	}

	now := time.Now().In(loc)

	// CRITICAL: Check if webinar is currently active (within start and end time)
	// If active, DON'T update times - preserve current session
	if !webinar.StartTime.IsZero() && !webinar.EndTime.IsZero() {
		startTimeInLoc := webinar.StartTime.In(loc)
		endTimeInLoc := webinar.EndTime.In(loc)

		if now.After(startTimeInLoc) && now.Before(endTimeInLoc) {
			log.Printf("⏸️  Webinar is currently active (started at %s, ends at %s). Preserving current times - NOT updating schedule.",
				startTimeInLoc.Format("2006-01-02 15:04:05"),
				endTimeInLoc.Format("2006-01-02 15:04:05"))
			return
		}
	}

	// Check scheduling mode
	schedulingMode := getSchedulingMode(db)
	log.Printf("📋 Scheduling mode: %s", schedulingMode)

	var startTime, endTime time.Time

	if schedulingMode == "appointment" {
		// Use appointment slot for today
		slot, err := getTodayAppointmentSlot(db)
		if err != nil {
			// CRITICAL: In appointment mode, we MUST have a slot
			persianNow := utils.ToPersian(now)
			log.Printf("❌ CRITICAL ERROR: updateWebinarSchedule - Appointment mode active but no slot found for today (year=%d, month=%d, day=%d). Error: %v",
				persianNow.Year, persianNow.Month, persianNow.Day, err)
			log.Printf("❌ Cannot update webinar schedule without appointment slot. Please create appointment slots for this month.")
			return // Don't update schedule without slot
		}
		// Use appointment slot time
		startTime = slot.StartDateTime.In(loc)
		// CRITICAL: For appointment mode, end time is ALWAYS start time + 102 minutes (1 hour 42 minutes)
		endTime = startTime.Add(102 * time.Minute)
		log.Printf("📅 Using appointment slot: Day %d, Start=%02d:%02d, End=%02d:%02d (start + 102 minutes), SlotID=%d",
			slot.PersianDay, slot.StartHour, slot.StartMinute, endTime.Hour(), endTime.Minute(), slot.ID)
	} else {
		// Use manual config
		dynamicConfig := config.LoadConfigFromDB(db, cfg)
		log.Printf("📋 Using manual config: Start=%02d:%02d, End=%02d:00",
			dynamicConfig.Webinar.StartHour, dynamicConfig.Webinar.StartMinute, dynamicConfig.Webinar.EndHour)

		startTime = time.Date(now.Year(), now.Month(), now.Day(), dynamicConfig.Webinar.StartHour, dynamicConfig.Webinar.StartMinute, 0, 0, loc)
		endTime = time.Date(now.Year(), now.Month(), now.Day(), dynamicConfig.Webinar.EndHour, 0, 0, 0, loc)

		// If EndHour < StartHour, end time is next day (webinar spans midnight)
		if dynamicConfig.Webinar.EndHour < dynamicConfig.Webinar.StartHour ||
			(dynamicConfig.Webinar.EndHour == dynamicConfig.Webinar.StartHour && dynamicConfig.Webinar.StartMinute > 0) {
			endTime = endTime.AddDate(0, 0, 1)
		}
	}

	// If it's already past start time today, use tomorrow
	if now.After(startTime) {
		startTime = startTime.AddDate(0, 0, 1)
		// Recalculate endTime
		if schedulingMode == "appointment" {
			// Get tomorrow's slot
			persianNow := utils.ToPersian(now.AddDate(0, 0, 1))
			var tomorrowSlot models.AppointmentSlot
			if err := db.Where("persian_year = ? AND persian_month = ? AND persian_day = ?",
				persianNow.Year, persianNow.Month, persianNow.Day).First(&tomorrowSlot).Error; err == nil {
				startTime = tomorrowSlot.StartDateTime.In(loc)
				// CRITICAL: For appointment mode, end time is ALWAYS start time + 102 minutes (1 hour 42 minutes)
				endTime = startTime.Add(102 * time.Minute)
			}
		} else {
			dynamicConfig := config.LoadConfigFromDB(db, cfg)
			endTime = time.Date(startTime.Year(), startTime.Month(), startTime.Day(), dynamicConfig.Webinar.EndHour, 0, 0, 0, loc)
			if dynamicConfig.Webinar.EndHour < dynamicConfig.Webinar.StartHour ||
				(dynamicConfig.Webinar.EndHour == dynamicConfig.Webinar.StartHour && dynamicConfig.Webinar.StartMinute > 0) {
				endTime = endTime.AddDate(0, 0, 1)
			}
		}
		log.Printf("📅 Start time is in the past, using tomorrow: %s", startTime.Format("2006-01-02 15:04:05"))
	}

	// Update webinar times
	db.Model(&webinar).Updates(map[string]interface{}{
		"StartTime": startTime,
		"EndTime":   endTime,
		"IsLive":    true,
	})

	log.Printf("✅ Updated webinar schedule: StartTime=%s, EndTime=%s (mode: %s)",
		startTime.Format("2006-01-02 15:04:05"),
		endTime.Format("2006-01-02 15:04:05"),
		schedulingMode)
}

// startStreamingForToday starts the streaming for today's webinar
// NEW: Supports both manual and appointment-based scheduling
func startStreamingForToday(db *gorm.DB, cfg *config.Config) {
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		log.Printf("❌ Failed to load timezone: %v", err)
		return
	}

	// Check scheduling mode
	schedulingMode := getSchedulingMode(db)
	log.Printf("📋 Scheduling mode: %s", schedulingMode)

	var startHour, startMinute, endHour int

	// Get comment offset from SystemConfig (same for both modes)
	getConfigValueFunc := func(key string, defaultValue string) string {
		var sysConfig models.SystemConfig
		if err := db.Where("`key` = ?", key).First(&sysConfig).Error; err != nil {
			return defaultValue
		}
		return sysConfig.Value
	}
	commentOffsetStr := getConfigValueFunc("webinar.comment_offset_seconds", "0")
	var commentOffset float64
	commentOffset, _ = strconv.ParseFloat(commentOffsetStr, 64)

	if schedulingMode == "appointment" {
		// Use appointment slot for today
		slot, err := getTodayAppointmentSlot(db)
		if err != nil {
			// CRITICAL: In appointment mode, we MUST have a slot - don't fallback to manual
			persianNow := utils.ToPersian(time.Now().In(loc))
			log.Printf("❌ CRITICAL ERROR: Appointment mode active but no slot found for today (year=%d, month=%d, day=%d). Error: %v",
				persianNow.Year, persianNow.Month, persianNow.Day, err)
			log.Printf("❌ Cannot start stream without appointment slot. Please create appointment slots for this month.")
			return // Don't start stream without slot
		}

		// CRITICAL: Double-check that slot is NOT completed before starting stream
		// This prevents stream from starting for a slot that has already ended
		if slot.IsCompleted {
			log.Printf("🛑 Appointment slot #%d is already completed. Stream will NOT start for this slot.", slot.ID)
			log.Printf("🛑 Will wait for next non-completed slot to start stream.")
			return // Don't start stream for completed slot
		}

		// Use appointment slot values
		startHour = slot.StartHour
		startMinute = slot.StartMinute
		// Note: endHour is stored but not used for end time calculation in appointment mode
		// End time is ALWAYS calculated as StartDateTime + 102 minutes
		endHour = slot.EndHour // Kept for compatibility, but actual end time uses StartDateTime + 102 minutes
		// Use comment offset from slot if available, otherwise from SystemConfig
		if slot.CommentOffset != 0 {
			commentOffset = slot.CommentOffset
		}
		calculatedEndTime := slot.StartDateTime.Add(102 * time.Minute)
		log.Printf("📅 Using appointment slot: Day %d, Start=%02d:%02d, End=%02d:%02d (start + 102 minutes), Offset=%.2f, SlotID=%d, Completed=%v",
			slot.PersianDay, slot.StartHour, slot.StartMinute, calculatedEndTime.Hour(), calculatedEndTime.Minute(), commentOffset, slot.ID, slot.IsCompleted)
	} else {
		// Use manual config
		dynamicConfig := config.LoadConfigFromDB(db, cfg)
		startHour = dynamicConfig.Webinar.StartHour
		startMinute = dynamicConfig.Webinar.StartMinute
		endHour = dynamicConfig.Webinar.EndHour
		log.Printf("📋 Using manual config: Start=%02d:%02d, End=%02d:00, Offset=%.2f",
			startHour, startMinute, endHour, commentOffset)
	}

	// Check if manual stop flag is set
	manualStopFlag := getConfigValueFunc("webinar.manual_stop", "false")
	isManuallyStopped := manualStopFlag == "true"

	if isManuallyStopped {
		log.Printf("🛑 Manual stop flag is set. Stream will NOT start. Clear the flag to allow streaming again.")
		return
	}

	// Use config from cfg (already merged from database + file)
	var webinar models.Webinar
	if err := db.First(&webinar).Error; err != nil {
		log.Printf("❌ Failed to find webinar: %v", err)
		return
	}

	// Check if webinar times are valid
	if webinar.StartTime.IsZero() || webinar.EndTime.IsZero() {
		log.Printf("⚠️  Webinar times not set, updating schedule first...")
		updateWebinarSchedule(db, cfg)
		// Reload webinar after update
		db.First(&webinar)
	}

	now := time.Now().In(loc)

	// Calculate expected start time (for TODAY) - Uses appointment slot or manual config
	// CRITICAL: For appointment mode, use slot.StartDateTime directly (more accurate)
	var expectedStartTime, expectedEndTime time.Time
	if schedulingMode == "appointment" {
		// Get slot again to use StartDateTime directly
		slot, err := getTodayAppointmentSlot(db)
		if err != nil {
			// This should not happen as we already validated above, but handle it anyway
			log.Printf("❌ CRITICAL: startStreamingForToday - Failed to get slot again: %v", err)
			return
		}

		// CRITICAL: Double-check that slot is NOT completed before starting stream
		// This prevents stream from starting for a slot that has already ended
		if slot.IsCompleted {
			log.Printf("🛑 startStreamingForToday - Appointment slot #%d is already completed. Stream will NOT start for this slot.", slot.ID)
			log.Printf("🛑 Will wait for next non-completed slot to start stream.")
			return // Don't start stream for completed slot
		}

		// Use slot.StartDateTime directly (most accurate - already converted from Persian date)
		expectedStartTime = slot.StartDateTime.In(loc)
		// CRITICAL: For appointment mode, end time is ALWAYS start time + 102 minutes (1 hour 42 minutes)
		expectedEndTime = expectedStartTime.Add(102 * time.Minute)
		log.Printf("📅 startStreamingForToday (appointment mode): Using slot.StartDateTime=%s (Day %d, Start=%02d:%02d, End=%02d:%02d - start + 102 minutes), SlotID=%d, Completed=%v",
			expectedStartTime.Format("2006-01-02 15:04:05 MST"), slot.PersianDay, slot.StartHour, slot.StartMinute, expectedEndTime.Hour(), expectedEndTime.Minute(), slot.ID, slot.IsCompleted)
	} else {
		// Manual mode: Calculate from hour/minute
		expectedStartTime = time.Date(now.Year(), now.Month(), now.Day(), startHour, startMinute, 0, 0, loc)
		expectedEndTime = time.Date(now.Year(), now.Month(), now.Day(), endHour, 0, 0, 0, loc)
		// If EndHour < StartHour, end time is next day (webinar spans midnight)
		if endHour < startHour || (endHour == startHour && startMinute > 0) {
			expectedEndTime = expectedEndTime.AddDate(0, 0, 1)
		}
	}

	// Check if we're within today's webinar time window
	timeUntilStart := expectedStartTime.Sub(now)
	timeSinceStart := now.Sub(expectedStartTime)

	// CRITICAL: Check if we're within the webinar window FIRST
	// If we're within the window, we MUST start streaming (regardless of how much time has passed)
	isWithinWebinarWindow := now.After(expectedStartTime) && now.Before(expectedEndTime)

	// If we're past today's start time, check if we're still within the webinar window
	if now.After(expectedStartTime) {
		if now.Before(expectedEndTime) {
			// We're within today's webinar window - MUST start streaming!
			log.Printf("✅ Current time is within today's webinar window (started %v ago, ends in %v). Starting stream...",
				timeSinceStart, expectedEndTime.Sub(now))
		} else {
			// Today's webinar has ended
			if schedulingMode == "appointment" {
				// For appointment mode, don't start tomorrow automatically - wait for next slot
				log.Printf("ℹ️  Today's appointment slot has ended (ended at %s). Will start next slot when scheduled.",
					expectedEndTime.Format("2006-01-02 15:04:05"))
				return // Don't start tomorrow's slot automatically
			} else {
				// Manual mode: use tomorrow
				log.Printf("ℹ️  Today's webinar has ended (ended at %s). Will start tomorrow at %02d:%02d",
					expectedEndTime.Format("2006-01-02 15:04:05"),
					startHour, startMinute)
				expectedStartTime = expectedStartTime.AddDate(0, 0, 1)
				// Recalculate endTime for tomorrow, considering if it spans midnight
				expectedEndTime = time.Date(expectedStartTime.Year(), expectedStartTime.Month(), expectedStartTime.Day(), endHour, 0, 0, 0, loc)
				if endHour < startHour || (endHour == startHour && startMinute > 0) {
					expectedEndTime = expectedEndTime.AddDate(0, 0, 1)
				}
				timeUntilStart = expectedStartTime.Sub(now)
				isWithinWebinarWindow = false // Not within today's window anymore
			}
		}
	}

	// CRITICAL: Check if stream is already running
	// If stream is running, check if the schedule has changed
	// If schedule changed, stop current stream and start with new schedule
	if streaming.IsStreamRunning() {
		currentStreamEndTime := streaming.GetStreamEndTime()
		currentStreamStartTime := streaming.GetStreamStartTime()

		// CRITICAL: For appointment mode, check if startTime has changed (new slot started)
		// If startTime changed, we MUST stop current stream and start from beginning (0:00)
		// This ensures each appointment slot starts fresh from the beginning
		if schedulingMode == "appointment" && !currentStreamStartTime.IsZero() {
			// Compare start times - if they differ, it's a new slot
			startTimeDiff := expectedStartTime.Sub(currentStreamStartTime)
			absStartDiff := startTimeDiff
			if absStartDiff < 0 {
				absStartDiff = -absStartDiff
			}

			// If startTime changed by more than 1 minute, it's a new slot - restart from beginning
			if absStartDiff > 1*time.Minute {
				log.Printf("🔄 NEW APPOINTMENT SLOT DETECTED! Current stream started at %s, new slot starts at %s (diff: %v).",
					currentStreamStartTime.Format("2006-01-02 15:04:05"),
					expectedStartTime.Format("2006-01-02 15:04:05"),
					startTimeDiff)
				log.Printf("🔄 Stopping previous stream and starting NEW stream from BEGINNING (0:00) for new slot.")
				streaming.StopStream("rtmp://localhost:1935/live/stream")
				time.Sleep(1 * time.Second)
				// Continue to start new stream below
			} else if !currentStreamEndTime.IsZero() {
				// Start times match (same slot) - check end time
				timeDiff := currentStreamEndTime.Sub(expectedEndTime)
				absDiff := timeDiff
				if absDiff < 0 {
					absDiff = -absDiff
				}

				// End times match (within tolerance) - stream is running with correct schedule
				if absDiff <= 10*time.Minute {
					if now.Before(currentStreamEndTime) {
						log.Printf("✅ Stream is already running with correct schedule (same slot, ends at %s). Skipping restart.",
							currentStreamEndTime.Format("2006-01-02 15:04:05"))
						return
					} else {
						// Stream is running but past its end time - let duration monitor handle it
						log.Printf("⚠️  Stream is running but past its end time (%s). Will let duration monitor stop it naturally.",
							currentStreamEndTime.Format("2006-01-02 15:04:05"))
						return
					}
				} else {
					// End time changed significantly - restart
					log.Printf("🔄 Schedule end time changed! Current stream ends at %s, new schedule ends at %s (diff: %v). Restarting.",
						currentStreamEndTime.Format("2006-01-02 15:04:05"),
						expectedEndTime.Format("2006-01-02 15:04:05"),
						absDiff)
					streaming.StopStream("rtmp://localhost:1935/live/stream")
					time.Sleep(1 * time.Second)
					// Continue to start new stream below
				}
			}
		} else if !currentStreamEndTime.IsZero() {
			// Manual mode or appointment mode without startTime - compare end times
			timeDiff := currentStreamEndTime.Sub(expectedEndTime)
			absDiff := timeDiff
			if absDiff < 0 {
				absDiff = -absDiff
			}

			if absDiff <= 10*time.Minute {
				// End times match (within tolerance) - stream is running with correct schedule
				if now.Before(currentStreamEndTime) {
					log.Printf("✅ Stream is already running with correct schedule (ends at %s, expected %s, diff: %v). Skipping restart to avoid interrupting playback.",
						currentStreamEndTime.Format("2006-01-02 15:04:05"),
						expectedEndTime.Format("2006-01-02 15:04:05"),
						timeDiff)
					return
				} else {
					// Stream is running but past its end time - let duration monitor handle it
					log.Printf("⚠️  Stream is running but past its end time (%s). Will let duration monitor stop it naturally.",
						currentStreamEndTime.Format("2006-01-02 15:04:05"))
					return
				}
			} else {
				// Schedule has changed significantly (more than 10 minutes difference)!
				log.Printf("🔄 Schedule difference detected! Current stream ends at %s, new schedule ends at %s (diff: %v).",
					currentStreamEndTime.Format("2006-01-02 15:04:05"),
					expectedEndTime.Format("2006-01-02 15:04:05"),
					absDiff)

				// Only restart if we're significantly past current end time (more than 5 minutes)
				if now.After(currentStreamEndTime.Add(5 * time.Minute)) {
					log.Printf("🔄 Current stream ended. Stopping to apply new schedule.")
					streaming.StopStream("rtmp://localhost:1935/live/stream")
					time.Sleep(1 * time.Second)
					// Continue to start new stream below
				} else {
					// Stream is still valid or just ended - don't restart to avoid disruption
					log.Printf("✅ Stream is still valid or just ended. Skipping restart to avoid interrupting playback.")
					return
				}
			}
		} else {
			// Stream is running but end time is not set - check if we're within webinar window
			if isWithinWebinarWindow {
				// CRITICAL: For appointment mode, if we're within window but startTime changed, restart from beginning
				if schedulingMode == "appointment" && !currentStreamStartTime.IsZero() {
					startTimeDiff := expectedStartTime.Sub(currentStreamStartTime)
					absStartDiff := startTimeDiff
					if absStartDiff < 0 {
						absStartDiff = -absStartDiff
					}
					if absStartDiff > 1*time.Minute {
						log.Printf("🔄 NEW APPOINTMENT SLOT DETECTED (no endTime set)! Restarting from BEGINNING (0:00).")
						streaming.StopStream("rtmp://localhost:1935/live/stream")
						time.Sleep(1 * time.Second)
						// Continue to start new stream below
					} else {
						log.Printf("⚠️  Stream is running but end time is not set. Since we're within webinar window, keeping stream running.")
						return
					}
				} else {
					log.Printf("⚠️  Stream is running but end time is not set. Since we're within webinar window, keeping stream running.")
					return
				}
			} else {
				log.Printf("⚠️  Stream is running but end time is not set and we're outside webinar window. Stopping to apply new schedule.")
				streaming.StopStream("rtmp://localhost:1935/live/stream")
				time.Sleep(1 * time.Second)
			}
		}
	}

	// CRITICAL: If we're within the webinar window, ALWAYS start streaming (no matter how much time has passed)
	if isWithinWebinarWindow {
		log.Printf("📹 Starting stream - we're within webinar window (started %v ago, ends in %v)",
			timeSinceStart, expectedEndTime.Sub(now))
		// Continue to start streaming below - don't return here
	} else {
		// We're NOT within the webinar window - check if we should start or skip

		// Check if we're at or past the start time (allow 5 minutes tolerance for early start)
		if timeUntilStart > 5*time.Minute {
			log.Printf("⏳ Too early to start stream (starts in %v, current: %s, target: %s), skipping",
				timeUntilStart, now.Format("2006-01-02 15:04:05"), expectedStartTime.Format("2006-01-02 15:04:05"))
			return
		}

		// If we're more than 30 minutes past start time and not within window, don't start
		// This handles cases where server restarts very late (after webinar ended)
		if timeSinceStart > 30*time.Minute && now.After(expectedEndTime) {
			log.Printf("⏳ Too late to start stream (started %v ago, webinar ended at %s, current: %s), skipping",
				timeSinceStart, expectedEndTime.Format("2006-01-02 15:04:05"), now.Format("2006-01-02 15:04:05"))
			return
		}
	}

	log.Printf("📹 Starting stream for webinar starting at %s (current time: %s, mode: %s, time: %02d:%02d)",
		expectedStartTime.Format("2006-01-02 15:04:05"),
		now.Format("2006-01-02 15:04:05"),
		schedulingMode, startHour, startMinute)

	// Start streaming
	streaming.StartFilePublisher(
		"./videos/video1.mp4",
		"rtmp://localhost:1935/live/stream",
		expectedEndTime,
		expectedStartTime,
	)

	log.Printf("✅ Stream started for today's webinar")
}

// sendReminders is a helper function to send both voice call (Avanak) and SMS (Melipayamak) reminders.
// Now uses database messages instead of config
func sendReminders(user models.User, avanakService *services.AvanakService, melipayamakService *services.MelipayamakService, bodyId int, db *gorm.DB) {
	// Normalize phone number before sending (convert Persian to English if needed)
	normalizedPhone := utils.NormalizePhoneNumber(user.Phone)

	// DISABLED: Avanak service has been completely removed
	// Voice call functionality removed - only SMS reminders are sent now

	// Skip sending if body_id is 395350 (disabled)
	if bodyId == 395350 {
		log.Printf("⏭️  Skipping SMS with disabled pattern code 395350 for %s (User ID: %d)", normalizedPhone, user.ID)
		return
	}

	// Send SMS reminder (with normalized phone in English digits)
	if err := melipayamakService.SendPatternSMS(normalizedPhone, bodyId, user.FirstName); err != nil {
		log.Printf("❌ Failed to send SMS reminder to %s (User ID: %d, body_id: %d): %v", normalizedPhone, user.ID, bodyId, err)
	} else {
		log.Printf("✅ SMS reminder sent to %s (User ID: %d, body_id: %d)", normalizedPhone, user.ID, bodyId)
	}
}

// getDateRangeFromRegistrationRange returns start and end dates based on registration time range filter
func getDateRangeFromRegistrationRange(rangeType string, loc *time.Location) (startDate time.Time, endDate time.Time) {
	now := time.Now().In(loc)

	switch rangeType {
	case "today":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
		endDate = now
	case "yesterday":
		yesterday := now.AddDate(0, 0, -1)
		startDate = time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, loc)
		endDate = time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 23, 59, 59, 999999999, loc)
	case "week":
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7
		}
		startDate = now.AddDate(0, 0, -weekday+1)
		startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, loc)
		endDate = now
	case "last_week":
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7
		}
		lastWeekMonday := now.AddDate(0, 0, -weekday-6)
		startDate = time.Date(lastWeekMonday.Year(), lastWeekMonday.Month(), lastWeekMonday.Day(), 0, 0, 0, 0, loc)
		lastWeekSunday := now.AddDate(0, 0, -weekday)
		endDate = time.Date(lastWeekSunday.Year(), lastWeekSunday.Month(), lastWeekSunday.Day(), 23, 59, 59, 999999999, loc)
	case "month":
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
		endDate = now
	case "last_month":
		firstOfThisMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
		lastMonthEnd := firstOfThisMonth.AddDate(0, 0, -1)
		startDate = time.Date(lastMonthEnd.Year(), lastMonthEnd.Month(), 1, 0, 0, 0, 0, loc)
		endDate = time.Date(lastMonthEnd.Year(), lastMonthEnd.Month(), lastMonthEnd.Day(), 23, 59, 59, 999999999, loc)
	default:
		// "all" - no date filter
		startDate = time.Time{}
		endDate = time.Time{}
	}

	return startDate, endDate
}

// processAutomaticSMSMessages processes and sends automatic SMS messages based on send_hour and send_minute
// Also sends Avanak voice calls if an active Avanak message exists
func processAutomaticSMSMessages(db *gorm.DB, melipayamakService *services.MelipayamakService, avanakService *services.AvanakService, loc *time.Location) {
	now := time.Now().In(loc)

	// Find all active automatic SMS messages (EXCLUDE auto_cycle_enabled messages - they're handled separately)
	var messages []models.SMSMessage
	if err := db.Where("is_active = ? AND send_type = ? AND send_hour IS NOT NULL AND send_minute IS NOT NULL AND auto_cycle_enabled = ?", true, "automatic", false).Find(&messages).Error; err != nil {
		log.Printf("❌ Failed to fetch automatic SMS messages: %v", err)
		return
	}

	for _, message := range messages {
		// Check if current time matches send time (allow 1 minute window)
		currentHour := now.Hour()
		currentMinute := now.Minute()

		if currentHour == *message.SendHour && currentMinute == *message.SendMinute {
			// CRITICAL: Use atomic update to prevent duplicate sends
			// Check if we already sent today by trying to update LastSentAt atomically
			// Only update if LastSentAt is NULL or from a different day
			todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
			result := db.Model(&models.SMSMessage{}).
				Where("id = ? AND (last_sent_at IS NULL OR last_sent_at < ?)", message.ID, todayStart).
				Update("last_sent_at", now)

			if result.Error != nil {
				log.Printf("❌ Error checking automatic SMS message '%s': %v", message.Name, result.Error)
				continue
			}

			if result.RowsAffected == 0 {
				// Message was already sent today
				log.Printf("⏭️  Skipping automatic SMS message '%s' - already sent today (atomic check)", message.Name)
				continue
			}

			log.Printf("📤 Processing automatic SMS message: '%s' (Pattern: %d, Time: %02d:%02d)",
				message.Name, message.PatternCode, *message.SendHour, *message.SendMinute)

			// Get users based on registration time range
			startDate, endDate := getDateRangeFromRegistrationRange(message.RegistrationTimeRange, loc)
			query := db.Model(&models.User{})
			if !startDate.IsZero() && !endDate.IsZero() {
				query = query.Where("registered_at >= ? AND registered_at <= ?", startDate, endDate)
			}

			// Apply registration hour range filter if specified
			if message.RegistrationStartHour != nil && message.RegistrationEndHour != nil {
				startHour := *message.RegistrationStartHour
				endHour := *message.RegistrationEndHour

				if startHour <= endHour {
					// Normal case: startHour <= endHour (e.g., 17-23)
					query = query.Where("HOUR(registered_at) >= ? AND HOUR(registered_at) <= ?", startHour, endHour)
					log.Printf("🕐 Filtering by registration hour range: %02d:00 - %02d:00", startHour, endHour)
				} else {
					// Cross-midnight case: startHour > endHour (e.g., 23-05)
					query = query.Where("HOUR(registered_at) >= ? OR HOUR(registered_at) <= ?", startHour, endHour)
					log.Printf("🕐 Filtering by registration hour range (cross-midnight): %02d:00 - %02d:00 (next day)", startHour, endHour)
				}
			}

			var users []models.User
			query.Find(&users)

			log.Printf("📋 Found %d users for automatic SMS message '%s' (range: %s)", len(users), message.Name, message.RegistrationTimeRange)

			sentCount := 0
			failedCount := 0

			// PERFORMANCE OPTIMIZATION: Collect log entries in a slice for batch insert
			logEntries := make([]models.SMSMessageLog, 0, len(users))
			const batchSize = 100 // Insert in batches of 100 to avoid memory issues

			for _, user := range users {
				normalizedPhone := utils.NormalizePhoneNumber(user.Phone)

				// Skip sending if pattern code is 395350 (disabled)
				if message.PatternCode == 395350 {
					log.Printf("⏭️  Skipping SMS with disabled pattern code 395350 for %s", normalizedPhone)
					continue
				}

				// Send SMS
				err := melipayamakService.SendPatternSMS(normalizedPhone, message.PatternCode, user.FirstName)

				// Prepare log entry
				logEntry := models.SMSMessageLog{
					SMSMessageID: message.ID,
					Recipient:    normalizedPhone,
					Status:       "sent",
					SentAt:       now,
					CreatedAt:    now,
				}

				if err != nil {
					logEntry.Status = "failed"
					logEntry.ErrorMessage = err.Error()
					failedCount++
					log.Printf("❌ Failed to send automatic SMS to %s: %v", normalizedPhone, err)
				} else {
					sentCount++
					log.Printf("✅ Automatic SMS sent to %s (Pattern: %d)", normalizedPhone, message.PatternCode)
				}

				logEntries = append(logEntries, logEntry)

				// PERFORMANCE OPTIMIZATION: Batch insert when batch size is reached
				if len(logEntries) >= batchSize {
					if err := db.CreateInBatches(logEntries, batchSize).Error; err != nil {
						log.Printf("❌ Failed to batch insert SMS logs: %v", err)
					}
					logEntries = logEntries[:0] // Clear slice but keep capacity
				}

				// DISABLED: Avanak service has been completely removed
				// Voice call functionality removed - only SMS is sent

				// Small delay to avoid rate limiting
				time.Sleep(100 * time.Millisecond)
			}

			// Insert remaining log entries
			if len(logEntries) > 0 {
				if err := db.CreateInBatches(logEntries, batchSize).Error; err != nil {
					log.Printf("❌ Failed to batch insert remaining SMS logs: %v", err)
				}
			}

			// LastSentAt was already updated atomically above - no need to update again
			log.Printf("✅ Automatic SMS message '%s' completed: %d sent, %d failed", message.Name, sentCount, failedCount)
		}
	}
}

// processScheduledSMSMessages processes and sends scheduled SMS messages
// Also sends Avanak voice calls if an active Avanak message exists
func processScheduledSMSMessages(db *gorm.DB, melipayamakService *services.MelipayamakService, avanakService *services.AvanakService, loc *time.Location) {
	now := time.Now().In(loc)

	// Find all active scheduled SMS messages that haven't been sent yet
	var messages []models.SMSMessage
	if err := db.Where("is_active = ? AND send_type = ? AND scheduled_at IS NOT NULL", true, "scheduled").Find(&messages).Error; err != nil {
		log.Printf("❌ Failed to fetch scheduled SMS messages: %v", err)
		return
	}

	for _, message := range messages {
		if message.ScheduledAt == nil {
			continue
		}

		scheduledTime := message.ScheduledAt.In(loc)

		// Check if scheduled time has arrived (within 1 minute window)
		timeDiff := now.Sub(scheduledTime)
		if timeDiff >= 0 && timeDiff < 1*time.Minute {
			// CRITICAL: Use atomic update to prevent duplicate sends
			// Try to update LastSentAt from NULL to now - if it fails, message was already sent
			result := db.Model(&models.SMSMessage{}).
				Where("id = ? AND last_sent_at IS NULL", message.ID).
				Update("last_sent_at", now)

			if result.Error != nil {
				log.Printf("❌ Error checking scheduled SMS message '%s': %v", message.Name, result.Error)
				continue
			}

			if result.RowsAffected == 0 {
				// Message was already sent (LastSentAt was not NULL)
				log.Printf("⏭️  Skipping scheduled SMS message '%s' - already sent (atomic check)", message.Name)
				continue
			}

			log.Printf("📤 Processing scheduled SMS message: '%s' (Pattern: %d, Scheduled: %s)",
				message.Name, message.PatternCode, scheduledTime.Format("2006-01-02 15:04:05"))

			// Get users based on registration time range
			startDate, endDate := getDateRangeFromRegistrationRange(message.RegistrationTimeRange, loc)
			query := db.Model(&models.User{})
			if !startDate.IsZero() && !endDate.IsZero() {
				query = query.Where("registered_at >= ? AND registered_at <= ?", startDate, endDate)
			}

			// Apply registration hour range filter if specified
			if message.RegistrationStartHour != nil && message.RegistrationEndHour != nil {
				startHour := *message.RegistrationStartHour
				endHour := *message.RegistrationEndHour

				if startHour <= endHour {
					// Normal case: startHour <= endHour (e.g., 17-23)
					query = query.Where("HOUR(registered_at) >= ? AND HOUR(registered_at) <= ?", startHour, endHour)
					log.Printf("🕐 Filtering by registration hour range: %02d:00 - %02d:00", startHour, endHour)
				} else {
					// Cross-midnight case: startHour > endHour (e.g., 23-05)
					query = query.Where("HOUR(registered_at) >= ? OR HOUR(registered_at) <= ?", startHour, endHour)
					log.Printf("🕐 Filtering by registration hour range (cross-midnight): %02d:00 - %02d:00 (next day)", startHour, endHour)
				}
			}

			var users []models.User
			query.Find(&users)

			log.Printf("📋 Found %d users for scheduled SMS message '%s' (range: %s)", len(users), message.Name, message.RegistrationTimeRange)

			sentCount := 0
			failedCount := 0

			// PERFORMANCE OPTIMIZATION: Collect log entries in a slice for batch insert
			logEntries := make([]models.SMSMessageLog, 0, len(users))
			const batchSize = 100 // Insert in batches of 100 to avoid memory issues

			for _, user := range users {
				normalizedPhone := utils.NormalizePhoneNumber(user.Phone)

				// Skip sending if pattern code is 395350 (disabled)
				if message.PatternCode == 395350 {
					log.Printf("⏭️  Skipping SMS with disabled pattern code 395350 for %s", normalizedPhone)
					continue
				}

				// Send SMS
				err := melipayamakService.SendPatternSMS(normalizedPhone, message.PatternCode, user.FirstName)

				// Prepare log entry
				logEntry := models.SMSMessageLog{
					SMSMessageID: message.ID,
					Recipient:    normalizedPhone,
					Status:       "sent",
					SentAt:       now,
					CreatedAt:    now,
				}

				if err != nil {
					logEntry.Status = "failed"
					logEntry.ErrorMessage = err.Error()
					failedCount++
					log.Printf("❌ Failed to send scheduled SMS to %s: %v", normalizedPhone, err)
				} else {
					sentCount++
					log.Printf("✅ Scheduled SMS sent to %s (Pattern: %d)", normalizedPhone, message.PatternCode)
				}

				logEntries = append(logEntries, logEntry)

				// PERFORMANCE OPTIMIZATION: Batch insert when batch size is reached
				if len(logEntries) >= batchSize {
					if err := db.CreateInBatches(logEntries, batchSize).Error; err != nil {
						log.Printf("❌ Failed to batch insert SMS logs: %v", err)
					}
					logEntries = logEntries[:0] // Clear slice but keep capacity
				}

				// DISABLED: Avanak service has been completely removed
				// Voice call functionality removed - only SMS is sent

				// Small delay to avoid rate limiting
				time.Sleep(100 * time.Millisecond)
			}

			// Insert remaining log entries
			if len(logEntries) > 0 {
				if err := db.CreateInBatches(logEntries, batchSize).Error; err != nil {
					log.Printf("❌ Failed to batch insert remaining SMS logs: %v", err)
				}
			}

			// LastSentAt was already updated atomically above - no need to update again
			log.Printf("✅ Scheduled SMS message '%s' completed: %d sent, %d failed", message.Name, sentCount, failedCount)
		}
	}
}

// processAutomaticAvanakMessages processes and sends automatic Avanak voice calls based on send_hour and send_minute
func processAutomaticAvanakMessages(db *gorm.DB, avanakService *services.AvanakService, loc *time.Location) {
	now := time.Now().In(loc)

	// Find all active automatic Avanak messages (EXCLUDE auto_cycle_enabled messages - they're handled separately)
	var messages []models.AvanakMessage
	if err := db.Where("is_active = ? AND send_type = ? AND send_hour IS NOT NULL AND send_minute IS NOT NULL AND auto_cycle_enabled = ?", true, "automatic", false).Find(&messages).Error; err != nil {
		log.Printf("❌ Failed to fetch automatic Avanak messages: %v", err)
		return
	}

	for _, message := range messages {
		// Check if current time matches send time
		currentHour := now.Hour()
		currentMinute := now.Minute()

		if currentHour == *message.SendHour && currentMinute == *message.SendMinute {
			// CRITICAL: Use atomic update to prevent duplicate sends
			// Check if we already sent today by trying to update LastSentAt atomically
			// Only update if LastSentAt is NULL or from a different day
			todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
			result := db.Model(&models.AvanakMessage{}).
				Where("id = ? AND (last_sent_at IS NULL OR last_sent_at < ?)", message.ID, todayStart).
				Update("last_sent_at", now)

			if result.Error != nil {
				log.Printf("❌ Error checking automatic Avanak message '%s': %v", message.Name, result.Error)
				continue
			}

			if result.RowsAffected == 0 {
				// Message was already sent today
				log.Printf("⏭️  Skipping automatic Avanak message '%s' - already sent today (atomic check)", message.Name)
				continue
			}

			log.Printf("📞 Processing automatic Avanak message: '%s' (Message ID: %d, Time: %02d:%02d)",
				message.Name, message.MessageID, *message.SendHour, *message.SendMinute)

			// Get users based on registration time range
			startDate, endDate := getDateRangeFromRegistrationRange(message.RegistrationTimeRange, loc)
			query := db.Model(&models.User{})
			if !startDate.IsZero() && !endDate.IsZero() {
				query = query.Where("registered_at >= ? AND registered_at <= ?", startDate, endDate)
			}

			// Apply registration hour range filter if specified
			if message.RegistrationStartHour != nil && message.RegistrationEndHour != nil {
				startHour := *message.RegistrationStartHour
				endHour := *message.RegistrationEndHour

				if startHour <= endHour {
					// Normal case: startHour <= endHour (e.g., 17-23)
					query = query.Where("HOUR(registered_at) >= ? AND HOUR(registered_at) <= ?", startHour, endHour)
					log.Printf("🕐 Filtering by registration hour range: %02d:00 - %02d:00", startHour, endHour)
				} else {
					// Cross-midnight case: startHour > endHour (e.g., 23-05)
					query = query.Where("HOUR(registered_at) >= ? OR HOUR(registered_at) <= ?", startHour, endHour)
					log.Printf("🕐 Filtering by registration hour range (cross-midnight): %02d:00 - %02d:00 (next day)", startHour, endHour)
				}
			}

			var users []models.User
			query.Find(&users)

			log.Printf("📋 Found %d users for automatic Avanak message '%s' (range: %s)", len(users), message.Name, message.RegistrationTimeRange)

			sentCount := 0
			failedCount := 0

			// PERFORMANCE OPTIMIZATION: Collect log entries in a slice for batch insert
			logEntries := make([]models.AvanakMessageLog, 0, len(users))
			const batchSize = 100 // Insert in batches of 100 to avoid memory issues

			for _, user := range users {
				normalizedPhone := utils.NormalizePhoneNumber(user.Phone)
				err := avanakService.SendVoiceCall(normalizedPhone, message.MessageID)

				// Prepare log entry
				logEntry := models.AvanakMessageLog{
					AvanakMessageID: message.ID,
					Recipient:       normalizedPhone,
					Status:          "sent",
					SentAt:          now,
					CreatedAt:       now,
				}

				if err != nil {
					logEntry.Status = "failed"
					logEntry.ErrorMessage = err.Error()
					failedCount++
					log.Printf("❌ Failed to send automatic Avanak voice call to %s: %v", normalizedPhone, err)
				} else {
					sentCount++
					log.Printf("✅ Automatic Avanak voice call sent to %s (Message ID: %d)", normalizedPhone, message.MessageID)
				}

				logEntries = append(logEntries, logEntry)

				// PERFORMANCE OPTIMIZATION: Batch insert when batch size is reached
				if len(logEntries) >= batchSize {
					if err := db.CreateInBatches(logEntries, batchSize).Error; err != nil {
						log.Printf("❌ Failed to batch insert Avanak logs: %v", err)
					}
					logEntries = logEntries[:0] // Clear slice but keep capacity
				}

				// Small delay to avoid rate limiting
				time.Sleep(100 * time.Millisecond)
			}

			// Insert remaining log entries
			if len(logEntries) > 0 {
				if err := db.CreateInBatches(logEntries, batchSize).Error; err != nil {
					log.Printf("❌ Failed to batch insert remaining Avanak logs: %v", err)
				}
			}

			// LastSentAt was already updated atomically above - no need to update again
			log.Printf("✅ Automatic Avanak message '%s' completed: %d sent, %d failed", message.Name, sentCount, failedCount)
		}
	}
}

// processScheduledAvanakMessages processes and sends scheduled Avanak voice calls
func processScheduledAvanakMessages(db *gorm.DB, avanakService *services.AvanakService, loc *time.Location) {
	now := time.Now().In(loc)

	// Find all active scheduled Avanak messages that haven't been sent yet
	var messages []models.AvanakMessage
	if err := db.Where("is_active = ? AND send_type = ? AND scheduled_at IS NOT NULL", true, "scheduled").Find(&messages).Error; err != nil {
		log.Printf("❌ Failed to fetch scheduled Avanak messages: %v", err)
		return
	}

	for _, message := range messages {
		if message.ScheduledAt == nil {
			continue
		}

		scheduledTime := message.ScheduledAt.In(loc)

		// Check if scheduled time has arrived (within 1 minute window)
		timeDiff := now.Sub(scheduledTime)
		if timeDiff >= 0 && timeDiff < 1*time.Minute {
			// CRITICAL: Use atomic update to prevent duplicate sends
			// Try to update LastSentAt from NULL to now - if it fails, message was already sent
			result := db.Model(&models.AvanakMessage{}).
				Where("id = ? AND last_sent_at IS NULL", message.ID).
				Update("last_sent_at", now)

			if result.Error != nil {
				log.Printf("❌ Error checking scheduled Avanak message '%s': %v", message.Name, result.Error)
				continue
			}

			if result.RowsAffected == 0 {
				// Message was already sent (LastSentAt was not NULL)
				log.Printf("⏭️  Skipping scheduled Avanak message '%s' - already sent (atomic check)", message.Name)
				continue
			}

			log.Printf("📞 Processing scheduled Avanak message: '%s' (Message ID: %d, Scheduled: %s)",
				message.Name, message.MessageID, scheduledTime.Format("2006-01-02 15:04:05"))

			// Get users based on registration time range
			startDate, endDate := getDateRangeFromRegistrationRange(message.RegistrationTimeRange, loc)
			query := db.Model(&models.User{})
			if !startDate.IsZero() && !endDate.IsZero() {
				query = query.Where("registered_at >= ? AND registered_at <= ?", startDate, endDate)
			}

			// Apply registration hour range filter if specified
			if message.RegistrationStartHour != nil && message.RegistrationEndHour != nil {
				startHour := *message.RegistrationStartHour
				endHour := *message.RegistrationEndHour

				if startHour <= endHour {
					// Normal case: startHour <= endHour (e.g., 17-23)
					query = query.Where("HOUR(registered_at) >= ? AND HOUR(registered_at) <= ?", startHour, endHour)
					log.Printf("🕐 Filtering by registration hour range: %02d:00 - %02d:00", startHour, endHour)
				} else {
					// Cross-midnight case: startHour > endHour (e.g., 23-05)
					query = query.Where("HOUR(registered_at) >= ? OR HOUR(registered_at) <= ?", startHour, endHour)
					log.Printf("🕐 Filtering by registration hour range (cross-midnight): %02d:00 - %02d:00 (next day)", startHour, endHour)
				}
			}

			var users []models.User
			query.Find(&users)

			log.Printf("📋 Found %d users for scheduled Avanak message '%s' (range: %s)", len(users), message.Name, message.RegistrationTimeRange)

			sentCount := 0
			failedCount := 0

			for _, user := range users {
				normalizedPhone := utils.NormalizePhoneNumber(user.Phone)
				err := avanakService.SendVoiceCall(normalizedPhone, message.MessageID)

				// Log the send attempt
				logEntry := models.AvanakMessageLog{
					AvanakMessageID: message.ID,
					Recipient:       normalizedPhone,
					Status:          "sent",
					SentAt:          now,
					CreatedAt:       now,
				}

				if err != nil {
					logEntry.Status = "failed"
					logEntry.ErrorMessage = err.Error()
					failedCount++
					log.Printf("❌ Failed to send scheduled Avanak voice call to %s: %v", normalizedPhone, err)
				} else {
					sentCount++
					log.Printf("✅ Scheduled Avanak voice call sent to %s (Message ID: %d)", normalizedPhone, message.MessageID)
				}

				db.Create(&logEntry)

				// Small delay to avoid rate limiting
				time.Sleep(100 * time.Millisecond)
			}

			// LastSentAt was already updated atomically above - no need to update again
			log.Printf("✅ Scheduled Avanak message '%s' completed: %d sent, %d failed", message.Name, sentCount, failedCount)
		}
	}
}

// processAutoCycleSMSMessages processes and sends SMS messages with auto cycle enabled
// Auto cycle logic: Send to users who registered from 17:00 (5 PM) to 17:00 next day (24-hour cycle)
// Each cycle group receives messages only once
// Special logic for 14:00 message: Users who registered after 14:00 should receive message in next day's cycle
func processAutoCycleSMSMessages(db *gorm.DB, melipayamakService *services.MelipayamakService, loc *time.Location) {
	now := time.Now().In(loc)

	// Find all active SMS messages with auto cycle enabled
	var messages []models.SMSMessage
	if err := db.Where("is_active = ? AND auto_cycle_enabled = ? AND send_hour IS NOT NULL AND send_minute IS NOT NULL", true, true).Find(&messages).Error; err != nil {
		log.Printf("❌ Failed to fetch auto cycle SMS messages: %v", err)
		return
	}

	for _, message := range messages {
		// Check if current time matches send time (allow 1 minute window)
		currentHour := now.Hour()
		currentMinute := now.Minute()

		if currentHour == *message.SendHour && currentMinute == *message.SendMinute {
			// CRITICAL: First check if we already sent today using LastSentAt (prevents duplicate sends on same day)
			// This ensures each message (14:00, 18:30, etc.) is sent only ONCE per day
			todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
			result := db.Model(&models.SMSMessage{}).
				Where("id = ? AND (last_sent_at IS NULL OR last_sent_at < ?)", message.ID, todayStart).
				Update("last_sent_at", now)

			if result.Error != nil {
				log.Printf("❌ Error checking auto cycle SMS message '%s': %v", message.Name, result.Error)
				continue
			}

			if result.RowsAffected == 0 {
				// Message was already sent today - skip to prevent duplicate
				log.Printf("⏭️  Skipping auto cycle SMS message '%s' - already sent today (LastSentAt check)", message.Name)
				continue
			}

			log.Printf("🔄 Processing auto cycle SMS message: '%s' (Pattern: %d, Time: %02d:%02d)",
				message.Name, message.PatternCode, *message.SendHour, *message.SendMinute)

			// Special logic for different message types
			is14HourMessage := *message.SendHour == 14 && *message.SendMinute == 0
			is1830Message := *message.SendHour == 18 && *message.SendMinute == 30 // 30 minutes before workshop (19:00)

			var cycleStart time.Time
			var cycleEnd time.Time
			var cycleTrackingStart time.Time // For cycle log tracking
			var cycleTrackingEnd time.Time

			if is14HourMessage {
				// For 14:00 message: Only users who registered from 17:00 yesterday to 14:00 today
				// Users who registered from 14:00 to 17:00 today will receive message at 17:30 (not at 14:00)
				// Users who registered after 17:00 today will be in next cycle
				yesterday17 := time.Date(now.Year(), now.Month(), now.Day(), 17, 0, 0, 0, loc).AddDate(0, 0, -1)
				today14 := time.Date(now.Year(), now.Month(), now.Day(), 14, 0, 0, 0, loc)
				cycleStart = yesterday17
				cycleEnd = today14
				cycleTrackingStart = cycleStart
				cycleTrackingEnd = cycleEnd
				log.Printf("🕐 14:00 message: Only users from 17:00 yesterday to 14:00 today (users 14:00-17:00 get 17:30 message)")
			} else if is1830Message {
				// For 18:30 message: Send to users in today's 24-hour cycle (17:00 today to 17:00 tomorrow)
				// But track by date (today) so it sends once per day at 18:30
				// The message is sent at 18:30 for all users who registered from 17:00 today to 17:00 tomorrow
				today17 := time.Date(now.Year(), now.Month(), now.Day(), 17, 0, 0, 0, loc)
				tomorrow17 := today17.AddDate(0, 0, 1)
				cycleStart = today17
				cycleEnd = tomorrow17
				// Track by date (start of today) to ensure one send per day
				cycleTrackingStart = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
				cycleTrackingEnd = cycleTrackingStart.AddDate(0, 0, 1)
				log.Printf("🕐 18:30 message: Sending to users in cycle %s to %s, tracking by date %s",
					cycleStart.Format("2006-01-02 15:04:05"), cycleEnd.Format("2006-01-02 15:04:05"),
					cycleTrackingStart.Format("2006-01-02"))
			} else {
				// For other messages: Calculate current 24-hour cycle (17:00 to 17:00 next day)
				// If current time is before 17:00, use yesterday's cycle
				// If current time is after 17:00, use today's cycle
				if now.Hour() < 17 {
					// Current time is before 17:00, so we're in yesterday's cycle (yesterday 17:00 to today 17:00)
					yesterday := now.AddDate(0, 0, -1)
					cycleStart = time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 17, 0, 0, 0, loc)
					cycleEnd = time.Date(now.Year(), now.Month(), now.Day(), 17, 0, 0, 0, loc)
				} else {
					// Current time is after 17:00, so we're in today's cycle (today 17:00 to tomorrow 17:00)
					cycleStart = time.Date(now.Year(), now.Month(), now.Day(), 17, 0, 0, 0, loc)
					cycleEnd = time.Date(now.Year(), now.Month(), now.Day(), 17, 0, 0, 0, loc).AddDate(0, 0, 1)
				}
				cycleTrackingStart = cycleStart
				cycleTrackingEnd = cycleEnd
			}

			cycleType := "17:00-17:00"
			if is14HourMessage {
				cycleType = "17:00 دیروز - 14:00 امروز"
			} else if is1830Message {
				cycleType = "17:00-17:00 (18:30 send)"
			}
			log.Printf("📅 Auto cycle: Cycle start=%s, Cycle end=%s (%s cycle)",
				cycleStart.Format("2006-01-02 15:04:05"), cycleEnd.Format("2006-01-02 15:04:05"), cycleType)

			// CRITICAL: Use atomic operation to prevent duplicate sends
			// Try to create cycle log - if it already exists, skip (prevents race condition)
			checkCycleStart := cycleTrackingStart
			checkCycleEnd := cycleTrackingEnd

			// Try to create cycle log atomically (will fail if already exists due to unique constraint or manual check)
			var existingCycleLog models.SMSMessageCycleLog
			if err := db.Where("sms_message_id = ? AND cycle_start = ? AND cycle_end = ?", message.ID, checkCycleStart, checkCycleEnd).First(&existingCycleLog).Error; err == nil {
				log.Printf("⏭️  Skipping auto cycle SMS message '%s' - already sent to cycle group (%s to %s)",
					message.Name, checkCycleStart.Format("2006-01-02 15:04:05"), checkCycleEnd.Format("2006-01-02 15:04:05"))
				continue
			}

			// Create cycle log BEFORE sending to prevent duplicate sends (atomic operation)
			cycleLog := models.SMSMessageCycleLog{
				SMSMessageID: message.ID,
				CycleStart:   cycleTrackingStart,
				CycleEnd:     cycleTrackingEnd,
				SentAt:       now,
				SentCount:    0, // Will be updated after sending
				CreatedAt:    now,
			}
			if err := db.Create(&cycleLog).Error; err != nil {
				// Cycle log already exists (race condition) - skip
				log.Printf("⏭️  Skipping auto cycle SMS message '%s' - cycle log already exists (race condition prevented)", message.Name)
				continue
			}

			query := db.Model(&models.User{})

			if is14HourMessage {
				// Only users from 17:00 yesterday to 14:00 today
				query = query.Where("registered_at >= ? AND registered_at < ?", cycleStart, cycleEnd)
				log.Printf("🕐 14:00 message logic: Including users from %s to %s (17:00 yesterday to 14:00 today)",
					cycleStart.Format("2006-01-02 15:04:05"), cycleEnd.Format("2006-01-02 15:04:05"))
			} else if is1830Message {
				// For 18:30 message: Include users from 17:00 today to 17:00 tomorrow
				query = query.Where("registered_at >= ? AND registered_at < ?", cycleStart, cycleEnd)
				log.Printf("🕐 18:30 message logic: Including users from %s to %s (sent at 18:30 for today's cycle)",
					cycleStart.Format("2006-01-02 15:04:05"), cycleEnd.Format("2006-01-02 15:04:05"))
			} else {
				// For other messages: Simple 24-hour cycle from 17:00 to 17:00 next day
				query = query.Where("registered_at >= ? AND registered_at < ?", cycleStart, cycleEnd)
				log.Printf("🕐 Regular message logic: Including users from %s to %s (17:00 to 17:00 cycle)",
					cycleStart.Format("2006-01-02 15:04:05"), cycleEnd.Format("2006-01-02 15:04:05"))
			}

			var users []models.User
			query.Find(&users)

			log.Printf("📋 Found %d users for auto cycle SMS message '%s' (cycle: %s to %s)",
				len(users), message.Name, cycleStart.Format("2006-01-02 15:04:05"), cycleEnd.Format("2006-01-02 15:04:05"))

			if len(users) == 0 {
				// CRITICAL: Delete cycle log if no users found (to allow retry later)
				db.Delete(&cycleLog)
				log.Printf("ℹ️  No users found for auto cycle message '%s', deleted cycle log to allow retry", message.Name)
				continue
			}

			sentCount := 0
			failedCount := 0

			for _, user := range users {
				normalizedPhone := utils.NormalizePhoneNumber(user.Phone)

				// Skip sending if pattern code is 395350 (disabled)
				if message.PatternCode == 395350 {
					log.Printf("⏭️  Skipping SMS with disabled pattern code 395350 for %s", normalizedPhone)
					continue
				}

				// CRITICAL: Check if this user already received this message in any cycle
				// This prevents duplicate sends to the same user across different cycles
				var existingLog models.SMSMessageLog
				if err := db.Where("sms_message_id = ? AND recipient = ? AND status = ?", message.ID, normalizedPhone, "sent").
					Order("sent_at DESC").First(&existingLog).Error; err == nil {
					// User already received this message - skip to prevent duplicate
					log.Printf("⏭️  Skipping user %s for auto cycle message '%s' - already received this message at %s",
						normalizedPhone, message.Name, existingLog.SentAt.Format("2006-01-02 15:04:05"))
					continue
				}

				// Send SMS
				err := melipayamakService.SendPatternSMS(normalizedPhone, message.PatternCode, user.FirstName)

				// Log the send attempt
				logEntry := models.SMSMessageLog{
					SMSMessageID: message.ID,
					Recipient:    normalizedPhone,
					Status:       "sent",
					SentAt:       now,
					CreatedAt:    now,
				}

				if err != nil {
					logEntry.Status = "failed"
					logEntry.ErrorMessage = err.Error()
					failedCount++
					log.Printf("❌ Failed to send auto cycle SMS to %s: %v", normalizedPhone, err)
				} else {
					sentCount++
					log.Printf("✅ Auto cycle SMS sent to %s (Pattern: %d)", normalizedPhone, message.PatternCode)
				}

				db.Create(&logEntry)

				// Small delay to avoid rate limiting
				time.Sleep(100 * time.Millisecond)
			}

			// Update cycle log with sent count (cycle log was already created above)
			db.Model(&cycleLog).Update("sent_count", sentCount)

			// LastSentAt was already updated atomically above - no need to update again
			log.Printf("✅ Auto cycle SMS message '%s' completed: %d sent, %d failed (cycle: %s to %s)",
				message.Name, sentCount, failedCount,
				cycleStart.Format("2006-01-02 15:04:05"), cycleEnd.Format("2006-01-02 15:04:05"))
		}
	}
}

// processAutoCycleAvanakMessages processes and sends Avanak voice calls with auto cycle enabled
// Auto cycle logic: Send to users who registered from 17:00 (5 PM) to 17:00 next day (24-hour cycle)
// Each cycle group receives calls only once
// Special logic for 14:00 message: Only users from 17:00 yesterday to 14:00 today
func processAutoCycleAvanakMessages(db *gorm.DB, avanakService *services.AvanakService, loc *time.Location) {
	now := time.Now().In(loc)

	// Find all active Avanak messages with auto cycle enabled
	var messages []models.AvanakMessage
	if err := db.Where("is_active = ? AND auto_cycle_enabled = ? AND send_hour IS NOT NULL AND send_minute IS NOT NULL", true, true).Find(&messages).Error; err != nil {
		log.Printf("❌ Failed to fetch auto cycle Avanak messages: %v", err)
		return
	}

	for _, message := range messages {
		// Check if current time matches send time (allow 1 minute window)
		currentHour := now.Hour()
		currentMinute := now.Minute()

		if currentHour == *message.SendHour && currentMinute == *message.SendMinute {
			// CRITICAL: First check if we already sent today using LastSentAt (prevents duplicate sends on same day)
			// This ensures each message (14:00, 18:30, etc.) is sent only ONCE per day
			todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
			result := db.Model(&models.AvanakMessage{}).
				Where("id = ? AND (last_sent_at IS NULL OR last_sent_at < ?)", message.ID, todayStart).
				Update("last_sent_at", now)

			if result.Error != nil {
				log.Printf("❌ Error checking auto cycle Avanak message '%s': %v", message.Name, result.Error)
				continue
			}

			if result.RowsAffected == 0 {
				// Message was already sent today - skip to prevent duplicate
				log.Printf("⏭️  Skipping auto cycle Avanak message '%s' - already sent today (LastSentAt check)", message.Name)
				continue
			}

			log.Printf("🔄 Processing auto cycle Avanak message: '%s' (MessageID: %d, Time: %02d:%02d)",
				message.Name, message.MessageID, *message.SendHour, *message.SendMinute)

			// Special logic for different message types
			is14HourMessage := *message.SendHour == 14 && *message.SendMinute == 0
			is1830Message := *message.SendHour == 18 && *message.SendMinute == 30

			var cycleStart time.Time
			var cycleEnd time.Time
			var cycleTrackingStart time.Time // For cycle log tracking
			var cycleTrackingEnd time.Time

			if is14HourMessage {
				// For 14:00 message: Only users who registered from 17:00 yesterday to 14:00 today
				// Users who registered from 14:00 to 17:00 today will receive message at 17:30 (not at 14:00)
				// Users who registered after 17:00 today will be in next cycle
				yesterday17 := time.Date(now.Year(), now.Month(), now.Day(), 17, 0, 0, 0, loc).AddDate(0, 0, -1)
				today14 := time.Date(now.Year(), now.Month(), now.Day(), 14, 0, 0, 0, loc)
				cycleStart = yesterday17
				cycleEnd = today14
				cycleTrackingStart = cycleStart
				cycleTrackingEnd = cycleEnd
				log.Printf("🕐 14:00 Avanak message: Only users from 17:00 yesterday to 14:00 today (users 14:00-17:00 get 17:30 message)")
			} else if is1830Message {
				// For 18:30 message: Send to users in today's 24-hour cycle (17:00 today to 17:00 tomorrow)
				// But track by date (today) so it sends once per day at 18:30
				today17 := time.Date(now.Year(), now.Month(), now.Day(), 17, 0, 0, 0, loc)
				tomorrow17 := today17.AddDate(0, 0, 1)
				cycleStart = today17
				cycleEnd = tomorrow17
				// Track by date (start of today) to ensure one send per day
				cycleTrackingStart = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
				cycleTrackingEnd = cycleTrackingStart.AddDate(0, 0, 1)
				log.Printf("🕐 18:30 Avanak message: Sending to users in cycle %s to %s, tracking by date %s",
					cycleStart.Format("2006-01-02 15:04:05"), cycleEnd.Format("2006-01-02 15:04:05"),
					cycleTrackingStart.Format("2006-01-02"))
			} else {
				// For other messages: Calculate current 24-hour cycle (17:00 to 17:00 next day)
				if now.Hour() < 17 {
					yesterday := now.AddDate(0, 0, -1)
					cycleStart = time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 17, 0, 0, 0, loc)
					cycleEnd = time.Date(now.Year(), now.Month(), now.Day(), 17, 0, 0, 0, loc)
				} else {
					cycleStart = time.Date(now.Year(), now.Month(), now.Day(), 17, 0, 0, 0, loc)
					cycleEnd = time.Date(now.Year(), now.Month(), now.Day(), 17, 0, 0, 0, loc).AddDate(0, 0, 1)
				}
				cycleTrackingStart = cycleStart
				cycleTrackingEnd = cycleEnd
			}

			cycleType := "17:00-17:00"
			if is14HourMessage {
				cycleType = "17:00 دیروز - 14:00 امروز"
			} else if is1830Message {
				cycleType = "17:00-17:00 (18:30 send)"
			}
			log.Printf("📅 Auto cycle Avanak: Cycle start=%s, Cycle end=%s (%s cycle)",
				cycleStart.Format("2006-01-02 15:04:05"), cycleEnd.Format("2006-01-02 15:04:05"), cycleType)

			// CRITICAL: Use atomic operation to prevent duplicate sends
			// Try to create cycle log - if it already exists, skip (prevents race condition)
			checkCycleStart := cycleTrackingStart
			checkCycleEnd := cycleTrackingEnd

			// Try to create cycle log atomically (will fail if already exists due to unique constraint or manual check)
			var existingCycleLog models.AvanakMessageCycleLog
			if err := db.Where("avanak_message_id = ? AND cycle_start = ? AND cycle_end = ?", message.ID, checkCycleStart, checkCycleEnd).First(&existingCycleLog).Error; err == nil {
				log.Printf("⏭️  Skipping auto cycle Avanak message '%s' - already sent to cycle group (%s to %s)",
					message.Name, checkCycleStart.Format("2006-01-02 15:04:05"), checkCycleEnd.Format("2006-01-02 15:04:05"))
				continue
			}

			// Create cycle log BEFORE sending to prevent duplicate sends (atomic operation)
			cycleLog := models.AvanakMessageCycleLog{
				AvanakMessageID: message.ID,
				CycleStart:      cycleTrackingStart,
				CycleEnd:        cycleTrackingEnd,
				SentAt:          now,
				SentCount:       0, // Will be updated after sending
				CreatedAt:       now,
			}
			if err := db.Create(&cycleLog).Error; err != nil {
				// Cycle log already exists (race condition) - skip
				log.Printf("⏭️  Skipping auto cycle Avanak message '%s' - cycle log already exists (race condition prevented)", message.Name)
				continue
			}

			query := db.Model(&models.User{})

			if is14HourMessage {
				// Only users from 17:00 yesterday to 14:00 today
				query = query.Where("registered_at >= ? AND registered_at < ?", cycleStart, cycleEnd)
				log.Printf("🕐 14:00 Avanak message logic: Including users from %s to %s (17:00 yesterday to 14:00 today)",
					cycleStart.Format("2006-01-02 15:04:05"), cycleEnd.Format("2006-01-02 15:04:05"))
			} else if is1830Message {
				// For 18:30 message: Include users from 17:00 today to 17:00 tomorrow
				query = query.Where("registered_at >= ? AND registered_at < ?", cycleStart, cycleEnd)
				log.Printf("🕐 18:30 Avanak message logic: Including users from %s to %s (sent at 18:30 for today's cycle)",
					cycleStart.Format("2006-01-02 15:04:05"), cycleEnd.Format("2006-01-02 15:04:05"))
			} else {
				// For other messages: Simple 24-hour cycle from 17:00 to 17:00 next day
				query = query.Where("registered_at >= ? AND registered_at < ?", cycleStart, cycleEnd)
				log.Printf("🕐 Regular Avanak message logic: Including users from %s to %s (17:00 to 17:00 cycle)",
					cycleStart.Format("2006-01-02 15:04:05"), cycleEnd.Format("2006-01-02 15:04:05"))
			}

			var users []models.User
			query.Find(&users)

			log.Printf("📋 Found %d users for auto cycle Avanak message '%s' (cycle: %s to %s)",
				len(users), message.Name, cycleStart.Format("2006-01-02 15:04:05"), cycleEnd.Format("2006-01-02 15:04:05"))

			if len(users) == 0 {
				// CRITICAL: Delete cycle log if no users found (to allow retry later)
				db.Delete(&cycleLog)
				log.Printf("ℹ️  No users found for auto cycle Avanak message '%s', deleted cycle log to allow retry", message.Name)
				continue
			}

			sentCount := 0
			failedCount := 0

			for _, user := range users {
				normalizedPhone := utils.NormalizePhoneNumber(user.Phone)

				// CRITICAL: Check if this user already received this message in any cycle
				// This prevents duplicate sends to the same user across different cycles
				var existingLog models.AvanakMessageLog
				if err := db.Where("avanak_message_id = ? AND recipient = ? AND status = ?", message.ID, normalizedPhone, "sent").
					Order("sent_at DESC").First(&existingLog).Error; err == nil {
					// User already received this message - skip to prevent duplicate
					log.Printf("⏭️  Skipping user %s for auto cycle Avanak message '%s' - already received this message at %s",
						normalizedPhone, message.Name, existingLog.SentAt.Format("2006-01-02 15:04:05"))
					continue
				}

				// Send Avanak voice call
				err := avanakService.SendVoiceCall(normalizedPhone, message.MessageID)

				// Log the send attempt
				logEntry := models.AvanakMessageLog{
					AvanakMessageID: message.ID,
					Recipient:       normalizedPhone,
					Status:          "sent",
					SentAt:          now,
					CreatedAt:       now,
				}

				if err != nil {
					logEntry.Status = "failed"
					logEntry.ErrorMessage = err.Error()
					failedCount++
					log.Printf("❌ Failed to send auto cycle Avanak call to %s: %v", normalizedPhone, err)
				} else {
					sentCount++
					log.Printf("✅ Auto cycle Avanak call sent to %s (MessageID: %d)", normalizedPhone, message.MessageID)
				}

				db.Create(&logEntry)

				// Small delay to avoid rate limiting
				time.Sleep(100 * time.Millisecond)
			}

			// Update cycle log with sent count (cycle log was already created above)
			db.Model(&cycleLog).Update("sent_count", sentCount)

			// LastSentAt was already updated atomically above - no need to update again
			log.Printf("✅ Auto cycle Avanak message '%s' completed: %d sent, %d failed (cycle: %s to %s)",
				message.Name, sentCount, failedCount,
				cycleStart.Format("2006-01-02 15:04:05"), cycleEnd.Format("2006-01-02 15:04:05"))
		}
	}
}

// DEPRECATED: processWorkflows is no longer used - replaced by AdvancedWorkflowExecutor
// This function is kept for backward compatibility but should not be called
// func processWorkflows(db *gorm.DB, executor *notification.WorkflowExecutor, loc *time.Location) {
// 	// DEPRECATED - Use AdvancedWorkflowExecutor instead
// }
