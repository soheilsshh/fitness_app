package models

import (
	"encoding/json"
	"strings"
)

const (
	GenderMale   = "male"
	GenderFemale = "female"

	BodyConditionSlim       = "slim"
	BodyConditionAverage    = "average"
	BodyConditionOverweight = "overweight"
	BodyConditionAthletic   = "athletic"
	BodyConditionMuscular   = "muscular"

	PhotoTypeFront = "front"
	PhotoTypeRight = "right"
	PhotoTypeBack  = "back"
	PhotoTypeLeft  = "left"
)

var (
	ValidGenders = []string{GenderMale, GenderFemale}
	ValidBodyConditions = []string{
		BodyConditionSlim,
		BodyConditionAverage,
		BodyConditionOverweight,
		BodyConditionAthletic,
		BodyConditionMuscular,
	}
	ValidGoalTags = []string{
		"weight_loss",
		"muscle_gain",
		"fitness",
		"endurance",
		"flexibility",
		"rehabilitation",
	}
	RequiredBodyPhotoTypes = []string{
		PhotoTypeFront,
		PhotoTypeRight,
		PhotoTypeBack,
		PhotoTypeLeft,
	}
)

func (u *User) GetGoals() []string {
	if u == nil || strings.TrimSpace(u.Goals) == "" {
		return nil
	}
	var goals []string
	if err := json.Unmarshal([]byte(u.Goals), &goals); err != nil {
		return nil
	}
	return goals
}

func (u *User) SetGoals(goals []string) error {
	if len(goals) == 0 {
		u.Goals = "[]"
		return nil
	}
	b, err := json.Marshal(goals)
	if err != nil {
		return err
	}
	u.Goals = string(b)
	return nil
}

// IsStudentProfileComplete reports whether a student has filled all required onboarding fields.
// Non-student roles are always considered complete.
func IsStudentProfileComplete(user *User, initialPhotos []UserPhoto) bool {
	if user == nil || user.Role != RoleStudent {
		return true
	}

	if user.BirthDate == nil {
		return false
	}
	if len(strings.TrimSpace(user.NationalID)) != 10 {
		return false
	}
	if !containsString(ValidGenders, user.Gender) {
		return false
	}
	if len(user.GetGoals()) == 0 {
		return false
	}
	if strings.TrimSpace(user.PrimaryGoal) == "" {
		return false
	}
	if user.TargetWeightKg == nil || *user.TargetWeightKg <= 0 {
		return false
	}
	if !containsString(ValidBodyConditions, user.BodyCondition) {
		return false
	}
	if user.HeightCm == nil || *user.HeightCm <= 0 {
		return false
	}
	if user.WeightKg == nil || *user.WeightKg <= 0 {
		return false
	}
	if strings.TrimSpace(user.MedicalHistory) == "" {
		return false
	}
	if strings.TrimSpace(user.Injuries) == "" {
		return false
	}
	if strings.TrimSpace(user.PhysicalLimitations) == "" {
		return false
	}

	typesPresent := map[string]bool{}
	for _, p := range initialPhotos {
		if p.CheckInDate != nil {
			continue
		}
		t := strings.ToLower(strings.TrimSpace(p.Type))
		if t != "" {
			typesPresent[t] = true
		}
	}
	for _, required := range RequiredBodyPhotoTypes {
		if !typesPresent[required] {
			return false
		}
	}
	return true
}

func containsString(list []string, value string) bool {
	for _, item := range list {
		if item == value {
			return true
		}
	}
	return false
}

// IsValidIranNationalID validates a 10-digit Iranian national ID (کد ملی).
func IsValidIranNationalID(id string) bool {
	id = strings.TrimSpace(id)
	if len(id) != 10 {
		return false
	}
	for _, ch := range id {
		if ch < '0' || ch > '9' {
			return false
		}
	}
	if id == "0000000000" {
		return false
	}

	check := int(id[9] - '0')
	sum := 0
	for i := 0; i < 9; i++ {
		sum += int(id[i]-'0') * (10 - i)
	}
	rem := sum % 11
	if rem < 2 {
		return check == rem
	}
	return check == 11-rem
}
