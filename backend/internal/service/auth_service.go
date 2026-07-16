package service

import (
	"context"
	"crypto/rand"
	"encoding/binary"
	"errors"
	"fmt"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/config"
	"github.com/yourusername/fitness-management/internal/auth"
	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/pkg/digits"
	"github.com/yourusername/fitness-management/internal/pkg/slug"
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
	CheckPhone(ctx context.Context, phone string) (exists bool, err error)
	Register(ctx context.Context, name, email, phone, password, otpCode string) (*AuthResult, error)
	RegisterCoach(ctx context.Context, name, email, phone, password, displayName, slugInput string) (*AuthResult, error)
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
	userRepo         repository.UserRepository
	coachProfileRepo repository.CoachProfileRepository
	refreshTokenRepo repository.RefreshTokenRepository
	otpRepo          repository.OtpRepository
	otpTTL           time.Duration
	otpResendCooldown time.Duration
	defaultUserRole  string
}

// OTPCooldownError is returned when OTP resend is requested before the cooldown expires.
type OTPCooldownError struct {
	RetryAfterSeconds int
}

func (e *OTPCooldownError) Error() string {
	return "otp resend cooldown"
}

var (
	ErrEmailAlreadyExists = errors.New("email already exists")
	ErrPhoneAlreadyExists = errors.New("phone already exists")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidOTP         = errors.New("invalid or expired otp code")
	ErrInvalidPassword    = errors.New("current password is incorrect")
	ErrSlugAlreadyExists  = errors.New("slug already in use")
)

// NewAuthService constructs a new AuthService.
func NewAuthService(
	userRepo repository.UserRepository,
	coachProfileRepo repository.CoachProfileRepository,
	refreshTokenRepo repository.RefreshTokenRepository,
	otpRepo repository.OtpRepository,
) AuthService {
	ttlMinutes := config.Get().SMS.OtpTTLMinutes
	if ttlMinutes <= 0 {
		ttlMinutes = 10
	}
	cooldownSeconds := config.Get().SMS.OtpResendCooldownSeconds
	if cooldownSeconds <= 0 {
		cooldownSeconds = 60
	}
	return &authService{
		userRepo:         userRepo,
		coachProfileRepo: coachProfileRepo,
		refreshTokenRepo: refreshTokenRepo,
		otpRepo:          otpRepo,
		otpTTL:           time.Duration(ttlMinutes) * time.Minute,
		otpResendCooldown: time.Duration(cooldownSeconds) * time.Second,
		defaultUserRole:  models.RoleStudent,
	}
}

func (s *authService) CheckPhone(ctx context.Context, phone string) (bool, error) {
	phone = digits.NormalizePhone(phone)
	if phone == "" {
		return false, errors.New("phone is required")
	}
	_, err := s.userRepo.FindByPhone(ctx, phone)
	if err == nil {
		return true, nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return false, nil
	}
	return false, err
}

func (s *authService) Register(ctx context.Context, name, email, phone, password, otpCode string) (*AuthResult, error) {
	name = strings.TrimSpace(name)
	email = strings.TrimSpace(strings.ToLower(email))
	phone = digits.NormalizePhone(phone)
	otpCode = digits.ToEnglish(strings.TrimSpace(otpCode))

	if phone == "" || password == "" {
		return nil, errors.New("phone and password are required")
	}
	// Name is collected in short onboarding; keep a safe placeholder for DB.
	if name == "" {
		name = "کاربر جدید"
	}
	if otpCode == "" {
		return nil, ErrInvalidOTP
	}
	if email == "" {
		email = phone + "@phone.local"
	}

	// uniqueness checks before consuming OTP
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

	if err := s.consumeOTP(ctx, phone, "login", otpCode); err != nil {
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

func (s *authService) RegisterCoach(ctx context.Context, name, email, phone, password, displayName, slugInput string) (*AuthResult, error) {
	name = strings.TrimSpace(name)
	email = strings.TrimSpace(strings.ToLower(email))
	phone = digits.NormalizePhone(phone)
	// displayName and slug are admin-owned; coaches cannot self-assign branding.
	_ = displayName
	_ = slugInput

	if name == "" || phone == "" || password == "" {
		return nil, errors.New("name, phone and password are required")
	}
	if email == "" {
		email = phone + "@phone.local"
	}

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
		Role:     models.RoleCoach,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	coachSlug := slug.Fallback(user.ID)
	exists, err := s.coachProfileRepo.SlugExists(ctx, coachSlug, 0)
	if err != nil {
		return nil, err
	}
	if exists {
		coachSlug = slug.Fallback(user.ID)
	}

	profile := &models.CoachProfile{
		UserID:       user.ID,
		Slug:         coachSlug,
		DisplayName:  name,
		Status:       models.CoachProfileStatusPending,
		ContactPhone: phone,
		IsPublished:  false,
	}
	if err := s.coachProfileRepo.Create(ctx, profile); err != nil {
		return nil, err
	}

	return s.generateTokens(ctx, user)
}

func (s *authService) LoginWithPassword(ctx context.Context, identifier, password string) (*AuthResult, error) {
	identifier = digits.ToEnglish(strings.TrimSpace(strings.ToLower(identifier)))
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
	phone = digits.NormalizePhone(phone)
	if phone == "" {
		return errors.New("phone is required")
	}
	return s.sendOTP(ctx, phone, "login")
}

func (s *authService) VerifyOTP(ctx context.Context, phone, code string) (*AuthResult, error) {
	phone = digits.NormalizePhone(phone)
	code = digits.ToEnglish(strings.TrimSpace(code))
	if phone == "" || code == "" {
		return nil, ErrInvalidOTP
	}

	if err := s.consumeOTP(ctx, phone, "login", code); err != nil {
		return nil, err
	}

	user, err := s.userRepo.FindByPhone(ctx, phone)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// OTP login is for existing users only; new users go through register.
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	return s.generateTokens(ctx, user)
}

func (s *authService) consumeOTP(ctx context.Context, phone, purpose, code string) error {
	entry, err := s.otpRepo.FindValidByPhoneAndPurpose(ctx, phone, purpose, time.Now())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrInvalidOTP
		}
		return err
	}
	if entry.Code != code {
		return ErrInvalidOTP
	}
	return s.otpRepo.MarkUsed(ctx, entry.ID, time.Now())
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
	phone = digits.NormalizePhone(phone)
	if phone == "" {
		return errors.New("phone is required")
	}
	return s.sendOTP(ctx, phone, "password_reset")
}

func (s *authService) ResetPasswordWithOTP(ctx context.Context, phone, code, newPassword string) error {
	phone = digits.NormalizePhone(phone)
	code = digits.ToEnglish(strings.TrimSpace(code))
	newPassword = strings.TrimSpace(newPassword)

	if phone == "" || code == "" {
		return ErrInvalidOTP
	}
	if len(newPassword) < 8 {
		return errors.New("new password must be at least 8 characters")
	}

	entry, err := s.otpRepo.FindValidByPhoneAndPurpose(ctx, phone, "password_reset", time.Now())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrInvalidOTP
		}
		return err
	}
	if entry.Code != code {
		return ErrInvalidOTP
	}

	if err := s.otpRepo.MarkUsed(ctx, entry.ID, time.Now()); err != nil {
		return err
	}

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

func (s *authService) sendOTP(ctx context.Context, phone, purpose string) error {
	if latest, err := s.otpRepo.FindLatestByPhoneAndPurpose(ctx, phone, purpose); err == nil {
		elapsed := time.Since(latest.CreatedAt)
		if elapsed < s.otpResendCooldown {
			retryAfter := int((s.otpResendCooldown - elapsed + time.Second - 1) / time.Second)
			if retryAfter < 1 {
				retryAfter = 1
			}
			return &OTPCooldownError{RetryAfterSeconds: retryAfter}
		}
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	code, err := generateOTPCode()
	if err != nil {
		return err
	}

	template := strings.TrimSpace(config.Get().SMS.OtpPattern)
	if template == "" {
		template = "fittino-otp"
	}

	if _, err := SendVerification(phone, code, template); err != nil {
		return err
	}

	now := time.Now()
	if err := s.otpRepo.InvalidatePrevious(ctx, phone, purpose, now); err != nil {
		return err
	}

	otp := &models.OtpCode{
		Phone:     phone,
		Code:      code,
		Purpose:   purpose,
		ExpiresAt: now.Add(s.otpTTL),
	}
	return s.otpRepo.Create(ctx, otp)
}

