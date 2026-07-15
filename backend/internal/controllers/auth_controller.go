package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/service"
)

type AuthController struct {
	authService service.AuthService
	meService   service.MeService
}

func NewAuthController(authService service.AuthService, meService service.MeService) *AuthController {
	return &AuthController{authService: authService, meService: meService}
}

// DTOs

type registerRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email"` // optional; auto-generated from phone when empty
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	Code     string `json:"code" binding:"required"` // OTP verification required
}

type checkPhoneRequest struct {
	Phone string `json:"phone" binding:"required"`
}

type checkPhoneResponse struct {
	Exists bool `json:"exists"`
}

type registerCoachRequest struct {
	Name        string `json:"name" binding:"required"`
	Email       string `json:"email"` // optional; auto-generated from phone when empty
	Phone       string `json:"phone" binding:"required"`
	Password    string `json:"password" binding:"required,min=6"`
	DisplayName string `json:"displayName"`
	Slug        string `json:"slug"`
}

type loginPasswordRequest struct {
	Identifier string `json:"identifier" binding:"required"` // email or phone
	Password   string `json:"password" binding:"required"`
}

type otpRequest struct {
	Phone string `json:"phone" binding:"required"`
}

type otpVerifyRequest struct {
	Phone string `json:"phone" binding:"required"`
	Code  string `json:"code" binding:"required"`
}

type forgotSendOTPRequest struct {
	Phone string `json:"phone" binding:"required"`
}

type resetPasswordWithOTPRequest struct {
	Phone       string `json:"phone" binding:"required"`
	Code        string `json:"code" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

type authUserResponse struct {
	ID                uint   `json:"id"`
	Name              string `json:"name"`
	Email             string `json:"email,omitempty"`
	Phone             string `json:"phone,omitempty"`
	Role              string `json:"role"`
	IsProfileComplete bool   `json:"isProfileComplete"`
}

type authResponse struct {
	User         authUserResponse `json:"user"`
	AccessToken  string           `json:"access_token"`
	RefreshToken string           `json:"refresh_token"`
}

type messageResponse struct {
	Message string `json:"message"`
}

type logoutRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type meResponse struct {
	ID                uint      `json:"id"`
	Name              string    `json:"name"`
	Email             string    `json:"email"`
	Phone             string    `json:"phone"`
	Role              string    `json:"role"`
	IsProfileComplete bool      `json:"isProfileComplete"`
	CreatedAt         time.Time `json:"created_at"`
}

type changePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" binding:"required"` // also accepts current_password from Swagger
	NewPassword     string `json:"newPassword" binding:"required,min=8"` // also accepts new_password from Swagger
}

// Handlers

func (h *AuthController) handleOTPRequestError(c *gin.Context, err error) bool {
	var cooldownErr *service.OTPCooldownError
	if errors.As(err, &cooldownErr) {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":               fmt.Sprintf("لطفاً %d ثانیه دیگر دوباره تلاش کنید", cooldownErr.RetryAfterSeconds),
			"retry_after_seconds": cooldownErr.RetryAfterSeconds,
		})
		return true
	}
	if errors.Is(err, service.ErrSMSSendFailed) {
		c.JSON(http.StatusBadGateway, gin.H{"error": service.SMSErrorMessage(err)})
		return true
	}
	return false
}

func (h *AuthController) buildAuthUserResponse(c *gin.Context, user *models.User) (authUserResponse, error) {
	complete, err := h.meService.IsProfileComplete(c.Request.Context(), user)
	if err != nil {
		return authUserResponse{}, err
	}
	return authUserResponse{
		ID:                user.ID,
		Name:              user.Name,
		Email:             user.Email,
		Phone:             user.Phone,
		Role:              user.Role,
		IsProfileComplete: complete,
	}, nil
}

// CheckPhone godoc
// @Summary Check whether a phone is already registered
// @Tags auth
// @Accept json
// @Produce json
// @Param request body checkPhoneRequest true "Phone check request"
// @Success 200 {object} checkPhoneResponse
// @Failure 400 {object} map[string]string
// @Router /auth/check-phone [post]
func (h *AuthController) CheckPhone(c *gin.Context) {
	var req checkPhoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	exists, err := h.authService.CheckPhone(c.Request.Context(), req.Phone)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, checkPhoneResponse{Exists: exists})
}

// Register godoc
// @Summary Register new user
// @Description Register a new user with name, phone, password and verified OTP (email optional)
// @Tags auth
// @Accept json
// @Produce json
// @Param request body registerRequest true "Register request"
// @Success 201 {object} authResponse
// @Failure 400 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/register [post]
func (h *AuthController) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.authService.Register(c.Request.Context(), req.Name, req.Email, req.Phone, req.Password, req.Code)
	if err != nil {
		switch err {
		case service.ErrInvalidOTP:
			c.JSON(http.StatusUnauthorized, gin.H{"error": "کد وارد شده نامعتبر یا منقضی شده است"})
			return
		case service.ErrEmailAlreadyExists:
			c.JSON(http.StatusConflict, gin.H{"error": "email already in use"})
			return
		case service.ErrPhoneAlreadyExists:
			c.JSON(http.StatusConflict, gin.H{"error": "phone already in use"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	userResp, err := h.buildAuthUserResponse(c, result.User)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, authResponse{
		User:         userResp,
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
	})
}

// RegisterCoach registers a new coach account with an initial profile.
func (h *AuthController) RegisterCoach(c *gin.Context) {
	var req registerCoachRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.authService.RegisterCoach(
		c.Request.Context(),
		req.Name, req.Email, req.Phone, req.Password,
		req.DisplayName, req.Slug,
	)
	if err != nil {
		switch err {
		case service.ErrEmailAlreadyExists:
			c.JSON(http.StatusConflict, gin.H{"error": "email already in use"})
		case service.ErrPhoneAlreadyExists:
			c.JSON(http.StatusConflict, gin.H{"error": "phone already in use"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	userResp, err := h.buildAuthUserResponse(c, result.User)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, authResponse{
		User:         userResp,
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
	})
}

// LoginWithPassword godoc
// @Summary Login with email or phone and password
// @Description Login using identifier (email or phone) and password
// @Tags auth
// @Accept json
// @Produce json
// @Param request body loginPasswordRequest true "Login request"
// @Success 200 {object} authResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/login/password [post]
func (h *AuthController) LoginWithPassword(c *gin.Context) {
	var req loginPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.authService.LoginWithPassword(c.Request.Context(), req.Identifier, req.Password)
	if err != nil {
		if err == service.ErrInvalidCredentials {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	userResp, err := h.buildAuthUserResponse(c, result.User)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, authResponse{
		User:         userResp,
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
	})
}

// RequestOTP godoc
// @Summary Request OTP for phone
// @Description Request a 6-digit OTP sent to the given phone via Kavenegar Verify Lookup
// @Tags auth
// @Accept json
// @Produce json
// @Param request body otpRequest true "OTP request"
// @Success 200 {object} messageResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/otp/request [post]
func (h *AuthController) RequestOTP(c *gin.Context) {
	var req otpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authService.RequestOTP(c.Request.Context(), req.Phone); err != nil {
		if h.handleOTPRequestError(c, err) {
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, messageResponse{Message: "کد ارسال شد"})
}

// VerifyOTP godoc
// @Summary Verify OTP for phone login
// @Description Verify OTP code for the given phone; creates user if needed and returns tokens
// @Tags auth
// @Accept json
// @Produce json
// @Param request body otpVerifyRequest true "OTP verify request"
// @Success 200 {object} authResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/otp/verify [post]
func (h *AuthController) VerifyOTP(c *gin.Context) {
	var req otpVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.authService.VerifyOTP(c.Request.Context(), req.Phone, req.Code)
	if err != nil {
		if err == service.ErrInvalidOTP {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired otp code"})
			return
		}
		if err == service.ErrInvalidCredentials {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "حسابی با این شماره یافت نشد"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	userResp, err := h.buildAuthUserResponse(c, result.User)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, authResponse{
		User:         userResp,
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
	})
}

// ForgotSendOTP sends an OTP for password reset.
func (h *AuthController) ForgotSendOTP(c *gin.Context) {
	var req forgotSendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authService.RequestPasswordResetOTP(c.Request.Context(), req.Phone); err != nil {
		if h.handleOTPRequestError(c, err) {
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, messageResponse{Message: "کد بازیابی ارسال شد"})
}

// ResetPasswordWithOTP resets the user's password using phone + OTP.
func (h *AuthController) ResetPasswordWithOTP(c *gin.Context) {
	var req resetPasswordWithOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authService.ResetPasswordWithOTP(c.Request.Context(), req.Phone, req.Code, req.NewPassword); err != nil {
		switch err {
		case service.ErrInvalidOTP:
			c.JSON(http.StatusUnauthorized, gin.H{"error": "کد وارد شده نامعتبر یا منقضی شده است"})
			return
		case service.ErrInvalidCredentials:
			c.JSON(http.StatusUnauthorized, gin.H{"error": "کاربری با این شماره یافت نشد"})
			return
		default:
			if err.Error() == "new password must be at least 8 characters" {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, messageResponse{Message: "رمز عبور با موفقیت تغییر یافت"})
}

// Logout godoc
// @Summary Logout current user
// @Description Invalidate current user's refresh tokens
// @Tags auth
// @Accept json
// @Produce json
// @Param request body logoutRequest false "Optional refresh token to revoke"
// @Success 200 {object} messageResponse
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/logout [post]
func (h *AuthController) Logout(c *gin.Context) {
	userIDVal, exists := c.Get(middleware.ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID, ok := userIDVal.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user id in context"})
		return
	}

	var req logoutRequest
	// refresh_token is optional; ignore binding errors (e.g., empty body).
	_ = c.ShouldBindJSON(&req)

	if err := h.authService.Logout(c.Request.Context(), userID, req.RefreshToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, messageResponse{Message: "با موفقیت خارج شدید"})
}

// Me godoc
// @Summary Get current user profile
// @Description Returns profile of the currently authenticated user
// @Tags auth
// @Produce json
// @Success 200 {object} meResponse
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/me [get]
func (h *AuthController) Me(c *gin.Context) {
	userIDVal, exists := c.Get(middleware.ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID, ok := userIDVal.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user id in context"})
		return
	}

	user, err := h.authService.GetMe(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	complete, err := h.meService.IsProfileComplete(c.Request.Context(), user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := meResponse{
		ID:                user.ID,
		Name:              user.Name,
		Email:             user.Email,
		Phone:             user.Phone,
		Role:              user.Role,
		IsProfileComplete: complete,
		CreatedAt:         user.CreatedAt,
	}

	c.JSON(http.StatusOK, resp)
}

// ChangePassword godoc
// @Summary Change current user's password
// @Description Change password by providing current and new password
// @Tags auth
// @Accept json
// @Produce json
// @Param request body changePasswordRequest true "Change password request"
// @Success 200 {object} messageResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/change-password [post]
func (h *AuthController) ChangePassword(c *gin.Context) {
	userIDVal, exists := c.Get(middleware.ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID, ok := userIDVal.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user id in context"})
		return
	}

	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authService.ChangePassword(c.Request.Context(), userID, req.CurrentPassword, req.NewPassword); err != nil {
		switch err {
		case service.ErrInvalidPassword:
			c.JSON(http.StatusUnauthorized, gin.H{"error": "current password is incorrect"})
			return
		default:
			// If it's a validation error coming from service
			if err.Error() == "new password must be at least 8 characters" {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, messageResponse{Message: "رمز عبور با موفقیت تغییر یافت"})
}
