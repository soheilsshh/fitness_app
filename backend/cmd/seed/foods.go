package main

import (
	"context"
	"crypto/sha256"
	"encoding/csv"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
	"gorm.io/gorm"
)

type csvFoodRow struct {
	Name, Unit string
	Amount     float64
	Calories   float64
	Fat        float64
	Protein    float64
	Carbs      float64
	Fiber      *float64
	Sugar      *float64
}

func importFoodsCSV(db *gorm.DB, filePath string) error {
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

	repo := repository.NewFoodRepository(db)
	ctx := context.Background()
	created, updated, skipped := 0, 0, 0
	lineNum := 1

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		lineNum++
		if err != nil {
			log.Printf("line %d: read error: %v", lineNum, err)
			skipped++
			continue
		}

		row, err := parseCSVFoodRow(record, colIndex)
		if err != nil {
			log.Printf("line %d: skip: %v", lineNum, err)
			skipped++
			continue
		}

		food := mapCSVRowToFood(row)
		_, findErr := repo.FindByExternalID(ctx, food.ExternalID)
		isUpdate := findErr == nil

		if err := repo.UpsertByExternalID(ctx, food); err != nil {
			log.Printf("line %d: upsert failed: %v", lineNum, err)
			skipped++
			continue
		}
		if isUpdate {
			updated++
		} else {
			created++
		}
	}

	log.Printf("food seed complete: created=%d updated=%d skipped=%d", created, updated, skipped)
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
		case "amount":
			idx["amount"] = i
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

	return &csvFoodRow{
		Name:     name,
		Unit:     unit,
		Amount:   amount,
		Calories: calories,
		Fat:      fat,
		Protein:  protein,
		Carbs:    carbs,
		Fiber:    parseNullableFloat(get("fiber")),
		Sugar:    parseNullableFloat(get("sugar")),
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
	return strconv.ParseFloat(s, 64)
}

func parseOptionalFloat(s string, defaultVal float64) (float64, error) {
	s = normalizeNumber(s)
	if s == "" {
		return defaultVal, nil
	}
	return strconv.ParseFloat(s, 64)
}

func parseNullableFloat(s string) *float64 {
	s = normalizeNumber(s)
	if s == "" {
		return nil
	}
	v, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return nil
	}
	return &v
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
		ExternalID: foodExternalID(row.Name, row.Unit, row.Amount),
		Name:       row.Name,
		Unit:       row.Unit,
		Amount:     row.Amount,
		Calories:   row.Calories,
		Fat:        row.Fat,
		Protein:    row.Protein,
		Carbs:      row.Carbs,
		Fiber:      row.Fiber,
		Sugar:      row.Sugar,
	}
}
