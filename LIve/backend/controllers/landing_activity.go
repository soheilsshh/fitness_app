package controllers

import (
	"encoding/json"
	"fmt"
	"log"
	"monetizeai-backend/config"
	"monetizeai-backend/models"
	"monetizeai-backend/services"
	"monetizeai-backend/utils"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// TrackLandingActivity tracks a user's activity on the landing page
func TrackLandingActivity(c *gin.Context, db *gorm.DB) {
	var req struct {
		Phone     string `json:"phone" binding:"required"`
		Status    string `json:"status" binding:"required"`
		FirstName string `json:"first_name,omitempty"`
		LastName  string `json:"last_name,omitempty"`
		Metadata  string `json:"metadata,omitempty"` // JSON string for additional data
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Normalize phone number
	normalizedPhone := utils.NormalizePhoneNumber(req.Phone)

	now := time.Now()
	newStatus := models.LandingActivityStatus(req.Status)

	// --- Smart popup progress tracking (fail-safe) ---
	// If this status is related to ThankYou popup flow or landing popup, update the matching User record.
	// We prefer metadata.userId (registration cycle id) when provided.
	
	// Handle landing popup viewed (سیستم پولسازی مناسب شما)
	if req.Status == "landing_popup_viewed" {
		var user models.User
		if err := db.Where("phone = ?", normalizedPhone).Order("registered_at DESC, id DESC").First(&user).Error; err == nil {
			// Ensure user has identity
			if user.IdentityID == nil {
				var identity models.UserIdentity
				if err := db.Where("phone = ?", normalizedPhone).First(&identity).Error; err != nil {
					identity = models.UserIdentity{Phone: normalizedPhone}
					if err := db.Create(&identity).Error; err == nil {
						user.IdentityID = &identity.ID
					}
				} else {
					user.IdentityID = &identity.ID
				}
			}

			// CRITICAL: Update popup_progress to POPUP_COMPLETED when user views landing popup
			// This ensures that when user exits, they get popup_completed SMS (state 3) not state 2
			user.PopupProgress = models.PopupProgressCompleted
			user.LastPopupActivityAt = &now
			if err := db.Save(&user).Error; err != nil {
				log.Printf("⚠️ Failed to update popup_progress to COMPLETED for landing popup (user cycle %d): %v", user.ID, err)
			} else {
				log.Printf("✅ Updated popup_progress to COMPLETED for landing popup (user cycle %d, phone=%s)", user.ID, normalizedPhone)
			}
		}
	}
	
	if strings.HasPrefix(req.Status, "thankyou_") {
		var meta struct {
			UserID *uint  `json:"userId"`
			Step   *int   `json:"step"`
			Event  string `json:"event"`
		}
		if req.Metadata != "" {
			_ = json.Unmarshal([]byte(req.Metadata), &meta)
		}

		// Resolve target user (registration cycle)
		var user models.User
		userFound := false
		if meta.UserID != nil && *meta.UserID > 0 {
			if err := db.First(&user, *meta.UserID).Error; err == nil {
				userFound = true
			}
		}
		if !userFound {
			// Fallback: most recent registration cycle for this phone
			if err := db.Where("phone = ?", normalizedPhone).Order("registered_at DESC, id DESC").First(&user).Error; err == nil {
				userFound = true
			}
		}

		if userFound {
			// Ensure user has identity
			if user.IdentityID == nil {
				var identity models.UserIdentity
				if err := db.Where("phone = ?", normalizedPhone).First(&identity).Error; err != nil {
					identity = models.UserIdentity{Phone: normalizedPhone}
					if err := db.Create(&identity).Error; err == nil {
						user.IdentityID = &identity.ID
					}
				} else {
					user.IdentityID = &identity.ID
				}
			}

			// Map landing status -> popup progress
			progress := user.PopupProgress
			switch req.Status {
			case "thankyou_open":
				progress = models.PopupProgressEntered
			case "thankyou_step_1":
				// Still considered "entered" for the purpose of follow-up SMS
				if progress == models.PopupProgressNone {
					progress = models.PopupProgressEntered
				}
			case "thankyou_step_2":
				progress = models.PopupProgressGiftClicked
			case "thankyou_step_6":
				progress = models.PopupProgressCommitment
			case "thankyou_complete":
				progress = models.PopupProgressCompleted
			}

			user.PopupProgress = progress
			user.LastPopupActivityAt = &now
			if err := db.Save(&user).Error; err != nil {
				log.Printf("⚠️ Failed to update popup_progress for user cycle %d: %v", user.ID, err)
			} else if req.Status == "thankyou_complete" && user.PopupProgress == models.PopupProgressCompleted {
				// IMPORTANT: State 3 (POPUP_COMPLETED) should send immediately when user reaches final page
				// This is the page with "ثبت‌نامت انجام شد" message
				identityID := uint(0)
				if user.IdentityID != nil {
					identityID = *user.IdentityID
				}
				if identityID > 0 {
					phone := user.Phone
					firstName := user.FirstName
					cycleID := user.ID
					log.Printf("📱 User reached final landing page (thankyou_complete) - will send popup_completed SMS immediately (phone=%s)", normalizedPhone)
					go sendPopupCompletedImmediate(db, identityID, cycleID, phone, firstName)
				}
			}
		} else {
			log.Printf("⚠️ ThankYou tracking received but no user found for phone=%s", normalizedPhone)
		}
	}

	// Determine if this is a "periodic" status that should update existing record
	// vs an "action" status that should create a new history record
	// Periodic statuses: in_landing, entered_landing (update existing)
	// Action statuses: all clicks, copies, payment actions, left_landing (create new record)
	isPeriodicStatus := req.Status == string(models.LandingStatusInLanding) ||
		req.Status == string(models.LandingStatusEnteredLanding)

	// For periodic statuses (in_landing, entered_landing), update the most recent record
	// For action statuses (clicks, copies, etc.), always create a new record for history
	if isPeriodicStatus {
		// Find the most recent activity for this phone
		var activity models.LandingActivity
		err := db.Where("phone = ?", normalizedPhone).
			Order("last_status_update DESC, created_at DESC").
			First(&activity).Error

		if err == gorm.ErrRecordNotFound {
			// Create new activity for first entry
			activity = models.LandingActivity{
				Phone:            normalizedPhone,
				FirstName:        req.FirstName,
				LastName:         req.LastName,
				Status:           newStatus,
				LandingStartTime: &now,
				LastStatusUpdate: now,
				Metadata:         req.Metadata,
			}

			if err := db.Create(&activity).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"error":   "Failed to create activity: " + err.Error(),
				})
				return
			}

			// NEW RULE: Send popup_completed SMS immediately when user enters landing page
			// This happens when status is "entered_landing" (user reached "سیستم پولسازی مناسب شما" landing)
			if newStatus == models.LandingStatusEnteredLanding {
				// Find user by phone
				var user models.User
				if err := db.Where("phone = ?", normalizedPhone).Order("registered_at DESC, id DESC").First(&user).Error; err == nil {
					// Ensure user has identity
					if user.IdentityID == nil {
						var identity models.UserIdentity
						if err := db.Where("phone = ?", normalizedPhone).First(&identity).Error; err != nil {
							identity = models.UserIdentity{Phone: normalizedPhone}
							if err := db.Create(&identity).Error; err == nil {
								user.IdentityID = &identity.ID
							}
						} else {
							user.IdentityID = &identity.ID
						}
					}

					// CRITICAL: Update popup_progress to POPUP_COMPLETED when user reaches landing page
					// This ensures that when user exits, they get popup_completed SMS (state 3) not state 2
					user.PopupProgress = models.PopupProgressCompleted
					user.LastPopupActivityAt = &now
					if err := db.Save(&user).Error; err != nil {
						log.Printf("⚠️ Failed to update popup_progress to COMPLETED for user cycle %d: %v", user.ID, err)
					}

					if user.IdentityID != nil && *user.IdentityID > 0 {
						phone := user.Phone
						firstName := user.FirstName
						cycleID := user.ID
						log.Printf("📱 User entered landing page (first time) - will send popup_completed SMS immediately (phone=%s)", normalizedPhone)
						go sendPopupCompletedImmediate(db, *user.IdentityID, cycleID, phone, firstName)
					}
				}
			}
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "Database error: " + err.Error(),
			})
			return
		} else {
			// Update existing activity for periodic status
			oldStatus := activity.Status

			// Update status
			activity.Status = newStatus
			activity.LastStatusUpdate = now

			// Update name if provided
			if req.FirstName != "" {
				activity.FirstName = req.FirstName
			}
			if req.LastName != "" {
				activity.LastName = req.LastName
			}

			// Update metadata if provided
			if req.Metadata != "" {
				activity.Metadata = req.Metadata
			}

			// If entering landing for the first time, set start time
			if (oldStatus != models.LandingStatusEnteredLanding && oldStatus != models.LandingStatusInLanding) &&
				(req.Status == string(models.LandingStatusEnteredLanding) || req.Status == string(models.LandingStatusInLanding)) {
				if activity.LandingStartTime == nil {
					activity.LandingStartTime = &now
				}
			}

			// Calculate landing duration
			if activity.LandingStartTime != nil {
				duration := now.Sub(*activity.LandingStartTime)
				activity.LandingDurationMinutes = int(duration.Minutes())
			}

			// Use raw SQL to update
			updateSQL := `
				UPDATE landing_activities 
				SET status = ?, 
				    last_status_update = ?,
				    landing_duration_minutes = ?,
				    updated_at = ?
			`
			args := []interface{}{
				string(newStatus),
				now,
				activity.LandingDurationMinutes,
				now,
			}

			if req.FirstName != "" {
				updateSQL += `, first_name = ?`
				args = append(args, req.FirstName)
			}

			if req.LastName != "" {
				updateSQL += `, last_name = ?`
				args = append(args, req.LastName)
			}

			if req.Metadata != "" {
				updateSQL += `, metadata = ?`
				args = append(args, req.Metadata)
			}

			updateSQL += ` WHERE id = ?`
			args = append(args, activity.ID)

			if err := db.Exec(updateSQL, args...).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"error":   "Failed to update activity: " + err.Error(),
				})
				return
			}

			// Reload activity to return updated data
			db.Where("id = ?", activity.ID).First(&activity)

			// NEW RULE: Send popup_completed SMS immediately when user enters landing page
			// This happens when status changes to "entered_landing" (user reached "سیستم پولسازی مناسب شما" landing)
			if newStatus == models.LandingStatusEnteredLanding && oldStatus != models.LandingStatusEnteredLanding {
				// Find user by phone
				var user models.User
				if err := db.Where("phone = ?", normalizedPhone).Order("registered_at DESC, id DESC").First(&user).Error; err == nil {
					// Ensure user has identity
					if user.IdentityID == nil {
						var identity models.UserIdentity
						if err := db.Where("phone = ?", normalizedPhone).First(&identity).Error; err != nil {
							identity = models.UserIdentity{Phone: normalizedPhone}
							if err := db.Create(&identity).Error; err == nil {
								user.IdentityID = &identity.ID
							}
						} else {
							user.IdentityID = &identity.ID
						}
					}

					// CRITICAL: Update popup_progress to POPUP_COMPLETED when user reaches landing page
					// This ensures that when user exits, they get popup_completed SMS (state 3) not state 2
					user.PopupProgress = models.PopupProgressCompleted
					user.LastPopupActivityAt = &now
					if err := db.Save(&user).Error; err != nil {
						log.Printf("⚠️ Failed to update popup_progress to COMPLETED for user cycle %d: %v", user.ID, err)
					}

					if user.IdentityID != nil && *user.IdentityID > 0 {
						phone := user.Phone
						firstName := user.FirstName
						cycleID := user.ID
						log.Printf("📱 User entered landing page - will send popup_completed SMS immediately (phone=%s)", normalizedPhone)
						go sendPopupCompletedImmediate(db, *user.IdentityID, cycleID, phone, firstName)
					}
				}
			}

			// Process payment SMS triggers for entered_landing status (periodic but should trigger SMS)
			if newStatus == models.LandingStatusEnteredLanding {
				log.Printf("🔔 Landing entry detected (periodic status): Status=%s, ActivityID=%d, Phone=%s", newStatus, activity.ID, normalizedPhone)
				// Process triggers asynchronously to avoid blocking the response
				go func() {
					paymentSMSController := getPaymentSMSMessageController(db)
					if paymentSMSController != nil {
						if err := paymentSMSController.ProcessPaymentSMSTriggers(activity.ID, models.PaymentSMSTriggerEnteredLanding, normalizedPhone); err != nil {
							log.Printf("⚠️ Failed to process payment SMS trigger for activity %d: %v", activity.ID, err)
						}
					} else {
						log.Printf("❌ PaymentSMSMessageController is nil, cannot process trigger for activity %d", activity.ID)
					}
				}()
			}
		}
	} else {
		// For action statuses (clicks, copies, payment actions, etc.), ALWAYS create a new record
		// This ensures complete history tracking

		// Get the most recent activity to inherit some data (like landing_start_time)
		var lastActivity models.LandingActivity
		db.Where("phone = ?", normalizedPhone).
			Order("last_status_update DESC, created_at DESC").
			First(&lastActivity)

		// Create new activity record for this action
		activity := models.LandingActivity{
			Phone:            normalizedPhone,
			FirstName:        req.FirstName,
			LastName:         req.LastName,
			Status:           newStatus,
			LastStatusUpdate: now,
			Metadata:         req.Metadata,
		}

		// Inherit landing start time from last activity if available
		if lastActivity.LandingStartTime != nil {
			activity.LandingStartTime = lastActivity.LandingStartTime

			// Calculate duration from start time to now
			duration := now.Sub(*lastActivity.LandingStartTime)
			activity.LandingDurationMinutes = int(duration.Minutes())
		} else if req.Status == string(models.LandingStatusEnteredLanding) || req.Status == string(models.LandingStatusInLanding) {
			// If this is the first entry and no previous start time, set it now
			activity.LandingStartTime = &now
		}

		// NEW RULE: Send popup_completed SMS immediately when user enters landing page (for action statuses)
		// This happens when status is "entered_landing" (user reached "سیستم پولسازی مناسب شما" landing)
		if newStatus == models.LandingStatusEnteredLanding {
			// Find user by phone
			var user models.User
			if err := db.Where("phone = ?", normalizedPhone).Order("registered_at DESC, id DESC").First(&user).Error; err == nil {
				// Ensure user has identity
				if user.IdentityID == nil {
					var identity models.UserIdentity
					if err := db.Where("phone = ?", normalizedPhone).First(&identity).Error; err != nil {
						identity = models.UserIdentity{Phone: normalizedPhone}
						if err := db.Create(&identity).Error; err == nil {
							user.IdentityID = &identity.ID
						}
					} else {
						user.IdentityID = &identity.ID
					}
				}

				// CRITICAL: Update popup_progress to POPUP_COMPLETED when user reaches landing page
				// This ensures that when user exits, they get popup_completed SMS (state 3) not state 2
				user.PopupProgress = models.PopupProgressCompleted
				user.LastPopupActivityAt = &now
				if err := db.Save(&user).Error; err != nil {
					log.Printf("⚠️ Failed to update popup_progress to COMPLETED for user cycle %d: %v", user.ID, err)
				}

				if user.IdentityID != nil && *user.IdentityID > 0 {
					phone := user.Phone
					firstName := user.FirstName
					cycleID := user.ID
					log.Printf("📱 User entered landing page (action status) - will send popup_completed SMS immediately (phone=%s)", normalizedPhone)
					go sendPopupCompletedImmediate(db, *user.IdentityID, cycleID, phone, firstName)
				}
			}
		}

		// If user is leaving landing, set end time
		if newStatus == models.LandingStatusLeftLanding {
			activity.LandingEndTime = &now
			if activity.LandingStartTime != nil {
				duration := now.Sub(*activity.LandingStartTime)
				activity.LandingDurationMinutes = int(duration.Minutes())
			}
		}

		// If name not provided, inherit from last activity
		if activity.FirstName == "" && lastActivity.FirstName != "" {
			activity.FirstName = lastActivity.FirstName
		}
		if activity.LastName == "" && lastActivity.LastName != "" {
			activity.LastName = lastActivity.LastName
		}

		if err := db.Create(&activity).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "Failed to create activity: " + err.Error(),
			})
			return
		}

		// CRITICAL: If user left landing, send immediate SMS based on popup_progress
		if newStatus == models.LandingStatusLeftLanding {
			// Find user by phone to get popup_progress
			var user models.User
			if err := db.Where("phone = ?", normalizedPhone).Order("registered_at DESC, id DESC").First(&user).Error; err == nil {
				// Ensure user has identity
				if user.IdentityID == nil {
					var identity models.UserIdentity
					if err := db.Where("phone = ?", normalizedPhone).First(&identity).Error; err != nil {
						identity = models.UserIdentity{Phone: normalizedPhone}
						if err := db.Create(&identity).Error; err == nil {
							user.IdentityID = &identity.ID
						}
					} else {
						user.IdentityID = &identity.ID
					}
				}

				if user.IdentityID != nil && *user.IdentityID > 0 {
					// Send SMS immediately based on popup_progress
					go sendPopupExitSMSImmediate(db, *user.IdentityID, user.ID, user.Phone, user.FirstName, user.PopupProgress)
				}
			}
		}

		// Process payment SMS triggers for action statuses (non-periodic)
		// Only process triggers that match PaymentSMSTriggerType
		if triggerType := convertToPaymentSMSTriggerType(newStatus); triggerType != "" {
			log.Printf("🔔 Landing activity trigger detected: Status=%s, ConvertedTrigger=%s, ActivityID=%d, Phone=%s", newStatus, triggerType, activity.ID, normalizedPhone)
			// Process triggers asynchronously to avoid blocking the response
			go func() {
				paymentSMSController := getPaymentSMSMessageController(db)
				if paymentSMSController != nil {
					if err := paymentSMSController.ProcessPaymentSMSTriggers(activity.ID, models.PaymentSMSTriggerType(triggerType), normalizedPhone); err != nil {
						log.Printf("⚠️ Failed to process payment SMS trigger for activity %d: %v", activity.ID, err)
					}
				} else {
					log.Printf("❌ PaymentSMSMessageController is nil, cannot process trigger for activity %d", activity.ID)
				}
			}()
		} else {
			log.Printf("ℹ️  Landing activity status %s does not match any payment SMS trigger type", newStatus)
		}
	}

	// Return the most recent activity for this phone
	var latestActivity models.LandingActivity
	db.Where("phone = ?", normalizedPhone).
		Order("last_status_update DESC, created_at DESC").
		First(&latestActivity)

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"activity": latestActivity,
	})
}

func getSystemConfigString(db *gorm.DB, key string) (string, bool) {
	var cfg models.SystemConfig
	if err := db.Where("`key` = ?", key).First(&cfg).Error; err != nil {
		return "", false
	}
	if cfg.Value == "" {
		return "", false
	}
	return cfg.Value, true
}

func isAllowedSMSWindow(now time.Time) bool {
	// Fail-safe window: 08:00 - 21:59 (Asia/Tehran)
	h := now.Hour()
	return h >= 8 && h <= 21
}

func sendPopupCompletedImmediate(db *gorm.DB, identityID uint, cycleID uint, phone string, firstName string) {
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}
	now := time.Now().In(loc)
	// CRITICAL: Completed messages must be sent immediately, regardless of time window
	// This ensures users who complete the popup at night or early morning still receive the SMS
	// Time window restriction is removed for Completed state to ensure immediate delivery

	enabledStr, ok := getSystemConfigString(db, "melipayamak.enabled")
	if !ok || !(enabledStr == "true" || enabledStr == "1") {
		return
	}

	username, okU := getSystemConfigString(db, "melipayamak.username")
	apiKey, okK := getSystemConfigString(db, "melipayamak.api_key")
	if !okU || !okK || username == "" || apiKey == "" {
		return
	}

	// GOLDEN RULE: Check if ANY popup SMS has already been sent for this user/cycle
	// If one message is sent, others should not be sent
	var existingLog models.SmartSMSLog
	if err := db.Where("user_id = ? AND registration_cycle_id = ? AND category IN ?", identityID, cycleID, []string{"popup_entered_no_progress", "popup_gift_or_commitment_no_complete", "popup_completed"}).First(&existingLog).Error; err == nil {
		log.Printf("ℹ️ sendPopupCompletedImmediate: A popup SMS already sent (category=%s), skipping popup_completed SMS (identity=%d, cycle=%d)", existingLog.Category, identityID, cycleID)
		return
	}

	// Hard dedupe via unique key (identity + cycle + category)
	category := "popup_completed"
	pattern := 407869

	// Create a lock row first to avoid concurrent duplicates.
	lock := models.SmartSMSLog{
		UserID:              identityID,
		RegistrationCycleID: cycleID,
		Provider:            "melipayamak",
		PatternCode:         fmt.Sprintf("%d", pattern),
		Category:            category,
		SentAt:              now,
		Status:              "sending",
		CreatedAt:           now,
	}
	if err := db.Create(&lock).Error; err != nil {
		// duplicate => already handled
		return
	}

	name := firstName
	if name == "" {
		name = "دوست عزیز"
	}

	svc := services.NewMelipayamakService(&config.MelipayamakConfig{
		Username: username,
		ApiKey:   apiKey,
		Enabled:  true,
	})
	if err := svc.SendPatternSMS(phone, pattern, name); err != nil {
		// Fail-safe: remove lock so scheduler can retry later
		log.Printf("❌ sendPopupCompletedImmediate: failed to send SMS (identity=%d, cycle=%d, phone=%s): %v", identityID, cycleID, phone, err)
		_ = db.Delete(&lock).Error
		return
	}

	_ = db.Model(&models.SmartSMSLog{}).Where("id = ?", lock.ID).Updates(map[string]interface{}{
		"status":        "sent",
		"error_message": "",
	}).Error
	log.Printf("✅ sendPopupCompletedImmediate: sent popup_completed SMS (identity=%d, cycle=%d, phone=%s, pattern=%d)", identityID, cycleID, phone, pattern)
}

// sendPopupExitSMSImmediate sends SMS immediately when user exits landing page based on popup_progress
func sendPopupExitSMSImmediate(db *gorm.DB, identityID uint, cycleID uint, phone string, firstName string, popupProgress models.PopupProgress) {
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}
	now := time.Now().In(loc)

	enabledStr, ok := getSystemConfigString(db, "melipayamak.enabled")
	if !ok || !(enabledStr == "true" || enabledStr == "1") {
		return
	}

	username, okU := getSystemConfigString(db, "melipayamak.username")
	apiKey, okK := getSystemConfigString(db, "melipayamak.api_key")
	if !okU || !okK || username == "" || apiKey == "" {
		return
	}

	// Determine category and pattern based on popup_progress
	var category string
	var pattern int

	switch popupProgress {
	case models.PopupProgressEntered:
		// User exited at state 1 (entered but didn't progress)
		category = "popup_entered_no_progress"
		pattern = 407873
	case models.PopupProgressGiftClicked, models.PopupProgressCommitment:
		// User exited at state 2 (clicked gift/commitment but didn't complete)
		category = "popup_gift_or_commitment_no_complete"
		pattern = 407871
	case models.PopupProgressCompleted:
		// User completed but then exited - send completed message
		category = "popup_completed"
		pattern = 407869
	default:
		// No popup progress or unknown state - don't send
		log.Printf("ℹ️ sendPopupExitSMSImmediate: user has no popup progress or unknown state (progress=%s), skipping SMS", popupProgress)
		return
	}

	// GOLDEN RULE: Check if ANY popup SMS has already been sent for this user/cycle
	// If one message is sent, others should not be sent
	var existingLog models.SmartSMSLog
	// Check if any popup SMS category already exists
	if err := db.Where("user_id = ? AND registration_cycle_id = ? AND category IN ?", identityID, cycleID, []string{"popup_entered_no_progress", "popup_gift_or_commitment_no_complete", "popup_completed"}).First(&existingLog).Error; err == nil {
		log.Printf("ℹ️ sendPopupExitSMSImmediate: A popup SMS already sent (category=%s), skipping new SMS (identity=%d, cycle=%d, requested_category=%s)", existingLog.Category, identityID, cycleID, category)
		return
	}

	// Create a lock row first to avoid concurrent duplicates
	lock := models.SmartSMSLog{
		UserID:              identityID,
		RegistrationCycleID: cycleID,
		Provider:            "melipayamak",
		PatternCode:         fmt.Sprintf("%d", pattern),
		Category:            category,
		SentAt:              now,
		Status:              "sending",
		CreatedAt:           now,
	}
	if err := db.Create(&lock).Error; err != nil {
		// duplicate => already handled
		log.Printf("ℹ️ sendPopupExitSMSImmediate: duplicate lock detected, skipping (identity=%d, cycle=%d, category=%s)", identityID, cycleID, category)
		return
	}

	name := firstName
	if name == "" {
		name = "دوست عزیز"
	}

	svc := services.NewMelipayamakService(&config.MelipayamakConfig{
		Username: username,
		ApiKey:   apiKey,
		Enabled:  true,
	})
	if err := svc.SendPatternSMS(phone, pattern, name); err != nil {
		// Fail-safe: remove lock so it can be retried later
		log.Printf("❌ sendPopupExitSMSImmediate: failed to send SMS (identity=%d, cycle=%d, phone=%s, category=%s, pattern=%d): %v", identityID, cycleID, phone, category, pattern, err)
		_ = db.Delete(&lock).Error
		return
	}

	_ = db.Model(&models.SmartSMSLog{}).Where("id = ?", lock.ID).Updates(map[string]interface{}{
		"status":        "sent",
		"error_message": "",
	}).Error
	log.Printf("✅ sendPopupExitSMSImmediate: sent %s SMS immediately on exit (identity=%d, cycle=%d, phone=%s, pattern=%d, progress=%s)", category, identityID, cycleID, phone, pattern, popupProgress)
}

// convertToPaymentSMSTriggerType converts LandingActivityStatus to PaymentSMSTriggerType if applicable
func convertToPaymentSMSTriggerType(status models.LandingActivityStatus) string {
	switch status {
	case models.LandingStatusClickedCardToCard:
		return string(models.PaymentSMSTriggerClickedCardToCard)
	case models.LandingStatusCopiedCardToCard:
		return string(models.PaymentSMSTriggerCopiedCardToCard)
	case models.LandingStatusClickedInstallment:
		return string(models.PaymentSMSTriggerClickedInstallment)
	case models.LandingStatusCopiedInstallmentCard:
		return string(models.PaymentSMSTriggerCopiedInstallmentCard)
	case models.LandingStatusClickedPaymentButton:
		return string(models.PaymentSMSTriggerClickedPaymentButton)
	case models.LandingStatusEnteredLanding:
		return string(models.PaymentSMSTriggerEnteredLanding)
	default:
		return ""
	}
}

// getPaymentSMSMessageController creates a PaymentSMSMessageController instance
// This is a helper function to avoid circular dependencies
func getPaymentSMSMessageController(db *gorm.DB) *PaymentSMSMessageController {
	// We need to get the FarazSMSService from config
	// For now, we'll create it with a nil service and it will work for logging
	// The actual sending will be done by the scheduler
	// TODO: Refactor to inject service properly
	return NewPaymentSMSMessageController(db, nil)
}

// UpdateLandingDuration updates the landing duration for a user (called periodically)
func UpdateLandingDuration(c *gin.Context, db *gorm.DB) {
	var req struct {
		Phone string `json:"phone" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Normalize phone number
	normalizedPhone := utils.NormalizePhoneNumber(req.Phone)

	var activity models.LandingActivity
	err := db.Where("phone = ?", normalizedPhone).First(&activity).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Activity not found",
		})
		return
	}

	// Update duration if user is still on landing (don't update if they left)
	// Only update duration if status is still "in_landing" or "entered_landing"
	// Do NOT update if status is "left_landing" or any other status
	// IMPORTANT: Don't update LastStatusUpdate here to preserve the last actual status change
	if activity.LandingStartTime != nil &&
		(activity.Status == models.LandingStatusInLanding || activity.Status == models.LandingStatusEnteredLanding) {
		now := time.Now()
		duration := now.Sub(*activity.LandingStartTime)

		// Use raw SQL to update ONLY duration_minutes and updated_at
		// Do NOT update last_status_update to preserve the last actual status change
		updateSQL := `UPDATE landing_activities 
			SET landing_duration_minutes = ?, 
			    updated_at = ?
			WHERE phone = ? AND (status = ? OR status = ?)`

		if err := db.Exec(updateSQL,
			int(duration.Minutes()),
			now,
			normalizedPhone,
			string(models.LandingStatusInLanding),
			string(models.LandingStatusEnteredLanding),
		).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "Failed to update duration: " + err.Error(),
			})
			return
		}

		// Reload to get updated duration
		db.Where("phone = ?", normalizedPhone).First(&activity)
	} else {
		// User has left landing - don't update duration
		log.Printf("⚠️ UpdateLandingDuration called but user status is %s (not in_landing), skipping duration update", activity.Status)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":          true,
		"duration_minutes": activity.LandingDurationMinutes,
	})
}

// GetUserLandingActivities returns all landing activities for a specific user (by phone)
func GetUserLandingActivities(c *gin.Context, db *gorm.DB) {
	phone := c.Query("phone")
	if phone == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Phone number is required",
		})
		return
	}

	// Normalize phone number
	normalizedPhone := utils.NormalizePhoneNumber(phone)

	// Get all landing activities for this phone, ordered by last_status_update DESC
	var activities []models.LandingActivity
	if err := db.Where("phone = ?", normalizedPhone).
		Order("last_status_update DESC, created_at DESC").
		Find(&activities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch activities: " + err.Error(),
		})
		return
	}

	// Count occurrences of each status
	statusCounts := make(map[string]int)
	for _, activity := range activities {
		statusCounts[string(activity.Status)]++
	}

	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"phone":         normalizedPhone,
		"activities":    activities,
		"status_counts": statusCounts,
		"total_actions": len(activities),
	})
}

// LinkPaymentToActivity links a payment transaction to a landing activity
func LinkPaymentToActivity(db *gorm.DB, phone string, paymentID uint) error {
	normalizedPhone := utils.NormalizePhoneNumber(phone)

	var activity models.LandingActivity
	err := db.Where("phone = ?", normalizedPhone).First(&activity).Error
	if err != nil {
		// If activity doesn't exist, create one
		now := time.Now()
		activity = models.LandingActivity{
			Phone:                normalizedPhone,
			Status:               models.LandingStatusPaymentInitiated,
			PaymentTransactionID: &paymentID,
			LandingStartTime:     &now,
			LastStatusUpdate:     now,
		}
		return db.Create(&activity).Error
	}

	// Update existing activity
	activity.PaymentTransactionID = &paymentID
	if activity.Status != models.LandingStatusPaymentSuccess && activity.Status != models.LandingStatusPaymentFailed {
		activity.Status = models.LandingStatusPaymentInitiated
	}
	activity.LastStatusUpdate = time.Now()

	return db.Save(&activity).Error
}

// UpdateActivityPaymentStatus updates the payment status in landing activity
func UpdateActivityPaymentStatus(db *gorm.DB, phone string, status string, paymentID *uint) error {
	normalizedPhone := utils.NormalizePhoneNumber(phone)

	var activity models.LandingActivity
	err := db.Where("phone = ?", normalizedPhone).First(&activity).Error
	if err != nil {
		// If activity doesn't exist, create one
		now := time.Now()
		activity = models.LandingActivity{
			Phone:            normalizedPhone,
			Status:           models.LandingActivityStatus(status),
			LandingStartTime: &now,
			LastStatusUpdate: now,
		}
		if paymentID != nil {
			activity.PaymentTransactionID = paymentID
		}
		return db.Create(&activity).Error
	}

	// Update existing activity
	activity.Status = models.LandingActivityStatus(status)
	if paymentID != nil {
		activity.PaymentTransactionID = paymentID
	}
	activity.LastStatusUpdate = time.Now()

	return db.Save(&activity).Error
}
