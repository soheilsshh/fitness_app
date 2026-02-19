package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type AdminPlanController struct {
	planService service.AdminPlanService
}

func NewAdminPlanController(s service.AdminPlanService) *AdminPlanController {
	return &AdminPlanController{planService: s}
}

// ListPlans godoc
// @Summary List plans for admin
// @Description Returns paginated list of plans with optional search and tag filter (discounted, popular)
// @Tags admin-plans
// @Produce json
// @Param page query int false "Page number"
// @Param pageSize query int false "Page size"
// @Param query query string false "Search by title, subtitle, courseName"
// @Param tag query string false "Filter: all | discounted | popular"
// @Success 200 {object} service.AdminPlanListResponse
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/plans [get]
// @Security BearerAuth
func (h *AdminPlanController) ListPlans(c *gin.Context) {
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
	query := c.Query("query")
	tag := c.Query("tag")
	if tag == "" {
		tag = "all"
	}

	resp, err := h.planService.ListPlans(c.Request.Context(), page, pageSize, query, tag)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetPlanByID godoc
// @Summary Get plan by ID for admin
// @Description Returns full plan detail for edit/view
// @Tags admin-plans
// @Produce json
// @Param id path int true "Plan ID"
// @Success 200 {object} service.AdminPlanDetail
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/plans/{id} [get]
// @Security BearerAuth
func (h *AdminPlanController) GetPlanByID(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	detail, err := h.planService.GetPlanByID(c.Request.Context(), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "plan not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, detail)
}

// CreatePlan godoc
// @Summary Create a new plan
// @Description Body matches frontend PlanForm (title, subtitle, courseName, description, featuresText, planType, price, discountPrice, discountPercent, durationDays, isPopular)
// @Tags admin-plans
// @Accept json
// @Produce json
// @Param body body service.AdminPlanCreateRequest true "Plan data"
// @Success 201 {object} service.AdminPlanDetail
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/plans [post]
// @Security BearerAuth
func (h *AdminPlanController) CreatePlan(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	var req service.AdminPlanCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if req.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
		return
	}

	detail, err := h.planService.CreatePlan(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, detail)
}

// UpdatePlan godoc
// @Summary Update a plan
// @Description PATCH body: optional fields (title, subtitle, courseName, description, featuresText, planType, price, discountPrice, discountPercent, durationDays, isPopular)
// @Tags admin-plans
// @Accept json
// @Produce json
// @Param id path int true "Plan ID"
// @Param body body service.AdminPlanUpdateRequest true "Fields to update"
// @Success 200 {object} service.AdminPlanDetail
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/plans/{id} [patch]
// @Security BearerAuth
func (h *AdminPlanController) UpdatePlan(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req service.AdminPlanUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	detail, err := h.planService.UpdatePlan(c.Request.Context(), uint(id), &req)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "plan not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, detail)
}

// DeletePlan godoc
// @Summary Delete a plan
// @Description Soft or hard delete (implementation defined)
// @Tags admin-plans
// @Param id path int true "Plan ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/plans/{id} [delete]
// @Security BearerAuth
func (h *AdminPlanController) DeletePlan(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.planService.DeletePlan(c.Request.Context(), uint(id)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "plan not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
