package main

import (
	"log"

	"fitino-live-backend/config"
	"fitino-live-backend/internal/seed"
	"fitino-live-backend/utils"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	cfg := config.LoadConfig()

	if err := utils.CreateDatabaseIfNotExists(cfg); err != nil {
		log.Fatalf("failed to create database: %v", err)
	}

	db, err := gorm.Open(mysql.Open(cfg.GetDSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect: %v", err)
	}

	count, err := seed.SeedLandingActivitySamples(db)
	if err != nil {
		log.Fatalf("seed failed: %v", err)
	}

	log.Printf("Done. %d sample landing activities created.", count)
}
