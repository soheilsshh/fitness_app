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

func TestNormalizeMealSlot_fiveMealDay(t *testing.T) {
	snack := 0
	got := []string{
		NormalizeMealSlot("صبحانه", &snack),
		NormalizeMealSlot("میان وعده صبح", &snack),
		NormalizeMealSlot("ناهار", &snack),
		NormalizeMealSlot("میان وعده عصر", &snack),
		NormalizeMealSlot("شام", &snack),
	}
	want := []string{MealSlotBreakfast, MealSlotSnack1, MealSlotLunch, MealSlotSnack2, MealSlotDinner}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("meal %d: got %q want %q (all=%v)", i, got[i], want[i], got)
		}
	}
}

func TestMealSlotAssigner_reusesSlotForSameNotes(t *testing.T) {
	a := &mealSlotAssigner{}
	first := a.slotForNotes("میان وعده صبح")
	second := a.slotForNotes("میان وعده صبح")
	lunch := a.slotForNotes("ناهار")
	if first != MealSlotSnack1 || second != MealSlotSnack1 {
		t.Fatalf("snack rows should share snack1, got %q then %q", first, second)
	}
	if lunch != MealSlotLunch {
		t.Fatalf("lunch=%q", lunch)
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
