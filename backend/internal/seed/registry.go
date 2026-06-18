package seed

import (
	"fmt"
	"io/fs"
	"sort"
	"sync"

	gormseed "github.com/promptrails/gorm-seed"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"

	"github.com/yourusername/fitness-management/internal/models"
)

const devProfile = "dev"

// fixtureDeps declares foreign-key load order when models lack GORM association tags.
var fixtureDeps = map[string][]string{
	"coach_profiles.json":     {"users.json"},
	"service_plans.json":      {"users.json"},
	"subscriptions.json":      {"users.json", "service_plans.json"},
	"orders.json":             {"users.json"},
	"order_items.json":        {"orders.json", "service_plans.json"},
	"workout_programs.json":   {"subscriptions.json"},
	"program_items.json":      {"workout_programs.json"},
	"nutrition_programs.json": {"subscriptions.json"},
	"nutrition_items.json":    {"nutrition_programs.json"},
	"check_ins.json":          {"users.json", "subscriptions.json"},
	"workout_sessions.json":   {"users.json", "subscriptions.json", "workout_programs.json"},
	"transactions.json":       {"users.json", "subscriptions.json"},
	"notifications.json":      {"users.json"},
}

// devFixtures lists JSON files loaded for local development and UI testing.
var devFixtures = map[string]any{
	"users.json":              &[]models.User{},
	"coach_profiles.json":     &[]models.CoachProfile{},
	"service_plans.json":      &[]models.ServicePlan{},
	"subscriptions.json":      &[]models.Subscription{},
	"orders.json":             &[]models.Order{},
	"order_items.json":        &[]models.OrderItem{},
	"workout_programs.json":   &[]models.WorkoutProgram{},
	"program_items.json":      &[]models.ProgramItem{},
	"nutrition_programs.json": &[]models.NutritionProgram{},
	"nutrition_items.json":    &[]models.NutritionItem{},
	"site_settings.json":      &[]models.SiteSettings{},
	"feedbacks.json":          &[]models.Feedback{},
	"check_ins.json":          &[]models.CheckIn{},
	"workout_sessions.json":   &[]models.WorkoutSession{},
	"transactions.json":       &[]models.Transaction{},
	"notifications.json":      &[]models.Notification{},
}

// naturalKeyConflict configures idempotent upsert targets for unique columns beyond PK.
var naturalKeyConflict = map[string][]string{
	"users.json":          {"email"},
	"coach_profiles.json": {"slug"},
	"service_plans.json":  {"name"},
	"orders.json":         {"tracking_code"},
	"transactions.json":   {"reference"},
}

// FixtureNamesForAllModels returns the JSON fixture filename for every GORM entity
// registered in models.AllModels(). Use when adding new entities or fixtures.
func FixtureNamesForAllModels(db *gorm.DB) ([]string, error) {
	names := make([]string, 0, len(models.AllModels()))
	for _, model := range models.AllModels() {
		name, err := fixtureFileName(db, model)
		if err != nil {
			return nil, err
		}
		names = append(names, name)
	}
	return names, nil
}

func fixtureFileName(db *gorm.DB, model any) (string, error) {
	var cache sync.Map
	sch, err := schema.Parse(model, &cache, db.NamingStrategy)
	if err != nil {
		return "", fmt.Errorf("parse schema for %T: %w", model, err)
	}
	return sch.Table + ".json", nil
}

func registerDevSpecs(seeder *gormseed.Seeder) {
	names := make([]string, 0, len(devFixtures))
	for name := range devFixtures {
		names = append(names, name)
	}
	sort.Strings(names)

	for _, name := range names {
		dest := devFixtures[name]
		specOpts := []gormseed.SpecOption{gormseed.Profile(devProfile)}
		for _, dep := range fixtureDeps[name] {
			specOpts = append(specOpts, gormseed.After(dep))
		}
		if cols, ok := naturalKeyConflict[name]; ok {
			specOpts = append(specOpts,
				gormseed.ConflictTarget(cols...),
				gormseed.OnConflict(gormseed.Skip()),
			)
		}
		seeder.Add(name, dest, specOpts...)
	}
}

func fixturesSubFS() (fs.FS, error) {
	return fs.Sub(fixtures, "fixtures")
}
