//go:build ignore
// +build ignore

// This is a standalone script - build it separately: go build -o grant_permissions ./scripts/grant_all_permissions_to_admin.go

package main

import (
	"log"
	"fitino-live-backend/config"
	"fitino-live-backend/controllers"
	"fitino-live-backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	log.Println("🔧 Grant All Permissions to Admin User")
	log.Println("======================================")

	// Load config
	cfg := config.LoadConfig()

	// Connect to database
	db, err := gorm.Open(mysql.Open(cfg.GetDSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	log.Println("✅ Connected to database")

	// Auto-migrate models to ensure tables exist
	log.Println("📋 Running migrations...")
	if err := db.AutoMigrate(
		&models.AdminUser{},
		&models.AdminPermission{},
		&models.SystemConfig{},
	); err != nil {
		log.Printf("⚠️  Warning: Failed to run migrations: %v", err)
	}

	// Ensure system_configs table has correct structure
	log.Println("📋 Ensuring system_configs table structure...")
	if err := config.EnsureSystemConfigTable(db); err != nil {
		log.Printf("⚠️  Warning: Failed to ensure system_configs table structure: %v", err)
	}

	// Ensure all permissions exist
	log.Println("📋 Ensuring all permissions exist...")
	defaultPermissions := models.GetDefaultPermissions()
	for _, perm := range defaultPermissions {
		var existingPerm models.AdminPermission
		if err := db.Where("`key` = ?", perm.Key).First(&existingPerm).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := db.Create(&perm).Error; err != nil {
					log.Printf("⚠️  Failed to create permission %s: %v", perm.Key, err)
				} else {
					log.Printf("✅ Created permission: %s", perm.Key)
				}
			}
		}
	}

	// Find admin user
	var admin models.AdminUser
	if err := db.Where("username = ?", "admin").First(&admin).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			log.Println("❌ Admin user not found. Creating...")
			if err := controllers.CreateDefaultAdmin(db); err != nil {
				log.Fatalf("❌ Failed to create admin user: %v", err)
			}
			// Reload admin user
			if err := db.Where("username = ?", "admin").First(&admin).Error; err != nil {
				log.Fatalf("❌ Failed to reload admin user: %v", err)
			}
		} else {
			log.Fatalf("❌ Failed to find admin user: %v", err)
		}
	}

	log.Printf("✅ Found admin user: %s (ID: %d)", admin.Username, admin.ID)

	// Ensure admin is active
	if !admin.IsActive {
		admin.IsActive = true
		db.Save(&admin)
		log.Println("✅ Activated admin user")
	}

	// Get all permissions
	var allPermissions []models.AdminPermission
	if err := db.Find(&allPermissions).Error; err != nil {
		log.Fatalf("❌ Failed to fetch permissions: %v", err)
	}

	log.Printf("📋 Found %d permissions in database", len(allPermissions))

	// Clear existing permissions
	if err := db.Model(&admin).Association("Permissions").Clear(); err != nil {
		log.Printf("⚠️  Warning: Failed to clear existing permissions: %v", err)
	}

	// Grant all permissions
	if err := db.Model(&admin).Association("Permissions").Replace(allPermissions); err != nil {
		log.Fatalf("❌ Failed to grant permissions: %v", err)
	}

	log.Printf("✅ Successfully granted all %d permissions to admin user!", len(allPermissions))
	log.Println("======================================")
	log.Println("✅ Admin user now has full access to all features!")
}
