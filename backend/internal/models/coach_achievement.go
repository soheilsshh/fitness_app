package models

import "gorm.io/gorm"

type CoachAchievementType string

const (
	CoachAchievementCertificate   CoachAchievementType = "certificate"
	CoachAchievementHonor         CoachAchievementType = "honor"
	CoachAchievementMedal         CoachAchievementType = "medal"
	CoachAchievementQualification CoachAchievementType = "qualification"
)

// ValidCoachAchievementTypes returns all allowed achievement type values.
func ValidCoachAchievementTypes() []string {
	return []string{
		string(CoachAchievementCertificate),
		string(CoachAchievementHonor),
		string(CoachAchievementMedal),
		string(CoachAchievementQualification),
	}
}

// IsValidCoachAchievementType reports whether t is a supported achievement type.
func IsValidCoachAchievementType(t string) bool {
	for _, allowed := range ValidCoachAchievementTypes() {
		if t == allowed {
			return true
		}
	}
	return false
}

type CoachAchievement struct {
	gorm.Model
	CoachUserID uint   `gorm:"not null;index"`
	Type        string `gorm:"size:30;not null;index"`
	Title       string `gorm:"size:255;not null"`
	Issuer      string `gorm:"size:255"`
	Year        *int
	Description string `gorm:"type:text"`
	ImageURL    string `gorm:"size:500"`
	SortOrder   int    `gorm:"not null;default:0"`
	IsVisible   bool   `gorm:"not null;default:true"`
}
