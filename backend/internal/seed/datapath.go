package seed

import (
	"os"
	"path/filepath"
	"strings"
	"sync"
)

// Each dataset lives in its own subfolder under data/ so filenames/media never collide.
const (
	DefaultExercisesFile         = "exercises-fa/exercises.fa.json"
	DefaultExercisesENFile       = "exercises-en/exercises.json"
	DefaultFoodsFile             = "foods/Persian_food_facts.csv"
	DefaultExerciseTemplatesFile = "exercise-templates/exercise_templates.json"
	DefaultDietTemplatesFile     = "diet-templates/diet_templates.json"
	// Media root for the Persian catalog (contains images/ and videos/).
	DefaultExercisesMediaDir = "exercises-fa"
	DefaultTemplateMediaDir  = "exercise-templates"
	DefaultDietMediaDir      = "diet-templates"
)

var (
	dataDirOnce sync.Once
	dataDirPath string
)

// DataDir returns the unified seed/media directory.
// Resolution order:
//  1. FITINO_DATA_DIR env
//  2. <directory-of-executable>/data  (when that folder exists)
//  3. ./data (cwd — use when running from backend/)
//
// Deploy layout (next to the binary):
//
//	fitino-api
//	config.yaml
//	data/
//	  exercises-fa/          catalog JSON + its images/ videos/
//	  exercises-en/          English twin JSON only
//	  foods/                 CSV
//	  exercise-templates/    template JSON + its images/ videos/
//	  diet-templates/        diet JSON + its images/
func DataDir() string {
	dataDirOnce.Do(func() {
		if v := strings.TrimSpace(os.Getenv("FITINO_DATA_DIR")); v != "" {
			dataDirPath = filepath.Clean(v)
			return
		}
		if exe, err := os.Executable(); err == nil {
			candidate := filepath.Join(filepath.Dir(exe), "data")
			if dirExists(candidate) {
				dataDirPath = candidate
				return
			}
		}
		dataDirPath = filepath.Clean(filepath.Join(".", "data"))
	})
	return dataDirPath
}

// DataFile joins DataDir() with a relative path (or returns abs path as-is).
func DataFile(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return DataDir()
	}
	if filepath.IsAbs(name) {
		return name
	}
	name = filepath.Clean(name)
	// Accept legacy "data/..." prefix.
	if strings.HasPrefix(name, "data"+string(filepath.Separator)) || name == "data" {
		name = strings.TrimPrefix(name, "data"+string(filepath.Separator))
		if name == "data" || name == "." {
			return DataDir()
		}
	}
	return filepath.Join(DataDir(), name)
}

// ExercisesMediaDir is the Persian catalog media root (served at /exercises-media).
// JSON paths like images/0001.jpg resolve to data/exercises-fa/images/0001.jpg.
func ExercisesMediaDir() string {
	return DataFile(DefaultExercisesMediaDir)
}

// ExerciseTemplatesMediaDir is morabiha template media (separate from catalog).
func ExerciseTemplatesMediaDir() string {
	return DataFile(DefaultTemplateMediaDir)
}

// DietTemplatesMediaDir is diet-template images (separate folder).
func DietTemplatesMediaDir() string {
	return DataFile(DefaultDietMediaDir)
}

func dirExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}
