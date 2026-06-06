package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

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
