package service

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/config"
	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var (
	ErrPaymentOrderNotFound   = errors.New("order not found")
	ErrPaymentOrderNotPending = errors.New("order is not pending")
	ErrPaymentPlanNotFound    = errors.New("plan not found")
	ErrPaymentGatewayFailed   = errors.New("payment gateway failed")
)

type ZarinpalPaymentResponse struct {
	TransactionID uint   `json:"transaction_id"`
	OrderID       uint   `json:"orderId"`
	Authority     string `json:"authority"`
	PaymentURL    string `json:"payment_url"`
	CallbackURL   string `json:"callback_url"`
}

type PaymentService interface {
	PrepareCheckoutOrder(ctx context.Context, userID uint, req *CheckoutRequest) (*preparedOrder, error)
	RequestZarinpalByPlanID(ctx context.Context, userID, planID uint) (*ZarinpalPaymentResponse, error)
	RequestZarinpalForOrder(ctx context.Context, userID, orderID uint) (*ZarinpalPaymentResponse, error)
	HandleZarinpalCallback(ctx context.Context, orderID uint, authority, status string) (resultURL string, err error)
}

type paymentService struct {
	db          *gorm.DB
	userRepo    repository.UserRepository
	planRepo    repository.ServicePlanRepository
	orderRepo   repository.OrderRepository
	subRepo     repository.SubscriptionRepository
	funnelRepo  repository.FunnelLeadRepository
	zarinpal    *ZarinpalClient
}

func NewPaymentService(
	db *gorm.DB,
	userRepo repository.UserRepository,
	planRepo repository.ServicePlanRepository,
	orderRepo repository.OrderRepository,
	subRepo repository.SubscriptionRepository,
) PaymentService {
	return NewPaymentServiceWithFunnel(db, userRepo, planRepo, orderRepo, subRepo, nil)
}

func NewPaymentServiceWithFunnel(
	db *gorm.DB,
	userRepo repository.UserRepository,
	planRepo repository.ServicePlanRepository,
	orderRepo repository.OrderRepository,
	subRepo repository.SubscriptionRepository,
	funnelRepo repository.FunnelLeadRepository,
) PaymentService {
	return &paymentService{
		db:         db,
		userRepo:   userRepo,
		planRepo:   planRepo,
		orderRepo:  orderRepo,
		subRepo:    subRepo,
		funnelRepo: funnelRepo,
		zarinpal:   NewZarinpalClient(),
	}
}

func (s *paymentService) PrepareCheckoutOrder(ctx context.Context, userID uint, req *CheckoutRequest) (*preparedOrder, error) {
	return s.preparePendingOrder(ctx, userID, req)
}

func (s *paymentService) RequestZarinpalByPlanID(ctx context.Context, userID, planID uint) (*ZarinpalPaymentResponse, error) {
	req := &CheckoutRequest{Items: []CheckoutItemRequest{{PlanID: planID, Qty: 1}}}
	prepared, err := s.preparePendingOrder(ctx, userID, req)
	if err != nil {
		return nil, err
	}
	return s.RequestZarinpalForOrder(ctx, userID, prepared.OrderID)
}

func (s *paymentService) RequestZarinpalForOrder(ctx context.Context, userID, orderID uint) (*ZarinpalPaymentResponse, error) {
	order, err := s.orderRepo.GetByIDAndUserID(ctx, orderID, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPaymentOrderNotFound
		}
		return nil, err
	}
	if order.Status != "pending" {
		return nil, ErrPaymentOrderNotPending
	}
	if order.GatewayAuthority != "" && order.PaymentGateway == PaymentGatewayZarinpal {
		paymentURL := s.zarinpal.startPayBase() + order.GatewayAuthority
		return &ZarinpalPaymentResponse{
			TransactionID: order.ID,
			OrderID:       order.ID,
			Authority:     order.GatewayAuthority,
			PaymentURL:    paymentURL,
			CallbackURL:   s.buildCallbackURL(order.ID),
		}, nil
	}

	callbackURL := s.buildCallbackURL(order.ID)
	description := fmt.Sprintf("Fitinoo order #%d", order.ID)
	mobile := ""
	if user, uerr := s.userRepo.FindByID(ctx, userID); uerr == nil && user != nil {
		mobile = strings.TrimSpace(user.Phone)
	}
	authority, paymentURL, err := s.zarinpal.RequestPayment(
		ZarinpalAmountRials(order.TotalAmountCents),
		description,
		callbackURL,
		mobile,
	)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrPaymentGatewayFailed, err)
	}

	order.PaymentGateway = PaymentGatewayZarinpal
	order.GatewayAuthority = authority
	order.PaymentMethod = "زرین‌پال"
	if err := s.orderRepo.Save(ctx, order); err != nil {
		return nil, err
	}

	return &ZarinpalPaymentResponse{
		TransactionID: order.ID,
		OrderID:       order.ID,
		Authority:     authority,
		PaymentURL:    paymentURL,
		CallbackURL:   callbackURL,
	}, nil
}

func (s *paymentService) HandleZarinpalCallback(ctx context.Context, orderID uint, authority, status string) (string, error) {
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return s.buildResultURL("failed", orderID, ""), ErrPaymentOrderNotFound
	}

	if order.Status == "paid" {
		if url := s.funnelSuccessURL(ctx, order.ID); url != "" {
			return url, nil
		}
		return s.buildResultURL("success", order.ID, order.GatewayRefID), nil
	}

	if !strings.EqualFold(strings.TrimSpace(status), "OK") {
		_ = s.markOrderFailed(ctx, order)
		if url := s.funnelPayResultURL(ctx, order.ID, "failed", ""); url != "" {
			return url, nil
		}
		return s.buildResultURL("failed", order.ID, ""), nil
	}

	authority = strings.TrimSpace(authority)
	if authority == "" {
		_ = s.markOrderFailed(ctx, order)
		if url := s.funnelPayResultURL(ctx, order.ID, "failed", ""); url != "" {
			return url, nil
		}
		return s.buildResultURL("failed", order.ID, ""), nil
	}

	if order.GatewayAuthority != "" && order.GatewayAuthority != authority {
		_ = s.markOrderFailed(ctx, order)
		if url := s.funnelPayResultURL(ctx, order.ID, "failed", ""); url != "" {
			return url, nil
		}
		return s.buildResultURL("failed", order.ID, ""), nil
	}

	refID, err := s.zarinpal.VerifyPayment(ZarinpalAmountRials(order.TotalAmountCents), authority)
	if err != nil {
		_ = s.markOrderFailed(ctx, order)
		if url := s.funnelPayResultURL(ctx, order.ID, "failed", ""); url != "" {
			return url, nil
		}
		return s.buildResultURL("failed", order.ID, ""), err
	}

	if err := s.fulfillPaidOrder(ctx, order, authority, refID); err != nil {
		if url := s.funnelPayResultURL(ctx, order.ID, "failed", ""); url != "" {
			return url, nil
		}
		return s.buildResultURL("failed", order.ID, ""), err
	}

	if url := s.markFunnelLeadPaid(ctx, order.ID, refID); url != "" {
		return url, nil
	}

	return s.buildResultURL("success", order.ID, refID), nil
}

type preparedOrder struct {
	OrderID      uint
	TrackingCode string
	Amount       int64
	CoachID      uint
}

func (s *paymentService) preparePendingOrder(ctx context.Context, userID uint, req *CheckoutRequest) (*preparedOrder, error) {
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
	orderItems := make([]models.OrderItem, 0, len(lines))
	for _, ln := range lines {
		unit := ln.plan.PriceCents
		if ln.plan.DiscountPriceCents > 0 {
			unit = ln.plan.DiscountPriceCents
		}
		lineTotal := unit
		total += lineTotal
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
	var createdOrder models.Order

	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		order := &models.Order{
			UserID:           userID,
			CoachID:          coachID,
			Status:           "pending",
			PaymentMethod:    "زرین‌پال",
			PaymentGateway:   PaymentGatewayZarinpal,
			TrackingCode:     trackingCode,
			TotalAmountCents: total,
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
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &preparedOrder{
		OrderID:      createdOrder.ID,
		TrackingCode: trackingCode,
		Amount:       total,
		CoachID:      coachID,
	}, nil
}

func (s *paymentService) fulfillPaidOrder(ctx context.Context, order *models.Order, authority, refID string) error {
	if order.Status == "paid" {
		return nil
	}

	items, err := s.orderRepo.GetOrderItems(ctx, order.ID)
	if err != nil {
		return err
	}
	if len(items) == 0 {
		return errors.New("order has no items")
	}

	planID := items[0].PlanID
	plan, err := s.planRepo.FindByID(ctx, planID)
	if err != nil {
		return err
	}

	now := time.Now()
	paidAt := now
	endsAt := now.AddDate(0, 0, plan.DurationDays)
	nextDue := now.AddDate(0, 0, models.DefaultCheckinFrequencyDays)

	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var current models.Order
		if err := tx.First(&current, order.ID).Error; err != nil {
			return err
		}
		if current.Status == "paid" {
			return nil
		}

		if err := tx.Model(&models.Order{}).Where("id = ?", order.ID).Updates(map[string]interface{}{
			"status":            "paid",
			"paid_at":           paidAt,
			"gateway_authority": authority,
			"gateway_ref_id":    refID,
			"payment_gateway":   PaymentGatewayZarinpal,
			"payment_method":    "زرین‌پال",
		}).Error; err != nil {
			return err
		}

		sub := &models.Subscription{
			UserID:               order.UserID,
			CoachID:              order.CoachID,
			ServicePlanID:        plan.ID,
			StartsAt:             now,
			EndsAt:               &endsAt,
			NextCheckInDueDate:   &nextDue,
			CheckinFrequencyDays: models.DefaultCheckinFrequencyDays,
		}
		if err := tx.Create(sub).Error; err != nil {
			return err
		}

		txn := &models.Transaction{
			OrderID:        order.ID,
			SubscriptionID: sub.ID,
			UserID:         order.UserID,
			AmountCents:    order.TotalAmountCents,
			Status:         "success",
			Reference:      refID,
			Gateway:        PaymentGatewayZarinpal,
			Date:           now,
		}
		if err := tx.Create(txn).Error; err != nil {
			return err
		}

		coachIDCopy := order.CoachID
		return tx.Model(&models.User{}).Where("id = ?", order.UserID).
			Update("assigned_coach_id", coachIDCopy).Error
	})
}

func (s *paymentService) markOrderFailed(ctx context.Context, order *models.Order) error {
	return s.db.WithContext(ctx).Model(&models.Order{}).
		Where("id = ? AND status = ?", order.ID, "pending").
		Update("status", "failed").Error
}

// markFunnelLeadPaid finalizes a funnel checkout linked to this order and returns
// the funnel success redirect URL (empty when the order is not a funnel payment).
func (s *paymentService) markFunnelLeadPaid(ctx context.Context, orderID uint, refID string) string {
	if s.funnelRepo == nil || orderID == 0 {
		return ""
	}
	lead, err := s.funnelRepo.FindByOrderID(ctx, orderID)
	if err != nil || lead == nil {
		return ""
	}
	if lead.Status != models.FunnelStatusPaid {
		now := time.Now()
		lead.Status = models.FunnelStatusPaid
		lead.PaymentMethod = "زرین‌پال"
		if lead.TrackingCode == nil || strings.TrimSpace(*lead.TrackingCode) == "" {
			code := generateFunnelTrackingCode()
			lead.TrackingCode = &code
		}
		lead.PaidAt = &now
		_ = s.funnelRepo.Update(ctx, lead)
	}
	return s.buildFunnelSuccessURL(lead)
}

func (s *paymentService) funnelSuccessURL(ctx context.Context, orderID uint) string {
	if s.funnelRepo == nil || orderID == 0 {
		return ""
	}
	lead, err := s.funnelRepo.FindByOrderID(ctx, orderID)
	if err != nil || lead == nil {
		return ""
	}
	return s.buildFunnelSuccessURL(lead)
}

func (s *paymentService) buildFunnelSuccessURL(lead *models.FunnelLead) string {
	if lead == nil || strings.TrimSpace(lead.CheckoutToken) == "" {
		return ""
	}
	webURL := strings.TrimSpace(config.Get().Payments.Zarinpal.WebResultURL)
	base := "https://fitinoo.ir"
	if webURL != "" {
		if u, err := url.Parse(webURL); err == nil && u.Scheme != "" && u.Host != "" {
			base = u.Scheme + "://" + u.Host
		}
	}
	code := ""
	if lead.TrackingCode != nil {
		code = strings.TrimSpace(*lead.TrackingCode)
	}
	return fmt.Sprintf(
		"%s/ali-rashidabadi/success?token=%s&code=%s",
		strings.TrimRight(base, "/"),
		url.QueryEscape(lead.CheckoutToken),
		url.QueryEscape(code),
	)
}

func (s *paymentService) funnelPayResultURL(ctx context.Context, orderID uint, status, refID string) string {
	if s.funnelRepo == nil || orderID == 0 {
		return ""
	}
	lead, err := s.funnelRepo.FindByOrderID(ctx, orderID)
	if err != nil || lead == nil || strings.TrimSpace(lead.CheckoutToken) == "" {
		return ""
	}
	webURL := strings.TrimSpace(config.Get().Payments.Zarinpal.WebResultURL)
	base := "https://fitinoo.ir"
	if webURL != "" {
		if u, err := url.Parse(webURL); err == nil && u.Scheme != "" && u.Host != "" {
			base = u.Scheme + "://" + u.Host
		}
	}
	return fmt.Sprintf(
		"%s/ali-rashidabadi/payment/result?status=%s&token=%s&tx_id=%d&ref_id=%s",
		strings.TrimRight(base, "/"),
		url.QueryEscape(status),
		url.QueryEscape(lead.CheckoutToken),
		orderID,
		url.QueryEscape(refID),
	)
}

func (s *paymentService) buildCallbackURL(orderID uint) string {
	base := strings.TrimRight(strings.TrimSpace(config.Get().Payments.Zarinpal.CallbackBaseURL), "/")
	if base == "" {
		base = "http://localhost:8088"
	}
	return fmt.Sprintf("%s/payments/zarinpal/callback?tx_id=%d", base, orderID)
}

func (s *paymentService) buildResultURL(status string, orderID uint, refID string) string {
	webURL := strings.TrimSpace(config.Get().Payments.Zarinpal.WebResultURL)
	if webURL == "" {
		webURL = "http://localhost:3000/payment/result"
	}
	u, err := url.Parse(webURL)
	if err != nil {
		return fmt.Sprintf("%s?status=%s&tx_id=%d&ref_id=%s", webURL, status, orderID, refID)
	}
	q := u.Query()
	q.Set("status", status)
	q.Set("tx_id", strconv.FormatUint(uint64(orderID), 10))
	if refID != "" {
		q.Set("ref_id", refID)
	}
	u.RawQuery = q.Encode()
	return u.String()
}

func BuildMobilePaymentDeepLink(status string, orderID uint, refID string) string {
	scheme := strings.TrimSpace(config.Get().Payments.Zarinpal.MobileDeepLink)
	if scheme == "" {
		scheme = "fitinoo"
	}
	v := url.Values{}
	v.Set("status", status)
	v.Set("tx_id", strconv.FormatUint(uint64(orderID), 10))
	if refID != "" {
		v.Set("ref_id", refID)
	}
	return fmt.Sprintf("%s://payment?%s", scheme, v.Encode())
}
