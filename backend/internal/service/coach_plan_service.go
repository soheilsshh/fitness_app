package service

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var ErrCoachPlanNotFound = errors.New("plan not found")

type CoachPlanService interface {
	ListPlans(ctx context.Context, coachID uint, page, pageSize int, query, tag string) (*AdminPlanListResponse, error)
	GetPlanByID(ctx context.Context, coachID, planID uint) (*AdminPlanDetail, error)
	CreatePlan(ctx context.Context, coachID uint, req *AdminPlanCreateRequest) (*AdminPlanDetail, error)
	UpdatePlan(ctx context.Context, coachID, planID uint, req *AdminPlanUpdateRequest) (*AdminPlanDetail, error)
	DeletePlan(ctx context.Context, coachID, planID uint) error
}

type coachPlanService struct {
	planRepo repository.ServicePlanRepository
}

func NewCoachPlanService(planRepo repository.ServicePlanRepository) CoachPlanService {
	return &coachPlanService{planRepo: planRepo}
}

func (s *coachPlanService) ListPlans(ctx context.Context, coachID uint, page, pageSize int, query, tag string) (*AdminPlanListResponse, error) {
	plans, total, err := s.planRepo.ListByCoachID(ctx, coachID, page, pageSize, query, tag)
	if err != nil {
		return nil, err
	}
	items := make([]AdminPlanItem, 0, len(plans))
	for i := range plans {
		items = append(items, planToItem(&plans[i]))
	}
	return &AdminPlanListResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	}, nil
}

func (s *coachPlanService) GetPlanByID(ctx context.Context, coachID, planID uint) (*AdminPlanDetail, error) {
	p, err := s.planRepo.FindByIDAndCoachID(ctx, planID, coachID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoachPlanNotFound
		}
		return nil, err
	}
	detail := planToDetail(p)
	return &detail, nil
}

func (s *coachPlanService) CreatePlan(ctx context.Context, coachID uint, req *AdminPlanCreateRequest) (*AdminPlanDetail, error) {
	planType := req.PlanType
	if planType == "" {
		planType = "both"
	}
	plan := &models.ServicePlan{
		CoachID:            coachID,
		Name:               req.Title,
		Subtitle:           req.Subtitle,
		CourseName:         req.CourseName,
		Description:        req.Description,
		FeaturesText:       req.FeaturesText,
		Type:               planType,
		PriceCents:         req.Price,
		DiscountPriceCents: req.DiscountPrice,
		DiscountPercent:    req.DiscountPercent,
		DurationDays:       req.DurationDays,
		IsPopular:          req.IsPopular,
		IsActive:           true,
	}
	if plan.DurationDays <= 0 {
		plan.DurationDays = 30
	}
	if err := s.planRepo.Create(ctx, plan); err != nil {
		return nil, err
	}
	detail := planToDetail(plan)
	return &detail, nil
}

func (s *coachPlanService) UpdatePlan(ctx context.Context, coachID, planID uint, req *AdminPlanUpdateRequest) (*AdminPlanDetail, error) {
	p, err := s.planRepo.FindByIDAndCoachID(ctx, planID, coachID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoachPlanNotFound
		}
		return nil, err
	}
	if req.Title != nil {
		p.Name = *req.Title
	}
	if req.Subtitle != nil {
		p.Subtitle = *req.Subtitle
	}
	if req.CourseName != nil {
		p.CourseName = *req.CourseName
	}
	if req.Description != nil {
		p.Description = *req.Description
	}
	if req.FeaturesText != nil {
		p.FeaturesText = *req.FeaturesText
	}
	if req.PlanType != nil {
		p.Type = *req.PlanType
	}
	if req.Price != nil {
		p.PriceCents = *req.Price
	}
	if req.DiscountPrice != nil {
		p.DiscountPriceCents = *req.DiscountPrice
	}
	if req.DiscountPercent != nil {
		p.DiscountPercent = *req.DiscountPercent
	}
	if req.DurationDays != nil {
		p.DurationDays = *req.DurationDays
	}
	if req.IsPopular != nil {
		p.IsPopular = *req.IsPopular
	}
	if err := s.planRepo.Update(ctx, p); err != nil {
		return nil, err
	}
	detail := planToDetail(p)
	return &detail, nil
}

func (s *coachPlanService) DeletePlan(ctx context.Context, coachID, planID uint) error {
	if _, err := s.planRepo.FindByIDAndCoachID(ctx, planID, coachID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrCoachPlanNotFound
		}
		return err
	}
	return s.planRepo.Delete(ctx, planID)
}
