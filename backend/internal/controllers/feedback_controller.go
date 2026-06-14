package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/service"
)

type FeedbackController struct {
	feedbackService service.FeedbackService
}

func NewFeedbackController(s service.FeedbackService) *FeedbackController {
	return &FeedbackController{feedbackService: s}
}

// CreateFeedback godoc
// @Summary Submit feedback (public contact form)
// @Description POST body: fullName, email, phone, message (fullName, email, message required)
// @Tags feedback
// @Accept json
// @Produce json
// @Param body body service.FeedbackCreateRequest true "Feedback data"
// @Success 201 {object} map[string]string "message: ok"
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /feedbacks [post]
func (h *FeedbackController) CreateFeedback(c *gin.Context) {
	var req service.FeedbackCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if err := h.feedbackService.Create(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "ok"})
}
