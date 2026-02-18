package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type AdminUserController struct {
	adminUserService service.AdminUserService
}

func NewAdminUserController(s service.AdminUserService) *AdminUserController {
	return &AdminUserController{adminUserService: s}
}

type adminUsersListResponse struct {
	Items    []service.AdminUserSummary `json:"items"`
	Page     int                        `json:"page"`
	PageSize int                        `json:"pageSize"`
	Total    int64                      `json:"total"`
}

// ListUsers godoc
// @Summary List users for admin
// @Description Returns paginated list of users with subscription/order stats
// @Tags admin-users
// @Produce json
// @Param page query int false "Page number"
// @Param pageSize query int false "Page size"
// @Param query query string false "Search by name or phone"
// @Param status query string false "Filter by status (all|active|inactive)"
// @Success 200 {object} adminUsersListResponse
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/users [get]
func (h *AdminUserController) ListUsers(c *gin.Context) {
	// role is already checked by middleware.AdminOnly
	_, _ = c.Get(middleware.ContextRoleKey)

	page := 1
	if pStr := c.Query("page"); pStr != "" {
		if p, err := strconv.Atoi(pStr); err == nil && p > 0 {
			page = p
		}
	}
	pageSize := 8
	if psStr := c.Query("pageSize"); psStr != "" {
		if ps, err := strconv.Atoi(psStr); err == nil && ps > 0 && ps <= 100 {
			pageSize = ps
		}
	}

	query := c.Query("query")
	status := c.Query("status") // all | active | inactive

	items, total, err := h.adminUserService.ListUsers(c.Request.Context(), page, pageSize, query, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, adminUsersListResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	})
}

// GetUserDetails godoc
// @Summary Get full details of a user for admin
// @Description Returns basic profile, programs and body info for the given user
// @Tags admin-users
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {object} service.AdminUserDetails
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/users/{id} [get]
func (h *AdminUserController) GetUserDetails(c *gin.Context) {
	// role is already checked by middleware.AdminOnly
	_, _ = c.Get(middleware.ContextRoleKey)

	idStr := c.Param("id")
	idUint64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || idUint64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	details, err := h.adminUserService.GetUserDetails(c.Request.Context(), uint(idUint64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, details)
}

// GetUserPrograms godoc
// @Summary List user programs for admin
// @Description Returns all purchased/assigned programs of a user
// @Tags admin-users
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {array} service.AdminUserProgram
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/users/{id}/programs [get]
func (h *AdminUserController) GetUserPrograms(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	idStr := c.Param("id")
	idUint64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || idUint64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	programs, err := h.adminUserService.GetUserPrograms(c.Request.Context(), uint(idUint64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, programs)
}

// GetUserBody godoc
// @Summary Get body measurements and photos of a user
// @Description Returns latest body metrics and all photos for a user
// @Tags admin-users
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {object} service.AdminUserBody
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/users/{id}/body [get]
func (h *AdminUserController) GetUserBody(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	idStr := c.Param("id")
	idUint64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || idUint64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	body, err := h.adminUserService.GetUserBody(c.Request.Context(), uint(idUint64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, body)
}

