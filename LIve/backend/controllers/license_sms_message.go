package controllers

import (
	"log"
	"fitino-live-backend/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type LicenseSMSMessageController struct {
	DB *gorm.DB
}

func NewLicenseSMSMessageController(db *gorm.DB) *LicenseSMSMessageController {
	return &LicenseSMSMessageController{
		DB: db,
	}
}

// GetLicenseSMSMessage returns the license SMS message configuration
func (ctrl *LicenseSMSMessageController) GetLicenseSMSMessage(c *gin.Context) {
	var message models.LicenseSMSMessage
	if err := ctrl.DB.Where("is_active = ?", true).First(&message).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Return default configuration
			c.JSON(http.StatusOK, gin.H{
				"message": models.LicenseSMSMessage{
					PatternCode: 403249,
					IsActive:    false,
				},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch license SMS message"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": message})
}

// UpdateLicenseSMSMessage updates the license SMS message configuration
func (ctrl *LicenseSMSMessageController) UpdateLicenseSMSMessage(c *gin.Context) {
	var req struct {
		PatternCode int  `json:"pattern_code" binding:"required"`
		IsActive    bool `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Find existing message or create new one
	var message models.LicenseSMSMessage
	if err := ctrl.DB.Where("is_active = ?", true).First(&message).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create new message
			message = models.LicenseSMSMessage{
				PatternCode: req.PatternCode,
				IsActive:    req.IsActive,
			}
			if err := ctrl.DB.Create(&message).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create license SMS message"})
				return
			}
			log.Printf("✅ License SMS message created: ID=%d, PatternCode=%d, IsActive=%v", message.ID, message.PatternCode, message.IsActive)
			c.JSON(http.StatusOK, gin.H{"message": message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find license SMS message"})
		return
	}

	// Update existing message
	message.PatternCode = req.PatternCode
	message.IsActive = req.IsActive

	if err := ctrl.DB.Save(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update license SMS message"})
		return
	}

	log.Printf("✅ License SMS message updated: ID=%d, PatternCode=%d, IsActive=%v", message.ID, message.PatternCode, message.IsActive)
	c.JSON(http.StatusOK, gin.H{"message": message})
}

// GetLicenseSMSMessageLogs returns logs of sent license SMS messages
func (ctrl *LicenseSMSMessageController) GetLicenseSMSMessageLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 50
	}

	offset := (page - 1) * pageSize

	var logs []models.LicenseSMSMessageLog
	var total int64

	// Count total
	if err := ctrl.DB.Model(&models.LicenseSMSMessageLog{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count logs"})
		return
	}

	// Get logs
	if err := ctrl.DB.Order("sent_at DESC").Offset(offset).Limit(pageSize).Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"logs": logs,
		"pagination": gin.H{
			"page":        page,
			"page_size":   pageSize,
			"total_count": total,
			"total_pages": (int(total) + pageSize - 1) / pageSize,
		},
	})
}
