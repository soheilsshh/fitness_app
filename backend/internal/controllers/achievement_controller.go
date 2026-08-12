package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

// AchievementController exposes the student's gamification summary (roadmap BE-6.4).
type AchievementController struct {
	svc service.AchievementService
}

func NewAchievementController(svc service.AchievementService) *AchievementController {
	return &AchievementController{svc: svc}
}

// GetMyAchievements godoc
// @Summary Get the student's total points and earned badges
// @Tags me-achievements
// @Produce json
// @Security BearerAuth
// @Success 200 {object} service.AchievementSummaryDTO
// @Failure 401 {object} map[string]string
// @Router /me/achievements [get]
func (h *AchievementController) GetMyAchievements(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	resp, err := h.svc.GetSummary(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت دستاوردها"})
		return
	}
	c.JSON(http.StatusOK, resp)
}
