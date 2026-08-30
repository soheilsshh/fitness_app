package seed

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// The Persian catalog was originally machine-translated and shipped names that
// were wrong or embarrassing in a gym app: "آدم ربایان" (kidnappers) for
// abductors, "گوساله ها" (baby cows) for calves, "لات" (thug) for lats,
// "مطبوعات نظامی" (military newspapers) for military press, "حلق آویز"
// (lynched) for hanging. It has been re-localized from the English twin by
// scripts/exercise-localization. These tests keep it from regressing.

type catalogExercise struct {
	ID               string   `json:"id"`
	Name             string   `json:"name"`
	Category         string   `json:"category"`
	BodyPart         string   `json:"body_part"`
	Equipment        string   `json:"equipment"`
	MuscleGroup      string   `json:"muscle_group"`
	Target           string   `json:"target"`
	SecondaryMuscles []string `json:"secondary_muscles"`
}

// bannedCatalogTerms are the specific mistranslations that used to ship. Each
// entry is the bad Persian term and what it wrongly meant.
var bannedCatalogTerms = map[string]string{
	"آدم ربا":    "abductors mistranslated as kidnappers",
	"گوساله":     "calves mistranslated as baby cows",
	"مطبوعات":    "press mistranslated as the newspaper press",
	"حلق آویز":   "hanging mistranslated as lynched",
	"واعظ":       "preacher bench mistranslated as a religious preacher",
	"پسوند":      "extension mistranslated as a filename suffix",
	"نشیمنگاه":   "machine seat mistranslated as buttocks",
	"من هالتر":   "\"ez\" mistranslated as the pronoun \"I\"",
	"نوار تله":   "trap bar mistranslated as trap tape",
	"توپ پزشکی":  "medicine ball mistranslated as a medical ball",
	"دستگاه بیضوی": "elliptical mistranslated as oval-shaped",
	"آسیاب استپ": "stepmill mistranslated as a grinding mill",
	"دروغ گفتن":  "\"lying\" mistranslated as telling a lie",
}

func loadCatalog(t *testing.T) []catalogExercise {
	t.Helper()
	path := filepath.Join("..", "..", "data", "exercises-fa", "exercises.fa.json")
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Skipf("catalog not available: %v", err)
	}
	var items []catalogExercise
	if err := json.Unmarshal(raw, &items); err != nil {
		t.Fatalf("catalog is not valid JSON: %v", err)
	}
	if len(items) == 0 {
		t.Fatal("catalog is empty")
	}
	return items
}

func TestPersianCatalogHasNoMistranslatedTerms(t *testing.T) {
	for _, item := range loadCatalog(t) {
		fields := append([]string{
			item.Name, item.Category, item.BodyPart,
			item.Equipment, item.MuscleGroup, item.Target,
		}, item.SecondaryMuscles...)

		for _, field := range fields {
			for banned, why := range bannedCatalogTerms {
				if strings.Contains(field, banned) {
					t.Errorf("exercise %s: %q contains %q (%s)", item.ID, field, banned, why)
				}
			}
		}
	}
}

func TestPersianCatalogNamesAreWellFormed(t *testing.T) {
	seen := map[string]bool{}
	for _, item := range loadCatalog(t) {
		if strings.TrimSpace(item.Name) == "" {
			t.Errorf("exercise %s has an empty name", item.ID)
		}
		if seen[item.ID] {
			t.Errorf("duplicate exercise id %s", item.ID)
		}
		seen[item.ID] = true

		// Untranslated English leaking into a Persian name means a term is
		// missing from the localization dictionary. A few brand-style tokens
		// are intentionally latin.
		name := item.Name
		for _, allowed := range []string{"EZ", "SZ", "JM", "V", "W", "Y", "T"} {
			name = strings.ReplaceAll(name, allowed, "")
		}
		for _, r := range name {
			if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') {
				t.Errorf("exercise %s name %q still contains untranslated latin text", item.ID, item.Name)
				break
			}
		}
	}
}

func TestPersianCatalogTaxonomyIsTranslated(t *testing.T) {
	// Every taxonomy value must be Persian; an English value here means the
	// term is missing from terms.py and would surface raw in the UI filters.
	for _, item := range loadCatalog(t) {
		for label, value := range map[string]string{
			"category":     item.Category,
			"body_part":    item.BodyPart,
			"equipment":    item.Equipment,
			"muscle_group": item.MuscleGroup,
			"target":       item.Target,
		} {
			if value == "" {
				continue
			}
			cleaned := strings.ReplaceAll(value, "EZ", "")
			for _, r := range cleaned {
				if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') {
					t.Errorf("exercise %s %s = %q is not translated", item.ID, label, value)
					break
				}
			}
		}
	}
}
