package service

import (
	"testing"
	"time"
)

func TestDetectMetricKind(t *testing.T) {
	cases := []struct {
		name            string
		exercise        string
		equipment       string
		hasExternalLoad bool
		want            string
	}{
		{"plank is a hold", "پلانک زانو زده", "وزن بدن", false, MetricKindHold},
		{"english plank is a hold", "kneeling plank", "body weight", false, MetricKindHold},
		{"weighted plank is still a hold", "پلانک با وزنه", "با وزنه", true, MetricKindHold},
		{"bodyweight push-up counts reps", "شنا دست جمع", "وزن بدن", false, MetricKindReps},
		{"pull-up with no load counts reps", "بارفیکس", "", false, MetricKindReps},
		{"weighted pull-up is a weight PR", "بارفیکس با وزنه", "با وزنه", true, MetricKindWeight},
		{"barbell press with load is a weight PR", "پرس سینه با هالتر", "هالتر", true, MetricKindWeight},
		{"assisted equipment counts reps", "بارفیکس با کمک دستگاه", "با کمک دستگاه", false, MetricKindReps},
		{"unknown movement without load falls back to reps", "حرکت ابداعی مربی", "", false, MetricKindReps},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := DetectMetricKind(tc.exercise, tc.equipment, tc.hasExternalLoad)
			if got != tc.want {
				t.Fatalf("DetectMetricKind(%q, %q, %v) = %q, want %q",
					tc.exercise, tc.equipment, tc.hasExternalLoad, got, tc.want)
			}
		})
	}
}

func TestBuildSetLogsKeepsBodyweightEffort(t *testing.T) {
	now := time.Now()
	inputs := []LogSetInput{
		{ExerciseName: "شنا", Reps: 30, Equipment: "وزن بدن"},
		{ExerciseName: "پلانک", HoldSeconds: 90, Equipment: "وزن بدن"},
		{ExerciseName: "پرس سینه با هالتر", WeightKg: 60, Reps: 8, Equipment: "هالتر"},
		{ExerciseName: "بارفیکس با وزنه", WeightKg: 10, Reps: 6, Equipment: "با وزنه"},
		{ExerciseName: "", Reps: 20},         // no name — dropped
		{ExerciseName: "هیچ تلاشی", Reps: 0}, // no effort at all — dropped
	}

	logs := buildSetLogs(1, 2, 3, now, 78.5, inputs)
	if len(logs) != 4 {
		t.Fatalf("expected 4 kept sets, got %d", len(logs))
	}

	if logs[0].MetricKind != MetricKindReps || logs[0].Reps != 30 {
		t.Errorf("bodyweight push-up set: got kind=%q reps=%d", logs[0].MetricKind, logs[0].Reps)
	}
	if logs[1].MetricKind != MetricKindHold || logs[1].HoldSeconds != 90 {
		t.Errorf("plank set: got kind=%q hold=%d", logs[1].MetricKind, logs[1].HoldSeconds)
	}
	if logs[2].MetricKind != MetricKindWeight || logs[2].WeightKg != 60 {
		t.Errorf("barbell set: got kind=%q weight=%v", logs[2].MetricKind, logs[2].WeightKg)
	}
	if logs[3].MetricKind != MetricKindWeight {
		t.Errorf("weighted pull-up: got kind=%q, want weight", logs[3].MetricKind)
	}
	for i := range logs {
		if logs[i].BodyweightKg != 78.5 {
			t.Errorf("set %d: bodyweight snapshot = %v, want 78.5", i, logs[i].BodyweightKg)
		}
	}
}

func TestBuildSetLogsFallsBackWhenMetricHasNoValue(t *testing.T) {
	// The client says "weight" but the user only entered reps: keep the set as
	// a rep record rather than dropping it, which is the old broken behaviour.
	logs := buildSetLogs(1, 2, 3, time.Now(), 0, []LogSetInput{
		{ExerciseName: "شنا", MetricKind: MetricKindWeight, Reps: 25},
		{ExerciseName: "پلانک", MetricKind: MetricKindHold, WeightKg: 20},
	})
	if len(logs) != 2 {
		t.Fatalf("expected both sets kept, got %d", len(logs))
	}
	if logs[0].MetricKind != MetricKindReps {
		t.Errorf("expected fallback to reps, got %q", logs[0].MetricKind)
	}
	if logs[1].MetricKind != MetricKindWeight {
		t.Errorf("expected fallback to weight, got %q", logs[1].MetricKind)
	}
}

func TestSetMetricValue(t *testing.T) {
	logs := buildSetLogs(1, 2, 3, time.Now(), 0, []LogSetInput{
		{ExerciseName: "شنا", Reps: 42},
		{ExerciseName: "پلانک", HoldSeconds: 120},
		{ExerciseName: "پرس سینه با هالتر", WeightKg: 80, Reps: 5, Equipment: "هالتر"},
	})
	want := []float64{42, 120, 80}
	for i, w := range want {
		if got := setMetricValue(logs[i]); got != w {
			t.Errorf("setMetricValue(%q) = %v, want %v", logs[i].ExerciseName, got, w)
		}
	}
}

func TestPRColumnForKind(t *testing.T) {
	cases := map[string]string{
		MetricKindWeight: "weight_kg",
		MetricKindReps:   "reps",
		MetricKindHold:   "hold_seconds",
		"":               "weight_kg",
	}
	for kind, want := range cases {
		if got := prColumnForKind(kind); got != want {
			t.Errorf("prColumnForKind(%q) = %q, want %q", kind, got, want)
		}
	}
}

func TestBodyweightMilestonesFor(t *testing.T) {
	cases := []struct {
		name     string
		exercise string
		kind     string
		value    int
		want     []string
	}{
		{"25 push-ups earns bronze only", "شنا", MetricKindReps, 25, []string{"bw_pushup_25"}},
		{"a 60-rep set earns bronze and silver", "شنا دست جمع", MetricKindReps, 60,
			[]string{"bw_pushup_25", "bw_pushup_50"}},
		{"under the first tier earns nothing", "بارفیکس", MetricKindReps, 4, nil},
		{"10 pull-ups earns two tiers", "بارفیکس", MetricKindReps, 10,
			[]string{"bw_pullup_5", "bw_pullup_10"}},
		{"a 3-minute plank earns two tiers", "پلانک", MetricKindHold, 180,
			[]string{"bw_plank_60", "bw_plank_180"}},
		{"reps on a hold family earn nothing", "پلانک", MetricKindReps, 300, nil},
		{"a weight PR is not a calisthenics milestone", "پرس سینه", MetricKindWeight, 200, nil},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := bodyweightMilestonesFor(tc.exercise, tc.kind, tc.value)
			if len(got) != len(tc.want) {
				t.Fatalf("got %v, want %v", got, tc.want)
			}
			for i := range got {
				if got[i] != tc.want[i] {
					t.Fatalf("got %v, want %v", got, tc.want)
				}
			}
		})
	}
}

func TestBodyweightMilestoneRulesAreWellFormed(t *testing.T) {
	rules := bodyweightMilestoneRules()
	if len(rules) == 0 {
		t.Fatal("expected calisthenics rules to be defined")
	}
	seen := map[string]bool{}
	for _, rule := range rules {
		if seen[rule.Code] {
			t.Errorf("duplicate rule code %q", rule.Code)
		}
		seen[rule.Code] = true
		if rule.Title == "" || rule.Description == "" {
			t.Errorf("rule %q is missing a Persian title/description", rule.Code)
		}
		if rule.Points <= 0 {
			t.Errorf("rule %q has non-positive points", rule.Code)
		}
		if rule.Repeatable {
			t.Errorf("rule %q must be one-time", rule.Code)
		}
	}
}

func TestDefaultAchievementRulesIncludeCalisthenics(t *testing.T) {
	codes := map[string]bool{}
	for _, rule := range defaultAchievementRules() {
		if codes[rule.Code] {
			t.Fatalf("duplicate achievement rule code %q", rule.Code)
		}
		codes[rule.Code] = true
	}
	for _, want := range []string{"bw_pushup_25", "bw_pullup_20", "bw_plank_300", "bw_hold_30"} {
		if !codes[want] {
			t.Errorf("seeded rules are missing %q", want)
		}
	}
}

func TestFormatPersonalRecord(t *testing.T) {
	cases := []struct {
		name string
		req  PersonalRecordShareRequest
		want string
	}{
		{"weight record with reps", PersonalRecordShareRequest{MetricKind: MetricKindWeight, WeightKg: 82.5, Reps: 5},
			"پرس سینه با 82.5 کیلوگرم × 5 تکرار"},
		{"rep record quotes no kilos", PersonalRecordShareRequest{MetricKind: MetricKindReps, Reps: 30},
			"پرس سینه با 30 تکرار"},
		{"hold record in whole minutes", PersonalRecordShareRequest{MetricKind: MetricKindHold, HoldSeconds: 180},
			"پرس سینه با 3 دقیقه نگه‌داشتن"},
		{"hold record in seconds", PersonalRecordShareRequest{MetricKind: MetricKindHold, HoldSeconds: 95},
			"پرس سینه با 95 ثانیه نگه‌داشتن"},
		{"missing kind with no weight reads as reps", PersonalRecordShareRequest{Reps: 12},
			"پرس سینه با 12 تکرار"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := formatPersonalRecord("پرس سینه", tc.req); got != tc.want {
				t.Fatalf("got %q, want %q", got, tc.want)
			}
		})
	}
}
