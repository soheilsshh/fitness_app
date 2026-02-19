package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type SiteSettingsController struct {
	siteService service.SiteSettingsService
}

func NewSiteSettingsController(s service.SiteSettingsService) *SiteSettingsController {
	return &SiteSettingsController{siteService: s}
}

// GetSiteSettingsPublic godoc
// @Summary Get site settings (public)
// @Description Returns hero, featureBullets, stats, steps, contactInfo for landing page
// @Tags site
// @Produce json
// @Success 200 {object} service.SiteSettingsDTO
// @Failure 500 {object} map[string]string
// @Router /site-settings [get]
func (h *SiteSettingsController) GetSiteSettingsPublic(c *gin.Context) {
	dto, err := h.siteService.Get(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto)
}

// GetSiteSettingsAdmin godoc
// @Summary Get site settings (admin)
// @Description Same as public GET, for admin edit form
// @Tags admin-site
// @Produce json
// @Success 200 {object} service.SiteSettingsDTO
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/site-settings [get]
// @Security BearerAuth
func (h *SiteSettingsController) GetSiteSettingsAdmin(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)
	dto, err := h.siteService.Get(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto)
}

// UpdateSiteSettings godoc
// @Summary Update site settings (admin)
// @Description PUT body: same structure as GET (featureBullets, stats, steps, contactInfo, heroImage.url)
// @Tags admin-site
// @Accept json
// @Produce json
// @Param body body service.SiteSettingsDTO true "Site settings"
// @Success 200 {object} service.SiteSettingsDTO
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/site-settings [put]
// @Security BearerAuth
func (h *SiteSettingsController) UpdateSiteSettings(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)
	var dto service.SiteSettingsDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if err := h.siteService.Update(c.Request.Context(), &dto); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// return updated
	updated, _ := h.siteService.Get(c.Request.Context())
	c.JSON(http.StatusOK, updated)
}

// UploadHeroImage godoc
// @Summary Upload hero image for site
// @Description Accepts multipart form file, saves to uploads/site/, returns URL for use in site settings
// @Tags admin-site
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "Image file"
// @Success 200 {object} map[string]string "url: /uploads/site/..."
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/site-settings/hero-image [post]
// @Security BearerAuth
func (h *SiteSettingsController) UploadHeroImage(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	baseDir := os.Getenv("UPLOAD_DIR")
	if baseDir == "" {
		baseDir = "uploads"
	}
	dir := filepath.Join(baseDir, "site")
	if err := os.MkdirAll(dir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create upload dir"})
		return
	}
	ext := filepath.Ext(file.Filename)
	if ext == "" {
		ext = ".jpg"
	}
	name := fmt.Sprintf("hero_%d%s", time.Now().UnixNano(), ext)
	fullPath := filepath.Join(dir, name)
	if err := c.SaveUploadedFile(file, fullPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	urlPath := "/" + filepath.ToSlash(filepath.Join("uploads", "site", name))
	c.JSON(http.StatusOK, gin.H{"url": urlPath})
}
