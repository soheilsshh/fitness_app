package config

import (
	"log"
	"sync"
	"time"

	"github.com/spf13/viper"
)

var (
	configOnce sync.Once
)

func initViper() {
	configOnce.Do(func() {
		// Read from environment variables
		viper.AutomaticEnv()
	})
}

// GetJWTSecret returns the JWT secret key from configuration.
func GetJWTSecret() []byte {
	initViper()
	secret := viper.GetString("JWT_SECRET")
	if secret == "" {
		log.Println("warning: JWT_SECRET is not set; using an insecure default value for development")
		secret = "dev-secret-change-me"
	}
	return []byte(secret)
}

// GetAccessTokenDuration returns the configured access token lifetime.
func GetAccessTokenDuration() time.Duration {
	initViper()
	minutes := viper.GetInt("ACCESS_TOKEN_DURATION_MINUTES")
	if minutes <= 0 {
		minutes = 15
	}
	return time.Duration(minutes) * time.Minute
}

// GetRefreshTokenDuration returns the configured refresh token lifetime.
func GetRefreshTokenDuration() time.Duration {
	initViper()
	days := viper.GetInt("REFRESH_TOKEN_DURATION_DAYS")
	if days <= 0 {
		days = 7
	}
	return time.Duration(days) * 24 * time.Hour
}
