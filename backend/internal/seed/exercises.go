package seed

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
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

// ImportExercisesJSON upserts the global exercise catalog from a JSON file.
func ImportExercisesJSON(ctx context.Context, db *gorm.DB, filePath string) error {
	raw, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}

	var items []datasetExercise
	if err := json.Unmarshal(raw, &items); err != nil {
		return err
	}

	repo := repository.NewExerciseRepository(db)
	created, updated, failed := 0, 0, 0

	for _, item := range items {
		exercise, err := mapDatasetExercise(item)
		if err != nil {
			log.Printf("[catalog-seed] skip exercise %s: %v", item.ID, err)
			failed++
			continue
		}

		_, findErr := repo.FindByExternalID(ctx, exercise.ExternalID)
		isUpdate := findErr == nil

		if err := repo.UpsertByExternalID(ctx, exercise); err != nil {
			log.Printf("[catalog-seed] upsert failed %s: %v", exercise.ExternalID, err)
			failed++
			continue
		}
		if isUpdate {
			updated++
		} else {
			created++
		}
	}

	log.Printf("[catalog-seed] exercises: total=%d created=%d updated=%d failed=%d file=%s",
		len(items), created, updated, failed, filePath)
	return nil
}

func mapDatasetExercise(item datasetExercise) (*models.Exercise, error) {
	externalID := strings.TrimSpace(item.ID)
	name := strings.TrimSpace(item.Name)
	if externalID == "" {
		return nil, fmt.Errorf("missing id")
	}
	if name == "" {
		return nil, fmt.Errorf("missing name")
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
