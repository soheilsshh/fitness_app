package seed

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"unicode"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
)

var (
	exerciseNoiseRe = regexp.MustCompile(`(?i)\([^)]*\)|v\.?\s*2|pov|version\s*\d+`)
	exerciseSpaceRe = regexp.MustCompile(`\s+`)
)

// equipment tokens stripped so "اسکوات دمبل" and "اسکوات هالتر" share a core key.
var exerciseEquipmentTokens = []string{
	"با هالتر", "با دمبل", "با کابل", "با کش", "با اسمیت", "با دستگاه",
	"هالتر", "دمبل", "کابل", "کش", "اسمیت", "دستگاه", "لور", "ماشین",
	"barbell", "dumbbell", "cable", "smith", "machine", "kettlebell",
	"resistance band", "band", "ez", "ez-bar", "trap bar",
}

// FillMissingExerciseMedia copies gif/image paths onto exercises that lack usable
// media from similarly named exercises that already have animations.
// Safe to run repeatedly (idempotent for already-filled rows).
func FillMissingExerciseMedia(ctx context.Context, db *gorm.DB) error {
	var all []models.Exercise
	if err := db.WithContext(ctx).
		Where("is_active = ?", true).
		Find(&all).Error; err != nil {
		return err
	}
	if len(all) == 0 {
		return nil
	}

	mediaRoot := ExercisesMediaDir()
	donors := map[string]*models.Exercise{}

	for i := range all {
		e := &all[i]
		if !exerciseMediaUsable(e.GifPath, mediaRoot) {
			continue
		}
		core := normalizeExerciseCoreName(e.Name)
		if core == "" {
			continue
		}
		existing := donors[core]
		if existing == nil {
			donors[core] = e
			continue
		}
		// Prefer global catalog over coach-owned customs.
		if existing.CoachID != nil && e.CoachID == nil {
			donors[core] = e
		}
	}

	updated := 0
	skipped := 0
	for i := range all {
		e := &all[i]
		needGif := !exerciseMediaUsable(e.GifPath, mediaRoot)
		needImage := strings.TrimSpace(e.ImagePath) == "" || !exerciseMediaUsable(e.ImagePath, mediaRoot)
		if !needGif && !needImage {
			skipped++
			continue
		}

		core := normalizeExerciseCoreName(e.Name)
		donor := donors[core]
		if donor == nil || donor.ID == e.ID {
			continue
		}

		updates := map[string]any{}
		if needGif && strings.TrimSpace(donor.GifPath) != "" {
			updates["gif_path"] = donor.GifPath
		}
		if needImage {
			img := strings.TrimSpace(donor.ImagePath)
			if img == "" {
				img = donor.GifPath
			}
			if img != "" {
				updates["image_path"] = img
			}
		}
		if len(updates) == 0 {
			continue
		}
		if err := db.WithContext(ctx).Model(&models.Exercise{}).
			Where("id = ?", e.ID).
			Updates(updates).Error; err != nil {
			log.Printf("[catalog-seed] media fill failed id=%d name=%q: %v", e.ID, e.Name, err)
			continue
		}
		updated++
	}

	log.Printf("[catalog-seed] exercise media fill: donors=%d updated=%d unchanged=%d",
		len(donors), updated, skipped)
	return nil
}

func exerciseMediaUsable(relPath, mediaRoot string) bool {
	relPath = strings.TrimSpace(relPath)
	if relPath == "" {
		return false
	}
	if strings.HasPrefix(relPath, "http://") || strings.HasPrefix(relPath, "https://") {
		return true
	}
	clean := strings.TrimPrefix(relPath, "/")
	clean = strings.TrimPrefix(clean, "exercises-media/")
	full := filepath.Join(mediaRoot, clean)
	info, err := os.Stat(full)
	if err != nil || info.IsDir() {
		// Path recorded but file absent — treat as missing so a similar donor can fill it.
		// If media pack is not on this machine at all, still allow DB path reuse
		// when the directory itself is empty (dev); prefer any non-empty path then.
		if !dirHasMediaFiles(mediaRoot) {
			return true
		}
		return false
	}
	return info.Size() > 0
}

func dirHasMediaFiles(mediaRoot string) bool {
	for _, sub := range []string{"videos", "images"} {
		entries, err := os.ReadDir(filepath.Join(mediaRoot, sub))
		if err != nil {
			continue
		}
		for _, e := range entries {
			if e.IsDir() {
				continue
			}
			name := e.Name()
			if name == ".gitkeep" || strings.HasPrefix(name, ".") {
				continue
			}
			return true
		}
	}
	return false
}

func normalizeExerciseCoreName(name string) string {
	n := strings.TrimSpace(strings.ToLower(name))
	if n == "" {
		return ""
	}
	n = strings.ReplaceAll(n, "‌", " ") // ZWNJ
	n = exerciseNoiseRe.ReplaceAllString(n, " ")
	for _, tok := range exerciseEquipmentTokens {
		n = strings.ReplaceAll(n, strings.ToLower(tok), " ")
	}
	n = strings.Map(func(r rune) rune {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || unicode.IsSpace(r) {
			return r
		}
		return ' '
	}, n)
	n = exerciseSpaceRe.ReplaceAllString(strings.TrimSpace(n), " ")
	return n
}
