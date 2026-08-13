// Command enrichfoods enriches the canonical (per-100g) food catalog rows
// with the extended nutrition panel (sodium, cholesterol, calcium, iron,
// magnesium, potassium, phosphorus, trans fat, saturated fat) by matching
// each one against the real USDA FoodData Central SR Legacy dataset.
//
// It never invents a number: a food is only written to when a confident
// match is found against a real USDA record (traceable via the stored
// fdcId + match score). Everything else is left NULL and marked
// NutrientSource="unmatched" — most composite Persian dishes genuinely have
// no USDA counterpart, so partial coverage is the correct, honest outcome.
//
// Usage:
//
//	go run ./cmd/enrichfoods                 # enrich everything not yet processed
//	go run ./cmd/enrichfoods -limit 20        # sanity-check on a small sample first
//	go run ./cmd/enrichfoods -force           # re-match foods that already have a source
//	go run ./cmd/enrichfoods -min-score 0.5   # loosen/tighten match confidence
package main

import (
	"context"
	"flag"
	"log"

	"github.com/yourusername/fitness-management/config"
	"github.com/yourusername/fitness-management/internal/bootstrap"
	"github.com/yourusername/fitness-management/internal/seed"
)

func main() {
	limitFlag := flag.Int("limit", 0, "only process the first N canonical foods (0 = all) — use a small number to sanity-check match quality first")
	forceFlag := flag.Bool("force", false, "re-match foods that already have a nutrient_source set")
	minScoreFlag := flag.Float64("min-score", 0.4, "minimum fuzzy-match confidence (0-1) to accept a USDA match")
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

	dataDir := seed.DataFile("usda")
	log.Printf("[enrich-foods] loading USDA SR Legacy dataset (cached under %s)...", dataDir)
	idx, err := loadUSDAIndex(dataDir)
	if err != nil {
		log.Fatalf("failed to load USDA dataset: %v", err)
	}
	log.Printf("[enrich-foods] loaded %d USDA SR Legacy foods, %d with a dictionary entry to try",
		len(idx.foods), len(seed.PersianFoodSearchTerms))

	ctx := context.Background()
	if err := runEnrichment(ctx, db, idx, enrichOptions{
		limit:    *limitFlag,
		force:    *forceFlag,
		minScore: *minScoreFlag,
	}); err != nil {
		log.Fatalf("enrichment failed: %v", err)
	}
}
