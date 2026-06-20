package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type MeDashboardController struct {
	dashboardService service.MeDashboardService
}

func NewMeDashboardController(s service.MeDashboardService) *MeDashboardController {
	return &MeDashboardController{dashboardService: s}
}

func (h *MeDashboardController) GetSummary(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	days := parseIntQuery(c.Query("days"), 30, 90)
	resp, err := h.dashboardService.Summary(c.Request.Context(), userID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *MeDashboardController) GetRecords(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	limit := parseIntQuery(c.Query("limit"), 5, 20)
	items, err := h.dashboardService.PersonalRecords(c.Request.Context(), userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}
