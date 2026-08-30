package seed

import (
	"encoding/csv"
	"io"
	"math"
	"os"
	"path/filepath"
	"testing"
)

func TestAuditedFoodDataset(t *testing.T) {
	file, err := os.Open(filepath.Join("..", "..", "data", DefaultFoodsFile))
	if err != nil {
		t.Fatal(err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.TrimLeadingSpace = true
	reader.LazyQuotes = true
	header, err := reader.Read()
	if err != nil {
		t.Fatal(err)
	}
	columns := mapCSVFoodHeader(header)

	var rows []*csvFoodRow
	statusCounts := map[string]int{}
	canonicalCount := 0
	for line := 2; ; line++ {
		record, readErr := reader.Read()
		if readErr == io.EOF {
			break
		}
		if readErr != nil {
			t.Fatalf("line %d: %v", line, readErr)
		}
		row, parseErr := parseCSVFoodRow(record, columns)
		if parseErr != nil {
			t.Fatalf("line %d: %v", line, parseErr)
		}
		rows = append(rows, row)
		statusCounts[row.DataQualityStatus]++
		if row.IsCanonical {
			canonicalCount++
			if row.KcalPerGram == nil {
				t.Fatalf("line %d (%s): canonical row has no kcal_per_g", line, row.Name)
			}
			want := row.Calories / 100
			if math.Abs(*row.KcalPerGram-want) > 0.000001 {
				t.Fatalf("line %d (%s): kcal_per_g=%v, want %v", line, row.Name, *row.KcalPerGram, want)
			}
		}
	}

	if err := validateCSVFoodRows(rows); err != nil {
		t.Fatal(err)
	}
	if len(rows) != 7351 {
		t.Fatalf("row count=%d, want 7351", len(rows))
	}
	if canonicalCount != 3353 {
		t.Fatalf("canonical count=%d, want 3353", canonicalCount)
	}
	if statusCounts["needs_review"] != 87 {
		t.Fatalf("needs_review count=%d, want 87", statusCounts["needs_review"])
	}
	if statusCounts["corrected"] != 16 {
		t.Fatalf("corrected count=%d, want 16", statusCounts["corrected"])
	}
}
