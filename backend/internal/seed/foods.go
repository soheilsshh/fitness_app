package seed

import (
	"context"
	"crypto/sha256"
	"encoding/csv"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"os"
	"strconv"
	"strings"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

type csvFoodRow struct {
	Name, Unit, Category string
	SourceExternalID     *string
	Amount               float64
	IsCanonical          bool
	Calories             float64
	Fat                  float64
	Protein              float64
	Carbs                float64
	Fiber                *float64
	Sugar                *float64
	Sodium               *float64
	Cholesterol          *float64
	Calcium              *float64
	Iron                 *float64
	Magnesium            *float64
	Potassium            *float64
	Phosphorus           *float64
	TransFat             *float64
	SaturatedFat         *float64
	Water                *float64
	Omega3               *float64
	Omega6               *float64
	Zinc                 *float64
	VitaminC             *float64
	GlycemicLoad         *float64
	KcalPerGram          *float64

	BurnRun10KphMinPerGram   *float64
	BurnWalk7KphMinPerGram   *float64
	BurnCycle15KphMinPerGram *float64
	BurnSwimCrawlMinPerGram  *float64
	BurnHikeMinPerGram       *float64
	BurnAerobicsMinPerGram   *float64

	NutrientSource     string
	NutrientSourceRef  string
	NutrientMatchScore *float64
	DataQualityStatus  string
	DataQualityFlags   string
}

// ImportFoodsCSV upserts the global food catalog from Persian_food_facts.csv.
func ImportFoodsCSV(ctx context.Context, db *gorm.DB, filePath string) error {
	f, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("open file: %w", err)
	}
	defer f.Close()

	reader := csv.NewReader(f)
	reader.TrimLeadingSpace = true
	reader.LazyQuotes = true

	header, err := reader.Read()
	if err != nil {
		return fmt.Errorf("read header: %w", err)
	}
	colIndex := mapCSVFoodHeader(header)

	var rows []*csvFoodRow
	lineNum := 1

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		lineNum++
		if err != nil {
			return fmt.Errorf("food line %d: read: %w", lineNum, err)
		}

		row, err := parseCSVFoodRow(record, colIndex)
		if err != nil {
			return fmt.Errorf("food line %d: %w", lineNum, err)
		}
		rows = append(rows, row)
	}

	if err := validateCSVFoodRows(rows); err != nil {
		return fmt.Errorf("validate food dataset: %w", err)
	}

	created, updated := 0, 0
	if err := db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		repo := repository.NewFoodRepository(tx)
		for i, row := range rows {
			food := mapCSVRowToFood(row)
			_, findErr := repo.FindByExternalID(ctx, food.ExternalID)
			switch {
			case findErr == nil:
				updated++
			case errors.Is(findErr, gorm.ErrRecordNotFound):
				created++
			default:
				return fmt.Errorf("food line %d: lookup: %w", i+2, findErr)
			}
			if err := repo.UpsertByExternalID(ctx, food); err != nil {
				return fmt.Errorf("food line %d: upsert: %w", i+2, err)
			}
		}
		return nil
	}); err != nil {
		return err
	}
	if err := verifyImportedFoods(ctx, db, rows); err != nil {
		return fmt.Errorf("verify imported foods: %w", err)
	}

	log.Printf("[catalog-seed] foods: created=%d updated=%d total=%d file=%s",
		created, updated, len(rows), filePath)
	return nil
}

func verifyImportedFoods(ctx context.Context, db *gorm.DB, rows []*csvFoodRow) error {
	externalIDs := make([]string, 0, len(rows))
	expectedCanonical := 0
	expectedStatuses := map[string]int{}
	for _, row := range rows {
		externalIDs = append(externalIDs, foodExternalID(row.Name, row.Unit, row.Amount))
		if row.IsCanonical {
			expectedCanonical++
		}
		expectedStatuses[row.DataQualityStatus]++
	}

	storedCount, storedCanonical := 0, 0
	storedStatuses := map[string]int{}
	for start := 0; start < len(externalIDs); start += 500 {
		end := start + 500
		if end > len(externalIDs) {
			end = len(externalIDs)
		}
		var stored []models.Food
		if err := db.WithContext(ctx).
			Select("external_id", "is_canonical", "data_quality_status", "kcal_per_g").
			Where("external_id IN ?", externalIDs[start:end]).
			Find(&stored).Error; err != nil {
			return err
		}
		storedCount += len(stored)
		for _, food := range stored {
			storedStatuses[food.DataQualityStatus]++
			if food.IsCanonical {
				storedCanonical++
				if food.KcalPerGram == nil {
					return fmt.Errorf("canonical food %s has null kcal_per_g", food.ExternalID)
				}
			}
		}
	}

	if storedCount != len(rows) {
		return fmt.Errorf("stored rows=%d, expected=%d", storedCount, len(rows))
	}
	if storedCanonical != expectedCanonical {
		return fmt.Errorf("canonical rows=%d, expected=%d", storedCanonical, expectedCanonical)
	}
	for status, expected := range expectedStatuses {
		if storedStatuses[status] != expected {
			return fmt.Errorf("%s rows=%d, expected=%d", status, storedStatuses[status], expected)
		}
	}
	log.Printf("[catalog-seed] food verification: rows=%d canonical=%d verified=%d corrected=%d needs_review=%d",
		storedCount, storedCanonical, storedStatuses["verified"], storedStatuses["corrected"], storedStatuses["needs_review"])
	return nil
}

func validateCSVFoodRows(rows []*csvFoodRow) error {
	seen := make(map[string]bool, len(rows))
	names := make(map[string]bool)
	canonicalByName := make(map[string]int)
	for i, row := range rows {
		names[row.Name] = true
		id := foodExternalID(row.Name, row.Unit, row.Amount)
		if seen[id] {
			return fmt.Errorf("line %d duplicates name/unit/amount", i+2)
		}
		seen[id] = true
		if row.IsCanonical {
			if row.Unit != "گرم" || row.Amount != 100 {
				return fmt.Errorf("line %d canonical row must be exactly 100 گرم", i+2)
			}
			canonicalByName[row.Name]++
		}
	}
	for name := range names {
		count := canonicalByName[name]
		if count != 1 {
			return fmt.Errorf("food %q has %d canonical rows", name, count)
		}
	}
	return nil
}

func mapCSVFoodHeader(header []string) map[string]int {
	idx := make(map[string]int, len(header))
	for i, h := range header {
		key := strings.ToLower(strings.TrimSpace(h))
		switch key {
		case "name":
			idx["name"] = i
		case "unit":
			idx["unit"] = i
		case "category":
			idx["category"] = i
		case "source_external_id":
			idx["source_external_id"] = i
		case "amount":
			idx["amount"] = i
		case "is_canonical":
			idx["is_canonical"] = i
		case "cal", "calories":
			idx["cal"] = i
		case "fat":
			idx["fat"] = i
		case "protein":
			idx["protein"] = i
		case "carb", "carbs":
			idx["carb"] = i
		case "fiber":
			idx["fiber"] = i
		case "sugar":
			idx["sugar"] = i
		case "sodium", "cholesterol", "calcium", "iron", "magnesium",
			"potassium", "phosphorus", "trans_fat", "saturated_fat",
			"water", "omega3", "omega6", "zinc", "vitamin_c",
			"glycemic_load", "kcal_per_g", "burn_run_10kph_min_per_g",
			"burn_walk_7kph_min_per_g", "burn_cycle_15kph_min_per_g",
			"burn_swim_crawl_min_per_g", "burn_hike_min_per_g",
			"burn_aerobics_min_per_g", "nutrient_source",
			"nutrient_source_ref", "nutrient_match_score",
			"data_quality_status", "data_quality_flags":
			idx[key] = i
		}
	}
	return idx
}

func parseCSVFoodRow(record []string, col map[string]int) (*csvFoodRow, error) {
	get := func(key string) string {
		i, ok := col[key]
		if !ok || i >= len(record) {
			return ""
		}
		return strings.TrimSpace(record[i])
	}

	name := get("name")
	unit := get("unit")
	if name == "" {
		return nil, fmt.Errorf("missing name")
	}
	if unit == "" {
		return nil, fmt.Errorf("missing unit")
	}

	amount, err := parseRequiredFloat(get("amount"))
	if err != nil {
		return nil, fmt.Errorf("amount: %w", err)
	}
	if amount <= 0 {
		return nil, fmt.Errorf("amount must be greater than zero")
	}

	calories, err := parseRequiredFloat(get("cal"))
	if err != nil {
		return nil, fmt.Errorf("cal: %w", err)
	}

	fat, err := parseOptionalFloat(get("fat"), 0)
	if err != nil {
		return nil, fmt.Errorf("fat: %w", err)
	}
	protein, err := parseOptionalFloat(get("protein"), 0)
	if err != nil {
		return nil, fmt.Errorf("protein: %w", err)
	}
	carbs, err := parseOptionalFloat(get("carb"), 0)
	if err != nil {
		return nil, fmt.Errorf("carb: %w", err)
	}

	isCanonical, err := parseOptionalBool(get("is_canonical"), unit == "گرم" && amount == 100)
	if err != nil {
		return nil, fmt.Errorf("is_canonical: %w", err)
	}
	nullable := func(key string) (*float64, error) {
		value, err := parseNullableFloat(get(key))
		if err != nil {
			return nil, fmt.Errorf("%s: %w", key, err)
		}
		return value, nil
	}
	fiber, err := nullable("fiber")
	if err != nil {
		return nil, err
	}
	sugar, err := nullable("sugar")
	if err != nil {
		return nil, err
	}
	sodium, err := nullable("sodium")
	if err != nil {
		return nil, err
	}
	cholesterol, err := nullable("cholesterol")
	if err != nil {
		return nil, err
	}
	calcium, err := nullable("calcium")
	if err != nil {
		return nil, err
	}
	iron, err := nullable("iron")
	if err != nil {
		return nil, err
	}
	magnesium, err := nullable("magnesium")
	if err != nil {
		return nil, err
	}
	potassium, err := nullable("potassium")
	if err != nil {
		return nil, err
	}
	phosphorus, err := nullable("phosphorus")
	if err != nil {
		return nil, err
	}
	transFat, err := nullable("trans_fat")
	if err != nil {
		return nil, err
	}
	saturatedFat, err := nullable("saturated_fat")
	if err != nil {
		return nil, err
	}
	water, err := nullable("water")
	if err != nil {
		return nil, err
	}
	omega3, err := nullable("omega3")
	if err != nil {
		return nil, err
	}
	omega6, err := nullable("omega6")
	if err != nil {
		return nil, err
	}
	zinc, err := nullable("zinc")
	if err != nil {
		return nil, err
	}
	vitaminC, err := nullable("vitamin_c")
	if err != nil {
		return nil, err
	}
	glycemicLoad, err := nullable("glycemic_load")
	if err != nil {
		return nil, err
	}
	kcalPerGram, err := nullable("kcal_per_g")
	if err != nil {
		return nil, err
	}
	burnRun, err := nullable("burn_run_10kph_min_per_g")
	if err != nil {
		return nil, err
	}
	burnWalk, err := nullable("burn_walk_7kph_min_per_g")
	if err != nil {
		return nil, err
	}
	burnCycle, err := nullable("burn_cycle_15kph_min_per_g")
	if err != nil {
		return nil, err
	}
	burnSwim, err := nullable("burn_swim_crawl_min_per_g")
	if err != nil {
		return nil, err
	}
	burnHike, err := nullable("burn_hike_min_per_g")
	if err != nil {
		return nil, err
	}
	burnAerobics, err := nullable("burn_aerobics_min_per_g")
	if err != nil {
		return nil, err
	}
	matchScore, err := nullable("nutrient_match_score")
	if err != nil {
		return nil, err
	}
	status := get("data_quality_status")
	if status == "" {
		status = "verified"
	}
	if status != "verified" && status != "corrected" && status != "needs_review" {
		return nil, fmt.Errorf("data_quality_status: unsupported value %q", status)
	}

	return &csvFoodRow{
		Name:                     name,
		Unit:                     unit,
		Category:                 get("category"),
		SourceExternalID:         parseNullableString(get("source_external_id")),
		Amount:                   amount,
		IsCanonical:              isCanonical,
		Calories:                 calories,
		Fat:                      fat,
		Protein:                  protein,
		Carbs:                    carbs,
		Fiber:                    fiber,
		Sugar:                    sugar,
		Sodium:                   sodium,
		Cholesterol:              cholesterol,
		Calcium:                  calcium,
		Iron:                     iron,
		Magnesium:                magnesium,
		Potassium:                potassium,
		Phosphorus:               phosphorus,
		TransFat:                 transFat,
		SaturatedFat:             saturatedFat,
		Water:                    water,
		Omega3:                   omega3,
		Omega6:                   omega6,
		Zinc:                     zinc,
		VitaminC:                 vitaminC,
		GlycemicLoad:             glycemicLoad,
		KcalPerGram:              kcalPerGram,
		BurnRun10KphMinPerGram:   burnRun,
		BurnWalk7KphMinPerGram:   burnWalk,
		BurnCycle15KphMinPerGram: burnCycle,
		BurnSwimCrawlMinPerGram:  burnSwim,
		BurnHikeMinPerGram:       burnHike,
		BurnAerobicsMinPerGram:   burnAerobics,
		NutrientSource:           get("nutrient_source"),
		NutrientSourceRef:        get("nutrient_source_ref"),
		NutrientMatchScore:       matchScore,
		DataQualityStatus:        status,
		DataQualityFlags:         get("data_quality_flags"),
	}, nil
}

func normalizeNumber(s string) string {
	s = strings.TrimSpace(s)
	if s == "" || s == "-" || s == "—" || s == "–" {
		return ""
	}
	s = strings.ReplaceAll(s, ",", ".")
	s = strings.ReplaceAll(s, "٫", ".")
	return strings.TrimSpace(s)
}

func parseRequiredFloat(s string) (float64, error) {
	s = normalizeNumber(s)
	if s == "" {
		return 0, fmt.Errorf("empty value")
	}
	value, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0, err
	}
	if math.IsNaN(value) || math.IsInf(value, 0) || value < 0 {
		return 0, fmt.Errorf("must be a finite non-negative number")
	}
	return value, nil
}

func parseOptionalFloat(s string, defaultVal float64) (float64, error) {
	s = normalizeNumber(s)
	if s == "" {
		return defaultVal, nil
	}
	return parseRequiredFloat(s)
}

func parseNullableFloat(s string) (*float64, error) {
	s = normalizeNumber(s)
	if s == "" {
		return nil, nil
	}
	v, err := parseRequiredFloat(s)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func parseOptionalBool(s string, defaultVal bool) (bool, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return defaultVal, nil
	}
	value, err := strconv.ParseBool(s)
	if err != nil {
		return false, fmt.Errorf("expected true or false")
	}
	return value, nil
}

func parseNullableString(s string) *string {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	return &s
}

func foodExternalID(name, unit string, amount float64) string {
	raw := fmt.Sprintf("%s|%s|%.4f",
		strings.ToLower(strings.TrimSpace(name)),
		strings.ToLower(strings.TrimSpace(unit)),
		amount,
	)
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:16])
}

func mapCSVRowToFood(row *csvFoodRow) *models.Food {
	return &models.Food{
		ExternalID:               foodExternalID(row.Name, row.Unit, row.Amount),
		SourceExternalID:         row.SourceExternalID,
		Name:                     row.Name,
		Category:                 row.Category,
		Unit:                     row.Unit,
		Amount:                   row.Amount,
		IsCanonical:              row.IsCanonical,
		Calories:                 row.Calories,
		Fat:                      row.Fat,
		Protein:                  row.Protein,
		Carbs:                    row.Carbs,
		Fiber:                    row.Fiber,
		Sugar:                    row.Sugar,
		Sodium:                   row.Sodium,
		Cholesterol:              row.Cholesterol,
		Calcium:                  row.Calcium,
		Iron:                     row.Iron,
		Magnesium:                row.Magnesium,
		Potassium:                row.Potassium,
		Phosphorus:               row.Phosphorus,
		TransFat:                 row.TransFat,
		SaturatedFat:             row.SaturatedFat,
		Water:                    row.Water,
		Omega3:                   row.Omega3,
		Omega6:                   row.Omega6,
		Zinc:                     row.Zinc,
		VitaminC:                 row.VitaminC,
		GlycemicLoad:             row.GlycemicLoad,
		KcalPerGram:              row.KcalPerGram,
		BurnRun10KphMinPerGram:   row.BurnRun10KphMinPerGram,
		BurnWalk7KphMinPerGram:   row.BurnWalk7KphMinPerGram,
		BurnCycle15KphMinPerGram: row.BurnCycle15KphMinPerGram,
		BurnSwimCrawlMinPerGram:  row.BurnSwimCrawlMinPerGram,
		BurnHikeMinPerGram:       row.BurnHikeMinPerGram,
		BurnAerobicsMinPerGram:   row.BurnAerobicsMinPerGram,
		NutrientSource:           row.NutrientSource,
		NutrientSourceRef:        row.NutrientSourceRef,
		NutrientMatchScore:       row.NutrientMatchScore,
		DataQualityStatus:        row.DataQualityStatus,
		DataQualityFlags:         row.DataQualityFlags,
	}
}
