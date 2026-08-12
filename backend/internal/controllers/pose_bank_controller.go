package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/repository"
	"github.com/yourusername/fitness-management/internal/service"
)

// PoseBankController exposes the public posing-technique bank (roadmap D2/BE-5.3).
type PoseBankController struct {
	svc service.PoseBankService
}

func NewPoseBankController(svc service.PoseBankService) *PoseBankController {
	return &PoseBankController{svc: svc}
}

func (h *PoseBankController) ListPoses(c *gin.Context) {
	filter := repository.PoseBankFilter{Category: c.Query("category"), Query: c.Query("query")}
	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize"))
	resp, err := h.svc.List(c.Request.Context(), filter, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت بانک پوز"})
		return
	}
	c.JSON(http.StatusOK, resp)
}

type AdminPoseBankController struct {
	svc service.PoseBankService
}

func NewAdminPoseBankController(svc service.PoseBankService) *AdminPoseBankController {
	return &AdminPoseBankController{svc: svc}
}

func (h *AdminPoseBankController) ListPoses(c *gin.Context) {
	filter := repository.PoseBankFilter{Category: c.Query("category"), Query: c.Query("query"), IncludeUnpublished: true}
	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize"))
	resp, err := h.svc.List(c.Request.Context(), filter, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *AdminPoseBankController) CreatePose(c *gin.Context) {
	var req service.PoseUpsertRequest
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

func (h *AdminPoseBankController) UpdatePose(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req service.PoseUpsertRequest
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

func (h *AdminPoseBankController) DeletePose(c *gin.Context) {
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
