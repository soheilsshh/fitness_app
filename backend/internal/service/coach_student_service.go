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
	ErrCoachStudentNotFound    = errors.New("student not found")
	ErrCoachStudentForbidden   = errors.New("student does not belong to this coach")
)

type CoachStudentDetail struct {
	AdminStudentItem
	Email               string     `json:"email"`
	HeightCm            *float64   `json:"heightCm,omitempty"`
	WeightKg            *float64   `json:"weightKg,omitempty"`
	StartDate           *time.Time `json:"startDate,omitempty"`
	DurationDays        int        `json:"durationDays,omitempty"`
	RemainingDays       int        `json:"remainingDays,omitempty"`
	SubscriptionID      uint       `json:"subscriptionId,omitempty"`
	HasWorkoutProgram   bool       `json:"hasWorkoutProgram"`
	HasNutritionProgram bool       `json:"hasNutritionProgram"`
}

type CoachStudentService interface {
	ListStudents(ctx context.Context, coachID uint, page, pageSize int, status, query string) (*AdminStudentListResponse, error)
	GetStudent(ctx context.Context, coachID, studentID uint) (*CoachStudentDetail, error)
	CanAccessStudent(ctx context.Context, coachID, studentID uint) (bool, error)
}

type coachStudentService struct {
	db          *gorm.DB
	subRepo     repository.SubscriptionRepository
	planRepo    repository.ServicePlanRepository
	programRepo repository.ProgramRepository
	authz       AuthorizationService
}

func NewCoachStudentService(
	db *gorm.DB,
	subRepo repository.SubscriptionRepository,
	planRepo repository.ServicePlanRepository,
	programRepo repository.ProgramRepository,
	authz AuthorizationService,
) CoachStudentService {
	return &coachStudentService{db: db, subRepo: subRepo, planRepo: planRepo, programRepo: programRepo, authz: authz}
}

func (s *coachStudentService) coachStudentQuery(ctx context.Context, coachID uint) *gorm.DB {
	return s.db.WithContext(ctx).Model(&models.User{}).
		Where("role = ?", models.RoleStudent).
		Where("assigned_coach_id = ? OR id IN (SELECT DISTINCT user_id FROM subscriptions WHERE coach_id = ?)", coachID, coachID)
}

func (s *coachStudentService) ListStudents(ctx context.Context, coachID uint, page, pageSize int, status, query string) (*AdminStudentListResponse, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	now := time.Now()
	db := s.coachStudentQuery(ctx, coachID)

	if q := strings.TrimSpace(query); q != "" {
		like := "%" + q + "%"
		db = db.Where("name LIKE ? OR phone LIKE ?", like, like)
	}

	switch status {
	case "active":
		db = db.Where("id IN (SELECT DISTINCT user_id FROM subscriptions WHERE coach_id = ? AND (ends_at IS NULL OR ends_at > ?))", coachID, now)
	case "pending":
		db = db.Where("id NOT IN (SELECT DISTINCT user_id FROM subscriptions WHERE coach_id = ? AND (ends_at IS NULL OR ends_at > ?))", coachID, now)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}

	var users []models.User
	offset := (page - 1) * pageSize
	if err := db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
		return nil, err
	}

	items := make([]AdminStudentItem, 0, len(users))
	for i := range users {
		item, err := s.userToStudentItem(ctx, coachID, &users[i], now)
		if err != nil {
			continue
		}
		items = append(items, *item)
	}

	return &AdminStudentListResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	}, nil
}

func (s *coachStudentService) userToStudentItem(ctx context.Context, coachID uint, u *models.User, now time.Time) (*AdminStudentItem, error) {
	status := "pending"
	sub, err := s.subRepo.FindCurrentByUserIDAndCoachID(ctx, u.ID, coachID, now)
	if err == nil && sub != nil {
		status = "active"
	} else if u.CoachStatus != "" {
		status = u.CoachStatus
	}

	planTitle := ""
	planType := "both"
	if sub != nil {
		plan, err := s.planRepo.FindByID(ctx, sub.ServicePlanID)
		if err == nil && plan != nil {
			planTitle = plan.Name
			planType = plan.Type
			if planType == "" {
				planType = "both"
			}
		}
	}

	return &AdminStudentItem{
		ID:        u.ID,
		FullName:  strings.TrimSpace(u.Name),
		Phone:     u.Phone,
		Status:    status,
		PlanTitle: planTitle,
		PlanType:  planType,
		Weekly:    []string{},
		RestDays:  []string{},
	}, nil
}

func (s *coachStudentService) CanAccessStudent(ctx context.Context, coachID, studentID uint) (bool, error) {
	if s.authz != nil {
		return s.authz.CanCoachAccessStudent(ctx, coachID, studentID)
	}
	var count int64
	err := s.coachStudentQuery(ctx, coachID).Where("id = ?", studentID).Count(&count).Error
	return count > 0, err
}

func (s *coachStudentService) GetStudent(ctx context.Context, coachID, studentID uint) (*CoachStudentDetail, error) {
	ok, err := s.CanAccessStudent(ctx, coachID, studentID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrCoachStudentForbidden
	}

	var user models.User
	if err := s.db.WithContext(ctx).First(&user, studentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrCoachStudentNotFound
		}
		return nil, err
	}

	now := time.Now()
	item, err := s.userToStudentItem(ctx, coachID, &user, now)
	if err != nil {
		return nil, err
	}

	detail := &CoachStudentDetail{
		AdminStudentItem: *item,
		Email:            user.Email,
		HeightCm:         user.HeightCm,
		WeightKg:         user.WeightKg,
	}

	sub, err := s.subRepo.FindCurrentByUserIDAndCoachID(ctx, studentID, coachID, now)
	if err == nil && sub != nil {
		detail.SubscriptionID = sub.ID
		detail.StartDate = &sub.StartsAt
		plan, err := s.planRepo.FindByID(ctx, sub.ServicePlanID)
		if err == nil && plan != nil {
			detail.DurationDays = plan.DurationDays
			if sub.EndsAt != nil && sub.EndsAt.After(now) {
				detail.RemainingDays = int(sub.EndsAt.Sub(now).Hours() / 24)
			}
		}
		if wp, err := s.programRepo.FindActiveWorkoutBySubscriptionID(ctx, sub.ID); err == nil && wp != nil {
			detail.HasWorkoutProgram = true
		}
		if np, err := s.programRepo.FindActiveNutritionBySubscriptionID(ctx, sub.ID); err == nil && np != nil {
			detail.HasNutritionProgram = true
		}
	}

	return detail, nil
}
