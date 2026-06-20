package bodymetrics

import (
	"math"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
)

const (
	BMIStatusUnderweight = "underweight"
	BMIStatusNormal      = "normal"
	BMIStatusOverweight  = "overweight"
	BMIStatusObese       = "obese"
)

// Derived holds computed age and BMI fields for API responses.
type Derived struct {
	Age       *int
	BMI       *float64
	BMIStatus string
}

// FromUser computes age, BMI, and BMI category from a user's profile fields.
func FromUser(user *models.User) Derived {
	if user == nil {
		return Derived{}
	}
	return Derived{
		Age:       AgeFromBirthDate(user.BirthDate),
		BMI:       BMI(user.WeightKg, user.HeightCm),
		BMIStatus: BMIStatusFromValues(user.WeightKg, user.HeightCm),
	}
}

// AgeFromBirthDate returns full years between birthDate and now.
func AgeFromBirthDate(birthDate *time.Time) *int {
	if birthDate == nil {
		return nil
	}
	now := time.Now()
	age := now.Year() - birthDate.Year()
	if now.Month() < birthDate.Month() ||
		(now.Month() == birthDate.Month() && now.Day() < birthDate.Day()) {
		age--
	}
	if age < 0 {
		return nil
	}
	return &age
}

// BMI returns standard BMI (kg/m²) rounded to one decimal, or nil when inputs are invalid.
func BMI(weightKg, heightCm *float64) *float64 {
	if weightKg == nil || heightCm == nil || *weightKg <= 0 || *heightCm <= 0 {
		return nil
	}
	heightM := *heightCm / 100
	raw := *weightKg / (heightM * heightM)
	rounded := math.Round(raw*10) / 10
	return &rounded
}

// BMIStatusFromValue maps a BMI value to a WHO adult category id.
func BMIStatusFromValue(bmi float64) string {
	switch {
	case bmi < 18.5:
		return BMIStatusUnderweight
	case bmi < 25:
		return BMIStatusNormal
	case bmi < 30:
		return BMIStatusOverweight
	default:
		return BMIStatusObese
	}
}

// BMIStatusFromValues derives BMI status from weight and height, or empty when BMI cannot be computed.
func BMIStatusFromValues(weightKg, heightCm *float64) string {
	bmi := BMI(weightKg, heightCm)
	if bmi == nil {
		return ""
	}
	return BMIStatusFromValue(*bmi)
}
