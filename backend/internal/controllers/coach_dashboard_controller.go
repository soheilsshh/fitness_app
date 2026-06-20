package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

func parseIntQuery(raw string, def, max int) int {
	v := def
	if n, err := strconv.Atoi(raw); err == nil && n > 0 {
		v = n
	}
	if v > max {
		v = max
	}
	return v
}

type CoachDashboardController struct {
	dashboardService service.CoachDashboardService
}

func NewCoachDashboardController(s service.CoachDashboardService) *CoachDashboardController {
	return &CoachDashboardController{dashboardService: s}
}

func (h *CoachDashboardController) GetStats(c *gin.Context) {
	coachID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	resp, err := h.dashboardService.GetStats(c.Request.Context(), coachID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *CoachDashboardController) GetRecentStudents(c *gin.Context) {
	coachID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	limit := parseIntQuery(c.Query("limit"), 5, 20)
	items, err := h.dashboardService.RecentStudents(c.Request.Context(), coachID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *CoachDashboardController) GetTopStudents(c *gin.Context) {
	coachID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	limit := parseIntQuery(c.Query("limit"), 3, 10)
	items, err := h.dashboardService.TopStudents(c.Request.Context(), coachID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *CoachDashboardController) GetProgressSeries(c *gin.Context) {
	coachID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	days := parseIntQuery(c.Query("days"), 30, 90)
	items, err := h.dashboardService.ProgressSeries(c.Request.Context(), coachID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}
