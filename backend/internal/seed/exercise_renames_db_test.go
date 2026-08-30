package seed

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/yourusername/fitness-management/internal/models"
)

// Renaming the catalog would orphan every denormalized exercise name in
// programs, templates, set logs and personal records. This checks the
// migration actually repoints them, against a real database.
//
// Opt-in: set FITINO_TEST_DSN to a throwaway database.
func TestApplyExerciseRenamesRepointsHistory(t *testing.T) {
	dsn := os.Getenv("FITINO_TEST_DSN")
	if dsn == "" {
		t.Skip("FITINO_TEST_DSN not set; skipping database-backed rename test")
	}
	renamesPath := filepath.Join("..", "..", "data", "exercises-fa", "name_renames.json")
	raw, err := os.ReadFile(renamesPath)
	if err != nil {
		t.Skipf("rename map not available: %v", err)
	}
	var renames []exerciseRename
	if err := json.Unmarshal(raw, &renames); err != nil {
		t.Fatalf("rename map is not valid JSON: %v", err)
	}
	if len(renames) == 0 {
		t.Skip("rename map is empty")
	}
	sample := renames[0]

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{Logger: logger.Discard})
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	if err := db.AutoMigrate(
		&models.Exercise{}, &models.ProgramItem{}, &models.TemplateProgramItem{},
		&models.WorkoutSetLog{}, &models.PersonalRecord{},
	); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	const userID uint = 990002
	cleanup := func() {
		db.Unscoped().Where("user_id = ?", userID).Delete(&models.WorkoutSetLog{})
		db.Unscoped().Where("user_id = ?", userID).Delete(&models.PersonalRecord{})
		db.Unscoped().Where("workout_program_id = ?", userID).Delete(&models.ProgramItem{})
	}
	cleanup()
	t.Cleanup(cleanup)

	// History written before the re-localization, still under the old name.
	setLog := models.WorkoutSetLog{
		UserID: userID, ExerciseName: sample.From, SetNumber: 1,
		Reps: 20, MetricKind: "reps", PerformedAt: time.Now(),
	}
	record := models.PersonalRecord{
		UserID: userID, ExerciseName: sample.From, MetricKind: "reps",
		Reps: 20, AchievedAt: time.Now(),
	}
	item := models.ProgramItem{
		WorkoutProgramID: userID, WeekNumber: 1, DayNumber: 1, OrderIndex: 1,
		Exercise: sample.From,
	}
	for _, row := range []any{&setLog, &record, &item} {
		if err := db.Create(row).Error; err != nil {
			t.Fatalf("seed history row: %v", err)
		}
	}

	// DataDir() is resolved once per process, so point it at the repo data dir
	// before the migration reads the rename map.
	t.Setenv("FITINO_DATA_DIR", filepath.Join("..", "..", "data"))
	if err := ApplyExerciseRenames(context.Background(), db); err != nil {
		t.Fatalf("ApplyExerciseRenames: %v", err)
	}

	var gotLog models.WorkoutSetLog
	if err := db.First(&gotLog, setLog.ID).Error; err != nil {
		t.Fatalf("reload set log: %v", err)
	}
	if gotLog.ExerciseName != sample.To {
		t.Errorf("set log name = %q, want %q", gotLog.ExerciseName, sample.To)
	}

	var gotRecord models.PersonalRecord
	if err := db.First(&gotRecord, record.ID).Error; err != nil {
		t.Fatalf("reload personal record: %v", err)
	}
	if gotRecord.ExerciseName != sample.To {
		t.Errorf("personal record name = %q, want %q", gotRecord.ExerciseName, sample.To)
	}

	var gotItem models.ProgramItem
	if err := db.First(&gotItem, item.ID).Error; err != nil {
		t.Fatalf("reload program item: %v", err)
	}
	if gotItem.Exercise != sample.To {
		t.Errorf("program item exercise = %q, want %q", gotItem.Exercise, sample.To)
	}
}
