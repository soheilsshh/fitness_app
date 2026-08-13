package service

import (
	"strings"
	"sync"
	"unicode"

	"regexp"
)

var (
	mealSlotNoiseRe = regexp.MustCompile(`\s+`)
	exCoreNoiseRe   = regexp.MustCompile(`(?i)\([^)]*\)|v\.?\s*2|pov|version\s*\d+`)
	exCoreSpaceRe   = regexp.MustCompile(`\s+`)
)

// Canonical meal slots for programs (breakfast/lunch/dinner + up to 3 snacks).
const (
	MealSlotBreakfast = "breakfast"
	MealSlotLunch     = "lunch"
	MealSlotDinner    = "dinner"
	MealSlotSnack1    = "snack1"
	MealSlotSnack2    = "snack2"
	MealSlotSnack3    = "snack3"
)

var mealSlotOrder = []string{
	MealSlotBreakfast,
	MealSlotLunch,
	MealSlotDinner,
	MealSlotSnack1,
	MealSlotSnack2,
	MealSlotSnack3,
}

var mealSlotLabels = map[string]string{
	MealSlotBreakfast: "صبحانه",
	MealSlotLunch:     "ناهار",
	MealSlotDinner:    "شام",
	MealSlotSnack1:    "میان‌وعده ۱",
	MealSlotSnack2:    "میان‌وعده ۲",
	MealSlotSnack3:    "میان‌وعده ۳",
}

func MealSlotLabel(slot string) string {
	if label, ok := mealSlotLabels[slot]; ok {
		return label
	}
	return "سایر"
}

func mealSlotRank(slot string) int {
	for i, s := range mealSlotOrder {
		if s == slot {
			return i
		}
	}
	return len(mealSlotOrder)
}

func nextSnackSlot(snackCount *int) string {
	if snackCount == nil {
		return MealSlotSnack1
	}
	if *snackCount >= 3 {
		return MealSlotSnack3
	}
	*snackCount++
	switch *snackCount {
	case 1:
		return MealSlotSnack1
	case 2:
		return MealSlotSnack2
	default:
		return MealSlotSnack3
	}
}

// NormalizeMealSlot maps free-text template meal names (صبحانه/ناهار/…) to canonical slots.
// snackCount tracks how many snack slots were already assigned in the template.
func NormalizeMealSlot(mealName string, snackCount *int) string {
	n := strings.TrimSpace(mealName)
	n = strings.ReplaceAll(n, "‌", " ")
	n = strings.ToLower(n)
	n = mealSlotNoiseRe.ReplaceAllString(n, " ")
	n = strings.TrimSpace(n)

	// Snacks first — names like "میان وعده بین صبحانه و ناهار" must not become lunch.
	if strings.Contains(n, "میان") ||
		strings.Contains(n, "قبل از خواب") ||
		strings.Contains(n, "بعد تمرین") ||
		strings.Contains(n, "پس از تمرین") ||
		strings.Contains(n, "قبل تمرین") ||
		strings.Contains(n, "snack") {
		return nextSnackSlot(snackCount)
	}
	if strings.Contains(n, "صبحانه") || strings.Contains(n, "breakfast") {
		return MealSlotBreakfast
	}
	if strings.Contains(n, "ناهار") || strings.Contains(n, "نهار") || strings.Contains(n, "lunch") {
		return MealSlotLunch
	}
	if strings.Contains(n, "شام") || strings.Contains(n, "dinner") {
		return MealSlotDinner
	}
	if n == "" {
		return nextSnackSlot(snackCount)
	}
	return nextSnackSlot(snackCount)
}

func IsValidMealSlot(slot string) bool {
	_, ok := mealSlotLabels[slot]
	return ok
}

// --- exercise core-name helpers (shared with seed package conceptually) ---

var exerciseEquipmentTokensSvc = []string{
	"با هالتر", "با دمبل", "با کابل", "با کش", "با اسمیت", "با دستگاه",
	"هالتر", "دمبل", "کابل", "کش", "اسمیت", "دستگاه",
	"barbell", "dumbbell", "cable", "smith", "machine", "kettlebell",
}

func normalizeExerciseCoreNameSvc(name string) string {
	n := strings.TrimSpace(strings.ToLower(name))
	if n == "" {
		return ""
	}
	n = strings.ReplaceAll(n, "‌", " ")
	n = exCoreNoiseRe.ReplaceAllString(n, " ")
	for _, tok := range exerciseEquipmentTokensSvc {
		n = strings.ReplaceAll(n, strings.ToLower(tok), " ")
	}
	n = strings.Map(func(r rune) rune {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || unicode.IsSpace(r) {
			return r
		}
		return ' '
	}, n)
	return exCoreSpaceRe.ReplaceAllString(strings.TrimSpace(n), " ")
}

type mediaDonorPaths struct {
	GifPath   string
	ImagePath string
}

var (
	mediaDonorOnce   sync.Once
	mediaDonorByCore map[string]mediaDonorPaths
)

func resetMediaDonorCache() {
	mediaDonorOnce = sync.Once{}
	mediaDonorByCore = nil
}
