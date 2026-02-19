package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

// MeProfileDTO matches frontend ProfileClient (firstName, lastName, phone, heightCm, weightKg, photos).
type MeProfileDTO struct {
	ID             uint           `json:"id"`
	FirstName      string         `json:"firstName"`
	LastName       string         `json:"lastName"`
	Phone          string         `json:"phone"`
	Email          string         `json:"email"`
	HeightCm       *float64       `json:"heightCm,omitempty"`
	WeightKg       *float64       `json:"weightKg,omitempty"`
	Photos         []MePhotoDTO   `json:"photos"`
	ProgramsCount  int64          `json:"programsCount"`
	OrdersCount    int64          `json:"ordersCount"`
	CreatedAt      time.Time      `json:"createdAt"`
}

type MePhotoDTO struct {
	ID   uint   `json:"id"`
	URL  string `json:"url"`
	Name string `json:"name"`
}

// MeProfileUpdateRequest for PATCH /me.
type MeProfileUpdateRequest struct {
	FirstName *string  `json:"firstName"`
	LastName  *string  `json:"lastName"`
	HeightCm  *float64 `json:"heightCm"`
	WeightKg  *float64 `json:"weightKg"`
}

// MeOrderItemDTO for order items (type, refId, title, qty, price).
type MeOrderItemDTO struct {
	Type   string `json:"type"`
	RefID  string `json:"refId"`
	Title  string `json:"title"`
	Qty    int    `json:"qty"`
	Price  int64  `json:"price"`
}

// MeOrderDTO matches frontend OrderCardLink / OrderDetailsPanel.
type MeOrderDTO struct {
	ID              uint            `json:"id"`
	CreatedAt       time.Time       `json:"createdAt"`
	Status          string          `json:"status"`
	PaymentMethod   string          `json:"paymentMethod"`
	TrackingCode    string          `json:"trackingCode"`
	Items           []MeOrderItemDTO `json:"items"`
	DiscountPercent int             `json:"discountPercent"`
	Note            string          `json:"note"`
}

// MeOrderListResponse for GET /me/orders.
type MeOrderListResponse struct {
	Items    []MeOrderDTO `json:"items"`
	Page     int          `json:"page"`
	PageSize int          `json:"pageSize"`
	Total    int64        `json:"total"`
}

// MeProgramDTO for GET /me/programs list (id, title, type, status, startDate, durationDays, remainingDays, price).
type MeProgramDTO struct {
	ID            uint      `json:"id"`
	Title         string    `json:"title"`
	Type          string    `json:"type"`
	Status        string    `json:"status"`
	StartDate     time.Time `json:"startDate"`
	DurationDays  int       `json:"durationDays"`
	RemainingDays int       `json:"remainingDays"`
	Price         int64     `json:"price"`
}

// MeProgramsResponse for GET /me/programs.
type MeProgramsResponse struct {
	Programs []MeProgramDTO `json:"programs"`
}

// MeProgramDetailDTO for GET /me/programs/:id (with schedule, planByDay - optional).
type MeProgramDetailDTO struct {
	MeProgramDTO
	Goal       string                 `json:"goal,omitempty"`
	Level      string                 `json:"level,omitempty"`
	Coach      string                 `json:"coach,omitempty"`
	Tags       []string               `json:"tags,omitempty"`
	Schedule   *MeScheduleDTO         `json:"schedule,omitempty"`
	PlanByDay  map[string]MeDayPlanDTO `json:"planByDay,omitempty"`
}

type MeScheduleDTO struct {
	Weekly   []string `json:"weekly"`
	RestDays []string `json:"restDays"`
}

type MeDayPlanDTO struct {
	Workout  *MeWorkoutDTO  `json:"workout,omitempty"`
	Nutrition *MeNutritionDTO `json:"nutrition,omitempty"`
}

type MeWorkoutDTO struct {
	Title       string   `json:"title"`
	DurationMin int      `json:"durationMin"`
	Calories    int      `json:"calories"`
	Steps       []string `json:"steps"`
}

type MeNutritionDTO struct {
	CaloriesTarget  int           `json:"caloriesTarget"`
	ProteinTarget   string        `json:"proteinTarget"`
	Meals           []MeMealDTO  `json:"meals"`
}

type MeMealDTO struct {
	Title  string `json:"title"`
	Detail string `json:"detail"`
}

type MeService interface {
	GetProfile(ctx context.Context, userID uint) (*MeProfileDTO, error)
	UpdateProfile(ctx context.Context, userID uint, req *MeProfileUpdateRequest) (*MeProfileDTO, error)
	ListMyOrders(ctx context.Context, userID uint, page, pageSize int, status string) (*MeOrderListResponse, error)
	GetMyOrderByID(ctx context.Context, userID uint, orderID uint) (*MeOrderDTO, error)
	ListMyPrograms(ctx context.Context, userID uint) (*MeProgramsResponse, error)
	GetMyProgramByID(ctx context.Context, userID uint, programID uint) (*MeProgramDetailDTO, error)
}

type meService struct {
	db       *gorm.DB
	userRepo repository.UserRepository
	orderRepo repository.OrderRepository
	subRepo  repository.SubscriptionRepository
	planRepo repository.ServicePlanRepository
}

func NewMeService(
	db *gorm.DB,
	userRepo repository.UserRepository,
	orderRepo repository.OrderRepository,
	subRepo repository.SubscriptionRepository,
	planRepo repository.ServicePlanRepository,
) MeService {
	return &meService{db: db, userRepo: userRepo, orderRepo: orderRepo, subRepo: subRepo, planRepo: planRepo}
}

func meSplitName(name string) (first, last string) {
	parts := strings.Fields(strings.TrimSpace(name))
	if len(parts) == 0 {
		return "", ""
	}
	if len(parts) == 1 {
		return parts[0], ""
	}
	return parts[0], strings.Join(parts[1:], " ")
}

func (s *meService) GetProfile(ctx context.Context, userID uint) (*MeProfileDTO, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	first, last := meSplitName(user.Name)

	programsCount, _ := s.subRepo.CountByUserID(ctx, userID)

	var ordersCount int64
	s.db.WithContext(ctx).Model(&models.Order{}).Where("user_id = ?", userID).Count(&ordersCount)

	var photos []models.UserPhoto
	s.db.WithContext(ctx).Where("user_id = ?", userID).Order("uploaded_at DESC").Find(&photos)
	photoDTOs := make([]MePhotoDTO, 0, len(photos))
	for _, p := range photos {
		name := p.Type
		if name == "" {
			name = "Photo"
		}
		photoDTOs = append(photoDTOs, MePhotoDTO{ID: p.ID, URL: p.FilePath, Name: name})
	}

	return &MeProfileDTO{
		ID:            user.ID,
		FirstName:     first,
		LastName:      last,
		Phone:         user.Phone,
		Email:         user.Email,
		HeightCm:      user.HeightCm,
		WeightKg:      user.WeightKg,
		Photos:        photoDTOs,
		ProgramsCount: programsCount,
		OrdersCount:   ordersCount,
		CreatedAt:     user.CreatedAt,
	}, nil
}

func (s *meService) UpdateProfile(ctx context.Context, userID uint, req *MeProfileUpdateRequest) (*MeProfileDTO, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if req.FirstName != nil || req.LastName != nil {
		first := strings.TrimSpace(*req.FirstName)
		last := strings.TrimSpace(*req.LastName)
		if first != "" || last != "" {
			user.Name = strings.TrimSpace(first + " " + last)
		}
	}
	if req.HeightCm != nil {
		user.HeightCm = req.HeightCm
	}
	if req.WeightKg != nil {
		user.WeightKg = req.WeightKg
	}
	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}
	return s.GetProfile(ctx, userID)
}

func (s *meService) ListMyOrders(ctx context.Context, userID uint, page, pageSize int, status string) (*MeOrderListResponse, error) {
	orders, total, err := s.orderRepo.ListByUserID(ctx, userID, page, pageSize, status)
	if err != nil {
		return nil, err
	}
	items := make([]MeOrderDTO, 0, len(orders))
	for i := range orders {
		o := &orders[i]
		itemDTOs, _ := s.orderItemsToDTO(ctx, o.ID)
		items = append(items, MeOrderDTO{
			ID:              o.ID,
			CreatedAt:       o.CreatedAt,
			Status:          o.Status,
			PaymentMethod:   o.PaymentMethod,
			TrackingCode:    o.TrackingCode,
			Items:           itemDTOs,
			DiscountPercent: o.DiscountPercent,
			Note:            o.Note,
		})
	}
	return &MeOrderListResponse{Items: items, Page: page, PageSize: pageSize, Total: total}, nil
}

func (s *meService) orderItemsToDTO(ctx context.Context, orderID uint) ([]MeOrderItemDTO, error) {
	items, err := s.orderRepo.GetOrderItems(ctx, orderID)
	if err != nil {
		return nil, err
	}
	out := make([]MeOrderItemDTO, 0, len(items))
	for _, it := range items {
		refID := it.RefID
		if refID == "" && it.PlanID > 0 {
			refID = fmt.Sprintf("p%d", it.PlanID)
		}
		out = append(out, MeOrderItemDTO{
			Type:  it.ItemType,
			RefID: refID,
			Title: it.Title,
			Qty:   it.Qty,
			Price: it.UnitPriceCents,
		})
	}
	return out, nil
}

func (s *meService) GetMyOrderByID(ctx context.Context, userID uint, orderID uint) (*MeOrderDTO, error) {
	o, err := s.orderRepo.GetByIDAndUserID(ctx, orderID, userID)
	if err != nil {
		return nil, err
	}
	itemDTOs, _ := s.orderItemsToDTO(ctx, o.ID)
	return &MeOrderDTO{
		ID:              o.ID,
		CreatedAt:       o.CreatedAt,
		Status:          o.Status,
		PaymentMethod:   o.PaymentMethod,
		TrackingCode:    o.TrackingCode,
		Items:           itemDTOs,
		DiscountPercent: o.DiscountPercent,
		Note:            o.Note,
	}, nil
}

func (s *meService) ListMyPrograms(ctx context.Context, userID uint) (*MeProgramsResponse, error) {
	now := time.Now()
	var subs []models.Subscription
	if err := s.db.WithContext(ctx).Where("user_id = ?", userID).Order("starts_at DESC").Find(&subs).Error; err != nil {
		return nil, err
	}
	programs := make([]MeProgramDTO, 0, len(subs))
	for i := range subs {
		sub := &subs[i]
		plan, err := s.planRepo.FindByID(ctx, sub.ServicePlanID)
		if err != nil {
			continue
		}
		status := "ended"
		if sub.EndsAt == nil || sub.EndsAt.After(now) {
			status = "active"
		}
		duration := plan.DurationDays
		if duration <= 0 && sub.EndsAt != nil {
			duration = int(sub.EndsAt.Sub(sub.StartsAt).Hours() / 24)
		}
		remaining := 0
		if status == "active" && duration > 0 {
			daysPassed := int(now.Sub(sub.StartsAt).Hours() / 24)
			if daysPassed < 0 {
				daysPassed = 0
			}
			if daysPassed < duration {
				remaining = duration - daysPassed
			}
		}
		programs = append(programs, MeProgramDTO{
			ID:            sub.ID,
			Title:         plan.Name,
			Type:          plan.Type,
			Status:        status,
			StartDate:     sub.StartsAt,
			DurationDays:  duration,
			RemainingDays: remaining,
			Price:         plan.PriceCents,
		})
	}
	return &MeProgramsResponse{Programs: programs}, nil
}

func (s *meService) GetMyProgramByID(ctx context.Context, userID uint, programID uint) (*MeProgramDetailDTO, error) {
	var sub models.Subscription
	if err := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", programID, userID).First(&sub).Error; err != nil {
		return nil, err
	}
	plan, err := s.planRepo.FindByID(ctx, sub.ServicePlanID)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	status := "ended"
	if sub.EndsAt == nil || sub.EndsAt.After(now) {
		status = "active"
	}
	duration := plan.DurationDays
	if duration <= 0 && sub.EndsAt != nil {
		duration = int(sub.EndsAt.Sub(sub.StartsAt).Hours() / 24)
	}
	remaining := 0
	if status == "active" && duration > 0 {
		daysPassed := int(now.Sub(sub.StartsAt).Hours() / 24)
		if daysPassed < 0 {
			daysPassed = 0
		}
		if daysPassed < duration {
			remaining = duration - daysPassed
		}
	}
	detail := &MeProgramDetailDTO{
		MeProgramDTO: MeProgramDTO{
			ID:            sub.ID,
			Title:         plan.Name,
			Type:          plan.Type,
			Status:        status,
			StartDate:     sub.StartsAt,
			DurationDays:  duration,
			RemainingDays: remaining,
			Price:         plan.PriceCents,
		},
		Goal:   plan.Description,
		Level:  "",
		Coach:  "",
		Tags:   nil,
		Schedule: &MeScheduleDTO{Weekly: []string{}, RestDays: []string{}},
		PlanByDay: map[string]MeDayPlanDTO{},
	}
	return detail, nil
}
