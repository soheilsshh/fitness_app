package seed

import "testing"

func tmpl(id int, title string, days ...crulExerciseDay) crulExerciseTemplate {
	return crulExerciseTemplate{ID: id, Title: title, Days: days}
}

func day(number int, actionIDs ...int) crulExerciseDay {
	moves := make([]crulExerciseMove, 0, len(actionIDs))
	for _, id := range actionIDs {
		moves = append(moves, crulExerciseMove{
			ActionID: id,
			Sets: []crulExerciseSet{
				{Type: "تکرار", Count: "12"},
				{Type: "تکرار", Count: "10"},
			},
		})
	}
	return crulExerciseDay{
		DayNumber: number,
		Data:      []crulExerciseBlock{{ExerciseSystemID: 3, MovementList: moves}},
	}
}

func TestDedupeWorkoutTemplatesKeepsTheOriginal(t *testing.T) {
	// The copy carries a higher source id and the "جدید *" title, and in the
	// real dump also the default metadata; the original must survive.
	original := tmpl(51, "افزایشی باشگاه-۳ جلسه- مرد نیمه مبتدی- نوع ۱", day(1, 10, 11), day(2, 20, 21))
	copyOf := tmpl(290, "افزایشی باشگاه-۳ جلسه- مرد نیمه مبتدی- نوع ۱ جدید *", day(1, 10, 11), day(2, 20, 21))
	other := tmpl(60, "برنامه متفاوت", day(1, 30, 31))

	kept, dropped := dedupeWorkoutTemplates([]crulExerciseTemplate{copyOf, other, original})
	if dropped != 1 {
		t.Fatalf("dropped = %d, want 1", dropped)
	}
	if len(kept) != 2 {
		t.Fatalf("kept %d templates, want 2", len(kept))
	}
	ids := map[int]bool{}
	for _, k := range kept {
		ids[k.ID] = true
	}
	if !ids[51] || !ids[60] || ids[290] {
		t.Fatalf("wrong survivors: %v", ids)
	}
}

func TestDedupeIgnoresNullVersusEmptySetCount(t *testing.T) {
	// The dump stores the same program with `count: null` in one copy and
	// `count: ""` in the next; that must not read as a difference.
	withEmpty := crulExerciseTemplate{ID: 145, Title: "نوع 4", Days: []crulExerciseDay{{
		DayNumber: 1,
		Data: []crulExerciseBlock{{ExerciseSystemID: 3, MovementList: []crulExerciseMove{{
			ActionID: 7, Sets: []crulExerciseSet{{Type: "ماکسیمم توان", Count: ""}},
		}}}},
	}}}
	withNull := withEmpty
	withNull.ID = 294
	withNull.Title = "نوع 5"

	_, dropped := dedupeWorkoutTemplates([]crulExerciseTemplate{withEmpty, withNull})
	if dropped != 1 {
		t.Fatalf("dropped = %d, want 1 (null and empty set counts are the same)", dropped)
	}
}

func TestDedupeIgnoresBlockNesting(t *testing.T) {
	// One copy groups two movements into a single block, the other splits them.
	// The prescribed work is identical, so it is the same program.
	grouped := crulExerciseTemplate{ID: 73, Days: []crulExerciseDay{{
		DayNumber: 1,
		Data: []crulExerciseBlock{{ExerciseSystemID: 3, MovementList: []crulExerciseMove{
			{ActionID: 1}, {ActionID: 2},
		}}},
	}}}
	split := crulExerciseTemplate{ID: 318, Days: []crulExerciseDay{{
		DayNumber: 1,
		Data: []crulExerciseBlock{
			{ExerciseSystemID: 3, MovementList: []crulExerciseMove{{ActionID: 1}}},
			{ExerciseSystemID: 3, MovementList: []crulExerciseMove{{ActionID: 2}}},
		},
	}}}
	if _, dropped := dedupeWorkoutTemplates([]crulExerciseTemplate{grouped, split}); dropped != 1 {
		t.Fatalf("dropped = %d, want 1", dropped)
	}
}

func TestDedupeKeepsGenuinelyDifferentPrograms(t *testing.T) {
	cases := []struct {
		name string
		a, b crulExerciseTemplate
	}{
		{"different movements", tmpl(1, "a", day(1, 10, 11)), tmpl(2, "b", day(1, 10, 12))},
		{"different movement order", tmpl(1, "a", day(1, 10, 11)), tmpl(2, "b", day(1, 11, 10))},
		{"different day count", tmpl(1, "a", day(1, 10)), tmpl(2, "b", day(1, 10), day(2, 11))},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			kept, dropped := dedupeWorkoutTemplates([]crulExerciseTemplate{tc.a, tc.b})
			if dropped != 0 || len(kept) != 2 {
				t.Fatalf("dropped %d, kept %d — both programs must survive", dropped, len(kept))
			}
		})
	}
}

func TestDedupeDiffersOnSetPrescription(t *testing.T) {
	// Same movements, different reps: a real programming variant, not a copy.
	a := crulExerciseTemplate{ID: 1, Days: []crulExerciseDay{{DayNumber: 1,
		Data: []crulExerciseBlock{{MovementList: []crulExerciseMove{{ActionID: 5,
			Sets: []crulExerciseSet{{Type: "تکرار", Count: "12"}}}}}}}}}
	b := crulExerciseTemplate{ID: 2, Days: []crulExerciseDay{{DayNumber: 1,
		Data: []crulExerciseBlock{{MovementList: []crulExerciseMove{{ActionID: 5,
			Sets: []crulExerciseSet{{Type: "تکرار", Count: "8"}}}}}}}}}
	if _, dropped := dedupeWorkoutTemplates([]crulExerciseTemplate{a, b}); dropped != 0 {
		t.Fatal("templates differing in reps must both be kept")
	}
}

func TestDedupeLeavesEmptyTemplatesForTheJunkFilter(t *testing.T) {
	// Templates with no days are rejected by isPlaceholderTemplateTitle/day
	// count; signing them would collapse them all into one bogus group.
	empty1 := crulExerciseTemplate{ID: 1676, Title: "تست"}
	empty2 := crulExerciseTemplate{ID: 1677, Title: "تست"}
	kept, dropped := dedupeWorkoutTemplates([]crulExerciseTemplate{empty1, empty2})
	if dropped != 0 || len(kept) != 2 {
		t.Fatalf("dropped %d, kept %d — empty templates must pass through", dropped, len(kept))
	}
}

func TestCleanMovementTitle(t *testing.T) {
	cases := []struct{ in, want string }{
		{"اسکوات دمبل*", "اسکوات دمبل"},
		{"جلو بازو فیگوری ایستاده ++", "جلو بازو فیگوری ایستاده"},
		{"ددلیفت رومانیایی جفت دمبل به همراه زیر بغل جفت دمبل خم **", "ددلیفت رومانیایی جفت دمبل به همراه زیر بغل جفت دمبل خم"},
		{"باترفلای دستگاه+", "باترفلای دستگاه"},
		{"جلو  پا دستگاه  پنجه رو به بالا", "جلو پا دستگاه پنجه رو به بالا"},
		{"  پلانک ساید ثابت  ", "پلانک ساید ثابت"},
		{"لاگز پرشی با لمس سرپنجه پا", "لانگز پرشی با لمس سرپنجه پا"},
		{"نشر از جلو دمبل تناوبی معکوس نسشته", "نشر از جلو دمبل تناوبی معکوس نشسته"},
		{"پرس سینه دمبل جفت دست", "پرس سینه دمبل جفت دست"},
		{"", ""},
	}
	for _, tc := range cases {
		if got := cleanMovementTitle(tc.in); got != tc.want {
			t.Errorf("cleanMovementTitle(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}
}
