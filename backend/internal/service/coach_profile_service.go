package service

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/pkg/slug"
	"github.com/yourusername/fitness-management/internal/repository"
)

var (
	ErrCoachProfileNotFound = errors.New("coach profile not found")
	ErrCoachNotPublished    = errors.New("coach profile is not published")
	ErrSlugTaken            = errors.New("slug already in use")
	ErrInvalidSlug          = errors.New("invalid slug")
)

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
	UserID       uint             `json:"userId"`
	Slug         string           `json:"slug"`
	DisplayName  string           `json:"displayName"`
	Title        string           `json:"title"`
	Bio          string           `json:"bio"`
	AboutCoach   string           `json:"aboutCoach"`
	Specialty    string           `json:"specialty"`
	AvatarURL    string           `json:"avatarUrl"`
	CoverImageURL string          `json:"coverImageUrl"`
	Social       CoachSocialLinks `json:"social"`
	IsPublished  bool             `json:"isPublished"`
	PublicURL    string           `json:"publicUrl"`
	UpdatedAt    time.Time        `json:"updatedAt"`
}

// CoachProfileUpdateRequest for PUT /coach/profile.
type CoachProfileUpdateRequest struct {
	Slug          *string `json:"slug"`
	DisplayName   *string `json:"displayName"`
	Title         *string `json:"title"`
	Bio           *string `json:"bio"`
	AboutCoach    *string `json:"aboutCoach"`
	Specialty     *string `json:"specialty"`
	ContactPhone  *string `json:"contactPhone"`
	Instagram     *string `json:"instagram"`
	Telegram      *string `json:"telegram"`
	WhatsApp      *string `json:"whatsapp"`
	Website       *string `json:"website"`
	IsPublished   *bool   `json:"isPublished"`
}

// SlugCheckResponse for GET /coach/profile/slug/check.
type SlugCheckResponse struct {
	Slug      string `json:"slug"`
	Available bool   `json:"available"`
}

// PublicCoachDTO for GET /coaches/:slug.
type PublicCoachDTO struct {
	Slug         string           `json:"slug"`
	DisplayName  string           `json:"displayName"`
	Title        string           `json:"title"`
	Bio          string           `json:"bio"`
	AboutCoach   string           `json:"aboutCoach"`
	Specialty    string           `json:"specialty"`
	AvatarURL    string           `json:"avatarUrl"`
	CoverImageURL string          `json:"coverImageUrl"`
	Social       CoachSocialLinks `json:"social"`
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

type CoachProfileService interface {
	GetProfile(ctx context.Context, coachUserID uint) (*CoachProfileDTO, error)
	UpdateProfile(ctx context.Context, coachUserID uint, req *CoachProfileUpdateRequest) (*CoachProfileDTO, error)
	CheckSlugAvailable(ctx context.Context, slugInput string, coachUserID uint) (*SlugCheckResponse, error)
	UpdateAvatarURL(ctx context.Context, coachUserID uint, url string) (*CoachProfileDTO, error)
	UpdateCoverURL(ctx context.Context, coachUserID uint, url string) (*CoachProfileDTO, error)
	GetPublicProfile(ctx context.Context, slug string) (*PublicCoachDTO, error)
	ListPublicPlans(ctx context.Context, slug string) ([]PublicPlanDTO, error)
}

type coachProfileService struct {
	coachRepo repository.CoachProfileRepository
	planRepo  repository.ServicePlanRepository
}

func NewCoachProfileService(
	coachRepo repository.CoachProfileRepository,
	planRepo repository.ServicePlanRepository,
) CoachProfileService {
	return &coachProfileService{
		coachRepo: coachRepo,
		planRepo:  planRepo,
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

	if req.Slug != nil {
		normalized := slug.Normalize(*req.Slug)
		if normalized == "" {
			return nil, ErrInvalidSlug
		}
		taken, err := s.coachRepo.SlugExists(ctx, normalized, coachUserID)
		if err != nil {
			return nil, err
		}
		if taken {
			return nil, ErrSlugTaken
		}
		profile.Slug = normalized
	}
	if req.DisplayName != nil {
		profile.DisplayName = *req.DisplayName
	}
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
		profile.IsPublished = *req.IsPublished
	}

	if err := s.coachRepo.Update(ctx, profile); err != nil {
		return nil, err
	}
	return toCoachProfileDTO(profile), nil
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
	return toPublicCoachDTO(profile), nil
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
	return &CoachProfileDTO{
		UserID:        p.UserID,
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
		IsPublished: p.IsPublished,
		PublicURL:   "/coach/" + p.Slug,
		UpdatedAt:   p.UpdatedAt,
	}
}

func toPublicCoachDTO(p *models.CoachProfile) *PublicCoachDTO {
	return &PublicCoachDTO{
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
