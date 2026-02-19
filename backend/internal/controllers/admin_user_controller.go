package controllers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

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

// UploadUserBodyPhoto godoc
// @Summary Upload a body photo for a user
// @Description Accepts multipart form with file and optional name (display label)
// @Tags admin-users
// @Accept multipart/form-data
// @Produce json
// @Param id path int true "User ID"
// @Param file formData file true "Image file"
// @Param name formData string false "Display name (e.g. Front, Side)"
// @Success 201 {object} service.AdminUserPhoto
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/users/{id}/body/photos [post]
func (h *AdminUserController) UploadUserBodyPhoto(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	idStr := c.Param("id")
	idUint64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || idUint64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}
	userID := uint(idUint64)

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	nameLabel := strings.TrimSpace(c.PostForm("name"))
	if nameLabel == "" {
		nameLabel = "Photo"
	}

	opened, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read file"})
		return
	}
	defer opened.Close()

	photo, err := h.adminUserService.AddUserBodyPhoto(c.Request.Context(), userID, opened, file.Filename, nameLabel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, photo)
}

// DeleteUserBodyPhoto godoc
// @Summary Delete a body photo of a user
// @Tags admin-users
// @Produce json
// @Param id path int true "User ID"
// @Param photoId path int true "Photo ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/users/{id}/body/photos/{photoId} [delete]
func (h *AdminUserController) DeleteUserBodyPhoto(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	idStr := c.Param("id")
	idUint64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || idUint64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}
	userID := uint(idUint64)

	photoIDStr := c.Param("photoId")
	photoIDUint64, err := strconv.ParseUint(photoIDStr, 10, 64)
	if err != nil || photoIDUint64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid photo id"})
		return
	}
	photoID := uint(photoIDUint64)

	if err := h.adminUserService.DeleteUserBodyPhoto(c.Request.Context(), userID, photoID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "photo not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

