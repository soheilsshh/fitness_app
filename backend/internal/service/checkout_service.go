package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var (
	ErrCheckoutNotStudent      = errors.New("only students can checkout")
	ErrCheckoutAlreadyHasCoach = errors.New("student already assigned to a coach")
	ErrCheckoutEmptyCart       = errors.New("cart is empty")
	ErrCheckoutInvalidPlan     = errors.New("invalid plan in cart")
	ErrCheckoutMixedCoaches    = errors.New("all plans must belong to the same coach")
	ErrCheckoutPlanInactive    = errors.New("plan is not available")
	ErrCheckoutMultipleItems   = errors.New("only one plan can be purchased at a time")
	ErrCheckoutInvalidQty      = errors.New("plan quantity must be 1")
)

type CheckoutItemRequest struct {
	PlanID uint `json:"planId"`
	Qty    int  `json:"qty"`
}

type CheckoutRequest struct {
	Items []CheckoutItemRequest `json:"items"`
}

type CheckoutResponse struct {
	OrderID           uint   `json:"orderId"`
	TrackingCode      string `json:"trackingCode"`
	Amount            int64  `json:"amount"`
	PaymentGatewayURL string `json:"paymentGatewayUrl"`
	CoachID           uint   `json:"coachId"`
}

type CheckoutService interface {
	Checkout(ctx context.Context, userID uint, req *CheckoutRequest) (*CheckoutResponse, error)
	GetOrderStatus(ctx context.Context, userID, orderID uint) (*MeOrderDTO, error)
}

type checkoutService struct {
	db       *gorm.DB
	userRepo repository.UserRepository
	planRepo repository.ServicePlanRepository
	orderRepo repository.OrderRepository
	subRepo  repository.SubscriptionRepository
	coachRepo repository.CoachProfileRepository
}

func NewCheckoutService(
	db *gorm.DB,
	userRepo repository.UserRepository,
	planRepo repository.ServicePlanRepository,
	orderRepo repository.OrderRepository,
	subRepo repository.SubscriptionRepository,
	coachRepo repository.CoachProfileRepository,
) CheckoutService {
	return &checkoutService{
		db:        db,
		userRepo:  userRepo,
		planRepo:  planRepo,
		orderRepo: orderRepo,
		subRepo:   subRepo,
		coachRepo: coachRepo,
	}
}

func (s *checkoutService) Checkout(ctx context.Context, userID uint, req *CheckoutRequest) (*CheckoutResponse, error) {
	if req == nil || len(req.Items) == 0 {
		return nil, ErrCheckoutEmptyCart
	}
	if len(req.Items) > 1 {
		return nil, ErrCheckoutMultipleItems
	}

	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user.Role != models.RoleStudent {
		return nil, ErrCheckoutNotStudent
	}
	if user.AssignedCoachID != nil && *user.AssignedCoachID > 0 {
		return nil, ErrCheckoutAlreadyHasCoach
	}

	now := time.Now()
	hasActive, err := s.subRepo.HasActiveSubscription(ctx, userID, now)
	if err != nil {
		return nil, err
	}
	if hasActive {
		return nil, ErrCheckoutAlreadyHasCoach
	}

	type line struct {
		plan *models.ServicePlan
		qty  int
	}
	lines := make([]line, 0, len(req.Items))
	var coachID uint

	for _, item := range req.Items {
		if item.PlanID == 0 {
			return nil, ErrCheckoutInvalidPlan
		}
		qty := item.Qty
		if qty <= 0 {
			qty = 1
		}
		if qty != 1 {
			return nil, ErrCheckoutInvalidQty
		}
		plan, err := s.planRepo.FindByID(ctx, item.PlanID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, ErrCheckoutInvalidPlan
			}
			return nil, err
		}
		if !plan.IsActive || plan.CoachID == 0 {
			return nil, ErrCheckoutPlanInactive
		}
		if coachID == 0 {
			coachID = plan.CoachID
		} else if coachID != plan.CoachID {
			return nil, ErrCheckoutMixedCoaches
		}
		lines = append(lines, line{plan: plan, qty: qty})
	}

	var total int64
	var maxDurationDays int
	orderItems := make([]models.OrderItem, 0, len(lines))
	for _, ln := range lines {
		unit := ln.plan.PriceCents
		if ln.plan.DiscountPriceCents > 0 {
			unit = ln.plan.DiscountPriceCents
		}
		lineTotal := unit
		total += lineTotal
		if ln.plan.DurationDays > maxDurationDays {
			maxDurationDays = ln.plan.DurationDays
		}
		orderItems = append(orderItems, models.OrderItem{
			ItemType:       "program",
			PlanID:         ln.plan.ID,
			RefID:          fmt.Sprintf("p%d", ln.plan.ID),
			Title:          ln.plan.Name,
			Qty:            ln.qty,
			UnitPriceCents: unit,
			LineTotalCents: lineTotal,
		})
	}

	trackingCode := generateTrackingCode()
	paidAt := now
	var createdOrder models.Order

	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		order := &models.Order{
			UserID:           userID,
			CoachID:          coachID,
			Status:           "paid",
			PaymentMethod:    "درگاه آنلاین (دمو)",
			TrackingCode:     trackingCode,
			TotalAmountCents: total,
			PaidAt:           &paidAt,
		}
		if err := tx.Create(order).Error; err != nil {
			return err
		}
		createdOrder = *order

		for i := range orderItems {
			orderItems[i].OrderID = order.ID
		}
		if err := tx.Create(&orderItems).Error; err != nil {
			return err
		}

		endsAt := now.AddDate(0, 0, maxDurationDays)
		nextDue := now.AddDate(0, 0, models.DefaultCheckinFrequencyDays)
		sub := &models.Subscription{
			UserID:               userID,
			CoachID:              coachID,
			ServicePlanID:        lines[0].plan.ID,
			StartsAt:             now,
			EndsAt:               &endsAt,
			NextCheckInDueDate:   &nextDue,
			CheckinFrequencyDays: models.DefaultCheckinFrequencyDays,
		}
		if err := tx.Create(sub).Error; err != nil {
			return err
		}

		coachIDCopy := coachID
		return tx.Model(&models.User{}).Where("id = ?", userID).
			Update("assigned_coach_id", coachIDCopy).Error
	})
	if err != nil {
		return nil, err
	}

	return &CheckoutResponse{
		OrderID:           createdOrder.ID,
		TrackingCode:      trackingCode,
		Amount:            total,
		PaymentGatewayURL: fmt.Sprintf("/payment/bank?orderId=%d", createdOrder.ID),
		CoachID:           coachID,
	}, nil
}

func (s *checkoutService) GetOrderStatus(ctx context.Context, userID, orderID uint) (*MeOrderDTO, error) {
	o, err := s.orderRepo.GetByIDAndUserID(ctx, orderID, userID)
	if err != nil {
		return nil, err
	}
	itemDTOs, _ := orderItemsToDTO(ctx, s.orderRepo, o.ID)
	coachName := s.resolveCoachName(ctx, o.CoachID)
	return &MeOrderDTO{
		ID:              o.ID,
		CreatedAt:       o.CreatedAt,
		Status:          o.Status,
		PaymentMethod:   o.PaymentMethod,
		TrackingCode:    o.TrackingCode,
		Items:           itemDTOs,
		DiscountPercent: o.DiscountPercent,
		Note:            o.Note,
		CoachName:       coachName,
	}, nil
}

func (s *checkoutService) resolveCoachName(ctx context.Context, coachUserID uint) string {
	if coachUserID == 0 {
		return ""
	}
	profile, err := s.coachRepo.FindByUserID(ctx, coachUserID)
	if err == nil && profile.DisplayName != "" {
		return profile.DisplayName
	}
	user, err := s.userRepo.FindByID(ctx, coachUserID)
	if err == nil {
		return user.Name
	}
	return ""
}

func generateTrackingCode() string {
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	return "TRX-" + strings.ToUpper(hex.EncodeToString(b))
}

func orderItemsToDTO(ctx context.Context, orderRepo repository.OrderRepository, orderID uint) ([]MeOrderItemDTO, error) {
	items, err := orderRepo.GetOrderItems(ctx, orderID)
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
