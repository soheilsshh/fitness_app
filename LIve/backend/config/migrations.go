package config

import (
	"log"
	"fitino-live-backend/models"
	"strconv"
	"time"

	"gorm.io/gorm"
)

// EnsureSystemConfigTable ensures system_configs table exists with correct structure
// This migration ensures the table has proper unique index on `key` column
func EnsureSystemConfigTable(db *gorm.DB) error {
	// OPTIMIZED: Only log in info mode (startup logs are important)
	log.Println("Ensuring system_configs table structure...")

	// Check if table exists
	if !db.Migrator().HasTable(&models.SystemConfig{}) {
		log.Println("Creating system_configs table...")
		if err := db.Migrator().CreateTable(&models.SystemConfig{}); err != nil {
			log.Printf("Failed to create system_configs table: %v", err)
			return err
		}
		log.Println("system_configs table created")
	} else {
		// Only log in debug mode - skip for production
		// log.Println("system_configs table already exists")
	}

	// Ensure unique index on `key` column exists
	// This is critical for INSERT ... ON DUPLICATE KEY UPDATE to work
	if !db.Migrator().HasIndex(&models.SystemConfig{}, "key") {
		log.Println("Creating unique index on `key` column...")
		// Create unique index using raw SQL for better control
		if err := db.Exec("CREATE UNIQUE INDEX idx_system_configs_key ON system_configs (`key`)").Error; err != nil {
			// Index might already exist, skip warning in production
			// log.Printf("Failed to create unique index (might already exist): %v", err)
			// Try alternative: check if index exists with different name
			if err := db.Exec("ALTER TABLE system_configs ADD UNIQUE INDEX idx_system_configs_key (`key`)").Error; err != nil {
				// Alternative also failed, skip warning
			} else {
				log.Println("Unique index created successfully")
			}
		} else {
			log.Println("Unique index created successfully")
		}
	}
	// Skip verification logs in production

	return nil
}

// SeedDefaultSubscriptionPrice ensures subscription_price exists in database with default value
// This seeder runs after table creation and ensures the value is always present
func SeedDefaultSubscriptionPrice(db *gorm.DB, defaultPrice int) error {
	log.Printf("🌱 Seeding default subscription_price: %d", defaultPrice)

	// Use INSERT ... ON DUPLICATE KEY UPDATE to ensure value exists
	// This is idempotent - safe to run multiple times
	sqlQuery := "INSERT INTO system_configs (`key`, value, created_at, updated_at) VALUES (?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE updated_at = NOW()"

	result := db.Exec(sqlQuery, "payment.subscription_price", strconv.Itoa(defaultPrice))
	if result.Error != nil {
		log.Printf("Failed to seed subscription_price: %v", result.Error)
		return result.Error
	}

	// Skip success logs in production (startup operation)
	// if result.RowsAffected > 0 {
	// 	log.Printf("Seeded subscription_price: %d (rows affected: %d)", defaultPrice, result.RowsAffected)
	// }

	// Verify it was seeded correctly
	var verifyConfig models.SystemConfig
	if err := db.Where("`key` = ?", "payment.subscription_price").First(&verifyConfig).Error; err != nil {
		log.Printf("WARNING: Could not verify seeded subscription_price: %v", err)
		return err
	}

	// Skip verification logs in production
	return nil
}

// EnsureAffiliatePercentageField ensures affiliate_percentage field exists in admin_users table
// This migration adds the affiliate_percentage field if it doesn't exist
func EnsureAffiliatePercentageField(db *gorm.DB) error {
	log.Println("Ensuring affiliate_percentage field in admin_users table...")

	// Check if column exists
	if db.Migrator().HasColumn(&models.AdminUser{}, "affiliate_percentage") {
		// Column already exists, skip
		return nil
	}

	// Add column using raw SQL for better control
	// DECIMAL(5,2) allows values from 0.00 to 999.99 (enough for percentage 0-100)
	if err := db.Exec("ALTER TABLE admin_users ADD COLUMN affiliate_percentage DECIMAL(5,2) DEFAULT 0 COMMENT 'درصد سود افیلیت (مثلاً 20.00 برای 20%)'").Error; err != nil {
		log.Printf("Failed to add affiliate_percentage column: %v", err)
		return err
	}

	log.Println("affiliate_percentage field added to admin_users table")
	return nil
}

// EnsureContentModeEnabledField ensures content_mode_enabled field exists in admin_users table
// This migration adds the content_mode_enabled field if it doesn't exist
func EnsureContentModeEnabledField(db *gorm.DB) error {
	log.Println("Ensuring content_mode_enabled field in admin_users table...")

	// Check if column exists
	if db.Migrator().HasColumn(&models.AdminUser{}, "content_mode_enabled") {
		// Column already exists, skip
		return nil
	}

	// Add column using raw SQL for better control
	if err := db.Exec("ALTER TABLE admin_users ADD COLUMN content_mode_enabled TINYINT(1) DEFAULT 0 COMMENT 'آیا حالت محتوا سازی برای این کاربر فعال است'").Error; err != nil {
		log.Printf("Failed to add content_mode_enabled column: %v", err)
		return err
	}

	log.Println("content_mode_enabled field added to admin_users table")
	return nil
}

// MigrateSubscriptionPrice migrates old price format to new format
// Old format: prices less than 100000 (e.g., 49000)
// New format: prices multiplied by 100 (e.g., 4900000)
func MigrateSubscriptionPrice(db *gorm.DB) error {
	log.Println("🔄 Migrating subscription_price format if needed...")

	var priceConfig models.SystemConfig
	if err := db.Where("`key` = ?", "payment.subscription_price").First(&priceConfig).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Skip log in production
			return nil
		}
		log.Printf("Error checking subscription_price: %v", err)
		return err
	}

	oldPrice, err := strconv.Atoi(priceConfig.Value)
	if err != nil {
		log.Printf("Failed to parse subscription_price '%s': %v", priceConfig.Value, err)
		return err
	}

	// Check if price is in old format (less than 100000)
	if oldPrice < 100000 {
		// Old format detected - multiply by 100
		newPrice := oldPrice * 100
		priceConfig.Value = strconv.Itoa(newPrice)
		priceConfig.UpdatedAt = time.Now()

		if err := db.Save(&priceConfig).Error; err != nil {
			log.Printf("Failed to migrate subscription_price: %v", err)
			return err
		}

		// Only log actual migrations (important)
		log.Printf("Migrated subscription_price: %d -> %d", oldPrice, newPrice)
	}
	// Skip "already in new format" logs in production

	return nil
}
