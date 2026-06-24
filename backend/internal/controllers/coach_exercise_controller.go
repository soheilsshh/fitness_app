package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/config"
	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type CoachExerciseController struct {
	exerciseService service.AdminExerciseService
}

func NewCoachExerciseController(s service.AdminExerciseService) *CoachExerciseController {
	return &CoachExerciseController{exerciseService: s}
}

func (h *CoachExerciseController) ListCategories(c *gin.Context) {
	coachID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	source := c.DefaultQuery("source", "all")
	cats, err := h.exerciseService.ListCoachCategories(c.Request.Context(), coachID, source)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"categories": cats})
}

func (h *CoachExerciseController) ListExercises(c *gin.Context) {
	coachID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

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

	source := c.DefaultQuery("source", "all")

	resp, err := h.exerciseService.ListCoachExercises(
		c.Request.Context(),
		coachID,
		page,
		pageSize,
		c.Query("query"),
		c.Query("category"),
		c.Query("bodyPart"),
		c.Query("equipment"),
		source,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *CoachExerciseController) GetExerciseByID(c *gin.Context) {
	coachID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	item, err := h.exerciseService.GetCoachExerciseByID(c.Request.Context(), coachID, uint(id))
	if err != nil {
		if errors.Is(err, service.ErrExerciseNotFound) || errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "exercise not found"})
			return
		}
		if errors.Is(err, service.ErrExerciseForbidden) {
			c.JSON(http.StatusForbidden, gin.H{"error": "exercise not accessible"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, item)
}

var allowedExerciseMediaExts = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".webp": true,
	".gif": true, ".mp4": true, ".webm": true, ".mov": true,
}

func isAnimatedExerciseMedia(ext string) bool {
	switch strings.ToLower(ext) {
	case ".gif", ".mp4", ".webm", ".mov":
		return true
	default:
		return false
	}
}

func coachExerciseUploadDir(coachID uint) string {
	baseDir := config.GetUploadDir()
	if baseDir == "" {
		baseDir = "uploads"
	}
	return filepath.Join(baseDir, "coaches", fmt.Sprintf("%d", coachID), "exercises")
}

func (h *CoachExerciseController) CreateExercise(c *gin.Context) {
	coachID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	req := service.CoachExerciseCreateRequest{
		Name:        c.PostForm("name"),
		Category:    c.PostForm("category"),
		BodyPart:    c.PostForm("bodyPart"),
		Equipment:   c.PostForm("equipment"),
		Target:      c.PostForm("target"),
		Description: c.PostForm("description"),
	}

	file, fileErr := c.FormFile("media")
	if fileErr == nil && file != nil {
		ext := strings.ToLower(filepath.Ext(file.Filename))
		if ext == "" {
			ext = ".jpg"
		}
		if !allowedExerciseMediaExts[ext] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported media type"})
			return
		}

		dir := coachExerciseUploadDir(coachID)
		if err := os.MkdirAll(dir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create media dir"})
			return
		}

		name := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
		fullPath := filepath.Join(dir, name)
		if err := c.SaveUploadedFile(file, fullPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		urlPath := "/" + filepath.ToSlash(filepath.Join("uploads", "coaches", fmt.Sprintf("%d", coachID), "exercises", name))
		if isAnimatedExerciseMedia(ext) {
			req.GifPath = urlPath
		} else {
			req.ImagePath = urlPath
		}
	}

	item, err := h.exerciseService.CreateCoachExercise(c.Request.Context(), coachID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, item)
}
