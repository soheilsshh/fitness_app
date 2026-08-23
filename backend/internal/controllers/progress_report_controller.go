package controllers

import (
	"net/http"
	"strconv"
	"time"

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

// GenerateNow computes a fresh weekly report for the last 7 days on demand —
// a TEST-ONLY escape hatch so the frontend cards can be checked without
// waiting for the Saturday 3am scheduler. Bypasses the scheduler's
// ExistsForPeriod dedup on purpose (each click makes a new row); this is not
// meant to be reachable from normal product UI.
// @Summary [TEST] Generate a weekly progress report immediately for the current user
// @Tags me-progress
// @Produce json
// @Security BearerAuth
// @Success 200 {object} service.ProgressReportDTO
// @Router /me/progress/reports/generate [post]
func (h *ProgressReportController) GenerateNow(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	now := time.Now()
	periodEnd := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	periodStart := periodEnd.AddDate(0, 0, -7)

	if _, err := h.svc.ComputeAndSaveReport(c.Request.Context(), userID, service.PeriodTypeWeekly, periodStart, periodEnd); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در تولید گزارش"})
		return
	}
	// Return via the normal DTO-shaped endpoint's mapping instead of the raw
	// model, so the frontend gets the same camelCase shape as GET /me/progress/reports.
	resp, err := h.svc.ListReports(c.Request.Context(), userID, service.PeriodTypeWeekly, 1, 1)
	if err != nil || len(resp.Items) == 0 {
		c.JSON(http.StatusOK, gin.H{"ok": true})
		return
	}
	c.JSON(http.StatusOK, resp.Items[0])
}
