package service

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

// AdminPlanItem matches frontend PlansClient / PlanRow (list item).
type AdminPlanItem struct {
	ID              uint      `json:"id"`
	Title           string    `json:"title"`
	Subtitle        string    `json:"subtitle"`
	CourseName      string    `json:"courseName"`
	FeaturesText    string    `json:"featuresText"`
	PlanType        string    `json:"planType"`
	Price           int64     `json:"price"`
	DiscountPrice   int64     `json:"discountPrice"`
	DiscountPercent int       `json:"discountPercent"`
	DurationDays    int       `json:"durationDays"`
	IsPopular       bool      `json:"isPopular"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// AdminPlanDetail is same shape for GET by id (frontend PlanDetailsClient / PlanForm).
type AdminPlanDetail struct {
	ID              uint      `json:"id"`
	Title           string    `json:"title"`
	Subtitle        string    `json:"subtitle"`
	CourseName      string    `json:"courseName"`
	Description     string   `json:"description"`
	FeaturesText    string    `json:"featuresText"`
	PlanType        string    `json:"planType"`
	Price           int64     `json:"price"`
	DiscountPrice   int64     `json:"discountPrice"`
	DiscountPercent int       `json:"discountPercent"`
	DurationDays    int       `json:"durationDays"`
	IsPopular       bool      `json:"isPopular"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// AdminPlanListResponse for GET /admin/plans.
type AdminPlanListResponse struct {
	Items    []AdminPlanItem `json:"items"`
	Page     int             `json:"page"`
	PageSize int             `json:"pageSize"`
	Total    int64           `json:"total"`
}

// AdminPlanCreateRequest for POST /admin/plans (body from PlanForm).
type AdminPlanCreateRequest struct {
	Title           string `json:"title"`
	Subtitle        string `json:"subtitle"`
	CourseName      string `json:"courseName"`
	Description     string `json:"description"`
	FeaturesText    string `json:"featuresText"`
	PlanType        string `json:"planType"` // workout | nutrition | both
	Price           int64  `json:"price"`
	DiscountPrice   int64  `json:"discountPrice"`
	DiscountPercent int    `json:"discountPercent"`
	DurationDays    int    `json:"durationDays"`
	IsPopular       bool   `json:"isPopular"`
}

// AdminPlanUpdateRequest for PATCH /admin/plans/:id (partial; same fields as create).
type AdminPlanUpdateRequest struct {
	Title           *string `json:"title"`
	Subtitle        *string `json:"subtitle"`
	CourseName      *string `json:"courseName"`
	Description     *string `json:"description"`
	FeaturesText    *string `json:"featuresText"`
	PlanType        *string `json:"planType"`
	Price           *int64  `json:"price"`
	DiscountPrice   *int64  `json:"discountPrice"`
	DiscountPercent *int    `json:"discountPercent"`
	DurationDays    *int    `json:"durationDays"`
	IsPopular       *bool   `json:"isPopular"`
}

type AdminPlanService interface {
	ListPlans(ctx context.Context, page, pageSize int, query, tag string) (*AdminPlanListResponse, error)
	GetPlanByID(ctx context.Context, id uint) (*AdminPlanDetail, error)
	CreatePlan(ctx context.Context, req *AdminPlanCreateRequest) (*AdminPlanDetail, error)
	UpdatePlan(ctx context.Context, id uint, req *AdminPlanUpdateRequest) (*AdminPlanDetail, error)
	DeletePlan(ctx context.Context, id uint) error
}

type adminPlanService struct {
	planRepo repository.ServicePlanRepository
}

func NewAdminPlanService(planRepo repository.ServicePlanRepository) AdminPlanService {
	return &adminPlanService{planRepo: planRepo}
}

func planToItem(p *models.ServicePlan) AdminPlanItem {
	return AdminPlanItem{
		ID:              p.ID,
		Title:           p.Name,
		Subtitle:        p.Subtitle,
		CourseName:      p.CourseName,
		FeaturesText:    p.FeaturesText,
		PlanType:        p.Type,
		Price:           p.PriceCents,
		DiscountPrice:   p.DiscountPriceCents,
		DiscountPercent: p.DiscountPercent,
		DurationDays:    p.DurationDays,
		IsPopular:       p.IsPopular,
		CreatedAt:       p.CreatedAt,
		UpdatedAt:       p.UpdatedAt,
	}
}

func planToDetail(p *models.ServicePlan) AdminPlanDetail {
	return AdminPlanDetail{
		ID:              p.ID,
		Title:           p.Name,
		Subtitle:        p.Subtitle,
		CourseName:      p.CourseName,
		Description:     p.Description,
		FeaturesText:    p.FeaturesText,
		PlanType:        p.Type,
		Price:           p.PriceCents,
		DiscountPrice:   p.DiscountPriceCents,
		DiscountPercent: p.DiscountPercent,
		DurationDays:    p.DurationDays,
		IsPopular:       p.IsPopular,
		CreatedAt:       p.CreatedAt,
		UpdatedAt:       p.UpdatedAt,
	}
}

func (s *adminPlanService) ListPlans(ctx context.Context, page, pageSize int, query, tag string) (*AdminPlanListResponse, error) {
	plans, total, err := s.planRepo.List(ctx, page, pageSize, query, tag)
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

func (s *adminPlanService) GetPlanByID(ctx context.Context, id uint) (*AdminPlanDetail, error) {
	p, err := s.planRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	detail := planToDetail(p)
	return &detail, nil
}

func (s *adminPlanService) CreatePlan(ctx context.Context, req *AdminPlanCreateRequest) (*AdminPlanDetail, error) {
	planType := req.PlanType
	if planType == "" {
		planType = "both"
	}
	plan := &models.ServicePlan{
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

func (s *adminPlanService) UpdatePlan(ctx context.Context, id uint, req *AdminPlanUpdateRequest) (*AdminPlanDetail, error) {
	p, err := s.planRepo.FindByID(ctx, id)
	if err != nil {
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

func (s *adminPlanService) DeletePlan(ctx context.Context, id uint) error {
	return s.planRepo.Delete(ctx, id)
}
