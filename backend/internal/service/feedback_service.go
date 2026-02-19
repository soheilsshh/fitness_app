package service

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

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
type FeedbackCreateRequest struct {
	FullName string `json:"fullName" binding:"required"`
	Email    string `json:"email" binding:"required"`
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
	f := &models.Feedback{
		FullName: req.FullName,
		Email:    req.Email,
		Phone:    req.Phone,
		Message:  req.Message,
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
