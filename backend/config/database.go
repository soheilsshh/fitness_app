package config

import (
	"fmt"
	"log"
	"os"
	"time"

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
func NewMySQLGORM() (*gorm.DB, error) {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "3306")
	user := getEnv("DB_USER", "root")
	password := getEnv("DB_PASSWORD", "")
	dbName := getEnv("DB_NAME", "fitness_db")

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
	err := db.AutoMigrate(
		&models.User{},
		&models.CoachProfile{},
		&models.ServicePlan{},
		&models.Subscription{},
		&models.Transaction{},
		&models.RefreshToken{},
		&models.UserPhoto{},
		&models.WorkoutProgram{},
		&models.NutritionProgram{},
		&models.ProgramItem{},
		&models.NutritionItem{},
		&models.CheckIn{},
		&models.Notification{},
		&models.Order{},
		&models.OrderItem{},
		&models.SiteSettings{},
		&models.Feedback{},
		&models.OtpCode{},
	)
	if err != nil {
		log.Printf("AutoMigrate encountered an error: %v\n", err)
		return err
	}
	log.Println("GORM AutoMigrate completed successfully")
	return nil
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
