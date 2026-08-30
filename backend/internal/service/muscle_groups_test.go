package service

import "testing"

func TestClassifyMuscleGroupFromCatalogTarget(t *testing.T) {
	cases := map[string]string{
		"سینه":              MuscleGroupChest,
		"زیربغل":            MuscleGroupBack,
		"سرشانه":            MuscleGroupShoulders,
		"جلو بازو":          MuscleGroupBiceps,
		"پشت بازو":          MuscleGroupTriceps,
		"چهارسر ران":        MuscleGroupQuads,
		"همسترینگ":          MuscleGroupHamstrings,
		"سرینی":             MuscleGroupGlutes,
		"ساق پا":            MuscleGroupCalves,
		"شکم":               MuscleGroupAbs,
		"کول":               MuscleGroupTraps,
		"دورکننده‌های ران":   MuscleGroupAbductors,
		"نزدیک‌کننده‌های ران": MuscleGroupAdductors,
		"دستگاه قلبی-عروقی": MuscleGroupCardio,
	}
	for target, want := range cases {
		// A misleading name must not override an authoritative catalog target.
		if got := ClassifyMuscleGroup("یک نام بی‌ربط", target); got != want {
			t.Errorf("ClassifyMuscleGroup(_, %q) = %q, want %q", target, got, want)
		}
	}
}

func TestClassifyMuscleGroupFromName(t *testing.T) {
	cases := []struct {
		name string
		want string
	}{
		// The prefix traps that a naive "پشت" rule gets wrong.
		{"پشت بازو سیم کش ایستاده", MuscleGroupTriceps},
		{"پشت بازو دمبل جفت چکشی خوابیده", MuscleGroupTriceps},
		{"پشت پا دستگاه خوابیده", MuscleGroupHamstrings},
		{"زیر بغل جفت با دمبل نشسته", MuscleGroupBack},

		// "مچ برعکس" is a grip, not a forearm movement.
		{"زیر بغل قایقی مچ عکس", MuscleGroupBack},
		{"سرشانه نشر از جلو هالتر مچ برعکس", MuscleGroupShoulders},
		{"حرکت پرس سینه با کش مچ برعکس روی زمین", MuscleGroupChest},
		{"داخل ساعد سیم کش نشسته", MuscleGroupForearms},

		// A plank names the forearm it rests on but trains the core.
		{"پلانک ساید ثابت", MuscleGroupAbs},
		{"چرخشی T روی ساعد", MuscleGroupAbs},

		// "چکشی" is a grip shared by several muscles.
		{"جلو بازو دمبل چکشی تناوبی", MuscleGroupBiceps},
		{"باترفلای دمبل چکشی", MuscleGroupChest},

		// Ordinary cases.
		{"پرس سینه دمبل جفت دست", MuscleGroupChest},
		{"پرس سرشانه دمبل نشسته", MuscleGroupShoulders},
		{"گوبلت اسکوات با دمبل", MuscleGroupQuads},
		{"ددلیفت رومانیایی با دمبل", MuscleGroupHamstrings},
		{"حرکت پل باسن روی کتف", MuscleGroupGlutes},
		{"ساق پا دستگاه نشسته", MuscleGroupCalves},
		{"شراگز دمبل ایستاده", MuscleGroupTraps},
		{"بیرون پا با سیم کش", MuscleGroupAbductors},
		{"داخل پا خوابیده به پهلو", MuscleGroupAdductors},
		{"حرکت کرانچ پا 90 درجه ثابت", MuscleGroupAbs},

		// Never-recordable entries.
		{"گرم کردن", MuscleGroupWarmup},
		{"سرد کردن", MuscleGroupWarmup},
		{"دوچرخه ثابت", MuscleGroupCardio},
		{"تردمیل", MuscleGroupCardio},

		// Compounds span two muscles, so they get no single-muscle record.
		{"ترکیب اسکوات با جلو بازو دمبل چکشی", MuscleGroupFullbody},
		{"برپی (بورپی)", MuscleGroupFullbody},

		// English, for AI-generated programs that answer in English.
		{"Barbell Bench Press", MuscleGroupChest},
		{"Bodyweight Squat", MuscleGroupQuads},
		{"Plank Hold", MuscleGroupAbs},
		{"Pull-up", MuscleGroupBack},
		{"Dumbbell Biceps Curl", MuscleGroupBiceps},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := ClassifyMuscleGroup(tc.name, ""); got != tc.want {
				t.Fatalf("ClassifyMuscleGroup(%q, \"\") = %q, want %q", tc.name, got, tc.want)
			}
		})
	}
}

func TestClassifyMuscleGroupEmpty(t *testing.T) {
	if got := ClassifyMuscleGroup("", ""); got != "" {
		t.Errorf("empty input should not classify, got %q", got)
	}
	if got := ClassifyMuscleGroup("   ", ""); got != "" {
		t.Errorf("blank input should not classify, got %q", got)
	}
}

func TestMuscleGroupCatalogIsWellFormed(t *testing.T) {
	seen := map[string]bool{}
	for _, g := range MuscleGroupCatalog {
		if seen[g.Code] {
			t.Errorf("duplicate muscle group code %q", g.Code)
		}
		seen[g.Code] = true
		if g.Label == "" || g.Region == "" {
			t.Errorf("group %q is missing a Persian label or region", g.Code)
		}
		if MuscleGroupLabel(g.Code) != g.Label {
			t.Errorf("MuscleGroupLabel(%q) disagrees with the catalog", g.Code)
		}
	}

	// Warm-ups and steady-state cardio are logged but never ranked.
	for _, code := range []string{MuscleGroupWarmup, MuscleGroupCardio} {
		if IsRecordableMuscleGroup(code) {
			t.Errorf("%q must not be recordable", code)
		}
	}
	for _, code := range []string{MuscleGroupChest, MuscleGroupQuads, MuscleGroupAbs} {
		if !IsRecordableMuscleGroup(code) {
			t.Errorf("%q must be recordable", code)
		}
	}
	if IsRecordableMuscleGroup("not-a-group") {
		t.Error("unknown group must not be recordable")
	}
}

func TestEveryCatalogTargetMapsToAKnownGroup(t *testing.T) {
	for target, group := range catalogTargetToGroup {
		if MuscleGroupLabel(group) == "" {
			t.Errorf("catalog target %q maps to unknown group %q", target, group)
		}
	}
	for _, rule := range muscleGroupRules {
		if MuscleGroupLabel(rule.group) == "" {
			t.Errorf("classifier rule references unknown group %q", rule.group)
		}
		for _, hint := range rule.hints {
			if hint == "" {
				t.Errorf("group %q has an empty hint, which would match everything", rule.group)
			}
		}
	}
}
