package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/repository"
	"github.com/yourusername/fitness-management/internal/service"
)

// AdminRecipeController is the admin CRUD surface for the recipe bank (roadmap BE-1.6).
type AdminRecipeController struct {
	svc service.RecipeService
}

func NewAdminRecipeController(svc service.RecipeService) *AdminRecipeController {
	return &AdminRecipeController{svc: svc}
}

// ListRecipes godoc
// @Summary List recipes (admin, includes unpublished)
// @Tags admin-recipes
// @Produce json
// @Security BearerAuth
// @Success 200 {object} service.RecipeListResponse
// @Router /admin/recipes [get]
func (h *AdminRecipeController) ListRecipes(c *gin.Context) {
	filter := repository.RecipeFilter{
		DietType:           c.Query("type"),
		Query:              c.Query("query"),
		IncludeUnpublished: true,
	}
	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize"))
	resp, err := h.svc.List(c.Request.Context(), filter, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// CreateRecipe godoc
// @Summary Create recipe (admin)
// @Tags admin-recipes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body service.RecipeUpsertRequest true "Recipe payload"
// @Success 201 {object} service.RecipeDTO
// @Failure 400 {object} map[string]string
// @Router /admin/recipes [post]
func (h *AdminRecipeController) CreateRecipe(c *gin.Context) {
	var req service.RecipeUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	dto, err := h.svc.Create(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, dto)
}

// UpdateRecipe godoc
// @Summary Update recipe (admin)
// @Tags admin-recipes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Recipe ID"
// @Param body body service.RecipeUpsertRequest true "Recipe payload"
// @Success 200 {object} service.RecipeDTO
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /admin/recipes/{id} [patch]
func (h *AdminRecipeController) UpdateRecipe(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req service.RecipeUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	dto, err := h.svc.Update(c.Request.Context(), uint(id), &req)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto)
}

// DeleteRecipe godoc
// @Summary Delete recipe (admin)
// @Tags admin-recipes
// @Security BearerAuth
// @Param id path int true "Recipe ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]string
// @Router /admin/recipes/{id} [delete]
func (h *AdminRecipeController) DeleteRecipe(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.svc.Delete(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
