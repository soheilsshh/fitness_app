package seed

import (
	"context"
	"log"
	"os"
	"path/filepath"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/config"
	"github.com/yourusername/fitness-management/internal/models"
)

// CatalogSeedOptions controls startup / CLI reference-data seeding.
type CatalogSeedOptions struct {
	// Force re-imports even when tables already have rows.
	Force bool
	// ExercisesFile overrides data/exercises.fa.json.
	ExercisesFile string
	// FoodsFile overrides data/Persian_food_facts.csv.
	FoodsFile string
	// SkipTemplates skips crul workout/diet template import.
	SkipTemplates bool
}

// SeedCatalogs imports exercises, foods, and (optionally) crul templates.
// Idempotent: with Force=false, populated tables are skipped (fast restart).
// Missing files are logged and skipped — they do not fail the whole run.
func SeedCatalogs(ctx context.Context, db *gorm.DB, opts CatalogSeedOptions) error {
	log.Println("[catalog-seed] starting reference catalog seed")

	if err := seedExercisesIfNeeded(ctx, db, opts); err != nil {
		log.Printf("[catalog-seed] exercises error: %v", err)
	}
	if err := seedFoodsIfNeeded(ctx, db, opts); err != nil {
		log.Printf("[catalog-seed] foods error: %v", err)
	}
	if !opts.SkipTemplates {
		if err := seedTemplatesIfNeeded(ctx, db, opts.Force); err != nil {
			log.Printf("[catalog-seed] templates error: %v", err)
		}
	}

	warnExerciseMediaDir()
	log.Println("[catalog-seed] finished")
	return nil
}

// SeedCatalogsFromConfig runs SeedCatalogs using config.yaml seed.* flags.
func SeedCatalogsFromConfig(ctx context.Context, db *gorm.DB) error {
	cfg := config.Get().Seed
	if !cfg.Catalogs {
		log.Println("[catalog-seed] skipped (seed.catalogs=false)")
		return nil
	}
	return SeedCatalogs(ctx, db, CatalogSeedOptions{Force: cfg.CatalogsForce})
}

func seedExercisesIfNeeded(ctx context.Context, db *gorm.DB, opts CatalogSeedOptions) error {
	if !opts.Force {
		var count int64
		if err := db.Model(&models.Exercise{}).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			log.Printf("[catalog-seed] exercises: skip (%d rows already present; set seed.catalogs_force=true to re-import)", count)
			return nil
		}
	}

	path := DataFile(opts.ExercisesFile)
	if opts.ExercisesFile == "" {
		path = DataFile(DefaultExercisesFile)
	}
	if _, err := os.Stat(path); err != nil {
		if os.IsNotExist(err) {
			log.Printf("[catalog-seed] exercises: file not found (%s), skipping", path)
			return nil
		}
		return err
	}
	return ImportExercisesJSON(ctx, db, path)
}

func seedFoodsIfNeeded(ctx context.Context, db *gorm.DB, opts CatalogSeedOptions) error {
	if !opts.Force {
		var count int64
		if err := db.Model(&models.Food{}).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			log.Printf("[catalog-seed] foods: skip (%d rows already present; set seed.catalogs_force=true to re-import)", count)
			return nil
		}
	}

	path := DataFile(opts.FoodsFile)
	if opts.FoodsFile == "" {
		path = DataFile(DefaultFoodsFile)
	}
	if _, err := os.Stat(path); err != nil {
		if os.IsNotExist(err) {
			log.Printf("[catalog-seed] foods: file not found (%s), skipping", path)
			return nil
		}
		return err
	}
	return ImportFoodsCSV(ctx, db, path)
}

func seedTemplatesIfNeeded(ctx context.Context, db *gorm.DB, force bool) error {
	if !force {
		var workoutCount, dietCount int64
		_ = db.Model(&models.WorkoutTemplate{}).Count(&workoutCount).Error
		_ = db.Model(&models.NutritionTemplate{}).Count(&dietCount).Error
		if workoutCount > 0 && dietCount > 0 {
			log.Printf("[catalog-seed] templates: skip (workout=%d nutrition=%d already present; set seed.catalogs_force=true to re-import)",
				workoutCount, dietCount)
			return nil
		}
	}
	return SeedTemplatesFromCrul(ctx, db)
}

// warnExerciseMediaDir checks data/exercises-fa/{images,videos}.
func warnExerciseMediaDir() {
	root := ExercisesMediaDir()
	images := filepath.Join(root, "images")
	videos := filepath.Join(root, "videos")
	log.Printf("[catalog-seed] data dir: %s", DataDir())
	if _, err := os.Stat(root); os.IsNotExist(err) {
		log.Printf("[catalog-seed] WARNING: media folder missing: %s — put images/ and videos/ there (URL /exercises-media/)", root)
		return
	}
	imgCount := countFiles(images)
	vidCount := countFiles(videos)
	log.Printf("[catalog-seed] catalog media: images=%d videos=%d under %s", imgCount, vidCount, root)
	if imgCount == 0 {
		log.Printf("[catalog-seed] WARNING: missing/empty %s", images)
	}
	if vidCount == 0 {
		log.Printf("[catalog-seed] WARNING: missing/empty %s", videos)
	}
	// Template media is separate — only warn if templates JSON exists but media empty.
	tplRoot := ExerciseTemplatesMediaDir()
	if _, err := os.Stat(DataFile(DefaultExerciseTemplatesFile)); err == nil {
		log.Printf("[catalog-seed] template media dir (separate): %s (images=%d videos=%d)",
			tplRoot, countFiles(filepath.Join(tplRoot, "images")), countFiles(filepath.Join(tplRoot, "videos")))
	}
}

func countFiles(dir string) int {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return 0
	}
	n := 0
	for _, e := range entries {
		if !e.IsDir() && e.Name() != ".gitkeep" {
			n++
		}
	}
	return n
}
