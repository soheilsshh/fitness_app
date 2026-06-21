package main

import (
	"context"
	"encoding/json"
	"flag"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/config"
	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
	"github.com/yourusername/fitness-management/internal/seed"
)

const (
	defaultExercisesFile = "data/exercises.fa.json"
	defaultFoodsFile     = "data/Persian_food_facts.csv"
)

type datasetExercise struct {
	ID               string          `json:"id"`
	Name             string          `json:"name"`
	Category         string          `json:"category"`
	BodyPart         string          `json:"body_part"`
	Equipment        string          `json:"equipment"`
	Instructions     json.RawMessage `json:"instructions"`
	InstructionSteps json.RawMessage `json:"instruction_steps"`
	MuscleGroup      string          `json:"muscle_group"`
	SecondaryMuscles []string        `json:"secondary_muscles"`
	Target           string          `json:"target"`
	Image            string          `json:"image"`
	GifURL           string          `json:"gif_url"`
}

func main() {
	devFlag := flag.Bool("dev", false, "load development/UI test fixtures (coaches, students, orders, programs)")
	foodsFlag := flag.Bool("foods", false, "import food facts from CSV (default: data/Persian_food_facts.csv)")
	fileFlag := flag.String("file", "", "path to dataset file (default depends on import mode)")
	flag.Parse()

	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, using environment variables")
	}

	db, err := config.NewMySQLGORM()
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	if err := config.SetupDatabase(db); err != nil {
		log.Fatalf("database migration failed: %v", err)
	}

	if *devFlag {
		if err := seedDevData(db); err != nil {
			log.Fatalf("dev seed failed: %v", err)
		}
		return
	}

	if *foodsFlag {
		filePath := resolveDatasetPath(*fileFlag, defaultFoodsFile)
		if err := importFoodsCSV(db, filePath); err != nil {
			log.Fatalf("food import failed: %v", err)
		}
		return
	}

	filePath := resolveDatasetPath(*fileFlag, defaultExercisesFile)
	if err := importExercisesJSON(db, filePath); err != nil {
		log.Fatalf("exercise import failed: %v", err)
	}
}

func resolveDatasetPath(fileFlag, defaultPath string) string {
	filePath := strings.TrimSpace(fileFlag)
	if filePath == "" {
		filePath = defaultPath
	}
	if !filepath.IsAbs(filePath) {
		filePath = filepath.Join(".", filePath)
	}
	return filePath
}

func importExercisesJSON(db *gorm.DB, filePath string) error {
	raw, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}

	var items []datasetExercise
	if err := json.Unmarshal(raw, &items); err != nil {
		return err
	}

	repo := repository.NewExerciseRepository(db)
	ctx := context.Background()
	created, updated, failed := 0, 0, 0

	for _, item := range items {
		exercise, err := mapDatasetExercise(item)
		if err != nil {
			log.Printf("skip %s: %v", item.ID, err)
			failed++
			continue
		}

		_, findErr := repo.FindByExternalID(ctx, exercise.ExternalID)
		isUpdate := findErr == nil

		if err := repo.UpsertByExternalID(ctx, exercise); err != nil {
			log.Printf("upsert failed %s: %v", exercise.ExternalID, err)
			failed++
			continue
		}
		if isUpdate {
			updated++
		} else {
			created++
		}
	}

	log.Printf("exercise seed complete: total=%d created=%d updated=%d failed=%d", len(items), created, updated, failed)
	return nil
}

func seedDevData(db *gorm.DB) error {
	_, err := seed.RunDev(context.Background(), db, seed.RunDevOptions{ForceCLI: true})
	if err != nil {
		return err
	}
	log.Println("dev accounts (password: 12345678):")
	log.Println("  coaches:  coach.ali@fitness.dev, coach.sara@fitness.dev")
	log.Println("  students: student.reza@fitness.dev, student.maryam@fitness.dev, student.amir@fitness.dev, student.neda@fitness.dev")
	return nil
}

func mapDatasetExercise(item datasetExercise) (*models.Exercise, error) {
	externalID := strings.TrimSpace(item.ID)
	name := strings.TrimSpace(item.Name)
	if externalID == "" {
		return nil, errf("missing id")
	}
	if name == "" {
		return nil, errf("missing name")
	}

	description := extractInstructionText(item.Instructions)
	steps := extractInstructionSteps(item.InstructionSteps)
	secondary := item.SecondaryMuscles
	if secondary == nil {
		secondary = []string{}
	}

	stepsJSON, _ := json.Marshal(steps)
	secondaryJSON, _ := json.Marshal(secondary)

	return &models.Exercise{
		ExternalID:       externalID,
		Name:             name,
		Category:         strings.TrimSpace(item.Category),
		BodyPart:         strings.TrimSpace(item.BodyPart),
		Equipment:        strings.TrimSpace(item.Equipment),
		Description:      description,
		InstructionSteps: string(stepsJSON),
		MuscleGroup:      strings.TrimSpace(item.MuscleGroup),
		Target:           strings.TrimSpace(item.Target),
		SecondaryMuscles: string(secondaryJSON),
		ImagePath:        strings.TrimSpace(item.Image),
		GifPath:          strings.TrimSpace(item.GifURL),
		IsActive:         true,
	}, nil
}

func extractInstructionText(raw json.RawMessage) string {
	if len(raw) == 0 {
		return ""
	}

	var asString string
	if err := json.Unmarshal(raw, &asString); err == nil {
		return strings.TrimSpace(asString)
	}

	var asMap map[string]string
	if err := json.Unmarshal(raw, &asMap); err == nil {
		if v := strings.TrimSpace(asMap["fa"]); v != "" {
			return v
		}
		if v := strings.TrimSpace(asMap["en"]); v != "" {
			return v
		}
		for _, v := range asMap {
			if strings.TrimSpace(v) != "" {
				return strings.TrimSpace(v)
			}
		}
	}
	return ""
}

func extractInstructionSteps(raw json.RawMessage) []string {
	if len(raw) == 0 {
		return []string{}
	}

	var steps []string
	if err := json.Unmarshal(raw, &steps); err == nil {
		return steps
	}

	var asMap map[string][]string
	if err := json.Unmarshal(raw, &asMap); err == nil {
		if v, ok := asMap["fa"]; ok && len(v) > 0 {
			return v
		}
		if v, ok := asMap["en"]; ok && len(v) > 0 {
			return v
		}
	}
	return []string{}
}

type simpleError string

func (e simpleError) Error() string { return string(e) }

func errf(msg string) error { return simpleError(msg) }
