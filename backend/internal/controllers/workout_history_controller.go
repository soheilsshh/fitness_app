package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type WorkoutHistoryController struct {
	historyService service.WorkoutHistoryService
}

func NewWorkoutHistoryController(historyService service.WorkoutHistoryService) *WorkoutHistoryController {
	return &WorkoutHistoryController{historyService: historyService}
}

func (h *WorkoutHistoryController) ListHistory(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	page, pageSize := 1, 20
	if p, err := strconv.Atoi(c.Query("page")); err == nil && p > 0 {
		page = p
	}
	if ps, err := strconv.Atoi(c.Query("pageSize")); err == nil && ps > 0 {
		pageSize = ps
	}

	var subscriptionID uint
	if sid := c.Query("subscriptionId"); sid != "" {
		if id, err := strconv.ParseUint(sid, 10, 64); err == nil {
			subscriptionID = uint(id)
		}
	}

	resp, err := h.historyService.ListHistory(c.Request.Context(), userID, page, pageSize, subscriptionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *WorkoutHistoryController) LogSession(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req service.LogWorkoutSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.historyService.LogSession(c.Request.Context(), userID, &req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidWorkoutDay),
			errors.Is(err, service.ErrWorkoutDayEmpty),
			errors.Is(err, service.ErrWorkoutSubscriptionEnded):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case errors.Is(err, service.ErrWorkoutSessionForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusCreated, resp)
}
