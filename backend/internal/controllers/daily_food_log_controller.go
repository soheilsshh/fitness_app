package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type DailyFoodLogController struct {
	foodLogService service.DailyFoodLogService
}

func NewDailyFoodLogController(foodLogService service.DailyFoodLogService) *DailyFoodLogController {
	return &DailyFoodLogController{foodLogService: foodLogService}
}

func (h *DailyFoodLogController) CreateLog(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req service.CreateFoodLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.foodLogService.CreateLog(c.Request.Context(), userID, &req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrFoodLogInvalidDate),
			errors.Is(err, service.ErrFoodLogNameRequired),
			errors.Is(err, service.ErrFoodLogEntryRequired):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case errors.Is(err, service.ErrFoodLogFoodNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *DailyFoodLogController) ListByDate(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	resp, err := h.foodLogService.ListByDate(c.Request.Context(), userID, c.Query("date"))
	if err != nil {
		if errors.Is(err, service.ErrFoodLogInvalidDate) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *DailyFoodLogController) DeleteLog(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	logID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || logID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid log id"})
		return
	}

	if err := h.foodLogService.DeleteLog(c.Request.Context(), userID, uint(logID)); err != nil {
		if errors.Is(err, service.ErrFoodLogNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
