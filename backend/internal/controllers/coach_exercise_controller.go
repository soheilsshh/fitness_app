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
	cats, err := h.exerciseService.ListCategories(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"categories": cats})
}

func (h *CoachExerciseController) ListExercises(c *gin.Context) {
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

	resp, err := h.exerciseService.ListExercises(
		c.Request.Context(),
		page,
		pageSize,
		c.Query("query"),
		c.Query("category"),
		c.Query("bodyPart"),
		c.Query("equipment"),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *CoachExerciseController) GetExerciseByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	item, err := h.exerciseService.GetExerciseByID(c.Request.Context(), uint(id))
	if err != nil {
		if errors.Is(err, service.ErrExerciseNotFound) || errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "exercise not found"})
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

func exercisesDatasetDir() string {
	if dir := os.Getenv("EXERCISES_DATASET_DIR"); dir != "" {
		return dir
	}
	return "exercises-dataset-main"
}

func (h *CoachExerciseController) CreateExercise(c *gin.Context) {
	if _, err := middleware.GetUserID(c); err != nil {
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

		subDir := "images"
		if isAnimatedExerciseMedia(ext) {
			subDir = "videos"
		}

		dir := filepath.Join(exercisesDatasetDir(), subDir)
		if err := os.MkdirAll(dir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create media dir"})
			return
		}

		name := fmt.Sprintf("coach-%d%s", time.Now().UnixNano(), ext)
		fullPath := filepath.Join(dir, name)
		if err := c.SaveUploadedFile(file, fullPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Relative path like dataset seed (e.g. videos/coach-123.gif) → served at /exercises-media/videos/...
		relPath := filepath.ToSlash(filepath.Join(subDir, name))
		if isAnimatedExerciseMedia(ext) {
			req.GifPath = relPath
		} else {
			req.ImagePath = relPath
		}
	}

	item, err := h.exerciseService.CreateCoachExercise(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, item)
}
