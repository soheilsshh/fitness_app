package service

import (
	"context"
	"errors"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

// AuthService defines authentication use cases.
type AuthService interface {
	SignUp(ctx context.Context, name, email, password string, role models.UserRole) (*models.User, error)
	Login(ctx context.Context, email, password string) (*models.User, error)
}

type authService struct {
	userRepo repository.UserRepository
}

// NewAuthService constructs a new AuthService.
func NewAuthService(userRepo repository.UserRepository) AuthService {
	return &authService{
		userRepo: userRepo,
	}
}

var (
	// ErrNotImplemented is returned while the actual business logic is not defined yet.
	ErrNotImplemented = errors.New("auth service logic not implemented")
)

func (s *authService) SignUp(ctx context.Context, name, email, password string, role models.UserRole) (*models.User, error) {
	// To be implemented later based on business requirements.
	return nil, ErrNotImplemented
}

func (s *authService) Login(ctx context.Context, email, password string) (*models.User, error) {
	// To be implemented later based on business requirements.
	return nil, ErrNotImplemented
}
