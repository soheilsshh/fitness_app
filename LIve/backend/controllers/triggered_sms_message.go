package controllers

import (
	"encoding/json"
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

type TriggeredSMSMessageController struct {
	DB                 *gorm.DB
	MelipayamakService *services.MelipayamakService
}

func NewTriggeredSMSMessageController(db *gorm.DB, melipayamakService *services.MelipayamakService) *TriggeredSMSMessageController {
	return &TriggeredSMSMessageController{
		DB:                 db,
		MelipayamakService: melipayamakService,
	}
}

// GetTriggeredSMSMessages returns list of all triggered SMS messages
func (ctrl *TriggeredSMSMessageController) GetTriggeredSMSMessages(c *gin.Context) {
	var messages []models.TriggeredSMSMessage
	if err := ctrl.DB.Order("created_at DESC").Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch triggered SMS messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

// GetTriggeredSMSMessage returns a single triggered SMS message by ID
func (ctrl *TriggeredSMSMessageController) GetTriggeredSMSMessage(c *gin.Context) {
	id := c.Param("id")
	var message models.TriggeredSMSMessage
	if err := ctrl.DB.First(&message, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Triggered SMS message not found"})
		return
	}

	c.JSON(http.StatusOK, message)
}

// CreateTriggeredSMSMessage creates a new triggered SMS message
func (ctrl *TriggeredSMSMessageController) CreateTriggeredSMSMessage(c *gin.Context) {
	var req struct {
		Name        string `json:"name" binding:"required"`
		TriggerType string `json:"trigger_type" binding:"required"` // e.g., "license_assigned"
		PatternCode int    `json:"pattern_code" binding:"required"`
		MessageText string `json:"message_text"`
		IsActive    bool   `json:"is_active"`
		Params      string `json:"params"` // JSON string describing parameter mapping
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Validate params JSON
	if req.Params != "" {
		var paramsMap map[string]interface{}
		if err := json.Unmarshal([]byte(req.Params), &paramsMap); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid params JSON: " + err.Error()})
			return
		}
	}

	message := models.TriggeredSMSMessage{
		Name:        req.Name,
		TriggerType: req.TriggerType,
		PatternCode: req.PatternCode,
		MessageText: req.MessageText,
		IsActive:    req.IsActive,
		Params:      req.Params,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := ctrl.DB.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create triggered SMS message"})
		return
	}

	log.Printf("✅ Triggered SMS message created: ID=%d, Name=%s, TriggerType=%s, PatternCode=%d",
		message.ID, message.Name, message.TriggerType, message.PatternCode)
	c.JSON(http.StatusOK, message)
}

// UpdateTriggeredSMSMessage updates an existing triggered SMS message
func (ctrl *TriggeredSMSMessageController) UpdateTriggeredSMSMessage(c *gin.Context) {
	id := c.Param("id")
	var message models.TriggeredSMSMessage
	if err := ctrl.DB.First(&message, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Triggered SMS message not found"})
		return
	}

	var req struct {
		Name        *string `json:"name"`
		TriggerType *string `json:"trigger_type"`
		PatternCode *int    `json:"pattern_code"`
		MessageText *string `json:"message_text"`
		IsActive    *bool   `json:"is_active"`
		Params      *string `json:"params"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if req.Name != nil {
		message.Name = *req.Name
	}
	if req.TriggerType != nil {
		message.TriggerType = *req.TriggerType
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
	if req.Params != nil {
		// Validate params JSON
		if *req.Params != "" {
			var paramsMap map[string]interface{}
			if err := json.Unmarshal([]byte(*req.Params), &paramsMap); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid params JSON: " + err.Error()})
				return
			}
		}
		message.Params = *req.Params
	}
	message.UpdatedAt = time.Now()

	if err := ctrl.DB.Save(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update triggered SMS message"})
		return
	}

	log.Printf("✅ Triggered SMS message updated: ID=%d, Name=%s", message.ID, message.Name)
	c.JSON(http.StatusOK, message)
}

// DeleteTriggeredSMSMessage deletes a triggered SMS message
func (ctrl *TriggeredSMSMessageController) DeleteTriggeredSMSMessage(c *gin.Context) {
	id := c.Param("id")
	
	messageID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message ID"})
		return
	}

	var message models.TriggeredSMSMessage
	if err := ctrl.DB.First(&message, messageID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Triggered SMS message not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find triggered SMS message: " + err.Error()})
		return
	}

	// Delete all related logs first
	if err := ctrl.DB.Unscoped().Where("triggered_sms_message_id = ?", messageID).Delete(&models.TriggeredSMSMessageLog{}).Error; err != nil {
		log.Printf("⚠️  Warning: Failed to delete logs for triggered SMS message ID %d: %v", messageID, err)
	}

	// Delete the message
	if err := ctrl.DB.Unscoped().Delete(&message).Error; err != nil {
		log.Printf("❌ Failed to delete triggered SMS message ID %d: %v", messageID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete triggered SMS message: " + err.Error()})
		return
	}

	log.Printf("✅ Triggered SMS message deleted: ID=%d, Name=%s", messageID, message.Name)
	c.JSON(http.StatusOK, gin.H{"message": "Triggered SMS message deleted successfully"})
}

// GetTriggeredSMSMessageLogs returns logs for a triggered SMS message
func (ctrl *TriggeredSMSMessageController) GetTriggeredSMSMessageLogs(c *gin.Context) {
	messageID := c.Param("id")
	var logs []models.TriggeredSMSMessageLog
	if err := ctrl.DB.Where("triggered_sms_message_id = ?", messageID).
		Order("sent_at DESC").
		Limit(100).
		Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch triggered SMS message logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"logs": logs})
}

// TestTriggeredSMSMessage sends a test triggered SMS message
func (ctrl *TriggeredSMSMessageController) TestTriggeredSMSMessage(c *gin.Context) {
	var req struct {
		MessageID int                    `json:"message_id" binding:"required"`
		Phone     string                 `json:"phone" binding:"required"`
		TestData  map[string]interface{} `json:"test_data"` // Test data for parameter substitution
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	var message models.TriggeredSMSMessage
	if err := ctrl.DB.First(&message, req.MessageID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Triggered SMS message not found"})
		return
	}

	// Normalize phone number
	normalizedPhone := utils.NormalizePhoneNumber(req.Phone)

	// Parse params and build parameter array
	var params []string
	if message.Params != "" {
		var paramsMap map[string]string
		if err := json.Unmarshal([]byte(message.Params), &paramsMap); err == nil {
			// Build params array in order (0, 1, 2, ...)
			for i := 0; i < len(paramsMap); i++ {
				key := strconv.Itoa(i)
				if paramPath, exists := paramsMap[key]; exists {
					// Extract value from test_data using paramPath (e.g., "user.first_name")
					value := extractValueFromPath(req.TestData, paramPath)
					params = append(params, value)
				}
			}
		}
	}

	// Send test SMS
	err := ctrl.MelipayamakService.SendPatternSMS(normalizedPhone, message.PatternCode, params...)

	// Log the test send attempt
	triggerDataJSON, _ := json.Marshal(req.TestData)
	logEntry := models.TriggeredSMSMessageLog{
		TriggeredSMSMessageID: message.ID,
		Recipient:            normalizedPhone,
		Status:               "sent",
		TriggerData:          string(triggerDataJSON),
		SentAt:               time.Now(),
		CreatedAt:            time.Now(),
	}

	if err != nil {
		logEntry.Status = "failed"
		logEntry.ErrorMessage = err.Error()
		log.Printf("❌ Failed to send test triggered SMS: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send test SMS: " + err.Error()})
		return
	}

	ctrl.DB.Create(&logEntry)
	log.Printf("✅ Test triggered SMS sent successfully to %s (Pattern: %d)", normalizedPhone, message.PatternCode)
	c.JSON(http.StatusOK, gin.H{"message": "Test SMS sent successfully"})
}

// SendTriggeredSMS sends a triggered SMS message when a trigger event occurs
// This is called internally by other controllers (e.g., license controller)
func (ctrl *TriggeredSMSMessageController) SendTriggeredSMS(triggerType string, triggerData map[string]interface{}) error {
	// Find active triggered messages for this trigger type
	var messages []models.TriggeredSMSMessage
	if err := ctrl.DB.Where("trigger_type = ? AND is_active = ?", triggerType, true).Find(&messages).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil // No messages configured for this trigger
		}
		return err
	}

	if len(messages) == 0 {
		return nil // No active messages for this trigger
	}

	// Extract phone number from trigger data
	phone, ok := triggerData["phone"].(string)
	if !ok {
		log.Printf("⚠️  No phone number in trigger data for trigger type: %s", triggerType)
		return nil
	}

	normalizedPhone := utils.NormalizePhoneNumber(phone)

	// Send SMS for each active message
	for _, message := range messages {
		// Parse params and build parameter array
		var params []string
		if message.Params != "" {
			var paramsMap map[string]string
			if err := json.Unmarshal([]byte(message.Params), &paramsMap); err == nil {
				// Build params array in order (0, 1, 2, ...)
				maxIndex := 0
				for key := range paramsMap {
					if idx, err := strconv.Atoi(key); err == nil && idx > maxIndex {
						maxIndex = idx
					}
				}
				for i := 0; i <= maxIndex; i++ {
					key := strconv.Itoa(i)
					if paramPath, exists := paramsMap[key]; exists {
						// Extract value from triggerData using paramPath (e.g., "user.first_name", "license.code")
						value := extractValueFromPath(triggerData, paramPath)
						params = append(params, value)
					}
				}
			}
		}

		// Send SMS
		err := ctrl.MelipayamakService.SendPatternSMS(normalizedPhone, message.PatternCode, params...)

		// Log the send attempt
		triggerDataJSON, _ := json.Marshal(triggerData)
		logEntry := models.TriggeredSMSMessageLog{
			TriggeredSMSMessageID: message.ID,
			Recipient:            normalizedPhone,
			Status:               "sent",
			TriggerData:          string(triggerDataJSON),
			SentAt:               time.Now(),
			CreatedAt:            time.Now(),
		}

		if err != nil {
			logEntry.Status = "failed"
			logEntry.ErrorMessage = err.Error()
			log.Printf("❌ Failed to send triggered SMS (Pattern: %d, Trigger: %s): %v", message.PatternCode, triggerType, err)
		} else {
			log.Printf("✅ Triggered SMS sent successfully to %s (Pattern: %d, Trigger: %s)", normalizedPhone, message.PatternCode, triggerType)
		}

		ctrl.DB.Create(&logEntry)
	}

	return nil
}

// extractValueFromPath extracts a value from a nested map using a dot-separated path
// e.g., "user.first_name" extracts triggerData["user"]["first_name"]
func extractValueFromPath(data map[string]interface{}, path string) string {
	if path == "" {
		return ""
	}

	parts := splitPath(path)
	current := data

	for i, part := range parts {
		if i == len(parts)-1 {
			// Last part - return the value
			if val, ok := current[part]; ok {
				if str, ok := val.(string); ok {
					return str
				}
				// Try to convert to string
				return fmt.Sprintf("%v", val)
			}
			return ""
		}

		// Navigate deeper
		if next, ok := current[part].(map[string]interface{}); ok {
			current = next
		} else {
			return ""
		}
	}

	return ""
}

// splitPath splits a dot-separated path into parts
func splitPath(path string) []string {
	return strings.Split(path, ".")
}
