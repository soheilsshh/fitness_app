package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/service"
)

// AuthHandler exposes HTTP endpoints for authentication.
type AuthHandler struct {
	authService service.AuthService
}

// NewAuthHandler constructs a new AuthHandler.
func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

type signUpRequest struct {
	Name     string          `json:"name" binding:"required"`
	Email    string          `json:"email" binding:"required,email"`
	Password string          `json:"password" binding:"required,min=6"`
	Role     models.UserRole `json:"role"` // optional; defaults to student
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// SignUp handles user registration.
func (h *AuthHandler) SignUp(c *gin.Context) {
	// Request binding, service calls, and response shaping will be implemented later.
	JSON(c, http.StatusNotImplemented, nil, "signup logic not implemented")
}

// Login handles user login.
func (h *AuthHandler) Login(c *gin.Context) {
	// Request binding, service calls, and response shaping will be implemented later.
	JSON(c, http.StatusNotImplemented, nil, "login logic not implemented")
}

// Me is a simple protected endpoint example that returns the authenticated user info from JWT claims.
func (h *AuthHandler) Me(c *gin.Context) {
	// This will later use claims populated by the JWT middleware.
	JSON(c, http.StatusNotImplemented, nil, "me endpoint not implemented")
}
