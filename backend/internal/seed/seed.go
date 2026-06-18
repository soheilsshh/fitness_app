package seed

import (
	"context"
	"fmt"
	"log"

	gormseed "github.com/promptrails/gorm-seed"
	"gorm.io/gorm"
)

// RunDevOptions configures a dev seed run.
type RunDevOptions struct {
	// ForceCLI skips the SEED_DEV_DATA env check (used by cmd/seed -dev).
	ForceCLI bool
}

// RunDev loads idempotent development fixtures tagged with the "dev" profile.
// Safe to call multiple times when preconditions pass; existing rows are kept
// (ON DUPLICATE KEY DO NOTHING on primary and natural keys).
func RunDev(ctx context.Context, db *gorm.DB, opts RunDevOptions) (*gormseed.Result, error) {
	if err := Allowed(opts.ForceCLI); err != nil {
		return nil, err
	}
	if err := validatePreconditions(ctx, db); err != nil {
		return nil, fmt.Errorf("dev seed preconditions failed: %w", err)
	}

	fixtureFS, err := fixturesSubFS()
	if err != nil {
		return nil, fmt.Errorf("seed fixtures fs: %w", err)
	}

	seeder := gormseed.New(db,
		gormseed.WithProfiles(devProfile),
		gormseed.WithSkipMissing(),
		gormseed.WithTransaction(),
	)
	registerDevSpecs(seeder)

	res, err := seeder.Run(ctx, fixtureFS)
	if err != nil {
		return res, err
	}

	if err := syncAutoIncrement(ctx, db); err != nil {
		return res, fmt.Errorf("sync auto_increment: %w", err)
	}

	logSeedResult(res)
	return res, nil
}

// syncAutoIncrement bumps AUTO_INCREMENT past explicitly seeded IDs so future
// inserts do not collide with fixture primary keys.
func syncAutoIncrement(ctx context.Context, db *gorm.DB) error {
	tables := []string{
		"users", "coach_profiles", "service_plans", "subscriptions",
		"orders", "order_items", "workout_programs", "program_items",
		"nutrition_programs", "nutrition_items", "site_settings",
		"feedbacks", "check_ins", "transactions", "notifications",
	}
	for _, table := range tables {
		stmt := fmt.Sprintf(
			"SET @seed_ai := (SELECT IFNULL(MAX(id), 0) + 1 FROM `%s`); SET @seed_sql := CONCAT('ALTER TABLE `%s` AUTO_INCREMENT = ', @seed_ai); PREPARE seed_stmt FROM @seed_sql; EXECUTE seed_stmt; DEALLOCATE PREPARE seed_stmt;",
			table, table,
		)
		if err := db.WithContext(ctx).Exec(stmt).Error; err != nil {
			return fmt.Errorf("table %s: %w", table, err)
		}
	}
	return nil
}

func logSeedResult(res *gormseed.Result) {
	if res == nil {
		return
	}
	for _, sr := range res.Specs {
		switch {
		case sr.Err != nil:
			log.Printf("seed %s: error: %v", sr.Name, sr.Err)
		case sr.Skipped:
			log.Printf("seed %s: skipped (%s)", sr.Name, sr.Reason)
		default:
			log.Printf("seed %s: planned=%d inserted=%d", sr.Name, sr.Planned, sr.Inserted)
		}
	}
	log.Printf("dev seed complete: %d rows inserted", res.Inserted())
}
