package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type MobileAppController struct {
	svc service.MobileAppService
}

func NewMobileAppController(svc service.MobileAppService) *MobileAppController {
	return &MobileAppController{svc: svc}
}

func (h *MobileAppController) PublicHeartbeat(c *gin.Context) {
	var req service.MobileHeartbeatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if err := h.svc.Heartbeat(c.Request.Context(), nil, &req); err != nil {
		h.writeHeartbeatError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *MobileAppController) MeHeartbeat(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	var req service.MobileHeartbeatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	uid := userID
	if err := h.svc.Heartbeat(c.Request.Context(), &uid, &req); err != nil {
		h.writeHeartbeatError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *MobileAppController) writeHeartbeatError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrDeviceIDRequired),
		errors.Is(err, service.ErrInvalidMobileStore),
		errors.Is(err, service.ErrInvalidMobilePlatform):
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "heartbeat failed"})
	}
}

func (h *MobileAppController) Overview(c *gin.Context) {
	out, err := h.svc.Overview(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load overview"})
		return
	}
	c.JSON(http.StatusOK, out)
}

func (h *MobileAppController) ListDevices(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	out, err := h.svc.ListDevices(
		c.Request.Context(),
		c.Query("store"),
		c.Query("platform"),
		page,
		pageSize,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list devices"})
		return
	}
	c.JSON(http.StatusOK, out)
}

func (h *MobileAppController) ListReleases(c *gin.Context) {
	items, err := h.svc.ListReleases(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list releases"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *MobileAppController) CreateRelease(c *gin.Context) {
	var req service.MobileReleaseUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	item, err := h.svc.CreateRelease(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *MobileAppController) UpdateRelease(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req service.MobileReleaseUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	item, err := h.svc.UpdateRelease(c.Request.Context(), uint(id), &req)
	if err != nil {
		if errors.Is(err, service.ErrMobileReleaseNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *MobileAppController) DeleteRelease(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.svc.DeleteRelease(c.Request.Context(), uint(id)); err != nil {
		if errors.Is(err, service.ErrMobileReleaseNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
		return
	}
	c.Status(http.StatusNoContent)
}
