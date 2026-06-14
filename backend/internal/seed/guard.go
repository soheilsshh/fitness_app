package seed

import (
	"fmt"
	"os"
	"strings"
)

// DevFixtureEmails maps dev fixture emails to their expected primary keys.
// Child fixtures reference these IDs; a mismatch indicates an unsafe seed target DB.
var DevFixtureEmails = map[string]uint{
	"coach.ali@fitness.dev":     2,
	"coach.sara@fitness.dev":    3,
	"student.reza@fitness.dev":  4,
	"student.maryam@fitness.dev": 5,
	"student.amir@fitness.dev":  6,
	"student.neda@fitness.dev":  7,
}

// Allowed reports whether dev seeding may run.
// CLI invocations (force=true) skip the SEED_DEV_DATA check but still block production.
func Allowed(forceCLI bool) error {
	if isProductionEnv() {
		return fmt.Errorf("dev seed blocked: APP_ENV=%q", os.Getenv("APP_ENV"))
	}
	if !forceCLI && !isTruthy(os.Getenv("SEED_DEV_DATA")) {
		return fmt.Errorf("dev seed blocked: set SEED_DEV_DATA=true or run go run ./cmd/seed -dev")
	}
	return nil
}

func isProductionEnv() bool {
	env := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))
	return env == "production" || env == "prod"
}

func isTruthy(v string) bool {
	switch strings.ToLower(strings.TrimSpace(v)) {
	case "1", "true", "yes", "on":
		return true
	default:
		return false
	}
}
