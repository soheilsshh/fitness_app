package controllers

import (
	"errors"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type WorkoutHistoryController struct {
	historyService service.WorkoutHistoryService
}

func NewWorkoutHistoryController(historyService service.WorkoutHistoryService) *WorkoutHistoryController {
	return &WorkoutHistoryController{historyService: historyService}
}

func (h *WorkoutHistoryController) ListHistory(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
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

	var subscriptionID uint
	if sid := c.Query("subscriptionId"); sid != "" {
		if id, err := strconv.ParseUint(sid, 10, 64); err == nil {
			subscriptionID = uint(id)
		}
	}

	resp, err := h.historyService.ListHistory(c.Request.Context(), userID, page, pageSize, subscriptionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *WorkoutHistoryController) ListPersonalRecords(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	query := service.PersonalRecordsQuery{
		ExerciseName: c.Query("exercise"),
		Target:       c.Query("target"),
	}
	if fromStr := c.Query("from"); fromStr != "" {
		if t, err := time.Parse("2006-01-02", fromStr); err == nil {
			query.From = &t
		}
	}
	if toStr := c.Query("to"); toStr != "" {
		if t, err := time.Parse("2006-01-02", toStr); err == nil {
			t = t.Add(24*time.Hour - time.Second) // include the whole "to" day
			query.To = &t
		}
	}

	records, err := h.historyService.ListPersonalRecords(c.Request.Context(), userID, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": records})
}

func (h *WorkoutHistoryController) ListExerciseTargets(c *gin.Context) {
	if _, err := middleware.GetUserID(c); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	targets, err := h.historyService.ListExerciseTargets(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": targets})
}

func (h *WorkoutHistoryController) NotifyCoachOfPersonalRecord(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	var req struct {
		ExerciseName string  `json:"exerciseName"`
		WeightKg     float64 `json:"weightKg"`
		Reps         int     `json:"reps"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.historyService.NotifyCoachOfPersonalRecord(c.Request.Context(), userID, req.ExerciseName, req.WeightKg, req.Reps); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *WorkoutHistoryController) LogSession(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req service.LogWorkoutSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.historyService.LogSession(c.Request.Context(), userID, &req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidWorkoutDay),
			errors.Is(err, service.ErrWorkoutDayEmpty),
			errors.Is(err, service.ErrWorkoutSubscriptionEnded):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case errors.Is(err, service.ErrWorkoutSessionForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *WorkoutHistoryController) SubmitSurvey(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}
	var req service.WorkoutSessionSurveyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.historyService.SubmitSurvey(c.Request.Context(), userID, uint(sessionID), &req); err != nil {
		switch {
		case errors.Is(err, service.ErrWorkoutSessionNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case errors.Is(err, service.ErrWorkoutSessionForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *WorkoutHistoryController) SubmitSurveyVoiceNote(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "فایل صوتی الزامی است"})
		return
	}
	if fileHeader.Size > maxVoiceUploadBytes {
		c.JSON(http.StatusBadRequest, gin.H{"error": "حجم فایل صوتی بیش از حد مجاز است"})
		return
	}
	opened, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در خواندن فایل"})
		return
	}
	defer opened.Close()
	data, err := io.ReadAll(io.LimitReader(opened, maxVoiceUploadBytes))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در خواندن فایل"})
		return
	}

	result, err := h.historyService.TranscribeSurveyVoiceNote(c.Request.Context(), userID, fileHeader.Filename, data)
	if err != nil {
		writeAIGenerateError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}
