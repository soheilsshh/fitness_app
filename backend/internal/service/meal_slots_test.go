package service

import "testing"

func TestNormalizeMealSlot(t *testing.T) {
	snack := 0
	cases := []struct {
		name string
		want string
	}{
		{"صبحانه", MealSlotBreakfast},
		{"ناهار", MealSlotLunch},
		{"شام", MealSlotDinner},
		{"میان وعده بین صبحانه و ناهار", MealSlotSnack1},
		{"میانوعده عصر 1", MealSlotSnack2},
		{"وعده قبل از خواب", MealSlotSnack3},
		{"وعده بعد تمرین", MealSlotSnack3}, // capped at snack3
	}
	for _, tc := range cases {
		got := NormalizeMealSlot(tc.name, &snack)
		if got != tc.want {
			t.Fatalf("NormalizeMealSlot(%q)=%q want %q (snack=%d)", tc.name, got, tc.want, snack)
		}
	}
}

func TestNormalizeExerciseCoreName(t *testing.T) {
	a := normalizeExerciseCoreNameSvc("اسکوات دمبل")
	b := normalizeExerciseCoreNameSvc("اسکوات هالتر")
	if a == "" || a != b {
		t.Fatalf("core names should match: %q vs %q", a, b)
	}
	c := normalizeExerciseCoreNameSvc("پرس سینه دمبل")
	if a == c {
		t.Fatalf("unrelated exercises must not share core: %q", a)
	}
}
