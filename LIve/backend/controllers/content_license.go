package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"monetizeai-backend/models"
	"monetizeai-backend/services"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ContentLicenseController struct {
	DB            *gorm.DB
	TelegramBot   *services.TelegramBotService
}

func NewContentLicenseController(db *gorm.DB, telegramBot *services.TelegramBotService) *ContentLicenseController {
	return &ContentLicenseController{
		DB:          db,
		TelegramBot: telegramBot,
	}
}

// generateContentLicenseCode generates a unique license code for content mode
// Format: CONT-XXXX-XXXX-XXXX (where X is alphanumeric uppercase)
func generateContentLicenseCode() string {
	bytes := make([]byte, 12)
	rand.Read(bytes)
	code := strings.ToUpper(hex.EncodeToString(bytes))
	// Format: CONT-XXXX-XXXX-XXXX
	return fmt.Sprintf("CONT-%s-%s-%s", code[0:4], code[4:8], code[8:12])
}

// CreateContentLicense creates a new content license for an admin user
func (ctrl *ContentLicenseController) CreateContentLicense(c *gin.Context) {
	userID, hasUser := c.Get("user_id")
	if !hasUser {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	currentUserID := userID.(uint)

	// Check if user already has a content license
	var existingLicense models.ContentLicense
	if err := ctrl.DB.Where("admin_user_id = ?", currentUserID).First(&existingLicense).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{
			"license": existingLicense,
			"message": "You already have a content license",
		})
		return
	}

	// Generate unique license code
	var licenseCode string
	maxAttempts := 10
	for i := 0; i < maxAttempts; i++ {
		licenseCode = generateContentLicenseCode()
		var existing models.ContentLicense
		if err := ctrl.DB.Where("code = ?", licenseCode).First(&existing).Error; err != nil {
			// Code is unique
			break
		}
		if i == maxAttempts-1 {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate unique license code"})
			return
		}
	}

	// Create license
	license := models.ContentLicense{
		Code:       licenseCode,
		IsUsed:     false,
		AdminUserID: &currentUserID,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	if err := ctrl.DB.Create(&license).Error; err != nil {
		log.Printf("Failed to create content license: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create license"})
		return
	}

	ctrl.DB.Preload("AdminUser").First(&license, license.ID)
	log.Printf("✅ Content license created: %s for admin user %d", licenseCode, currentUserID)

	c.JSON(http.StatusOK, gin.H{
		"license": license,
		"message": "Content license created successfully",
	})
}

// GetMyContentLicense returns the current user's content license
func (ctrl *ContentLicenseController) GetMyContentLicense(c *gin.Context) {
	userID, hasUser := c.Get("user_id")
	if !hasUser {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	currentUserID := userID.(uint)

	var license models.ContentLicense
	if err := ctrl.DB.Preload("AdminUser").Where("admin_user_id = ?", currentUserID).First(&license).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Content license not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch license"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"license": license})
}

// ActivateContentLicense activates a content license via Telegram
func (ctrl *ContentLicenseController) ActivateContentLicense(c *gin.Context) {
	var req struct {
		LicenseCode string `json:"license_code" binding:"required"`
		TelegramID  string `json:"telegram_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Normalize license code
	licenseCode := strings.ToUpper(strings.TrimSpace(req.LicenseCode))

	// Find license
	var license models.ContentLicense
	if err := ctrl.DB.Preload("AdminUser").Where("code = ?", licenseCode).First(&license).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "License code not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find license"})
		return
	}

	// Check if already used
	if license.IsUsed {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This license has already been activated"})
		return
	}

	// Check if already assigned to another Telegram ID
	if license.TelegramID != nil && *license.TelegramID != req.TelegramID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This license is already assigned to another Telegram account"})
		return
	}

	// Activate license
	now := time.Now()
	license.IsUsed = true
	license.TelegramID = &req.TelegramID
	license.AssignedAt = &now

	// Enable content mode for admin user
	if license.AdminUserID != nil {
		var adminUser models.AdminUser
		if err := ctrl.DB.First(&adminUser, *license.AdminUserID).Error; err == nil {
			adminUser.ContentModeEnabled = true
			ctrl.DB.Save(&adminUser)
		}
	}

	if err := ctrl.DB.Save(&license).Error; err != nil {
		log.Printf("Failed to activate license: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to activate license"})
		return
	}

	log.Printf("✅ Content license activated: %s for Telegram ID %s (Admin User ID: %d)", 
		licenseCode, req.TelegramID, *license.AdminUserID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "License activated successfully",
		"license": license,
	})
}

// ListContentLicenses lists all content licenses (admin only)
func (ctrl *ContentLicenseController) ListContentLicenses(c *gin.Context) {
	if !HasPermission(c, ctrl.DB, models.PermissionAdminUsersView) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var licenses []models.ContentLicense
	if err := ctrl.DB.Preload("AdminUser").Order("created_at DESC").Find(&licenses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch licenses"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"licenses": licenses})
}

// DeleteContentLicense deletes a content license (admin only)
func (ctrl *ContentLicenseController) DeleteContentLicense(c *gin.Context) {
	if !HasPermission(c, ctrl.DB, models.PermissionAdminUsersView) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid license ID"})
		return
	}

	var license models.ContentLicense
	if err := ctrl.DB.First(&license, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "License not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find license"})
		return
	}

	if err := ctrl.DB.Delete(&license).Error; err != nil {
		log.Printf("Failed to delete license: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete license"})
		return
	}

	log.Printf("✅ Content license deleted: ID=%d, Code=%s", id, license.Code)
	c.JSON(http.StatusOK, gin.H{"message": "License deleted successfully"})
}

