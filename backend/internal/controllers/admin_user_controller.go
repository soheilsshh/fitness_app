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

// ListUsers handles GET /admin/users
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

// GetUserDetails handles GET /admin/users/:id
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

