package seed

import (
	"context"
	"log"
	"regexp"
	"strconv"
	"strings"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
)

// Standard household-measure gram weights — used only to fill in a label a
// food doesn't already have real per-food data for (see deriveServingUnits).
// These are common nutrition-reference approximations, not measured for any
// specific food; real per-food weights derived from the catalog's own rows
// always take precedence over these.
var defaultServingUnitGrams = []struct {
	label string
	grams float64
}{
	{"قاشق چای‌خوری", 5},
	{"قاشق غذاخوری", 15},
	{"لیوان", 240},
	{"فنجان", 240},
	{"پیمانه", 200},
	{"کاسه", 250},
	{"بشقاب", 300},
}

var explicitGramHint = regexp.MustCompile(`\(\s*([\d.]+)\s*گرم`)

// junkLabelMarkers flags unit strings that are data-entry artifacts, not
// real serving sizes (e.g. "کالری (0 گرم)", "میلی‌گرم (0.001 گرم)") — these
// are skipped rather than turned into a nonsensical serving option.
var junkLabelMarkers = []string{"کالری", "میلی‌گرم", "میلی‌لیتر"}

// normalizeUnitLabel collapses near-duplicate spellings of the same unit —
// the catalog has ~6 spellings of "teaspoon" alone (قاشق چایخوری / قاشق
// چای‌خوری / قاشق چای خوری / ...) — down to one canonical label, and strips
// any parenthetical weight hint so "قاشق غذاخوری (15 گرم)" and "قاشق
// غذاخوری" collapse to the same label.
func normalizeUnitLabel(raw string) string {
	label := strings.TrimSpace(raw)
	if idx := strings.IndexByte(label, '('); idx >= 0 {
		label = strings.TrimSpace(label[:idx])
	}
	label = strings.Join(strings.Fields(label), " ")
	switch {
	case strings.HasPrefix(label, "قاشق چای"), strings.HasPrefix(label, "قاشق چاي"), label == "قاشض چایخوری":
		return "قاشق چای‌خوری"
	case strings.HasPrefix(label, "قاشق غذا"):
		return "قاشق غذاخوری"
	case strings.HasPrefix(label, "قاشق مربا"):
		return "قاشق مرباخوری"
	case strings.HasPrefix(label, "لیوان"):
		return "لیوان"
	case strings.HasPrefix(label, "فنجان"):
		return "فنجان"
	case strings.HasPrefix(label, "پیمانه"):
		return "پیمانه"
	case strings.HasPrefix(label, "کاسه"):
		return "کاسه"
	case strings.HasPrefix(label, "بشقاب"):
		return "بشقاب"
	case strings.HasPrefix(label, "عدد"):
		return "عدد"
	case strings.HasPrefix(label, "برش"), strings.HasPrefix(label, "تکه"):
		return "برش"
	case strings.HasPrefix(label, "قطعه"):
		return "قطعه"
	default:
		return label
	}
}

func isJunkLabel(label string) bool {
	if len([]rune(label)) < 2 {
		return true
	}
	for _, marker := range junkLabelMarkers {
		if strings.Contains(label, marker) {
			return true
		}
	}
	return false
}

// gramsPerUnitFromSibling derives how many grams one unit of a sibling row's
// label represents, using whichever macro is non-zero on both rows as the
// scaling basis. Returns (0, false) when nothing reliable can be derived —
// callers must not fabricate a value in that case.
func gramsPerUnitFromSibling(canonical, sibling *models.Food) (float64, bool) {
	if sibling.Amount <= 0 {
		return 0, false
	}
	ratio := func(canonicalPer100, siblingTotal float64) (float64, bool) {
		if canonicalPer100 <= 0 || siblingTotal <= 0 {
			return 0, false
		}
		gramsForSiblingAmount := siblingTotal * 100 / canonicalPer100
		return gramsForSiblingAmount / sibling.Amount, true
	}
	if g, ok := ratio(canonical.Calories, sibling.Calories); ok {
		return g, true
	}
	if g, ok := ratio(canonical.Protein, sibling.Protein); ok {
		return g, true
	}
	if g, ok := ratio(canonical.Carbs, sibling.Carbs); ok {
		return g, true
	}
	if g, ok := ratio(canonical.Fat, sibling.Fat); ok {
		return g, true
	}
	return 0, false
}

type derivedUnit struct {
	label      string
	grams      float64
	sourceNote string
}

// deriveServingUnits works out the spoon/gram/cup picker for one canonical
// food from its sibling rows (same Name, other units) plus standard
// household-measure fallbacks for any of those that aren't already covered.
func deriveServingUnits(canonical *models.Food, siblings []models.Food) []derivedUnit {
	byLabel := map[string]derivedUnit{}

	addIfBetter := func(u derivedUnit) {
		existing, ok := byLabel[u.label]
		// Prefer an explicit-weight-hint match over a ratio-derived one.
		if ok && existing.sourceNote == "explicit weight in catalog unit" {
			return
		}
		byLabel[u.label] = u
	}

	// Pass 1: siblings whose unit string already states its own weight, e.g.
	// "قاشق غذاخوری (15 گرم)" — most reliable, always wins.
	for i := range siblings {
		s := &siblings[i]
		m := explicitGramHint.FindStringSubmatch(s.Unit)
		if m == nil {
			continue
		}
		grams, err := strconv.ParseFloat(m[1], 64)
		if err != nil || grams <= 0 || s.Amount <= 0 {
			continue
		}
		label := normalizeUnitLabel(s.Unit)
		if isJunkLabel(label) {
			continue
		}
		addIfBetter(derivedUnit{label: label, grams: grams / s.Amount, sourceNote: "explicit weight in catalog unit"})
	}

	// Pass 2: everything else — derive a gram weight by ratio against the
	// canonical per-100g row. Skipped entirely (not guessed) when no macro
	// gives a usable ratio.
	for i := range siblings {
		s := &siblings[i]
		label := normalizeUnitLabel(s.Unit)
		if isJunkLabel(label) {
			continue
		}
		if _, exists := byLabel[label]; exists {
			continue
		}
		grams, ok := gramsPerUnitFromSibling(canonical, s)
		if !ok || grams <= 0 {
			continue
		}
		addIfBetter(derivedUnit{label: label, grams: grams, sourceNote: "derived from catalog row"})
	}

	// Always-available exact unit.
	byLabel["گرم"] = derivedUnit{label: "گرم", grams: 1, sourceNote: "exact"}

	// Fill in standard household measures the food doesn't already have real
	// data for, so every food gets a usable picker even with zero siblings.
	for _, def := range defaultServingUnitGrams {
		if _, exists := byLabel[def.label]; exists {
			continue
		}
		byLabel[def.label] = derivedUnit{label: def.label, grams: def.grams, sourceNote: "standard household measure"}
	}

	out := make([]derivedUnit, 0, len(byLabel))
	for _, u := range byLabel {
		out = append(out, u)
	}
	return out
}

// EnrichFoodServingUnits marks one canonical (per-100g) Food row per unique
// Name and builds its FoodServingUnit picker (spoon/gram/cup). Idempotent
// and safe to run on every startup: existing canonical flags and serving
// units are left alone, only genuinely missing ones are added.
func EnrichFoodServingUnits(ctx context.Context, db *gorm.DB) error {
	var foods []models.Food
	if err := db.WithContext(ctx).Order("name ASC, id ASC").Find(&foods).Error; err != nil {
		return err
	}
	if len(foods) == 0 {
		return nil
	}

	byName := map[string][]models.Food{}
	order := make([]string, 0, len(foods))
	for _, f := range foods {
		if _, seen := byName[f.Name]; !seen {
			order = append(order, f.Name)
		}
		byName[f.Name] = append(byName[f.Name], f)
	}

	var existingUnits []models.FoodServingUnit
	if err := db.WithContext(ctx).Find(&existingUnits).Error; err != nil {
		return err
	}
	existingByFood := map[uint]map[string]bool{}
	for _, u := range existingUnits {
		if existingByFood[u.FoodID] == nil {
			existingByFood[u.FoodID] = map[string]bool{}
		}
		existingByFood[u.FoodID][u.Label] = true
	}

	var toInsert []models.FoodServingUnit
	canonicalCount, noGramRowCount := 0, 0

	for _, name := range order {
		rows := byName[name]
		canonicalIdx := -1
		for i := range rows {
			if rows[i].Unit == "گرم" {
				canonicalIdx = i
				break
			}
		}
		if canonicalIdx == -1 {
			noGramRowCount++
			continue
		}
		canonical := rows[canonicalIdx]

		if !canonical.IsCanonical {
			if err := db.WithContext(ctx).Model(&models.Food{}).
				Where("id = ?", canonical.ID).
				Update("is_canonical", true).Error; err != nil {
				return err
			}
		}
		canonicalCount++

		if existingByFood[canonical.ID] != nil && len(existingByFood[canonical.ID]) > 0 {
			continue // already has a picker from a previous run
		}

		var siblings []models.Food
		for i, r := range rows {
			if i != canonicalIdx {
				siblings = append(siblings, r)
			}
		}

		for _, u := range deriveServingUnits(&canonical, siblings) {
			toInsert = append(toInsert, models.FoodServingUnit{
				FoodID:       canonical.ID,
				Label:        u.label,
				GramsPerUnit: u.grams,
				IsDefault:    u.label == "گرم",
				SourceNote:   u.sourceNote,
			})
		}
	}

	if len(toInsert) > 0 {
		if err := db.WithContext(ctx).CreateInBatches(toInsert, 500).Error; err != nil {
			return err
		}
	}

	log.Printf("[food-enrich] serving units: canonical_foods=%d new_units=%d foods_without_gram_row=%d",
		canonicalCount, len(toInsert), noGramRowCount)
	return nil
}
