package service

import (
	"context"
	"os"
	"testing"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/yourusername/fitness-management/internal/models"
)

// The rest of the PR logic is covered by pure-function tests, but the
// "previous best" lookup is real SQL — it picks a column by metric kind and
// takes MAX() over it. This exercises that query against a live MySQL so a
// column rename or a wrong kind mapping cannot pass silently.
//
// Opt-in: set FITINO_TEST_DSN to a throwaway database, e.g.
//
//	FITINO_TEST_DSN='root:pw@tcp(127.0.0.1:3306)/fitino_e2e_check?charset=utf8mb4&parseTime=True&loc=Local' \
//	  go test ./internal/service/ -run PersonalRecordsAgainstDB
func openTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := os.Getenv("FITINO_TEST_DSN")
	if dsn == "" {
		t.Skip("FITINO_TEST_DSN not set; skipping database-backed personal-record test")
	}
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{Logger: logger.Discard})
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	if err := db.AutoMigrate(&models.WorkoutSetLog{}, &models.PersonalRecord{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

func TestPersonalRecordsAgainstDB(t *testing.T) {
	db := openTestDB(t)
	ctx := context.Background()
	// A user id far outside the seeded range, cleaned up on the way in and out.
	const userID uint = 990001
	cleanup := func() {
		db.Unscoped().Where("user_id = ?", userID).Delete(&models.WorkoutSetLog{})
		db.Unscoped().Where("user_id = ?", userID).Delete(&models.PersonalRecord{})
	}
	cleanup()
	t.Cleanup(cleanup)

	svc := &workoutHistoryService{db: db}
	now := time.Now()

	logSession := func(inputs []LogSetInput) ([]models.WorkoutSetLog, []string) {
		logs := buildSetLogs(userID, 1, 1, now, 80, inputs)
		names, previousBest := svc.markPersonalRecords(ctx, userID, logs)
		if len(logs) > 0 {
			if err := db.Create(&logs).Error; err != nil {
				t.Fatalf("insert set logs: %v", err)
			}
			if records := buildPersonalRecords(userID, now, logs, previousBest); len(records) > 0 {
				if err := db.Create(&records).Error; err != nil {
					t.Fatalf("insert personal records: %v", err)
				}
			}
		}
		return logs, names
	}

	// Session 1: first ever bodyweight work — every set is a new record.
	logs, names := logSession([]LogSetInput{
		{ExerciseName: "شنا", Reps: 20, Equipment: "وزن بدن"},
		{ExerciseName: "پلانک", HoldSeconds: 60, Equipment: "وزن بدن"},
		{ExerciseName: "پرس سینه با هالتر", WeightKg: 60, Reps: 8, Equipment: "هالتر"},
	})
	if len(logs) != 3 {
		t.Fatalf("expected 3 sets persisted, got %d", len(logs))
	}
	if len(names) != 3 {
		t.Fatalf("expected 3 first-time PRs, got %d (%v)", len(names), names)
	}

	// Session 2: beat the reps, tie the hold, drop the weight.
	logs, names = logSession([]LogSetInput{
		{ExerciseName: "شنا", Reps: 25, Equipment: "وزن بدن"},               // new rep PR
		{ExerciseName: "پلانک", HoldSeconds: 60, Equipment: "وزن بدن"},      // tie, not a PR
		{ExerciseName: "پرس سینه با هالتر", WeightKg: 55, Reps: 10, Equipment: "هالتر"}, // lighter, not a PR
	})
	if len(names) != 1 || names[0] != "شنا" {
		t.Fatalf("expected only the push-up rep PR, got %v", names)
	}
	if !logs[0].IsPR || logs[1].IsPR || logs[2].IsPR {
		t.Fatalf("wrong PR flags: %v %v %v", logs[0].IsPR, logs[1].IsPR, logs[2].IsPR)
	}

	// Session 3: more reps on the bench press must NOT count as a weight PR,
	// and a longer plank must.
	_, names = logSession([]LogSetInput{
		{ExerciseName: "پرس سینه با هالتر", WeightKg: 55, Reps: 15, Equipment: "هالتر"},
		{ExerciseName: "پلانک", HoldSeconds: 95, Equipment: "وزن بدن"},
	})
	if len(names) != 1 || names[0] != "پلانک" {
		t.Fatalf("expected only the plank hold PR, got %v", names)
	}

	// The stored history must carry the right metric kind and previous best.
	var records []models.PersonalRecord
	if err := db.Where("user_id = ?", userID).Order("id ASC").Find(&records).Error; err != nil {
		t.Fatalf("read personal records: %v", err)
	}
	if len(records) != 5 {
		t.Fatalf("expected 5 PR rows, got %d", len(records))
	}

	byKey := map[string]models.PersonalRecord{}
	for _, r := range records {
		byKey[r.ExerciseName+"|"+r.MetricKind] = r // last write per key wins
	}

	pushup := byKey["شنا|"+MetricKindReps]
	if pushup.Reps != 25 || pushup.PreviousBestReps != 20 {
		t.Errorf("push-up record: reps=%d previousBestReps=%d, want 25 / 20", pushup.Reps, pushup.PreviousBestReps)
	}
	if pushup.WeightKg != 0 {
		t.Errorf("push-up record should carry no weight, got %v", pushup.WeightKg)
	}

	plank := byKey["پلانک|"+MetricKindHold]
	if plank.HoldSeconds != 95 || plank.PreviousBestHoldSec != 60 {
		t.Errorf("plank record: hold=%d previousBest=%d, want 95 / 60", plank.HoldSeconds, plank.PreviousBestHoldSec)
	}

	bench := byKey["پرس سینه با هالتر|"+MetricKindWeight]
	if bench.WeightKg != 60 || bench.PreviousBestKg != 0 {
		t.Errorf("bench record: weight=%v previousBest=%v, want 60 / 0", bench.WeightKg, bench.PreviousBestKg)
	}
}
