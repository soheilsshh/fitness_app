package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var (
	ErrCoachNoActiveSubscription = errors.New("student has no active subscription with this coach")
	ErrCoachProgramNotFound      = errors.New("program not found")
	ErrCoachTemplateNotFound     = errors.New("template not found")
)

type ProgramAssignRequest struct {
	Title         string                  `json:"title"`
	DurationWeeks int                     `json:"durationWeeks"`
	Notes         string                  `json:"notes"`
	Schedule      *MeScheduleDTO          `json:"schedule"`
	PlanByDay     map[string]MeDayPlanDTO `json:"planByDay"`
}

type CoachStudentProgramsResponse struct {
	WorkoutProgramID   uint                    `json:"workoutProgramId,omitempty"`
	NutritionProgramID uint                    `json:"nutritionProgramId,omitempty"`
	Schedule           *MeScheduleDTO          `json:"schedule,omitempty"`
	PlanByDay          map[string]MeDayPlanDTO `json:"planByDay,omitempty"`
}

type WorkoutTemplateSummary struct {
	ID       uint   `json:"id"`
	Title    string `json:"title"`
	Type     string `json:"type,omitempty"`
	Gender   string `json:"gender,omitempty"`
	Location string `json:"location,omitempty"`
	DayCount int    `json:"dayCount"`
	Target   string `json:"target,omitempty"`
	Level    string `json:"level,omitempty"`
	Injury   string `json:"injury,omitempty"`
}

type NutritionTemplateSummary struct {
	ID         uint   `json:"id"`
	Title      string `json:"title"`
	Type       string `json:"type,omitempty"`
	Gender     string `json:"gender,omitempty"`
	Target     string `json:"target,omitempty"`
	Limitation string `json:"limitation,omitempty"`
	Calorie    int    `json:"calorie"`
}

type TemplateListResponse struct {
	Items []any `json:"items"`
	Total int   `json:"total"`
}

type CoachProgramService interface {
	GetStudentPrograms(ctx context.Context, coachID, studentID uint) (*CoachStudentProgramsResponse, error)
	AssignWorkoutProgram(ctx context.Context, coachID, studentID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error)
	UpdateWorkoutProgram(ctx context.Context, coachID, studentID, programID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error)
	AssignNutritionProgram(ctx context.Context, coachID, studentID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error)
	UpdateNutritionProgram(ctx context.Context, coachID, studentID, programID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error)
	ListWorkoutTemplates(ctx context.Context) (*TemplateListResponse, error)
	ListNutritionTemplates(ctx context.Context) (*TemplateListResponse, error)
	AssignWorkoutFromTemplate(ctx context.Context, coachID, studentID, templateID uint) (*CoachStudentProgramsResponse, error)
	AssignNutritionFromTemplate(ctx context.Context, coachID, studentID, templateID uint) (*CoachStudentProgramsResponse, error)
}

type coachProgramService struct {
	db              *gorm.DB
	subRepo         repository.SubscriptionRepository
	programRepo     repository.ProgramRepository
	templateRepo    repository.TemplateRepository
	exerciseRepo    repository.ExerciseRepository
	foodRepo        repository.FoodRepository
	coachStudentSvc CoachStudentService
}

func NewCoachProgramService(
	db *gorm.DB,
	subRepo repository.SubscriptionRepository,
	programRepo repository.ProgramRepository,
	templateRepo repository.TemplateRepository,
	exerciseRepo repository.ExerciseRepository,
	foodRepo repository.FoodRepository,
	coachStudentSvc CoachStudentService,
) CoachProgramService {
	return &coachProgramService{
		db:              db,
		subRepo:         subRepo,
		programRepo:     programRepo,
		templateRepo:    templateRepo,
		exerciseRepo:    exerciseRepo,
		foodRepo:        foodRepo,
		coachStudentSvc: coachStudentSvc,
	}
}

func (s *coachProgramService) finalizePlan(ctx context.Context, planByDay map[string]MeDayPlanDTO, schedule *MeScheduleDTO) (map[string]MeDayPlanDTO, *MeScheduleDTO) {
	planByDay = enrichWorkoutPlan(ctx, s.exerciseRepo, planByDay)
	planByDay = enrichNutritionPlan(ctx, s.foodRepo, planByDay)
	return planByDay, schedule
}

func (s *coachProgramService) resolveActiveSubscription(ctx context.Context, coachID, studentID uint) (*models.Subscription, error) {
	ok, err := s.coachStudentSvc.CanAccessStudent(ctx, coachID, studentID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrCoachStudentForbidden
	}
	sub, err := s.subRepo.FindCurrentByUserIDAndCoachID(ctx, studentID, coachID, time.Now())
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrCoachNoActiveSubscription
		}
		return nil, err
	}
	return sub, nil
}

func (s *coachProgramService) GetStudentPrograms(ctx context.Context, coachID, studentID uint) (*CoachStudentProgramsResponse, error) {
	sub, err := s.resolveActiveSubscription(ctx, coachID, studentID)
	if err != nil {
		if errors.Is(err, ErrCoachNoActiveSubscription) {
			return &CoachStudentProgramsResponse{PlanByDay: map[string]MeDayPlanDTO{}}, nil
		}
		return nil, err
	}

	resp := &CoachStudentProgramsResponse{PlanByDay: map[string]MeDayPlanDTO{}}

	var workoutItems []models.ProgramItem
	var nutritionItems []models.NutritionItem

	if wp, err := s.programRepo.FindActiveWorkoutBySubscriptionID(ctx, sub.ID); err == nil && wp != nil {
		resp.WorkoutProgramID = wp.ID
		workoutItems, _ = s.programRepo.FindWorkoutItemsByProgramID(ctx, wp.ID)
	}
	if np, err := s.programRepo.FindActiveNutritionBySubscriptionID(ctx, sub.ID); err == nil && np != nil {
		resp.NutritionProgramID = np.ID
		nutritionItems, _ = s.programRepo.FindNutritionItemsByProgramID(ctx, np.ID)
	}

	planByDay, schedule := buildFullPlanByDay(workoutItems, nutritionItems)
	planByDay, schedule = s.finalizePlan(ctx, planByDay, schedule)
	resp.PlanByDay = planByDay
	resp.Schedule = schedule
	return resp, nil
}

func (s *coachProgramService) AssignWorkoutProgram(ctx context.Context, coachID, studentID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error) {
	sub, err := s.resolveActiveSubscription(ctx, coachID, studentID)
	if err != nil {
		return nil, err
	}

	durationWeeks := req.DurationWeeks
	if durationWeeks <= 0 {
		durationWeeks = 4
	}
	title := req.Title
	if title == "" {
		title = "برنامه تمرین"
	}

	return s.createWorkoutProgram(ctx, coachID, sub.ID, title, durationWeeks, req.Notes, req.PlanByDay)
}

func (s *coachProgramService) createWorkoutProgram(ctx context.Context, coachID, subscriptionID uint, title string, durationWeeks int, notes string, planByDay map[string]MeDayPlanDTO) (*CoachStudentProgramsResponse, error) {
	var createdID uint
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.WorkoutProgram{}).
			Where("subscription_id = ? AND is_active = ?", subscriptionID, true).
			Update("is_active", false).Error; err != nil {
			return err
		}

		var maxVersion *int
		if err := tx.Model(&models.WorkoutProgram{}).
			Where("subscription_id = ?", subscriptionID).
			Select("MAX(version)").Scan(&maxVersion).Error; err != nil {
			return err
		}
		version := 1
		if maxVersion != nil {
			version = *maxVersion + 1
		}

		program := models.WorkoutProgram{
			SubscriptionID: subscriptionID,
			CoachID:        coachID,
			Version:        version,
			Title:          title,
			Notes:          notes,
			DurationWeeks:  durationWeeks,
			IsActive:       true,
		}
		if err := tx.Create(&program).Error; err != nil {
			return err
		}
		createdID = program.ID

		items := planByDayToWorkoutItems(planByDay)
		for i := range items {
			items[i].WorkoutProgramID = program.ID
		}
		if len(items) > 0 {
			for i := range items {
				if err := tx.Create(&items[i]).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	items, _ := s.programRepo.FindWorkoutItemsByProgramID(ctx, createdID)
	planByDay, schedule := workoutItemsToPlanByDay(items)
	planByDay, schedule = s.finalizePlan(ctx, planByDay, schedule)
	return &CoachStudentProgramsResponse{
		WorkoutProgramID: createdID,
		Schedule:         schedule,
		PlanByDay:        planByDay,
	}, nil
}

func (s *coachProgramService) UpdateWorkoutProgram(ctx context.Context, coachID, studentID, programID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error) {
	sub, err := s.resolveActiveSubscription(ctx, coachID, studentID)
	if err != nil {
		return nil, err
	}

	program, err := s.programRepo.FindWorkoutProgramByID(ctx, programID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrCoachProgramNotFound
		}
		return nil, err
	}
	if program.SubscriptionID != sub.ID || program.CoachID != coachID {
		return nil, ErrCoachProgramNotFound
	}

	if req.Title != "" {
		program.Title = req.Title
	}
	if req.DurationWeeks > 0 {
		program.DurationWeeks = req.DurationWeeks
	}
	if req.Notes != "" {
		program.Notes = req.Notes
	}
	program.LastUpdatedAt = time.Now()

	if err := s.programRepo.UpdateWorkoutProgram(ctx, program); err != nil {
		return nil, err
	}

	items := planByDayToWorkoutItems(req.PlanByDay)
	for i := range items {
		items[i].WorkoutProgramID = program.ID
	}
	if err := s.programRepo.UpsertWorkoutItems(ctx, program.ID, items); err != nil {
		return nil, err
	}

	loaded, _ := s.programRepo.FindWorkoutItemsByProgramID(ctx, program.ID)
	planByDay, schedule := workoutItemsToPlanByDay(loaded)
	planByDay, schedule = s.finalizePlan(ctx, planByDay, schedule)
	return &CoachStudentProgramsResponse{
		WorkoutProgramID: program.ID,
		Schedule:         schedule,
		PlanByDay:        planByDay,
	}, nil
}

func (s *coachProgramService) AssignNutritionProgram(ctx context.Context, coachID, studentID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error) {
	sub, err := s.resolveActiveSubscription(ctx, coachID, studentID)
	if err != nil {
		return nil, err
	}

	title := req.Title
	if title == "" {
		title = "برنامه غذایی"
	}
	durationWeeks := req.DurationWeeks
	if durationWeeks <= 0 {
		durationWeeks = 4
	}

	return s.createNutritionProgram(ctx, coachID, sub.ID, title, durationWeeks, req.Notes, req.PlanByDay)
}

func (s *coachProgramService) createNutritionProgram(ctx context.Context, coachID, subscriptionID uint, title string, durationWeeks int, notes string, planByDay map[string]MeDayPlanDTO) (*CoachStudentProgramsResponse, error) {
	var createdID uint
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.NutritionProgram{}).
			Where("subscription_id = ? AND is_active = ?", subscriptionID, true).
			Update("is_active", false).Error; err != nil {
			return err
		}

		var maxVersion *int
		if err := tx.Model(&models.NutritionProgram{}).
			Where("subscription_id = ?", subscriptionID).
			Select("MAX(version)").Scan(&maxVersion).Error; err != nil {
			return err
		}
		version := 1
		if maxVersion != nil {
			version = *maxVersion + 1
		}

		program := models.NutritionProgram{
			SubscriptionID: subscriptionID,
			CoachID:        coachID,
			Version:        version,
			Title:          title,
			Notes:          notes,
			DurationWeeks:  durationWeeks,
			IsActive:       true,
		}
		if err := tx.Create(&program).Error; err != nil {
			return err
		}
		createdID = program.ID

		items := planByDayToNutritionItems(planByDay)
		for i := range items {
			items[i].NutritionProgramID = program.ID
		}
		if len(items) > 0 {
			if err := tx.Create(&items).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	loadedItems, _ := s.programRepo.FindNutritionItemsByProgramID(ctx, createdID)
	resultPlan := nutritionItemsToPlanByDay(loadedItems)
	resultPlan, _ = s.finalizePlan(ctx, resultPlan, nil)
	return &CoachStudentProgramsResponse{
		NutritionProgramID: createdID,
		PlanByDay:          resultPlan,
	}, nil
}

func (s *coachProgramService) UpdateNutritionProgram(ctx context.Context, coachID, studentID, programID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error) {
	sub, err := s.resolveActiveSubscription(ctx, coachID, studentID)
	if err != nil {
		return nil, err
	}

	program, err := s.programRepo.FindNutritionProgramByID(ctx, programID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrCoachProgramNotFound
		}
		return nil, err
	}
	if program.SubscriptionID != sub.ID || program.CoachID != coachID {
		return nil, ErrCoachProgramNotFound
	}

	if req.Title != "" {
		program.Title = req.Title
	}
	if req.DurationWeeks > 0 {
		program.DurationWeeks = req.DurationWeeks
	}
	if req.Notes != "" {
		program.Notes = req.Notes
	}
	program.LastUpdatedAt = time.Now()

	if err := s.programRepo.UpdateNutritionProgram(ctx, program); err != nil {
		return nil, err
	}

	items := planByDayToNutritionItems(req.PlanByDay)
	for i := range items {
		items[i].NutritionProgramID = program.ID
	}
	if err := s.programRepo.UpsertNutritionItems(ctx, program.ID, items); err != nil {
		return nil, err
	}

	loaded, _ := s.programRepo.FindNutritionItemsByProgramID(ctx, program.ID)
	planByDay := nutritionItemsToPlanByDay(loaded)
	planByDay, _ = s.finalizePlan(ctx, planByDay, nil)
	return &CoachStudentProgramsResponse{
		NutritionProgramID: program.ID,
		PlanByDay:          planByDay,
	}, nil
}

func (s *coachProgramService) ListWorkoutTemplates(ctx context.Context) (*TemplateListResponse, error) {
	templates, err := s.templateRepo.ListWorkoutTemplates(ctx)
	if err != nil {
		return nil, err
	}
	items := make([]any, 0, len(templates))
	for _, t := range templates {
		items = append(items, WorkoutTemplateSummary{
			ID:       t.ID,
			Title:    t.Title,
			Type:     t.Type,
			Gender:   t.Gender,
			Location: t.Location,
			DayCount: t.DayCount,
			Target:   t.Target,
			Level:    t.Level,
			Injury:   t.Injury,
		})
	}
	return &TemplateListResponse{Items: items, Total: len(items)}, nil
}

func (s *coachProgramService) ListNutritionTemplates(ctx context.Context) (*TemplateListResponse, error) {
	templates, err := s.templateRepo.ListNutritionTemplates(ctx)
	if err != nil {
		return nil, err
	}
	items := make([]any, 0, len(templates))
	for _, t := range templates {
		items = append(items, NutritionTemplateSummary{
			ID:         t.ID,
			Title:      t.Title,
			Type:       t.Type,
			Gender:     t.Gender,
			Target:     t.Target,
			Limitation: t.Limitation,
			Calorie:    t.Calorie,
		})
	}
	return &TemplateListResponse{Items: items, Total: len(items)}, nil
}

func (s *coachProgramService) AssignWorkoutFromTemplate(ctx context.Context, coachID, studentID, templateID uint) (*CoachStudentProgramsResponse, error) {
	sub, err := s.resolveActiveSubscription(ctx, coachID, studentID)
	if err != nil {
		return nil, err
	}

	template, err := s.templateRepo.FindWorkoutTemplateByID(ctx, templateID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoachTemplateNotFound
		}
		return nil, err
	}

	planByDay := workoutTemplateToPlanByDay(template)
	durationWeeks := template.DayCount
	if durationWeeks <= 0 {
		durationWeeks = 4
	}

	title := strings.TrimSpace(template.Title)
	if title == "" {
		title = "برنامه تمرین"
	}

	return s.createWorkoutProgram(ctx, coachID, sub.ID, title, durationWeeks, "", planByDay)
}

func (s *coachProgramService) AssignNutritionFromTemplate(ctx context.Context, coachID, studentID, templateID uint) (*CoachStudentProgramsResponse, error) {
	sub, err := s.resolveActiveSubscription(ctx, coachID, studentID)
	if err != nil {
		return nil, err
	}

	template, err := s.templateRepo.FindNutritionTemplateByID(ctx, templateID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoachTemplateNotFound
		}
		return nil, err
	}

	planByDay := nutritionTemplateToPlanByDay(template)
	title := strings.TrimSpace(template.Title)
	if title == "" {
		title = "برنامه غذایی"
	}
	notes := strings.TrimSpace(template.Description)

	return s.createNutritionProgram(ctx, coachID, sub.ID, title, 4, notes, planByDay)
}
