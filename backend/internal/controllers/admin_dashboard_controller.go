package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type AdminDashboardController struct {
	dashboardService service.AdminDashboardService
}

func NewAdminDashboardController(s service.AdminDashboardService) *AdminDashboardController {
	return &AdminDashboardController{dashboardService: s}
}

// GetStats godoc
// @Summary Get dashboard stats for a year
// @Description Returns totalUsers, activeUsers, purchasedCourses for the given year (for admin dashboard)
// @Tags admin-dashboard
// @Produce json
// @Param year query int true "Calendar year (e.g. 1403 or 2024)"
// @Success 200 {object} service.DashboardStatsResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/dashboard/stats [get]
// @Security BearerAuth
func (h *AdminDashboardController) GetStats(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	yearStr := c.Query("year")
	if yearStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "year is required"})
		return
	}
	year, err := strconv.Atoi(yearStr)
	if err != nil || year < 1300 || year > 2100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid year"})
		return
	}

	stats, err := h.dashboardService.GetStats(c.Request.Context(), year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetMonthlySales godoc
// @Summary Get monthly sales data for a year
// @Description Returns 12 items (Persian month names) with courses count and sales sum for chart
// @Tags admin-dashboard
// @Produce json
// @Param year query int true "Calendar year"
// @Success 200 {array} service.MonthlySaleItem
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/dashboard/monthly-sales [get]
// @Security BearerAuth
func (h *AdminDashboardController) GetMonthlySales(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	yearStr := c.Query("year")
	if yearStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "year is required"})
		return
	}
	year, err := strconv.Atoi(yearStr)
	if err != nil || year < 1300 || year > 2100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid year"})
		return
	}

	monthly, err := h.dashboardService.GetMonthlySales(c.Request.Context(), year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, monthly)
}
