package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type AdminFeedbackController struct {
	feedbackService service.FeedbackService
}

func NewAdminFeedbackController(s service.FeedbackService) *AdminFeedbackController {
	return &AdminFeedbackController{feedbackService: s}
}

// ListFeedbacks godoc
// @Summary List feedbacks (admin)
// @Description Returns paginated list of feedback messages
// @Tags admin-feedback
// @Produce json
// @Param page query int false "Page number"
// @Param pageSize query int false "Page size"
// @Success 200 {object} service.FeedbackListResponse
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/feedbacks [get]
// @Security BearerAuth
func (h *AdminFeedbackController) ListFeedbacks(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)
	page := 1
	if p := c.Query("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	pageSize := 8
	if ps := c.Query("pageSize"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v > 0 && v <= 100 {
			pageSize = v
		}
	}
	resp, err := h.feedbackService.List(c.Request.Context(), page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}
