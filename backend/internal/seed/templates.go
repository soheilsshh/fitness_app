package seed

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

const (
	defaultExerciseTemplatesFile = DefaultExerciseTemplatesFile
	defaultDietTemplatesFile     = DefaultDietTemplatesFile
)

type crulExerciseFile struct {
	Templates []crulExerciseTemplate `json:"templates"`
}

type crulExerciseTemplate struct {
	ID        int              `json:"id"`
	Title     string           `json:"title"`
	Type      string           `json:"type"`
	Gender    string           `json:"gender"`
	Location  string           `json:"location"`
	DayCount  int              `json:"dayCount"`
	Target    string           `json:"target"`
	Injury    string           `json:"injury"`
	Level     string           `json:"level"`
	CreatorID *int             `json:"creatorId"`
	Days      []crulExerciseDay `json:"days"`
}

type crulExerciseDay struct {
	ID          int                 `json:"id"`
	TemplateID  int                 `json:"templateId"`
	DayNumber   int                 `json:"day_number"`
	Description string              `json:"description"`
	Data        []crulExerciseBlock `json:"data"`
}

type crulExerciseBlock struct {
	ExerciseSystem   string              `json:"exercise_system"`
	ExerciseSystemID int                 `json:"exercise_system_id"`
	MovementList     []crulExerciseMove  `json:"movement_list"`
}

type crulExerciseMove struct {
	ActionTitle       string          `json:"action_title"`
	ActionID          int             `json:"action_id"`
	ActionDescription string          `json:"action_description"`
	Description       string          `json:"description"`
	Sets              []crulExerciseSet `json:"sets"`
}

type crulExerciseSet struct {
	Type    string `json:"type"`
	Count   string `json:"count"`
	SetHash string `json:"setHash"`
}

type crulDietFile struct {
	Templates []crulDietTemplate `json:"templates"`
}

type crulDietTemplate struct {
	ID          int            `json:"id"`
	Title       string         `json:"title"`
	Type        string         `json:"type"`
	Description string         `json:"description"`
	Gender      string         `json:"gender"`
	Target      string         `json:"target"`
	Limitation  string         `json:"limitation"`
	Calorie     int            `json:"calorie"`
	IsPro       bool           `json:"is_pro"`
	Version     int            `json:"version"`
	CreatorID   *int           `json:"creatorId"`
	Data        []crulDietMeal `json:"data"`
}

type crulDietMeal struct {
	MealName    string          `json:"meal_name"`
	MealCalorie int             `json:"meal_calorie"`
	StartTime   string          `json:"start_time"`
	EndTime     string          `json:"end_time"`
	Menu        []crulDietMenu  `json:"menu"`
}

type crulDietMenu struct {
	MenuName string           `json:"menu_name"`
	Items    []crulDietFood   `json:"items"`
}

type crulDietFood struct {
	FoodID      int     `json:"food_id"`
	FoodName    string  `json:"food_name"`
	FoodImage   *string `json:"food_image"`
	Unit        string  `json:"unit"`
	Value       float64 `json:"value"`
	Description string  `json:"description"`
}

// SeedTemplatesFromCrul imports morabiha templates when JSON files are present.
// Existing templates are skipped by SourceID (idempotent).
func SeedTemplatesFromCrul(ctx context.Context, db *gorm.DB) error {
	exercisePath := resolveCrulPath("TEMPLATE_EXERCISE_FILE", defaultExerciseTemplatesFile)
	dietPath := resolveCrulPath("TEMPLATE_DIET_FILE", defaultDietTemplatesFile)

	exerciseRepo := repository.NewExerciseRepository(db)
	foodRepo := repository.NewFoodRepository(db)
	templateRepo := repository.NewTemplateRepository(db)

	var totalErr error

	if err := seedWorkoutTemplates(ctx, db, templateRepo, exerciseRepo, exercisePath); err != nil {
		log.Printf("[template-seed] workout templates failed: %v", err)
		totalErr = err
	}
	if err := seedNutritionTemplates(ctx, db, templateRepo, foodRepo, dietPath); err != nil {
		log.Printf("[template-seed] nutrition templates failed: %v", err)
		if totalErr == nil {
			totalErr = err
		}
	}

	return totalErr
}

func resolveCrulPath(envKey, defaultName string) string {
	if v := strings.TrimSpace(os.Getenv(envKey)); v != "" {
		if filepath.IsAbs(v) {
			return v
		}
		return DataFile(v)
	}
	return DataFile(defaultName)
}

func seedWorkoutTemplates(
	ctx context.Context,
	db *gorm.DB,
	templateRepo repository.TemplateRepository,
	exerciseRepo repository.ExerciseRepository,
	filePath string,
) error {
	raw, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			log.Printf("[template-seed] workout file not found (%s), skipping", filePath)
			return nil
		}
		return fmt.Errorf("read workout templates: %w", err)
	}

	var payload crulExerciseFile
	if err := json.Unmarshal(raw, &payload); err != nil {
		return fmt.Errorf("parse workout templates: %w", err)
	}

	log.Printf("[template-seed] loading %d workout templates from %s", len(payload.Templates), filePath)

	created, skipped, failed, unmatchedExercises := 0, 0, 0, 0

	for _, src := range payload.Templates {
		exists, err := templateRepo.WorkoutTemplateExistsBySourceID(ctx, src.ID)
		if err != nil {
			failed++
			log.Printf("[template-seed] workout source_id=%d exists check failed: %v", src.ID, err)
			continue
		}
		if exists {
			skipped++
			continue
		}

		template := &models.WorkoutTemplate{
			SourceID: src.ID,
			Title:    strings.TrimSpace(src.Title),
			Type:     strings.TrimSpace(src.Type),
			Gender:   strings.TrimSpace(src.Gender),
			Location: strings.TrimSpace(src.Location),
			DayCount: src.DayCount,
			Target:   strings.TrimSpace(src.Target),
			Injury:   strings.TrimSpace(src.Injury),
			Level:    strings.TrimSpace(src.Level),
			CoachID:  mapCreatorID(src.CreatorID),
		}
		if template.DayCount <= 0 {
			template.DayCount = len(src.Days)
		}

		items := buildWorkoutTemplateItems(ctx, exerciseRepo, src, &unmatchedExercises)
		template.Items = items

		if err := templateRepo.CreateWorkoutTemplate(ctx, template); err != nil {
			failed++
			log.Printf("[template-seed] workout source_id=%d create failed: %v", src.ID, err)
			continue
		}
		created++
	}

	log.Printf("[template-seed] workout complete: total=%d created=%d skipped=%d failed=%d unmatched_exercises=%d",
		len(payload.Templates), created, skipped, failed, unmatchedExercises)
	return nil
}

func buildWorkoutTemplateItems(
	ctx context.Context,
	exerciseRepo repository.ExerciseRepository,
	src crulExerciseTemplate,
	unmatched *int,
) []models.TemplateProgramItem {
	items := make([]models.TemplateProgramItem, 0)
	order := 0

	for _, day := range src.Days {
		dayNum := day.DayNumber
		if dayNum <= 0 {
			dayNum = 1
		}

		for blockIdx, block := range day.Data {
			systemType := mapExerciseSystemType(block.ExerciseSystem, block.ExerciseSystemID)
			var supersetID *string
			if len(block.MovementList) > 1 {
				id := fmt.Sprintf("src-%d-day-%d-block-%d", src.ID, dayNum, blockIdx)
				supersetID = &id
			}

			for _, move := range block.MovementList {
				order++
				title := strings.TrimSpace(move.ActionTitle)
				if title == "" {
					title = fmt.Sprintf("حرکت %d", move.ActionID)
				}

				notes := strings.TrimSpace(move.Description)
				if notes == "" {
					notes = strings.TrimSpace(move.ActionDescription)
				}

				item := models.TemplateProgramItem{
					DayNumber:         dayNum,
					OrderIndex:        order,
					Exercise:          title,
					Notes:             notes,
					SupersetID:        supersetID,
					WorkoutSystemType: systemType,
				}

				if exID, ok := resolveExerciseID(ctx, exerciseRepo, move.ActionID); ok {
					item.ExerciseID = &exID
				} else {
					*unmatched++
				}

				sets := make([]models.TemplateProgramItemSet, 0, len(move.Sets))
				for i, s := range move.Sets {
					setType := strings.TrimSpace(s.Type)
					reps := strings.TrimSpace(s.Count)
					sets = append(sets, models.TemplateProgramItemSet{
						SetNumber: i + 1,
						SetType:   setType,
						Reps:      reps,
						IsAMRAP:   isAMRAPSetType(setType),
						SetHash:   strings.TrimSpace(s.SetHash),
					})
				}
				item.SetsDetails = sets
				items = append(items, item)
			}
		}
	}

	return items
}

func seedNutritionTemplates(
	ctx context.Context,
	db *gorm.DB,
	templateRepo repository.TemplateRepository,
	foodRepo repository.FoodRepository,
	filePath string,
) error {
	raw, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			log.Printf("[template-seed] diet file not found (%s), skipping", filePath)
			return nil
		}
		return fmt.Errorf("read diet templates: %w", err)
	}

	var payload crulDietFile
	if err := json.Unmarshal(raw, &payload); err != nil {
		return fmt.Errorf("parse diet templates: %w", err)
	}

	log.Printf("[template-seed] loading %d nutrition templates from %s", len(payload.Templates), filePath)

	created, skipped, failed, unmatchedFoods := 0, 0, 0, 0

	for _, src := range payload.Templates {
		exists, err := templateRepo.NutritionTemplateExistsBySourceID(ctx, src.ID)
		if err != nil {
			failed++
			log.Printf("[template-seed] nutrition source_id=%d exists check failed: %v", src.ID, err)
			continue
		}
		if exists {
			skipped++
			continue
		}

		version := src.Version
		if version <= 0 {
			version = 1
		}

		template := &models.NutritionTemplate{
			SourceID:    src.ID,
			Title:       strings.TrimSpace(src.Title),
			Type:        strings.TrimSpace(src.Type),
			Gender:      strings.TrimSpace(src.Gender),
			Target:      strings.TrimSpace(src.Target),
			Limitation:  strings.TrimSpace(src.Limitation),
			Calorie:     src.Calorie,
			Description: strings.TrimSpace(src.Description),
			IsPro:       src.IsPro,
			Version:     version,
			CoachID:     mapCreatorID(src.CreatorID),
		}

		meals := buildNutritionTemplateMeals(ctx, foodRepo, src.Data, &unmatchedFoods)
		template.Meals = meals

		if err := templateRepo.CreateNutritionTemplate(ctx, template); err != nil {
			failed++
			log.Printf("[template-seed] nutrition source_id=%d create failed: %v", src.ID, err)
			continue
		}
		created++
	}

	log.Printf("[template-seed] nutrition complete: total=%d created=%d skipped=%d failed=%d unmatched_foods=%d",
		len(payload.Templates), created, skipped, failed, unmatchedFoods)
	return nil
}

func buildNutritionTemplateMeals(
	ctx context.Context,
	foodRepo repository.FoodRepository,
	srcMeals []crulDietMeal,
	unmatched *int,
) []models.TemplateMeal {
	meals := make([]models.TemplateMeal, 0, len(srcMeals))

	for mealIdx, srcMeal := range srcMeals {
		meal := models.TemplateMeal{
			MealOrder:   mealIdx + 1,
			MealName:    strings.TrimSpace(srcMeal.MealName),
			MealCalorie: srcMeal.MealCalorie,
			StartTime:   strings.TrimSpace(srcMeal.StartTime),
			EndTime:     strings.TrimSpace(srcMeal.EndTime),
		}

		itemOrder := 0
		for _, menu := range srcMeal.Menu {
			menuName := strings.TrimSpace(menu.MenuName)
			for _, food := range menu.Items {
				itemOrder++
				name := strings.TrimSpace(food.FoodName)
				if name == "" {
					name = fmt.Sprintf("غذا %d", food.FoodID)
				}

				image := ""
				if food.FoodImage != nil {
					image = strings.TrimSpace(*food.FoodImage)
				}

				item := models.TemplateMealItem{
					MenuName:    menuName,
					OrderIndex:  itemOrder,
					FoodName:    name,
					FoodImage:   image,
					Unit:        strings.TrimSpace(food.Unit),
					Value:       food.Value,
					Description: strings.TrimSpace(food.Description),
				}

				if foodID, ok := resolveFoodID(ctx, foodRepo, food.FoodID); ok {
					item.FoodID = &foodID
				} else {
					*unmatched++
				}

				meal.Items = append(meal.Items, item)
			}
		}

		meals = append(meals, meal)
	}

	return meals
}

func mapCreatorID(creatorID *int) *uint {
	if creatorID == nil || *creatorID <= 0 {
		return nil
	}
	id := uint(*creatorID)
	return &id
}

func mapExerciseSystemType(system string, systemID int) string {
	s := strings.TrimSpace(strings.ToLower(system))
	switch {
	case strings.Contains(s, "سوپر"), strings.Contains(s, "superset"):
		return "superset"
	case strings.Contains(s, "مدار"), strings.Contains(s, "circuit"):
		return "circuit"
	case strings.Contains(s, "غول"), strings.Contains(s, "giant"):
		return "giant_set"
	case systemID == 2:
		return "superset"
	case systemID == 4:
		return "circuit"
	default:
		return "normal"
	}
}

func isAMRAPSetType(setType string) bool {
	s := strings.TrimSpace(strings.ToLower(setType))
	return strings.Contains(s, "amrap") ||
		strings.Contains(s, "ماکسیم") ||
		strings.Contains(s, "max")
}

func resolveExerciseID(ctx context.Context, repo repository.ExerciseRepository, actionID int) (uint, bool) {
	if actionID <= 0 {
		return 0, false
	}
	candidates := []string{
		strconv.Itoa(actionID),
		fmt.Sprintf("%04d", actionID),
	}
	for _, extID := range candidates {
		ex, err := repo.FindByExternalID(ctx, extID)
		if err == nil && ex != nil {
			return ex.ID, true
		}
	}
	return 0, false
}

func resolveFoodID(ctx context.Context, repo repository.FoodRepository, foodID int) (uint, bool) {
	if foodID <= 0 {
		return 0, false
	}
	extID := strconv.Itoa(foodID)
	food, err := repo.FindByExternalID(ctx, extID)
	if err == nil && food != nil {
		return food.ID, true
	}
	return 0, false
}
