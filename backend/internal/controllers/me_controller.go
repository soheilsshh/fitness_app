package controllers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type MeController struct {
	meService service.MeService
}

func NewMeController(meService service.MeService) *MeController {
	return &MeController{meService: meService}
}

// GetProfile godoc
// @Summary Get current user profile (user panel)
// @Description Returns profile with firstName, lastName, phone, heightCm, weightKg, photos, counts
// @Tags me
// @Produce json
// @Security BearerAuth
// @Success 200 {object} service.MeProfileDTO
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /me [get]
func (h *MeController) GetProfile(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	profile, err := h.meService.GetProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, profile)
}

// UpdateProfile godoc
// @Summary Update current user profile
// @Description Update firstName, lastName, heightCm, weightKg
// @Tags me
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body service.MeProfileUpdateRequest true "Profile update"
// @Success 200 {object} service.MeProfileDTO
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /me [patch]
func (h *MeController) UpdateProfile(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req service.MeProfileUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	profile, err := h.meService.UpdateProfile(c.Request.Context(), userID, &req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidProfileField) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, profile)
}

// UploadAvatar godoc
// @Summary Upload student profile avatar
// @Tags me
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param file formData file true "Avatar image"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /me/avatar [post]
func (h *MeController) UploadAvatar(c *gin.Context) {
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

	opened, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read file"})
		return
	}
	defer opened.Close()

	urlPath, err := h.meService.UploadAvatar(c.Request.Context(), userID, opened, file.Filename)
	if err != nil {
		if errors.Is(err, service.ErrInvalidPhotoType) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "فقط تصویر jpg، png یا webp مجاز است"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"avatarUrl": urlPath, "url": urlPath})
}

// UploadBodyPhoto godoc
// @Summary Upload onboarding body photo
// @Description Upload a body photo (front, right, back, left) for the current user
// @Tags me
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param file formData file true "Image file"
// @Param type formData string true "Photo type: front, right, back, left"
// @Success 201 {object} service.MePhotoDTO
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /me/body-photos [post]
func (h *MeController) UploadBodyPhoto(c *gin.Context) {
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

	photoType := strings.TrimSpace(c.PostForm("type"))
	if photoType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "type is required"})
		return
	}

	opened, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read file"})
		return
	}
	defer opened.Close()

	photo, err := h.meService.UploadBodyPhoto(c.Request.Context(), userID, opened, file.Filename, photoType)
	if err != nil {
		if errors.Is(err, service.ErrInvalidPhotoType) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "type must be front, right, back, or left"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, photo)
}

// ListMyOrders godoc
// @Summary List current user orders
// @Description Paginated list with optional status filter
// @Tags me
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page (default 1)"
// @Param pageSize query int false "Page size (default 10)"
// @Param status query string false "Filter: paid, pending, failed, refunded, or empty"
// @Success 200 {object} service.MeOrderListResponse
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /me/orders [get]
func (h *MeController) ListMyOrders(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	page := 1
	pageSize := 10
	if p := c.Query("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	if ps := c.Query("pageSize"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v > 0 && v <= 100 {
			pageSize = v
		}
	}
	status := c.Query("status")

	resp, err := h.meService.ListMyOrders(c.Request.Context(), userID, page, pageSize, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetMyOrderByID godoc
// @Summary Get order by ID (own orders only)
// @Tags me
// @Produce json
// @Security BearerAuth
// @Param id path int true "Order ID"
// @Success 200 {object} service.MeOrderDTO
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /me/orders/{id} [get]
func (h *MeController) GetMyOrderByID(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order id"})
		return
	}

	order, err := h.meService.GetMyOrderByID(c.Request.Context(), userID, uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}
	c.JSON(http.StatusOK, order)
}

// ListMyPrograms godoc
// @Summary List current user programs (subscriptions)
// @Tags me
// @Produce json
// @Security BearerAuth
// @Success 200 {object} service.MeProgramsResponse
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /me/programs [get]
func (h *MeController) ListMyPrograms(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	resp, err := h.meService.ListMyPrograms(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetMyProgramByID godoc
// @Summary Get program by ID (own programs only)
// @Tags me
// @Produce json
// @Security BearerAuth
// @Param id path int true "Program (subscription) ID"
// @Success 200 {object} service.MeProgramDetailDTO
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /me/programs/{id} [get]
func (h *MeController) GetMyProgramByID(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid program id"})
		return
	}

	program, err := h.meService.GetMyProgramByID(c.Request.Context(), userID, uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "program not found"})
		return
	}
	c.JSON(http.StatusOK, program)
}

// ListMyWorkoutPrograms godoc
// @Summary List every saved workout-program version (active + inactive pool) for the current subscription
// @Tags me
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string][]service.ProgramVersionDTO
// @Failure 401 {object} map[string]string
// @Router /me/workout-programs [get]
func (h *MeController) ListMyWorkoutPrograms(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	items, err := h.meService.ListMyWorkoutPrograms(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

// ListMyNutritionPrograms godoc
// @Summary List every saved nutrition-program version (active + inactive pool) for the current subscription
// @Tags me
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string][]service.ProgramVersionDTO
// @Failure 401 {object} map[string]string
// @Router /me/nutrition-programs [get]
func (h *MeController) ListMyNutritionPrograms(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	items, err := h.meService.ListMyNutritionPrograms(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *MeController) programIDParam(c *gin.Context) (userID, programID uint, ok bool) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return 0, 0, false
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid program id"})
		return 0, 0, false
	}
	return userID, uint(id), true
}

func (h *MeController) handleMeProgramActionError(c *gin.Context, err error) {
	if errors.Is(err, service.ErrMeProgramNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "برنامه پیدا نشد"})
		return
	}
	if errors.Is(err, service.ErrMeProgramNotApproved) {
		c.JSON(http.StatusConflict, gin.H{"error": "این برنامه هنوز توسط مربی تأیید نشده است"})
		return
	}
	c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
}

// ActivateWorkoutProgram godoc
// @Summary Activate a saved workout-program version (deactivates whatever else is currently active)
// @Tags me
// @Produce json
// @Security BearerAuth
// @Param id path int true "Workout program ID"
// @Success 200 {object} map[string]bool
// @Router /me/workout-programs/{id}/activate [post]
func (h *MeController) ActivateWorkoutProgram(c *gin.Context) {
	userID, programID, ok := h.programIDParam(c)
	if !ok {
		return
	}
	if err := h.meService.ActivateWorkoutProgram(c.Request.Context(), userID, programID); err != nil {
		h.handleMeProgramActionError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// DeactivateWorkoutProgram godoc
// @Summary Deactivate a workout-program version
// @Tags me
// @Produce json
// @Security BearerAuth
// @Param id path int true "Workout program ID"
// @Success 200 {object} map[string]bool
// @Router /me/workout-programs/{id}/deactivate [post]
func (h *MeController) DeactivateWorkoutProgram(c *gin.Context) {
	userID, programID, ok := h.programIDParam(c)
	if !ok {
		return
	}
	if err := h.meService.DeactivateWorkoutProgram(c.Request.Context(), userID, programID); err != nil {
		h.handleMeProgramActionError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// ActivateNutritionProgram godoc
// @Summary Activate a saved nutrition-program version (deactivates whatever else is currently active)
// @Tags me
// @Produce json
// @Security BearerAuth
// @Param id path int true "Nutrition program ID"
// @Success 200 {object} map[string]bool
// @Router /me/nutrition-programs/{id}/activate [post]
func (h *MeController) ActivateNutritionProgram(c *gin.Context) {
	userID, programID, ok := h.programIDParam(c)
	if !ok {
		return
	}
	if err := h.meService.ActivateNutritionProgram(c.Request.Context(), userID, programID); err != nil {
		h.handleMeProgramActionError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// DeactivateNutritionProgram godoc
// @Summary Deactivate a nutrition-program version
// @Tags me
// @Produce json
// @Security BearerAuth
// @Param id path int true "Nutrition program ID"
// @Success 200 {object} map[string]bool
// @Router /me/nutrition-programs/{id}/deactivate [post]
func (h *MeController) DeactivateNutritionProgram(c *gin.Context) {
	userID, programID, ok := h.programIDParam(c)
	if !ok {
		return
	}
	if err := h.meService.DeactivateNutritionProgram(c.Request.Context(), userID, programID); err != nil {
		h.handleMeProgramActionError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
