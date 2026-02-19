package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type MeController struct {
	meService service.MeService
}

func NewMeController(meService service.MeService) *MeController {
	return &MeController{meService: meService}
}

// GetProfile godoc
// @Summary Get current user profile (user panel)
// @Description Returns profile with firstName, lastName, phone, heightCm, weightKg, photos, counts
// @Tags me
// @Produce json
// @Security BearerAuth
// @Success 200 {object} service.MeProfileDTO
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /me [get]
func (h *MeController) GetProfile(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	profile, err := h.meService.GetProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, profile)
}

// UpdateProfile godoc
// @Summary Update current user profile
// @Description Update firstName, lastName, heightCm, weightKg
// @Tags me
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body service.MeProfileUpdateRequest true "Profile update"
// @Success 200 {object} service.MeProfileDTO
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /me [patch]
func (h *MeController) UpdateProfile(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req service.MeProfileUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	profile, err := h.meService.UpdateProfile(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, profile)
}

// ListMyOrders godoc
// @Summary List current user orders
// @Description Paginated list with optional status filter
// @Tags me
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page (default 1)"
// @Param pageSize query int false "Page size (default 10)"
// @Param status query string false "Filter: paid, pending, failed, refunded, or empty"
// @Success 200 {object} service.MeOrderListResponse
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /me/orders [get]
func (h *MeController) ListMyOrders(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	page := 1
	pageSize := 10
	if p := c.Query("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	if ps := c.Query("pageSize"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v > 0 && v <= 100 {
			pageSize = v
		}
	}
	status := c.Query("status")

	resp, err := h.meService.ListMyOrders(c.Request.Context(), userID, page, pageSize, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetMyOrderByID godoc
// @Summary Get order by ID (own orders only)
// @Tags me
// @Produce json
// @Security BearerAuth
// @Param id path int true "Order ID"
// @Success 200 {object} service.MeOrderDTO
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /me/orders/{id} [get]
func (h *MeController) GetMyOrderByID(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order id"})
		return
	}

	order, err := h.meService.GetMyOrderByID(c.Request.Context(), userID, uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}
	c.JSON(http.StatusOK, order)
}

// ListMyPrograms godoc
// @Summary List current user programs (subscriptions)
// @Tags me
// @Produce json
// @Security BearerAuth
// @Success 200 {object} service.MeProgramsResponse
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /me/programs [get]
func (h *MeController) ListMyPrograms(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	resp, err := h.meService.ListMyPrograms(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetMyProgramByID godoc
// @Summary Get program by ID (own programs only)
// @Tags me
// @Produce json
// @Security BearerAuth
// @Param id path int true "Program (subscription) ID"
// @Success 200 {object} service.MeProgramDetailDTO
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /me/programs/{id} [get]
func (h *MeController) GetMyProgramByID(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid program id"})
		return
	}

	program, err := h.meService.GetMyProgramByID(c.Request.Context(), userID, uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "program not found"})
		return
	}
	c.JSON(http.StatusOK, program)
}
