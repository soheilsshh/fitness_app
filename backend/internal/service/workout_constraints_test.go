package service

import (
	"strings"
	"testing"
)

func TestBuildWorkoutConstraintsContext_IncludesWizardProfile(t *testing.T) {
	got := buildWorkoutConstraintsContext(WorkoutConstraints{
		Goal:                "چربی‌سوزی",
		DaysPerWeek:         4,
		SessionMinutes:      45,
		ExperienceLevel:     "متوسط",
		PhysicalLimitations: []string{"زانو"},
		LimitationNote:      "اسکوات عمیق درد دارد",
		VoiceNotes:          "زانوم اذیته",
	})
	if got == "" {
		t.Fatal("expected prompt context")
	}
	for _, want := range []string{"چربی‌سوزی", "4 روز", "زانو", "ارزیابی پزشکی", "زانوم اذیته", "اسکوات"} {
		if !strings.Contains(got, want) {
			t.Fatalf("missing %q in:\n%s", want, got)
		}
	}
}

func TestBuildWorkoutConstraintsContext_EmptyStaysEmpty(t *testing.T) {
	if got := buildWorkoutConstraintsContext(WorkoutConstraints{}); got != "" {
		t.Fatalf("empty constraints should omit extra prompt, got %q", got)
	}
}
