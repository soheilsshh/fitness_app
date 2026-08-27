package main

import (
	"log"
	"fitino-live-backend/config"
	"fitino-live-backend/controllers"
	"fitino-live-backend/models"
	"fitino-live-backend/routes"
	"fitino-live-backend/scheduler"
	"fitino-live-backend/services"
	"fitino-live-backend/streaming"
	"fitino-live-backend/utils"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	// OPTIMIZATION: Initialize logger with log level from environment
	// Set LOG_LEVEL=error for production (minimal logging) or LOG_LEVEL=debug for development
	utils.InitLogger()

	cfg := config.LoadConfig()

	// Ensure DB exists
	if err := utils.CreateDatabaseIfNotExists(cfg); err != nil {
		log.Fatalf("failed to create database: %v", err)
	}

	// OPTIMIZED: Configure connection pool for better performance
	// SAFE: SkipDefaultTransaction only affects automatic transactions for single operations
	// Write operations (Create, Update, Delete) still work correctly
	db, err := gorm.Open(mysql.Open(cfg.GetDSN()), &gorm.Config{
		PrepareStmt:            true,  // Enable prepared statements for better performance
		SkipDefaultTransaction: false, // SAFE: Keep transactions for data integrity (write operations need transactions)
		NowFunc:                nil,   // Use database NOW() function
		DisableAutomaticPing:   false, // Keep connection alive
	})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	// Get underlying sql.DB to configure connection pool
	sqlDBInstance, err := db.DB()
	if err != nil {
		log.Fatalf("failed to get database instance: %v", err)
	}

	// OPTIMIZED: Increased connection pool for better performance under load
	// With 4 CPU cores and 8GB RAM, we can handle more concurrent connections
	sqlDBInstance.SetMaxOpenConns(50)                  // Increased from 25 to 50 for better concurrency
	sqlDBInstance.SetMaxIdleConns(20)                  // Increased from 10 to 20 for faster response
	sqlDBInstance.SetConnMaxLifetime(10 * time.Minute) // Increased from 5 to 10 minutes
	sqlDBInstance.SetConnMaxIdleTime(5 * time.Minute)  // Increased from 2 to 5 minutes

	utils.LogSuccess("Database connection pool configured: MaxOpen=50, MaxIdle=20 (OPTIMIZED)")

	// Auto-migrate models
	// IMPORTANT: AdminUser and AdminPermission must be migrated before AdminUserPermission
	db.AutoMigrate(
		&models.UserIdentity{},
		&models.User{},
		&models.ChatMessage{},
		&models.Webinar{},
		&models.WebinarActivity{},
		&models.WebinarProgram{},
		&models.AdminUser{},       // Must be before AdminUserPermission
		&models.AdminPermission{}, // Must be before AdminUserPermission
		&models.SystemConfig{},
		&models.SMSMessage{},
		&models.SMSMessageLog{},
		&models.SMSMessageCycleLog{},
		&models.SmartSMSLog{},
		&models.SmartSMSScheduleRun{},
		&models.SmartSMSScheduledMessage{},
		&models.TriggeredSMSMessage{},
		&models.TriggeredSMSMessageLog{},
		&models.AvanakMessage{},
		&models.AvanakMessageLog{},
		&models.AvanakMessageCycleLog{},
		&models.Workflow{},
		&models.WorkflowStep{},
		&models.WorkflowExecutionLog{},
		&models.WorkflowRun{},
		&models.WorkflowRunStep{},
		&models.Task{},
		&models.TaskMessage{},
		&models.ContentTask{},
		&models.PaymentTransaction{},
		&models.License{},
		&models.Affiliate{},
		&models.LandingActivity{},
		&models.AppointmentSlot{},
		&models.PaymentSMSMessage{},
		&models.PaymentSMSMessageLog{},
		&models.LicenseSMSMessage{},
		&models.LicenseSMSMessageLog{},
		&models.ContentLicense{},
	)

	// Ensure join table exists with correct structure
	if !db.Migrator().HasTable("admin_user_permissions") {
		utils.LogInfo("Creating admin_user_permissions join table...")
		if err := db.Migrator().CreateTable(&models.AdminUserPermission{}); err != nil {
			utils.LogWarn("Failed to create admin_user_permissions table: %v", err)
		} else {
			utils.LogSuccess("admin_user_permissions table created")
		}
	}

	// Run custom migrations
	utils.LogInfo("Running custom migrations...")
	if err := config.EnsureAffiliatePercentageField(db); err != nil {
		utils.LogWarn("Failed to ensure affiliate_percentage field: %v", err)
	}
	if err := config.EnsureContentModeEnabledField(db); err != nil {
		utils.LogWarn("Failed to ensure content_mode_enabled field: %v", err)
	}

	// Seed permissions first (before creating admin user)
	utils.LogInfo("Seeding permissions...")
	defaultPermissions := models.GetDefaultPermissions()
	for _, perm := range defaultPermissions {
		var existingPerm models.AdminPermission
		if err := db.Where("`key` = ?", perm.Key).First(&existingPerm).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := db.Create(&perm).Error; err != nil {
					utils.LogWarn("Failed to create permission %s: %v", perm.Key, err)
				} else {
					utils.LogDebug("Created permission: %s", perm.Key)
				}
			}
		}
	}
	utils.LogSuccess("Permissions seeding completed")

	// Create default admin user (this will grant all permissions)
	utils.LogInfo("Checking for admin user...")
	var adminUser models.AdminUser
	if err := db.Where("username = ?", "admin").First(&adminUser).Error; err != nil {
		// Admin user doesn't exist, create it
		if err := controllers.CreateDefaultAdmin(db); err != nil {
			utils.LogError("Failed to create default admin: %v", err)
			utils.LogWarn("Admin panel may not be accessible without admin user!")
		} else {
			// Reload admin user after creation
			db.Where("username = ?", "admin").First(&adminUser)
			utils.LogSuccess("Admin user check completed successfully")
		}
	} else {
		utils.LogDebug("Admin user already exists (ID: %d)", adminUser.ID)
	}

	// Migration: Assign all users with NULL promoter_id to admin user
	if adminUser.ID > 0 {
		utils.LogInfo("Migrating old users to admin promoter...")
		result := db.Model(&models.User{}).Where("promoter_id IS NULL").Update("promoter_id", adminUser.ID)
		if result.Error != nil {
			utils.LogWarn("Failed to migrate old users: %v", result.Error)
		} else {
			utils.LogSuccess("Migrated %d old users to admin promoter (ID: %d)", result.RowsAffected, adminUser.ID)
		}
	}

	// CRITICAL: Ensure system_configs table has correct structure with unique index
	// This is essential for INSERT ... ON DUPLICATE KEY UPDATE to work properly
	if err := config.EnsureSystemConfigTable(db); err != nil {
		utils.LogWarn("Failed to ensure system_configs table structure: %v", err)
		utils.LogWarn("Continuing anyway, but price updates may fail...")
	}

	// OPTIMIZATION: Create performance indexes for frequently queried columns
	// This significantly improves query speed, especially for stats and online viewers
	if err := config.CreatePerformanceIndexes(db); err != nil {
		utils.LogWarn("Failed to create performance indexes: %v", err)
		utils.LogWarn("Continuing anyway, but queries may be slower...")
	}

	// CRITICAL: Initialize config in database from file config (if not exists)
	// This ensures database is the single source of truth
	config.InitializeConfigInDB(db, cfg)

	// CRITICAL: Seed default subscription_price if it doesn't exist
	// This ensures the price always exists in the database
	if err := config.SeedDefaultSubscriptionPrice(db, cfg.Payment.SubscriptionPrice); err != nil {
		utils.LogWarn("Failed to seed default subscription_price: %v", err)
	}

	// Initialize default scheduled SMS messages if they don't exist
	utils.LogInfo("Initializing default scheduled SMS messages...")
	if err := initializeDefaultScheduledMessages(db); err != nil {
		utils.LogWarn("Failed to initialize default scheduled messages: %v", err)
	}

	// Initialize default license SMS message if it doesn't exist
	utils.LogInfo("Initializing default license SMS message...")
	if err := initializeDefaultLicenseSMSMessage(db); err != nil {
		utils.LogWarn("Failed to initialize default license SMS message: %v", err)
	} else {
		utils.LogSuccess("Default scheduled SMS messages initialized successfully")
	}

	// Migrate subscription price from old format to new format if needed
	// Old format: prices less than 100000 (e.g., 49000)
	// New format: prices multiplied by 100 (e.g., 4900000)
	if err := config.MigrateSubscriptionPrice(db); err != nil {
		utils.LogWarn("Failed to migrate subscription_price: %v", err)
	}

	// Migrate SMS patterns and Avanak messages from config to database
	// This allows them to be managed from admin panel
	config.MigrateSMSPatternsFromConfig(db, cfg)
	config.MigrateAvanakFromConfig(db, cfg)

	// Load config ONLY from database (database is single source of truth)
	// Falls back to file config only if database value doesn't exist
	mergedConfig := config.LoadConfigFromDB(db, cfg)
	utils.LogSuccess("Config loaded: Database is single source of truth, file config used only as fallback")
	utils.LogInfo("Active config: Start=%02d:%02d, End=%02d:00 (from database)",
		mergedConfig.Webinar.StartHour, mergedConfig.Webinar.StartMinute, mergedConfig.Webinar.EndHour)

	// Seed or load webinar
	var webinar models.Webinar
	db.First(&webinar)

	// Load Iran timezone
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		log.Fatalf("Failed to load timezone: %v", err)
	}

	// Get webinar schedule from merged config (database + file)
	// This allows changing start/end times from admin panel
	webinarConfig := mergedConfig.Webinar
	now := time.Now().In(loc)

	// Start time: Today at configured hour:minute (from database or config.yaml)
	startTime := time.Date(now.Year(), now.Month(), now.Day(), webinarConfig.StartHour, webinarConfig.StartMinute, 0, 0, loc)
	// If it's already past start time today, use tomorrow
	if now.After(startTime) {
		startTime = startTime.AddDate(0, 0, 1)
	}

	// End time: Same day at configured end hour (or next day if EndHour < StartHour)
	endTime := time.Date(startTime.Year(), startTime.Month(), startTime.Day(), webinarConfig.EndHour, 0, 0, 0, loc)
	// If EndHour < StartHour, end time is next day (webinar spans midnight)
	if webinarConfig.EndHour < webinarConfig.StartHour ||
		(webinarConfig.EndHour == webinarConfig.StartHour && webinarConfig.StartMinute > 0) {
		endTime = endTime.AddDate(0, 0, 1)
	}

	utils.LogInfo("Webinar schedule: Start=%02d:%02d, End=%02d:00 (from database or config.yaml)", webinarConfig.StartHour, webinarConfig.StartMinute, webinarConfig.EndHour)

	if webinar.ID == 0 { // If no webinar exists, create one
		webinar = models.Webinar{
			Title:           "وبینار زنده فیتینو",
			StartTime:       startTime,
			EndTime:         endTime,
			VideoURL:        "video1.mp4",
			Capacity:        500,
			RegisteredCount: 0,
			IsLive:          true,
		}
		db.Create(&webinar)
		utils.LogSuccess("Created new webinar starting at %s", startTime.Format("2006-01-02 15:04:05"))
	} else { // Otherwise, check if we should update the existing one's time
		// CRITICAL: Only update times if webinar is NOT currently active
		// This preserves the current session if webinar is running
		existingStartTime := webinar.StartTime.In(loc)
		existingEndTime := webinar.EndTime.In(loc)

		if now.After(existingStartTime) && now.Before(existingEndTime) {
			utils.LogInfo("Webinar is currently active (started at %s, ends at %s). Preserving current times - NOT updating on startup.",
				existingStartTime.Format("2006-01-02 15:04:05"),
				existingEndTime.Format("2006-01-02 15:04:05"))
		} else {
			// Webinar is not active - safe to update times
			db.Model(&webinar).Updates(map[string]interface{}{
				"StartTime": startTime,
				"EndTime":   endTime,
			})
			utils.LogSuccess("Updated webinar: StartTime=%s, EndTime=%s", startTime.Format("2006-01-02 15:04:05"), endTime.Format("2006-01-02 15:04:05"))
		}
	}

	// OPTIMIZATION: Set Gin to release mode for better performance in production
	// This disables debug logging and improves response times
	gin.SetMode(gin.ReleaseMode)
	utils.LogSuccess("Gin framework set to Release Mode (OPTIMIZED)")

	r := gin.Default()

	// CORS configuration
	corsConfig := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}

	// Set allowed origins based on configuration
	if len(cfg.AllowedOrigins) > 0 {
		corsConfig.AllowOrigins = cfg.AllowedOrigins
	} else {
		// Default fallback
		corsConfig.AllowOrigins = []string{"*"}
	}

	// Enable CORS middleware
	r.Use(cors.New(corsConfig))

	// OPTIMIZATION: Enable gzip compression for all responses (single instance)
	// This significantly reduces bandwidth and improves response times
	r.Use(gzip.Gzip(gzip.DefaultCompression))
	utils.LogSuccess("Gzip compression enabled (OPTIMIZED)")

	// Initialize services with merged config (database + file)
	avanakService := services.NewAvanakService(&mergedConfig.Avanak)
	melipayamakService := services.NewMelipayamakService(&mergedConfig.Melipayamak)
	farazSMSService := services.NewFarazSMSService(&mergedConfig.FarazSMS)
	services.SetKavenegarConfig(mergedConfig.Kavenegar)
	
	// Initialize Telegram Bot Service if enabled
	var telegramBotService *services.TelegramBotService
	if mergedConfig.Telegram.Enabled && mergedConfig.Telegram.BotToken != "" {
		telegramBotService = services.NewTelegramBotService(mergedConfig.Telegram.BotToken)
		utils.LogSuccess("Telegram Bot Service initialized")
		
		// Auto-set webhook if URL is configured
		if mergedConfig.Telegram.WebhookURL != "" {
			if err := telegramBotService.SetWebhook(mergedConfig.Telegram.WebhookURL); err != nil {
				utils.LogWarn("Failed to set Telegram webhook automatically: %v", err)
				utils.LogInfo("You can set webhook manually using: POST /api/admin/telegram/set-webhook")
			} else {
				utils.LogSuccess("Telegram webhook set to: %s", mergedConfig.Telegram.WebhookURL)
			}
		} else {
			utils.LogWarn("Telegram webhook URL not configured. Set it in config.yaml or use /api/admin/telegram/set-webhook")
		}
	} else {
		utils.LogWarn("Telegram Bot Service disabled or token not configured")
	}

	// Get server base URL for bot API client
	serverBaseURL := "https://webinar.sianacademy.com"
	if port := cfg.ServerPort; port != "" && port != "443" && port != "80" {
		serverBaseURL = "http://localhost:" + port
	}
	
	// Get Telegram API key for bot authentication
	telegramAPIKey := mergedConfig.Telegram.APIKey
	if telegramAPIKey == "" {
		// Generate or use default API key for bot authentication
		// In production, this should be set in config.yaml
		telegramAPIKey = os.Getenv("TELEGRAM_BOT_API_KEY")
		if telegramAPIKey == "" {
			utils.LogWarn("Telegram Bot API key not configured. Bot API authentication will be disabled.")
		}
	}

	// SetupRoutes MUST be called unconditionally - no conditions, no feature flags
	log.Println("[BOOT] SetupRoutes executed")
	routes.SetupRoutes(r, db, melipayamakService, avanakService, farazSMSService, mergedConfig, telegramBotService, telegramAPIKey, serverBaseURL)

	log.Println("✔ MySQL key column patch applied (escaped identifiers)")
	utils.LogSuccess("Server running on port %s", cfg.ServerPort)

	// OPTIMIZED: Only log test mode config in debug mode
	utils.LogDebug("TestMode config from main.go - Enabled: %v, TestPhone: '%s'", cfg.TestMode.Enabled, cfg.TestMode.TestPhone)

	// Start the scheduler (with config for daily loop support)
	// Wrap in goroutine with panic recovery to prevent startup crash
	go func() {
		defer func() {
			if r := recover(); r != nil {
				utils.LogError("PANIC in scheduler startup: %v", r)
				utils.LogWarn("Scheduler failed to start, but server will continue running")
			}
		}()
		utils.LogInfo("Starting scheduler...")
		scheduler.StartScheduler(db, avanakService, melipayamakService, farazSMSService, &mergedConfig.TestMode, mergedConfig)
		scheduler.StartWebinarProgramScheduler(db)
		utils.LogSuccess("Scheduler started successfully")
	}()

	// Give scheduler a moment to initialize
	time.Sleep(1 * time.Second)

	// Start the streaming server and publisher in a separate goroutine
	go func() {
		// Pass CORS allowed origins to streaming server
		streamServer := streaming.NewServer(cfg.AllowedOrigins)
		// Set global reference so we can clear channels from StartFilePublisher
		streaming.SetGlobalStreamServer(streamServer)
		// Start the server first (always running)
		go streamServer.Start(":1935", ":8089")

		// Wait a moment for the server to be ready
		time.Sleep(2 * time.Second)

		// NOTE: Streaming is now handled by the scheduler at the exact webinar start time
		// The scheduler will call startStreamingForToday() at the configured start time
		// This ensures the stream starts exactly when the webinar starts, not before
		utils.LogInfo("Streaming will be started by scheduler at %s (webinar start time)", startTime.Format("2006-01-02 15:04:05"))
	}()

	// Start server with HTTPS if enabled
	if cfg.EnableHTTPS {
		utils.LogInfo("Starting HTTPS server with SSL certificate")
		if err := r.RunTLS(":"+cfg.ServerPort, cfg.SSLCertFile, cfg.SSLKeyFile); err != nil {
			log.Fatalf("failed to start HTTPS server: %v", err)
		}
	} else {
		utils.LogInfo("Starting HTTP server")
		utils.LogInfo("API server listening on port %s", cfg.ServerPort)
		if err := r.Run(":" + cfg.ServerPort); err != nil {
			log.Fatalf("failed to start HTTP server: %v", err)
		}
	}
}

// initializeDefaultScheduledMessages creates default scheduled SMS messages if they don't exist
func initializeDefaultScheduledMessages(db *gorm.DB) error {
	defaultMessages := []models.SmartSMSScheduledMessage{
		{
			Category:     "yesterday_0800_faraz",
			Provider:     "faraz",
			Hour:         8,
			Minute:       0,
			Message:      "میدونی مشکل چیه؟ بیشتر آدما مشکلشون تنبلی یا کم‌هوشی نیست\n\nمشکلشون اینه که مسیر درست رو ندیدن❌\n\nکارگاه امروز دقیقاً برای همینه!",
			IsActive:     true,
			DisplayOrder: 1,
		},
		{
			Category:     "yesterday_1400_faraz",
			Provider:     "faraz",
			Hour:         14,
			Minute:       0,
			Message:      "این کارگاه برای آدمایی ساخته شده که دیگه از سردرگمی خسته شدن\nو دنبال یه مسیر و سیستم واقعین🚀\n\nامروز ساعت ۱۹ مسیر روشن می‌شه💫",
			IsActive:     true,
			DisplayOrder: 2,
		},
		{
			Category:     "yesterday_1700_faraz",
			Provider:     "faraz",
			Hour:         17,
			Minute:       0,
			Message:      "کارگاه امشب زنده برگزار می‌شه و ضبط نمیشه\nنه برای هیجان، برای اینکه تغییر واقعی زنده اتفاق می‌افته",
			IsActive:     true,
			DisplayOrder: 3,
		},
		{
			Category:     "yesterday_1815_melipayamak",
			Provider:     "faraz",
			Hour:         18,
			Minute:       15,
			Message:      "۳۰ دقیقه تا شروع کارگاه مونده.\nلینک ورود سر ساعت ارسال میشه",
			IsActive:     true,
			DisplayOrder: 4,
		},
		{
			Category:     "yesterday_1855_melipayamak",
			Provider:     "faraz",
			Hour:         18,
			Minute:       55,
			Message:      "🔴کارگاه شروع شد..\nهمین الان وارد شو:\nhttps://webinar.sianacademy.com/webinar",
			IsActive:     true,
			DisplayOrder: 5,
		},
		{
			Category:     "yesterday_1915_faraz",
			Provider:     "faraz",
			Hour:         19,
			Minute:       15,
			Message:      "کارگاه در حال اجراست...\nاز دستش ندی👇🏼\nwebinar.sianacademy.com/webinar",
			IsActive:     true,
			DisplayOrder: 6,
		},
		{
			Category:        "yesterday_1715_avanak",
			Provider:        "avanak",
			Hour:            17,
			Minute:          15,
			Message:         "", // Not used for Avanak
			AvanakMessageID: 41027586,
			IsActive:        true,
			DisplayOrder:    7,
		},
	}

	for _, msg := range defaultMessages {
		var existing models.SmartSMSScheduledMessage
		if err := db.Where("category = ?", msg.Category).First(&existing).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// Message doesn't exist, create it
				if err := db.Create(&msg).Error; err != nil {
					utils.LogWarn("Failed to create scheduled message %s: %v", msg.Category, err)
				} else {
					utils.LogDebug("Created scheduled message: %s", msg.Category)
				}
			}
		}
		// If message exists, don't overwrite (preserve admin edits)
	}

	return nil
}

// initializeDefaultLicenseSMSMessage creates default license SMS message if it doesn't exist
func initializeDefaultLicenseSMSMessage(db *gorm.DB) error {
	var existing models.LicenseSMSMessage
	if err := db.First(&existing).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// License SMS message doesn't exist, create default one
			defaultLicenseSMS := models.LicenseSMSMessage{
				PatternCode: 403249, // Default pattern code
				IsActive:    true,
			}
			if err := db.Create(&defaultLicenseSMS).Error; err != nil {
				utils.LogWarn("Failed to create default license SMS message: %v", err)
				return err
			}
			utils.LogSuccess("Default license SMS message created: PatternCode=%d, IsActive=true", defaultLicenseSMS.PatternCode)
		} else {
			utils.LogWarn("Failed to check for existing license SMS message: %v", err)
			return err
		}
	} else {
		utils.LogDebug("License SMS message already exists: PatternCode=%d, IsActive=%v", existing.PatternCode, existing.IsActive)
	}
	return nil
}
