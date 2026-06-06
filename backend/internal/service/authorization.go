package service

import (
	"context"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

type AuthorizationService interface {
	CanCoachAccessStudent(ctx context.Context, coachID, studentID uint) (bool, error)
	CanCoachAccessPlan(ctx context.Context, coachID, planID uint) (bool, error)
}

type authorizationService struct {
	db       *gorm.DB
	planRepo repository.ServicePlanRepository
}

func NewAuthorizationService(db *gorm.DB, planRepo repository.ServicePlanRepository) AuthorizationService {
	return &authorizationService{db: db, planRepo: planRepo}
}

func (s *authorizationService) CanCoachAccessStudent(ctx context.Context, coachID, studentID uint) (bool, error) {
	var count int64
	err := s.db.WithContext(ctx).Model(&models.User{}).
		Where("id = ? AND role = ?", studentID, models.RoleStudent).
		Where("assigned_coach_id = ? OR id IN (SELECT DISTINCT user_id FROM subscriptions WHERE coach_id = ?)", coachID, coachID).
		Count(&count).Error
	return count > 0, err
}

func (s *authorizationService) CanCoachAccessPlan(ctx context.Context, coachID, planID uint) (bool, error) {
	plan, err := s.planRepo.FindByID(ctx, planID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return false, nil
		}
		return false, err
	}
	return plan.CoachID == coachID, nil
}
