package seed

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"strings"

	"gorm.io/gorm"
)

// DefaultExerciseRenamesFile lists the Persian catalog names that changed when
// the machine-translated catalog was re-localized (scripts/exercise-localization).
const DefaultExerciseRenamesFile = "exercises-fa/name_renames.json"

// Exercise names are denormalized into program items, template items, set logs
// and personal records — they were never foreign keys. Renaming ~1300 catalog
// entries therefore orphans every existing row: a student's push-up history
// filed under the old name would stop matching new sets, silently resetting
// their personal record. ApplyExerciseRenames repoints those rows once.
//
// The naive shape (one UPDATE per rename per table) is ~5000 statements against
// unindexed name columns, which took minutes on a seeded database. Instead the
// map is loaded into a temporary table and each target table is updated twice:
// once by exercise_id, once by the old name.
//
// Safe to re-run: a second pass finds nothing left under the old names.

type exerciseRename struct {
	ExternalID string `json:"externalId"`
	From       string `json:"from"`
	To         string `json:"to"`
}

// renameTargets are the tables holding a denormalized exercise name.
var renameTargets = []struct {
	table     string
	nameField string
}{
	{"program_items", "exercise"},
	{"template_program_items", "exercise"},
	{"workout_set_logs", "exercise_name"},
	{"personal_records", "exercise_name"},
}

const renameTempTable = "tmp_exercise_renames"

// ApplyExerciseRenames migrates historical exercise-name references.
func ApplyExerciseRenames(ctx context.Context, db *gorm.DB) error {
	path := DataFile(DefaultExerciseRenamesFile)
	raw, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil // nothing to migrate on a fresh install
		}
		return err
	}

	var renames []exerciseRename
	if err := json.Unmarshal(raw, &renames); err != nil {
		return err
	}
	if len(renames) == 0 {
		return nil
	}

	tx := db.WithContext(ctx)

	if err := tx.Exec("DROP TEMPORARY TABLE IF EXISTS " + renameTempTable).Error; err != nil {
		return err
	}
	// Indexed on old_name so the name-based UPDATE below is a lookup, not a scan.
	if err := tx.Exec("CREATE TEMPORARY TABLE " + renameTempTable + ` (
		external_id VARCHAR(20) NOT NULL,
		old_name VARCHAR(255) NOT NULL,
		new_name VARCHAR(255) NOT NULL,
		KEY idx_old_name (old_name),
		KEY idx_external_id (external_id)
	) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).Error; err != nil {
		return err
	}
	defer func() {
		_ = tx.Exec("DROP TEMPORARY TABLE IF EXISTS " + renameTempTable).Error
	}()

	const batchSize = 500
	rows := make([]exerciseRename, 0, len(renames))
	for _, rename := range renames {
		from := strings.TrimSpace(rename.From)
		to := strings.TrimSpace(rename.To)
		if from == "" || to == "" || from == to {
			continue
		}
		rows = append(rows, exerciseRename{
			ExternalID: strings.TrimSpace(rename.ExternalID),
			From:       from,
			To:         to,
		})
	}
	if len(rows) == 0 {
		return nil
	}

	for start := 0; start < len(rows); start += batchSize {
		end := start + batchSize
		if end > len(rows) {
			end = len(rows)
		}
		chunk := rows[start:end]
		values := make([]string, 0, len(chunk))
		args := make([]any, 0, len(chunk)*3)
		for _, r := range chunk {
			values = append(values, "(?,?,?)")
			args = append(args, r.ExternalID, r.From, r.To)
		}
		sql := "INSERT INTO " + renameTempTable +
			" (external_id, old_name, new_name) VALUES " + strings.Join(values, ",")
		if err := tx.Exec(sql, args...).Error; err != nil {
			return err
		}
	}

	updated := int64(0)
	for _, target := range renameTargets {
		// Rows that carry an exercise_id are authoritative — repoint them even
		// if their stored name had already drifted from the catalog.
		byID := tx.Exec(
			"UPDATE "+target.table+" t "+
				"JOIN exercises e ON e.id = t.exercise_id "+
				"JOIN "+renameTempTable+" m ON m.external_id = e.external_id "+
				"SET t."+target.nameField+" = m.new_name "+
				"WHERE t."+target.nameField+" <> m.new_name")
		if byID.Error != nil {
			log.Printf("[exercise-rename] %s by exercise_id failed: %v", target.table, byID.Error)
		} else {
			updated += byID.RowsAffected
		}

		// Rows with no catalog link fall back to an exact old-name match.
		byName := tx.Exec(
			"UPDATE "+target.table+" t "+
				"JOIN "+renameTempTable+" m ON m.old_name = t."+target.nameField+" "+
				"SET t."+target.nameField+" = m.new_name")
		if byName.Error != nil {
			log.Printf("[exercise-rename] %s by name failed: %v", target.table, byName.Error)
		} else {
			updated += byName.RowsAffected
		}
	}

	if updated > 0 {
		log.Printf("[exercise-rename] repointed %d historical rows across %d renames", updated, len(rows))
	}
	return nil
}
