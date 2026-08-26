//go:build ignore
// +build ignore

// This is a standalone script - build it separately: go build -o sync_permissions ./scripts/sync_permissions.go

package main

import (
	"log"
	"fitino-live-backend/config"
	"fitino-live-backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	log.Println("🔧 Sync Permissions to Database")
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
	); err != nil {
		log.Printf("⚠️  Warning: Failed to run migrations: %v", err)
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
					log.Printf("✅ Created permission: %s (%s)", perm.Key, perm.Name)
				}
			}
		} else {
			// Update if name, description, or category changed
			needsUpdate := existingPerm.Name != perm.Name || existingPerm.Description != perm.Description || existingPerm.Category != perm.Category
			if needsUpdate {
				existingPerm.Name = perm.Name
				existingPerm.Description = perm.Description
				existingPerm.Category = perm.Category
				if err := db.Save(&existingPerm).Error; err != nil {
					log.Printf("⚠️  Failed to update permission %s: %v", perm.Key, err)
				} else {
					log.Printf("✅ Updated permission: %s (%s)", perm.Key, perm.Name)
				}
			}
		}
	}

	// Get all permissions
	var allPermissions []models.AdminPermission
	if err := db.Find(&allPermissions).Error; err != nil {
		log.Fatalf("❌ Failed to fetch permissions: %v", err)
	}

	log.Printf("✅ Total permissions in database: %d", len(allPermissions))

	// Grant all permissions to all admin users
	log.Println("📋 Granting all permissions to all admin users...")
	var allUsers []models.AdminUser
	if err := db.Find(&allUsers).Error; err != nil {
		log.Fatalf("❌ Failed to fetch admin users: %v", err)
	}

	for _, user := range allUsers {
		if err := db.Model(&user).Association("Permissions").Replace(allPermissions); err != nil {
			log.Printf("⚠️  Failed to grant permissions to user %s (ID: %d): %v", user.Username, user.ID, err)
			continue
		}
		log.Printf("✅ Granted all %d permissions to user %s (ID: %d)", len(allPermissions), user.Username, user.ID)
	}

	// List all payment-related permissions
	log.Println("\n📋 Payment-related permissions:")
	for _, perm := range allPermissions {
		if perm.Category == "payments" {
			log.Printf("  - %s: %s", perm.Key, perm.Name)
		}
	}

	log.Println("\n✅ Permissions sync completed successfully!")
}

