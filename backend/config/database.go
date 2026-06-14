package config

import (
	"fmt"
	"log"
	"os"
	"regexp"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/yourusername/fitness-management/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// NewMySQLGORM initializes a GORM DB connection using environment variables.
//
// Expected env vars:
//   - DB_HOST
//   - DB_PORT
//   - DB_USER
//   - DB_PASSWORD
//   - DB_NAME
var dbNamePattern = regexp.MustCompile(`^[a-zA-Z0-9_]+$`)

func NewMySQLGORM() (*gorm.DB, error) {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "3306")
	user := getEnv("DB_USER", "root")
	password := getEnv("DB_PASSWORD", "")
	dbName := getEnv("DB_NAME", "fitness_db")

	if !dbNamePattern.MatchString(dbName) {
		return nil, fmt.Errorf("invalid DB_NAME %q: use only letters, numbers, and underscores", dbName)
	}

	if err := ensureDatabaseExists(host, port, user, password, dbName); err != nil {
		return nil, err
	}

	// DSN format: user:password@tcp(host:port)/dbname?params
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&collation=utf8mb4_unicode_ci",
		user, password, host, port, dbName,
	)

	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	db, err := gorm.Open(mysql.Open(dsn), gormConfig)
	if err != nil {
		return nil, fmt.Errorf("opening mysql connection: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("getting generic DB from gorm: %w", err)
	}

	// Reasonable defaults; can be tuned later.
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("pinging database: %w", err)
	}

	log.Println("MySQL database connection established")

	return db, nil
}

// SetupDatabase applies database migrations for all core models.
func SetupDatabase(db *gorm.DB) error {
	log.Println("starting GORM AutoMigrate for core models")
	err := db.AutoMigrate(models.AllModels()...)
	if err != nil {
		log.Printf("AutoMigrate encountered an error: %v\n", err)
		return err
	}
	log.Println("GORM AutoMigrate completed successfully")

	// Backfill invalid empty JSON values for existing users.
	if err := db.Exec("UPDATE users SET goals = '[]' WHERE goals IS NULL OR goals = ''").Error; err != nil {
		log.Printf("failed backfilling users.goals: %v\n", err)
		return err
	}

	// Seed default admin user (hard‑coded for initial setup).
	const (
		adminName     = "admin"
		adminEmail    = "admin@gmail.com"
		adminPhone    = "09150000000"
		adminPassword = "12345678"
	)

	var count int64
	if err := db.Model(&models.User{}).Where("email = ?", adminEmail).Count(&count).Error; err != nil {
		log.Printf("failed counting admin user: %v\n", err)
		return err
	}

	if count == 0 {
		hashed, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("failed hashing admin password: %v\n", err)
			return err
		}

		admin := &models.User{
			Name:     adminName,
			Email:    adminEmail,
			Phone:    adminPhone,
			Password: string(hashed),
			Role:     models.RoleAdmin,
		}

		if err := db.Create(admin).Error; err != nil {
			log.Printf("failed creating admin user: %v\n", err)
			return err
		}
		log.Println("seeded default admin user with email admin@gmail.com")
	} else {
		log.Println("admin user already exists, skipping seeding")
	}

	return nil
}

// ensureDatabaseExists connects to the MySQL server (without a default schema) and
// creates the target database when it does not already exist.
func ensureDatabaseExists(host, port, user, password, dbName string) error {
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/?parseTime=true&charset=utf8mb4&collation=utf8mb4_unicode_ci",
		user, password, host, port,
	)

	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	}

	db, err := gorm.Open(mysql.Open(dsn), gormConfig)
	if err != nil {
		return fmt.Errorf("connecting to MySQL server: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("getting generic DB from gorm: %w", err)
	}
	defer sqlDB.Close()

	if err := sqlDB.Ping(); err != nil {
		return fmt.Errorf("pinging MySQL server: %w", err)
	}

	createSQL := fmt.Sprintf(
		"CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
		dbName,
	)
	if err := db.Exec(createSQL).Error; err != nil {
		return fmt.Errorf("creating database %q: %w", dbName, err)
	}

	log.Printf("database %q ready (created if it did not exist)", dbName)
	return nil
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
