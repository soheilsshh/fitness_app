package controllers

import (
	"fmt"
	"log"
	"monetizeai-backend/models"
	"monetizeai-backend/services"
	"monetizeai-backend/utils"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AvanakMessageController struct {
	DB            *gorm.DB
	AvanakService *services.AvanakService
}

func NewAvanakMessageController(db *gorm.DB, avanakService *services.AvanakService) *AvanakMessageController {
	return &AvanakMessageController{
		DB:            db,
		AvanakService: avanakService,
	}
}

// GetAvanakMessages returns list of all Avanak messages
func (ctrl *AvanakMessageController) GetAvanakMessages(c *gin.Context) {
	var messages []models.AvanakMessage
	if err := ctrl.DB.Order("created_at DESC").Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch Avanak messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

// GetAvanakMessage returns a single Avanak message by ID
func (ctrl *AvanakMessageController) GetAvanakMessage(c *gin.Context) {
	id := c.Param("id")
	var message models.AvanakMessage
	if err := ctrl.DB.First(&message, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Avanak message not found"})
		return
	}

	c.JSON(http.StatusOK, message)
}

// CreateAvanakMessage creates a new Avanak message
func (ctrl *AvanakMessageController) CreateAvanakMessage(c *gin.Context) {
	var req struct {
		Name                  string     `json:"name" binding:"required"`
		MessageID             int        `json:"message_id" binding:"required"`
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

	message := models.AvanakMessage{
		Name:                  req.Name,
		MessageID:             req.MessageID,
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Avanak message"})
		return
	}

	log.Printf("✅ Avanak message created: ID=%d, Name=%s, MessageID=%d, SendHour=%v, SendMinute=%v",
		message.ID, message.Name, message.MessageID, message.SendHour, message.SendMinute)
	c.JSON(http.StatusOK, message)
}

// UpdateAvanakMessage updates an existing Avanak message
func (ctrl *AvanakMessageController) UpdateAvanakMessage(c *gin.Context) {
	id := c.Param("id")
	var message models.AvanakMessage
	if err := ctrl.DB.First(&message, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Avanak message not found"})
		return
	}

	var req struct {
		Name                  *string    `json:"name"`
		MessageID             *int       `json:"message_id"`
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
	if req.MessageID != nil {
		message.MessageID = *req.MessageID
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
	if req.ScheduledAt != nil {
		message.ScheduledAt = req.ScheduledAt
		// If scheduled_at is set, ensure send_type is scheduled and clear automatic fields
		if message.SendType == "automatic" {
			message.SendType = "scheduled"
			message.SendHour = nil
			message.SendMinute = nil
		}
	}
	if req.SendHour != nil {
		message.SendHour = req.SendHour
		// If send_hour is set, ensure send_type is automatic and clear scheduled_at
		if message.SendType == "scheduled" {
			message.SendType = "automatic"
			message.ScheduledAt = nil
		}
	}
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update Avanak message"})
		return
	}

	log.Printf("✅ Avanak message updated: ID=%d, Name=%s", message.ID, message.Name)
	c.JSON(http.StatusOK, message)
}

// DeleteAvanakMessage deletes an Avanak message
func (ctrl *AvanakMessageController) DeleteAvanakMessage(c *gin.Context) {
	id := c.Param("id")

	// First, delete related cycle logs (foreign key constraint)
	if err := ctrl.DB.Where("avanak_message_id = ?", id).Delete(&models.AvanakMessageCycleLog{}).Error; err != nil {
		log.Printf("⚠️ Failed to delete cycle logs for Avanak message ID=%s: %v", id, err)
		// Continue anyway - might not have cycle logs
	} else {
		log.Printf("🗑️ Deleted cycle logs for Avanak message ID=%s", id)
	}

	// Then, delete related message logs (foreign key constraint)
	if err := ctrl.DB.Where("avanak_message_id = ?", id).Delete(&models.AvanakMessageLog{}).Error; err != nil {
		log.Printf("⚠️ Failed to delete message logs for Avanak message ID=%s: %v", id, err)
		// Continue anyway - might not have message logs
	} else {
		log.Printf("🗑️ Deleted message logs for Avanak message ID=%s", id)
	}

	// Finally, delete the message itself
	if err := ctrl.DB.Delete(&models.AvanakMessage{}, id).Error; err != nil {
		log.Printf("❌ Error deleting Avanak message ID=%s: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete Avanak message"})
		return
	}

	log.Printf("✅ Avanak message deleted: ID=%s", id)
	c.JSON(http.StatusOK, gin.H{"message": "Avanak message deleted successfully"})
}

// GetAvanakMessageLogs returns logs for an Avanak message
func (ctrl *AvanakMessageController) GetAvanakMessageLogs(c *gin.Context) {
	messageID := c.Param("id")
	var logs []models.AvanakMessageLog
	if err := ctrl.DB.Where("avanak_message_id = ?", messageID).
		Order("sent_at DESC").
		Limit(100).
		Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch Avanak message logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"logs": logs})
}

// QuickTestAvanak triggers a direct Avanak quick-send with custom phone/message_id
func (ctrl *AvanakMessageController) QuickTestAvanak(c *gin.Context) {
	if !HasPermission(c, ctrl.DB, models.PermissionAvanakView) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var req struct {
		Phone     string `json:"phone" binding:"required"`
		MessageID int    `json:"message_id" binding:"required"`
		Token     string `json:"token"` // اختیاری برای تست با توکن جدید
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "درخواست نامعتبر", "details": err.Error()})
		return
	}

	normalized := utils.NormalizePhoneNumber(req.Phone)
	if req.MessageID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "کد آوانک الزامی است", "details": "message_id باید بزرگتر از صفر باشد"})
		return
	}

	if ctrl.AvanakService == nil || ctrl.AvanakService.GetConfig() == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "سرویس آوانک مقداردهی نشده", "details": "AvanakService یا تنظیمات یافت نشد"})
		return
	}

	cfg := ctrl.AvanakService.GetConfig()
	diag := gin.H{
		"enabled":        cfg.Enabled,
		"token_present":  strings.TrimSpace(cfg.Token) != "",
		"config_message": cfg.MessageID,
	}

	// اگر توکن تست ارسال شده، به صورت موقت روی کانفیگ ست می‌کنیم تا تست با همین توکن انجام شود
	if strings.TrimSpace(req.Token) != "" {
		cfg.Token = strings.TrimSpace(req.Token)
		diag["token_present"] = true
		diag["token_override"] = true
	}

	if !cfg.Enabled {
		// برای تست فوری، اگر غیرفعال است به طور موقت فعال می‌کنیم تا ارسال انجام شود
		log.Printf("ℹ️ QuickTestAvanak: Avanak is disabled in config, forcing enable for test")
		cfg.Enabled = true
	}
	if strings.TrimSpace(cfg.Token) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "توکن آوانک ست نشده",
			"details": "در تنظیمات Avanak مقدار Token را وارد کنید",
			"diag":    diag,
		})
		return
	}

	err := ctrl.AvanakService.SendVoiceCall(normalized, req.MessageID)
	if err != nil {
		log.Printf("❌ QuickTestAvanak failed (phone=%s, normalized=%s, messageID=%d): %v", req.Phone, normalized, req.MessageID, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":          false,
			"error":            "ارسال ناموفق بود",
			"details":          err.Error(),
			"normalized_phone": normalized,
			"message_id":       req.MessageID,
		})
		return
	}

	log.Printf("✅ QuickTestAvanak sent (phone=%s, normalized=%s, messageID=%d)", req.Phone, normalized, req.MessageID)
	c.JSON(http.StatusOK, gin.H{
		"success":          true,
		"message":          "ارسال آزمایشی با موفقیت انجام شد",
		"normalized_phone": normalized,
		"message_id":       req.MessageID,
	})
}

// ListAvanakLogs returns paginated Avanak logs with filters (recipient/status/message_name)
func (ctrl *AvanakMessageController) ListAvanakLogs(c *gin.Context) {
	if !HasPermission(c, ctrl.DB, models.PermissionAvanakView) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if page < 1 {
		page = 1
	}
	if limit <= 0 || limit > 200 {
		limit = 50
	}

	status := strings.TrimSpace(c.Query("status"))       // sent | failed
	recipient := strings.TrimSpace(c.Query("recipient")) // partial match
	messageName := strings.TrimSpace(c.Query("message")) // partial match on message name
	messageIDFilter := strings.TrimSpace(c.Query("mid")) // exact match on avanak message_id

	type result struct {
		ID              uint      `json:"id"`
		AvanakMessageID uint      `json:"avanak_message_id"`
		MessageName     string    `json:"message_name"`
		MessageID       int       `json:"message_id"`
		Recipient       string    `json:"recipient"`
		Status          string    `json:"status"`
		ErrorMessage    string    `json:"error_message"`
		SentAt          time.Time `json:"sent_at"`
	}

	query := ctrl.DB.Table("avanak_message_logs AS l").
		Select("l.id, l.avanak_message_id, m.name AS message_name, m.message_id, l.recipient, l.status, l.error_message, l.sent_at").
		Joins("LEFT JOIN avanak_messages m ON m.id = l.avanak_message_id")

	if status != "" {
		query = query.Where("l.status = ?", status)
	}
	if recipient != "" {
		query = query.Where("l.recipient LIKE ?", "%"+recipient+"%")
	}
	if messageName != "" {
		query = query.Where("m.name LIKE ?", "%"+messageName+"%")
	}
	if messageIDFilter != "" {
		query = query.Where("m.message_id = ?", messageIDFilter)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count Avanak logs"})
		return
	}

	var rows []result
	if err := query.Order("l.sent_at DESC").Offset((page - 1) * limit).Limit(limit).Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch Avanak logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    rows,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total_count": total,
		},
	})
}

// TestAvanakMessage sends a test voice call
func (ctrl *AvanakMessageController) TestAvanakMessage(c *gin.Context) {
	var req struct {
		MessageID int    `json:"message_id" binding:"required"`
		Phone     string `json:"phone" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	var message models.AvanakMessage
	if err := ctrl.DB.First(&message, req.MessageID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Avanak message not found"})
		return
	}

	// Normalize phone number
	normalizedPhone := utils.NormalizePhoneNumber(req.Phone)

	// Send test voice call using the message's MessageID
	err := ctrl.AvanakService.SendVoiceCall(normalizedPhone, message.MessageID)

	// Log the test send attempt
	logEntry := models.AvanakMessageLog{
		AvanakMessageID: message.ID,
		Recipient:       normalizedPhone,
		Status:          "sent",
		SentAt:          time.Now(),
		CreatedAt:       time.Now(),
	}
	if err != nil {
		logEntry.Status = "failed"
		logEntry.ErrorMessage = err.Error()
		log.Printf("❌ Test Avanak voice call failed: %v", err)
	} else {
		log.Printf("✅ Test Avanak voice call sent successfully to %s", normalizedPhone)
	}

	ctrl.DB.Create(&logEntry)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to send test voice call",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Test voice call sent successfully",
		"log":     logEntry,
	})
}

// ToggleAutoCycle toggles the auto cycle enabled status for an Avanak message
func (ctrl *AvanakMessageController) ToggleAutoCycle(c *gin.Context) {
	id := c.Param("id")
	var message models.AvanakMessage
	if err := ctrl.DB.First(&message, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Avanak message not found"})
		return
	}

	// Toggle the auto cycle enabled status
	message.AutoCycleEnabled = !message.AutoCycleEnabled
	message.UpdatedAt = time.Now()

	if err := ctrl.DB.Save(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update auto cycle status"})
		return
	}

	log.Printf("✅ Avanak message auto cycle toggled: ID=%d, AutoCycleEnabled=%v", message.ID, message.AutoCycleEnabled)
	c.JSON(http.StatusOK, message)
}

// GetAutoCycleInfo returns information about auto cycle status, pending users, and cycle history for Avanak
func (ctrl *AvanakMessageController) GetAutoCycleInfo(c *gin.Context) {
	id := c.Param("id")
	log.Printf("🔍 GetAutoCycleInfo called for Avanak message ID: %s", id)

	var message models.AvanakMessage
	if err := ctrl.DB.First(&message, id).Error; err != nil {
		log.Printf("❌ Avanak message not found: ID=%s, Error=%v", id, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Avanak message not found"})
		return
	}

	log.Printf("✅ Avanak message found: ID=%d, Name=%s, AutoCycleEnabled=%v", message.ID, message.Name, message.AutoCycleEnabled)

	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}

	now := time.Now().In(loc)

	// Check if auto cycle is enabled
	hasRequiredFields := message.SendHour != nil && message.SendMinute != nil
	if !message.AutoCycleEnabled {
		log.Printf("ℹ️  Auto cycle not enabled for Avanak message ID=%d", message.ID)
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
		log.Printf("ℹ️  Auto cycle enabled but missing required fields for Avanak message ID=%d (SendHour=%v, SendMinute=%v)",
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

	// Check if current cycle has been sent (use tracking dates)
	var currentCycleLog models.AvanakMessageCycleLog
	checkCycleStart := cycleTrackingStart
	checkCycleEnd := cycleTrackingEnd
	currentCycleSent := ctrl.DB.Where("avanak_message_id = ? AND cycle_start = ? AND cycle_end = ?", message.ID, checkCycleStart, checkCycleEnd).First(&currentCycleLog).Error == nil

	// Get users in current cycle
	var cycleUsers []models.User
	query := ctrl.DB.Model(&models.User{})
	if is14HourMessage {
		// Only users from 17:00 yesterday to 14:00 today
		query = query.Where("registered_at >= ? AND registered_at < ?", currentCycleStart, currentCycleEnd)
	} else if is1830Message {
		// For 18:30 message: Include users from 17:00 today to 17:00 tomorrow
		query = query.Where("registered_at >= ? AND registered_at < ?", currentCycleStart, currentCycleEnd)
	} else {
		query = query.Where("registered_at >= ? AND registered_at < ?", currentCycleStart, currentCycleEnd)
	}

	log.Printf("📋 Querying users for Avanak cycle: %s to %s", currentCycleStart.Format("2006-01-02 15:04:05"), currentCycleEnd.Format("2006-01-02 15:04:05"))
	err = query.Order("registered_at DESC").Find(&cycleUsers).Error
	if err != nil {
		log.Printf("❌ Error querying cycle users: %v", err)
		cycleUsers = []models.User{} // Set empty slice on error
	} else {
		log.Printf("✅ Found %d users in current Avanak cycle", len(cycleUsers))
	}

	// If cycle is sent, get users who actually received the call from logs
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
		// Get users who received Avanak call in this cycle from logs
		var logs []models.AvanakMessageLog
		ctrl.DB.Where("avanak_message_id = ? AND sent_at >= ? AND sent_at <= ?",
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
	var cycleLogs []models.AvanakMessageCycleLog
	ctrl.DB.Where("avanak_message_id = ?", message.ID).
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
			IsCurrent:   log.CycleStart.Equal(checkCycleStart) && log.CycleEnd.Equal(checkCycleEnd),
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
		nextCycleEnd = time.Date(now.Year(), now.Month(), now.Day(), 14, 0, 0, 0, loc).AddDate(0, 0, 1)
	} else if is1830Message {
		nextCycleStart = currentCycleEnd
		nextCycleEnd = currentCycleEnd.AddDate(0, 0, 1)
	} else {
		nextCycleStart = currentCycleEnd
		nextCycleEnd = currentCycleEnd.AddDate(0, 0, 1)
	}

	var nextCycleUsers []models.User
	nextQuery := ctrl.DB.Model(&models.User{}).Where("registered_at >= ? AND registered_at < ?", nextCycleStart, nextCycleEnd)
	log.Printf("📋 Querying users for next Avanak cycle: %s to %s", nextCycleStart.Format("2006-01-02 15:04:05"), nextCycleEnd.Format("2006-01-02 15:04:05"))
	err = nextQuery.Order("registered_at DESC").Find(&nextCycleUsers).Error
	if err != nil {
		log.Printf("❌ Error querying next cycle users: %v", err)
		nextCycleUsers = []models.User{} // Set empty slice on error
	} else {
		log.Printf("✅ Found %d users in next Avanak cycle", len(nextCycleUsers))
	}

	log.Printf("✅ Returning auto cycle info for Avanak message ID=%d", message.ID)
	c.JSON(http.StatusOK, gin.H{
		"auto_cycle_enabled": true,
		"message_info": gin.H{
			"name":        message.Name,
			"send_hour":   message.SendHour,
			"send_minute": message.SendMinute,
			"is_14_hour":  is14HourMessage,
			"is_18_30":    is1830Message,
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
				return "این پیام یادآوری صوتی ساعت 19:00 در ساعت 14:00 (2 ظهر) ارسال می‌شود.\n\nمنطق چرخه:\n- این پیام فقط برای کاربرانی که از ساعت 17:00 دیروز تا 14:00 امروز ثبت‌نام کرده‌اند ارسال می‌شود\n- کاربرانی که از 14:00 تا 17:00 امروز ثبت‌نام می‌کنند، این پیام را دریافت نمی‌کنند (آنها پیام 17:30 را دریافت می‌کنند)\n- کاربرانی که بعد از 17:00 امروز ثبت‌نام می‌کنند، وارد چرخه بعدی می‌شوند\n- هر چرخه فقط یک بار ارسال می‌شود و پس از ارسال، چرخه بسته می‌شود\n\nمثال:\n- کاربری که دیروز ساعت 18:00 ثبت‌نام می‌کند → امروز ساعت 14:00 پیام یادآوری صوتی ساعت 19:00 را دریافت می‌کند\n- کاربری که امروز ساعت 10:00 ثبت‌نام می‌کند → امروز ساعت 14:00 پیام یادآوری صوتی ساعت 19:00 را دریافت می‌کند\n- کاربری که امروز ساعت 15:00 ثبت‌نام می‌کند → این پیام را دریافت نمی‌کند (پیام 17:30 را دریافت می‌کند)\n- کاربری که امروز ساعت 18:00 ثبت‌نام می‌کند → وارد چرخه بعدی می‌شود"
			} else if is1830Message {
				return "این پیام یادآوری صوتی 30 دقیقه قبل از شروع کارگاه (ساعت 19:00) در ساعت 18:30 ارسال می‌شود.\n\nمنطق چرخه:\n- این پیام مستقل از چرخه 24 ساعته است\n- راس ساعت 18:30 هر روز برای همه کسانی که از 17:00 همان روز تا 17:00 فردا ثبت‌نام کرده‌اند ارسال می‌شود\n- هر روز فقط یک بار در ساعت 18:30 ارسال می‌شود\n- کسانی که در چرخه 17:00 امروز تا 17:00 فردا ثبت‌نام کنند، امروز ساعت 18:30 این پیام را دریافت می‌کنند (اگر بعد از 18:30 ثبت‌نام کنند، فردا ساعت 18:30 دریافت می‌کنند)\n\nمثال:\n- کاربری که امروز ساعت 17:30 ثبت‌نام می‌کند → امروز ساعت 18:30 پیام یادآوری صوتی 30 دقیقه قبل را دریافت می‌کند\n- کاربری که امروز ساعت 19:00 ثبت‌نام می‌کند → فردا ساعت 18:30 پیام یادآوری صوتی 30 دقیقه قبل را دریافت می‌کند"
			} else {
				return fmt.Sprintf("این پیام صوتی در ساعت %02d:%02d ارسال می‌شود.\n\nمنطق چرخه:\n- چرخه از ساعت 17:00 (5 عصر) امروز تا 17:00 فردا است (بازه 24 ساعته)\n- به همه کسانی که در این بازه 24 ساعته ثبت‌نام کرده‌اند پیام صوتی ارسال می‌شود\n- هر چرخه فقط یک بار ارسال می‌شود و پس از ارسال، چرخه بسته می‌شود\n- کسانی که بعد از 17:00 فردا ثبت‌نام کنند، در چرخه بعدی (17:00 فردا تا 17:00 پس‌فردا) قرار می‌گیرند\n\nمثال:\n- کاربری که امروز ساعت 20:00 ثبت‌نام می‌کند → امروز ساعت %02d:%02d پیام صوتی را دریافت می‌کند (اگر هنوز ساعت ارسال نشده باشد)\n- کاربری که فردا ساعت 10:00 ثبت‌نام می‌کند → فردا ساعت %02d:%02d پیام صوتی را دریافت می‌کند", *message.SendHour, *message.SendMinute, *message.SendHour, *message.SendMinute, *message.SendHour, *message.SendMinute)
			}
		}(),
	})
}
