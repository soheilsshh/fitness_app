package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"math"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/config"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/pkg/digits"
	"github.com/yourusername/fitness-management/internal/pkg/slug"
	"github.com/yourusername/fitness-management/internal/repository"
)

var (
	ErrFunnelLeadNotFound      = errors.New("funnel lead not found")
	ErrFunnelAlreadyPaid       = errors.New("already paid")
	ErrFunnelInvalidInput      = errors.New("invalid funnel input")
	ErrFunnelInvalidStatus     = errors.New("invalid status transition")
	ErrFunnelAlreadySubscribed = errors.New("already has active subscription")
)

const (
	// DefaultFunnelCoachSlug binds the /ali-rashidabadi funnel when config is empty.
	DefaultFunnelCoachSlug = "ali-rashidabadi"
)

type FunnelPlanDTO struct {
	ID           uint     `json:"id"`
	Key          string   `json:"key"` // stringified plan id for UI selection
	Title        string   `json:"title"`
	Subtitle     string   `json:"subtitle"`
	Amount       int64    `json:"amount"`
	DurationDays int      `json:"durationDays"`
	Features     []string `json:"features"`
	Popular      bool     `json:"popular"`
}

type FunnelConfigDTO struct {
	FunnelKey       string          `json:"funnelKey"` // e.g. funnel_1
	FunnelLabel     string          `json:"funnelLabel"`
	CoachName       string          `json:"coachName"`
	CoachID         uint            `json:"coachId"`
	CoachSlug       string          `json:"coachSlug"`
	PackageTitle    string          `json:"packageTitle"`
	PackageSubtitle string          `json:"packageSubtitle"`
	Amount          int64           `json:"amount"`
	DurationDays    int             `json:"durationDays"`
	Plans           []FunnelPlanDTO `json:"plans"`
	DefaultPlanKey  string          `json:"defaultPlanKey"`
	DefaultPlanID   uint            `json:"defaultPlanId"`
}

type CreateFunnelLeadRequest struct {
	FirstName          string `json:"firstName"`
	LastName           string `json:"lastName"`
	Phone              string `json:"phone"`
	PlanID             uint   `json:"planId"`
	PackageKey         string `json:"packageKey"` // optional: stringified plan id
	PrimaryGoal        string `json:"primaryGoal"`
	ActivityLevel      string `json:"activityLevel"`
	TrainingEnv        string `json:"trainingEnv"`
	Experience         string `json:"experience"`
	NutritionChallenge string `json:"nutritionChallenge"`
	MainObstacle       string `json:"mainObstacle"`
	Commitment         string `json:"commitment"`
	Scenario           string `json:"scenario"`
	AnalysisTitle      string `json:"analysisTitle"`
	AnalysisBody       string `json:"analysisBody"`
	UTMSource          string `json:"utmSource"`
	UTMCampaign        string `json:"utmCampaign"`
}

type CreateFunnelLeadResponse struct {
	CheckoutToken string `json:"checkoutToken"`
	PaymentURL    string `json:"paymentUrl"`
	Resumed       bool   `json:"resumed"`
}

type SelectFunnelPlanRequest struct {
	PlanID     uint   `json:"planId"`
	PackageKey string `json:"packageKey"`
}

type FunnelCheckoutDTO struct {
	CheckoutToken string          `json:"checkoutToken"`
	FirstName     string          `json:"firstName"`
	LastName      string          `json:"lastName"`
	Phone         string          `json:"phone"`
	CoachName     string          `json:"coachName"`
	PlanID        uint            `json:"planId"`
	PackageKey    string          `json:"packageKey"`
	PackageTitle  string          `json:"packageTitle"`
	Amount        int64           `json:"amount"`
	Status        string          `json:"status"`
	TrackingCode  string          `json:"trackingCode,omitempty"`
	AnalysisTitle string          `json:"analysisTitle"`
	PaidAt        *time.Time      `json:"paidAt,omitempty"`
	Plans         []FunnelPlanDTO `json:"plans"`
}

type AdminFunnelLeadItem struct {
	ID                 uint       `json:"id"`
	FullName           string     `json:"fullName"`
	Phone              string     `json:"phone"`
	PrimaryGoal        string     `json:"primaryGoal"`
	ActivityLevel      string     `json:"activityLevel"`
	TrainingEnv        string     `json:"trainingEnv"`
	Experience         string     `json:"experience"`
	NutritionChallenge string     `json:"nutritionChallenge"`
	MainObstacle       string     `json:"mainObstacle"`
	Commitment         string     `json:"commitment"`
	Scenario           string     `json:"scenario"`
	CoachName          string     `json:"coachName"`
	Amount             int64      `json:"amount"`
	Status             string     `json:"status"`
	StageKey           string     `json:"stageKey"`
	StageLabel         string     `json:"stageLabel"`
	StageIndex         int        `json:"stageIndex"`
	TrackingCode       string     `json:"trackingCode"`
	Converted          bool       `json:"converted"`
	RegisteredUserID   uint       `json:"registeredUserId,omitempty"`
	PaidAt             *time.Time `json:"paidAt,omitempty"`
	ContactedAt        *time.Time `json:"contactedAt,omitempty"`
	CreatedAt          time.Time  `json:"createdAt"`
}

// FunnelStatsDTO powers the admin funnel KPI cards.
type FunnelStatsDTO struct {
	TotalLeads     int64   `json:"totalLeads"`
	UniquePeople   int64   `json:"uniquePeople"`
	Paid           int64   `json:"paid"`
	Pending        int64   `json:"pending"`
	Contacted      int64   `json:"contacted"`
	Converted      int64   `json:"converted"`
	ConversionRate float64 `json:"conversionRate"`
	PaymentRate    float64 `json:"paymentRate"`
	PaidRevenue    int64   `json:"paidRevenue"`
}

type AdminFunnelLeadDetail struct {
	AdminFunnelLeadItem
	AnalysisTitle string `json:"analysisTitle"`
	AnalysisBody  string `json:"analysisBody"`
	UTMSource     string `json:"utmSource"`
	UTMCampaign   string `json:"utmCampaign"`
}

type AdminFunnelLeadListResponse struct {
	Items    []AdminFunnelLeadItem `json:"items"`
	Page     int                   `json:"page"`
	PageSize int                   `json:"pageSize"`
	Total    int64                 `json:"total"`
}

type PatchFunnelLeadRequest struct {
	Status *string `json:"status"`
}

type FunnelService interface {
	GetConfig(ctx context.Context) FunnelConfigDTO
	CreateLead(ctx context.Context, req *CreateFunnelLeadRequest) (*CreateFunnelLeadResponse, error)
	GetCheckout(ctx context.Context, token string) (*FunnelCheckoutDTO, error)
	SelectPlan(ctx context.Context, token string, req *SelectFunnelPlanRequest) (*FunnelCheckoutDTO, error)
	PayDemo(ctx context.Context, token string) (*FunnelCheckoutDTO, error)
	ListLeads(ctx context.Context, status, query string, page, pageSize int) (*AdminFunnelLeadListResponse, error)
	GetLeadByID(ctx context.Context, id uint) (*AdminFunnelLeadDetail, error)
	PatchLead(ctx context.Context, id uint, req *PatchFunnelLeadRequest) error
	DeleteLead(ctx context.Context, id uint) error
	GetStats(ctx context.Context) (*FunnelStatsDTO, error)
}

type funnelService struct {
	repo      repository.FunnelLeadRepository
	coachRepo repository.CoachProfileRepository
	planRepo  repository.ServicePlanRepository
}

func NewFunnelService(
	repo repository.FunnelLeadRepository,
	coachRepo repository.CoachProfileRepository,
	planRepo repository.ServicePlanRepository,
) FunnelService {
	return &funnelService{repo: repo, coachRepo: coachRepo, planRepo: planRepo}
}

func funnelCoachSlug() string {
	if v := strings.TrimSpace(config.Get().Funnel.CoachSlug); v != "" {
		return slug.Normalize(v)
	}
	return DefaultFunnelCoachSlug
}

func planSellPrice(p *models.ServicePlan) int64 {
	if p == nil {
		return 0
	}
	if p.DiscountPriceCents > 0 {
		return p.DiscountPriceCents
	}
	return p.PriceCents
}

func splitPlanFeatures(text string) []string {
	raw := strings.ReplaceAll(text, "\r\n", "\n")
	parts := strings.Split(raw, "\n")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		p = strings.TrimLeft(p, "•-–—*\t ")
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

func toFunnelPlanDTO(p *models.ServicePlan) FunnelPlanDTO {
	return FunnelPlanDTO{
		ID:           p.ID,
		Key:          strconv.FormatUint(uint64(p.ID), 10),
		Title:        p.Name,
		Subtitle:     p.Subtitle,
		Amount:       planSellPrice(p),
		DurationDays: p.DurationDays,
		Features:     splitPlanFeatures(p.FeaturesText),
		Popular:      p.IsPopular,
	}
}

func (s *funnelService) loadFunnelCoach(ctx context.Context) (*models.CoachProfile, error) {
	profile, err := s.coachRepo.FindBySlug(ctx, funnelCoachSlug())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return profile, nil
}

func (s *funnelService) loadCoachPlans(ctx context.Context, coachUserID uint) ([]FunnelPlanDTO, error) {
	if coachUserID == 0 {
		return []FunnelPlanDTO{}, nil
	}
	plans, err := s.planRepo.ListActiveByCoachID(ctx, coachUserID)
	if err != nil {
		return nil, err
	}
	out := make([]FunnelPlanDTO, 0, len(plans))
	for i := range plans {
		out = append(out, toFunnelPlanDTO(&plans[i]))
	}
	return out, nil
}

func (s *funnelService) resolveSelectedPlan(ctx context.Context, coachUserID, planID uint, packageKey string) (*models.ServicePlan, error) {
	if planID == 0 {
		if id, err := strconv.ParseUint(strings.TrimSpace(packageKey), 10, 64); err == nil {
			planID = uint(id)
		}
	}
	if coachUserID == 0 {
		return nil, ErrFunnelInvalidInput
	}
	if planID > 0 {
		plan, err := s.planRepo.FindByIDAndCoachID(ctx, planID, coachUserID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, ErrFunnelInvalidInput
			}
			return nil, err
		}
		if !plan.IsActive {
			return nil, ErrFunnelInvalidInput
		}
		return plan, nil
	}
	plans, err := s.planRepo.ListActiveByCoachID(ctx, coachUserID)
	if err != nil {
		return nil, err
	}
	if len(plans) == 0 {
		return nil, ErrFunnelInvalidInput
	}
	for i := range plans {
		if plans[i].IsPopular {
			return &plans[i], nil
		}
	}
	return &plans[0], nil
}

func (s *funnelService) GetConfig(ctx context.Context) FunnelConfigDTO {
	slugKey := funnelCoachSlug()
	dto := FunnelConfigDTO{
		FunnelKey:   "funnel_1",
		FunnelLabel: "فانل ۱ — اختصاصی علی رشیدآبادی",
		CoachSlug:   slugKey,
		Plans:       []FunnelPlanDTO{},
	}
	profile, err := s.loadFunnelCoach(ctx)
	if err != nil || profile == nil {
		return dto
	}
	dto.CoachID = profile.UserID
	dto.CoachName = strings.TrimSpace(profile.DisplayName)
	if dto.CoachName == "" {
		dto.CoachName = profile.Slug
	}
	plans, err := s.loadCoachPlans(ctx, profile.UserID)
	if err != nil {
		return dto
	}
	dto.Plans = plans
	if len(plans) > 0 {
		def := plans[0]
		for _, p := range plans {
			if p.Popular {
				def = p
				break
			}
		}
		dto.PackageTitle = def.Title
		dto.PackageSubtitle = def.Subtitle
		dto.Amount = def.Amount
		dto.DurationDays = def.DurationDays
		dto.DefaultPlanKey = def.Key
		dto.DefaultPlanID = def.ID
	}
	return dto
}

func applyPlanToLead(lead *models.FunnelLead, plan *models.ServicePlan) {
	dto := toFunnelPlanDTO(plan)
	lead.ServicePlanID = plan.ID
	lead.PackageKey = dto.Key
	lead.PackageTitle = dto.Title
	lead.AmountCents = dto.Amount
}

func (s *funnelService) CreateLead(ctx context.Context, req *CreateFunnelLeadRequest) (*CreateFunnelLeadResponse, error) {
	if req == nil {
		return nil, ErrFunnelInvalidInput
	}
	firstName := strings.TrimSpace(req.FirstName)
	lastName := strings.TrimSpace(req.LastName)
	phone := normalizePhone(req.Phone)
	if firstName == "" || lastName == "" || phone == "" {
		return nil, ErrFunnelInvalidInput
	}
	if !isValidPrimaryGoal(req.PrimaryGoal) || !isValidActivityLevel(req.ActivityLevel) || !isValidMainObstacle(req.MainObstacle) {
		return nil, ErrFunnelInvalidInput
	}
	if !isValidTrainingEnv(req.TrainingEnv) || !isValidExperience(req.Experience) ||
		!isValidNutritionChallenge(req.NutritionChallenge) || !isValidCommitment(req.Commitment) {
		return nil, ErrFunnelInvalidInput
	}

	if hasSub, err := s.repo.PhoneHasActiveSubscription(ctx, phone); err != nil {
		return nil, err
	} else if hasSub {
		return nil, ErrFunnelAlreadySubscribed
	}

	profile, err := s.loadFunnelCoach(ctx)
	if err != nil {
		return nil, err
	}
	if profile == nil {
		return nil, ErrFunnelInvalidInput
	}
	coachName := strings.TrimSpace(profile.DisplayName)
	if coachName == "" {
		coachName = profile.Slug
	}

	plan, err := s.resolveSelectedPlan(ctx, profile.UserID, req.PlanID, req.PackageKey)
	if err != nil {
		return nil, err
	}

	// Resume unpaid checkout for same phone (registered or guest) → payment page.
	if existing, err := s.repo.FindLatestPendingByPhone(ctx, phone); err == nil && existing != nil {
		existing.FirstName = firstName
		existing.LastName = lastName
		existing.CoachID = profile.UserID
		existing.CoachName = coachName
		existing.PrimaryGoal = req.PrimaryGoal
		existing.ActivityLevel = req.ActivityLevel
		existing.TrainingEnv = strings.TrimSpace(req.TrainingEnv)
		existing.Experience = strings.TrimSpace(req.Experience)
		existing.NutritionChallenge = strings.TrimSpace(req.NutritionChallenge)
		existing.MainObstacle = req.MainObstacle
		existing.Commitment = strings.TrimSpace(req.Commitment)
		existing.Scenario = strings.TrimSpace(req.Scenario)
		existing.AnalysisTitle = strings.TrimSpace(req.AnalysisTitle)
		existing.AnalysisBody = strings.TrimSpace(req.AnalysisBody)
		applyPlanToLead(existing, plan)
		if src := strings.TrimSpace(req.UTMSource); src != "" {
			existing.UTMSource = src
		}
		if camp := strings.TrimSpace(req.UTMCampaign); camp != "" {
			existing.UTMCampaign = camp
		}
		if existing.CheckoutToken == "" {
			existing.CheckoutToken = generateFunnelToken()
		}
		if err := s.repo.Update(ctx, existing); err != nil {
			return nil, err
		}
		return &CreateFunnelLeadResponse{
			CheckoutToken: existing.CheckoutToken,
			PaymentURL:    "/ali-rashidabadi/payment?token=" + existing.CheckoutToken,
			Resumed:       true,
		}, nil
	} else if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	token := generateFunnelToken()
	lead := &models.FunnelLead{
		CheckoutToken:      token,
		CoachID:            profile.UserID,
		CoachName:          coachName,
		FirstName:          firstName,
		LastName:           lastName,
		Phone:              phone,
		PrimaryGoal:        req.PrimaryGoal,
		ActivityLevel:      req.ActivityLevel,
		TrainingEnv:        strings.TrimSpace(req.TrainingEnv),
		Experience:         strings.TrimSpace(req.Experience),
		NutritionChallenge: strings.TrimSpace(req.NutritionChallenge),
		MainObstacle:       req.MainObstacle,
		Commitment:         strings.TrimSpace(req.Commitment),
		Scenario:           strings.TrimSpace(req.Scenario),
		AnalysisTitle:      strings.TrimSpace(req.AnalysisTitle),
		AnalysisBody:       strings.TrimSpace(req.AnalysisBody),
		Status:             models.FunnelStatusPendingPayment,
		UTMSource:          strings.TrimSpace(req.UTMSource),
		UTMCampaign:        strings.TrimSpace(req.UTMCampaign),
	}
	applyPlanToLead(lead, plan)

	if err := s.repo.Create(ctx, lead); err != nil {
		return nil, err
	}

	return &CreateFunnelLeadResponse{
		CheckoutToken: token,
		PaymentURL:    "/ali-rashidabadi/payment?token=" + token,
		Resumed:       false,
	}, nil
}

func (s *funnelService) GetCheckout(ctx context.Context, token string) (*FunnelCheckoutDTO, error) {
	lead, err := s.repo.FindByCheckoutToken(ctx, strings.TrimSpace(token))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrFunnelLeadNotFound
		}
		return nil, err
	}
	return s.leadToCheckoutDTO(ctx, lead)
}

func (s *funnelService) SelectPlan(ctx context.Context, token string, req *SelectFunnelPlanRequest) (*FunnelCheckoutDTO, error) {
	if req == nil {
		return nil, ErrFunnelInvalidInput
	}
	lead, err := s.repo.FindByCheckoutToken(ctx, strings.TrimSpace(token))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrFunnelLeadNotFound
		}
		return nil, err
	}
	if lead.Status == models.FunnelStatusPaid {
		return nil, ErrFunnelAlreadyPaid
	}
	if lead.Status != models.FunnelStatusPendingPayment {
		return nil, ErrFunnelInvalidStatus
	}

	coachID := lead.CoachID
	if coachID == 0 {
		if profile, err := s.loadFunnelCoach(ctx); err == nil && profile != nil {
			coachID = profile.UserID
			lead.CoachID = coachID
		}
	}
	plan, err := s.resolveSelectedPlan(ctx, coachID, req.PlanID, req.PackageKey)
	if err != nil {
		return nil, err
	}
	applyPlanToLead(lead, plan)
	if err := s.repo.Update(ctx, lead); err != nil {
		return nil, err
	}
	return s.leadToCheckoutDTO(ctx, lead)
}

func (s *funnelService) PayDemo(ctx context.Context, token string) (*FunnelCheckoutDTO, error) {
	lead, err := s.repo.FindByCheckoutToken(ctx, strings.TrimSpace(token))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrFunnelLeadNotFound
		}
		return nil, err
	}

	if lead.Status == models.FunnelStatusPaid {
		return s.leadToCheckoutDTO(ctx, lead)
	}
	if lead.Status != models.FunnelStatusPendingPayment {
		return nil, ErrFunnelInvalidStatus
	}

	now := time.Now()
	lead.Status = models.FunnelStatusPaid
	lead.PaymentMethod = "درگاه آنلاین (دمو)"
	code := generateFunnelTrackingCode()
	lead.TrackingCode = &code
	lead.PaidAt = &now

	if err := s.repo.Update(ctx, lead); err != nil {
		return nil, err
	}
	return s.leadToCheckoutDTO(ctx, lead)
}

func (s *funnelService) ListLeads(ctx context.Context, status, query string, page, pageSize int) (*AdminFunnelLeadListResponse, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	leads, total, err := s.repo.List(ctx, status, query, page, pageSize)
	if err != nil {
		return nil, err
	}

	phones := make([]string, 0, len(leads))
	for i := range leads {
		phones = append(phones, leads[i].Phone)
	}
	registered, err := s.repo.RegisteredPhones(ctx, phones)
	if err != nil {
		return nil, err
	}

	items := make([]AdminFunnelLeadItem, 0, len(leads))
	for i := range leads {
		item := leadToAdminItem(&leads[i])
		if uid, ok := registered[leads[i].Phone]; ok {
			item.Converted = true
			item.RegisteredUserID = uid
		}
		items = append(items, item)
	}

	return &AdminFunnelLeadListResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	}, nil
}

func (s *funnelService) GetLeadByID(ctx context.Context, id uint) (*AdminFunnelLeadDetail, error) {
	lead, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrFunnelLeadNotFound
		}
		return nil, err
	}
	item := leadToAdminItem(lead)
	if registered, err := s.repo.RegisteredPhones(ctx, []string{lead.Phone}); err == nil {
		if uid, ok := registered[lead.Phone]; ok {
			item.Converted = true
			item.RegisteredUserID = uid
		}
	}
	return &AdminFunnelLeadDetail{
		AdminFunnelLeadItem: item,
		AnalysisTitle:       lead.AnalysisTitle,
		AnalysisBody:        lead.AnalysisBody,
		UTMSource:           lead.UTMSource,
		UTMCampaign:         lead.UTMCampaign,
	}, nil
}

func (s *funnelService) PatchLead(ctx context.Context, id uint, req *PatchFunnelLeadRequest) error {
	if req == nil || req.Status == nil {
		return ErrFunnelInvalidInput
	}
	status := strings.TrimSpace(*req.Status)
	if status != models.FunnelStatusContacted {
		return ErrFunnelInvalidInput
	}

	lead, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrFunnelLeadNotFound
		}
		return err
	}
	if lead.Status != models.FunnelStatusPaid {
		return ErrFunnelInvalidStatus
	}

	now := time.Now()
	lead.Status = models.FunnelStatusContacted
	lead.ContactedAt = &now
	return s.repo.Update(ctx, lead)
}

func (s *funnelService) DeleteLead(ctx context.Context, id uint) error {
	if _, err := s.repo.FindByID(ctx, id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrFunnelLeadNotFound
		}
		return err
	}
	return s.repo.Delete(ctx, id)
}

func (s *funnelService) GetStats(ctx context.Context) (*FunnelStatsDTO, error) {
	raw, err := s.repo.Stats(ctx)
	if err != nil {
		return nil, err
	}
	dto := &FunnelStatsDTO{
		TotalLeads:   raw.Total,
		UniquePeople: raw.UniquePeople,
		Paid:         raw.Paid,
		Pending:      raw.Pending,
		Contacted:    raw.Contacted,
		Converted:    raw.Converted,
		PaidRevenue:  raw.PaidRevenue,
	}
	if raw.UniquePeople > 0 {
		dto.ConversionRate = round1(float64(raw.Converted) / float64(raw.UniquePeople) * 100)
	}
	if raw.Total > 0 {
		dto.PaymentRate = round1(float64(raw.Paid) / float64(raw.Total) * 100)
	}
	return dto, nil
}

func round1(v float64) float64 {
	return math.Round(v*10) / 10
}

func (s *funnelService) leadToCheckoutDTO(ctx context.Context, lead *models.FunnelLead) (*FunnelCheckoutDTO, error) {
	plans, err := s.loadCoachPlans(ctx, lead.CoachID)
	if err != nil {
		return nil, err
	}
	if len(plans) == 0 {
		if profile, err := s.loadFunnelCoach(ctx); err == nil && profile != nil {
			plans, _ = s.loadCoachPlans(ctx, profile.UserID)
		}
	}
	key := strings.TrimSpace(lead.PackageKey)
	if key == "" && lead.ServicePlanID > 0 {
		key = strconv.FormatUint(uint64(lead.ServicePlanID), 10)
	}
	return &FunnelCheckoutDTO{
		CheckoutToken: lead.CheckoutToken,
		FirstName:     lead.FirstName,
		LastName:      lead.LastName,
		Phone:         lead.Phone,
		CoachName:     lead.CoachName,
		PlanID:        lead.ServicePlanID,
		PackageKey:    key,
		PackageTitle:  lead.PackageTitle,
		Amount:        lead.AmountCents,
		Status:        lead.Status,
		TrackingCode:  derefString(lead.TrackingCode),
		AnalysisTitle: lead.AnalysisTitle,
		PaidAt:        lead.PaidAt,
		Plans:         plans,
	}, nil
}

func leadToAdminItem(lead *models.FunnelLead) AdminFunnelLeadItem {
	stageKey, stageLabel, stageIndex := funnelStage(lead.Status)
	return AdminFunnelLeadItem{
		ID:                 lead.ID,
		FullName:           strings.TrimSpace(lead.FirstName + " " + lead.LastName),
		Phone:              lead.Phone,
		PrimaryGoal:        lead.PrimaryGoal,
		ActivityLevel:      lead.ActivityLevel,
		TrainingEnv:        lead.TrainingEnv,
		Experience:         lead.Experience,
		NutritionChallenge: lead.NutritionChallenge,
		MainObstacle:       lead.MainObstacle,
		Commitment:         lead.Commitment,
		Scenario:           lead.Scenario,
		CoachName:          lead.CoachName,
		Amount:             lead.AmountCents,
		Status:             lead.Status,
		StageKey:           stageKey,
		StageLabel:         stageLabel,
		StageIndex:         stageIndex,
		TrackingCode:       derefString(lead.TrackingCode),
		PaidAt:             lead.PaidAt,
		ContactedAt:        lead.ContactedAt,
		CreatedAt:          lead.CreatedAt,
	}
}

func derefString(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

// funnelStage maps CRM status to a human pipeline stage for the Ali Rashidabadi funnel.
// Index: 1=ارزیابی+ثبت لید, 2=در انتظار پرداخت, 3=خرید شده, 4=تماس گرفته شده
func funnelStage(status string) (key, label string, index int) {
	switch status {
	case models.FunnelStatusContacted:
		return "contacted", "تماس گرفته شد", 4
	case models.FunnelStatusPaid:
		return "paid", "خرید نهایی انجام شد", 3
	case models.FunnelStatusFailed:
		return "failed", "پرداخت ناموفق", 2
	case models.FunnelStatusPendingPayment:
		fallthrough
	default:
		return "pending_payment", "ثبت لید — در انتظار پرداخت", 2
	}
}

func generateFunnelToken() string {
	b := make([]byte, 24)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func generateFunnelTrackingCode() string {
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	return "FL-" + strings.ToUpper(hex.EncodeToString(b))
}

func normalizePhone(phone string) string {
	return digits.NormalizePhone(phone)
}

func isValidPrimaryGoal(v string) bool {
	switch v {
	case "weight_loss", "muscle_gain", "fitness":
		return true
	default:
		return false
	}
}

func isValidActivityLevel(v string) bool {
	switch v {
	case "sedentary", "moderate", "active":
		return true
	default:
		return false
	}
}

func isValidMainObstacle(v string) bool {
	switch v {
	case "motivation", "plateau", "knowledge":
		return true
	default:
		return false
	}
}

// New funnel answers are optional (empty allowed) so older clients keep working,
// but if provided they must be one of the known values.
func isValidTrainingEnv(v string) bool {
	switch v {
	case "", "home", "gym":
		return true
	default:
		return false
	}
}

func isValidExperience(v string) bool {
	switch v {
	case "", "beginner", "intermediate", "advanced":
		return true
	default:
		return false
	}
}

func isValidNutritionChallenge(v string) bool {
	switch v {
	case "", "sweets", "low_appetite", "no_time":
		return true
	default:
		return false
	}
}

func isValidCommitment(v string) bool {
	switch v {
	case "", "flexible", "max_results":
		return true
	default:
		return false
	}
}
