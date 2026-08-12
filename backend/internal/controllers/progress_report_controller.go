package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

// ProgressReportController exposes the weekly/monthly deep-dive history (roadmap BE-4.5).
type ProgressReportController struct {
	svc service.ProgressReportService
}

func NewProgressReportController(svc service.ProgressReportService) *ProgressReportController {
	return &ProgressReportController{svc: svc}
}

// ListReports godoc
// @Summary List the student's weekly/monthly progress reports
// @Tags me-progress
// @Produce json
// @Security BearerAuth
// @Param type query string false "weekly | monthly (omit for all)"
// @Param page query int false "Page"
// @Param pageSize query int false "Page size"
// @Success 200 {object} service.ProgressReportListResponse
// @Failure 401 {object} map[string]string
// @Router /me/progress/reports [get]
func (h *ProgressReportController) ListReports(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize"))

	resp, err := h.svc.ListReports(c.Request.Context(), userID, c.Query("type"), page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت گزارش‌های پیشرفت"})
		return
	}
	c.JSON(http.StatusOK, resp)
}
