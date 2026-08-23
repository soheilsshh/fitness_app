package controllers

import (
	"encoding/json"
	"io"
	"log"
	"monetizeai-backend/models"
	"monetizeai-backend/utils"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Helper function to get keys from map
func getKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

type AffiliateController struct {
	DB *gorm.DB
}

// ensureAffiliateColumns makes sure the new social/note columns exist on the current DB.
// This protects against stale production schemas where AutoMigrate hasn't run.
func ensureAffiliateColumns(db *gorm.DB) error {
	// Use direct SQL to check and add columns if they don't exist
	// This is more reliable than GORM's HasColumn which might fail
	columns := map[string]string{
		"instagram_link":   "VARCHAR(500) DEFAULT '' NOT NULL",
		"telegram_id":      "VARCHAR(100) DEFAULT '' NOT NULL",
		"whatsapp_link":    "VARCHAR(500) DEFAULT '' NOT NULL",
		"status_notes":     "TEXT",
		"urgent_follow_up": "TINYINT(1) DEFAULT 0 NOT NULL",
	}

	for colName, colDef := range columns {
		var exists int
		// Check if column exists
		err := db.Raw(`
			SELECT COUNT(*) 
			FROM information_schema.COLUMNS 
			WHERE TABLE_SCHEMA = DATABASE() 
			AND TABLE_NAME = 'affiliates' 
			AND COLUMN_NAME = ?
		`, colName).Scan(&exists).Error

		if err != nil {
			log.Printf("⚠️ Error checking column %s: %v", colName, err)
			continue
		}

		if exists == 0 {
			// Column doesn't exist, add it
			sql := "ALTER TABLE affiliates ADD COLUMN `" + colName + "` " + colDef
			if err := db.Exec(sql).Error; err != nil {
				// If column already exists (race condition), ignore error
				if !contains(err.Error(), "Duplicate column name") {
					log.Printf("❌ Error adding column %s: %v", colName, err)
					return err
				}
				log.Printf("ℹ️ Column %s already exists (race condition)", colName)
			} else {
				log.Printf("✅ Added missing column on affiliates: %s", colName)
			}
		}
	}
	return nil
}

func contains(s, substr string) bool {
	return strings.Contains(s, substr)
}

func NewAffiliateController(db *gorm.DB) *AffiliateController {
	return &AffiliateController{DB: db}
}

// CreateAffiliateRequest represents the request to create an affiliate
type CreateAffiliateRequest struct {
	FirstName       string                 `json:"first_name" binding:"required"`
	LastName        string                 `json:"last_name" binding:"required"`
	Phone           string                 `json:"phone"`
	Email           string                 `json:"email"`
	InstagramLink   string                 `json:"instagram_link"`
	TelegramID      string                 `json:"telegram_id"`
	WhatsAppLink    string                 `json:"whatsapp_link"`
	FollowerCount   int                    `json:"follower_count"`
	RequiredContent int                    `json:"required_content"`
	Status          models.AffiliateStatus `json:"status"`
	Notes           string                 `json:"notes"`
	StatusNotes     string                 `json:"status_notes"`
	UrgentFollowUp  bool                   `json:"urgent_follow_up"`
}

// UpdateAffiliateRequest - ساده و بدون pointer: فرانت همه فیلدها را می‌فرستد، اینجا همه را می‌گیریم و ذخیره می‌کنیم
type UpdateAffiliateRequest struct {
	FirstName       string                 `json:"first_name"`
	LastName        string                 `json:"last_name"`
	Phone           string                 `json:"phone"`
	Email           string                 `json:"email"`
	InstagramLink   string                 `json:"instagram_link"`
	TelegramID      string                 `json:"telegram_id"`
	WhatsAppLink    string                 `json:"whatsapp_link"`
	FollowerCount   int                    `json:"follower_count"`
	RequiredContent int                    `json:"required_content"`
	Status          models.AffiliateStatus `json:"status"`
	Notes           string                 `json:"notes"`
	StatusNotes     string                 `json:"status_notes"`
	UrgentFollowUp  bool                   `json:"urgent_follow_up"`
	AdminUserID     *uint                  `json:"admin_user_id"` // اختیاری
}

// GetAffiliatesList returns list of affiliates
// If user is not main admin, only shows affiliates created by them
func (ctrl *AffiliateController) GetAffiliatesList(c *gin.Context) {
	// Check permission
	if !HasPermission(c, ctrl.DB, "affiliates.view") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	// Ensure columns exist before querying
	if err := ensureAffiliateColumns(ctrl.DB); err != nil {
		log.Printf("⚠️ ensureAffiliateColumns warning in GetAffiliatesList: %v", err)
		// Continue anyway - columns might already exist
	}

	// Get current user info from JWT token
	username, _ := c.Get("username")
	userID, _ := c.Get("user_id")

	// Check if current user is the main admin (username == "admin")
	isMainAdmin := false
	if usernameStr, ok := username.(string); ok {
		isMainAdmin = usernameStr == "admin"
	}

	// Get status filter
	statusFilter := c.Query("status")

	// Build query - explicitly select all columns including new ones
	query := ctrl.DB.Preload("AdminUser").Preload("CreatedBy")

	// If not main admin, show affiliates created by them OR affiliates where they are the admin_user (active affiliates)
	if !isMainAdmin {
		if userIDVal, ok := userID.(uint); ok {
			// Show affiliates created by this user OR affiliates where this user is the admin_user (active affiliate)
			query = query.Where("created_by_id = ? OR admin_user_id = ?", userIDVal, userIDVal)
		}
	}

	// Apply status filter if provided
	if statusFilter != "" {
		query = query.Where("status = ?", statusFilter)
	}

	var affiliates []models.Affiliate
	// CRITICAL: Use explicit column selection to ensure all fields including new ones are loaded
	// GORM might skip fields if columns don't exist, so we explicitly select them
	selectFields := []string{
		"id", "first_name", "last_name", "phone", "email",
		"instagram_link", "telegram_id", "whatsapp_link",
		"follower_count", "required_content", "leads_count",
		"status", "notes", "status_notes", "urgent_follow_up",
		"admin_user_id", "created_by_id", "created_at", "updated_at",
	}
	if err := query.Select(selectFields).Order("created_at DESC").Find(&affiliates).Error; err != nil {
		log.Printf("❌ Error fetching affiliates list: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch affiliates"})
		return
	}

	// OPTIMIZED: Only log in debug mode (reduces I/O overhead in production)
	if len(affiliates) > 0 {
		utils.LogDebug("📊 Sample affiliate loaded: InstagramLink='%s', TelegramID='%s', WhatsAppLink='%s', StatusNotes='%s'",
			affiliates[0].InstagramLink, affiliates[0].TelegramID, affiliates[0].WhatsAppLink, affiliates[0].StatusNotes)
	}

	// OPTIMIZED: Batch calculate leads count for active affiliates (avoid N+1 queries)
	// Collect all admin_user_ids that need leads count
	activeAdminUserIDs := make([]uint, 0)
	adminUserIDToIndex := make(map[uint][]int) // Map admin_user_id to affiliate indices
	for i := range affiliates {
		if affiliates[i].Status == models.AffiliateStatusActive && affiliates[i].AdminUserID != nil {
			adminUserID := *affiliates[i].AdminUserID
			activeAdminUserIDs = append(activeAdminUserIDs, adminUserID)
			adminUserIDToIndex[adminUserID] = append(adminUserIDToIndex[adminUserID], i)
		}
	}

	// Batch query: Get counts for all admin_user_ids in one query
	if len(activeAdminUserIDs) > 0 {
		type LeadsCountResult struct {
			PromoterID uint
			Count      int64
		}
		var leadsCounts []LeadsCountResult
			ctrl.DB.Model(&models.User{}).
			Select("promoter_id, COUNT(*) as count").
			Where("promoter_id IN ?", activeAdminUserIDs).
			Group("promoter_id").
			Scan(&leadsCounts)

		// Map results back to affiliates
		for _, result := range leadsCounts {
			if indices, exists := adminUserIDToIndex[result.PromoterID]; exists {
				for _, idx := range indices {
					affiliates[idx].LeadsCount = int(result.Count)
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"affiliates": affiliates,
	})
}

// CreateAffiliate creates a new affiliate
func (ctrl *AffiliateController) CreateAffiliate(c *gin.Context) {
	// Check permission
	if !HasPermission(c, ctrl.DB, "affiliates.create") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	// Ensure columns exist (protect against stale DB)
	if err := ensureAffiliateColumns(ctrl.DB); err != nil {
		log.Printf("❌ ensureAffiliateColumns failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Missing DB columns for affiliates", "details": err.Error()})
		return
	}

	var req CreateAffiliateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Get current user ID
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	createdByID := userID.(uint)

	// Validate status
	if req.Status == "" {
		req.Status = models.AffiliateStatusLeadPool
	}

	affiliate := models.Affiliate{
		FirstName:       req.FirstName,
		LastName:        req.LastName,
		Phone:           req.Phone,
		Email:           req.Email,
		InstagramLink:   req.InstagramLink,
		TelegramID:      req.TelegramID,
		WhatsAppLink:    req.WhatsAppLink,
		FollowerCount:   req.FollowerCount,
		RequiredContent: req.RequiredContent,
		Status:          req.Status,
		Notes:           req.Notes,
		StatusNotes:     req.StatusNotes,
		UrgentFollowUp:  req.UrgentFollowUp,
		CreatedByID:     createdByID,
	}

	if err := ctrl.DB.Create(&affiliate).Error; err != nil {
		log.Printf("❌ Error creating affiliate: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create affiliate"})
		return
	}

	// Reload with relations
	ctrl.DB.Preload("AdminUser").Preload("CreatedBy").First(&affiliate, affiliate.ID)

	c.JSON(http.StatusOK, gin.H{
		"message":   "Affiliate created successfully",
		"affiliate": affiliate,
	})
}

// UpdateAffiliate updates an affiliate
func (ctrl *AffiliateController) UpdateAffiliate(c *gin.Context) {
	// Check permission
	if !HasPermission(c, ctrl.DB, "affiliates.edit") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	// Ensure columns exist (protect against stale DB)
	if err := ensureAffiliateColumns(ctrl.DB); err != nil {
		log.Printf("❌ ensureAffiliateColumns failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Missing DB columns for affiliates", "details": err.Error()})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid affiliate ID"})
		return
	}

	var affiliate models.Affiliate
	if err := ctrl.DB.First(&affiliate, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Affiliate not found"})
		return
	}

	// Check if user can edit this affiliate (only creator or main admin)
	username, _ := c.Get("username")
	userID, _ := c.Get("user_id")
	isMainAdmin := false
	if usernameStr, ok := username.(string); ok {
		isMainAdmin = usernameStr == "admin"
	}

	if !isMainAdmin {
		if userIDVal, ok := userID.(uint); ok {
			if affiliate.CreatedByID != userIDVal {
				c.JSON(http.StatusForbidden, gin.H{"error": "You can only edit affiliates you created"})
				return
			}
		}
	}

	// Read body once
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("❌ Error reading request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Unmarshal into struct for type safety (non-pointer fields)
	// Frontend always sends ALL fields (even if empty), so we can directly use them
	var req UpdateAffiliateRequest
	if err := json.Unmarshal(bodyBytes, &req); err != nil {
		log.Printf("❌ Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// CRITICAL: Update ALL fields directly - frontend always sends all fields
	// Empty strings are valid and should be saved to clear the field
	affiliate.FirstName = req.FirstName
	affiliate.LastName = req.LastName
	affiliate.Phone = req.Phone
	affiliate.Email = req.Email
	affiliate.InstagramLink = req.InstagramLink // Always update, even if empty string
	affiliate.TelegramID = req.TelegramID       // Always update, even if empty string
	affiliate.WhatsAppLink = req.WhatsAppLink   // Always update, even if empty string
	affiliate.FollowerCount = req.FollowerCount
	affiliate.RequiredContent = req.RequiredContent
	if req.Status != "" {
		affiliate.Status = req.Status
	}
	affiliate.Notes = req.Notes             // Always update, even if empty string
	affiliate.StatusNotes = req.StatusNotes // Always update, even if empty string
	affiliate.UrgentFollowUp = req.UrgentFollowUp
	affiliate.AdminUserID = req.AdminUserID

	log.Printf("💾 Updating affiliate ID=%d", affiliate.ID)
	log.Printf("💾 Field values: InstagramLink='%s', TelegramID='%s', WhatsAppLink='%s', Notes='%s', StatusNotes='%s'",
		affiliate.InstagramLink, affiliate.TelegramID, affiliate.WhatsAppLink, affiliate.Notes, affiliate.StatusNotes)

	// CRITICAL: Use map[string]interface{} instead of struct to ensure empty strings are saved
	// GORM's Updates() with struct might skip empty string fields, but map forces all fields to be updated
	// IMPORTANT: All string fields must be explicitly included, even if empty, to ensure they're updated in DB
	updateMap := map[string]interface{}{
		"first_name":       affiliate.FirstName,
		"last_name":        affiliate.LastName,
		"phone":            affiliate.Phone,
		"email":            affiliate.Email,
		"instagram_link":   affiliate.InstagramLink, // CRITICAL: Always include, even if empty string
		"telegram_id":      affiliate.TelegramID,    // CRITICAL: Always include, even if empty string
		"whatsapp_link":    affiliate.WhatsAppLink,  // CRITICAL: Always include, even if empty string
		"follower_count":   affiliate.FollowerCount,
		"required_content": affiliate.RequiredContent,
		"status":           affiliate.Status,
		"notes":            affiliate.Notes,       // CRITICAL: Always include, even if empty string
		"status_notes":     affiliate.StatusNotes, // CRITICAL: Always include, even if empty string
		"urgent_follow_up": affiliate.UrgentFollowUp,
		"updated_at":       time.Now(),
	}

	// Handle admin_user_id
	if req.AdminUserID != nil {
		updateMap["admin_user_id"] = *req.AdminUserID
	} else if req.Status != "" && req.Status != models.AffiliateStatusActive {
		// If status is not active, clear admin_user_id
		updateMap["admin_user_id"] = nil
	} else if req.Status == "" && affiliate.Status != models.AffiliateStatusActive {
		// If status wasn't changed but current status is not active, ensure admin_user_id is cleared
		updateMap["admin_user_id"] = nil
	}

	log.Printf("🔧 Update map: %+v", updateMap)

	// Use Updates() with map to force GORM to update ALL fields, including empty strings
	result := ctrl.DB.Model(&affiliate).Updates(updateMap)
	if result.Error != nil {
		log.Printf("❌ Error updating affiliate: %v", result.Error)
		// Return the DB error to help diagnose issues (e.g., missing columns on production DB)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update affiliate", "details": result.Error.Error()})
		return
	}

	log.Printf("📊 Update result: RowsAffected=%d", result.RowsAffected)
	if result.RowsAffected == 0 {
		log.Printf("⚠️ Warning: No rows were affected by the update. This might indicate the affiliate doesn't exist or no fields changed.")
	} else {
		log.Printf("✅ Update successful: %d row(s) affected", result.RowsAffected)
	}

	// Verify the update by reloading from database
	if err := ctrl.DB.First(&affiliate, affiliate.ID).Error; err != nil {
		log.Printf("⚠️ Warning: Could not reload affiliate after update: %v", err)
	} else {
		log.Printf("✅ Affiliate updated successfully. Verified values from DB: InstagramLink='%s', TelegramID='%s', WhatsAppLink='%s', StatusNotes='%s'",
			affiliate.InstagramLink, affiliate.TelegramID, affiliate.WhatsAppLink, affiliate.StatusNotes)

		// Double-check by querying directly from database with raw SQL
		var dbCheck struct {
			InstagramLink string
			TelegramID    string
			WhatsAppLink  string
			StatusNotes   string
		}
		if err := ctrl.DB.Raw("SELECT instagram_link, telegram_id, whatsapp_link, status_notes FROM affiliates WHERE id = ?", affiliate.ID).Scan(&dbCheck).Error; err == nil {
			log.Printf("🔍 Direct SQL query result: InstagramLink='%s', TelegramID='%s', WhatsAppLink='%s', StatusNotes='%s'",
				dbCheck.InstagramLink, dbCheck.TelegramID, dbCheck.WhatsAppLink, dbCheck.StatusNotes)
		} else {
			log.Printf("❌ Error in direct SQL query: %v", err)
		}
	}

	// Reload with relations - explicitly select all fields to ensure new columns are included
	selectFields := []string{
		"id", "first_name", "last_name", "phone", "email",
		"instagram_link", "telegram_id", "whatsapp_link",
		"follower_count", "required_content", "leads_count",
		"status", "notes", "status_notes", "urgent_follow_up",
		"admin_user_id", "created_by_id", "created_at", "updated_at",
	}
	if err := ctrl.DB.Preload("AdminUser").Preload("CreatedBy").
		Select(selectFields).First(&affiliate, affiliate.ID).Error; err != nil {
		log.Printf("⚠️ Warning: Could not reload affiliate with relations: %v", err)
		// Try without explicit select
		ctrl.DB.Preload("AdminUser").Preload("CreatedBy").First(&affiliate, affiliate.ID)
	}

	log.Printf("📤 Returning affiliate: InstagramLink='%s', TelegramID='%s', WhatsAppLink='%s', StatusNotes='%s'",
		affiliate.InstagramLink, affiliate.TelegramID, affiliate.WhatsAppLink, affiliate.StatusNotes)

	c.JSON(http.StatusOK, gin.H{
		"message":   "Affiliate updated successfully",
		"affiliate": affiliate,
	})
}

// DeleteAffiliate deletes an affiliate
func (ctrl *AffiliateController) DeleteAffiliate(c *gin.Context) {
	// Check permission
	if !HasPermission(c, ctrl.DB, "affiliates.delete") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid affiliate ID"})
		return
	}

	var affiliate models.Affiliate
	if err := ctrl.DB.First(&affiliate, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Affiliate not found"})
		return
	}

	// Check if user can delete this affiliate (only creator or main admin)
	username, _ := c.Get("username")
	userID, _ := c.Get("user_id")
	isMainAdmin := false
	if usernameStr, ok := username.(string); ok {
		isMainAdmin = usernameStr == "admin"
	}

	if !isMainAdmin {
		if userIDVal, ok := userID.(uint); ok {
			if affiliate.CreatedByID != userIDVal {
				c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete affiliates you created"})
				return
			}
		}
	}

	if err := ctrl.DB.Delete(&affiliate).Error; err != nil {
		log.Printf("❌ Error deleting affiliate: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete affiliate"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Affiliate deleted successfully"})
}
