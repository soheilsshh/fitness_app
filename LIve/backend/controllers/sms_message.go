package controllers

import (
	"fmt"
	"log"
	"fitino-live-backend/models"
	"fitino-live-backend/services"
	"fitino-live-backend/utils"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SMSMessageController struct {
	DB                 *gorm.DB
	MelipayamakService *services.MelipayamakService
	FarazSMSService    *services.FarazSMSService
}

func NewSMSMessageController(db *gorm.DB, melipayamakService *services.MelipayamakService, farazSMSService *services.FarazSMSService) *SMSMessageController {
	return &SMSMessageController{
		DB:                 db,
		MelipayamakService: melipayamakService,
		FarazSMSService:    farazSMSService,
	}
}

// GetSMSMessages returns list of all SMS messages
func (ctrl *SMSMessageController) GetSMSMessages(c *gin.Context) {
	var messages []models.SMSMessage
	if err := ctrl.DB.Order("created_at DESC").Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch SMS messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

// GetSMSMessage returns a single SMS message by ID
func (ctrl *SMSMessageController) GetSMSMessage(c *gin.Context) {
	id := c.Param("id")
	var message models.SMSMessage
	if err := ctrl.DB.First(&message, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "SMS message not found"})
		return
	}

	c.JSON(http.StatusOK, message)
}

// CreateSMSMessage creates a new SMS message
func (ctrl *SMSMessageController) CreateSMSMessage(c *gin.Context) {
	var req struct {
		Name                  string     `json:"name" binding:"required"`
		PatternCode           int        `json:"pattern_code" binding:"required"`
		MessageText           string     `json:"message_text"`
		IsActive              bool       `json:"is_active"`
		SendType              string     `json:"send_type" binding:"required"` // "automatic" or "scheduled"
		ScheduledAt           *time.Time `json:"scheduled_at"`                 // For scheduled messages
		SendHour              *int       `json:"send_hour"`                    // For automatic messages
		SendMinute            *int       `json:"send_minute"`                  // For automatic messages
		RegistrationTimeRange string     `json:"registration_time_range"`      // "all", "today", "yesterday", "week", etc.
		RegistrationStartHour *int       `json:"registration_start_hour"`      // Start hour of registration time range (0-23, null = no filter)
		RegistrationEndHour   *int       `json:"registration_end_hour"`        // End hour of registration time range (0-23, null = no filter)
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	message := models.SMSMessage{
		Name:                  req.Name,
		PatternCode:           req.PatternCode,
		MessageText:           req.MessageText,
		IsActive:              req.IsActive,
		SendType:              req.SendType,
		ScheduledAt:           req.ScheduledAt,
		SendHour:              req.SendHour,
		SendMinute:            req.SendMinute,
		RegistrationTimeRange: req.RegistrationTimeRange,
		RegistrationStartHour: req.RegistrationStartHour,
		RegistrationEndHour:   req.RegistrationEndHour,
		CreatedAt:             time.Now(),
		UpdatedAt:             time.Now(),
	}

	if err := ctrl.DB.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create SMS message"})
		return
	}

	log.Printf("✅ SMS message created: ID=%d, Name=%s, PatternCode=%d, SendHour=%v, SendMinute=%v",
		message.ID, message.Name, message.PatternCode, message.SendHour, message.SendMinute)
	c.JSON(http.StatusOK, message)
}

// UpdateSMSMessage updates an existing SMS message
func (ctrl *SMSMessageController) UpdateSMSMessage(c *gin.Context) {
	id := c.Param("id")
	var message models.SMSMessage
	if err := ctrl.DB.First(&message, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "SMS message not found"})
		return
	}

	var req struct {
		Name                  *string    `json:"name"`
		PatternCode           *int       `json:"pattern_code"`
		MessageText           *string    `json:"message_text"`
		IsActive              *bool      `json:"is_active"`
		SendType              *string    `json:"send_type"`
		ScheduledAt           *time.Time `json:"scheduled_at"`
		SendHour              *int       `json:"send_hour"`
		SendMinute            *int       `json:"send_minute"`
		RegistrationTimeRange *string    `json:"registration_time_range"`
		RegistrationStartHour *int       `json:"registration_start_hour"`
		RegistrationEndHour   *int       `json:"registration_end_hour"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if req.Name != nil {
		message.Name = *req.Name
	}
	if req.PatternCode != nil {
		message.PatternCode = *req.PatternCode
	}
	if req.MessageText != nil {
		message.MessageText = *req.MessageText
	}
	if req.IsActive != nil {
		message.IsActive = *req.IsActive
	}
	if req.SendType != nil {
		message.SendType = *req.SendType
		// CRITICAL: When send_type changes, clear conflicting fields
		if *req.SendType == "scheduled" {
			// If changing to scheduled, clear automatic fields
			message.SendHour = nil
			message.SendMinute = nil
		} else if *req.SendType == "automatic" {
			// If changing to automatic, clear scheduled_at
			message.ScheduledAt = nil
		}
	}
	// Handle scheduled_at: if explicitly set to null, clear it; if set to a value, use it
	if req.ScheduledAt != nil {
		message.ScheduledAt = req.ScheduledAt
		// If scheduled_at is set, ensure send_type is scheduled and clear automatic fields
		if message.SendType == "automatic" {
			message.SendType = "scheduled"
			message.SendHour = nil
			message.SendMinute = nil
		}
	}
	// Accept SendHour even if it's 0 (midnight is a valid hour)
	if req.SendHour != nil {
		message.SendHour = req.SendHour
		// If send_hour is set, ensure send_type is automatic and clear scheduled_at
		if message.SendType == "scheduled" {
			message.SendType = "automatic"
			message.ScheduledAt = nil
		}
	}
	// Accept SendMinute even if it's 0 (valid minute value)
	if req.SendMinute != nil {
		message.SendMinute = req.SendMinute
		// If send_minute is set, ensure send_type is automatic and clear scheduled_at
		if message.SendType == "scheduled" {
			message.SendType = "automatic"
			message.ScheduledAt = nil
		}
	}
	if req.RegistrationTimeRange != nil {
		message.RegistrationTimeRange = *req.RegistrationTimeRange
	}
	if req.RegistrationStartHour != nil {
		message.RegistrationStartHour = req.RegistrationStartHour
	}
	if req.RegistrationEndHour != nil {
		message.RegistrationEndHour = req.RegistrationEndHour
	}
	message.UpdatedAt = time.Now()

	if err := ctrl.DB.Save(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update SMS message"})
		return
	}

	log.Printf("✅ SMS message updated: ID=%d, Name=%s", message.ID, message.Name)
	c.JSON(http.StatusOK, message)
}

// DeleteSMSMessage deletes an SMS message
func (ctrl *SMSMessageController) DeleteSMSMessage(c *gin.Context) {
	id := c.Param("id")

	// Parse ID to integer
	messageID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message ID"})
		return
	}

	// First, check if message exists
	var message models.SMSMessage
	if err := ctrl.DB.First(&message, messageID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "SMS message not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find SMS message: " + err.Error()})
		return
	}

	// Delete all related logs first (SMSMessageLog) - use Unscoped for hard delete
	if err := ctrl.DB.Unscoped().Where("sms_message_id = ?", messageID).Delete(&models.SMSMessageLog{}).Error; err != nil {
		log.Printf("⚠️  Warning: Failed to delete logs for SMS message ID %d: %v", messageID, err)
		// Continue anyway - try to delete the message
	} else {
		log.Printf("✅ Deleted logs for SMS message ID %d", messageID)
	}

	// Delete all related cycle logs (SMSMessageCycleLog) - use Unscoped for hard delete
	if err := ctrl.DB.Unscoped().Where("sms_message_id = ?", messageID).Delete(&models.SMSMessageCycleLog{}).Error; err != nil {
		log.Printf("⚠️  Warning: Failed to delete cycle logs for SMS message ID %d: %v", messageID, err)
		// Continue anyway - try to delete the message
	} else {
		log.Printf("✅ Deleted cycle logs for SMS message ID %d", messageID)
	}

	// Delete the message - use Unscoped for hard delete
	if err := ctrl.DB.Unscoped().Delete(&message).Error; err != nil {
		log.Printf("❌ Failed to delete SMS message ID %d: %v", messageID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete SMS message: " + err.Error()})
		return
	}

	log.Printf("✅ SMS message deleted: ID=%d, Name=%s", messageID, message.Name)
	c.JSON(http.StatusOK, gin.H{"message": "SMS message deleted successfully"})
}

// GetSMSMessageLogs returns logs for an SMS message
func (ctrl *SMSMessageController) GetSMSMessageLogs(c *gin.Context) {
	messageID := c.Param("id")
	var logs []models.SMSMessageLog
	if err := ctrl.DB.Where("sms_message_id = ?", messageID).
		Order("sent_at DESC").
		Limit(100).
		Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch SMS message logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"logs": logs})
}

// TestSMSMessage sends a test SMS message
func (ctrl *SMSMessageController) TestSMSMessage(c *gin.Context) {
	var req struct {
		MessageID int    `json:"message_id" binding:"required"`
		Phone     string `json:"phone" binding:"required"`
		Params    string `json:"params"` // Optional parameters for pattern (e.g., user name)
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	var message models.SMSMessage
	if err := ctrl.DB.First(&message, req.MessageID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "SMS message not found"})
		return
	}

	// Normalize phone number
	normalizedPhone := utils.NormalizePhoneNumber(req.Phone)

	// Prepare parameters
	var params []string
	if req.Params != "" {
		params = []string{req.Params}
	}

	// Send test SMS
	err := ctrl.MelipayamakService.SendPatternSMS(normalizedPhone, message.PatternCode, params...)

	// Log the test send attempt
	logEntry := models.SMSMessageLog{
		SMSMessageID: message.ID,
		Recipient:    normalizedPhone,
		Status:       "sent",
		SentAt:       time.Now(),
		CreatedAt:    time.Now(),
	}
	if err != nil {
		logEntry.Status = "failed"
		logEntry.ErrorMessage = err.Error()
		log.Printf("❌ Test SMS send failed: %v", err)
	} else {
		log.Printf("✅ Test SMS sent successfully to %s", normalizedPhone)
	}

	ctrl.DB.Create(&logEntry)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to send test SMS",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Test SMS sent successfully",
		"log":     logEntry,
	})
}

// ToggleAutoCycle toggles the auto cycle enabled status for an SMS message
func (ctrl *SMSMessageController) ToggleAutoCycle(c *gin.Context) {
	id := c.Param("id")
	var message models.SMSMessage
	if err := ctrl.DB.First(&message, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "SMS message not found"})
		return
	}

	// Toggle the auto cycle enabled status
	message.AutoCycleEnabled = !message.AutoCycleEnabled
	message.UpdatedAt = time.Now()

	if err := ctrl.DB.Save(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update auto cycle status"})
		return
	}

	log.Printf("✅ SMS message auto cycle toggled: ID=%d, AutoCycleEnabled=%v", message.ID, message.AutoCycleEnabled)
	c.JSON(http.StatusOK, message)
}

// GetAutoCycleInfo returns information about auto cycle status, pending users, and cycle history
func (ctrl *SMSMessageController) GetAutoCycleInfo(c *gin.Context) {
	id := c.Param("id")
	log.Printf("🔍 GetAutoCycleInfo called for message ID: %s", id)

	var message models.SMSMessage
	if err := ctrl.DB.First(&message, id).Error; err != nil {
		log.Printf("❌ SMS message not found: ID=%s, Error=%v", id, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "SMS message not found"})
		return
	}

	log.Printf("✅ SMS message found: ID=%d, Name=%s, AutoCycleEnabled=%v", message.ID, message.Name, message.AutoCycleEnabled)

	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}

	now := time.Now().In(loc)

	// Check if auto cycle is enabled
	hasRequiredFields := message.SendHour != nil && message.SendMinute != nil
	if !message.AutoCycleEnabled {
		log.Printf("ℹ️  Auto cycle not enabled for message ID=%d", message.ID)
		c.JSON(http.StatusOK, gin.H{
			"auto_cycle_enabled": false,
			"message":            "Auto cycle is not enabled for this message",
			"message_info": gin.H{
				"name":                message.Name,
				"send_hour":           message.SendHour,
				"send_minute":         message.SendMinute,
				"has_required_fields": hasRequiredFields,
			},
		})
		return
	}

	if !hasRequiredFields {
		log.Printf("ℹ️  Auto cycle enabled but missing required fields for message ID=%d (SendHour=%v, SendMinute=%v)",
			message.ID, message.SendHour, message.SendMinute)
		c.JSON(http.StatusOK, gin.H{
			"auto_cycle_enabled": false,
			"message":            "Auto cycle is enabled but SendHour or SendMinute is not set",
			"message_info": gin.H{
				"name":                message.Name,
				"send_hour":           message.SendHour,
				"send_minute":         message.SendMinute,
				"has_required_fields": false,
			},
		})
		return
	}

	is14HourMessage := *message.SendHour == 14 && *message.SendMinute == 0
	is1830Message := *message.SendHour == 18 && *message.SendMinute == 30

	// Calculate current cycle
	var currentCycleStart time.Time
	var currentCycleEnd time.Time
	var cycleTrackingStart time.Time
	var cycleTrackingEnd time.Time

	if is14HourMessage {
		// For 14:00 message: Only users from 17:00 yesterday to 14:00 today
		// Users 14:00-17:00 get 17:30 message, users after 17:00 go to next cycle
		yesterday17 := time.Date(now.Year(), now.Month(), now.Day(), 17, 0, 0, 0, loc).AddDate(0, 0, -1)
		today14 := time.Date(now.Year(), now.Month(), now.Day(), 14, 0, 0, 0, loc)
		currentCycleStart = yesterday17
		currentCycleEnd = today14
		cycleTrackingStart = currentCycleStart
		cycleTrackingEnd = currentCycleEnd
	} else if is1830Message {
		// For 18:30 message: Users from 17:00 today to 17:00 tomorrow
		today17 := time.Date(now.Year(), now.Month(), now.Day(), 17, 0, 0, 0, loc)
		tomorrow17 := today17.AddDate(0, 0, 1)
		currentCycleStart = today17
		currentCycleEnd = tomorrow17
		// Track by date (start of today)
		cycleTrackingStart = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
		cycleTrackingEnd = cycleTrackingStart.AddDate(0, 0, 1)
	} else {
		if now.Hour() < 17 {
			yesterday := now.AddDate(0, 0, -1)
			currentCycleStart = time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 17, 0, 0, 0, loc)
			currentCycleEnd = time.Date(now.Year(), now.Month(), now.Day(), 17, 0, 0, 0, loc)
		} else {
			currentCycleStart = time.Date(now.Year(), now.Month(), now.Day(), 17, 0, 0, 0, loc)
			currentCycleEnd = time.Date(now.Year(), now.Month(), now.Day(), 17, 0, 0, 0, loc).AddDate(0, 0, 1)
		}
		cycleTrackingStart = currentCycleStart
		cycleTrackingEnd = currentCycleEnd
	}

	// Check if current cycle has been sent (use tracking dates for 18:30 message)
	var currentCycleLog models.SMSMessageCycleLog
	checkCycleStart := cycleTrackingStart
	checkCycleEnd := cycleTrackingEnd
	currentCycleSent := ctrl.DB.Where("sms_message_id = ? AND cycle_start = ? AND cycle_end = ?", message.ID, checkCycleStart, checkCycleEnd).First(&currentCycleLog).Error == nil

	// Get users in current cycle
	var cycleUsers []models.User
	query := ctrl.DB.Model(&models.User{})
	if is14HourMessage {
		query = query.Where("registered_at >= ? AND registered_at < ?", currentCycleStart, currentCycleEnd)
	} else if is1830Message {
		// For 18:30 message: Include users from 17:00 today to 17:00 tomorrow
		query = query.Where("registered_at >= ? AND registered_at < ?", currentCycleStart, currentCycleEnd)
	} else {
		query = query.Where("registered_at >= ? AND registered_at < ?", currentCycleStart, currentCycleEnd)
	}

	log.Printf("📋 Querying users for cycle: %s to %s", currentCycleStart.Format("2006-01-02 15:04:05"), currentCycleEnd.Format("2006-01-02 15:04:05"))
	err = query.Order("registered_at DESC").Find(&cycleUsers).Error
	if err != nil {
		log.Printf("❌ Error querying cycle users: %v", err)
		cycleUsers = []models.User{} // Set empty slice on error
	} else {
		log.Printf("✅ Found %d users in current cycle", len(cycleUsers))
	}

	// If cycle is sent, get users who actually received the message from logs
	var receivedUsers []struct {
		ID           uint      `json:"id"`
		FirstName    string    `json:"first_name"`
		LastName     string    `json:"last_name"`
		Phone        string    `json:"phone"`
		RegisteredAt time.Time `json:"registered_at"`
		SentAt       time.Time `json:"sent_at"`
		Status       string    `json:"status"`
	}

	if currentCycleSent {
		// Get users who received SMS in this cycle from logs
		// Get logs sent around the cycle send time (within 2 hours window)
		var logs []models.SMSMessageLog
		ctrl.DB.Where("sms_message_id = ? AND sent_at >= ? AND sent_at <= ?",
			message.ID, currentCycleLog.SentAt.Add(-2*time.Hour), currentCycleLog.SentAt.Add(2*time.Hour)).
			Order("sent_at DESC").
			Find(&logs)

		// Get user details for logged recipients
		userMap := make(map[string]bool) // To avoid duplicates
		for _, log := range logs {
			// Only include if user registered in current cycle
			var user models.User
			if ctrl.DB.Where("phone = ? AND registered_at >= ? AND registered_at < ?",
				log.Recipient, currentCycleStart, currentCycleEnd).First(&user).Error == nil {
				// Avoid duplicates
				if !userMap[user.Phone] {
					userMap[user.Phone] = true
					receivedUsers = append(receivedUsers, struct {
						ID           uint      `json:"id"`
						FirstName    string    `json:"first_name"`
						LastName     string    `json:"last_name"`
						Phone        string    `json:"phone"`
						RegisteredAt time.Time `json:"registered_at"`
						SentAt       time.Time `json:"sent_at"`
						Status       string    `json:"status"`
					}{
						ID:           user.ID,
						FirstName:    user.FirstName,
						LastName:     user.LastName,
						Phone:        user.Phone,
						RegisteredAt: user.RegisteredAt,
						SentAt:       log.SentAt,
						Status:       log.Status,
					})
				}
			}
		}
	}

	// Get cycle history (last 10 cycles)
	var cycleLogs []models.SMSMessageCycleLog
	ctrl.DB.Where("sms_message_id = ?", message.ID).
		Order("cycle_start DESC").
		Limit(10).
		Find(&cycleLogs)

	// Format cycle history
	type CycleInfo struct {
		CycleStart  string `json:"cycle_start"`
		CycleEnd    string `json:"cycle_end"`
		SentAt      string `json:"sent_at,omitempty"`
		SentCount   int    `json:"sent_count"`
		IsCompleted bool   `json:"is_completed"`
		IsCurrent   bool   `json:"is_current"`
	}

	cycleHistory := []CycleInfo{}
	for _, log := range cycleLogs {
		cycleHistory = append(cycleHistory, CycleInfo{
			CycleStart:  log.CycleStart.Format("2006-01-02 15:04:05"),
			CycleEnd:    log.CycleEnd.Format("2006-01-02 15:04:05"),
			SentAt:      log.SentAt.Format("2006-01-02 15:04:05"),
			SentCount:   log.SentCount,
			IsCompleted: true,
			IsCurrent:   log.CycleStart.Equal(currentCycleStart) && log.CycleEnd.Equal(currentCycleEnd),
		})
	}

	// Add current cycle if not in history
	if !currentCycleSent {
		cycleHistory = append([]CycleInfo{{
			CycleStart:  currentCycleStart.Format("2006-01-02 15:04:05"),
			CycleEnd:    currentCycleEnd.Format("2006-01-02 15:04:05"),
			SentCount:   len(cycleUsers),
			IsCompleted: false,
			IsCurrent:   true,
		}}, cycleHistory...)
	}

	// Get next cycle info
	var nextCycleStart time.Time
	var nextCycleEnd time.Time
	if is14HourMessage {
		nextCycleStart = currentCycleEnd
		nextCycleEnd = currentCycleEnd.AddDate(0, 0, 1)
	} else {
		nextCycleStart = currentCycleEnd
		nextCycleEnd = currentCycleEnd.AddDate(0, 0, 1)
	}

	var nextCycleUsers []models.User
	nextQuery := ctrl.DB.Model(&models.User{}).Where("registered_at >= ? AND registered_at < ?", nextCycleStart, nextCycleEnd)
	log.Printf("📋 Querying users for next cycle: %s to %s", nextCycleStart.Format("2006-01-02 15:04:05"), nextCycleEnd.Format("2006-01-02 15:04:05"))
	err = nextQuery.Order("registered_at DESC").Find(&nextCycleUsers).Error
	if err != nil {
		log.Printf("❌ Error querying next cycle users: %v", err)
		nextCycleUsers = []models.User{} // Set empty slice on error
	} else {
		log.Printf("✅ Found %d users in next cycle", len(nextCycleUsers))
	}

	log.Printf("✅ Returning auto cycle info for message ID=%d", message.ID)
	c.JSON(http.StatusOK, gin.H{
		"auto_cycle_enabled": true,
		"message_info": gin.H{
			"name":        message.Name,
			"send_hour":   message.SendHour,
			"send_minute": message.SendMinute,
			"is_14_hour":  is14HourMessage,
			"cycle_type": func() string {
				if is14HourMessage {
					return "17:00 دیروز - 14:00 امروز"
				} else if is1830Message {
					return "17:00-17:00 (18:30 send)"
				}
				return "17:00-17:00"
			}(),
		},
		"current_cycle": gin.H{
			"cycle_start": currentCycleStart.Format("2006-01-02 15:04:05"),
			"cycle_end":   currentCycleEnd.Format("2006-01-02 15:04:05"),
			"is_sent":     currentCycleSent,
			"sent_at": func() string {
				if currentCycleSent {
					return currentCycleLog.SentAt.Format("2006-01-02 15:04:05")
				} else {
					return ""
				}
			}(),
			"sent_count": func() int {
				if currentCycleSent {
					return currentCycleLog.SentCount
				} else {
					return len(cycleUsers)
				}
			}(),
			"pending_users": func() interface{} {
				if currentCycleSent && len(receivedUsers) > 0 {
					// Return users who received the message
					return receivedUsers
				}
				// Return all users in cycle (for pending cycles or if no received users found)
				type UserDisplay struct {
					ID           uint      `json:"id"`
					FirstName    string    `json:"first_name"`
					LastName     string    `json:"last_name"`
					Phone        string    `json:"phone"`
					RegisteredAt time.Time `json:"registered_at"`
				}
				displayUsers := make([]UserDisplay, len(cycleUsers))
				for i, u := range cycleUsers {
					displayUsers[i] = UserDisplay{
						ID:           u.ID,
						FirstName:    u.FirstName,
						LastName:     u.LastName,
						Phone:        u.Phone,
						RegisteredAt: u.RegisteredAt,
					}
				}
				return displayUsers
			}(),
			"total_users_in_cycle": len(cycleUsers),
		},
		"next_cycle": gin.H{
			"cycle_start": nextCycleStart.Format("2006-01-02 15:04:05"),
			"cycle_end":   nextCycleEnd.Format("2006-01-02 15:04:05"),
			"users_count": len(nextCycleUsers),
			"users": func() []map[string]interface{} {
				usersList := make([]map[string]interface{}, len(nextCycleUsers))
				for i, u := range nextCycleUsers {
					usersList[i] = map[string]interface{}{
						"id":            u.ID,
						"first_name":    u.FirstName,
						"last_name":     u.LastName,
						"phone":         u.Phone,
						"registered_at": u.RegisteredAt,
					}
				}
				return usersList
			}(),
		},
		"cycle_history": cycleHistory,
		"logic_explanation": func() string {
			if is14HourMessage {
				return "این پیام یادآوری ساعت 19:00 در ساعت 14:00 (2 ظهر) ارسال می‌شود.\n\nمنطق چرخه:\n- این پیام فقط برای کاربرانی که از ساعت 17:00 دیروز تا 14:00 امروز ثبت‌نام کرده‌اند ارسال می‌شود\n- کاربرانی که از 14:00 تا 17:00 امروز ثبت‌نام می‌کنند، این پیام را دریافت نمی‌کنند (آنها پیام 17:30 را دریافت می‌کنند)\n- کاربرانی که بعد از 17:00 امروز ثبت‌نام می‌کنند، وارد چرخه بعدی می‌شوند\n- هر چرخه فقط یک بار ارسال می‌شود و پس از ارسال، چرخه بسته می‌شود\n\nمثال:\n- کاربری که دیروز ساعت 18:00 ثبت‌نام می‌کند → امروز ساعت 14:00 پیام یادآوری ساعت 19:00 را دریافت می‌کند\n- کاربری که امروز ساعت 10:00 ثبت‌نام می‌کند → امروز ساعت 14:00 پیام یادآوری ساعت 19:00 را دریافت می‌کند\n- کاربری که امروز ساعت 15:00 ثبت‌نام می‌کند → این پیام را دریافت نمی‌کند (پیام 17:30 را دریافت می‌کند)\n- کاربری که امروز ساعت 18:00 ثبت‌نام می‌کند → وارد چرخه بعدی می‌شود"
			} else if is1830Message {
				return "این پیام یادآوری 30 دقیقه قبل از شروع کارگاه (ساعت 19:00) در ساعت 18:30 ارسال می‌شود.\n\nمنطق چرخه:\n- این پیام مستقل از چرخه 24 ساعته است\n- راس ساعت 18:30 هر روز برای همه کسانی که از 17:00 همان روز تا 17:00 فردا ثبت‌نام کرده‌اند ارسال می‌شود\n- هر روز فقط یک بار در ساعت 18:30 ارسال می‌شود\n- کسانی که در چرخه 17:00 امروز تا 17:00 فردا ثبت‌نام کنند، امروز ساعت 18:30 این پیام را دریافت می‌کنند (اگر بعد از 18:30 ثبت‌نام کنند، فردا ساعت 18:30 دریافت می‌کنند)\n\nمثال:\n- کاربری که امروز ساعت 17:30 ثبت‌نام می‌کند → امروز ساعت 18:30 پیام یادآوری 30 دقیقه قبل را دریافت می‌کند\n- کاربری که امروز ساعت 19:00 ثبت‌نام می‌کند → فردا ساعت 18:30 پیام یادآوری 30 دقیقه قبل را دریافت می‌کند"
			} else {
				return fmt.Sprintf("این پیام در ساعت %02d:%02d ارسال می‌شود.\n\nمنطق چرخه:\n- چرخه از ساعت 17:00 (5 عصر) امروز تا 17:00 فردا است (بازه 24 ساعته)\n- به همه کسانی که در این بازه 24 ساعته ثبت‌نام کرده‌اند پیام ارسال می‌شود\n- هر چرخه فقط یک بار ارسال می‌شود و پس از ارسال، چرخه بسته می‌شود\n- کسانی که بعد از 17:00 فردا ثبت‌نام کنند، در چرخه بعدی (17:00 فردا تا 17:00 پس‌فردا) قرار می‌گیرند\n\nمثال:\n- کاربری که امروز ساعت 20:00 ثبت‌نام می‌کند → امروز ساعت %02d:%02d پیام را دریافت می‌کند (اگر هنوز ساعت ارسال نشده باشد)\n- کاربری که فردا ساعت 10:00 ثبت‌نام می‌کند → فردا ساعت %02d:%02d پیام را دریافت می‌کند", *message.SendHour, *message.SendMinute, *message.SendHour, *message.SendMinute, *message.SendHour, *message.SendMinute)
			}
		}(),
	})
}

// BulkSendPreview returns the count of users that match the bulk send criteria
func (ctrl *SMSMessageController) BulkSendPreview(c *gin.Context) {
	patternCode, err := strconv.Atoi(c.Query("pattern_code"))
	if err != nil || patternCode == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pattern_code"})
		return
	}

	registrationTimeRange := c.DefaultQuery("registration_time_range", "all")
	watchFilter := c.DefaultQuery("watch_filter", "all")
	registrationStartHourStr := c.Query("registration_start_hour")
	registrationEndHourStr := c.Query("registration_end_hour")

	// Get timezone
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}

	// Get date range from registration time range
	startDate, endDate := getDateRangeFromRegistrationRange(registrationTimeRange, loc)

	// Build query
	query := ctrl.DB.Model(&models.User{})
	if !startDate.IsZero() && !endDate.IsZero() {
		query = query.Where("registered_at >= ? AND registered_at <= ?", startDate, endDate)
	}

	// Apply registration hour range filter if specified
	if registrationStartHourStr != "" && registrationEndHourStr != "" {
		startHour, err1 := strconv.Atoi(registrationStartHourStr)
		endHour, err2 := strconv.Atoi(registrationEndHourStr)
		if err1 == nil && err2 == nil {
			if startHour <= endHour {
				// Same day range
				query = query.Where("HOUR(registered_at) >= ? AND HOUR(registered_at) <= ?", startHour, endHour)
			} else {
				// Crosses midnight
				query = query.Where("HOUR(registered_at) >= ? OR HOUR(registered_at) <= ?", startHour, endHour)
			}
		}
	}

	// Get all matching users
	var users []models.User
	if err := query.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query users"})
		return
	}

	// Apply watch filter
	var filteredUsers []models.User
	for _, user := range users {
		var activity models.WebinarActivity
		ctrl.DB.Where("phone = ?", user.Phone).Order("created_at DESC").First(&activity)

		watched := activity.ViewStartTime != nil

		if watchFilter == "all" ||
			(watchFilter == "watched" && watched) ||
			(watchFilter == "not_watched" && !watched) {
			filteredUsers = append(filteredUsers, user)
		}
	}

	c.JSON(http.StatusOK, gin.H{"user_count": len(filteredUsers)})
}

// BulkSend sends SMS to a group of users based on filters
func (ctrl *SMSMessageController) BulkSend(c *gin.Context) {
	var request struct {
		PatternCode           int    `json:"pattern_code" binding:"required"`
		RegistrationTimeRange string `json:"registration_time_range"`
		WatchFilter           string `json:"watch_filter"`
		RegistrationStartHour *int   `json:"registration_start_hour"`
		RegistrationEndHour   *int   `json:"registration_end_hour"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if request.PatternCode == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "pattern_code is required"})
		return
	}

	// Get timezone
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}

	registrationTimeRange := request.RegistrationTimeRange
	if registrationTimeRange == "" {
		registrationTimeRange = "all"
	}
	watchFilter := request.WatchFilter
	if watchFilter == "" {
		watchFilter = "all"
	}

	// Get date range from registration time range
	startDate, endDate := getDateRangeFromRegistrationRange(registrationTimeRange, loc)

	// Build query
	query := ctrl.DB.Model(&models.User{})
	if !startDate.IsZero() && !endDate.IsZero() {
		query = query.Where("registered_at >= ? AND registered_at <= ?", startDate, endDate)
	}

	// Apply registration hour range filter if specified
	if request.RegistrationStartHour != nil && request.RegistrationEndHour != nil {
		startHour := *request.RegistrationStartHour
		endHour := *request.RegistrationEndHour
		if startHour <= endHour {
			// Same day range
			query = query.Where("HOUR(registered_at) >= ? AND HOUR(registered_at) <= ?", startHour, endHour)
		} else {
			// Crosses midnight
			query = query.Where("HOUR(registered_at) >= ? OR HOUR(registered_at) <= ?", startHour, endHour)
		}
	}

	// Get all matching users
	var users []models.User
	if err := query.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query users"})
		return
	}

	// Apply watch filter
	var filteredUsers []models.User
	for _, user := range users {
		var activity models.WebinarActivity
		ctrl.DB.Where("phone = ?", user.Phone).Order("created_at DESC").First(&activity)

		watched := activity.ViewStartTime != nil

		if watchFilter == "all" ||
			(watchFilter == "watched" && watched) ||
			(watchFilter == "not_watched" && !watched) {
			filteredUsers = append(filteredUsers, user)
		}
	}

	// Send SMS to filtered users
	now := time.Now()
	sentCount := 0
	failedCount := 0

	// PERFORMANCE OPTIMIZATION: Collect log entries for batch insert
	logEntries := make([]models.SMSMessageLog, 0, len(filteredUsers))
	const batchSize = 100

	for _, user := range filteredUsers {
		normalizedPhone := utils.NormalizePhoneNumber(user.Phone)

		// Send SMS
		err := ctrl.MelipayamakService.SendPatternSMS(normalizedPhone, request.PatternCode, user.FirstName)

		// Prepare log entry
		logEntry := models.SMSMessageLog{
			SMSMessageID: 0, // Manual send, no message ID
			Recipient:    normalizedPhone,
			Status:       "sent",
			SentAt:       now,
			CreatedAt:    now,
		}

		if err != nil {
			logEntry.Status = "failed"
			logEntry.ErrorMessage = err.Error()
			failedCount++
			log.Printf("❌ Failed to send bulk SMS to %s: %v", normalizedPhone, err)
		} else {
			sentCount++
			log.Printf("✅ Bulk SMS sent to %s (Pattern: %d)", normalizedPhone, request.PatternCode)
		}

		logEntries = append(logEntries, logEntry)

		// PERFORMANCE OPTIMIZATION: Batch insert when batch size is reached
		if len(logEntries) >= batchSize {
			if err := ctrl.DB.CreateInBatches(logEntries, batchSize).Error; err != nil {
				log.Printf("❌ Failed to batch insert SMS logs: %v", err)
			}
			logEntries = logEntries[:0] // Clear slice but keep capacity
		}

		// Small delay to avoid rate limiting
		time.Sleep(100 * time.Millisecond)
	}

	// Insert remaining log entries
	if len(logEntries) > 0 {
		if err := ctrl.DB.CreateInBatches(logEntries, batchSize).Error; err != nil {
			log.Printf("❌ Failed to batch insert remaining SMS logs: %v", err)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"total_count":  len(filteredUsers),
		"sent_count":   sentCount,
		"failed_count": failedCount,
	})
}

// Helper function to get date range from registration time range (copied from scheduler)
func getDateRangeFromRegistrationRange(rangeType string, loc *time.Location) (startDate time.Time, endDate time.Time) {
	now := time.Now().In(loc)

	switch rangeType {
	case "today":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
		endDate = time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, loc)
	case "yesterday":
		yesterday := now.AddDate(0, 0, -1)
		startDate = time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, loc)
		endDate = time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 23, 59, 59, 999999999, loc)
	case "week":
		// This week: from start of week (Saturday) to end of week (Friday)
		startDate = now
		for startDate.Weekday() != time.Saturday {
			startDate = startDate.AddDate(0, 0, -1)
		}
		startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, loc)
		endDate = startDate.AddDate(0, 0, 6)
		endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, loc)
	case "last_week":
		// Last week: from Saturday of last week to Friday of last week
		lastWeek := now.AddDate(0, 0, -7)
		startDate = lastWeek
		for startDate.Weekday() != time.Saturday {
			startDate = startDate.AddDate(0, 0, -1)
		}
		startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, loc)
		endDate = startDate.AddDate(0, 0, 6)
		endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, loc)
	case "month":
		// This month: from start of current month to now
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
		endDate = now
	case "last_month":
		// Last month: from start of last month to end of last month
		firstOfThisMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
		lastMonth := firstOfThisMonth.AddDate(0, -1, 0)
		startDate = time.Date(lastMonth.Year(), lastMonth.Month(), 1, 0, 0, 0, 0, loc)
		endDate = firstOfThisMonth.AddDate(0, 0, -1)
		endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, loc)
	default: // "all"
		// No date filter
		startDate = time.Time{}
		endDate = time.Time{}
	}

	return startDate, endDate
}

// InstantSend sends SMS to a list of phone numbers immediately
// For large batches, this runs in a goroutine to avoid timeout
func (ctrl *SMSMessageController) InstantSend(c *gin.Context) {
	var request struct {
		PatternCode  int      `json:"pattern_code" binding:"required"`
		PhoneNumbers []string `json:"phone_numbers" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if request.PatternCode == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "pattern_code is required"})
		return
	}

	if len(request.PhoneNumbers) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "phone_numbers is required"})
		return
	}

	phoneCount := len(request.PhoneNumbers)
	log.Printf("🚀 Starting instant SMS send - Pattern: %d, Phone count: %d", request.PatternCode, phoneCount)

	// For large batches (>100), process in background and return immediately
	// For smaller batches, process synchronously
	if phoneCount > 100 {
		// Process in background goroutine
		go ctrl.processInstantSend(request.PatternCode, request.PhoneNumbers)

		// Return immediately to avoid timeout
		c.JSON(http.StatusOK, gin.H{
			"message":     "SMS sending started in background",
			"total_count": phoneCount,
			"status":      "processing",
		})
		return
	}

	// For smaller batches, process synchronously
	sentCount, failedCount := ctrl.processInstantSend(request.PatternCode, request.PhoneNumbers)

	c.JSON(http.StatusOK, gin.H{
		"total_count":  phoneCount,
		"sent_count":   sentCount,
		"failed_count": failedCount,
	})
}

// processInstantSend processes the actual SMS sending
func (ctrl *SMSMessageController) processInstantSend(patternCode int, phoneNumbers []string) (sentCount int, failedCount int) {
	now := time.Now()
	sentCount = 0
	failedCount = 0

	// Normalize all phone numbers first
	normalizedPhones := make([]string, len(phoneNumbers))
	for i, phone := range phoneNumbers {
		normalizedPhones[i] = utils.NormalizePhoneNumber(phone)
	}

	// Batch query users from database to reduce DB queries
	// Get all users with matching phone numbers in one query
	var users []models.User
	userMap := make(map[string]models.User)
	if err := ctrl.DB.Where("phone IN ?", normalizedPhones).Find(&users).Error; err == nil {
		for _, user := range users {
			userMap[user.Phone] = user
		}
		log.Printf("📊 Found %d users in database out of %d phone numbers", len(users), len(normalizedPhones))
	}

	// PERFORMANCE OPTIMIZATION: Collect log entries in a slice for batch insert
	logEntries := make([]models.SMSMessageLog, 0, len(normalizedPhones))
	const batchSize = 100 // Insert in batches of 100 to avoid memory issues

	// Process each phone number
	for i, normalizedPhone := range normalizedPhones {
		// Progress log for large batches
		if len(normalizedPhones) > 50 && (i+1)%50 == 0 {
			log.Printf("📊 Progress: %d/%d processed (Sent: %d, Failed: %d)", i+1, len(normalizedPhones), sentCount, failedCount)
		}

		var paramValue string

		// Check if user exists in the map (from batch query)
		if user, exists := userMap[normalizedPhone]; exists {
			if user.FirstName != "" && strings.TrimSpace(user.FirstName) != "" {
				paramValue = strings.TrimSpace(user.FirstName)
			} else {
				paramValue = "کاربر"
			}
		} else {
			paramValue = "کاربر"
		}

		// Send SMS with parameter
		err := ctrl.MelipayamakService.SendPatternSMS(normalizedPhone, patternCode, paramValue)

		// Prepare log entry
		logEntry := models.SMSMessageLog{
			SMSMessageID: 0, // Manual send, no message ID
			Recipient:    normalizedPhone,
			Status:       "sent",
			SentAt:       now,
			CreatedAt:    now,
		}

		if err != nil {
			logEntry.Status = "failed"
			logEntry.ErrorMessage = err.Error()
			failedCount++
			if len(normalizedPhones) <= 10 {
				// Only log details for small batches
				log.Printf("❌ Failed to send SMS to %s (Pattern: %d, Param: '%s'): %v", normalizedPhone, patternCode, paramValue, err)
			}
		} else {
			sentCount++
			if len(normalizedPhones) <= 10 {
				// Only log details for small batches
				log.Printf("✅ SMS sent successfully to %s (Pattern: %d, Param: '%s')", normalizedPhone, patternCode, paramValue)
			}
		}

		logEntries = append(logEntries, logEntry)

		// PERFORMANCE OPTIMIZATION: Batch insert when batch size is reached
		if len(logEntries) >= batchSize {
			if err := ctrl.DB.CreateInBatches(logEntries, batchSize).Error; err != nil {
				log.Printf("❌ Failed to batch insert SMS logs: %v", err)
			}
			logEntries = logEntries[:0] // Clear slice but keep capacity
		}

		// Small delay to avoid rate limiting (reduced for large batches)
		if len(normalizedPhones) > 100 {
			time.Sleep(50 * time.Millisecond) // Faster for large batches
		} else {
			time.Sleep(100 * time.Millisecond)
		}
	}

	// Insert remaining log entries
	if len(logEntries) > 0 {
		if err := ctrl.DB.CreateInBatches(logEntries, batchSize).Error; err != nil {
			log.Printf("❌ Failed to batch insert remaining SMS logs: %v", err)
		}
	}

	log.Printf("✅ Completed instant SMS send - Total: %d, Sent: %d, Failed: %d", len(normalizedPhones), sentCount, failedCount)
	return sentCount, failedCount
}

// SendFarazSMS sends SMS via Faraz SMS service
func (ctrl *SMSMessageController) SendFarazSMS(c *gin.Context) {
	var req struct {
		Recipients []string `json:"recipients" binding:"required"`
		Message    string   `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	if len(req.Recipients) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Recipients list is empty"})
		return
	}

	if req.Message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message cannot be empty"})
		return
	}

	// Check if Faraz SMS service is available
	if ctrl.FarazSMSService == nil {
		log.Printf("❌ Faraz SMS service is nil in controller")
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Faraz SMS service is not configured"})
		return
	}

	log.Printf("📤 Starting Faraz SMS send - Recipients: %v, Message: %s", req.Recipients, req.Message)

	// Send SMS via Faraz SMS service
	err := ctrl.FarazSMSService.SendSimpleSMS(req.Recipients, req.Message)
	if err != nil {
		log.Printf("❌ Failed to send Faraz SMS: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to send SMS",
			"details": err.Error(),
		})
		return
	}

	log.Printf("✅ Successfully sent Faraz SMS to %d recipients", len(req.Recipients))
	c.JSON(http.StatusOK, gin.H{
		"message":    "SMS sent successfully",
		"sent_count": len(req.Recipients),
	})
}
