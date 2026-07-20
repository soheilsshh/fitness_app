package bootstrap

import (
	"context"
	"log"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/config"
	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/seed"
)

// RunMigrations applies GORM AutoMigrate for all registered models.
func RunMigrations(db *gorm.DB) error {
	log.Println("starting GORM AutoMigrate for core models")
	if err := db.AutoMigrate(models.AllModels()...); err != nil {
		log.Printf("AutoMigrate encountered an error: %v", err)
		return err
	}
	log.Println("GORM AutoMigrate completed successfully")

	if err := db.Exec("UPDATE users SET goals = '[]' WHERE goals IS NULL OR goals = ''").Error; err != nil {
		log.Printf("failed backfilling users.goals: %v", err)
		return err
	}

	// Unpaid funnel leads must not store '' under unique tracking_code (MySQL duplicate).
	if err := db.Exec("UPDATE funnel_leads SET tracking_code = NULL WHERE tracking_code = ''").Error; err != nil {
		log.Printf("failed backfilling funnel_leads.tracking_code: %v", err)
		return err
	}

	return nil
}

// SeedDefaultAdmin creates the initial admin account when missing.
func SeedDefaultAdmin(db *gorm.DB) error {
	const (
		adminName     = "admin"
		adminEmail    = "admin@gmail.com"
		adminPhone    = "09150000000"
		adminPassword = "12345678"
	)

	var count int64
	if err := db.Model(&models.User{}).Where("email = ?", adminEmail).Count(&count).Error; err != nil {
		log.Printf("failed counting admin user: %v", err)
		return err
	}

	if count > 0 {
		log.Println("admin user already exists, skipping seeding")
		return nil
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("failed hashing admin password: %v", err)
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
		log.Printf("failed creating admin user: %v", err)
		return err
	}

	log.Println("seeded default admin user with email admin@gmail.com")
	return nil
}

// MaybeSeedDevData loads development fixtures when seed.dev_data is enabled in config.
func MaybeSeedDevData(db *gorm.DB) error {
	if !config.Get().Seed.DevData {
		return nil
	}

	_, err := seed.RunDev(context.Background(), db, seed.RunDevOptions{})
	if err != nil && strings.Contains(err.Error(), "dev seed blocked") {
		return nil
	}
	return err
}

// SeedCatalogs loads exercises, foods, and crul templates when seed.catalogs is enabled.
func SeedCatalogs(db *gorm.DB) error {
	return seed.SeedCatalogsFromConfig(context.Background(), db)
}

// PrepareDatabase runs migrations, default admin seed, Ali funnel coach/plans,
// reference catalogs, and optional dev fixtures.
func PrepareDatabase(db *gorm.DB) error {
	if err := RunMigrations(db); err != nil {
		return err
	}
	if err := SeedDefaultAdmin(db); err != nil {
		return err
	}
	if err := seed.EnsureAliFunnel(context.Background(), db); err != nil {
		return err
	}
	if config.Get().Seed.DemoData {
		if err := seed.EnsureDemoData(context.Background(), db); err != nil {
			return err
		}
	}
	if err := SeedCatalogs(db); err != nil {
		return err
	}
	if err := MaybeSeedDevData(db); err != nil {
		return err
	}
	return nil
}
