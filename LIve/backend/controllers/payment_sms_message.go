package controllers

import (
	"log"
	"fitino-live-backend/models"
	"fitino-live-backend/services"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PaymentSMSMessageController struct {
	DB              *gorm.DB
	FarazSMSService *services.FarazSMSService
}

func NewPaymentSMSMessageController(db *gorm.DB, farazSMSService *services.FarazSMSService) *PaymentSMSMessageController {
	return &PaymentSMSMessageController{
		DB:              db,
		FarazSMSService: farazSMSService,
	}
}

// GetPaymentSMSMessages returns all payment SMS message configurations
func (ctrl *PaymentSMSMessageController) GetPaymentSMSMessages(c *gin.Context) {
	var messages []models.PaymentSMSMessage
	if err := ctrl.DB.Order("trigger_type ASC, delay_minutes ASC").Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payment SMS messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

// GetPaymentSMSMessage returns a single payment SMS message by ID
func (ctrl *PaymentSMSMessageController) GetPaymentSMSMessage(c *gin.Context) {
	id := c.Param("id")
	var message models.PaymentSMSMessage
	if err := ctrl.DB.First(&message, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment SMS message not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payment SMS message"})
		return
	}

	c.JSON(http.StatusOK, message)
}

// CreatePaymentSMSMessage creates a new payment SMS message configuration
func (ctrl *PaymentSMSMessageController) CreatePaymentSMSMessage(c *gin.Context) {
	var req struct {
		TriggerType  string `json:"trigger_type" binding:"required"`
		DelayMinutes int    `json:"delay_minutes" binding:"required,min=0"`
		MessageText  string `json:"message_text" binding:"required"`
		IsActive     bool   `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Validate trigger type
	triggerType := models.PaymentSMSTriggerType(req.TriggerType)
	validTriggers := []models.PaymentSMSTriggerType{
		models.PaymentSMSTriggerClickedCardToCard,
		models.PaymentSMSTriggerCopiedCardToCard,
		models.PaymentSMSTriggerClickedInstallment,
		models.PaymentSMSTriggerCopiedInstallmentCard,
		models.PaymentSMSTriggerClickedPaymentButton,
		models.PaymentSMSTriggerEnteredLanding,
	}
	isValid := false
	for _, vt := range validTriggers {
		if triggerType == vt {
			isValid = true
			break
		}
	}
	if !isValid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid trigger type"})
		return
	}

	// Check if combination of trigger_type and delay_minutes already exists
	var existing models.PaymentSMSMessage
	if err := ctrl.DB.Where("trigger_type = ? AND delay_minutes = ?", triggerType, req.DelayMinutes).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "A message with this trigger type and delay already exists"})
		return
	}

	message := models.PaymentSMSMessage{
		TriggerType:  triggerType,
		DelayMinutes: req.DelayMinutes,
		MessageText:  req.MessageText,
		IsActive:     req.IsActive,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := ctrl.DB.Create(&message).Error; err != nil {
		log.Printf("❌ Failed to create payment SMS message: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment SMS message"})
		return
	}

	log.Printf("✅ Payment SMS message created: ID=%d, TriggerType=%s, DelayMinutes=%d", message.ID, message.TriggerType, message.DelayMinutes)
	c.JSON(http.StatusOK, message)
}

// UpdatePaymentSMSMessage updates an existing payment SMS message
func (ctrl *PaymentSMSMessageController) UpdatePaymentSMSMessage(c *gin.Context) {
	id := c.Param("id")
	var message models.PaymentSMSMessage
	if err := ctrl.DB.First(&message, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment SMS message not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payment SMS message"})
		return
	}

	var req struct {
		TriggerType  *string `json:"trigger_type"`
		DelayMinutes *int    `json:"delay_minutes"`
		MessageText  *string `json:"message_text"`
		IsActive     *bool   `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Update fields if provided
	if req.TriggerType != nil {
		triggerType := models.PaymentSMSTriggerType(*req.TriggerType)
		// Validate trigger type if changed
		validTriggers := []models.PaymentSMSTriggerType{
			models.PaymentSMSTriggerClickedCardToCard,
			models.PaymentSMSTriggerCopiedCardToCard,
			models.PaymentSMSTriggerClickedInstallment,
			models.PaymentSMSTriggerCopiedInstallmentCard,
			models.PaymentSMSTriggerClickedPaymentButton,
			models.PaymentSMSTriggerEnteredLanding,
		}
		isValid := false
		for _, vt := range validTriggers {
			if triggerType == vt {
				isValid = true
				break
			}
		}
		if !isValid {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid trigger type"})
			return
		}
		message.TriggerType = triggerType
	}

	if req.DelayMinutes != nil {
		if *req.DelayMinutes < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Delay minutes cannot be negative"})
			return
		}
		message.DelayMinutes = *req.DelayMinutes
	}

	if req.MessageText != nil {
		message.MessageText = *req.MessageText
	}

	if req.IsActive != nil {
		message.IsActive = *req.IsActive
	}

	// Check if combination of trigger_type and delay_minutes already exists (excluding current record)
	var existing models.PaymentSMSMessage
	if err := ctrl.DB.Where("trigger_type = ? AND delay_minutes = ? AND id != ?", message.TriggerType, message.DelayMinutes, message.ID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "A message with this trigger type and delay already exists"})
		return
	}

	message.UpdatedAt = time.Now()

	if err := ctrl.DB.Save(&message).Error; err != nil {
		log.Printf("❌ Failed to update payment SMS message: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment SMS message"})
		return
	}

	log.Printf("✅ Payment SMS message updated: ID=%d", message.ID)
	c.JSON(http.StatusOK, message)
}

// DeletePaymentSMSMessage deletes a payment SMS message
func (ctrl *PaymentSMSMessageController) DeletePaymentSMSMessage(c *gin.Context) {
	id := c.Param("id")
	var message models.PaymentSMSMessage
	if err := ctrl.DB.First(&message, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment SMS message not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payment SMS message"})
		return
	}

	if err := ctrl.DB.Delete(&message).Error; err != nil {
		log.Printf("❌ Failed to delete payment SMS message: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete payment SMS message"})
		return
	}

	log.Printf("✅ Payment SMS message deleted: ID=%d", message.ID)
	c.JSON(http.StatusOK, gin.H{"message": "Payment SMS message deleted successfully"})
}

// GetPaymentSMSMessageLogs returns logs for payment SMS messages
func (ctrl *PaymentSMSMessageController) GetPaymentSMSMessageLogs(c *gin.Context) {
	var logs []models.PaymentSMSMessageLog
	query := ctrl.DB.Preload("PaymentSMSMessage").Preload("LandingActivity").Order("created_at DESC")

	// Optional filters
	if phone := c.Query("phone"); phone != "" {
		query = query.Where("phone = ?", phone)
	}
	if triggerType := c.Query("trigger_type"); triggerType != "" {
		query = query.Where("trigger_type = ?", triggerType)
	}
	if success := c.Query("success"); success != "" {
		if success == "true" {
			query = query.Where("success = ?", true)
		} else if success == "false" {
			query = query.Where("success = ?", false)
		}
	}

	// Limit results
	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 1000 {
			limit = parsed
		}
	}
	query = query.Limit(limit)

	if err := query.Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payment SMS message logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"logs": logs})
}

// ProcessPaymentSMSTriggers processes landing activities and creates scheduled SMS messages
// This should be called whenever a landing activity status is updated
// If FarazSMSService is nil, it will only create log entries without sending
func (ctrl *PaymentSMSMessageController) ProcessPaymentSMSTriggers(landingActivityID uint, triggerType models.PaymentSMSTriggerType, phone string) error {
	log.Printf("🔔 Processing payment SMS trigger: LandingActivityID=%d, TriggerType=%s, Phone=%s", landingActivityID, triggerType, phone)

	// Find all active payment SMS messages for this trigger type
	var messages []models.PaymentSMSMessage
	if err := ctrl.DB.Where("trigger_type = ? AND is_active = ?", triggerType, true).Find(&messages).Error; err != nil {
		log.Printf("❌ Failed to find payment SMS messages for trigger %s: %v", triggerType, err)
		return err
	}

	if len(messages) == 0 {
		log.Printf("ℹ️  No active payment SMS messages found for trigger type: %s", triggerType)
		return nil
	}

	log.Printf("📋 Found %d active payment SMS message(s) for trigger %s", len(messages), triggerType)

	now := time.Now()
	twentyFourHoursAgo := now.Add(-24 * time.Hour)

	for _, msg := range messages {
		// Check if a message was already sent/triggered for this phone and trigger type in the last 24 hours
		// This prevents duplicate sends if user triggers multiple times
		var existingLog models.PaymentSMSMessageLog
		existsQuery := ctrl.DB.Where("phone = ? AND trigger_type = ? AND created_at >= ?", 
			phone, triggerType, twentyFourHoursAgo).First(&existingLog)

		if existsQuery.Error == nil {
			// A log entry exists in the last 24 hours for this phone and trigger type
			// Skip creating a new log entry to prevent duplicate sends
			log.Printf("⏭️  Skipping payment SMS: Phone=%s, TriggerType=%s - Already triggered/sent in last 24 hours (existing log ID: %d, created at: %s)",
				phone, triggerType, existingLog.ID, existingLog.CreatedAt.Format(time.RFC3339))
			continue
		}

		// No existing log entry in last 24 hours, proceed to create new log entry
		// Calculate scheduled send time
		scheduledSendTime := now.Add(time.Duration(msg.DelayMinutes) * time.Minute)

		// Create log entry
		logEntry := models.PaymentSMSMessageLog{
			PaymentSMSMessageID: msg.ID,
			LandingActivityID:   &landingActivityID,
			Phone:               phone,
			TriggerType:         triggerType,
			MessageText:         msg.MessageText,
			TriggeredAt:         now,
			ScheduledSendTime:   scheduledSendTime,
			CreatedAt:           now,
		}

		if err := ctrl.DB.Create(&logEntry).Error; err != nil {
			log.Printf("❌ Failed to create payment SMS log entry for message ID %d: %v", msg.ID, err)
			continue
		}

		log.Printf("✅ Scheduled payment SMS: LogID=%d, Trigger=%s, Phone=%s, ScheduledTime=%s, Delay=%d minutes, MessageID=%d",
			logEntry.ID, triggerType, phone, scheduledSendTime.Format(time.RFC3339), msg.DelayMinutes, msg.ID)
	}

	return nil
}

// TestTrigger is a test endpoint to manually trigger payment SMS processing
func (ctrl *PaymentSMSMessageController) TestTrigger(c *gin.Context) {
	var req struct {
		Phone       string `json:"phone" binding:"required"`
		TriggerType string `json:"trigger_type" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Create a dummy landing activity ID (0 means test)
	dummyActivityID := uint(0)
	triggerType := models.PaymentSMSTriggerType(req.TriggerType)

	log.Printf("🧪 TEST: Manual trigger test - Phone=%s, TriggerType=%s", req.Phone, triggerType)

	if err := ctrl.ProcessPaymentSMSTriggers(dummyActivityID, triggerType, req.Phone); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process trigger: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Trigger processed successfully", "phone": req.Phone, "trigger_type": req.TriggerType})
}

