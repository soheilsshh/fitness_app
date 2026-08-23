package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

// GamificationController exposes the student's XP/level summary and the
// leaderboard (points-economy roadmap).
type GamificationController struct {
	svc service.GamificationService
}

func NewGamificationController(svc service.GamificationService) *GamificationController {
	return &GamificationController{svc: svc}
}

// GetMySummary godoc
// @Summary Get the student's level, XP, and reputation summary
// @Tags me-gamification
// @Produce json
// @Security BearerAuth
// @Success 200 {object} service.GameSummaryDTO
// @Failure 401 {object} map[string]string
// @Router /me/gamification [get]
func (h *GamificationController) GetMySummary(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	resp, err := h.svc.GetMySummary(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت وضعیت امتیاز"})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetLeaderboard godoc
// @Summary Get the XP leaderboard for a period, optionally filtered to one coach's students
// @Tags leaderboard
// @Produce json
// @Security BearerAuth
// @Param period query string false "daily|weekly|monthly|quarterly|yearly" default(weekly)
// @Param coachId query int false "restrict to students assigned to this coach"
// @Param limit query int false "max rows, default 50, max 100"
// @Success 200 {array} service.LeaderboardEntryDTO
// @Failure 401 {object} map[string]string
// @Router /leaderboard [get]
func (h *GamificationController) GetLeaderboard(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	period := service.LeaderboardPeriod(c.DefaultQuery("period", string(service.LeaderboardWeekly)))
	switch period {
	case service.LeaderboardDaily, service.LeaderboardWeekly, service.LeaderboardMonthly,
		service.LeaderboardQuarterly, service.LeaderboardYearly:
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "period نامعتبر است"})
		return
	}

	var coachID *uint
	if raw := c.Query("coachId"); raw != "" {
		id, err := strconv.ParseUint(raw, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "coachId نامعتبر است"})
			return
		}
		v := uint(id)
		coachID = &v
	}

	limit := 50
	if raw := c.Query("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			limit = parsed
		}
	}

	resp, err := h.svc.GetLeaderboard(c.Request.Context(), period, coachID, limit, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت رتبه‌بندی"})
		return
	}
	c.JSON(http.StatusOK, resp)
}
