package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var ErrFeedbackContactRequired = errors.New("email or phone is required")

// FeedbackItemDTO matches frontend FeedbackList / FeedbackDetails (id, fullName, email, phone, message, createdAt).
type FeedbackItemDTO struct {
	ID        uint      `json:"id"`
	FullName  string    `json:"fullName"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"createdAt"`
}

// FeedbackListResponse for GET /admin/feedbacks.
type FeedbackListResponse struct {
	Items    []FeedbackItemDTO `json:"items"`
	Page     int               `json:"page"`
	PageSize int               `json:"pageSize"`
	Total    int64             `json:"total"`
}

// FeedbackCreateRequest for POST /feedbacks (public).
// ContactSection sends either email or phone (not both); at least one is required.
type FeedbackCreateRequest struct {
	FullName string `json:"fullName" binding:"required"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Message  string `json:"message" binding:"required"`
}

type FeedbackService interface {
	Create(ctx context.Context, req *FeedbackCreateRequest) error
	List(ctx context.Context, page, pageSize int) (*FeedbackListResponse, error)
}

type feedbackService struct {
	repo repository.FeedbackRepository
}

func NewFeedbackService(repo repository.FeedbackRepository) FeedbackService {
	return &feedbackService{repo: repo}
}

func (s *feedbackService) Create(ctx context.Context, req *FeedbackCreateRequest) error {
	email := strings.TrimSpace(req.Email)
	phone := strings.TrimSpace(req.Phone)
	if email == "" && phone == "" {
		return ErrFeedbackContactRequired
	}
	f := &models.Feedback{
		FullName: strings.TrimSpace(req.FullName),
		Email:    email,
		Phone:    phone,
		Message:  strings.TrimSpace(req.Message),
	}
	return s.repo.Create(ctx, f)
}

func (s *feedbackService) List(ctx context.Context, page, pageSize int) (*FeedbackListResponse, error) {
	list, total, err := s.repo.List(ctx, page, pageSize)
	if err != nil {
		return nil, err
	}
	items := make([]FeedbackItemDTO, 0, len(list))
	for i := range list {
		items = append(items, FeedbackItemDTO{
			ID:        list[i].ID,
			FullName:  list[i].FullName,
			Email:     list[i].Email,
			Phone:     list[i].Phone,
			Message:   list[i].Message,
			CreatedAt: list[i].CreatedAt,
		})
	}
	return &FeedbackListResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	}, nil
}
