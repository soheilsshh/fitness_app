package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/service"
)

type CoachFoodController struct {
	foodService service.CoachFoodService
}

func NewCoachFoodController(s service.CoachFoodService) *CoachFoodController {
	return &CoachFoodController{foodService: s}
}

func (h *CoachFoodController) ListFoods(c *gin.Context) {
	page := 1
	if p := c.Query("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}

	limit := 20
	if l := c.Query("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 && v <= 100 {
			limit = v
		}
	} else if ps := c.Query("pageSize"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v > 0 && v <= 100 {
			limit = v
		}
	}

	resp, err := h.foodService.ListFoods(c.Request.Context(), page, limit, c.Query("query"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}
