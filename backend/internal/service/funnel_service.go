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
	"github.com/yourusername/fitness-management/internal/repository"
)

var (
	ErrFunnelLeadNotFound  = errors.New("funnel lead not found")
	ErrFunnelAlreadyPaid   = errors.New("already paid")
	ErrFunnelInvalidInput  = errors.New("invalid funnel input")
	ErrFunnelInvalidStatus = errors.New("invalid status transition")
)

type FunnelConfigDTO struct {
	CoachName       string `json:"coachName"`
	CoachID         uint   `json:"coachId"`
	PackageTitle    string `json:"packageTitle"`
	PackageSubtitle string `json:"packageSubtitle"`
	Amount          int64  `json:"amount"`
	DurationDays    int    `json:"durationDays"`
}

type CreateFunnelLeadRequest struct {
	FirstName          string `json:"firstName"`
	LastName           string `json:"lastName"`
	Phone              string `json:"phone"`
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
}

type FunnelCheckoutDTO struct {
	CheckoutToken string     `json:"checkoutToken"`
	FirstName     string     `json:"firstName"`
	LastName      string     `json:"lastName"`
	Phone         string     `json:"phone"`
	CoachName     string     `json:"coachName"`
	PackageTitle  string     `json:"packageTitle"`
	Amount        int64      `json:"amount"`
	Status        string     `json:"status"`
	TrackingCode  string     `json:"trackingCode,omitempty"`
	AnalysisTitle string     `json:"analysisTitle"`
	PaidAt        *time.Time `json:"paidAt,omitempty"`
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
	TrackingCode       string     `json:"trackingCode"`
	Converted          bool       `json:"converted"`
	RegisteredUserID   uint       `json:"registeredUserId,omitempty"`
	PaidAt             *time.Time `json:"paidAt,omitempty"`
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
	PayDemo(ctx context.Context, token string) (*FunnelCheckoutDTO, error)
	ListLeads(ctx context.Context, status, query string, page, pageSize int) (*AdminFunnelLeadListResponse, error)
	GetLeadByID(ctx context.Context, id uint) (*AdminFunnelLeadDetail, error)
	PatchLead(ctx context.Context, id uint, req *PatchFunnelLeadRequest) error
	DeleteLead(ctx context.Context, id uint) error
	GetStats(ctx context.Context) (*FunnelStatsDTO, error)
}

type funnelService struct {
	repo repository.FunnelLeadRepository
}

func NewFunnelService(repo repository.FunnelLeadRepository) FunnelService {
	return &funnelService{repo: repo}
}

func funnelCoachName() string {
	if v := strings.TrimSpace(config.Get().Funnel.CoachName); v != "" {
		return v
	}
	return "علی رشید آبادی"
}

func funnelCoachID() uint {
	if v := strings.TrimSpace(config.Get().Funnel.CoachID); v != "" {
		if id, err := strconv.ParseUint(v, 10, 64); err == nil {
			return uint(id)
		}
	}
	return 0
}

func funnelAmount() int64 {
	if v := strings.TrimSpace(config.Get().Funnel.Amount); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil && n > 0 {
			return n
		}
	}
	return 2_500_000
}

func funnelPackageTitle() string {
	if v := strings.TrimSpace(config.Get().Funnel.PackageTitle); v != "" {
		return v
	}
	return "پکیج مربیگری اختصاصی"
}

func (s *funnelService) GetConfig(ctx context.Context) FunnelConfigDTO {
	_ = ctx
	return FunnelConfigDTO{
		CoachName:       funnelCoachName(),
		CoachID:         funnelCoachID(),
		PackageTitle:    funnelPackageTitle(),
		PackageSubtitle: "برنامه تمرین و تغذیه شخصی‌سازی‌شده",
		Amount:          funnelAmount(),
		DurationDays:    90,
	}
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

	cfg := s.GetConfig(ctx)
	token := generateFunnelToken()

	lead := &models.FunnelLead{
		CheckoutToken:      token,
		CoachID:            cfg.CoachID,
		CoachName:          cfg.CoachName,
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
		PackageTitle:       cfg.PackageTitle,
		AmountCents:        cfg.Amount,
		Status:             models.FunnelStatusPendingPayment,
		UTMSource:          strings.TrimSpace(req.UTMSource),
		UTMCampaign:        strings.TrimSpace(req.UTMCampaign),
	}

	if err := s.repo.Create(ctx, lead); err != nil {
		return nil, err
	}

	return &CreateFunnelLeadResponse{
		CheckoutToken: token,
		PaymentURL:    "/leadfunnel/payment?token=" + token,
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
	return leadToCheckoutDTO(lead), nil
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
		return leadToCheckoutDTO(lead), nil
	}
	if lead.Status != models.FunnelStatusPendingPayment {
		return nil, ErrFunnelInvalidStatus
	}

	now := time.Now()
	lead.Status = models.FunnelStatusPaid
	lead.PaymentMethod = "درگاه آنلاین (دمو)"
	lead.TrackingCode = generateFunnelTrackingCode()
	lead.PaidAt = &now

	if err := s.repo.Update(ctx, lead); err != nil {
		return nil, err
	}
	return leadToCheckoutDTO(lead), nil
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

func leadToCheckoutDTO(lead *models.FunnelLead) *FunnelCheckoutDTO {
	return &FunnelCheckoutDTO{
		CheckoutToken: lead.CheckoutToken,
		FirstName:     lead.FirstName,
		LastName:      lead.LastName,
		Phone:         lead.Phone,
		CoachName:     lead.CoachName,
		PackageTitle:  lead.PackageTitle,
		Amount:        lead.AmountCents,
		Status:        lead.Status,
		TrackingCode:  lead.TrackingCode,
		AnalysisTitle: lead.AnalysisTitle,
		PaidAt:        lead.PaidAt,
	}
}

func leadToAdminItem(lead *models.FunnelLead) AdminFunnelLeadItem {
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
		TrackingCode:       lead.TrackingCode,
		PaidAt:             lead.PaidAt,
		CreatedAt:          lead.CreatedAt,
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
	p := strings.TrimSpace(phone)
	p = strings.ReplaceAll(p, " ", "")
	p = strings.ReplaceAll(p, "-", "")
	return p
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
