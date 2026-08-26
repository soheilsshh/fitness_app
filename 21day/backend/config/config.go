package config

import (
	"log"

	"github.com/spf13/viper"
)

type DBConfig struct {
	User     string
	Password string
	Host     string
	Port     int
	Name     string
}

type AdminConfig struct {
	Username string
	Password string
}

type AppConfig struct {
	ServerPort string            `mapstructure:"server_port"`
	DB         DBConfig          `mapstructure:"db"`
	Admin      AdminConfig       `mapstructure:"admin"`
	SMSApiKey  string            `mapstructure:"smsapikey"`
	FromNumber string            `mapstructure:"from_number"`
	SMSBaseURL string            `mapstructure:"sms_base_url"`
	Patterns   map[string]string `mapstructure:"patterns"`
}

var Config AppConfig

func LoadConfig() {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")

	err := viper.ReadInConfig()
	if err != nil {
		log.Fatalf("Error reading config file: %v", err)
	}

	err = viper.Unmarshal(&Config)
	if err != nil {
		log.Fatalf("Unable to decode into struct: %v", err)
	}

	if Config.ServerPort == "" {
		Config.ServerPort = "8081"
	}
}

// Placeholder for configuration logic (e.g., loading env variables)
