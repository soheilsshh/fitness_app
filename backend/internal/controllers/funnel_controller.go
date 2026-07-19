package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/service"
)

type FunnelController struct {
	funnelService service.FunnelService
}

func NewFunnelController(s service.FunnelService) *FunnelController {
	return &FunnelController{funnelService: s}
}

func (h *FunnelController) GetConfig(c *gin.Context) {
	cfg := h.funnelService.GetConfig(c.Request.Context())
	c.JSON(http.StatusOK, cfg)
}

func (h *FunnelController) CreateLead(c *gin.Context) {
	var req service.CreateFunnelLeadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	resp, err := h.funnelService.CreateLead(c.Request.Context(), &req)
	if err != nil {
		if errors.Is(err, service.ErrFunnelInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات وارد شده نامعتبر است"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *FunnelController) GetCheckout(c *gin.Context) {
	token := c.Param("token")
	resp, err := h.funnelService.GetCheckout(c.Request.Context(), token)
	if err != nil {
		if errors.Is(err, service.ErrFunnelLeadNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "lead not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *FunnelController) PayDemo(c *gin.Context) {
	token := c.Param("token")
	resp, err := h.funnelService.PayDemo(c.Request.Context(), token)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrFunnelLeadNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "lead not found"})
		case errors.Is(err, service.ErrFunnelInvalidStatus):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment status"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, resp)
}

type AdminFunnelController struct {
	funnelService service.FunnelService
}

func NewAdminFunnelController(s service.FunnelService) *AdminFunnelController {
	return &AdminFunnelController{funnelService: s}
}

func (h *AdminFunnelController) ListLeads(c *gin.Context) {
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
	status := c.Query("status")
	if status == "" {
		status = "all"
	}

	query := c.Query("query")

	resp, err := h.funnelService.ListLeads(c.Request.Context(), status, query, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *AdminFunnelController) GetLead(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	resp, err := h.funnelService.GetLeadByID(c.Request.Context(), uint(id))
	if err != nil {
		if errors.Is(err, service.ErrFunnelLeadNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "lead not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *AdminFunnelController) PatchLead(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req service.PatchFunnelLeadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	if err := h.funnelService.PatchLead(c.Request.Context(), uint(id), &req); err != nil {
		switch {
		case errors.Is(err, service.ErrFunnelLeadNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "lead not found"})
		case errors.Is(err, service.ErrFunnelInvalidInput), errors.Is(err, service.ErrFunnelInvalidStatus):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *AdminFunnelController) DeleteLead(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.funnelService.DeleteLead(c.Request.Context(), uint(id)); err != nil {
		if errors.Is(err, service.ErrFunnelLeadNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "lead not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *AdminFunnelController) Stats(c *gin.Context) {
	stats, err := h.funnelService.GetStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}
