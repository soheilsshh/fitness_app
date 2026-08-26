package service

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/repository"
)

type NotificationDTO struct {
	ID         uint   `json:"id"`
	Type       string `json:"type"`
	Title      string `json:"title"`
	Message    string `json:"message"`
	ActionPath string `json:"actionPath,omitempty"`
	IsRead     bool   `json:"isRead"`
	CreatedAt  string `json:"createdAt"`
}

type NotificationSettingsDTO struct {
	NotificationsEnabled bool `json:"notificationsEnabled"`
}

type NotificationService interface {
	ListRecent(ctx context.Context, userID uint, limit int) ([]NotificationDTO, error)
	MarkRead(ctx context.Context, userID, notificationID uint) error
	// GetSettings/UpdateSettings back the FE-8.6 toggle for push/SMS reminders.
	GetSettings(ctx context.Context, userID uint) (*NotificationSettingsDTO, error)
	UpdateSettings(ctx context.Context, userID uint, enabled bool) (*NotificationSettingsDTO, error)
}

type notificationService struct {
	repo  repository.NotificationRepository
	users repository.UserRepository
}

func NewNotificationService(repo repository.NotificationRepository, users repository.UserRepository) NotificationService {
	return &notificationService{repo: repo, users: users}
}

func (s *notificationService) GetSettings(ctx context.Context, userID uint) (*NotificationSettingsDTO, error) {
	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return &NotificationSettingsDTO{NotificationsEnabled: user.NotificationsEnabled}, nil
}

func (s *notificationService) UpdateSettings(ctx context.Context, userID uint, enabled bool) (*NotificationSettingsDTO, error) {
	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	user.NotificationsEnabled = enabled
	if err := s.users.Update(ctx, user); err != nil {
		return nil, err
	}
	return &NotificationSettingsDTO{NotificationsEnabled: user.NotificationsEnabled}, nil
}

func (s *notificationService) ListRecent(ctx context.Context, userID uint, limit int) ([]NotificationDTO, error) {
	items, err := s.repo.ListRecentByUserID(ctx, userID, limit)
	if err != nil {
		return nil, err
	}
	out := make([]NotificationDTO, 0, len(items))
	for _, n := range items {
		out = append(out, NotificationDTO{
			ID:         n.ID,
			Type:       n.Type,
			Title:      n.Title,
			Message:    n.Message,
			ActionPath: n.ActionPath,
			IsRead:     n.IsRead,
			CreatedAt:  n.CreatedAt.Format(time.RFC3339),
		})
	}
	return out, nil
}

func (s *notificationService) MarkRead(ctx context.Context, userID, notificationID uint) error {
	return s.repo.MarkRead(ctx, userID, notificationID)
}
