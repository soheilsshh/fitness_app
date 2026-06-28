package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"

	"github.com/yourusername/fitness-management/internal/repository"
	"gorm.io/gorm"
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
	paymentService PaymentService
	orderRepo      repository.OrderRepository
	coachRepo      repository.CoachProfileRepository
	userRepo       repository.UserRepository
}

func NewCheckoutService(
	db *gorm.DB,
	userRepo repository.UserRepository,
	planRepo repository.ServicePlanRepository,
	orderRepo repository.OrderRepository,
	subRepo repository.SubscriptionRepository,
	coachRepo repository.CoachProfileRepository,
	paymentService PaymentService,
) CheckoutService {
	if paymentService == nil {
		paymentService = NewPaymentService(db, userRepo, planRepo, orderRepo, subRepo)
	}
	return &checkoutService{
		paymentService: paymentService,
		orderRepo:      orderRepo,
		coachRepo:      coachRepo,
		userRepo:       userRepo,
	}
}

func (s *checkoutService) Checkout(ctx context.Context, userID uint, req *CheckoutRequest) (*CheckoutResponse, error) {
	prepared, err := s.paymentService.PrepareCheckoutOrder(ctx, userID, req)
	if err != nil {
		return nil, err
	}

	zarin, err := s.paymentService.RequestZarinpalForOrder(ctx, userID, prepared.OrderID)
	if err != nil {
		return nil, err
	}

	return &CheckoutResponse{
		OrderID:           prepared.OrderID,
		TrackingCode:      prepared.TrackingCode,
		Amount:            prepared.Amount,
		PaymentGatewayURL: zarin.PaymentURL,
		CoachID:           prepared.CoachID,
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
