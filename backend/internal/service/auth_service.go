package service

import (
	"context"
	"crypto/rand"
	"encoding/binary"
	"errors"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/auth"
	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

// AuthResult bundles the user and the generated tokens.
type AuthResult struct {
	User         *models.User
	AccessToken  string
	RefreshToken string
}

// AuthService defines authentication use cases.
type AuthService interface {
	Register(ctx context.Context, name, email, phone, password string) (*AuthResult, error)
	LoginWithPassword(ctx context.Context, identifier, password string) (*AuthResult, error)
	RequestOTP(ctx context.Context, phone string) error
	VerifyOTP(ctx context.Context, phone, code string) (*AuthResult, error)
	Logout(ctx context.Context, userID uint, refreshToken string) error
	GetMe(ctx context.Context, userID uint) (*models.User, error)
	ChangePassword(ctx context.Context, userID uint, currentPassword, newPassword string) error
	RequestPasswordResetOTP(ctx context.Context, phone string) error
	ResetPasswordWithOTP(ctx context.Context, phone, code, newPassword string) error
}

type authService struct {
	userRepo          repository.UserRepository
	refreshTokenRepo  repository.RefreshTokenRepository
	otpStore          map[string]otpEntry
	otpMutex          sync.RWMutex
	otpTTL            time.Duration
	defaultUserRole   string
}

type otpEntry struct {
	Code      string
	ExpiresAt time.Time
}

var (
	ErrEmailAlreadyExists = errors.New("email already exists")
	ErrPhoneAlreadyExists = errors.New("phone already exists")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidOTP         = errors.New("invalid or expired otp code")
	ErrInvalidPassword    = errors.New("current password is incorrect")
)

// NewAuthService constructs a new AuthService.
func NewAuthService(
	userRepo repository.UserRepository,
	refreshTokenRepo repository.RefreshTokenRepository,
) AuthService {
	return &authService{
		userRepo:         userRepo,
		refreshTokenRepo: refreshTokenRepo,
		otpStore:         make(map[string]otpEntry),
		otpTTL:           5 * time.Minute,
		defaultUserRole:  "student",
	}
}

func (s *authService) Register(ctx context.Context, name, email, phone, password string) (*AuthResult, error) {
	name = strings.TrimSpace(name)
	email = strings.TrimSpace(strings.ToLower(email))
	phone = strings.TrimSpace(phone)

	if name == "" || email == "" || phone == "" || password == "" {
		return nil, errors.New("name, email, phone and password are required")
	}

	// uniqueness checks
	if _, err := s.userRepo.FindByEmail(ctx, email); err == nil {
		return nil, ErrEmailAlreadyExists
	} else if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if _, err := s.userRepo.FindByPhone(ctx, phone); err == nil {
		return nil, ErrPhoneAlreadyExists
	} else if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Name:     name,
		Email:    email,
		Phone:    phone,
		Password: string(hashed),
		Role:     s.defaultUserRole,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	return s.generateTokens(ctx, user)
}

func (s *authService) LoginWithPassword(ctx context.Context, identifier, password string) (*AuthResult, error) {
	identifier = strings.TrimSpace(strings.ToLower(identifier))
	if identifier == "" || password == "" {
		return nil, ErrInvalidCredentials
	}

	user, err := s.userRepo.FindByIdentifier(ctx, identifier)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return s.generateTokens(ctx, user)
}

func (s *authService) RequestOTP(ctx context.Context, phone string) error {
	_ = ctx // currently unused but kept for future DB logging, rate limiting, etc.

	phone = strings.TrimSpace(phone)
	if phone == "" {
		return errors.New("phone is required")
	}

	code, err := generateOTPCode()
	if err != nil {
		return err
	}

	// store in memory with TTL
	s.otpMutex.Lock()
	s.otpStore[phone] = otpEntry{
		Code:      code,
		ExpiresAt: time.Now().Add(s.otpTTL),
	}
	s.otpMutex.Unlock()

	// for now just log it
	log.Printf("OTP code for phone %s is %s\n", phone, code)

	return nil
}

func (s *authService) VerifyOTP(ctx context.Context, phone, code string) (*AuthResult, error) {
	phone = strings.TrimSpace(phone)
	code = strings.TrimSpace(code)
	if phone == "" || code == "" {
		return nil, ErrInvalidOTP
	}

	s.otpMutex.RLock()
	entry, ok := s.otpStore[phone]
	s.otpMutex.RUnlock()
	if !ok || time.Now().After(entry.ExpiresAt) || entry.Code != code {
		return nil, ErrInvalidOTP
	}

	// OTP is valid, delete it
	s.otpMutex.Lock()
	delete(s.otpStore, phone)
	s.otpMutex.Unlock()

	// find or create user by phone
	user, err := s.userRepo.FindByPhone(ctx, phone)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// create new user with minimal info
			user = &models.User{
				Name:  phone,
				Email: phone + "@phone.local",
				Phone: phone,
				Role:  s.defaultUserRole,
			}
			if err := s.userRepo.Create(ctx, user); err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	return s.generateTokens(ctx, user)
}

func (s *authService) Logout(ctx context.Context, userID uint, refreshToken string) error {
	// If a specific refresh token is provided, delete only that one.
	if strings.TrimSpace(refreshToken) != "" {
		if err := s.refreshTokenRepo.DeleteByUserIDAndToken(ctx, userID, refreshToken); err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		return nil
	}

	// Otherwise, delete all refresh tokens for this user.
	if err := s.refreshTokenRepo.DeleteByUserID(ctx, userID); err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	return nil
}

func (s *authService) GetMe(ctx context.Context, userID uint) (*models.User, error) {
	return s.userRepo.FindByID(ctx, userID)
}

func (s *authService) ChangePassword(ctx context.Context, userID uint, currentPassword, newPassword string) error {
	currentPassword = strings.TrimSpace(currentPassword)
	newPassword = strings.TrimSpace(newPassword)

	if len(newPassword) < 8 {
		return errors.New("new password must be at least 8 characters")
	}

	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return err
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(currentPassword)); err != nil {
		return ErrInvalidPassword
	}

	// Hash and update new password
	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	if err := s.userRepo.UpdatePassword(ctx, user.ID, string(hashed)); err != nil {
		return err
	}

	// Invalidate all refresh tokens for this user (best practice)
	if err := s.refreshTokenRepo.DeleteByUserID(ctx, user.ID); err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	return nil
}

func (s *authService) RequestPasswordResetOTP(ctx context.Context, phone string) error {
	// For now password-reset OTP is the same as login OTP.
	return s.RequestOTP(ctx, phone)
}

func (s *authService) ResetPasswordWithOTP(ctx context.Context, phone, code, newPassword string) error {
	phone = strings.TrimSpace(phone)
	code = strings.TrimSpace(code)
	newPassword = strings.TrimSpace(newPassword)

	if phone == "" || code == "" {
		return ErrInvalidOTP
	}
	if len(newPassword) < 8 {
		return errors.New("new password must be at least 8 characters")
	}

	// Validate and consume OTP
	s.otpMutex.Lock()
	entry, ok := s.otpStore[phone]
	if !ok || time.Now().After(entry.ExpiresAt) || entry.Code != code {
		s.otpMutex.Unlock()
		return ErrInvalidOTP
	}
	delete(s.otpStore, phone)
	s.otpMutex.Unlock()

	// Find user by phone
	user, err := s.userRepo.FindByPhone(ctx, phone)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrInvalidCredentials
		}
		return err
	}

	// Hash and update new password
	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	if err := s.userRepo.UpdatePassword(ctx, user.ID, string(hashed)); err != nil {
		return err
	}

	// Invalidate all refresh tokens for this user
	if err := s.refreshTokenRepo.DeleteByUserID(ctx, user.ID); err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	return nil
}

func (s *authService) generateTokens(ctx context.Context, user *models.User) (*AuthResult, error) {
	accessToken, _, err := auth.GenerateAccessToken(user.ID, user.Role)
	if err != nil {
		return nil, err
	}

	refreshToken, refreshExpiresAt, err := auth.GenerateRefreshToken(user.ID, user.Role)
	if err != nil {
		return nil, err
	}

	// persist refresh token
	rt := &models.RefreshToken{
		UserID:    user.ID,
		Token:     refreshToken,
		ExpiresAt: refreshExpiresAt,
	}
	if err := s.refreshTokenRepo.Create(ctx, rt); err != nil {
		return nil, err
	}

	return &AuthResult{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func generateOTPCode() (string, error) {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	// Use high-entropy random number, then mod to 6 digits.
	n := binary.BigEndian.Uint64(b[:]) % 1000000
	return fmt.Sprintf("%06d", n), nil
}

