package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type NotificationController struct {
	notificationService service.NotificationService
}

func NewNotificationController(notificationService service.NotificationService) *NotificationController {
	return &NotificationController{notificationService: notificationService}
}

func (h *NotificationController) ListRecent(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	limit := 5
	if l, err := strconv.Atoi(c.Query("limit")); err == nil && l > 0 {
		limit = l
	}
	if limit > 20 {
		limit = 20
	}
	items, err := h.notificationService.ListRecent(c.Request.Context(), userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

// GetSettings godoc
// @Summary Get notification (push/SMS) preference
// @Tags notifications
// @Produce json
// @Security BearerAuth
// @Success 200 {object} service.NotificationSettingsDTO
// @Router /me/notifications/settings [get]
func (h *NotificationController) GetSettings(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	dto, err := h.notificationService.GetSettings(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت تنظیمات"})
		return
	}
	c.JSON(http.StatusOK, dto)
}

// UpdateSettings godoc
// @Summary Toggle notification (push/SMS) preference
// @Tags notifications
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body map[string]bool true "notificationsEnabled"
// @Success 200 {object} service.NotificationSettingsDTO
// @Router /me/notifications/settings [patch]
func (h *NotificationController) UpdateSettings(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	var body struct {
		NotificationsEnabled bool `json:"notificationsEnabled"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	dto, err := h.notificationService.UpdateSettings(c.Request.Context(), userID, body.NotificationsEnabled)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی تنظیمات"})
		return
	}
	c.JSON(http.StatusOK, dto)
}
