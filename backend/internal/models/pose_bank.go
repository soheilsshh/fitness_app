package models

import "gorm.io/gorm"

// PoseBank is a catalog of correct posing technique entries (roadmap D2/BE-5.3):
// name, an instructional video, and a text description.
type PoseBank struct {
	gorm.Model
	Name        string `gorm:"size:255;not null;index"`
	Category    string `gorm:"size:50;index"` // e.g. front, back, side, mandatory
	VideoURL    string `gorm:"size:512"`
	ImageURL    string `gorm:"size:512"`
	Description string `gorm:"type:text"`
	IsPublished bool   `gorm:"not null;default:true"`
}
