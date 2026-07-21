package config

import (
	"fmt"
	"log"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

// Config holds application settings loaded from config.yaml with optional env overrides.
type Config struct {
	App struct {
		Env string `mapstructure:"env"`
	} `mapstructure:"app"`

	Server struct {
		Host string `mapstructure:"host"`
		Port string `mapstructure:"port"`
	} `mapstructure:"server"`

	CORS struct {
		AllowedOrigins   []string `mapstructure:"allowed_origins"`
		AllowLocalhost   bool     `mapstructure:"allow_localhost"`
		AllowCredentials bool     `mapstructure:"allow_credentials"`
	} `mapstructure:"cors"`

	Database struct {
		Host     string `mapstructure:"host"`
		Port     string `mapstructure:"port"`
		User     string `mapstructure:"user"`
		Password string `mapstructure:"password"`
		Name     string `mapstructure:"name"`
	} `mapstructure:"database"`

	JWT struct {
		Secret                     string `mapstructure:"secret"`
		AccessTokenDurationMinutes int    `mapstructure:"access_token_duration_minutes"`
		RefreshTokenDurationDays   int    `mapstructure:"refresh_token_duration_days"`
	} `mapstructure:"jwt"`

	Upload struct {
		Dir string `mapstructure:"dir"`
	} `mapstructure:"upload"`

	Seed struct {
		DevData       bool `mapstructure:"dev_data"`
		DemoData      bool `mapstructure:"demo_data"`
		Catalogs      bool `mapstructure:"catalogs"`
		CatalogsForce bool `mapstructure:"catalogs_force"`
	} `mapstructure:"seed"`

	Funnel struct {
		// CoachSlug binds Funnel 1 (/ali-rashidabadi) to one coach.
		// Plans/prices come from that coach's ServicePlan rows in DB.
		// Funnel 2 (future) would be a separate route + binding.
		CoachSlug string `mapstructure:"coach_slug"`
	} `mapstructure:"funnel"`

	SMS struct {
		APIKey                   string `mapstructure:"api_key"`
		Originator               string `mapstructure:"originator"`
		OtpPattern               string `mapstructure:"otp_pattern_code"`
		OtpTTLMinutes            int    `mapstructure:"otp_ttl_minutes"`
		OtpResendCooldownSeconds int    `mapstructure:"otp_resend_cooldown_seconds"`
	} `mapstructure:"sms"`

	Payments struct {
		Zarinpal struct {
			MerchantID       string `mapstructure:"merchant_id"`
			Sandbox          bool   `mapstructure:"sandbox"`
			CallbackBaseURL  string `mapstructure:"callback_base_url"`
			WebResultURL     string `mapstructure:"web_result_url"`
			MobileDeepLink   string `mapstructure:"mobile_deep_link_scheme"`
		} `mapstructure:"zarinpal"`
	} `mapstructure:"payments"`

	OpenAI struct {
		APIKey  string `mapstructure:"api_key"`
		Model   string `mapstructure:"model"`
		BaseURL string `mapstructure:"base_url"`
	} `mapstructure:"openai"`
}

var (
	cfg     Config
	cfgOnce sync.Once
	loadErr error
)

// Load reads config.yaml (if present), then applies environment variable overrides.
func Load() error {
	cfgOnce.Do(func() {
		loadErr = loadConfig()
	})
	return loadErr
}

// MustLoad panics when configuration cannot be loaded.
func MustLoad() {
	if err := Load(); err != nil {
		log.Fatalf("config: %v", err)
	}
}

// Get returns the loaded configuration.
func Get() Config {
	MustLoad()
	return cfg
}

func loadConfig() error {
	// Optional: .env overrides config.yaml when present. Production needs no .env —
	// only config.yaml. Remove .env if you want yaml-only settings.
	for _, envPath := range []string{".env", "backend/.env"} {
		if err := godotenv.Load(envPath); err == nil {
			log.Printf("config: %s loaded (overrides config.yaml) — delete it for yaml-only", envPath)
			break
		}
	}

	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	// Support running from backend/ or monorepo root (fitness_app/).
	for _, p := range []string{".", "backend", "./backend"} {
		viper.AddConfigPath(p)
	}

	setDefaults()
	bindEnvKeys()

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return fmt.Errorf("read config.yaml: %w", err)
		}
		log.Println("config: config.yaml not found — using defaults and environment variables")
	} else {
		log.Printf("config: loaded %s", viper.ConfigFileUsed())
	}

	viper.AutomaticEnv()

	if err := viper.Unmarshal(&cfg); err != nil {
		return fmt.Errorf("parse config: %w", err)
	}

	applyLegacyOverrides(&cfg)
	// Viper often keeps YAML when an env var is set to empty; honor explicit empties.
	applyExplicitEnvOverrides(&cfg)
	normalize(&cfg)
	syncProcessEnv(&cfg)

	return nil
}

func applyExplicitEnvOverrides(c *Config) {
	if v, ok := os.LookupEnv("SMS_API_KEY"); ok {
		c.SMS.APIKey = v
	}
	if v, ok := os.LookupEnv("OPENAI_API_KEY"); ok {
		c.OpenAI.APIKey = v
	}
	if v, ok := os.LookupEnv("OPENAI_MODEL"); ok && strings.TrimSpace(v) != "" {
		c.OpenAI.Model = v
	}
	// Honor empty DB password in .env (viper would otherwise keep YAML password).
	if v, ok := os.LookupEnv("DB_PASSWORD"); ok {
		c.Database.Password = v
	}
	if v, ok := os.LookupEnv("DB_USER"); ok && strings.TrimSpace(v) != "" {
		c.Database.User = v
	}
	if v, ok := os.LookupEnv("DB_HOST"); ok && strings.TrimSpace(v) != "" {
		c.Database.Host = v
	}
	if v, ok := os.LookupEnv("DB_NAME"); ok && strings.TrimSpace(v) != "" {
		c.Database.Name = v
	}
}

// syncProcessEnv mirrors selected yaml values into the process environment so
// legacy code paths that still read os.Getenv remain consistent with config.yaml.
func syncProcessEnv(c *Config) {
	_ = os.Setenv("APP_ENV", c.App.Env)
	if c.Seed.DevData {
		_ = os.Setenv("SEED_DEV_DATA", "true")
	} else {
		_ = os.Unsetenv("SEED_DEV_DATA")
	}
	_ = os.Setenv("UPLOAD_DIR", c.Upload.Dir)
}

func setDefaults() {
	viper.SetDefault("app.env", "production")
	viper.SetDefault("server.host", "0.0.0.0")
	viper.SetDefault("server.port", "8088")
	viper.SetDefault("cors.allowed_origins", []string{
		"https://fitinoo.ir",
		"https://www.fitinoo.ir",
		"http://fitinoo.ir",
		"http://www.fitinoo.ir",
	})
	viper.SetDefault("cors.allow_localhost", false)
	viper.SetDefault("cors.allow_credentials", false)
	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", "3306")
	viper.SetDefault("database.user", "fitino")
	viper.SetDefault("database.password", "")
	viper.SetDefault("database.name", "fitness_db")
	viper.SetDefault("jwt.secret", "change-me-in-production")
	viper.SetDefault("jwt.access_token_duration_minutes", 15)
	viper.SetDefault("jwt.refresh_token_duration_days", 7)
	viper.SetDefault("upload.dir", "uploads")
	viper.SetDefault("seed.dev_data", false)
	viper.SetDefault("seed.demo_data", true)
	viper.SetDefault("seed.catalogs", true)
	viper.SetDefault("seed.catalogs_force", false)
	viper.SetDefault("sms.otp_pattern_code", "fittino-otp")
	viper.SetDefault("sms.otp_ttl_minutes", 10)
	viper.SetDefault("sms.otp_resend_cooldown_seconds", 60)
	viper.SetDefault("payments.zarinpal.sandbox", false)
	viper.SetDefault("payments.zarinpal.callback_base_url", "https://api.fitinoo.ir")
	viper.SetDefault("payments.zarinpal.web_result_url", "https://fitinoo.ir/payment/result")
	viper.SetDefault("payments.zarinpal.mobile_deep_link_scheme", "fitinoo")
	viper.SetDefault("openai.model", "gemini-3.1-flash-lite")
	viper.SetDefault("openai.base_url", "https://api.gapgpt.app/v1")
}

func bindEnvKeys() {
	_ = viper.BindEnv("app.env", "APP_ENV")
	_ = viper.BindEnv("server.port", "PORT")
	_ = viper.BindEnv("database.host", "DB_HOST")
	_ = viper.BindEnv("database.port", "DB_PORT")
	_ = viper.BindEnv("database.user", "DB_USER")
	_ = viper.BindEnv("database.password", "DB_PASSWORD")
	_ = viper.BindEnv("database.name", "DB_NAME")
	_ = viper.BindEnv("jwt.secret", "JWT_SECRET")
	_ = viper.BindEnv("jwt.access_token_duration_minutes", "ACCESS_TOKEN_DURATION_MINUTES")
	_ = viper.BindEnv("jwt.refresh_token_duration_days", "REFRESH_TOKEN_DURATION_DAYS")
	_ = viper.BindEnv("upload.dir", "UPLOAD_DIR")
	_ = viper.BindEnv("seed.dev_data", "SEED_DEV_DATA")
	_ = viper.BindEnv("seed.demo_data", "SEED_DEMO_DATA")
	_ = viper.BindEnv("seed.catalogs", "SEED_CATALOGS")
	_ = viper.BindEnv("seed.catalogs_force", "SEED_CATALOGS_FORCE")
	_ = viper.BindEnv("funnel.coach_slug", "FUNNEL_COACH_SLUG")
	_ = viper.BindEnv("sms.api_key", "SMS_API_KEY")
	_ = viper.BindEnv("sms.originator", "SMS_ORIGINATOR")
	_ = viper.BindEnv("sms.otp_pattern_code", "SMS_OTP_PATTERN_CODE")
	_ = viper.BindEnv("sms.otp_ttl_minutes", "SMS_OTP_TTL_MINUTES")
	_ = viper.BindEnv("sms.otp_resend_cooldown_seconds", "SMS_OTP_RESEND_COOLDOWN_SECONDS")
	_ = viper.BindEnv("payments.zarinpal.merchant_id", "ZARINPAL_MERCHANT_ID")
	_ = viper.BindEnv("payments.zarinpal.sandbox", "ZARINPAL_SANDBOX")
	_ = viper.BindEnv("payments.zarinpal.callback_base_url", "ZARINPAL_CALLBACK_BASE_URL")
	_ = viper.BindEnv("payments.zarinpal.web_result_url", "ZARINPAL_WEB_RESULT_URL")
	_ = viper.BindEnv("payments.zarinpal.mobile_deep_link_scheme", "ZARINPAL_MOBILE_DEEP_LINK_SCHEME")
	_ = viper.BindEnv("openai.api_key", "OPENAI_API_KEY")
	_ = viper.BindEnv("openai.model", "OPENAI_MODEL")
	_ = viper.BindEnv("openai.base_url", "OPENAI_BASE_URL")
}

func applyLegacyOverrides(c *Config) {
	if env := strings.TrimSpace(os.Getenv("FRONTEND_ORIGIN")); env != "" {
		origins := splitCSV(env)
		if len(origins) > 0 {
			c.CORS.AllowedOrigins = origins
		}
	}
}

func normalize(c *Config) {
	c.Server.Port = strings.TrimSpace(c.Server.Port)
	if c.Server.Port == "" {
		c.Server.Port = "8088"
	}

	if c.JWT.Secret == "" {
		log.Println("warning: jwt.secret is empty; using an insecure default for development")
		c.JWT.Secret = "dev-secret-change-me"
	}
	if c.JWT.AccessTokenDurationMinutes <= 0 {
		c.JWT.AccessTokenDurationMinutes = 15
	}
	if c.JWT.RefreshTokenDurationDays <= 0 {
		c.JWT.RefreshTokenDurationDays = 7
	}

	if c.Upload.Dir == "" {
		c.Upload.Dir = "uploads"
	}

	if c.SMS.OtpPattern == "" {
		c.SMS.OtpPattern = "fittino-otp"
	}
	if c.SMS.OtpTTLMinutes <= 0 {
		c.SMS.OtpTTLMinutes = 10
	}
	if c.SMS.OtpResendCooldownSeconds <= 0 {
		c.SMS.OtpResendCooldownSeconds = 60
	}

	if c.Payments.Zarinpal.MobileDeepLink == "" {
		c.Payments.Zarinpal.MobileDeepLink = "fitinoo"
	}

	c.OpenAI.APIKey = strings.TrimSpace(c.OpenAI.APIKey)
	c.OpenAI.Model = strings.TrimSpace(c.OpenAI.Model)
	c.OpenAI.BaseURL = strings.TrimRight(strings.TrimSpace(c.OpenAI.BaseURL), "/")
	if c.OpenAI.Model == "" {
		c.OpenAI.Model = "gemini-3.1-flash-lite"
	}
	if c.OpenAI.BaseURL == "" {
		c.OpenAI.BaseURL = "https://api.gapgpt.app/v1"
	}

	// Dev: force ZarinPal sandbox so local never hits live merchant.
	// Prod: leave yaml/env as-is, but warn loudly if sandbox is still on.
	if isDevEnv(c.App.Env) {
		c.Payments.Zarinpal.Sandbox = true
	} else if c.Payments.Zarinpal.Sandbox {
		log.Println("WARNING: payments.zarinpal.sandbox=true while APP_ENV=production — live charges will not run")
	}

	if isProductionEnv(c.App.Env) {
		if c.JWT.Secret == "" || c.JWT.Secret == "change-me-in-production" || c.JWT.Secret == "dev-secret-change-me" {
			log.Println("WARNING: jwt.secret is still a placeholder — set a strong secret in config.yaml")
		}
		if strings.TrimSpace(c.SMS.APIKey) == "" {
			log.Println("WARNING: sms.api_key empty — OTP SMS will fail in production")
		}
		if strings.TrimSpace(c.OpenAI.APIKey) == "" {
			log.Println("WARNING: openai.api_key empty — AI chat will return not-configured in production")
		}
		if strings.TrimSpace(c.Payments.Zarinpal.MerchantID) == "" {
			log.Println("WARNING: payments.zarinpal.merchant_id empty — payments will fail")
		}
	}
}

func isProductionEnv(env string) bool {
	switch strings.ToLower(strings.TrimSpace(env)) {
	case "production", "prod":
		return true
	default:
		return false
	}
}

func isDevEnv(env string) bool {
	switch strings.ToLower(strings.TrimSpace(env)) {
	case "development", "dev", "local":
		return true
	default:
		return false
	}
}

// IsDevelopment reports local/dev environments (OTP console, AI mock, payment sandbox).
func IsDevelopment() bool {
	return isDevEnv(Get().App.Env)
}

// IsProduction reports production / prod environments.
func IsProduction() bool {
	return isProductionEnv(Get().App.Env)
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		if part = strings.TrimSpace(part); part != "" {
			out = append(out, part)
		}
	}
	return out
}

// ServerAddr returns the listen address (e.g. ":8088").
func ServerAddr() string {
	c := Get()
	return ":" + c.Server.Port
}

// GetUploadDir returns the directory for user-uploaded files.
func GetUploadDir() string {
	return Get().Upload.Dir
}

// CORSAllowedOrigins returns the configured browser origins.
func CORSAllowedOrigins() []string {
	return Get().CORS.AllowedOrigins
}

// CORSAllowLocalhost reports whether local dev origins are accepted.
func CORSAllowLocalhost() bool {
	return Get().CORS.AllowLocalhost
}

// CORSAllowCredentials reports whether credentialed cross-origin requests are allowed.
func CORSAllowCredentials() bool {
	return Get().CORS.AllowCredentials
}

// localhost + private LAN origins (so phone testing via Wi‑Fi IP works in local/dev).
var localOriginRe = regexp.MustCompile(
	`^https?://(` +
		`localhost|127\.0\.0\.1|\[::1\]|` +
		`192\.168(?:\.\d{1,3}){2}|` +
		`10(?:\.\d{1,3}){3}|` +
		`172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}` +
		`)(:\d+)?$`,
)

// IsOriginAllowed checks whether an Origin header may access the API.
func IsOriginAllowed(origin string) bool {
	if origin == "" {
		return false
	}

	for _, allowed := range CORSAllowedOrigins() {
		if origin == allowed {
			return true
		}
	}

	if CORSAllowLocalhost() && localOriginRe.MatchString(origin) {
		return true
	}

	return false
}

// GetJWTSecret returns the JWT secret key from configuration.
func GetJWTSecret() []byte {
	return []byte(Get().JWT.Secret)
}

// GetAccessTokenDuration returns the configured access token lifetime.
func GetAccessTokenDuration() time.Duration {
	minutes := Get().JWT.AccessTokenDurationMinutes
	return time.Duration(minutes) * time.Minute
}

// GetRefreshTokenDuration returns the configured refresh token lifetime.
func GetRefreshTokenDuration() time.Duration {
	days := Get().JWT.RefreshTokenDurationDays
	return time.Duration(days) * 24 * time.Hour
}
