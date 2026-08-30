package service

import (
	"context"
	"errors"
	"log"
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
	// ErrCoachApproveNotAI is returned when a coach tries to "approve" a
	// program that wasn't AI-generated — approval only makes sense for AI
	// content, since coach-authored programs are already official.
	ErrCoachApproveNotAI = errors.New("only ai-generated programs can be approved")
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
	Items    []any `json:"items"`
	Total    int   `json:"total"`
	Page     int   `json:"page,omitempty"`
	PageSize int   `json:"pageSize,omitempty"`
}

type CoachProgramService interface {
	GetStudentPrograms(ctx context.Context, coachID, studentID uint) (*CoachStudentProgramsResponse, error)
	AssignWorkoutProgram(ctx context.Context, coachID, studentID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error)
	UpdateWorkoutProgram(ctx context.Context, coachID, studentID, programID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error)
	AssignNutritionProgram(ctx context.Context, coachID, studentID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error)
	UpdateNutritionProgram(ctx context.Context, coachID, studentID, programID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error)
	ListWorkoutTemplates(ctx context.Context, page, pageSize int, query string) (*TemplateListResponse, error)
	ListNutritionTemplates(ctx context.Context, page, pageSize int, query string) (*TemplateListResponse, error)
	GetWorkoutTemplate(ctx context.Context, id uint) (*AdminWorkoutTemplateDetail, error)
	GetNutritionTemplate(ctx context.Context, id uint) (*AdminNutritionTemplateDetail, error)
	AssignWorkoutFromTemplate(ctx context.Context, coachID, studentID, templateID uint) (*CoachStudentProgramsResponse, error)
	AssignNutritionFromTemplate(ctx context.Context, coachID, studentID, templateID uint) (*CoachStudentProgramsResponse, error)
	// ApproveWorkoutProgram / ApproveNutritionProgram let a coach mark an
	// AI-generated program as reviewed. Nutrition approval also activates it
	// as the student's live program.
	ApproveWorkoutProgram(ctx context.Context, coachID, studentID, programID uint) error
	ApproveNutritionProgram(ctx context.Context, coachID, studentID, programID uint) error
	// ListStudentPrograms returns every saved version (active + inactive pool)
	// of a student's workout/nutrition programs, for the coach's "approve"
	// list view.
	ListStudentWorkoutPrograms(ctx context.Context, coachID, studentID uint) ([]ProgramVersionDTO, error)
	ListStudentNutritionPrograms(ctx context.Context, coachID, studentID uint) ([]ProgramVersionDTO, error)
}

// ProgramVersionDTO is one saved WorkoutProgram/NutritionProgram version —
// active or pooled — for the student's "my saved plans" list and the coach's
// approve list.
type ProgramVersionDTO struct {
	ID            uint      `json:"id"`
	Title         string    `json:"title"`
	Source        string    `json:"source"` // coach | ai
	Status        string    `json:"status"` // official | coach_approved
	DurationWeeks int       `json:"durationWeeks"`
	IsActive      bool      `json:"isActive"`
	CreatedAt     time.Time `json:"createdAt"`
}

type coachProgramService struct {
	db              *gorm.DB
	subRepo         repository.SubscriptionRepository
	programRepo     repository.ProgramRepository
	templateRepo    repository.TemplateRepository
	exerciseRepo    repository.ExerciseRepository
	foodRepo        repository.FoodRepository
	coachStudentSvc CoachStudentService
	achievementSvc  AchievementService
}

func NewCoachProgramService(
	db *gorm.DB,
	subRepo repository.SubscriptionRepository,
	programRepo repository.ProgramRepository,
	templateRepo repository.TemplateRepository,
	exerciseRepo repository.ExerciseRepository,
	foodRepo repository.FoodRepository,
	coachStudentSvc CoachStudentService,
	achievementSvc AchievementService,
) CoachProgramService {
	return &coachProgramService{
		db:              db,
		subRepo:         subRepo,
		programRepo:     programRepo,
		templateRepo:    templateRepo,
		exerciseRepo:    exerciseRepo,
		foodRepo:        foodRepo,
		coachStudentSvc: coachStudentSvc,
		achievementSvc:  achievementSvc,
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
	var nutritionCaloriesTarget int
	var nutritionProteinTarget string
	if np, err := s.programRepo.FindActiveNutritionBySubscriptionID(ctx, sub.ID); err == nil && np != nil {
		resp.NutritionProgramID = np.ID
		nutritionItems, _ = s.programRepo.FindNutritionItemsByProgramID(ctx, np.ID)
		nutritionCaloriesTarget = np.CaloriesTarget
		nutritionProteinTarget = np.ProteinTarget
	}

	planByDay, schedule := buildFullPlanByDay(workoutItems, nutritionItems)
	planByDay, schedule = s.finalizePlan(ctx, planByDay, schedule)
	planByDay = applyNutritionProgramTargets(planByDay, nutritionCaloriesTarget, nutritionProteinTarget)
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

	resp, err := s.createWorkoutProgram(ctx, coachID, sub.ID, title, durationWeeks, req.Notes, req.PlanByDay, models.ProgramSourceCoach, models.ProgramStatusOfficial)
	if err != nil {
		return nil, err
	}
	s.notifyStudentProgramReady(ctx, studentID)
	return resp, nil
}

func (s *coachProgramService) createWorkoutProgram(ctx context.Context, coachID, subscriptionID uint, title string, durationWeeks int, notes string, planByDay map[string]MeDayPlanDTO, source, status string) (*CoachStudentProgramsResponse, error) {
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
			Source:         source,
			Status:         status,
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

	resp, err := s.createNutritionProgram(ctx, coachID, sub.ID, title, durationWeeks, req.Notes, req.PlanByDay, models.ProgramSourceCoach, models.ProgramStatusOfficial)
	if err != nil {
		return nil, err
	}
	s.notifyStudentProgramReady(ctx, studentID)
	return resp, nil
}

func (s *coachProgramService) createNutritionProgram(ctx context.Context, coachID, subscriptionID uint, title string, durationWeeks int, notes string, planByDay map[string]MeDayPlanDTO, source, status string) (*CoachStudentProgramsResponse, error) {
	planByDay = enrichNutritionPlan(ctx, s.foodRepo, planByDay)
	caloriesTarget, proteinTarget := extractNutritionTargetsFromPlan(planByDay)

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
			CaloriesTarget: caloriesTarget,
			ProteinTarget:  proteinTarget,
			Source:         source,
			Status:         status,
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
	resultPlan = applyNutritionProgramTargets(resultPlan, caloriesTarget, proteinTarget)
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
	planByDayInput := enrichNutritionPlan(ctx, s.foodRepo, req.PlanByDay)
	caloriesTarget, proteinTarget := extractNutritionTargetsFromPlan(planByDayInput)
	program.CaloriesTarget = caloriesTarget
	program.ProteinTarget = proteinTarget
	program.LastUpdatedAt = time.Now()

	if err := s.programRepo.UpdateNutritionProgram(ctx, program); err != nil {
		return nil, err
	}

	items := planByDayToNutritionItems(planByDayInput)
	for i := range items {
		items[i].NutritionProgramID = program.ID
	}
	if err := s.programRepo.UpsertNutritionItems(ctx, program.ID, items); err != nil {
		return nil, err
	}

	loaded, _ := s.programRepo.FindNutritionItemsByProgramID(ctx, program.ID)
	planByDay := nutritionItemsToPlanByDay(loaded)
	planByDay, _ = s.finalizePlan(ctx, planByDay, nil)
	planByDay = applyNutritionProgramTargets(planByDay, caloriesTarget, proteinTarget)
	return &CoachStudentProgramsResponse{
		NutritionProgramID: program.ID,
		PlanByDay:          planByDay,
	}, nil
}

func (s *coachProgramService) ListWorkoutTemplates(ctx context.Context, page, pageSize int, query string) (*TemplateListResponse, error) {
	// Legacy picker: no pagination → full list
	if page <= 0 && pageSize <= 0 && strings.TrimSpace(query) == "" {
		templates, err := s.templateRepo.ListWorkoutTemplates(ctx)
		if err != nil {
			return nil, err
		}
		items := make([]any, 0, len(templates))
		for _, t := range templates {
			items = append(items, WorkoutTemplateSummary{
				ID: t.ID, Title: t.Title, Type: t.Type, Gender: t.Gender,
				Location: t.Location, DayCount: t.DayCount, Target: t.Target,
				Level: t.Level, Injury: t.Injury,
			})
		}
		return &TemplateListResponse{Items: items, Total: len(items)}, nil
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	templates, total, err := s.templateRepo.ListWorkoutTemplatesPaged(ctx, page, pageSize, query)
	if err != nil {
		return nil, err
	}
	items := make([]any, 0, len(templates))
	for _, t := range templates {
		var c int64
		_ = s.db.WithContext(ctx).Model(&models.TemplateProgramItem{}).
			Where("workout_template_id = ?", t.ID).Count(&c)
		items = append(items, AdminWorkoutTemplateSummary{
			ID: t.ID, Title: t.Title, Type: t.Type, Gender: t.Gender,
			Location: t.Location, DayCount: t.DayCount, Target: t.Target,
			Level: t.Level, Injury: t.Injury, ItemCount: int(c),
		})
	}
	return &TemplateListResponse{Items: items, Total: int(total), Page: page, PageSize: pageSize}, nil
}

func (s *coachProgramService) ListNutritionTemplates(ctx context.Context, page, pageSize int, query string) (*TemplateListResponse, error) {
	if page <= 0 && pageSize <= 0 && strings.TrimSpace(query) == "" {
		templates, err := s.templateRepo.ListNutritionTemplates(ctx)
		if err != nil {
			return nil, err
		}
		items := make([]any, 0, len(templates))
		for _, t := range templates {
			items = append(items, NutritionTemplateSummary{
				ID: t.ID, Title: t.Title, Type: t.Type, Gender: t.Gender,
				Target: t.Target, Limitation: t.Limitation, Calorie: t.Calorie,
			})
		}
		return &TemplateListResponse{Items: items, Total: len(items)}, nil
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	templates, total, err := s.templateRepo.ListNutritionTemplatesPaged(ctx, page, pageSize, query)
	if err != nil {
		return nil, err
	}
	items := make([]any, 0, len(templates))
	for _, t := range templates {
		var c int64
		_ = s.db.WithContext(ctx).Model(&models.TemplateMeal{}).
			Where("nutrition_template_id = ?", t.ID).Count(&c)
		items = append(items, AdminNutritionTemplateSummary{
			ID: t.ID, Title: t.Title, Type: t.Type, Gender: t.Gender,
			Target: t.Target, Limitation: t.Limitation, Calorie: t.Calorie,
			IsPro: t.IsPro, MealCount: int(c),
		})
	}
	return &TemplateListResponse{Items: items, Total: int(total), Page: page, PageSize: pageSize}, nil
}

func (s *coachProgramService) GetWorkoutTemplate(ctx context.Context, id uint) (*AdminWorkoutTemplateDetail, error) {
	t, err := s.templateRepo.FindWorkoutTemplateByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoachTemplateNotFound
		}
		return nil, err
	}
	return workoutTemplateToDetail(ctx, s.exerciseRepo, t), nil
}

func (s *coachProgramService) GetNutritionTemplate(ctx context.Context, id uint) (*AdminNutritionTemplateDetail, error) {
	t, err := s.templateRepo.FindNutritionTemplateByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoachTemplateNotFound
		}
		return nil, err
	}
	return nutritionTemplateToDetail(t), nil
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

	resp, err := s.createWorkoutProgram(ctx, coachID, sub.ID, title, durationWeeks, "", planByDay, models.ProgramSourceCoach, models.ProgramStatusOfficial)
	if err != nil {
		return nil, err
	}
	s.notifyStudentProgramReady(ctx, studentID)
	return resp, nil
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

	resp, err := s.createNutritionProgram(ctx, coachID, sub.ID, title, 4, notes, planByDay, models.ProgramSourceCoach, models.ProgramStatusOfficial)
	if err != nil {
		return nil, err
	}
	s.notifyStudentProgramReady(ctx, studentID)
	return resp, nil
}

func (s *coachProgramService) ApproveWorkoutProgram(ctx context.Context, coachID, studentID, programID uint) error {
	sub, err := s.resolveActiveSubscription(ctx, coachID, studentID)
	if err != nil {
		return err
	}
	program, err := s.programRepo.FindWorkoutProgramByID(ctx, programID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return ErrCoachProgramNotFound
		}
		return err
	}
	if program.SubscriptionID != sub.ID {
		return ErrCoachProgramNotFound
	}
	if program.Source != models.ProgramSourceAI {
		return ErrCoachApproveNotAI
	}
	program.Status = models.ProgramStatusCoachApproved
	if err := s.programRepo.UpdateWorkoutProgram(ctx, program); err != nil {
		return err
	}
	if s.achievementSvc != nil {
		s.achievementSvc.HandleAIProgramApproved(ctx, studentID)
	}
	return nil
}

func (s *coachProgramService) ApproveNutritionProgram(ctx context.Context, coachID, studentID, programID uint) error {
	sub, err := s.resolveActiveSubscription(ctx, coachID, studentID)
	if err != nil {
		return err
	}
	program, err := s.programRepo.FindNutritionProgramByID(ctx, programID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return ErrCoachProgramNotFound
		}
		return err
	}
	if program.SubscriptionID != sub.ID {
		return ErrCoachProgramNotFound
	}
	if program.Source != models.ProgramSourceAI {
		return ErrCoachApproveNotAI
	}
	program.Status = models.ProgramStatusCoachApproved
	if err := s.programRepo.UpdateNutritionProgram(ctx, program); err != nil {
		return err
	}
	if err := s.programRepo.SetNutritionProgramActive(ctx, program.ID, true); err != nil {
		return err
	}
	if s.achievementSvc != nil {
		s.achievementSvc.HandleAIProgramApproved(ctx, studentID)
	}
	return nil
}

func (s *coachProgramService) ListStudentWorkoutPrograms(ctx context.Context, coachID, studentID uint) ([]ProgramVersionDTO, error) {
	sub, err := s.resolveActiveSubscription(ctx, coachID, studentID)
	if err != nil {
		if errors.Is(err, ErrCoachNoActiveSubscription) {
			return []ProgramVersionDTO{}, nil
		}
		return nil, err
	}
	programs, err := s.programRepo.ListWorkoutProgramsBySubscriptionID(ctx, sub.ID)
	if err != nil {
		return nil, err
	}
	out := make([]ProgramVersionDTO, 0, len(programs))
	for _, p := range programs {
		out = append(out, ProgramVersionDTO{
			ID: p.ID, Title: p.Title, Source: p.Source, Status: p.Status,
			DurationWeeks: p.DurationWeeks, IsActive: p.IsActive, CreatedAt: p.CreatedAt,
		})
	}
	return out, nil
}

func (s *coachProgramService) ListStudentNutritionPrograms(ctx context.Context, coachID, studentID uint) ([]ProgramVersionDTO, error) {
	sub, err := s.resolveActiveSubscription(ctx, coachID, studentID)
	if err != nil {
		if errors.Is(err, ErrCoachNoActiveSubscription) {
			return []ProgramVersionDTO{}, nil
		}
		return nil, err
	}
	programs, err := s.programRepo.ListNutritionProgramsBySubscriptionID(ctx, sub.ID)
	if err != nil {
		return nil, err
	}
	out := make([]ProgramVersionDTO, 0, len(programs))
	for _, p := range programs {
		out = append(out, ProgramVersionDTO{
			ID: p.ID, Title: p.Title, Source: p.Source, Status: p.Status,
			DurationWeeks: p.DurationWeeks, IsActive: p.IsActive, CreatedAt: p.CreatedAt,
		})
	}
	return out, nil
}

func (s *coachProgramService) notifyStudentProgramReady(ctx context.Context, studentID uint) {
	if studentID == 0 {
		return
	}
	var user models.User
	if err := s.db.WithContext(ctx).First(&user, studentID).Error; err != nil {
		return
	}
	n := &models.Notification{
		UserID:  user.ID,
		Type:    models.NotificationTypeProgramUpdated,
		Title:   "برنامه شما آماده است",
		Message: "برنامه اختصاصی شما توسط مربی آماده شده و می‌توانید آن را در پنل کاربری ببینید.",
	}
	if err := s.db.WithContext(ctx).Create(n).Error; err != nil {
		log.Printf("notify: create program_ready notification failed user=%d err=%v", user.ID, err)
	}
	if err := SendProgramReadySMS(user.Phone, user.Name); err != nil {
		log.Printf("sms: program ready failed phone=%s err=%v", user.Phone, err)
	}
}
