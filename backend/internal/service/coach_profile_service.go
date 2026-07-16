package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/pkg/slug"
	"github.com/yourusername/fitness-management/internal/repository"
)

var (
	ErrCoachProfileNotFound       = errors.New("coach profile not found")
	ErrCoachNotPublished          = errors.New("coach profile is not published")
	ErrSlugTaken                  = errors.New("slug already in use")
	ErrInvalidSlug                = errors.New("invalid slug")
	ErrCoachProfileIncomplete     = errors.New("coach profile is incomplete")
	ErrCoachProfileAlreadyReviewing = errors.New("coach profile is already under review")
	ErrCoachProfileAlreadyApproved  = errors.New("coach profile is already approved")
	ErrInvalidCoachNationalID     = errors.New("invalid national id")
	ErrMissingGrade3Certificate   = errors.New("grade-3 coaching certificate is required")
)

// Canonical title for the mandatory Iranian grade-3 coaching certificate.
const Grade3CoachingCertificateTitle = "مدرک مربی‌گری درجه سه"

// CoachSocialLinks groups public social/contact fields.
type CoachSocialLinks struct {
	Phone     string `json:"phone"`
	Instagram string `json:"instagram"`
	Telegram  string `json:"telegram"`
	WhatsApp  string `json:"whatsapp"`
	Website   string `json:"website"`
}

// CoachProfileDTO is the authenticated coach's full profile for editing.
type CoachProfileDTO struct {
	UserID        uint             `json:"userId"`
	Slug          string           `json:"slug"`
	DisplayName   string           `json:"displayName"`
	Title         string           `json:"title"`
	Bio           string           `json:"bio"`
	AboutCoach    string           `json:"aboutCoach"`
	Specialty     string           `json:"specialty"`
	NationalID    string           `json:"nationalId"`
	City          string           `json:"city"`
	Status        string           `json:"status"`
	AvatarURL     string           `json:"avatarUrl"`
	CoverImageURL string           `json:"coverImageUrl"`
	Social        CoachSocialLinks `json:"social"`
	IsPublished   bool             `json:"isPublished"`
	PublicURL     string           `json:"publicUrl"`
	UpdatedAt     time.Time        `json:"updatedAt"`
}

// CoachProfileUpdateRequest for PUT /coach/profile.
type CoachProfileUpdateRequest struct {
	Slug          *string `json:"slug"`
	DisplayName   *string `json:"displayName"`
	Title         *string `json:"title"`
	Bio           *string `json:"bio"`
	AboutCoach    *string `json:"aboutCoach"`
	Specialty     *string `json:"specialty"`
	NationalID    *string `json:"nationalId"`
	City          *string `json:"city"`
	ContactPhone  *string `json:"contactPhone"`
	Instagram     *string `json:"instagram"`
	Telegram      *string `json:"telegram"`
	WhatsApp      *string `json:"whatsapp"`
	Website       *string `json:"website"`
	IsPublished   *bool   `json:"isPublished"`
}

// CoachProfileSubmitResponse for POST /coach/profile/submit-request.
type CoachProfileSubmitResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// SlugCheckResponse for GET /coach/profile/slug/check.
type SlugCheckResponse struct {
	Slug      string `json:"slug"`
	Available bool   `json:"available"`
}

// PublicCoachDTO for GET /coaches/:slug.
type PublicCoachDTO struct {
	CoachID       uint                   `json:"coachId"`
	Slug          string                 `json:"slug"`
	DisplayName   string                 `json:"displayName"`
	Title         string                 `json:"title"`
	Bio           string                 `json:"bio"`
	AboutCoach    string                 `json:"aboutCoach"`
	Specialty     string                 `json:"specialty"`
	AvatarURL     string                 `json:"avatarUrl"`
	CoverImageURL string                 `json:"coverImageUrl"`
	Social        CoachSocialLinks       `json:"social"`
	Achievements  []PublicAchievementDTO `json:"achievements"`
}

// PublicPlanDTO for public coach landing plans.
type PublicPlanDTO struct {
	ID              uint   `json:"id"`
	Title           string `json:"title"`
	Subtitle        string `json:"subtitle"`
	PlanType        string `json:"planType"`
	Price           int64  `json:"price"`
	DiscountPrice   int64  `json:"discountPrice"`
	DiscountPercent int    `json:"discountPercent"`
	DurationDays    int    `json:"durationDays"`
	IsPopular       bool   `json:"isPopular"`
	FeaturesText    string `json:"featuresText"`
}

// PublicCoachListItem for GET /coaches.
type PublicCoachListItem struct {
	CoachID     uint   `json:"coachId"`
	Slug        string `json:"slug"`
	DisplayName string `json:"displayName"`
	Title       string `json:"title"`
	Specialty   string `json:"specialty"`
	AvatarURL   string `json:"avatarUrl"`
}

// PublicCoachListResponse for paginated public coach list.
type PublicCoachListResponse struct {
	Items    []PublicCoachListItem `json:"items"`
	Page     int                   `json:"page"`
	PageSize int                   `json:"pageSize"`
	Total    int64                 `json:"total"`
}

type CoachProfileService interface {
	GetProfile(ctx context.Context, coachUserID uint) (*CoachProfileDTO, error)
	UpdateProfile(ctx context.Context, coachUserID uint, req *CoachProfileUpdateRequest) (*CoachProfileDTO, error)
	CheckSlugAvailable(ctx context.Context, slugInput string, coachUserID uint) (*SlugCheckResponse, error)
	UpdateAvatarURL(ctx context.Context, coachUserID uint, url string) (*CoachProfileDTO, error)
	UpdateCoverURL(ctx context.Context, coachUserID uint, url string) (*CoachProfileDTO, error)
	SubmitProfileRequest(ctx context.Context, coachUserID uint) (*CoachProfileSubmitResponse, error)
	GetPublicProfile(ctx context.Context, slug string) (*PublicCoachDTO, error)
	ListPublicPlans(ctx context.Context, slug string) ([]PublicPlanDTO, error)
	ListPublishedCoaches(ctx context.Context, page, pageSize int) (*PublicCoachListResponse, error)
}

type coachProfileService struct {
	coachRepo         repository.CoachProfileRepository
	planRepo          repository.ServicePlanRepository
	achievementRepo   repository.CoachAchievementRepository
}

func NewCoachProfileService(
	coachRepo repository.CoachProfileRepository,
	planRepo repository.ServicePlanRepository,
	achievementRepo repository.CoachAchievementRepository,
) CoachProfileService {
	return &coachProfileService{
		coachRepo:       coachRepo,
		planRepo:        planRepo,
		achievementRepo: achievementRepo,
	}
}

func (s *coachProfileService) GetProfile(ctx context.Context, coachUserID uint) (*CoachProfileDTO, error) {
	profile, err := s.coachRepo.FindByUserID(ctx, coachUserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoachProfileNotFound
		}
		return nil, err
	}
	return toCoachProfileDTO(profile), nil
}

func (s *coachProfileService) UpdateProfile(ctx context.Context, coachUserID uint, req *CoachProfileUpdateRequest) (*CoachProfileDTO, error) {
	profile, err := s.coachRepo.FindByUserID(ctx, coachUserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoachProfileNotFound
		}
		return nil, err
	}

	if profile.Status == models.CoachProfileStatusReviewing {
		return nil, ErrCoachProfileAlreadyReviewing
	}

	// Slug and displayName are admin-only — ignore any coach-provided values.
	if req.Title != nil {
		profile.Title = *req.Title
	}
	if req.Bio != nil {
		profile.Bio = *req.Bio
	}
	if req.AboutCoach != nil {
		profile.AboutCoach = *req.AboutCoach
	}
	if req.Specialty != nil {
		profile.Specialty = *req.Specialty
	}
	if req.NationalID != nil {
		nid := strings.TrimSpace(*req.NationalID)
		if nid != "" && !models.IsValidIranNationalID(nid) {
			return nil, ErrInvalidCoachNationalID
		}
		profile.NationalID = nid
	}
	if req.City != nil {
		profile.City = strings.TrimSpace(*req.City)
	}
	if req.ContactPhone != nil {
		profile.ContactPhone = *req.ContactPhone
	}
	if req.Instagram != nil {
		profile.Instagram = *req.Instagram
	}
	if req.Telegram != nil {
		profile.Telegram = *req.Telegram
	}
	if req.WhatsApp != nil {
		profile.WhatsApp = *req.WhatsApp
	}
	if req.Website != nil {
		profile.Website = *req.Website
	}
	if req.IsPublished != nil {
		if profile.Status != models.CoachProfileStatusApproved {
			return nil, ErrCoachProfileIncomplete
		}
		profile.IsPublished = *req.IsPublished
	}

	if err := s.coachRepo.Update(ctx, profile); err != nil {
		return nil, err
	}
	return toCoachProfileDTO(profile), nil
}

func (s *coachProfileService) SubmitProfileRequest(ctx context.Context, coachUserID uint) (*CoachProfileSubmitResponse, error) {
	profile, err := s.coachRepo.FindByUserID(ctx, coachUserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoachProfileNotFound
		}
		return nil, err
	}

	switch profile.Status {
	case models.CoachProfileStatusReviewing:
		return nil, ErrCoachProfileAlreadyReviewing
	case models.CoachProfileStatusApproved:
		return nil, ErrCoachProfileAlreadyApproved
	}

	if missing := coachProfileSubmissionMissingFields(profile); len(missing) > 0 {
		return nil, ErrCoachProfileIncomplete
	}

	achievements, err := s.achievementRepo.ListByCoachUserID(ctx, coachUserID)
	if err != nil {
		return nil, err
	}
	if !hasGrade3CoachingCertificate(achievements) {
		return nil, ErrMissingGrade3Certificate
	}

	profile.Status = models.CoachProfileStatusReviewing
	if err := s.coachRepo.Update(ctx, profile); err != nil {
		return nil, err
	}

	return &CoachProfileSubmitResponse{
		Status:  profile.Status,
		Message: "profile submitted for admin review",
	}, nil
}

func coachProfileSubmissionMissingFields(p *models.CoachProfile) []string {
	missing := make([]string, 0, 5)
	if strings.TrimSpace(p.DisplayName) == "" {
		missing = append(missing, "displayName")
	}
	if strings.TrimSpace(p.Title) == "" {
		missing = append(missing, "title")
	}
	if strings.TrimSpace(p.City) == "" {
		missing = append(missing, "city")
	}
	if strings.TrimSpace(p.ContactPhone) == "" {
		missing = append(missing, "contactPhone")
	}
	nid := strings.TrimSpace(p.NationalID)
	if nid == "" || !models.IsValidIranNationalID(nid) {
		missing = append(missing, "nationalId")
	}
	return missing
}

func normalizePersianText(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, "ي", "ی")
	s = strings.ReplaceAll(s, "ك", "ک")
	s = strings.ReplaceAll(s, "‌", "") // zero-width non-joiner
	s = strings.ReplaceAll(s, " ", "")
	return s
}

func hasGrade3CoachingCertificate(achievements []models.CoachAchievement) bool {
	needle := normalizePersianText(Grade3CoachingCertificateTitle)
	for i := range achievements {
		a := &achievements[i]
		if strings.TrimSpace(a.ImageURL) == "" {
			continue
		}
		if a.Type != "qualification" && a.Type != "certificate" {
			continue
		}
		title := normalizePersianText(a.Title)
		if strings.Contains(title, needle) ||
			(strings.Contains(title, "مربی") && strings.Contains(title, "درجهسه")) {
			return true
		}
	}
	return false
}

func (s *coachProfileService) CheckSlugAvailable(ctx context.Context, slugInput string, coachUserID uint) (*SlugCheckResponse, error) {
	normalized := slug.Normalize(slugInput)
	if normalized == "" {
		return &SlugCheckResponse{Slug: "", Available: false}, nil
	}
	taken, err := s.coachRepo.SlugExists(ctx, normalized, coachUserID)
	if err != nil {
		return nil, err
	}
	return &SlugCheckResponse{Slug: normalized, Available: !taken}, nil
}

func (s *coachProfileService) UpdateAvatarURL(ctx context.Context, coachUserID uint, url string) (*CoachProfileDTO, error) {
	profile, err := s.coachRepo.FindByUserID(ctx, coachUserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoachProfileNotFound
		}
		return nil, err
	}
	profile.AvatarURL = url
	if err := s.coachRepo.Update(ctx, profile); err != nil {
		return nil, err
	}
	return toCoachProfileDTO(profile), nil
}

func (s *coachProfileService) UpdateCoverURL(ctx context.Context, coachUserID uint, url string) (*CoachProfileDTO, error) {
	profile, err := s.coachRepo.FindByUserID(ctx, coachUserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoachProfileNotFound
		}
		return nil, err
	}
	profile.CoverImageURL = url
	if err := s.coachRepo.Update(ctx, profile); err != nil {
		return nil, err
	}
	return toCoachProfileDTO(profile), nil
}

func (s *coachProfileService) GetPublicProfile(ctx context.Context, slugParam string) (*PublicCoachDTO, error) {
	profile, err := s.coachRepo.FindPublishedBySlug(ctx, slug.Normalize(slugParam))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoachNotPublished
		}
		return nil, err
	}
	achievements, err := s.achievementRepo.ListVisibleByCoachUserID(ctx, profile.UserID)
	if err != nil {
		return nil, err
	}
	return toPublicCoachDTO(profile, achievements), nil
}

func (s *coachProfileService) ListPublishedCoaches(ctx context.Context, page, pageSize int) (*PublicCoachListResponse, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}
	profiles, total, err := s.coachRepo.ListPublished(ctx, page, pageSize)
	if err != nil {
		return nil, err
	}
	items := make([]PublicCoachListItem, 0, len(profiles))
	for i := range profiles {
		p := &profiles[i]
		items = append(items, PublicCoachListItem{
			CoachID:     p.UserID,
			Slug:        p.Slug,
			DisplayName: p.DisplayName,
			Title:       p.Title,
			Specialty:   p.Specialty,
			AvatarURL:   p.AvatarURL,
		})
	}
	return &PublicCoachListResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	}, nil
}

func (s *coachProfileService) ListPublicPlans(ctx context.Context, slugParam string) ([]PublicPlanDTO, error) {
	profile, err := s.coachRepo.FindPublishedBySlug(ctx, slug.Normalize(slugParam))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoachNotPublished
		}
		return nil, err
	}
	plans, err := s.planRepo.ListActiveByCoachID(ctx, profile.UserID)
	if err != nil {
		return nil, err
	}
	out := make([]PublicPlanDTO, 0, len(plans))
	for i := range plans {
		out = append(out, toPublicPlanDTO(&plans[i]))
	}
	return out, nil
}

func toCoachProfileDTO(p *models.CoachProfile) *CoachProfileDTO {
	status := p.Status
	if status == "" {
		status = models.CoachProfileStatusPending
	}
	return &CoachProfileDTO{
		UserID:        p.UserID,
		Slug:          p.Slug,
		DisplayName:   p.DisplayName,
		Title:         p.Title,
		Bio:           p.Bio,
		AboutCoach:    p.AboutCoach,
		Specialty:     p.Specialty,
		NationalID:    p.NationalID,
		City:          p.City,
		Status:        status,
		AvatarURL:     p.AvatarURL,
		CoverImageURL: p.CoverImageURL,
		Social: CoachSocialLinks{
			Phone:     p.ContactPhone,
			Instagram: p.Instagram,
			Telegram:  p.Telegram,
			WhatsApp:  p.WhatsApp,
			Website:   p.Website,
		},
		IsPublished: p.IsPublished,
		PublicURL:   "/coach/" + p.Slug,
		UpdatedAt:   p.UpdatedAt,
	}
}

func toPublicCoachDTO(p *models.CoachProfile, achievements []models.CoachAchievement) *PublicCoachDTO {
	achievementDTOs := make([]PublicAchievementDTO, 0, len(achievements))
	for i := range achievements {
		achievementDTOs = append(achievementDTOs, toPublicAchievementDTO(&achievements[i]))
	}
	return &PublicCoachDTO{
		CoachID:       p.UserID,
		Slug:          p.Slug,
		DisplayName:   p.DisplayName,
		Title:         p.Title,
		Bio:           p.Bio,
		AboutCoach:    p.AboutCoach,
		Specialty:     p.Specialty,
		AvatarURL:     p.AvatarURL,
		CoverImageURL: p.CoverImageURL,
		Social: CoachSocialLinks{
			Phone:     p.ContactPhone,
			Instagram: p.Instagram,
			Telegram:  p.Telegram,
			WhatsApp:  p.WhatsApp,
			Website:   p.Website,
		},
		Achievements: achievementDTOs,
	}
}

func toPublicPlanDTO(p *models.ServicePlan) PublicPlanDTO {
	return PublicPlanDTO{
		ID:              p.ID,
		Title:           p.Name,
		Subtitle:        p.Subtitle,
		PlanType:        p.Type,
		Price:           p.PriceCents,
		DiscountPrice:   p.DiscountPriceCents,
		DiscountPercent: p.DiscountPercent,
		DurationDays:    p.DurationDays,
		IsPopular:       p.IsPopular,
		FeaturesText:    p.FeaturesText,
	}
}
