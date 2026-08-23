package controllers

import (
	"errors"
	"fmt"
	"log"
	"monetizeai-backend/models"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CheckPermission is a helper middleware factory that checks for a specific permission
func CheckPermission(requiredPermission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get DB from context (set by routes)
		dbInterface, exists := c.Get("db")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database not available"})
			c.Abort()
			return
		}
		db := dbInterface.(*gorm.DB)

		if !HasPermission(c, db, requiredPermission) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

type AdminUsersController struct {
	DB *gorm.DB
}

func NewAdminUsersController(db *gorm.DB) *AdminUsersController {
	return &AdminUsersController{DB: db}
}

// GetAdminUsers returns list of all admin users with their permissions
func (ctrl *AdminUsersController) GetAdminUsers(c *gin.Context) {
	// NOTE: ensureDefaultPermissions is NOT called here to avoid overriding user permissions
	// Permissions sync should only happen via explicit sync endpoint or on startup

	var users []models.AdminUser
	// CRITICAL: Don't use Preload here - backfillPermissions will fetch directly from join table
	// This ensures we always get the latest permissions without cache issues
	if err := ctrl.DB.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch admin users"})
		return
	}

	// CRITICAL: Always fetch permissions directly from join table (bypasses Preload cache)
	ctrl.backfillPermissions(users)

	var allPermissions []models.AdminPermission
	if err := ctrl.DB.Order("category, name").Find(&allPermissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch permissions"})
		return
	}

	// Log payment permissions for debugging
	paymentPerms := []models.AdminPermission{}
	for _, perm := range allPermissions {
		if perm.Category == "payments" {
			paymentPerms = append(paymentPerms, perm)
		}
	}
	log.Printf("📋 GetAdminUsers: Returning %d total permissions, %d payment permissions", len(allPermissions), len(paymentPerms))

	// Check if we have all expected payment permissions
	expectedPaymentKeys := []string{
		"payments.view",
		"payments.list.controls",
		"payments.stats.success",
		"payments.stats.pending",
		"payments.stats.total",
		"payments.stats.profit",
		"payments.daily.chart",
		"payments.filter.installment",
		"payments.view.installment_only",
		"payments.view.full_only",
		"payments.view.success_only",
		"payments.view.pending_only",
		"payments.view.landing_activity",
	}

	missingKeys := []string{}
	for _, expectedKey := range expectedPaymentKeys {
		found := false
		for _, perm := range paymentPerms {
			if perm.Key == expectedKey {
				found = true
				break
			}
		}
		if !found {
			missingKeys = append(missingKeys, expectedKey)
		}
	}

	if len(missingKeys) > 0 {
		log.Printf("⚠️ GetAdminUsers: Missing %d payment permissions: %v", len(missingKeys), missingKeys)
		log.Printf("⚠️ This means permissions were not synced properly. Please restart backend or use sync endpoint.")
	} else {
		log.Printf("✅ GetAdminUsers: All %d expected payment permissions are present", len(expectedPaymentKeys))
	}

	for _, perm := range paymentPerms {
		log.Printf("  - %s: %s", perm.Key, perm.Name)
	}

	c.JSON(http.StatusOK, gin.H{
		"users":       users,
		"permissions": allPermissions,
	})
}

// GetAdminUser returns a single admin user with permissions
func (ctrl *AdminUsersController) GetAdminUser(c *gin.Context) {
	// NOTE: ensureDefaultPermissions is NOT called here to avoid overriding user permissions
	// Permissions sync should only happen via explicit sync endpoint or on startup

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user models.AdminUser
	// CRITICAL: Don't use Preload here - backfillSingleUser will fetch directly from join table
	// This ensures we always get the latest permissions without cache issues
	if err := ctrl.DB.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	// CRITICAL: Always fetch permissions directly from join table (bypasses Preload cache)
	ctrl.backfillSingleUser(&user)

	// Log permission keys for debugging
	permissionKeys := make([]string, len(user.Permissions))
	for i, perm := range user.Permissions {
		permissionKeys[i] = perm.Key
	}
	log.Printf("📋 GetAdminUser: User %s (ID: %d) has %d permissions from database: %v", user.Username, user.ID, len(user.Permissions), permissionKeys)

	c.JSON(http.StatusOK, gin.H{"user": user})
}

// CreateAdminUser creates a new admin user
func (ctrl *AdminUsersController) CreateAdminUser(c *gin.Context) {
	var req struct {
		Username           string   `json:"username" binding:"required"`
		Password           string   `json:"password" binding:"required,min=6"`
		IsActive           bool     `json:"is_active"`
		IsAffiliate        bool     `json:"is_affiliate"`
		ContentModeEnabled bool     `json:"content_mode_enabled"`
		Name               *string  `json:"name"`
		Phone              *string  `json:"phone"`
		Permissions        []string `json:"permissions"` // Array of permission keys
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	if req.Username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username cannot be empty"})
		return
	}

	// Check if username already exists
	var existingUser models.AdminUser
	if err := ctrl.DB.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
		return
	}

	// Hash password
	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user inside a transaction to avoid orphaned accounts when permissions fail
	user := models.AdminUser{
		Username:           req.Username,
		Password:           hashedPassword,
		IsActive:           req.IsActive,
		IsAffiliate:        req.IsAffiliate,
		ContentModeEnabled: req.ContentModeEnabled,
		Name:               req.Name,
		Phone:              req.Phone,
	}

	// CRITICAL: Don't call ensureDefaultPermissions here - it may grant permissions to all users
	// Permissions should only be synced via explicit sync endpoint or on startup
	// This prevents overriding user permissions when creating new users
	// if err := ctrl.ensureDefaultPermissions(); err != nil {
	// 	log.Printf("⚠️ Failed to ensure default permissions: %v", err)
	// }

	if err := ctrl.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&user).Error; err != nil {
			return err
		}

		// If no permissions specified, grant all permissions to new user
		if len(req.Permissions) == 0 {
			var allPermissions []models.AdminPermission
			if err := tx.Find(&allPermissions).Error; err == nil && len(allPermissions) > 0 {
				req.Permissions = make([]string, len(allPermissions))
				for i, perm := range allPermissions {
					req.Permissions[i] = perm.Key
				}
				log.Printf("ℹ️ No permissions specified for new user %s, granting all %d permissions", req.Username, len(req.Permissions))
			}
		}

		if err := ctrl.assignPermissionsToUser(tx, &user, req.Permissions); err != nil {
			return err
		}

		// If is_affiliate is true, create affiliate record
		if req.IsAffiliate {
			// Get current user ID (admin who is creating the user)
			currentUserID, _ := c.Get("user_id")
			var createdByID uint
			if currentUserIDVal, ok := currentUserID.(uint); ok {
				createdByID = currentUserIDVal
			} else {
				// Fallback to user.ID if current user ID not available
				createdByID = user.ID
			}

			affiliate := models.Affiliate{
				FirstName:       user.Username, // Use username as default first name
				LastName:        "",            // Can be updated later
				FollowerCount:   0,
				RequiredContent: 0,
				Status:          models.AffiliateStatusActive,
				UrgentFollowUp:  false,
				AdminUserID:     &user.ID,
				CreatedByID:     createdByID, // Created by the admin who created the user
			}
			if err := tx.Create(&affiliate).Error; err != nil {
				log.Printf("⚠️  Warning: Failed to create affiliate record for new user %d: %v", user.ID, err)
				// Don't fail the transaction, just log the warning
			} else {
				log.Printf("✅ Created affiliate record for new user %d (username: %s) by admin %d", user.ID, user.Username, createdByID)
			}
		}

		return nil
	}); err != nil {
		log.Printf("Error creating admin user %s: %v", req.Username, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with permissions
	if err := ctrl.DB.Preload("Permissions").First(&user, user.ID).Error; err != nil {
		log.Printf("⚠️  Failed to reload user with permissions: %v", err)
	} else {
		ctrl.backfillSingleUser(&user)
		log.Printf("✅ Reloaded user %s with %d permissions", user.Username, len(user.Permissions))
	}

	log.Printf("✅ Admin user created: %s (ID: %d) with %d permissions", user.Username, user.ID, len(user.Permissions))
	c.JSON(http.StatusOK, gin.H{"user": user})
}

// UpdateAdminUser updates an admin user
func (ctrl *AdminUsersController) UpdateAdminUser(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user models.AdminUser
	if err := ctrl.DB.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	var req struct {
		Username            *string  `json:"username"`
		Password            *string  `json:"password"`
		IsActive            *bool    `json:"is_active"`
		IsAffiliate         *bool    `json:"is_affiliate"`
		AffiliatePercentage *float64 `json:"affiliate_percentage"`
		ContentModeEnabled  *bool    `json:"content_mode_enabled"`
		Name                *string  `json:"name"`
		Phone               *string  `json:"phone"`
		Permissions         []string `json:"permissions"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Update username if provided
	if req.Username != nil && *req.Username != user.Username {
		trimmed := strings.TrimSpace(*req.Username)
		if trimmed == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username cannot be empty"})
			return
		}

		// Check if new username already exists
		var existingUser models.AdminUser
		if err := ctrl.DB.Where("username = ? AND id != ?", trimmed, id).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
			return
		}
		user.Username = trimmed
	}

	// Update password if provided
	if req.Password != nil && *req.Password != "" {
		if len(*req.Password) < 6 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters"})
			return
		}
		hashedPassword, err := HashPassword(*req.Password)
		if err != nil {
			log.Printf("Error hashing password: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		user.Password = hashedPassword
	}

	// Update is_active if provided
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	// Update name if provided
	if req.Name != nil {
		trimmed := strings.TrimSpace(*req.Name)
		if trimmed == "" {
			user.Name = nil
		} else {
			user.Name = &trimmed
		}
	}

	// Update phone if provided
	if req.Phone != nil {
		trimmed := strings.TrimSpace(*req.Phone)
		if trimmed == "" {
			user.Phone = nil
		} else {
			user.Phone = &trimmed
		}
	}

	// Update affiliate_percentage if provided
	if req.AffiliatePercentage != nil {
		percentage := *req.AffiliatePercentage
		// Validate percentage: should be between 0 and 100
		if percentage < 0 || percentage > 100 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Affiliate percentage must be between 0 and 100"})
			return
		}
		user.AffiliatePercentage = &percentage
	}

	// Update content_mode_enabled if provided
	if req.ContentModeEnabled != nil {
		user.ContentModeEnabled = *req.ContentModeEnabled
	}

	// Track if is_affiliate changed
	var oldIsAffiliate bool
	var shouldCreateAffiliate bool
	var shouldUpdateAffiliate bool

	if req.IsAffiliate != nil {
		oldIsAffiliate = user.IsAffiliate
		user.IsAffiliate = *req.IsAffiliate
		shouldCreateAffiliate = !oldIsAffiliate && *req.IsAffiliate
		shouldUpdateAffiliate = oldIsAffiliate && !*req.IsAffiliate
	}

	if err := ctrl.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&user).Error; err != nil {
			return err
		}
		// CRITICAL: Always update permissions if provided (even if empty array)
		// This ensures permissions are properly saved to database
		if req.Permissions != nil {
			log.Printf("📋 UpdateAdminUser: Updating permissions for user %s (ID: %d) with %d permissions", user.Username, user.ID, len(req.Permissions))
			if err := ctrl.assignPermissionsToUser(tx, &user, req.Permissions); err != nil {
				log.Printf("❌ UpdateAdminUser: Failed to assign permissions: %v", err)
				return err
			}
			log.Printf("✅ UpdateAdminUser: Successfully assigned %d permissions to user %s", len(req.Permissions), user.Username)
		} else {
			log.Printf("⚠️ UpdateAdminUser: req.Permissions is nil - permissions will NOT be updated")
		}

		// Handle affiliate record creation/update inside transaction
		if shouldCreateAffiliate {
			// Get current user ID (admin who is enabling affiliate)
			currentUserID, _ := c.Get("user_id")
			var createdByID uint
			if currentUserIDVal, ok := currentUserID.(uint); ok {
				createdByID = currentUserIDVal
			} else {
				// Fallback to user.ID if current user ID not available
				createdByID = user.ID
			}

			// Check if affiliate record already exists
			var existingAffiliate models.Affiliate
			err := tx.Where("admin_user_id = ?", user.ID).First(&existingAffiliate).Error

			if err == gorm.ErrRecordNotFound {
				// Create new affiliate record
				affiliate := models.Affiliate{
					FirstName:       user.Username, // Use username as default first name
					LastName:        "",            // Can be updated later
					FollowerCount:   0,
					RequiredContent: 0,
					Status:          models.AffiliateStatusActive,
					UrgentFollowUp:  false,
					AdminUserID:     &user.ID,
					CreatedByID:     createdByID, // Created by the admin who enabled it
				}
				if err := tx.Create(&affiliate).Error; err != nil {
					log.Printf("⚠️  Warning: Failed to create affiliate record for user %d: %v", user.ID, err)
					// Don't fail transaction, just log
				} else {
					log.Printf("✅ Created affiliate record for user %d (username: %s) by admin %d", user.ID, user.Username, createdByID)
				}
			} else if err == nil {
				// Affiliate record exists, update it to active
				existingAffiliate.Status = models.AffiliateStatusActive
				existingAffiliate.AdminUserID = &user.ID
				if err := tx.Save(&existingAffiliate).Error; err != nil {
					log.Printf("⚠️  Warning: Failed to update affiliate record for user %d: %v", user.ID, err)
					// Don't fail transaction, just log
				} else {
					log.Printf("✅ Updated affiliate record for user %d (username: %s) to active", user.ID, user.Username)
				}
			}
		} else if shouldUpdateAffiliate {
			// If is_affiliate changed from true to false, update affiliate status (don't delete)
			var existingAffiliate models.Affiliate
			if err := tx.Where("admin_user_id = ?", user.ID).First(&existingAffiliate).Error; err == nil {
				existingAffiliate.AdminUserID = nil                       // Remove link to admin user
				existingAffiliate.Status = models.AffiliateStatusLeadPool // Change to lead pool
				if err := tx.Save(&existingAffiliate).Error; err != nil {
					log.Printf("⚠️  Warning: Failed to update affiliate record for user %d: %v", user.ID, err)
					// Don't fail transaction, just log
				}
			}
		}

		return nil
	}); err != nil {
		log.Printf("Error updating admin user %s: %v", user.Username, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// CRITICAL: Verify permissions were actually saved to database
	// Query the join table directly to ensure data is persisted
	var savedPermissionCount int64
	ctrl.DB.Table("admin_user_permissions").Where("admin_user_id = ?", user.ID).Count(&savedPermissionCount)
	log.Printf("🔍 Verification: admin_user_permissions table has %d records for user %s (ID: %d)", savedPermissionCount, user.Username, user.ID)

	// CRITICAL: Also verify which permission keys are in the join table
	var savedPermissionKeys []string
	ctrl.DB.Table("admin_user_permissions AS aup").
		Select("ap.`key`").
		Joins("JOIN admin_permissions ap ON ap.id = aup.admin_permission_id").
		Where("aup.admin_user_id = ?", user.ID).
		Order("ap.`key`").
		Pluck("ap.`key`", &savedPermissionKeys)
	log.Printf("🔍 Verification: Saved permission keys in join table: %v", savedPermissionKeys)

	// Reload user (without Preload - backfillSingleUser will fetch permissions directly from join table)
	// CRITICAL: Don't use Preload here - backfillSingleUser will fetch directly from join table
	// This ensures we always get the latest permissions without cache issues
	if err := ctrl.DB.First(&user, user.ID).Error; err != nil {
		log.Printf("⚠️  Warning: Failed to reload user: %v", err)
	} else {
		// CRITICAL: Always fetch permissions directly from join table (bypasses Preload cache)
		ctrl.backfillSingleUser(&user)
		// Log permission keys for debugging
		permissionKeys := make([]string, len(user.Permissions))
		for i, perm := range user.Permissions {
			permissionKeys[i] = perm.Key
		}
		log.Printf("✅ Reloaded user %s (ID: %d) with %d permissions from database: %v", user.Username, user.ID, len(user.Permissions), permissionKeys)

		// CRITICAL: Verify count matches
		if int64(len(user.Permissions)) != savedPermissionCount {
			log.Printf("⚠️  WARNING: Permission count mismatch! Preload returned %d, but join table has %d records", len(user.Permissions), savedPermissionCount)
			log.Printf("⚠️  WARNING: Preload keys: %v", permissionKeys)
			log.Printf("⚠️  WARNING: Join table keys: %v", savedPermissionKeys)
		} else {
			log.Printf("✅ Permission count verified: %d permissions match join table", len(user.Permissions))
			// Also verify keys match (order-independent comparison)
			if len(permissionKeys) == len(savedPermissionKeys) {
				// Create maps for order-independent comparison
				preloadKeysMap := make(map[string]bool)
				for _, key := range permissionKeys {
					preloadKeysMap[key] = true
				}
				joinTableKeysMap := make(map[string]bool)
				for _, key := range savedPermissionKeys {
					joinTableKeysMap[key] = true
				}

				// Check if all keys from preload exist in join table
				allKeysMatch := true
				missingInJoinTable := []string{}
				for _, key := range permissionKeys {
					if !joinTableKeysMap[key] {
						allKeysMatch = false
						missingInJoinTable = append(missingInJoinTable, key)
					}
				}

				// Check if all keys from join table exist in preload
				extraInJoinTable := []string{}
				for _, key := range savedPermissionKeys {
					if !preloadKeysMap[key] {
						allKeysMatch = false
						extraInJoinTable = append(extraInJoinTable, key)
					}
				}

				if !allKeysMatch {
					log.Printf("⚠️  WARNING: Permission keys don't match (order-independent)!")
					if len(missingInJoinTable) > 0 {
						log.Printf("⚠️  WARNING: Keys in Preload but NOT in join table: %v", missingInJoinTable)
					}
					if len(extraInJoinTable) > 0 {
						log.Printf("⚠️  WARNING: Keys in join table but NOT in Preload: %v", extraInJoinTable)
					}
					log.Printf("⚠️  WARNING: Preload keys (sorted): %v", getSortedKeys(permissionKeys))
					log.Printf("⚠️  WARNING: Join table keys (sorted): %v", getSortedKeys(savedPermissionKeys))
				} else {
					log.Printf("✅ Permission keys verified: All %d keys match join table (order-independent check)", len(permissionKeys))
				}
			}
		}
	}

	log.Printf("✅ Admin user updated: %s (ID: %d) with %d permissions (saved to database)", user.Username, user.ID, len(user.Permissions))
	c.JSON(http.StatusOK, gin.H{"user": user})
}

// assignPermissionsToUser replaces permissions deterministically using manual join table writes
// CRITICAL: This function does NOT create a new transaction - it uses the provided db connection
// This allows it to work within an existing transaction (from UpdateAdminUser or CreateAdminUser)
func (ctrl *AdminUsersController) assignPermissionsToUser(db *gorm.DB, user *models.AdminUser, permissionKeys []string) error {
	log.Printf("📋 assignPermissionsToUser => user=%s (ID:%d) keys=%v", user.Username, user.ID, permissionKeys)

	// Fetch permissions by keys
	var permissions []models.AdminPermission
	if len(permissionKeys) > 0 {
		if err := db.Where("`key` IN ?", permissionKeys).Find(&permissions).Error; err != nil {
			return err
		}
		log.Printf("   - Loaded %d permission records from DB", len(permissions))
	} else {
		log.Printf("   - Empty permission list provided, clearing all permissions")
	}

	// CRITICAL: Do NOT create a new transaction here - use the provided db connection
	// This allows the function to work within an existing transaction
	// Clear current join rows
	if err := db.Delete(&models.AdminUserPermission{}, "admin_user_id = ?", user.ID).Error; err != nil {
		return fmt.Errorf("failed clearing previous permissions: %w", err)
	}

	if len(permissions) == 0 {
		log.Printf("   - Permissions cleared for user %s", user.Username)
		return nil
	}

	now := time.Now()
	joinRows := make([]models.AdminUserPermission, 0, len(permissions))
	for _, perm := range permissions {
		joinRows = append(joinRows, models.AdminUserPermission{
			AdminUserID:       user.ID,
			AdminPermissionID: perm.ID,
			CreatedAt:         now,
		})
	}

	if err := db.Create(&joinRows).Error; err != nil {
		return fmt.Errorf("failed inserting permissions: %w", err)
	}

	log.Printf("   - Inserted %d join rows for user %s", len(joinRows), user.Username)
	return nil
}

// DeleteAdminUser deletes an admin user
func (ctrl *AdminUsersController) DeleteAdminUser(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get current user ID from context
	currentUserID, exists := c.Get("user_id")
	if exists && currentUserID.(uint) == uint(id) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete your own account"})
		return
	}

	var user models.AdminUser
	if err := ctrl.DB.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	// Clear permissions association
	ctrl.DB.Model(&user).Association("Permissions").Clear()

	// Delete user
	if err := ctrl.DB.Delete(&user).Error; err != nil {
		log.Printf("Error deleting admin user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	log.Printf("✅ Admin user deleted: %s (ID: %d)", user.Username, user.ID)
	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// GetMyPermissions returns permissions of the current logged-in user
func (ctrl *AdminUsersController) GetMyPermissions(c *gin.Context) {
	// NOTE: ensureDefaultPermissions is NOT called here to avoid overriding user permissions
	// Permissions sync should only happen via explicit sync endpoint or on startup

	username, exists := c.Get("username")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	var user models.AdminUser
	if err := ctrl.DB.Preload("Permissions").Where("username = ?", username).First(&user).Error; err != nil {
		log.Printf("❌ GetMyPermissions: User '%s' not found: %v", username, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	ctrl.backfillSingleUser(&user)

	// Super-admin: همیشه تمام پرمیژن‌ها را به کاربر "admin" برمی‌گردانیم (و در DB سینک می‌کنیم)
	if user.Username == "admin" {
		var allPermissions []models.AdminPermission
		if err := ctrl.DB.Find(&allPermissions).Error; err == nil && len(allPermissions) > 0 {
			_ = ctrl.DB.Model(&user).Association("Permissions").Replace(allPermissions)
			// Reload to reflect association
			ctrl.DB.Preload("Permissions").First(&user, user.ID)
		}
	}

	// Extract permission keys
	permissionKeys := make([]string, len(user.Permissions))
	for i, perm := range user.Permissions {
		permissionKeys[i] = perm.Key
	}

	log.Printf("✅ GetMyPermissions: User '%s' has %d permissions", username, len(permissionKeys))

	c.JSON(http.StatusOK, gin.H{
		"permissions": permissionKeys,
		"user": gin.H{
			"id":                   user.ID,
			"username":             user.Username,
			"is_active":            user.IsActive,
			"is_affiliate":         user.IsAffiliate,
			"content_mode_enabled": user.ContentModeEnabled,
		},
	})
}

// HasPermission checks if the current user has a specific permission
// This is a helper function that can be used in controllers
func HasPermission(c *gin.Context, db *gorm.DB, requiredPermission string) bool {
	username, exists := c.Get("username")
	if !exists {
		return false
	}

	var user models.AdminUser
	if err := db.Preload("Permissions").Where("username = ? AND is_active = ?", username, true).First(&user).Error; err != nil {
		return false
	}

	controller := AdminUsersController{DB: db}
	controller.backfillSingleUser(&user)

	// Super-admin shortcut: کاربر اصلی "admin" همه دسترسی‌ها را دارد حتی اگر لیست پرمیژن ناقص باشد.
	if user.Username == "admin" {
		return true
	}

	// Check if user has the required permission
	for _, perm := range user.Permissions {
		if perm.Key == requiredPermission {
			return true
		}
	}

	return false
}

func (ctrl *AdminUsersController) backfillPermissions(users []models.AdminUser) {
	for i := range users {
		ctrl.backfillSingleUser(&users[i])
	}
}

func (ctrl *AdminUsersController) ensureDefaultPermissions() error {
	defaultPerms := models.GetDefaultPermissions()
	// var newPermissionsCreated bool // CRITICAL: Disabled - we don't auto-grant permissions to all users
	var createdCount int
	var updatedCount int

	// Log payment-related permissions
	paymentPerms := []string{}
	for _, perm := range defaultPerms {
		if perm.Category == "payments" {
			paymentPerms = append(paymentPerms, perm.Key)
		}
	}
	log.Printf("📋 ensureDefaultPermissions: Checking %d payment permissions: %v", len(paymentPerms), paymentPerms)

	for _, perm := range defaultPerms {
		var existing models.AdminPermission
		err := ctrl.DB.Where("`key` = ?", perm.Key).First(&existing).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				if createErr := ctrl.DB.Create(&perm).Error; createErr != nil {
					log.Printf("❌ Failed to create permission %s: %v", perm.Key, createErr)
					return createErr
				}
				// newPermissionsCreated = true // CRITICAL: Disabled - we don't auto-grant permissions to all users
				createdCount++
				if perm.Category == "payments" {
					log.Printf("✅ Created payment permission: %s (%s)", perm.Key, perm.Name)
				}
				continue
			}
			return err
		}

		needsUpdate := existing.Name != perm.Name || existing.Description != perm.Description || existing.Category != perm.Category
		if needsUpdate {
			existing.Name = perm.Name
			existing.Description = perm.Description
			existing.Category = perm.Category
			if saveErr := ctrl.DB.Save(&existing).Error; saveErr != nil {
				return saveErr
			}
			updatedCount++
			if perm.Category == "payments" {
				log.Printf("✅ Updated payment permission: %s (%s)", perm.Key, perm.Name)
			}
		}
	}

	log.Printf("📋 ensureDefaultPermissions: Created %d new permissions, updated %d permissions", createdCount, updatedCount)

	// CRITICAL: Don't automatically grant new permissions to all users
	// This would override custom permission settings that admins have configured
	// New permissions should only be granted via explicit sync endpoint (SyncPermissions)
	// if newPermissionsCreated {
	// 	log.Printf("🔄 New permissions detected, granting to all users...")
	// 	if err := ctrl.grantNewPermissionsToAllUsers(); err != nil {
	// 		log.Printf("⚠️ Failed to grant new permissions to all users: %v", err)
	// 		// Don't return error, just log it
	// 	} else {
	// 		log.Printf("✅ Successfully granted new permissions to all users")
	// 	}
	// }

	// Double-check: verify all payment permissions exist
	var paymentPermsInDB []models.AdminPermission
	if err := ctrl.DB.Where("category = ?", "payments").Find(&paymentPermsInDB).Error; err == nil {
		expectedPaymentCount := 13 // Total expected payment permissions
		if len(paymentPermsInDB) < expectedPaymentCount {
			log.Printf("⚠️ ensureDefaultPermissions: Only %d payment permissions in DB, expected %d. Re-running sync...", len(paymentPermsInDB), expectedPaymentCount)
			// Force re-sync by trying to create missing ones again
			// CRITICAL: Don't track createdInDoubleCheck - we don't auto-grant permissions to all users
			// var createdInDoubleCheck bool // CRITICAL: Disabled - we don't auto-grant permissions to all users
			for _, perm := range defaultPerms {
				if perm.Category == "payments" {
					var existing models.AdminPermission
					if err := ctrl.DB.Where("`key` = ?", perm.Key).First(&existing).Error; err != nil {
						if errors.Is(err, gorm.ErrRecordNotFound) {
							if createErr := ctrl.DB.Create(&perm).Error; createErr != nil {
								log.Printf("❌ Failed to create missing permission %s: %v", perm.Key, createErr)
							} else {
								log.Printf("✅ Created missing payment permission: %s", perm.Key)
								// createdInDoubleCheck = true // CRITICAL: Disabled - we don't auto-grant permissions to all users
							}
						}
					}
				}
			}
			// CRITICAL: Don't automatically grant new permissions to all users
			// This would override custom permission settings that admins have configured
			// New permissions should only be granted via explicit sync endpoint (SyncPermissions)
			// if createdInDoubleCheck {
			// 	log.Printf("🔄 New permissions created in double-check, granting to all users...")
			// 	if err := ctrl.grantNewPermissionsToAllUsers(); err != nil {
			// 		log.Printf("⚠️ Failed to grant new permissions to all users: %v", err)
			// 		// Don't return error, just log it
			// 	} else {
			// 		log.Printf("✅ Successfully granted new permissions to all users (from double-check)")
			// 	}
			// }
		}
	}

	return nil
}

// grantNewPermissionsToAllUsers grants NEW permissions to all existing admin users
// This only adds new permissions, it does NOT replace existing permissions
func (ctrl *AdminUsersController) grantNewPermissionsToAllUsers() error {
	// Get all permissions
	var allPermissions []models.AdminPermission
	if err := ctrl.DB.Find(&allPermissions).Error; err != nil {
		return err
	}

	if len(allPermissions) == 0 {
		return nil
	}

	// Get all admin users
	var allUsers []models.AdminUser
	if err := ctrl.DB.Find(&allUsers).Error; err != nil {
		return err
	}

	// For each user, add only NEW permissions (don't replace existing ones)
	for _, user := range allUsers {
		// Get current user permissions
		var currentPermissions []models.AdminPermission
		if err := ctrl.DB.Model(&user).Association("Permissions").Find(&currentPermissions); err != nil {
			log.Printf("⚠️ Failed to fetch current permissions for user %s (ID: %d): %v", user.Username, user.ID, err)
			continue
		}

		// Create a map of current permission IDs for quick lookup
		currentPermIDs := make(map[uint]bool)
		for _, perm := range currentPermissions {
			currentPermIDs[perm.ID] = true
		}

		// Find new permissions that user doesn't have
		newPermissions := []models.AdminPermission{}
		for _, perm := range allPermissions {
			if !currentPermIDs[perm.ID] {
				newPermissions = append(newPermissions, perm)
			}
		}

		// Add only new permissions (don't replace existing ones)
		if len(newPermissions) > 0 {
			if err := ctrl.DB.Model(&user).Association("Permissions").Append(newPermissions); err != nil {
				log.Printf("⚠️ Failed to add new permissions to user %s (ID: %d): %v", user.Username, user.ID, err)
				continue
			}
			log.Printf("✅ Added %d new permissions to user %s (ID: %d) (user now has %d total permissions)",
				len(newPermissions), user.Username, user.ID, len(currentPermissions)+len(newPermissions))
		} else {
			log.Printf("ℹ️ No new permissions to add for user %s (ID: %d) - user already has all permissions", user.Username, user.ID)
		}
	}

	return nil
}

func (ctrl *AdminUsersController) backfillSingleUser(user *models.AdminUser) {
	if user == nil {
		return
	}

	// CRITICAL: Always fetch permissions directly from join table to ensure we get the latest data
	// This prevents issues with GORM cache or stale Preload data
	// Even if Preload already loaded permissions, we re-fetch to ensure accuracy
	perms, err := ctrl.fetchPermissionsRaw(user.ID)
	if err == nil {
		// Replace permissions with fresh data from join table
		user.Permissions = perms
		log.Printf("🔍 backfillSingleUser: Fetched %d permissions from join table for user %s (ID: %d)", len(perms), user.Username, user.ID)
	} else {
		log.Printf("⚠️ backfillSingleUser: Failed to fetch permissions for user %s (ID: %d): %v", user.Username, user.ID, err)
		// If fetch fails, keep existing permissions (from Preload) as fallback
	}
	user.PermissionsCount = len(user.Permissions)
}

func (ctrl *AdminUsersController) fetchPermissionsRaw(userID uint) ([]models.AdminPermission, error) {
	var perms []models.AdminPermission
	// CRITICAL: Use direct SQL query to bypass GORM cache and ensure fresh data
	// This ensures we always get the latest permissions from the join table
	err := ctrl.DB.Table("admin_permissions AS ap").
		Select("ap.*").
		Joins("JOIN admin_user_permissions aup ON ap.id = aup.admin_permission_id").
		Where("aup.admin_user_id = ?", userID).
		Order("ap.category, ap.name"). // Consistent ordering
		Find(&perms).Error

	return perms, err
}

// getSortedKeys returns a sorted copy of the keys slice for consistent comparison
func getSortedKeys(keys []string) []string {
	sorted := make([]string, len(keys))
	copy(sorted, keys)
	sort.Strings(sorted)
	return sorted
}

// SyncPermissions syncs all default permissions to database (adds missing ones)
// and grants all permissions to all admin users
func (ctrl *AdminUsersController) SyncPermissions(c *gin.Context) {
	// Step 1: Ensure all default permissions exist in database
	if err := ctrl.ensureDefaultPermissions(); err != nil {
		log.Printf("⚠️ Failed to sync default permissions: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to sync permissions",
			"details": err.Error(),
		})
		return
	}

	// Step 2: Get all permissions from database
	var allPermissions []models.AdminPermission
	if err := ctrl.DB.Find(&allPermissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch permissions"})
		return
	}

	// CRITICAL: Don't automatically grant permissions to all users
	// This would override custom permission settings that admins have configured
	// SyncPermissions should only ensure permissions exist in database, not grant them
	// Permissions should be manually assigned via UpdateAdminUser endpoint
	log.Printf("📋 SyncPermissions: Permissions synced to database. Manual assignment required via UpdateAdminUser endpoint.")

	permissionKeys := make([]string, len(allPermissions))
	for i, perm := range allPermissions {
		permissionKeys[i] = perm.Key
	}

	// Log payment-related permissions
	paymentPerms := []string{}
	for _, perm := range allPermissions {
		if perm.Category == "payments" {
			paymentPerms = append(paymentPerms, perm.Key)
		}
	}
	log.Printf("📋 Payment-related permissions: %v", paymentPerms)

	log.Printf("✅ Synced permissions: %d total permissions in database", len(permissionKeys))

	// Return detailed payment permissions info
	paymentPermsDetail := []gin.H{}
	for _, perm := range allPermissions {
		if perm.Category == "payments" {
			paymentPermsDetail = append(paymentPermsDetail, gin.H{
				"key":         perm.Key,
				"name":        perm.Name,
				"description": perm.Description,
				"category":    perm.Category,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":             "Permissions synced successfully",
		"permissions":         permissionKeys,
		"count":               len(permissionKeys),
		"payment_permissions": paymentPermsDetail,
		"payment_count":       len(paymentPermsDetail),
	})
}

// DebugPaymentPermissions returns all payment-related permissions for debugging
func (ctrl *AdminUsersController) DebugPaymentPermissions(c *gin.Context) {
	// Get default permissions from code
	defaultPerms := models.GetDefaultPermissions()
	paymentPermsFromCode := []models.AdminPermission{}
	for _, perm := range defaultPerms {
		if perm.Category == "payments" {
			paymentPermsFromCode = append(paymentPermsFromCode, perm)
		}
	}

	// Get permissions from database
	var allPermissions []models.AdminPermission
	if err := ctrl.DB.Where("category = ?", "payments").Order("name").Find(&allPermissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch permissions"})
		return
	}

	// Check which ones are missing
	missingPerms := []models.AdminPermission{}
	for _, codePerm := range paymentPermsFromCode {
		found := false
		for _, dbPerm := range allPermissions {
			if dbPerm.Key == codePerm.Key {
				found = true
				break
			}
		}
		if !found {
			missingPerms = append(missingPerms, codePerm)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"from_code": gin.H{
			"count":       len(paymentPermsFromCode),
			"permissions": paymentPermsFromCode,
		},
		"from_database": gin.H{
			"count":       len(allPermissions),
			"permissions": allPermissions,
		},
		"missing": gin.H{
			"count":       len(missingPerms),
			"permissions": missingPerms,
		},
	})
}

// GrantAllPermissionsToAdmin grants all permissions to admin user (utility endpoint)
func (ctrl *AdminUsersController) GrantAllPermissionsToAdmin(c *gin.Context) {
	var admin models.AdminUser
	if err := ctrl.DB.Where("username = ?", "admin").First(&admin).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Admin user not found"})
		return
	}

	// Ensure all permissions exist
	if err := ctrl.ensureDefaultPermissions(); err != nil {
		log.Printf("⚠️ Failed to sync default permissions: %v", err)
	}

	// Get all permissions
	var allPermissions []models.AdminPermission
	if err := ctrl.DB.Find(&allPermissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch permissions"})
		return
	}

	// Grant all permissions
	ctrl.DB.Model(&admin).Association("Permissions").Clear()
	if err := ctrl.DB.Model(&admin).Association("Permissions").Replace(allPermissions); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to grant permissions"})
		return
	}

	// Reload to verify
	ctrl.DB.Preload("Permissions").First(&admin, admin.ID)

	permissionKeys := make([]string, len(admin.Permissions))
	for i, perm := range admin.Permissions {
		permissionKeys[i] = perm.Key
	}

	log.Printf("✅ Manually granted %d permissions to admin user", len(permissionKeys))

	c.JSON(http.StatusOK, gin.H{
		"message":     "All permissions granted to admin",
		"permissions": permissionKeys,
		"count":       len(permissionKeys),
	})
}
