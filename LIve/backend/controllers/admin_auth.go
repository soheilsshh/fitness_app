package controllers

import (
	"crypto/subtle"
	"log"
	"fitino-live-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var jwtSecret = []byte("your-secret-key-change-in-production") // TODO: Move to config

type AdminLoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AdminLoginResponse struct {
	Token string `json:"token"`
}

type AdminClaims struct {
	Username string `json:"username"`
	UserID   uint   `json:"user_id"`
	jwt.RegisteredClaims
}

// HashPassword hashes a password using bcrypt
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPasswordHash compares password with hash
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// CreateDefaultAdmin creates default admin user if not exists and grants all permissions
func CreateDefaultAdmin(db *gorm.DB) error {
	var admin models.AdminUser
	result := db.Where("username = ?", "admin").First(&admin)

	// First, ensure all permissions exist in database
	defaultPermissions := models.GetDefaultPermissions()
	for _, perm := range defaultPermissions {
		var existingPerm models.AdminPermission
		if err := db.Where("`key` = ?", perm.Key).First(&existingPerm).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// Permission doesn't exist, create it
				if err := db.Create(&perm).Error; err != nil {
					log.Printf("WARNING: Failed to create permission %s: %v", perm.Key, err)
				} else {
					log.Printf("✅ Created permission: %s", perm.Key)
				}
			} else {
				log.Printf("WARNING: Error checking permission %s: %v", perm.Key, err)
			}
		}
	}

	if result.Error == gorm.ErrRecordNotFound {
		// Default password: admin123 (CHANGE THIS IN PRODUCTION!)
		hashedPassword, err := HashPassword("admin123")
		if err != nil {
			log.Printf("ERROR: Failed to hash admin password: %v", err)
			return err
		}

		admin = models.AdminUser{
			Username: "admin",
			Password: hashedPassword,
			IsActive: true,
		}

		if err := db.Create(&admin).Error; err != nil {
			log.Printf("ERROR: Failed to create admin user: %v", err)
			return err
		}

		log.Printf("✅ Default admin user created successfully (username: admin, password: admin123)")
		log.Printf("⚠️  WARNING: Please change the default password in production!")
	} else if result.Error != nil {
		log.Printf("ERROR: Failed to check for existing admin user: %v", result.Error)
		return result.Error
	} else {
		log.Printf("ℹ️  Admin user already exists (username: admin)")
		// Ensure admin is active
		if !admin.IsActive {
			admin.IsActive = true
			db.Save(&admin)
			log.Printf("✅ Activated admin user")
		}
	}

	// Grant all permissions to admin user
	var allPermissions []models.AdminPermission
	if err := db.Find(&allPermissions).Error; err != nil {
		log.Printf("WARNING: Failed to fetch permissions: %v", err)
		return err
	}

	if len(allPermissions) == 0 {
		log.Printf("⚠️  No permissions found in database. Creating default permissions...")
		// Try to create permissions again
		defaultPermissions := models.GetDefaultPermissions()
		for _, perm := range defaultPermissions {
			var existingPerm models.AdminPermission
			if err := db.Where("`key` = ?", perm.Key).First(&existingPerm).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					if err := db.Create(&perm).Error; err != nil {
						log.Printf("WARNING: Failed to create permission %s: %v", perm.Key, err)
					}
				}
			}
		}
		// Fetch again
		if err := db.Find(&allPermissions).Error; err != nil {
			log.Printf("WARNING: Still no permissions after creation attempt: %v", err)
			return nil
		}
	}

	if len(allPermissions) == 0 {
		log.Printf("⚠️  Still no permissions available. Admin will have limited access.")
		return nil
	}

	// Clear existing permissions and add all permissions
	if err := db.Model(&admin).Association("Permissions").Clear(); err != nil {
		log.Printf("WARNING: Failed to clear existing permissions: %v", err)
	}

	if err := db.Model(&admin).Association("Permissions").Replace(allPermissions); err != nil {
		log.Printf("ERROR: Failed to grant permissions to admin: %v", err)
		return err
	}

	// Reload admin to verify permissions
	if err := db.Preload("Permissions").First(&admin, admin.ID).Error; err != nil {
		log.Printf("WARNING: Failed to reload admin with permissions: %v", err)
	} else {
		log.Printf("✅ Granted all %d permissions to admin user (verified: %d permissions)", len(allPermissions), len(admin.Permissions))
		if len(admin.Permissions) == 0 {
			log.Printf("⚠️  WARNING: Admin user still has 0 permissions after grant attempt!")
		}
	}

	return nil
}

// AdminLogin handles admin login
func AdminLogin(c *gin.Context, db *gorm.DB) {
	var req AdminLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var admin models.AdminUser
	if err := db.Where("username = ?", req.Username).First(&admin).Error; err != nil {
		log.Printf("❌ Admin login failed: User '%s' not found", req.Username)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check password using constant-time comparison
	if !CheckPasswordHash(req.Password, admin.Password) {
		log.Printf("❌ Admin login failed: Invalid password for user '%s'", req.Username)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	log.Printf("✅ Admin login successful: User '%s' logged in", req.Username)

	// Generate JWT token
	expirationTime := time.Now().Add(24 * time.Hour) // Token valid for 24 hours
	claims := &AdminClaims{
		Username: admin.Username,
		UserID:   admin.ID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, AdminLoginResponse{Token: tokenString})
}

// AuthMiddleware validates JWT token
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Remove "Bearer " prefix if present
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		claims := &AdminClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Store username and user ID in context
		c.Set("username", claims.Username)
		c.Set("user_id", claims.UserID)
		c.Next()
	}
}

// GetCurrentUserPermissions returns permissions of the current logged-in user
func GetCurrentUserPermissions(c *gin.Context, db *gorm.DB) ([]string, error) {
	username, exists := c.Get("username")
	if !exists {
		return nil, gorm.ErrRecordNotFound
	}

	var user models.AdminUser
	if err := db.Preload("Permissions").Where("username = ? AND is_active = ?", username, true).First(&user).Error; err != nil {
		return nil, err
	}

	permissionKeys := make([]string, len(user.Permissions))
	for i, perm := range user.Permissions {
		permissionKeys[i] = perm.Key
	}

	return permissionKeys, nil
}

// SecureStringCompare compares two strings in constant time to prevent timing attacks
func SecureStringCompare(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}
