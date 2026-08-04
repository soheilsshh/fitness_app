package service

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

func exerciseMediaURL(path string) string {
	path = strings.TrimSpace(path)
	if path == "" {
		return ""
	}
	if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") || strings.HasPrefix(path, "/") {
		return path
	}
	return "/exercises-media/" + strings.TrimPrefix(path, "./")
}

func decodeInstructionStepsJSON(data string) []string {
	if strings.TrimSpace(data) == "" {
		return []string{}
	}
	var out []string
	if err := json.Unmarshal([]byte(data), &out); err != nil {
		return []string{}
	}
	return out
}

func exerciseModelToWorkoutDTO(e *models.Exercise, sets int, reps string) MeWorkoutExerciseDTO {
	imagePath := e.ImagePath
	gifPath := e.GifPath
	if donor := lookupMediaDonor(e.Name); donor != nil {
		if strings.TrimSpace(gifPath) == "" && donor.GifPath != "" {
			gifPath = donor.GifPath
		}
		if strings.TrimSpace(imagePath) == "" && donor.ImagePath != "" {
			imagePath = donor.ImagePath
		}
	}
	imageURL := exerciseMediaURL(imagePath)
	gifURL := exerciseMediaURL(gifPath)
	// Prefer animation for clients that only render imageUrl (mobile ListTile).
	if gifURL != "" {
		imageURL = gifURL
	}
	dto := MeWorkoutExerciseDTO{
		ExerciseID:       e.ID,
		Name:             e.Name,
		Sets:             sets,
		Reps:             reps,
		Category:         e.Category,
		BodyPart:         e.BodyPart,
		Equipment:        e.Equipment,
		Target:           e.Target,
		Description:      e.Description,
		InstructionSteps: decodeInstructionStepsJSON(e.InstructionSteps),
		ImageURL:         imageURL,
		GifURL:           gifURL,
	}
	return dto
}

func warmMediaDonorCache(ctx context.Context, exerciseRepo repository.ExerciseRepository) {
	mediaDonorOnce.Do(func() {
		mediaDonorByCore = map[string]mediaDonorPaths{}
		if exerciseRepo == nil {
			return
		}
		list, err := exerciseRepo.ListWithGif(ctx)
		if err != nil {
			return
		}
		for i := range list {
			e := &list[i]
			core := normalizeExerciseCoreNameSvc(e.Name)
			if core == "" || strings.TrimSpace(e.GifPath) == "" {
				continue
			}
			existing, ok := mediaDonorByCore[core]
			if !ok {
				mediaDonorByCore[core] = mediaDonorPaths{GifPath: e.GifPath, ImagePath: e.ImagePath}
				continue
			}
			// Prefer catalog (no coach) already loaded first; keep first donor.
			_ = existing
		}
	})
}

func lookupMediaDonor(name string) *mediaDonorPaths {
	core := normalizeExerciseCoreNameSvc(name)
	if core == "" || mediaDonorByCore == nil {
		return nil
	}
	if d, ok := mediaDonorByCore[core]; ok {
		return &d
	}
	return nil
}

func enrichWorkoutPlan(ctx context.Context, exerciseRepo repository.ExerciseRepository, planByDay map[string]MeDayPlanDTO) map[string]MeDayPlanDTO {
	if exerciseRepo == nil || len(planByDay) == 0 {
		return planByDay
	}

	warmMediaDonorCache(ctx, exerciseRepo)

	for key, day := range planByDay {
		if day.Workout == nil {
			continue
		}
		if len(day.Workout.Exercises) == 0 && len(day.Workout.Steps) > 0 {
			exercises := make([]MeWorkoutExerciseDTO, 0, len(day.Workout.Steps))
			for _, step := range day.Workout.Steps {
				name, sets, reps := parseWorkoutStep(step)
				if strings.TrimSpace(name) == "" {
					continue
				}
				exercises = append(exercises, MeWorkoutExerciseDTO{
					Name:        name,
					Sets:        sets,
					Reps:        reps,
					SetsDetails: setsDetailsToDTO(legacySetsToDetails(sets, reps)),
				})
			}
			day.Workout.Exercises = exercises
			planByDay[key] = day
		}
	}

	idSet := map[uint]bool{}
	nameSet := map[string]bool{}
	for _, day := range planByDay {
		if day.Workout == nil {
			continue
		}
		for _, ex := range day.Workout.Exercises {
			if ex.ExerciseID > 0 {
				idSet[ex.ExerciseID] = true
			} else if strings.TrimSpace(ex.Name) != "" {
				nameSet[strings.TrimSpace(ex.Name)] = true
			}
		}
	}

	ids := make([]uint, 0, len(idSet))
	for id := range idSet {
		ids = append(ids, id)
	}
	names := make([]string, 0, len(nameSet))
	for name := range nameSet {
		names = append(names, name)
	}

	byID := map[uint]*models.Exercise{}
	byName := map[string]*models.Exercise{}

	if list, err := exerciseRepo.FindByIDs(ctx, ids); err == nil {
		for i := range list {
			byID[list[i].ID] = &list[i]
		}
	}
	if list, err := exerciseRepo.FindByNames(ctx, names); err == nil {
		for i := range list {
			byName[list[i].Name] = &list[i]
		}
	}

	for key, day := range planByDay {
		if day.Workout == nil || len(day.Workout.Exercises) == 0 {
			continue
		}
		enriched := make([]MeWorkoutExerciseDTO, 0, len(day.Workout.Exercises))
		for _, ex := range day.Workout.Exercises {
			var model *models.Exercise
			if ex.ExerciseID > 0 {
				model = byID[ex.ExerciseID]
			}
			if model == nil {
				model = byName[strings.TrimSpace(ex.Name)]
			}
	if model != nil {
				// Apply similar-name gif fallback onto the model before DTO mapping.
				if strings.TrimSpace(model.GifPath) == "" {
					if donor := lookupMediaDonor(model.Name); donor != nil {
						clone := *model
						clone.GifPath = donor.GifPath
						if strings.TrimSpace(clone.ImagePath) == "" {
							clone.ImagePath = donor.ImagePath
						}
						model = &clone
					}
				}
				dto := exerciseModelToWorkoutDTO(model, ex.Sets, ex.Reps)
				dto.SetsDetails = ex.SetsDetails
				dto.SupersetID = ex.SupersetID
				dto.WorkoutSystemType = ex.WorkoutSystemType
				enriched = append(enriched, dto)
			} else {
				enriched = append(enriched, ex)
			}
		}
		day.Workout.Exercises = enriched
		planByDay[key] = day
	}

	return planByDay
}
