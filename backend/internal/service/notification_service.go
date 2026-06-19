package service

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/repository"
)

type NotificationDTO struct {
	ID        uint   `json:"id"`
	Type      string `json:"type"`
	Title     string `json:"title"`
	Message   string `json:"message"`
	IsRead    bool   `json:"isRead"`
	CreatedAt string `json:"createdAt"`
}

type NotificationService interface {
	ListRecent(ctx context.Context, userID uint, limit int) ([]NotificationDTO, error)
}

type notificationService struct {
	repo repository.NotificationRepository
}

func NewNotificationService(repo repository.NotificationRepository) NotificationService {
	return &notificationService{repo: repo}
}

func (s *notificationService) ListRecent(ctx context.Context, userID uint, limit int) ([]NotificationDTO, error) {
	items, err := s.repo.ListRecentByUserID(ctx, userID, limit)
	if err != nil {
		return nil, err
	}
	out := make([]NotificationDTO, 0, len(items))
	for _, n := range items {
		out = append(out, NotificationDTO{
			ID:        n.ID,
			Type:      n.Type,
			Title:     n.Title,
			Message:   n.Message,
			IsRead:    n.IsRead,
			CreatedAt: n.CreatedAt.Format(time.RFC3339),
		})
	}
	return out, nil
}
