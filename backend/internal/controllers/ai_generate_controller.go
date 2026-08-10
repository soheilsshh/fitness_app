package controllers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type AIGenerateController struct {
	svc *service.AIGenerateService
}

func NewAIGenerateController(svc *service.AIGenerateService) *AIGenerateController {
	return &AIGenerateController{svc: svc}
}

// GenerateNutrition godoc
// @Summary Generate structured nutrition plan (AI, phase 0 — no DB save)
// @Tags me-ai
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]string
// @Failure 422 {object} map[string]string
// @Failure 429 {object} map[string]string
// @Failure 502 {object} map[string]string
// @Failure 503 {object} map[string]string
// @Router /me/nutrition/generate [post]
func (h *AIGenerateController) GenerateNutrition(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	plan, err := h.svc.GenerateNutrition(c.Request.Context(), userID)
	if err != nil {
		writeAIGenerateError(c, err)
		return
	}
	c.JSON(http.StatusOK, plan)
}

// GenerateWorkout godoc
// @Summary Generate structured workout plan (AI, phase 0 — no DB save)
// @Tags me-ai
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]string
// @Failure 422 {object} map[string]string
// @Failure 429 {object} map[string]string
// @Failure 502 {object} map[string]string
// @Failure 503 {object} map[string]string
// @Router /me/workout/generate [post]
func (h *AIGenerateController) GenerateWorkout(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	plan, err := h.svc.GenerateWorkout(c.Request.Context(), userID)
	if err != nil {
		writeAIGenerateError(c, err)
		return
	}
	c.JSON(http.StatusOK, plan)
}

func writeAIGenerateError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrAIInvalidPlan):
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "برنامه تولیدشده معتبر نیست: " + err.Error()})
	case errors.Is(err, service.ErrAIRateLimited):
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "لطفاً کمی صبر کنید و دوباره تلاش کنید"})
	case errors.Is(err, service.ErrAINotConfigured):
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "دستیار هوشمند فعلاً پیکربندی نشده است"})
	case errors.Is(err, service.ErrAIUpstream):
		c.JSON(http.StatusBadGateway, gin.H{"error": "ارتباط با سرویس هوش مصنوعی برقرار نشد"})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطای داخلی تولید برنامه"})
	}
}
