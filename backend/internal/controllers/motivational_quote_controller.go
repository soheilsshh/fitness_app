package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/service"
)

// MotivationalQuoteController exposes the "Optimal" dashboard quote (roadmap E4/BE-8.5).
type MotivationalQuoteController struct {
	svc service.MotivationalQuoteService
}

func NewMotivationalQuoteController(svc service.MotivationalQuoteService) *MotivationalQuoteController {
	return &MotivationalQuoteController{svc: svc}
}

// RandomQuote godoc
// @Summary Get a random motivational quote
// @Tags optimal
// @Produce json
// @Security BearerAuth
// @Success 200 {object} service.MotivationalQuoteDTO
// @Router /me/optimal/quote [get]
func (h *MotivationalQuoteController) RandomQuote(c *gin.Context) {
	dto, err := h.svc.Random(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت جمله انگیزشی"})
		return
	}
	c.JSON(http.StatusOK, dto)
}

// AdminMotivationalQuoteController manages the quote bank (admin CRUD).
type AdminMotivationalQuoteController struct {
	svc service.MotivationalQuoteService
}

func NewAdminMotivationalQuoteController(svc service.MotivationalQuoteService) *AdminMotivationalQuoteController {
	return &AdminMotivationalQuoteController{svc: svc}
}

// ListQuotes godoc
// @Summary List motivational quotes (admin)
// @Tags admin-optimal
// @Produce json
// @Security BearerAuth
// @Success 200 {object} service.QuoteListResponse
// @Router /admin/optimal/quotes [get]
func (h *AdminMotivationalQuoteController) ListQuotes(c *gin.Context) {
	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize"))
	resp, err := h.svc.List(c.Request.Context(), page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت جملات"})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// CreateQuote godoc
// @Summary Create a motivational quote
// @Tags admin-optimal
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body service.QuoteUpsertRequest true "Quote"
// @Success 201 {object} service.MotivationalQuoteDTO
// @Router /admin/optimal/quotes [post]
func (h *AdminMotivationalQuoteController) CreateQuote(c *gin.Context) {
	var req service.QuoteUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	dto, err := h.svc.Create(c.Request.Context(), &req)
	if err != nil {
		if errors.Is(err, service.ErrQuoteTextRequired) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "متن جمله الزامی است"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت جمله"})
		return
	}
	c.JSON(http.StatusCreated, dto)
}

// UpdateQuote godoc
// @Summary Update a motivational quote
// @Tags admin-optimal
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Quote ID"
// @Param body body service.QuoteUpsertRequest true "Quote"
// @Success 200 {object} service.MotivationalQuoteDTO
// @Router /admin/optimal/quotes/{id} [patch]
func (h *AdminMotivationalQuoteController) UpdateQuote(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req service.QuoteUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	dto, err := h.svc.Update(c.Request.Context(), uint(id), &req)
	if err != nil {
		if errors.Is(err, service.ErrQuoteTextRequired) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "متن جمله الزامی است"})
			return
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "جمله پیدا نشد"})
		return
	}
	c.JSON(http.StatusOK, dto)
}

// DeleteQuote godoc
// @Summary Delete a motivational quote
// @Tags admin-optimal
// @Security BearerAuth
// @Param id path int true "Quote ID"
// @Success 204
// @Router /admin/optimal/quotes/{id} [delete]
func (h *AdminMotivationalQuoteController) DeleteQuote(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.svc.Delete(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف جمله"})
		return
	}
	c.Status(http.StatusNoContent)
}
