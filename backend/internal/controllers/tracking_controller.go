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

// AnalyzePhoto godoc
// @Summary Run AI observation analysis on an uploaded tracking photo (roadmap BE-5.2)
// @Tags me-tracking
// @Produce json
// @Security BearerAuth
// @Param id path int true "Photo ID"
// @Success 200 {object} service.TrackingPhotoDTO
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /me/tracking/photos/{id}/analyze [post]
func (h *TrackingController) AnalyzePhoto(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	photoID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || photoID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid photo id"})
		return
	}
	dto, err := h.trackingService.AnalyzePhoto(c.Request.Context(), userID, uint(photoID))
	if err != nil {
		if errors.Is(err, service.ErrTrackingPhotoNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadGateway, gin.H{"error": "خطا در تحلیل تصویر"})
		return
	}
	c.JSON(http.StatusOK, dto)
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

// ReviewPhoto godoc
// @Summary Coach approves/rejects a student's AI photo analysis (roadmap Coach-5.5)
// @Tags coach-tracking
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Photo ID"
// @Param body body object true "{status: approved|rejected, feedback: string}"
// @Success 200 {object} service.TrackingPhotoDTO
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /coach/tracking/photos/{id}/review [patch]
func (h *CoachTrackingController) ReviewPhoto(c *gin.Context) {
	coachID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	photoID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || photoID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid photo id"})
		return
	}
	var req struct {
		Status   string `json:"status"`
		Feedback string `json:"feedback"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	dto, err := h.trackingService.CoachReviewPhoto(c.Request.Context(), coachID, uint(photoID), req.Status, req.Feedback)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidTrackingPhoto):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case errors.Is(err, service.ErrCoachStudentForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		case errors.Is(err, service.ErrTrackingPhotoNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, dto)
}
