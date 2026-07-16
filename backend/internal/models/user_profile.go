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
	PhotoTypeSide  = "side"
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
	// TrackingPhotoTypes are the three angles required for bi-weekly progress check-ins.
	TrackingPhotoTypes = []string{
		PhotoTypeFront,
		PhotoTypeBack,
		PhotoTypeSide,
	}
	DefaultCheckinFrequencyDays = 14
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

const placeholderStudentName = "کاربر جدید"

// IsStudentProfileComplete is the soft gate for panel access: real name + primary goal.
// Detailed body metrics, medical history, and photos are progressive/optional.
// Non-student roles are always considered complete.
func IsStudentProfileComplete(user *User, _ []UserPhoto) bool {
	if user == nil || user.Role != RoleStudent {
		return true
	}
	name := strings.TrimSpace(user.Name)
	if name == "" || name == placeholderStudentName {
		return false
	}
	if strings.TrimSpace(user.PrimaryGoal) == "" && len(user.GetGoals()) == 0 {
		return false
	}
	return true
}

// StudentProfileProgress returns section completion for progressive profile UX.
func StudentProfileProgress(user *User, initialPhotos []UserPhoto) (essentials, body, medical, photos bool, percent int) {
	if user == nil {
		return false, false, false, false, 0
	}
	essentials = IsStudentProfileComplete(user, initialPhotos)
	body = user.HeightCm != nil && *user.HeightCm > 0 &&
		user.WeightKg != nil && *user.WeightKg > 0 &&
		user.TargetWeightKg != nil && *user.TargetWeightKg > 0 &&
		containsString(ValidBodyConditions, user.BodyCondition)
	medical = strings.TrimSpace(user.MedicalHistory) != "" &&
		strings.TrimSpace(user.Injuries) != "" &&
		strings.TrimSpace(user.PhysicalLimitations) != ""

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
	photos = true
	for _, required := range RequiredBodyPhotoTypes {
		if !typesPresent[required] {
			photos = false
			break
		}
	}

	done := 0
	for _, ok := range []bool{essentials, body, medical, photos} {
		if ok {
			done++
		}
	}
	percent = done * 100 / 4
	return essentials, body, medical, photos, percent
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
