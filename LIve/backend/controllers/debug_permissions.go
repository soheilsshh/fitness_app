package controllers

import (
	"log"
	"monetizeai-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DebugController struct {
	DB *gorm.DB
}

func NewDebugController(db *gorm.DB) *DebugController {
	return &DebugController{DB: db}
}

// DebugUserPermissions - Debug endpoint to check user permissions in database
func (ctrl *DebugController) DebugUserPermissions(c *gin.Context) {
	username := c.Query("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username parameter required"})
		return
	}

	// Get user
	var user models.AdminUser
	if err := ctrl.DB.Where("username = ?", username).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Get permissions using Preload
	if err := ctrl.DB.Preload("Permissions").First(&user, user.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load permissions"})
		return
	}

	// Get raw join table data
	type JoinRecord struct {
		AdminUserID       uint `json:"admin_user_id"`
		AdminPermissionID uint `json:"admin_permission_id"`
	}
	var joinRecords []JoinRecord
	ctrl.DB.Table("admin_user_permissions").Where("admin_user_id = ?", user.ID).Find(&joinRecords)

	// Get all permissions with their IDs
	var allPermissions []models.AdminPermission
	ctrl.DB.Find(&allPermissions)

	// Manual query to verify
	var manualPermissions []models.AdminPermission
	ctrl.DB.Raw(`
		SELECT ap.* 
		FROM admin_permissions ap
		JOIN admin_user_permissions aup ON ap.id = aup.admin_permission_id
		WHERE aup.admin_user_id = ?
	`, user.ID).Scan(&manualPermissions)

	log.Printf("🔍 DEBUG: User %s (ID: %d)", user.Username, user.ID)
	log.Printf("   - Preload found: %d permissions", len(user.Permissions))
	log.Printf("   - Join table has: %d records", len(joinRecords))
	log.Printf("   - Manual query found: %d permissions", len(manualPermissions))

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"is_active": user.IsActive,
		},
		"preload_permissions":  user.Permissions,
		"preload_count":        len(user.Permissions),
		"join_table_records":   joinRecords,
		"join_table_count":     len(joinRecords),
		"manual_permissions":   manualPermissions,
		"manual_count":         len(manualPermissions),
		"all_permissions_in_db": len(allPermissions),
	})
}

