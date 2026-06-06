package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/service"
)

type PublicCoachController struct {
	coachService service.CoachProfileService
}

func NewPublicCoachController(s service.CoachProfileService) *PublicCoachController {
	return &PublicCoachController{coachService: s}
}

func (h *PublicCoachController) ListCoaches(c *gin.Context) {
	page := 1
	if p := c.Query("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	pageSize := 20
	if ps := c.Query("pageSize"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v > 0 && v <= 100 {
			pageSize = v
		}
	}
	resp, err := h.coachService.ListPublishedCoaches(c.Request.Context(), page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *PublicCoachController) GetCoachBySlug(c *gin.Context) {
	slug := c.Param("slug")
	dto, err := h.coachService.GetPublicProfile(c.Request.Context(), slug)
	if err != nil {
		if err == service.ErrCoachNotPublished {
			c.JSON(http.StatusNotFound, gin.H{"error": "coach not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto)
}

func (h *PublicCoachController) GetCoachPlans(c *gin.Context) {
	slug := c.Param("slug")
	plans, err := h.coachService.ListPublicPlans(c.Request.Context(), slug)
	if err != nil {
		if err == service.ErrCoachNotPublished {
			c.JSON(http.StatusNotFound, gin.H{"error": "coach not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if plans == nil {
		plans = []service.PublicPlanDTO{}
	}
	c.JSON(http.StatusOK, gin.H{"plans": plans})
}
