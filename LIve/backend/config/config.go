package config

import (
	"fmt"
	"log"
	"strconv"
	"sync"
	"time"

	"monetizeai-backend/models"

	"github.com/spf13/viper"
	"gorm.io/gorm"
)

// configCache stores cached SystemConfig values with TTL
type configCache struct {
	mu        sync.RWMutex
	data      map[string]cacheEntry
	ttl       time.Duration
	lastClear time.Time
}

type cacheEntry struct {
	value     string
	expiresAt time.Time
}

var (
	// Global config cache instance
	globalConfigCache *configCache
	cacheOnce         sync.Once
)

// initConfigCache initializes the global config cache (thread-safe, called once)
func initConfigCache() {
	cacheOnce.Do(func() {
		globalConfigCache = &configCache{
			data:      make(map[string]cacheEntry),
			ttl:       30 * time.Second, // Cache TTL: 30 seconds
			lastClear: time.Now(),
		}
	})
}

// getCachedConfigValue retrieves a config value from cache (thread-safe)
func (cc *configCache) get(key string) (string, bool) {
	cc.mu.RLock()
	defer cc.mu.RUnlock()

	entry, exists := cc.data[key]
	if !exists {
		return "", false
	}

	// Check if cache entry has expired
	if time.Now().After(entry.expiresAt) {
		return "", false
	}

	return entry.value, true
}

// setCachedConfigValue stores a config value in cache (thread-safe)
func (cc *configCache) set(key, value string) {
	cc.mu.Lock()
	defer cc.mu.Unlock()

	cc.data[key] = cacheEntry{
		value:     value,
		expiresAt: time.Now().Add(cc.ttl),
	}
}

// invalidateCache clears all cached values (thread-safe)
// Called when config is updated via admin panel
func (cc *configCache) invalidate() {
	cc.mu.Lock()
	defer cc.mu.Unlock()

	cc.data = make(map[string]cacheEntry)
	cc.lastClear = time.Now()
}

// invalidateKey clears a specific key from cache (thread-safe)
func (cc *configCache) invalidateKey(key string) {
	cc.mu.Lock()
	defer cc.mu.Unlock()

	delete(cc.data, key)
}

type MelipayamakConfig struct {
	Username             string `mapstructure:"username"`
	ApiKey               string `mapstructure:"api_key"`
	BodyIdWelcome        int    `mapstructure:"body_id_welcome"`
	BodyIdWelcomeNextDay int    `mapstructure:"body_id_welcome_next_day"`
	BodyIdReminder2PM    int    `mapstructure:"body_id_reminder_2pm"`
	BodyIdReminder30Min  int    `mapstructure:"body_id_reminder_30min"`
	Enabled              bool   `mapstructure:"enabled"`
}

type AvanakConfig struct {
	Token     string `mapstructure:"token"`
	MessageID int    `mapstructure:"message_id"`
	BaseURL   string `mapstructure:"base_url"`
	Enabled   bool   `mapstructure:"enabled"`
}

type FarazSMSConfig struct {
	ApiKey     string `mapstructure:"api_key"`     // API Key for authentication
	FromNumber string `mapstructure:"from_number"` // Sender phone number in E.164 format (e.g., +983000505)
	Enabled    bool   `mapstructure:"enabled"`     // Enable/disable Faraz SMS service
}

type TelegramConfig struct {
	BotToken   string `mapstructure:"bot_token"`   // Telegram Bot Token
	WebhookURL string `mapstructure:"webhook_url"` // Webhook URL (optional - can be set via API)
	APIKey     string `mapstructure:"api_key"`     // API Key for bot to authenticate with backend
	Enabled    bool   `mapstructure:"enabled"`     // Enable/disable Telegram Bot
}

type GroqConfig struct {
	APIKey string `mapstructure:"api_key"` // Groq API Key
	Model  string `mapstructure:"model"`   // Groq model name (default: llama-3.3-70b-versatile)
	Enabled bool  `mapstructure:"enabled"` // Enable/disable Groq AI
}

type WebinarConfig struct {
	StartHour       int `mapstructure:"start_hour"`       // ساعت شروع (0-23)
	StartMinute     int `mapstructure:"start_minute"`     // دقیقه شروع (0-59)
	EndHour         int `mapstructure:"end_hour"`         // ساعت پایان (0-23)
	DurationMinutes int `mapstructure:"duration_minutes"` // مدت زمان به دقیقه
}

type TestModeConfig struct {
	Enabled   bool   `mapstructure:"enabled"`    // فعال/غیرفعال کردن حالت تست
	TestPhone string `mapstructure:"test_phone"` // شماره تست
}

type PaymentConfig struct {
	MerchantID        string `mapstructure:"merchant_id"`        // Merchant ID از ZarinPal
	Sandbox           bool   `mapstructure:"sandbox"`            // true = تستی، false = واقعی
	CallbackURL       string `mapstructure:"callback_url"`       // URL callback
	FrontendURL       string `mapstructure:"frontend_url"`       // Frontend base URL برای redirect
	SubscriptionPrice int    `mapstructure:"subscription_price"` // قیمت اشتراک (تومان)
}

type Config struct {
	Avanak         AvanakConfig      `mapstructure:"avanak"`
	Melipayamak    MelipayamakConfig `mapstructure:"melipayamak"`
	FarazSMS       FarazSMSConfig    `mapstructure:"faraz_sms"`
	Telegram       TelegramConfig    `mapstructure:"telegram"`
	Groq           GroqConfig        `mapstructure:"groq"`
	Webinar        WebinarConfig     `mapstructure:"webinar"`
	TestMode       TestModeConfig    `mapstructure:"test_mode"`
	Payment        PaymentConfig     `mapstructure:"payment"`
	DBHost         string            `mapstructure:"db_host"`
	DBPort         string            `mapstructure:"db_port"`
	DBUser         string            `mapstructure:"db_user"`
	DBPassword     string            `mapstructure:"db_password"`
	DBName         string            `mapstructure:"db_name"`
	ServerPort     string            `mapstructure:"server_port"`
	EnableHTTPS    bool              `mapstructure:"enable_https"`
	SSLCertFile    string            `mapstructure:"ssl_cert_file"`
	SSLKeyFile     string            `mapstructure:"ssl_key_file"`
	AllowedOrigins []string          `mapstructure:"allowed_origins"`
}

// LoadConfig loads config from config.yaml (preferred) or .env (fallback)
// NOTE: Webinar, Melipayamak, and Avanak configs can be overridden from database via admin panel
func LoadConfig() *Config {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AutomaticEnv()

	// Set default values for webinar schedule (can be overridden in config.yaml or database)
	viper.SetDefault("webinar.start_hour", 20)
	viper.SetDefault("webinar.start_minute", 0)
	viper.SetDefault("webinar.end_hour", 22)
	viper.SetDefault("webinar.duration_minutes", 120)

	var cfg Config
	if err := viper.ReadInConfig(); err != nil {
		// Skip verbose startup log
		// log.Printf("No config.yaml found, falling back to .env")
		viper.SetConfigFile(".env")
		if err := viper.ReadInConfig(); err != nil {
			log.Fatalf("No .env file found: %v", err)
		}
	}
	if err := viper.Unmarshal(&cfg); err != nil {
		log.Fatalf("Unable to decode config: %v", err)
	}

	// OPTIMIZED: Skip verbose startup logs in production
	// log.Printf("Webinar schedule loaded from config: Start=%02d:%02d, End=%02d:00, Duration=%d minutes",
	// 	cfg.Webinar.StartHour, cfg.Webinar.StartMinute, cfg.Webinar.EndHour, cfg.Webinar.DurationMinutes)

	return &cfg
}

// InitializeConfigInDB saves config file values to database if they don't exist
// This ensures database is the single source of truth
func InitializeConfigInDB(db *gorm.DB, fileConfig *Config) {
	// OPTIMIZED: Skip startup logs in production
	// log.Println("Initializing config in database from file config...")

	// Helper function to set config value if not exists
	setConfigIfNotExists := func(key string, value string) {
		var sysConfig models.SystemConfig
		if db.Where("`key` = ?", key).First(&sysConfig).Error == gorm.ErrRecordNotFound {
			sysConfig = models.SystemConfig{
				Key:   key,
				Value: value,
			}
			db.Create(&sysConfig)
			// Skip verbose initialization logs
		}
	}

	// Initialize webinar config
	setConfigIfNotExists("webinar.start_hour", strconv.Itoa(fileConfig.Webinar.StartHour))
	setConfigIfNotExists("webinar.start_minute", strconv.Itoa(fileConfig.Webinar.StartMinute))
	setConfigIfNotExists("webinar.end_hour", strconv.Itoa(fileConfig.Webinar.EndHour))
	setConfigIfNotExists("webinar.duration_minutes", strconv.Itoa(fileConfig.Webinar.DurationMinutes))

	// Initialize comment offset configs (default to 0)
	setConfigIfNotExists("webinar.comment_offset_seconds", "0")

	// Initialize Payment config
	setConfigIfNotExists("payment.subscription_price", strconv.Itoa(fileConfig.Payment.SubscriptionPrice))

	// Initialize Melipayamak config
	setConfigIfNotExists("melipayamak.username", fileConfig.Melipayamak.Username)
	setConfigIfNotExists("melipayamak.api_key", fileConfig.Melipayamak.ApiKey)
	setConfigIfNotExists("melipayamak.body_id_welcome", strconv.Itoa(fileConfig.Melipayamak.BodyIdWelcome))
	setConfigIfNotExists("melipayamak.body_id_welcome_next_day", strconv.Itoa(fileConfig.Melipayamak.BodyIdWelcomeNextDay))
	setConfigIfNotExists("melipayamak.body_id_reminder_2pm", strconv.Itoa(fileConfig.Melipayamak.BodyIdReminder2PM))
	setConfigIfNotExists("melipayamak.body_id_reminder_30min", strconv.Itoa(fileConfig.Melipayamak.BodyIdReminder30Min))
	setConfigIfNotExists("melipayamak.enabled", strconv.FormatBool(fileConfig.Melipayamak.Enabled))

	// Smart SMS (time-based campaigns) - Melipayamak pattern codes
	// Fail-safe: default to empty/0 so nothing is sent until configured.
	setConfigIfNotExists("smart_sms.meli_1815_pattern_code", "")
	setConfigIfNotExists("smart_sms.meli_1855_pattern_code", "")

	// Initialize Avanak config
	setConfigIfNotExists("avanak.token", fileConfig.Avanak.Token)
	setConfigIfNotExists("avanak.message_id", strconv.Itoa(fileConfig.Avanak.MessageID))
	setConfigIfNotExists("avanak.base_url", fileConfig.Avanak.BaseURL)
	setConfigIfNotExists("avanak.enabled", strconv.FormatBool(fileConfig.Avanak.Enabled))

	// Initialize Faraz SMS config
	setConfigIfNotExists("faraz_sms.api_key", fileConfig.FarazSMS.ApiKey)
	setConfigIfNotExists("faraz_sms.from_number", fileConfig.FarazSMS.FromNumber)
	setConfigIfNotExists("faraz_sms.enabled", strconv.FormatBool(fileConfig.FarazSMS.Enabled))

	// Skip completion log in production
}

// MigrateSMSPatternsFromConfig migrates SMS patterns from config.yaml to database
// This ensures all SMS patterns are manageable from admin panel
func MigrateSMSPatternsFromConfig(db *gorm.DB, cfg *Config) {
	// OPTIMIZED: Skip startup migration logs in production
	// log.Println("Starting SMS patterns migration from config to database...")

	// Don't skip migration - always check and migrate/update each pattern individually
	// This ensures all patterns are present even if some are missing

	// Pattern 395323 (registration SMS) has been removed by request.
	// We no longer seed or force-delete SMS patterns here.
	// Admin-managed SMS messages should remain intact.
}

// MigrateAvanakFromConfig migrates Avanak message from config.yaml to database
func MigrateAvanakFromConfig(db *gorm.DB, cfg *Config) {
	// OPTIMIZED: Skip startup migration logs in production
	// log.Println("Starting Avanak message migration from config to database...")

	// Get webinar start hour for calculating reminder time
	var webinarStartHour int
	var sysConfig models.SystemConfig
	if db.Where("`key` = ?", "webinar.start_hour").First(&sysConfig).Error == nil {
		if val, err := strconv.Atoi(sysConfig.Value); err == nil {
			webinarStartHour = val
		} else {
			webinarStartHour = cfg.Webinar.StartHour
		}
	} else {
		webinarStartHour = cfg.Webinar.StartHour
	}

	// Calculate 30 minutes before webinar start
	reminder30MinHour := webinarStartHour
	reminder30MinMinute := 0
	if reminder30MinMinute < 30 {
		reminder30MinHour--
		if reminder30MinHour < 0 {
			reminder30MinHour += 24
		}
		reminder30MinMinute = 60 + reminder30MinMinute - 30
	} else {
		reminder30MinMinute -= 30
	}

	// Check if Avanak message already exists
	var existing models.AvanakMessage
	if db.Where("name = ?", "یادآوری صوتی").First(&existing).Error == nil {
		// CRITICAL: Update send_hour and send_minute if they are null in database
		needsUpdate := false

		if existing.SendHour == nil {
			needsUpdate = true
			existing.SendHour = &reminder30MinHour
			// Skip verbose update logs
		}
		if existing.SendMinute == nil {
			needsUpdate = true
			existing.SendMinute = &reminder30MinMinute
			// Skip verbose update logs
		}

		// Also update other fields if needed
		if existing.MessageID != cfg.Avanak.MessageID {
			needsUpdate = true
			existing.MessageID = cfg.Avanak.MessageID
		}
		if existing.IsActive != cfg.Avanak.Enabled {
			needsUpdate = true
			existing.IsActive = cfg.Avanak.Enabled
		}
		if existing.SendType != "automatic" {
			needsUpdate = true
			existing.SendType = "automatic"
		}

		if needsUpdate {
			existing.UpdatedAt = time.Now()
			if err := db.Save(&existing).Error; err != nil {
				log.Printf("Failed to update Avanak message: %v", err)
			}
			// Skip success logs in production
		}
		// Skip "already exists" logs in production
		return
	}

	// Create new Avanak message
	avanakMessage := models.AvanakMessage{
		Name:                  "یادآوری صوتی",
		MessageID:             cfg.Avanak.MessageID,
		IsActive:              cfg.Avanak.Enabled,
		SendType:              "automatic",
		SendHour:              &reminder30MinHour,
		SendMinute:            &reminder30MinMinute,
		RegistrationTimeRange: "all",
		CreatedAt:             time.Now(),
		UpdatedAt:             time.Now(),
	}

	if err := db.Create(&avanakMessage).Error; err != nil {
		log.Printf("Failed to migrate Avanak message: %v", err)
	}
	// Skip success logs in production

	// Skip completion log in production
}

// Helper function to get config value from database with caching
// Uses Find() instead of First() to avoid GORM ID caching issues
// PERFORMANCE OPTIMIZATION: Uses in-memory cache to reduce database queries
func getConfigValueFromDB(db *gorm.DB, key string) (string, bool) {
	// Initialize cache if not already initialized
	initConfigCache()

	// Try to get from cache first
	if cachedValue, found := globalConfigCache.get(key); found {
		return cachedValue, true
	}

	// Cache miss - query database
	var configs []models.SystemConfig
	db.Where("`key` = ?", key).Find(&configs)
	if len(configs) > 0 {
		value := configs[0].Value
		// Store in cache for future requests
		globalConfigCache.set(key, value)
		return value, true
	}

	return "", false
}

// InvalidateConfigCache clears the config cache
// Should be called when config is updated via admin panel
// This ensures updated config values are immediately available
func InvalidateConfigCache() {
	initConfigCache()
	globalConfigCache.invalidate()
}

// InvalidateConfigCacheKey clears a specific key from the config cache
// More efficient than invalidating entire cache when only one value changes
func InvalidateConfigCacheKey(key string) {
	initConfigCache()
	globalConfigCache.invalidateKey(key)
}

// LoadConfigFromDB loads config ONLY from database (database is single source of truth)
// Falls back to fileConfig only if database value doesn't exist
func LoadConfigFromDB(db *gorm.DB, fileConfig *Config) *Config {
	config := *fileConfig // Start with file config as fallback

	// Load webinar config from database
	// CRITICAL: Use helper function with Find() instead of First() to avoid GORM ID caching issues

	// Load start_hour
	if val, found := getConfigValueFromDB(db, "webinar.start_hour"); found {
		if intVal, err := strconv.Atoi(val); err == nil {
			config.Webinar.StartHour = intVal
			// Skip verbose config load logs in production
		} else {
			log.Printf("LoadConfigFromDB - Failed to parse start_hour value '%s': %v", val, err)
		}
	}
	// Skip "not found" logs in production

	// Load start_minute
	if val, found := getConfigValueFromDB(db, "webinar.start_minute"); found {
		if intVal, err := strconv.Atoi(val); err == nil {
			config.Webinar.StartMinute = intVal
			// Skip verbose config load logs in production
		} else {
			log.Printf("LoadConfigFromDB - Failed to parse start_minute value '%s': %v", val, err)
		}
	}
	// Skip "not found" logs in production

	// Load end_hour
	if val, found := getConfigValueFromDB(db, "webinar.end_hour"); found {
		if intVal, err := strconv.Atoi(val); err == nil {
			config.Webinar.EndHour = intVal
			// Skip verbose config load logs in production
		} else {
			log.Printf("LoadConfigFromDB - Failed to parse end_hour value '%s': %v", val, err)
		}
	}
	// Skip "not found" logs in production

	// Load duration_minutes
	if val, found := getConfigValueFromDB(db, "webinar.duration_minutes"); found {
		if intVal, err := strconv.Atoi(val); err == nil {
			config.Webinar.DurationMinutes = intVal
			// Skip verbose config load logs in production
		}
	}

	// Load Melipayamak config from database
	if val, found := getConfigValueFromDB(db, "melipayamak.username"); found {
		config.Melipayamak.Username = val
	}
	if val, found := getConfigValueFromDB(db, "melipayamak.api_key"); found {
		config.Melipayamak.ApiKey = val
	}
	if val, found := getConfigValueFromDB(db, "melipayamak.body_id_welcome"); found {
		if intVal, err := strconv.Atoi(val); err == nil {
			config.Melipayamak.BodyIdWelcome = intVal
		}
	}
	if val, found := getConfigValueFromDB(db, "melipayamak.body_id_welcome_next_day"); found {
		if intVal, err := strconv.Atoi(val); err == nil {
			config.Melipayamak.BodyIdWelcomeNextDay = intVal
		}
	}
	if val, found := getConfigValueFromDB(db, "melipayamak.body_id_reminder_2pm"); found {
		if intVal, err := strconv.Atoi(val); err == nil {
			config.Melipayamak.BodyIdReminder2PM = intVal
		}
	}
	if val, found := getConfigValueFromDB(db, "melipayamak.body_id_reminder_30min"); found {
		if intVal, err := strconv.Atoi(val); err == nil {
			config.Melipayamak.BodyIdReminder30Min = intVal
		}
	}
	if val, found := getConfigValueFromDB(db, "melipayamak.enabled"); found {
		if boolVal, err := strconv.ParseBool(val); err == nil {
			config.Melipayamak.Enabled = boolVal
		}
	}

	// Load Avanak config from database
	if val, found := getConfigValueFromDB(db, "avanak.token"); found {
		config.Avanak.Token = val
	}
	if val, found := getConfigValueFromDB(db, "avanak.message_id"); found {
		// فقط مقادیر معتبر و بزرگ‌تر از صفر فایل کانفیگ را override می‌کنند؛
		// مقدار صفر را نادیده بگیر تا پیش‌فرض فایل یا مقدار قبلی حفظ شود.
		if intVal, err := strconv.Atoi(val); err == nil && intVal > 0 {
			config.Avanak.MessageID = intVal
		}
	}
	if val, found := getConfigValueFromDB(db, "avanak.base_url"); found {
		config.Avanak.BaseURL = val
	}
	if val, found := getConfigValueFromDB(db, "avanak.enabled"); found {
		if boolVal, err := strconv.ParseBool(val); err == nil {
			config.Avanak.Enabled = boolVal
		}
	}

	// Load Faraz SMS config from database
	if val, found := getConfigValueFromDB(db, "faraz_sms.api_key"); found {
		config.FarazSMS.ApiKey = val
	}
	if val, found := getConfigValueFromDB(db, "faraz_sms.from_number"); found {
		config.FarazSMS.FromNumber = val
	}
	if val, found := getConfigValueFromDB(db, "faraz_sms.enabled"); found {
		if boolVal, err := strconv.ParseBool(val); err == nil {
			config.FarazSMS.Enabled = boolVal
		}
	}

	return &config
}

func (c *Config) GetDSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&loc=Local",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName)
}
