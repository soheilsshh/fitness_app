package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/config"
	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type CoachProfileController struct {
	coachService service.CoachProfileService
}

func NewCoachProfileController(s service.CoachProfileService) *CoachProfileController {
	return &CoachProfileController{coachService: s}
}

func (h *CoachProfileController) GetProfile(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	dto, err := h.coachService.GetProfile(c.Request.Context(), userID)
	if err != nil {
		if err == service.ErrCoachProfileNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "coach profile not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto)
}

func (h *CoachProfileController) UpdateProfile(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	var req service.CoachProfileUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	dto, err := h.coachService.UpdateProfile(c.Request.Context(), userID, &req)
	if err != nil {
		switch err {
		case service.ErrSlugTaken, service.ErrInvalidSlug:
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		case service.ErrInvalidCoachNationalID, service.ErrCoachProfileIncomplete:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case service.ErrCoachProfileAlreadyReviewing:
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		case service.ErrCoachProfileNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, dto)
}

func (h *CoachProfileController) CheckSlug(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	slugParam := c.Query("slug")
	resp, err := h.coachService.CheckSlugAvailable(c.Request.Context(), slugParam, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *CoachProfileController) SubmitRequest(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	resp, err := h.coachService.SubmitProfileRequest(c.Request.Context(), userID)
	if err != nil {
		switch err {
		case service.ErrCoachProfileNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case service.ErrCoachProfileIncomplete,
			service.ErrCoachProfileAlreadyReviewing,
			service.ErrCoachProfileAlreadyApproved:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *CoachProfileController) UploadAvatar(c *gin.Context) {
	h.uploadImage(c, "avatar")
}

func (h *CoachProfileController) UploadCover(c *gin.Context) {
	h.uploadImage(c, "cover")
}

func (h *CoachProfileController) uploadImage(c *gin.Context, kind string) {
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
	name := fmt.Sprintf("%s_%d%s", kind, time.Now().UnixNano(), ext)
	fullPath := filepath.Join(dir, name)
	if err := c.SaveUploadedFile(file, fullPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	urlPath := "/" + filepath.ToSlash(filepath.Join("uploads", "coaches", fmt.Sprintf("%d", userID), name))

	var dto *service.CoachProfileDTO
	if kind == "avatar" {
		dto, err = h.coachService.UpdateAvatarURL(c.Request.Context(), userID, urlPath)
	} else {
		dto, err = h.coachService.UpdateCoverURL(c.Request.Context(), userID, urlPath)
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"url": urlPath, "profile": dto})
}
