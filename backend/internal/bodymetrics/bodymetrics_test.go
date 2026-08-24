package bodymetrics

import (
	"testing"
	"time"
)

func TestAgeFromBirthDate(t *testing.T) {
	now := time.Date(2026, 6, 19, 12, 0, 0, 0, time.UTC)
	birth := time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC)

	age := AgeFromBirthDate(&birth)
	if age == nil {
		t.Fatal("expected age")
	}
	// AgeFromBirthDate uses time.Now(); verify logic with a manual check instead.
	_ = now
	if *age < 20 || *age > 30 {
		t.Fatalf("unexpected age %d", *age)
	}

	if AgeFromBirthDate(nil) != nil {
		t.Fatal("nil birthDate should return nil age")
	}
}

func TestBMI(t *testing.T) {
	weight := 70.0
	height := 175.0
	bmi := BMI(&weight, &height)
	if bmi == nil {
		t.Fatal("expected bmi")
	}
	if *bmi != 22.9 {
		t.Fatalf("expected 22.9, got %v", *bmi)
	}

	if BMI(nil, &height) != nil {
		t.Fatal("nil weight should return nil bmi")
	}
	if BMI(&weight, nil) != nil {
		t.Fatal("nil height should return nil bmi")
	}
}

func TestBMIStatusFromValue(t *testing.T) {
	cases := []struct {
		bmi    float64
		status string
	}{
		{17, BMIStatusUnderweight},
		{22, BMIStatusNormal},
		{27, BMIStatusOverweight},
		{32, BMIStatusObese},
	}
	for _, tc := range cases {
		if got := BMIStatusFromValue(tc.bmi); got != tc.status {
			t.Fatalf("bmi %v: expected %q, got %q", tc.bmi, tc.status, got)
		}
	}
}

func TestBMIStatusFromValues(t *testing.T) {
	if BMIStatusFromValues(nil, nil) != "" {
		t.Fatal("missing inputs should yield empty status")
	}
	weight := 70.0
	height := 175.0
	if BMIStatusFromValues(&weight, &height) != BMIStatusNormal {
		t.Fatal("expected normal status")
	}
}
