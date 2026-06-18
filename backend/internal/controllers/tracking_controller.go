package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type TrackingController struct {
	trackingService service.TrackingService
}

func NewTrackingController(trackingService service.TrackingService) *TrackingController {
	return &TrackingController{trackingService: trackingService}
}

func (h *TrackingController) GetMyTracking(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	resp, err := h.trackingService.GetMyTracking(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, service.ErrTrackingNoSubscription) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *TrackingController) SubmitWeight(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	var req struct {
		Weight float64 `json:"weight"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	resp, err := h.trackingService.SubmitWeight(c.Request.Context(), userID, req.Weight)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidWeight):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case errors.Is(err, service.ErrTrackingNoSubscription):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *TrackingController) UploadTrackingPhoto(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	photoType := c.PostForm("type")
	file, err := c.FormFile("photo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "photo file is required"})
		return
	}
	opened, err := file.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot open photo"})
		return
	}
	defer opened.Close()

	photo, err := h.trackingService.UploadTrackingPhoto(c.Request.Context(), userID, opened, file.Filename, photoType)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidTrackingPhoto):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case errors.Is(err, service.ErrTrackingNoSubscription):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, photo)
}

type CoachTrackingController struct {
	trackingService service.TrackingService
}

func NewCoachTrackingController(trackingService service.TrackingService) *CoachTrackingController {
	return &CoachTrackingController{trackingService: trackingService}
}

func (h *CoachTrackingController) ListStudents(c *gin.Context) {
	coachID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	page, pageSize := 1, 20
	if p, err := strconv.Atoi(c.Query("page")); err == nil && p > 0 {
		page = p
	}
	if ps, err := strconv.Atoi(c.Query("pageSize")); err == nil && ps > 0 {
		pageSize = ps
	}
	resp, err := h.trackingService.ListCoachTrackingStudents(c.Request.Context(), coachID, page, pageSize, c.Query("query"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *CoachTrackingController) GetStudentTracking(c *gin.Context) {
	coachID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	studentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid student id"})
		return
	}
	resp, err := h.trackingService.GetCoachStudentTracking(c.Request.Context(), coachID, uint(studentID))
	if err != nil {
		switch {
		case errors.Is(err, service.ErrCoachStudentForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		case errors.Is(err, service.ErrCoachStudentNotFound), errors.Is(err, service.ErrTrackingNoSubscription):
			c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, resp)
}
