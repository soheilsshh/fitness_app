package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type AdminCoachController struct {
	coachService service.AdminCoachService
}

func NewAdminCoachController(s service.AdminCoachService) *AdminCoachController {
	return &AdminCoachController{coachService: s}
}

// ListCoaches godoc
// @Summary List coaches (admin)
// @Description Returns paginated list of coaches with student counts
// @Tags admin-coaches
// @Produce json
// @Param page query int false "Page number"
// @Param pageSize query int false "Page size"
// @Param query query string false "Search by name, slug or title"
// @Param status query string false "Filter by status (pending, reviewing, approved)"
// @Success 200 {object} service.AdminCoachListResponse
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/coaches [get]
// @Security BearerAuth
func (h *AdminCoachController) ListCoaches(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	page := 1
	if p := c.Query("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	pageSize := 20
	if ps := c.Query("pageSize"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v > 0 && v <= 100 {
			pageSize = v
		}
	}

	resp, err := h.coachService.ListCoaches(c.Request.Context(), page, pageSize, c.Query("query"), c.Query("status"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetCoachByID godoc
// @Summary Get coach details (admin)
// @Description Returns coach profile with student count
// @Tags admin-coaches
// @Produce json
// @Param id path int true "Coach user ID"
// @Success 200 {object} service.AdminCoachDetail
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/coaches/{id} [get]
// @Security BearerAuth
func (h *AdminCoachController) GetCoachByID(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	detail, err := h.coachService.GetCoachByID(c.Request.Context(), uint(id))
	if err != nil {
		if errors.Is(err, service.ErrCoachProfileNotFound) || errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "coach not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, detail)
}

// PatchCoach godoc
// @Summary Update coach flags (admin)
// @Description PATCH body: isPublished?, isActive?, status?
// @Tags admin-coaches
// @Accept json
// @Produce json
// @Param id path int true "Coach user ID"
// @Param body body service.AdminCoachPatchRequest true "Patch fields"
// @Success 200 {object} service.AdminCoachDetail
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/coaches/{id} [patch]
// @Security BearerAuth
func (h *AdminCoachController) PatchCoach(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req service.AdminCoachPatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if req.IsPublished == nil && req.IsActive == nil && req.Status == nil &&
		req.DisplayName == nil && req.Slug == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no fields to update"})
		return
	}

	detail, err := h.coachService.UpdateCoach(c.Request.Context(), uint(id), &req)
	if err != nil {
		if err.Error() == "invalid status" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
			return
		}
		if err.Error() == "coach must be approved before publishing" ||
			err.Error() == "displayName cannot be empty" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if errors.Is(err, service.ErrSlugTaken) || errors.Is(err, service.ErrInvalidSlug) {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		if errors.Is(err, service.ErrCoachProfileNotFound) || errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "coach not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, detail)
}
