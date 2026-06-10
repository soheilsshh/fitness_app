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

type AdminExerciseController struct {
	exerciseService service.AdminExerciseService
}

func NewAdminExerciseController(s service.AdminExerciseService) *AdminExerciseController {
	return &AdminExerciseController{exerciseService: s}
}

// ListExercises godoc
// @Summary List exercises (admin)
// @Description Returns paginated list of exercises with optional filters
// @Tags admin-exercises
// @Produce json
// @Param page query int false "Page number"
// @Param pageSize query int false "Page size"
// @Param query query string false "Search by name, externalId or target"
// @Param category query string false "Filter by category"
// @Param bodyPart query string false "Filter by body part"
// @Param equipment query string false "Filter by equipment"
// @Success 200 {object} service.AdminExerciseListResponse
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/exercises [get]
// @Security BearerAuth
func (h *AdminExerciseController) ListExercises(c *gin.Context) {
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

	resp, err := h.exerciseService.ListExercises(
		c.Request.Context(),
		page,
		pageSize,
		c.Query("query"),
		c.Query("category"),
		c.Query("bodyPart"),
		c.Query("equipment"),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetExerciseByID godoc
// @Summary Get exercise by ID (admin)
// @Tags admin-exercises
// @Produce json
// @Param id path int true "Exercise ID"
// @Success 200 {object} service.AdminExerciseItem
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/exercises/{id} [get]
// @Security BearerAuth
func (h *AdminExerciseController) GetExerciseByID(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	item, err := h.exerciseService.GetExerciseByID(c.Request.Context(), uint(id))
	if err != nil {
		if errors.Is(err, service.ErrExerciseNotFound) || errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "exercise not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, item)
}

// CreateExercise godoc
// @Summary Create exercise (admin)
// @Tags admin-exercises
// @Accept json
// @Produce json
// @Param body body service.AdminExerciseCreateRequest true "Exercise payload"
// @Success 201 {object} service.AdminExerciseItem
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/exercises [post]
// @Security BearerAuth
func (h *AdminExerciseController) CreateExercise(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	var req service.AdminExerciseCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	item, err := h.exerciseService.CreateExercise(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, item)
}

// UpdateExercise godoc
// @Summary Update exercise (admin)
// @Tags admin-exercises
// @Accept json
// @Produce json
// @Param id path int true "Exercise ID"
// @Param body body service.AdminExerciseUpdateRequest true "Patch payload"
// @Success 200 {object} service.AdminExerciseItem
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/exercises/{id} [patch]
// @Security BearerAuth
func (h *AdminExerciseController) UpdateExercise(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req service.AdminExerciseUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	item, err := h.exerciseService.UpdateExercise(c.Request.Context(), uint(id), &req)
	if err != nil {
		if errors.Is(err, service.ErrExerciseNotFound) || errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "exercise not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, item)
}

// DeleteExercise godoc
// @Summary Delete exercise (admin)
// @Tags admin-exercises
// @Produce json
// @Param id path int true "Exercise ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/exercises/{id} [delete]
// @Security BearerAuth
func (h *AdminExerciseController) DeleteExercise(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.exerciseService.DeleteExercise(c.Request.Context(), uint(id)); err != nil {
		if errors.Is(err, service.ErrExerciseNotFound) || errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "exercise not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "exercise deleted"})
}
