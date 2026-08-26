package controllers

import (
	"bufio"
	"log"
	"monetizeai-backend/models"
	"monetizeai-backend/utils"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type LicenseController struct {
	DB                        *gorm.DB
	TriggeredSMSController    *TriggeredSMSMessageController
}

func NewLicenseController(db *gorm.DB, triggeredSMSController *TriggeredSMSMessageController) *LicenseController {
	return &LicenseController{
		DB:                     db,
		TriggeredSMSController: triggeredSMSController,
	}
}

// isValidLicenseFormat validates license code format: XXXX-XXXXX-XXXXX-XXXXX (4-5 chars per section)
// Example: D98M-NA5VS-MSXG5-YWQBG
func isValidLicenseFormat(code string) bool {
	// Pattern: 4 sections separated by hyphens, each section 4-5 alphanumeric characters (uppercase)
	pattern := `^[A-Z0-9]{4,5}-[A-Z0-9]{4,5}-[A-Z0-9]{4,5}-[A-Z0-9]{4,5}$`
	matched, err := regexp.MatchString(pattern, code)
	if err != nil {
		return false
	}
	return matched
}

// UploadLicenses handles uploading a text file with license codes (one per line)
func (ctrl *LicenseController) UploadLicenses(c *gin.Context) {
	// Check permission
	if !HasPermission(c, ctrl.DB, "licenses.manage") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	// Get uploaded file
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}

	// Open file
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
		return
	}
	defer src.Close()

	// Read file line by line
	scanner := bufio.NewScanner(src)
	licenses := []string{}
	duplicates := []string{}
	invalid := []string{}
	existingCodes := make(map[string]bool)

	// Get all existing license codes
	var existingLicenses []models.License
	ctrl.DB.Select("code").Find(&existingLicenses)
	for _, lic := range existingLicenses {
		existingCodes[lic.Code] = true
	}

	lineCount := 0
	for scanner.Scan() {
		lineCount++
		code := strings.TrimSpace(scanner.Text())
		if code == "" {
			continue // Skip empty lines
		}

		// Normalize license code (remove extra spaces, convert to uppercase)
		code = strings.ToUpper(strings.TrimSpace(code))

		// Validate license format: must be XXXX-XXXXX-XXXXX-XXXXX
		if !isValidLicenseFormat(code) {
			invalid = append(invalid, code)
			continue
		}

		// Check for duplicates in file
		if existingCodes[code] {
			duplicates = append(duplicates, code)
			continue
		}

		licenses = append(licenses, code)
		existingCodes[code] = true
	}

	if err := scanner.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}

	// Insert licenses into database
	inserted := 0
	for _, code := range licenses {
		license := models.License{
			Code:    code,
			IsUsed:  false,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		if err := ctrl.DB.Create(&license).Error; err != nil {
			log.Printf("Failed to insert license %s: %v", code, err)
			continue
		}
		inserted++
	}

	c.JSON(http.StatusOK, gin.H{
		"success":        true,
		"message":        "Licenses uploaded successfully",
		"total":          lineCount,
		"inserted":       inserted,
		"duplicates":    len(duplicates),
		"duplicate_codes": duplicates,
		"invalid":        len(invalid),
		"invalid_codes":  invalid,
	})
}

// GetLicensesStats returns statistics about licenses
func (ctrl *LicenseController) GetLicensesStats(c *gin.Context) {
	// Check permission
	if !HasPermission(c, ctrl.DB, "licenses.view") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var total int64
	var used int64
	var available int64

	ctrl.DB.Model(&models.License{}).Count(&total)
	ctrl.DB.Model(&models.License{}).Where("is_used = ?", true).Count(&used)
	available = total - used

	c.JSON(http.StatusOK, gin.H{
		"total":     total,
		"used":      used,
		"available": available,
	})
}

// GetLicensesList returns list of licenses with pagination
func (ctrl *LicenseController) GetLicensesList(c *gin.Context) {
	// Check permission
	if !HasPermission(c, ctrl.DB, "licenses.view") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	page := 1
	limit := 50
	if p := c.Query("page"); p != "" {
		if parsedPage, err := strconv.Atoi(p); err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	offset := (page - 1) * limit

	var licenses []models.License
	var total int64

	query := ctrl.DB.Model(&models.License{})

	// Filter by status
	if status := c.Query("status"); status != "" {
		if status == "used" {
			query = query.Where("is_used = ?", true)
		} else if status == "available" {
			query = query.Where("is_used = ?", false)
		}
	}

	// Count total
	query.Count(&total)

	// Get licenses with pagination
	query.Preload("User").Preload("Payment").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&licenses)

	c.JSON(http.StatusOK, gin.H{
		"licenses": licenses,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_pages": (int(total) + limit - 1) / limit,
		},
	})
}

// AssignLicense assigns an available license to a user after successful payment
func (ctrl *LicenseController) AssignLicense(c *gin.Context) {
	var req struct {
		PaymentID *uint  `json:"payment_id"` // Optional - can find by authority
		Authority string `json:"authority"`   // Optional - used to find payment
		Phone     string `json:"phone" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Normalize phone number
	normalizedPhone := utils.NormalizePhoneNumber(req.Phone)

	// Find payment by payment_id or authority
	var payment models.PaymentTransaction
	if req.PaymentID != nil && *req.PaymentID > 0 {
		// Find by payment_id
		if err := ctrl.DB.Where("id = ? AND status = ?", *req.PaymentID, "success").First(&payment).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found or not successful"})
			return
		}
	} else if req.Authority != "" {
		// Find by authority
		if err := ctrl.DB.Where("authority = ? AND status = ?", req.Authority, "success").First(&payment).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found or not successful"})
			return
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Either payment_id or authority is required"})
		return
	}

	// Check if payment already has a license
	if payment.LicenseCode != nil && *payment.LicenseCode != "" {
		c.JSON(http.StatusOK, gin.H{
			"success":     true,
			"license_code": *payment.LicenseCode,
			"message":     "License already assigned",
		})
		return
	}

	// Find an available license
	var license models.License
	if err := ctrl.DB.Where("is_used = ?", false).First(&license).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No available licenses"})
		return
	}

	// Find or create user
	var user models.User
	if err := ctrl.DB.Where("phone = ?", normalizedPhone).First(&user).Error; err != nil {
		// User not found - create new user
		user = models.User{
			FirstName:    payment.FirstName,
			LastName:     payment.LastName,
			Phone:        normalizedPhone,
			RegisteredAt: time.Now(),
		}
		if err := ctrl.DB.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
	}

	// Assign license
	now := time.Now()
	license.IsUsed = true
	license.UserID = &user.ID
	license.PaymentID = &payment.ID
	license.AssignedAt = &now

	if err := ctrl.DB.Save(&license).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign license"})
		return
	}

	// Update user's license code
	user.LicenseCode = &license.Code
	ctrl.DB.Save(&user)

	// Update payment's license code
	payment.LicenseCode = &license.Code
	ctrl.DB.Save(&payment)

	log.Printf("✅ License %s assigned to user %s (payment ID: %d)", license.Code, normalizedPhone, payment.ID)

	// Send triggered SMS if controller is available
	if ctrl.TriggeredSMSController != nil {
		// Prepare trigger data for SMS
		triggerData := map[string]interface{}{
			"phone": normalizedPhone,
			"user": map[string]interface{}{
				"first_name": user.FirstName,
				"last_name":  user.LastName,
				"full_name":  user.FirstName + " " + user.LastName,
			},
			"license": map[string]interface{}{
				"code": license.Code,
			},
			"payment": map[string]interface{}{
				"id": payment.ID,
			},
		}

		// Send triggered SMS for "license_assigned" trigger type
		if err := ctrl.TriggeredSMSController.SendTriggeredSMS("license_assigned", triggerData); err != nil {
			log.Printf("⚠️  Failed to send triggered SMS for license assignment: %v", err)
			// Don't fail the license assignment if SMS fails
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"license_code": license.Code,
		"message":     "License assigned successfully",
	})
}

// DeleteAllLicenses deletes all licenses from database
func (ctrl *LicenseController) DeleteAllLicenses(c *gin.Context) {
	// Check permission
	if !HasPermission(c, ctrl.DB, "licenses.manage") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	// Count licenses before deletion
	var totalCount int64
	var usedCount int64
	ctrl.DB.Model(&models.License{}).Count(&totalCount)
	ctrl.DB.Model(&models.License{}).Where("is_used = ?", true).Count(&usedCount)

	// Delete all licenses (including used ones)
	result := ctrl.DB.Unscoped().Delete(&models.License{}, "1 = 1")
	if result.Error != nil {
		log.Printf("Failed to delete all licenses: %v", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete licenses"})
		return
	}

	log.Printf("✅ Deleted all %d licenses (used: %d, unused: %d)", totalCount, usedCount, totalCount-usedCount)

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "All licenses deleted successfully",
		"deleted":    totalCount,
		"used_count": usedCount,
		"unused_count": totalCount - usedCount,
	})
}

