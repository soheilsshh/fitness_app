package service

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var (
	ErrCoachAchievementNotFound   = errors.New("achievement not found")
	ErrCoachAchievementForbidden  = errors.New("achievement does not belong to this coach")
	ErrInvalidAchievementType     = errors.New("invalid achievement type")
	ErrAchievementTitleRequired   = errors.New("title is required")
)

// CoachAchievementDTO is the authenticated coach's achievement for editing.
type CoachAchievementDTO struct {
	ID          uint   `json:"id"`
	Type        string `json:"type"`
	Title       string `json:"title"`
	Issuer      string `json:"issuer"`
	Year        *int   `json:"year,omitempty"`
	Description string `json:"description"`
	ImageURL    string `json:"imageUrl"`
	SortOrder   int    `json:"sortOrder"`
	IsVisible   bool   `json:"isVisible"`
}

// PublicAchievementDTO is returned on the public coach landing page.
type PublicAchievementDTO struct {
	ID          uint   `json:"id"`
	Type        string `json:"type"`
	Title       string `json:"title"`
	Issuer      string `json:"issuer"`
	Year        *int   `json:"year,omitempty"`
	Description string `json:"description"`
	ImageURL    string `json:"imageUrl"`
	SortOrder   int    `json:"sortOrder"`
}

// CoachAchievementListResponse for GET /coach/profile/achievements.
type CoachAchievementListResponse struct {
	Items []CoachAchievementDTO `json:"items"`
}

// CoachAchievementCreateRequest for POST /coach/profile/achievements.
type CoachAchievementCreateRequest struct {
	Type        string `json:"type"`
	Title       string `json:"title"`
	Issuer      string `json:"issuer"`
	Year        *int   `json:"year"`
	Description string `json:"description"`
	ImageURL    string `json:"imageUrl"`
	SortOrder   *int   `json:"sortOrder"`
	IsVisible   *bool  `json:"isVisible"`
}

// CoachAchievementUpdateRequest for PUT /coach/profile/achievements/:id.
type CoachAchievementUpdateRequest struct {
	Type        *string `json:"type"`
	Title       *string `json:"title"`
	Issuer      *string `json:"issuer"`
	Year        *int    `json:"year"`
	Description *string `json:"description"`
	ImageURL    *string `json:"imageUrl"`
	SortOrder   *int    `json:"sortOrder"`
	IsVisible   *bool   `json:"isVisible"`
}

type CoachAchievementService interface {
	ListAchievements(ctx context.Context, coachUserID uint) (*CoachAchievementListResponse, error)
	CreateAchievement(ctx context.Context, coachUserID uint, req *CoachAchievementCreateRequest) (*CoachAchievementDTO, error)
	UpdateAchievement(ctx context.Context, coachUserID, achievementID uint, req *CoachAchievementUpdateRequest) (*CoachAchievementDTO, error)
	DeleteAchievement(ctx context.Context, coachUserID, achievementID uint) error
	ListPublicAchievements(ctx context.Context, coachUserID uint) ([]PublicAchievementDTO, error)
}

type coachAchievementService struct {
	achievementRepo repository.CoachAchievementRepository
}

func NewCoachAchievementService(achievementRepo repository.CoachAchievementRepository) CoachAchievementService {
	return &coachAchievementService{achievementRepo: achievementRepo}
}

func (s *coachAchievementService) ListAchievements(ctx context.Context, coachUserID uint) (*CoachAchievementListResponse, error) {
	list, err := s.achievementRepo.ListByCoachUserID(ctx, coachUserID)
	if err != nil {
		return nil, err
	}
	items := make([]CoachAchievementDTO, 0, len(list))
	for i := range list {
		items = append(items, toCoachAchievementDTO(&list[i]))
	}
	return &CoachAchievementListResponse{Items: items}, nil
}

func (s *coachAchievementService) CreateAchievement(ctx context.Context, coachUserID uint, req *CoachAchievementCreateRequest) (*CoachAchievementDTO, error) {
	achievementType := strings.TrimSpace(req.Type)
	if !models.IsValidCoachAchievementType(achievementType) {
		return nil, ErrInvalidAchievementType
	}
	title := strings.TrimSpace(req.Title)
	if title == "" {
		return nil, ErrAchievementTitleRequired
	}

	sortOrder := 0
	if req.SortOrder != nil {
		sortOrder = *req.SortOrder
	} else {
		maxOrder, err := s.achievementRepo.MaxSortOrder(ctx, coachUserID)
		if err != nil {
			return nil, err
		}
		sortOrder = maxOrder + 1
	}

	isVisible := true
	if req.IsVisible != nil {
		isVisible = *req.IsVisible
	}

	achievement := &models.CoachAchievement{
		CoachUserID: coachUserID,
		Type:        achievementType,
		Title:       title,
		Issuer:      strings.TrimSpace(req.Issuer),
		Year:        req.Year,
		Description: strings.TrimSpace(req.Description),
		ImageURL:    strings.TrimSpace(req.ImageURL),
		SortOrder:   sortOrder,
		IsVisible:   isVisible,
	}
	if err := s.achievementRepo.Create(ctx, achievement); err != nil {
		return nil, err
	}
	dto := toCoachAchievementDTO(achievement)
	return &dto, nil
}

func (s *coachAchievementService) UpdateAchievement(ctx context.Context, coachUserID, achievementID uint, req *CoachAchievementUpdateRequest) (*CoachAchievementDTO, error) {
	achievement, err := s.achievementRepo.FindByID(ctx, achievementID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoachAchievementNotFound
		}
		return nil, err
	}
	if achievement.CoachUserID != coachUserID {
		return nil, ErrCoachAchievementForbidden
	}

	if req.Type != nil {
		achievementType := strings.TrimSpace(*req.Type)
		if !models.IsValidCoachAchievementType(achievementType) {
			return nil, ErrInvalidAchievementType
		}
		achievement.Type = achievementType
	}
	if req.Title != nil {
		title := strings.TrimSpace(*req.Title)
		if title == "" {
			return nil, ErrAchievementTitleRequired
		}
		achievement.Title = title
	}
	if req.Issuer != nil {
		achievement.Issuer = strings.TrimSpace(*req.Issuer)
	}
	if req.Year != nil {
		achievement.Year = req.Year
	}
	if req.Description != nil {
		achievement.Description = strings.TrimSpace(*req.Description)
	}
	if req.ImageURL != nil {
		achievement.ImageURL = strings.TrimSpace(*req.ImageURL)
	}
	if req.SortOrder != nil {
		achievement.SortOrder = *req.SortOrder
	}
	if req.IsVisible != nil {
		achievement.IsVisible = *req.IsVisible
	}

	if err := s.achievementRepo.Update(ctx, achievement); err != nil {
		return nil, err
	}
	dto := toCoachAchievementDTO(achievement)
	return &dto, nil
}

func (s *coachAchievementService) DeleteAchievement(ctx context.Context, coachUserID, achievementID uint) error {
	achievement, err := s.achievementRepo.FindByID(ctx, achievementID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrCoachAchievementNotFound
		}
		return err
	}
	if achievement.CoachUserID != coachUserID {
		return ErrCoachAchievementForbidden
	}
	return s.achievementRepo.Delete(ctx, achievementID)
}

func (s *coachAchievementService) ListPublicAchievements(ctx context.Context, coachUserID uint) ([]PublicAchievementDTO, error) {
	list, err := s.achievementRepo.ListVisibleByCoachUserID(ctx, coachUserID)
	if err != nil {
		return nil, err
	}
	out := make([]PublicAchievementDTO, 0, len(list))
	for i := range list {
		out = append(out, toPublicAchievementDTO(&list[i]))
	}
	return out, nil
}

func toCoachAchievementDTO(a *models.CoachAchievement) CoachAchievementDTO {
	return CoachAchievementDTO{
		ID:          a.ID,
		Type:        a.Type,
		Title:       a.Title,
		Issuer:      a.Issuer,
		Year:        a.Year,
		Description: a.Description,
		ImageURL:    a.ImageURL,
		SortOrder:   a.SortOrder,
		IsVisible:   a.IsVisible,
	}
}

func toPublicAchievementDTO(a *models.CoachAchievement) PublicAchievementDTO {
	return PublicAchievementDTO{
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
