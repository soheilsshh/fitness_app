package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

// EventController exposes community events/competitions for students (roadmap F2/BE-7.3).
type EventController struct {
	svc service.EventService
}

func NewEventController(svc service.EventService) *EventController {
	return &EventController{svc: svc}
}

// ListEvents godoc
// @Summary List active events
// @Tags events
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page"
// @Param pageSize query int false "Page size"
// @Success 200 {object} service.EventListResponse
// @Router /me/events [get]
func (h *EventController) ListEvents(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize"))
	resp, err := h.svc.List(c.Request.Context(), userID, true, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت رویدادها"})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// JoinEvent godoc
// @Summary Opt-in join an event
// @Tags events
// @Security BearerAuth
// @Param id path int true "Event ID"
// @Success 200 {object} map[string]string
// @Router /me/events/{id}/join [post]
func (h *EventController) JoinEvent(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.svc.Join(c.Request.Context(), userID, uint(id)); err != nil {
		switch {
		case errors.Is(err, service.ErrEventNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "رویداد پیدا نشد"})
		case errors.Is(err, service.ErrEventAlreadyJoined):
			c.JSON(http.StatusConflict, gin.H{"error": "قبلاً در این رویداد ثبت‌نام کرده‌اید"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت‌نام رویداد"})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "joined"})
}

// LeaveEvent godoc
// @Summary Cancel participation in an event
// @Tags events
// @Security BearerAuth
// @Param id path int true "Event ID"
// @Success 200 {object} map[string]string
// @Router /me/events/{id}/leave [post]
func (h *EventController) LeaveEvent(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.svc.Leave(c.Request.Context(), userID, uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در لغو ثبت‌نام"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "left"})
}

// AdminEventController manages events/competitions (roadmap Admin-7.5).
type AdminEventController struct {
	svc service.EventService
}

func NewAdminEventController(svc service.EventService) *AdminEventController {
	return &AdminEventController{svc: svc}
}

// ListEvents godoc
// @Summary List all events (admin)
// @Tags admin-events
// @Produce json
// @Security BearerAuth
// @Success 200 {object} service.EventListResponse
// @Router /admin/events [get]
func (h *AdminEventController) ListEvents(c *gin.Context) {
	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize"))
	resp, err := h.svc.List(c.Request.Context(), 0, false, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت رویدادها"})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// CreateEvent godoc
// @Summary Create a new event/competition
// @Tags admin-events
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body service.EventUpsertRequest true "Event"
// @Success 201 {object} service.EventDTO
// @Router /admin/events [post]
func (h *AdminEventController) CreateEvent(c *gin.Context) {
	var req service.EventUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	dto, err := h.svc.Create(c.Request.Context(), &req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrEventTitleRequired):
			c.JSON(http.StatusBadRequest, gin.H{"error": "عنوان رویداد الزامی است"})
		case errors.Is(err, service.ErrEventTypeInvalid):
			c.JSON(http.StatusBadRequest, gin.H{"error": "نوع رویداد باید offline یا online باشد"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت رویداد"})
		}
		return
	}
	c.JSON(http.StatusCreated, dto)
}

// UpdateEvent godoc
// @Summary Update an event
// @Tags admin-events
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Event ID"
// @Param body body service.EventUpsertRequest true "Event"
// @Success 200 {object} service.EventDTO
// @Router /admin/events/{id} [patch]
func (h *AdminEventController) UpdateEvent(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req service.EventUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	dto, err := h.svc.Update(c.Request.Context(), uint(id), &req)
	if err != nil {
		if errors.Is(err, service.ErrEventNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "رویداد پیدا نشد"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی رویداد"})
		return
	}
	c.JSON(http.StatusOK, dto)
}

// DeleteEvent godoc
// @Summary Delete an event
// @Tags admin-events
// @Security BearerAuth
// @Param id path int true "Event ID"
// @Success 204
// @Router /admin/events/{id} [delete]
func (h *AdminEventController) DeleteEvent(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.svc.Delete(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف رویداد"})
		return
	}
	c.Status(http.StatusNoContent)
}
