package controllers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type AIChatController struct {
	aiService *service.AIChatService
}

func NewAIChatController(aiService *service.AIChatService) *AIChatController {
	return &AIChatController{aiService: aiService}
}

// Chat godoc
// @Summary Fitino AI assistant chat (student)
// @Tags me-ai
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body service.AIChatRequest true "Chat request"
// @Success 200 {object} service.AIChatResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 429 {object} map[string]string
// @Failure 503 {object} map[string]string
// @Failure 502 {object} map[string]string
// @Router /me/ai/chat [post]
func (h *AIChatController) Chat(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req service.AIChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	out, err := h.aiService.Chat(c.Request.Context(), userID, &req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrAIInvalidInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": "پیام نامعتبر است"})
		case errors.Is(err, service.ErrAIRateLimited):
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "لطفاً کمی صبر کنید و دوباره تلاش کنید"})
		case errors.Is(err, service.ErrAINotConfigured):
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "دستیار هوشمند فعلاً پیکربندی نشده است"})
		case errors.Is(err, service.ErrAIUpstream):
			c.JSON(http.StatusBadGateway, gin.H{"error": "ارتباط با سرویس هوش مصنوعی برقرار نشد"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطای داخلی دستیار"})
		}
		return
	}

	c.JSON(http.StatusOK, out)
}
