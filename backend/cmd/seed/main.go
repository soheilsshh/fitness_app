package main

import (
	"context"
	"flag"
	"log"
	"strings"

	"github.com/yourusername/fitness-management/config"
	"github.com/yourusername/fitness-management/internal/bootstrap"
	"github.com/yourusername/fitness-management/internal/seed"
)

func main() {
	devFlag := flag.Bool("dev", false, "load development/UI test fixtures (coaches, students, orders, programs)")
	foodsFlag := flag.Bool("foods", false, "import food facts from CSV (default: data/Persian_food_facts.csv)")
	templatesFlag := flag.Bool("templates", false, "import workout/nutrition templates from data/*.json")
	catalogsFlag := flag.Bool("catalogs", false, "import exercises + foods + templates (same as startup seed.catalogs)")
	forceFlag := flag.Bool("force", false, "re-import catalogs even if tables already have rows")
	fileFlag := flag.String("file", "", "path to dataset file (default depends on import mode)")
	flag.Parse()

	if err := config.Load(); err != nil {
		log.Fatalf("failed to load configuration: %v", err)
	}

	db, err := config.NewMySQLGORM()
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	if err := bootstrap.PrepareDatabase(db); err != nil {
		log.Fatalf("database bootstrap failed: %v", err)
	}

	ctx := context.Background()

	if *devFlag {
		if _, err := seed.RunDev(ctx, db, seed.RunDevOptions{ForceCLI: true}); err != nil {
			log.Fatalf("dev seed failed: %v", err)
		}
		log.Println("dev accounts (password: 12345678):")
		log.Println("  coaches:  coach.ali@fitness.dev, coach.sara@fitness.dev")
		log.Println("  students: student.reza@fitness.dev, student.maryam@fitness.dev, student.amir@fitness.dev, student.neda@fitness.dev")
		return
	}

	if *catalogsFlag {
		if err := seed.SeedCatalogs(ctx, db, seed.CatalogSeedOptions{Force: *forceFlag}); err != nil {
			log.Fatalf("catalog seed failed: %v", err)
		}
		return
	}

	if *templatesFlag {
		if err := seed.SeedTemplatesFromCrul(ctx, db); err != nil {
			log.Fatalf("template seed failed: %v", err)
		}
		return
	}

	if *foodsFlag {
		filePath := seed.DataFile(*fileFlag)
		if strings.TrimSpace(*fileFlag) == "" {
			filePath = seed.DataFile(seed.DefaultFoodsFile)
		}
		if err := seed.ImportFoodsCSV(ctx, db, filePath); err != nil {
			log.Fatalf("food import failed: %v", err)
		}
		return
	}

	filePath := seed.DataFile(*fileFlag)
	if strings.TrimSpace(*fileFlag) == "" {
		filePath = seed.DataFile(seed.DefaultExercisesFile)
	}
	if err := seed.ImportExercisesJSON(ctx, db, filePath); err != nil {
		log.Fatalf("exercise import failed: %v", err)
	}
}
