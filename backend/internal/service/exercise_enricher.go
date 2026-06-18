package service

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

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
		ImageURL:         exerciseMediaURL(e.ImagePath),
		GifURL:           exerciseMediaURL(e.GifPath),
	}
	return dto
}

func enrichWorkoutPlan(ctx context.Context, exerciseRepo repository.ExerciseRepository, planByDay map[string]MeDayPlanDTO) map[string]MeDayPlanDTO {
	if exerciseRepo == nil || len(planByDay) == 0 {
		return planByDay
	}

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
					Name: name,
					Sets: sets,
					Reps: reps,
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
				dto := exerciseModelToWorkoutDTO(model, ex.Sets, ex.Reps)
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
