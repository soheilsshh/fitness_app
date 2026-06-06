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
	IsPublished  bool      `json:"isPublished"`
	IsActive     bool      `json:"isActive"`
	StudentCount int64     `json:"studentCount"`
	CreatedAt    time.Time `json:"createdAt"`
}

// AdminCoachDetail for GET /admin/coaches/:id.
type AdminCoachDetail struct {
	AdminCoachItem
	Bio       string `json:"bio"`
	Specialty string `json:"specialty"`
	AvatarURL string `json:"avatarUrl"`
	Phone     string `json:"phone"`
	PublicURL string `json:"publicUrl"`
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
	IsPublished *bool `json:"isPublished"`
	IsActive    *bool `json:"isActive"`
}

type AdminCoachService interface {
	ListCoaches(ctx context.Context, page, pageSize int, query string) (*AdminCoachListResponse, error)
	GetCoachByID(ctx context.Context, coachUserID uint) (*AdminCoachDetail, error)
	UpdateCoach(ctx context.Context, coachUserID uint, req *AdminCoachPatchRequest) (*AdminCoachDetail, error)
}

type adminCoachService struct {
	coachRepo repository.CoachProfileRepository
}

func NewAdminCoachService(coachRepo repository.CoachProfileRepository) AdminCoachService {
	return &adminCoachService{coachRepo: coachRepo}
}

func (s *adminCoachService) ListCoaches(ctx context.Context, page, pageSize int, query string) (*AdminCoachListResponse, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	profiles, total, err := s.coachRepo.ListCoaches(ctx, page, pageSize, query)
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
	return &AdminCoachDetail{
		AdminCoachItem: *item,
		Bio:            profile.Bio,
		Specialty:      profile.Specialty,
		AvatarURL:      profile.AvatarURL,
		Phone:          profile.ContactPhone,
		PublicURL:      "/coach/" + profile.Slug,
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
	if req.IsPublished != nil {
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
	return &AdminCoachItem{
		ID:           p.UserID,
		DisplayName:  p.DisplayName,
		Slug:         p.Slug,
		Title:        p.Title,
		IsPublished:  p.IsPublished,
		IsActive:     p.IsActive,
		StudentCount: count,
		CreatedAt:    p.CreatedAt,
	}, nil
}
