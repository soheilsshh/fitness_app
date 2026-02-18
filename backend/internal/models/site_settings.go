package models

import (
	"encoding/json"

	"gorm.io/gorm"
)

// SiteSettings stores editable content for the public site (landing page).
// It mirrors the structure used in frontend defaultSiteSettings.
//
// In most deployments there will be a single row (ID=1).
type SiteSettings struct {
	gorm.Model

	// HeroImageURL stores the URL of the main hero image (if any).
	HeroImageURL string `gorm:"size:512"`

	// JSON blobs are used to keep the structure flexible while still typed.
	// They follow the shapes defined in frontend/docs/frontend-overview.md.
	// json.RawMessage is an alias for []byte and works well with GORM for JSON columns.
	FeatureBullets json.RawMessage `gorm:"type:json"` // { title: string, items: string[] }
	Stats          json.RawMessage `gorm:"type:json"` // [{ id, value, label }]
	Steps          json.RawMessage `gorm:"type:json"` // [{ id, title, text }]
	ContactInfo    json.RawMessage `gorm:"type:json"` // { address, phone, email, instagram, telegram, whatsapp }
}

