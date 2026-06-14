package service

import (
	"context"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

// SubscriptionWithPlan bundles a subscription with its service plan.
type SubscriptionWithPlan struct {
	Subscription *models.Subscription
	Plan         *models.ServicePlan
}

// WorkoutProgramWithItems bundles a workout program with its items.
type WorkoutProgramWithItems struct {
	Program *models.WorkoutProgram
	Items   []models.ProgramItem
}

// NutritionProgramWithItems bundles a nutrition program with its items.
type NutritionProgramWithItems struct {
	Program *models.NutritionProgram
	Items   []models.NutritionItem
}

// ProgramsCurrent holds current workout and nutrition programs.
type ProgramsCurrent struct {
	Workout   *WorkoutProgramWithItems
	Nutrition *NutritionProgramWithItems
}

// StudentService defines read operations for the student panel.
type StudentService interface {
	GetMe(ctx context.Context, userID uint) (*models.User, error)
	GetCurrentSubscription(ctx context.Context, userID uint) (*SubscriptionWithPlan, error)
	ListSubscriptions(ctx context.Context, userID uint, page, limit int) ([]SubscriptionWithPlan, error)
	GetCurrentPrograms(ctx context.Context, userID uint) (*ProgramsCurrent, error)
}

type studentService struct {
	userRepo         repository.UserRepository
	subRepo          repository.SubscriptionRepository
	planRepo         repository.ServicePlanRepository
	programRepo      repository.ProgramRepository
}

func NewStudentService(
	userRepo repository.UserRepository,
	subRepo repository.SubscriptionRepository,
	planRepo repository.ServicePlanRepository,
	programRepo repository.ProgramRepository,
) StudentService {
	return &studentService{
		userRepo:    userRepo,
		subRepo:     subRepo,
		planRepo:    planRepo,
		programRepo: programRepo,
	}
}

func (s *studentService) GetMe(ctx context.Context, userID uint) (*models.User, error) {
	return s.userRepo.FindByID(ctx, userID)
}

func (s *studentService) GetCurrentSubscription(ctx context.Context, userID uint) (*SubscriptionWithPlan, error) {
	now := time.Now()
	sub, err := s.subRepo.FindCurrentByUserID(ctx, userID, now)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	plan, err := s.planRepo.FindByID(ctx, sub.ServicePlanID)
	if err != nil {
		return nil, err
	}

	return &SubscriptionWithPlan{
		Subscription: sub,
		Plan:         plan,
	}, nil
}

func (s *studentService) ListSubscriptions(ctx context.Context, userID uint, page, limit int) ([]SubscriptionWithPlan, error) {
	subs, err := s.subRepo.FindByUserIDPaginated(ctx, userID, page, limit)
	if err != nil {
		return nil, err
	}

	result := make([]SubscriptionWithPlan, 0, len(subs))
	for i := range subs {
		sub := subs[i]
		plan, err := s.planRepo.FindByID(ctx, sub.ServicePlanID)
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				// Skip subscriptions pointing to missing plans
				continue
			}
			return nil, err
		}
		result = append(result, SubscriptionWithPlan{
			Subscription: &sub,
			Plan:         plan,
		})
	}
	return result, nil
}

func (s *studentService) GetCurrentPrograms(ctx context.Context, userID uint) (*ProgramsCurrent, error) {
	now := time.Now()
	sub, err := s.subRepo.FindCurrentByUserID(ctx, userID, now)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// No active subscription, thus no programs
			return &ProgramsCurrent{}, nil
		}
		return nil, err
	}

	var workoutWithItems *WorkoutProgramWithItems
	workoutProgram, err := s.programRepo.FindActiveWorkoutBySubscriptionID(ctx, sub.ID)
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, err
	}
	if err == nil && workoutProgram != nil {
		items, err := s.programRepo.FindWorkoutItemsByProgramID(ctx, workoutProgram.ID)
		if err != nil {
			return nil, err
		}
		workoutWithItems = &WorkoutProgramWithItems{
			Program: workoutProgram,
			Items:   items,
		}
	}

	var nutritionWithItems *NutritionProgramWithItems
	nutritionProgram, err := s.programRepo.FindActiveNutritionBySubscriptionID(ctx, sub.ID)
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, err
	}
	if err == nil && nutritionProgram != nil {
		items, err := s.programRepo.FindNutritionItemsByProgramID(ctx, nutritionProgram.ID)
		if err != nil {
			return nil, err
		}
		nutritionWithItems = &NutritionProgramWithItems{
			Program: nutritionProgram,
			Items:   items,
		}
	}

	return &ProgramsCurrent{
		Workout:   workoutWithItems,
		Nutrition: nutritionWithItems,
	}, nil
}

