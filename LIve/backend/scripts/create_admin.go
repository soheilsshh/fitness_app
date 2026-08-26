package main

import (
	"log"
	"fitino-live-backend/config"
	"fitino-live-backend/controllers"
	"fitino-live-backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main5() {
	log.Println("🔧 Admin User Setup Script")
	log.Println("==========================")

	// Load config
	cfg := config.LoadConfig()

	// Connect to database
	db, err := gorm.Open(mysql.Open(cfg.GetDSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	log.Println("✅ Connected to database")

	// Auto-migrate models (create tables if they don't exist)
	log.Println("📋 Running migrations...")
	if err := db.AutoMigrate(
		&models.User{},
		&models.ChatMessage{},
		&models.Webinar{},
		&models.WebinarActivity{},
		&models.AdminUser{},
		&models.AdminPermission{},
		&models.SystemConfig{},
	); err != nil {
		log.Fatalf("❌ Failed to run migrations: %v", err)
	}
	log.Println("✅ Migrations completed")

	// Ensure system_configs table has correct structure
	log.Println("📋 Ensuring system_configs table structure...")
	if err := config.EnsureSystemConfigTable(db); err != nil {
		log.Printf("⚠️  Warning: Failed to ensure system_configs table structure: %v", err)
	}

	// Initialize config in database
	log.Println("📋 Initializing config in database...")
	config.InitializeConfigInDB(db, cfg)
	log.Println("✅ Config initialization completed")

	// Create default admin user
	log.Println("🔐 Creating admin user...")
	if err := controllers.CreateDefaultAdmin(db); err != nil {
		log.Fatalf("❌ Failed to create admin user: %v", err)
	}

	log.Println("✅ Admin user setup completed!")
	log.Println("==========================")
	log.Println("Username: admin")
	log.Println("Password: admin123")
	log.Println("⚠️  Please change the password after first login!")
}
