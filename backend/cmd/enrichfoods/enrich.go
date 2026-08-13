package main

import (
	"context"
	"log"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/seed"
)

type enrichOptions struct {
	limit    int
	force    bool
	minScore float64
}

// runEnrichment walks canonical (per-100g) Food rows, looks each one up in
// the bundled Persian->English dictionary, and — only on a confident USDA
// match — writes the 9 extended nutrient fields plus a traceable source
// (fdcId + match score). Foods with no dictionary entry or no confident
// match are marked NutrientSource="unmatched": checked, not guessed.
func runEnrichment(ctx context.Context, db *gorm.DB, idx *usdaIndex, opts enrichOptions) error {
	q := db.WithContext(ctx).Where("is_canonical = ?", true)
	if !opts.force {
		q = q.Where("nutrient_source IS NULL OR nutrient_source = ?", "")
	}
	var foods []models.Food
	if err := q.Order("name ASC").Find(&foods).Error; err != nil {
		return err
	}

	var processed, matched, noDictEntry, noConfidentMatch int
	for i := range foods {
		if opts.limit > 0 && processed >= opts.limit {
			break
		}
		f := &foods[i]
		processed++

		query, ok := seed.PersianFoodSearchTerms[f.Name]
		if !ok {
			noDictEntry++
			markUnmatched(ctx, db, f.ID)
			continue
		}

		m := idx.bestMatch(query, opts.minScore)
		if m == nil {
			noConfidentMatch++
			markUnmatched(ctx, db, f.ID)
			log.Printf("[enrich-foods] no confident match: %q (query=%q)", f.Name, query)
			continue
		}

		if err := applyMatch(ctx, db, f.ID, m); err != nil {
			return err
		}
		matched++
		log.Printf("[enrich-foods] matched %q -> fdcId=%s score=%.2f (%s)", f.Name, m.fdcID, m.score, m.food.description)
	}

	log.Printf("[enrich-foods] done: processed=%d matched=%d no_dictionary_entry=%d no_confident_match=%d",
		processed, matched, noDictEntry, noConfidentMatch)
	return nil
}

func applyMatch(ctx context.Context, db *gorm.DB, foodID uint, m *matchResult) error {
	updates := map[string]any{
		"nutrient_source":      "usda",
		"nutrient_source_ref":  m.fdcID,
		"nutrient_match_score": m.score,
	}
	fieldToColumn := map[string]string{
		"calcium":      "calcium",
		"iron":         "iron",
		"magnesium":    "magnesium",
		"phosphorus":   "phosphorus",
		"potassium":    "potassium",
		"sodium":       "sodium",
		"cholesterol":  "cholesterol",
		"saturatedFat": "saturated_fat",
		"transFat":     "trans_fat",
	}
	for field, value := range m.food.nutrients {
		if col, ok := fieldToColumn[field]; ok {
			updates[col] = value
		}
	}
	return db.WithContext(ctx).Model(&models.Food{}).Where("id = ?", foodID).Updates(updates).Error
}

func markUnmatched(ctx context.Context, db *gorm.DB, foodID uint) {
	err := db.WithContext(ctx).Model(&models.Food{}).
		Where("id = ?", foodID).
		Update("nutrient_source", "unmatched").Error
	if err != nil {
		log.Printf("[enrich-foods] warning: failed marking food %d unmatched: %v", foodID, err)
	}
}
