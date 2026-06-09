package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/service"
)

type CoachExerciseController struct {
	exerciseService service.AdminExerciseService
}

func NewCoachExerciseController(s service.AdminExerciseService) *CoachExerciseController {
	return &CoachExerciseController{exerciseService: s}
}

func (h *CoachExerciseController) ListCategories(c *gin.Context) {
	cats, err := h.exerciseService.ListCategories(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"categories": cats})
}

func (h *CoachExerciseController) ListExercises(c *gin.Context) {
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

func (h *CoachExerciseController) GetExerciseByID(c *gin.Context) {
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
