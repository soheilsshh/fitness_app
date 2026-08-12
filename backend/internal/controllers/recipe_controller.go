package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/repository"
	"github.com/yourusername/fitness-management/internal/service"
)

// RecipeController exposes the public/student recipe bank (roadmap BE-1.7).
type RecipeController struct {
	svc service.RecipeService
}

func NewRecipeController(svc service.RecipeService) *RecipeController {
	return &RecipeController{svc: svc}
}

// ListRecipes godoc
// @Summary List/filter recipe bank
// @Tags recipes
// @Produce json
// @Param calorie_min query int false "Minimum calories"
// @Param calorie_max query int false "Maximum calories"
// @Param type query string false "Diet type"
// @Param ingredients query string false "Ingredient contains"
// @Param query query string false "Search title"
// @Param page query int false "Page"
// @Param pageSize query int false "Page size"
// @Success 200 {object} service.RecipeListResponse
// @Router /recipes [get]
func (h *RecipeController) ListRecipes(c *gin.Context) {
	filter := repository.RecipeFilter{
		DietType:   c.Query("type"),
		Ingredient: c.Query("ingredients"),
		Query:      c.Query("query"),
	}
	if v, err := strconv.Atoi(c.Query("calorie_min")); err == nil {
		filter.CalorieMin = v
	}
	if v, err := strconv.Atoi(c.Query("calorie_max")); err == nil {
		filter.CalorieMax = v
	}
	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize"))

	resp, err := h.svc.List(c.Request.Context(), filter, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت دستورهای پخت"})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetRecipe godoc
// @Summary Get one recipe by id
// @Tags recipes
// @Produce json
// @Param id path int true "Recipe ID"
// @Success 200 {object} service.RecipeDTO
// @Failure 404 {object} map[string]string
// @Router /recipes/{id} [get]
func (h *RecipeController) GetRecipe(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	dto, err := h.svc.GetByID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "دستور پخت پیدا نشد"})
		return
	}
	c.JSON(http.StatusOK, dto)
}
