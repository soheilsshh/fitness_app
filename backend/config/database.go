package config

import (
	"fmt"
	"log"
	"os"
	"regexp"
	"time"

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
	MustLoad()
	dbCfg := Get().Database

	host := dbCfg.Host
	port := dbCfg.Port
	user := dbCfg.User
	password := dbCfg.Password
	dbName := dbCfg.Name

	if host == "" {
		host = "localhost"
	}
	if port == "" {
		port = "3306"
	}
	if user == "" {
		user = "root"
	}
	if dbName == "" {
		dbName = "fitness_db"
	}

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

	gormLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Info,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	gormConfig := &gorm.Config{
		Logger: gormLogger,
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
