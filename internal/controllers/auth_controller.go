package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/service"
)

type AuthController struct {
	authService service.AuthService
}

func NewAuthController(authService service.AuthService) *AuthController {
	return &AuthController{authService: authService}
}

// DTOs

type registerRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
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

type authUserResponse struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email,omitempty"`
	Phone string `json:"phone,omitempty"`
	Role  string `json:"role"`
}

type authResponse struct {
	User         authUserResponse `json:"user"`
	AccessToken  string           `json:"access_token"`
	RefreshToken string           `json:"refresh_token"`
}

type messageResponse struct {
	Message string `json:"message"`
}

// Handlers

// Register godoc
// @Summary Register new user
// @Description Register a new user with name, email, phone and password
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

	result, err := h.authService.Register(c.Request.Context(), req.Name, req.Email, req.Phone, req.Password)
	if err != nil {
		switch err {
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

	c.JSON(http.StatusCreated, authResponse{
		User: authUserResponse{
			ID:    result.User.ID,
			Name:  result.User.Name,
			Email: result.User.Email,
			Phone: result.User.Phone,
			Role:  result.User.Role,
		},
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

	c.JSON(http.StatusOK, authResponse{
		User: authUserResponse{
			ID:    result.User.ID,
			Name:  result.User.Name,
			Email: result.User.Email,
			Phone: result.User.Phone,
			Role:  result.User.Role,
		},
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
	})
}

// RequestOTP godoc
// @Summary Request OTP for phone
// @Description Request a 6-digit OTP sent to the given phone (currently logged only)
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, authResponse{
		User: authUserResponse{
			ID:    result.User.ID,
			Name:  result.User.Name,
			Email: result.User.Email,
			Phone: result.User.Phone,
			Role:  result.User.Role,
		},
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
	})
}
