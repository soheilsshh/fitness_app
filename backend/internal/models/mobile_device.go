package models

import "time"

// MobileDevice tracks app installs/sessions per store channel for admin reports.
type MobileDevice struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	UserID      *uint      `gorm:"index" json:"userId,omitempty"`
	DeviceID    string     `gorm:"size:128;uniqueIndex;not null" json:"deviceId"`
	Store       string     `gorm:"size:32;index;not null" json:"store"` // myket|bazaar|play|appstore
	Platform    string     `gorm:"size:16;index;not null" json:"platform"` // android|ios
	AppVersion  string     `gorm:"size:32" json:"appVersion"`
	BuildNumber string     `gorm:"size:32" json:"buildNumber"`
	OSVersion   string     `gorm:"size:64" json:"osVersion"`
	Model       string     `gorm:"size:128" json:"model"`
	FirstSeenAt time.Time  `json:"firstSeenAt"`
	LastSeenAt  time.Time  `gorm:"index" json:"lastSeenAt"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

func (MobileDevice) TableName() string { return "mobile_devices" }

// MobileStoreRelease is admin-managed release metadata per store.
type MobileStoreRelease struct {
	ID               uint       `gorm:"primaryKey" json:"id"`
	Store            string     `gorm:"size:32;index;not null" json:"store"`
	VersionName      string     `gorm:"size:32;not null" json:"versionName"`
	VersionCode      int        `gorm:"not null;default:1" json:"versionCode"`
	ReleaseNotes     string     `gorm:"type:text" json:"releaseNotes"`
	IsPublished      bool       `gorm:"not null;default:false" json:"isPublished"`
	DownloadURL      string     `gorm:"size:512" json:"downloadUrl"`
	MinOS            string     `gorm:"size:32" json:"minOs"`
	InstallsReported int64      `gorm:"not null;default:0" json:"installsReported"`
	ReleasedAt       *time.Time `json:"releasedAt,omitempty"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

func (MobileStoreRelease) TableName() string { return "mobile_store_releases" }
