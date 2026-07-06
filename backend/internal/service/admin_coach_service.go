package service

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

// AdminCoachItem for GET /admin/coaches list.
type AdminCoachItem struct {
	ID           uint      `json:"id"`
	DisplayName  string    `json:"displayName"`
	Slug         string    `json:"slug"`
	Title        string    `json:"title"`
	Status       string    `json:"status"`
	Phone        string    `json:"phone"`
	City         string    `json:"city"`
	IsPublished  bool      `json:"isPublished"`
	IsActive     bool      `json:"isActive"`
	StudentCount int64     `json:"studentCount"`
	CreatedAt    time.Time `json:"createdAt"`
}

// AdminCoachAchievement for admin review detail.
type AdminCoachAchievement struct {
	ID          uint   `json:"id"`
	Type        string `json:"type"`
	Title       string `json:"title"`
	Issuer      string `json:"issuer,omitempty"`
	Year        *int   `json:"year,omitempty"`
	Description string `json:"description,omitempty"`
	ImageURL    string `json:"imageUrl,omitempty"`
	SortOrder   int    `json:"sortOrder"`
}

// AdminCoachDetail for GET /admin/coaches/:id.
type AdminCoachDetail struct {
	AdminCoachItem
	Bio           string                  `json:"bio"`
	AboutCoach    string                  `json:"aboutCoach"`
	Specialty     string                  `json:"specialty"`
	NationalID    string                  `json:"nationalId"`
	AvatarURL     string                  `json:"avatarUrl"`
	CoverImageURL string                  `json:"coverImageUrl"`
	Instagram     string                  `json:"instagram,omitempty"`
	Telegram      string                  `json:"telegram,omitempty"`
	WhatsApp      string                  `json:"whatsapp,omitempty"`
	Website       string                  `json:"website,omitempty"`
	PublicURL     string                  `json:"publicUrl"`
	Achievements  []AdminCoachAchievement `json:"achievements"`
}

// AdminCoachListResponse for paginated coach list.
type AdminCoachListResponse struct {
	Items    []AdminCoachItem `json:"items"`
	Page     int              `json:"page"`
	PageSize int              `json:"pageSize"`
	Total    int64            `json:"total"`
}

// AdminCoachPatchRequest for PATCH /admin/coaches/:id.
type AdminCoachPatchRequest struct {
	IsPublished *bool   `json:"isPublished"`
	IsActive    *bool   `json:"isActive"`
	Status      *string `json:"status"`
}

type AdminCoachService interface {
	ListCoaches(ctx context.Context, page, pageSize int, query, status string) (*AdminCoachListResponse, error)
	GetCoachByID(ctx context.Context, coachUserID uint) (*AdminCoachDetail, error)
	UpdateCoach(ctx context.Context, coachUserID uint, req *AdminCoachPatchRequest) (*AdminCoachDetail, error)
}

type adminCoachService struct {
	coachRepo       repository.CoachProfileRepository
	achievementRepo repository.CoachAchievementRepository
}

func NewAdminCoachService(
	coachRepo repository.CoachProfileRepository,
	achievementRepo repository.CoachAchievementRepository,
) AdminCoachService {
	return &adminCoachService{
		coachRepo:       coachRepo,
		achievementRepo: achievementRepo,
	}
}

func (s *adminCoachService) ListCoaches(ctx context.Context, page, pageSize int, query, status string) (*AdminCoachListResponse, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	profiles, total, err := s.coachRepo.ListCoaches(ctx, page, pageSize, query, status)
	if err != nil {
		return nil, err
	}

	items := make([]AdminCoachItem, 0, len(profiles))
	for i := range profiles {
		item, err := s.profileToItem(ctx, &profiles[i])
		if err != nil {
			continue
		}
		items = append(items, *item)
	}

	return &AdminCoachListResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	}, nil
}

func (s *adminCoachService) GetCoachByID(ctx context.Context, coachUserID uint) (*AdminCoachDetail, error) {
	profile, err := s.coachRepo.FindByUserID(ctx, coachUserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoachProfileNotFound
		}
		return nil, err
	}
	item, err := s.profileToItem(ctx, profile)
	if err != nil {
		return nil, err
	}

	achievements, err := s.achievementRepo.ListByCoachUserID(ctx, coachUserID)
	if err != nil {
		return nil, err
	}
	achievementDTOs := make([]AdminCoachAchievement, 0, len(achievements))
	for i := range achievements {
		achievementDTOs = append(achievementDTOs, toAdminCoachAchievement(&achievements[i]))
	}

	return &AdminCoachDetail{
		AdminCoachItem: *item,
		Bio:            profile.Bio,
		AboutCoach:     profile.AboutCoach,
		Specialty:      profile.Specialty,
		NationalID:     profile.NationalID,
		AvatarURL:      profile.AvatarURL,
		CoverImageURL:  profile.CoverImageURL,
		Instagram:      profile.Instagram,
		Telegram:       profile.Telegram,
		WhatsApp:       profile.WhatsApp,
		Website:        profile.Website,
		PublicURL:      "/coach/" + profile.Slug,
		Achievements:   achievementDTOs,
	}, nil
}

func (s *adminCoachService) UpdateCoach(ctx context.Context, coachUserID uint, req *AdminCoachPatchRequest) (*AdminCoachDetail, error) {
	profile, err := s.coachRepo.FindByUserID(ctx, coachUserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoachProfileNotFound
		}
		return nil, err
	}
	if req.Status != nil {
		status := *req.Status
		if !models.IsValidCoachProfileStatus(status) {
			return nil, errors.New("invalid status")
		}
		profile.Status = status
		if status != models.CoachProfileStatusApproved {
			profile.IsPublished = false
		}
	}
	if req.IsPublished != nil {
		if *req.IsPublished && profile.Status != models.CoachProfileStatusApproved {
			return nil, errors.New("coach must be approved before publishing")
		}
		profile.IsPublished = *req.IsPublished
	}
	if req.IsActive != nil {
		profile.IsActive = *req.IsActive
	}
	if err := s.coachRepo.Update(ctx, profile); err != nil {
		return nil, err
	}
	return s.GetCoachByID(ctx, coachUserID)
}

func (s *adminCoachService) profileToItem(ctx context.Context, p *models.CoachProfile) (*AdminCoachItem, error) {
	count, err := s.coachRepo.CountStudentsByCoachID(ctx, p.UserID)
	if err != nil {
		return nil, err
	}
	status := p.Status
	if status == "" {
		status = models.CoachProfileStatusPending
	}
	return &AdminCoachItem{
		ID:           p.UserID,
		DisplayName:  p.DisplayName,
		Slug:         p.Slug,
		Title:        p.Title,
		Status:       status,
		Phone:        p.ContactPhone,
		City:         p.City,
		IsPublished:  p.IsPublished,
		IsActive:     p.IsActive,
		StudentCount: count,
		CreatedAt:    p.CreatedAt,
	}, nil
}

func toAdminCoachAchievement(a *models.CoachAchievement) AdminCoachAchievement {
	return AdminCoachAchievement{
		ID:          a.ID,
		Type:        a.Type,
		Title:       a.Title,
		Issuer:      a.Issuer,
		Year:        a.Year,
		Description: a.Description,
		ImageURL:    a.ImageURL,
		SortOrder:   a.SortOrder,
	}
}
