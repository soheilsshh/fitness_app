package service

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/repository"
)

var ErrAdminNoActiveSubscription = errors.New("student has no active subscription")

// AdminProgramService lets super-admin manage student workout/nutrition programs
// by resolving the coach from the student's active subscription and delegating
// to CoachProgramService.
type AdminProgramService interface {
	GetStudentPrograms(ctx context.Context, studentID uint) (*CoachStudentProgramsResponse, error)
	AssignWorkoutProgram(ctx context.Context, studentID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error)
	UpdateWorkoutProgram(ctx context.Context, studentID, programID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error)
	AssignNutritionProgram(ctx context.Context, studentID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error)
	UpdateNutritionProgram(ctx context.Context, studentID, programID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error)
	AssignWorkoutFromTemplate(ctx context.Context, studentID, templateID uint) (*CoachStudentProgramsResponse, error)
	AssignNutritionFromTemplate(ctx context.Context, studentID, templateID uint) (*CoachStudentProgramsResponse, error)
	ListWorkoutTemplates(ctx context.Context) (*TemplateListResponse, error)
	ListNutritionTemplates(ctx context.Context) (*TemplateListResponse, error)
}

type adminProgramService struct {
	subRepo         repository.SubscriptionRepository
	coachProgramSvc CoachProgramService
}

func NewAdminProgramService(subRepo repository.SubscriptionRepository, coachProgramSvc CoachProgramService) AdminProgramService {
	return &adminProgramService{subRepo: subRepo, coachProgramSvc: coachProgramSvc}
}

func (s *adminProgramService) resolveCoachID(ctx context.Context, studentID uint) (uint, error) {
	sub, err := s.subRepo.FindCurrentByUserID(ctx, studentID, time.Now())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, ErrAdminNoActiveSubscription
		}
		return 0, err
	}
	if sub.CoachID == 0 {
		return 0, ErrAdminNoActiveSubscription
	}
	return sub.CoachID, nil
}

func (s *adminProgramService) GetStudentPrograms(ctx context.Context, studentID uint) (*CoachStudentProgramsResponse, error) {
	coachID, err := s.resolveCoachID(ctx, studentID)
	if err != nil {
		if errors.Is(err, ErrAdminNoActiveSubscription) {
			return &CoachStudentProgramsResponse{PlanByDay: map[string]MeDayPlanDTO{}}, nil
		}
		return nil, err
	}
	return s.coachProgramSvc.GetStudentPrograms(ctx, coachID, studentID)
}

func (s *adminProgramService) AssignWorkoutProgram(ctx context.Context, studentID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error) {
	coachID, err := s.resolveCoachID(ctx, studentID)
	if err != nil {
		return nil, err
	}
	return s.coachProgramSvc.AssignWorkoutProgram(ctx, coachID, studentID, req)
}

func (s *adminProgramService) UpdateWorkoutProgram(ctx context.Context, studentID, programID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error) {
	coachID, err := s.resolveCoachID(ctx, studentID)
	if err != nil {
		return nil, err
	}
	return s.coachProgramSvc.UpdateWorkoutProgram(ctx, coachID, studentID, programID, req)
}

func (s *adminProgramService) AssignNutritionProgram(ctx context.Context, studentID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error) {
	coachID, err := s.resolveCoachID(ctx, studentID)
	if err != nil {
		return nil, err
	}
	return s.coachProgramSvc.AssignNutritionProgram(ctx, coachID, studentID, req)
}

func (s *adminProgramService) UpdateNutritionProgram(ctx context.Context, studentID, programID uint, req *ProgramAssignRequest) (*CoachStudentProgramsResponse, error) {
	coachID, err := s.resolveCoachID(ctx, studentID)
	if err != nil {
		return nil, err
	}
	return s.coachProgramSvc.UpdateNutritionProgram(ctx, coachID, studentID, programID, req)
}

func (s *adminProgramService) AssignWorkoutFromTemplate(ctx context.Context, studentID, templateID uint) (*CoachStudentProgramsResponse, error) {
	coachID, err := s.resolveCoachID(ctx, studentID)
	if err != nil {
		return nil, err
	}
	return s.coachProgramSvc.AssignWorkoutFromTemplate(ctx, coachID, studentID, templateID)
}

func (s *adminProgramService) AssignNutritionFromTemplate(ctx context.Context, studentID, templateID uint) (*CoachStudentProgramsResponse, error) {
	coachID, err := s.resolveCoachID(ctx, studentID)
	if err != nil {
		return nil, err
	}
	return s.coachProgramSvc.AssignNutritionFromTemplate(ctx, coachID, studentID, templateID)
}

func (s *adminProgramService) ListWorkoutTemplates(ctx context.Context) (*TemplateListResponse, error) {
	return s.coachProgramSvc.ListWorkoutTemplates(ctx, 0, 0, "")
}

func (s *adminProgramService) ListNutritionTemplates(ctx context.Context) (*TemplateListResponse, error) {
	return s.coachProgramSvc.ListNutritionTemplates(ctx, 0, 0, "")
}
