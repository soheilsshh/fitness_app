package config

import (
	"context"
	"strings"

	"github.com/yourusername/fitness-management/internal/seed"
	"gorm.io/gorm"
)

// MaybeSeedDevData loads development fixtures when SEED_DEV_DATA is enabled.
// Intended to be called from the API server bootstrap, not from SetupDatabase.
func MaybeSeedDevData(db *gorm.DB) error {
	_, err := seed.RunDev(context.Background(), db, seed.RunDevOptions{})
	if err != nil && isDevSeedDisabled(err) {
		return nil
	}
	return err
}

func isDevSeedDisabled(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(err.Error(), "dev seed blocked")
}
