package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/config"
	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type CoachAchievementController struct {
	achievementService service.CoachAchievementService
}

func NewCoachAchievementController(s service.CoachAchievementService) *CoachAchievementController {
	return &CoachAchievementController{achievementService: s}
}

func (h *CoachAchievementController) ListAchievements(c *gin.Context) {
	coachUserID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	resp, err := h.achievementService.ListAchievements(c.Request.Context(), coachUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if resp.Items == nil {
		resp.Items = []service.CoachAchievementDTO{}
	}
	c.JSON(http.StatusOK, resp)
}

func (h *CoachAchievementController) CreateAchievement(c *gin.Context) {
	coachUserID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	var req service.CoachAchievementCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	resp, err := h.achievementService.CreateAchievement(c.Request.Context(), coachUserID, &req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidAchievementType), errors.Is(err, service.ErrAchievementTitleRequired):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *CoachAchievementController) UpdateAchievement(c *gin.Context) {
	coachUserID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	achievementID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid achievement id"})
		return
	}
	var req service.CoachAchievementUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	resp, err := h.achievementService.UpdateAchievement(c.Request.Context(), coachUserID, uint(achievementID), &req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrCoachAchievementForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		case errors.Is(err, service.ErrCoachAchievementNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "achievement not found"})
		case errors.Is(err, service.ErrInvalidAchievementType), errors.Is(err, service.ErrAchievementTitleRequired):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *CoachAchievementController) DeleteAchievement(c *gin.Context) {
	coachUserID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	achievementID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid achievement id"})
		return
	}
	if err := h.achievementService.DeleteAchievement(c.Request.Context(), coachUserID, uint(achievementID)); err != nil {
		switch {
		case errors.Is(err, service.ErrCoachAchievementForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		case errors.Is(err, service.ErrCoachAchievementNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "achievement not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "achievement deleted"})
}

func (h *CoachAchievementController) UploadImage(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	baseDir := config.GetUploadDir()
	if baseDir == "" {
		baseDir = "uploads"
	}
	dir := filepath.Join(baseDir, "coaches", fmt.Sprintf("%d", userID))
	if err := os.MkdirAll(dir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create upload dir"})
		return
	}

	ext := filepath.Ext(file.Filename)
	if ext == "" {
		ext = ".jpg"
	}
	name := fmt.Sprintf("achievement_%d%s", time.Now().UnixNano(), ext)
	fullPath := filepath.Join(dir, name)
	if err := c.SaveUploadedFile(file, fullPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	urlPath := "/" + filepath.ToSlash(filepath.Join("uploads", "coaches", fmt.Sprintf("%d", userID), name))
	c.JSON(http.StatusOK, gin.H{"url": urlPath})
}
