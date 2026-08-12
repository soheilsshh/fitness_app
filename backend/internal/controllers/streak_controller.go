package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

// StreakController exposes the student's activity streak (roadmap: استریک و پاپ‌آپ تشویقی).
type StreakController struct {
	svc service.StreakService
}

func NewStreakController(svc service.StreakService) *StreakController {
	return &StreakController{svc: svc}
}

// GetMyStreak godoc
// @Summary Get my current activity streak (consecutive active days)
// @Tags me-streak
// @Produce json
// @Security BearerAuth
// @Success 200 {object} service.StreakDTO
// @Router /me/streak [get]
func (h *StreakController) GetMyStreak(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	dto, err := h.svc.GetStreak(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در محاسبه استریک"})
		return
	}
	c.JSON(http.StatusOK, dto)
}
