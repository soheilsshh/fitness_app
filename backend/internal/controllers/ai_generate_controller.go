package controllers

import (
	"errors"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type AIGenerateController struct {
	svc *service.AIGenerateService
}

func NewAIGenerateController(svc *service.AIGenerateService) *AIGenerateController {
	return &AIGenerateController{svc: svc}
}

type generateNutritionRequest struct {
	Goal string `json:"goal"` // cut | bulk | maintain, defaults to profile's primary goal
	Save *bool  `json:"save"` // defaults to true — set false for a preview-only call
}

// GenerateNutrition godoc
// @Summary Generate a structured nutrition plan and save it as the active program (roadmap BE-1.1/BE-1.2)
// @Tags me-ai
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body generateNutritionRequest false "Optional goal override / save flag"
// @Success 200 {object} service.NutritionPlanResult
// @Failure 401 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Failure 422 {object} map[string]string
// @Failure 429 {object} map[string]string
// @Failure 502 {object} map[string]string
// @Failure 503 {object} map[string]string
// @Router /me/nutrition/generate [post]
func (h *AIGenerateController) GenerateNutrition(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req generateNutritionRequest
	_ = c.ShouldBindJSON(&req) // body is optional
	save := true
	if req.Save != nil {
		save = *req.Save
	}

	result, err := h.svc.GenerateNutrition(c.Request.Context(), userID, req.Goal, save)
	if err != nil {
		writeAIGenerateError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

type suggestFromIngredientsRequest struct {
	Ingredients string `json:"ingredients"`
	CalorieMin  int    `json:"calorieMin"`
	CalorieMax  int    `json:"calorieMax"`
}

// SuggestFromIngredients godoc
// @Summary Suggest an improvised recipe from ingredients the user has (roadmap BE-1.9)
// @Tags me-ai
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body suggestFromIngredientsRequest true "Ingredients + optional calorie range"
// @Success 200 {object} ai.IngredientSuggestionSchema
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 422 {object} map[string]string
// @Failure 429 {object} map[string]string
// @Failure 502 {object} map[string]string
// @Failure 503 {object} map[string]string
// @Router /me/nutrition/suggest-from-ingredients [post]
func (h *AIGenerateController) SuggestFromIngredients(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req suggestFromIngredientsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	suggestion, err := h.svc.SuggestFromIngredients(c.Request.Context(), userID, req.Ingredients, req.CalorieMin, req.CalorieMax)
	if err != nil {
		writeAIGenerateError(c, err)
		return
	}
	c.JSON(http.StatusOK, suggestion)
}

type generateWorkoutRequest struct {
	Save *bool `json:"save"` // defaults to true — set false for a preview-only call

	// Optional per-request hints from the AI program wizard (not persisted to
	// the profile — only steer this one generation).
	Equipment      []string `json:"equipment"`
	DaysPerWeek    int      `json:"daysPerWeek"`
	SessionMinutes int      `json:"sessionMinutes"`
}

// GenerateWorkout godoc
// @Summary Generate a structured workout plan and save it as the active program (roadmap BE-3.3)
// @Tags me-ai
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body generateWorkoutRequest false "Optional save flag"
// @Success 200 {object} service.WorkoutPlanResult
// @Failure 401 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Failure 422 {object} map[string]string
// @Failure 429 {object} map[string]string
// @Failure 502 {object} map[string]string
// @Failure 503 {object} map[string]string
// @Router /me/workout/generate [post]
func (h *AIGenerateController) GenerateWorkout(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req generateWorkoutRequest
	_ = c.ShouldBindJSON(&req) // body is optional
	save := true
	if req.Save != nil {
		save = *req.Save
	}

	constraints := service.WorkoutConstraints{
		Equipment:      req.Equipment,
		DaysPerWeek:    req.DaysPerWeek,
		SessionMinutes: req.SessionMinutes,
	}
	result, err := h.svc.GenerateWorkout(c.Request.Context(), userID, save, constraints)
	if err != nil {
		writeAIGenerateError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

// SuggestSetLogFromVoice godoc
// @Summary Transcribe a voice note and suggest a workout set entry (roadmap BE-3.5, preview only — not saved)
// @Tags me-ai
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param file formData file true "Voice note (audio)"
// @Success 200 {object} ai.SetLogSchema
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 422 {object} map[string]string
// @Failure 429 {object} map[string]string
// @Failure 502 {object} map[string]string
// @Failure 503 {object} map[string]string
// @Router /me/workout/sessions/voice [post]
func (h *AIGenerateController) SuggestSetLogFromVoice(c *gin.Context) {
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

	log, err := h.svc.SuggestSetLogFromVoice(c.Request.Context(), userID, fileHeader.Filename, data)
	if err != nil {
		writeAIGenerateError(c, err)
		return
	}
	c.JSON(http.StatusOK, log)
}

const maxVoiceUploadBytes = 15 << 20 // 15MB, generous for a short voice note

// SuggestFoodLogFromVoice godoc
// @Summary Transcribe a voice note and suggest food-log items (roadmap BE-2.3/2.4, preview only — not saved)
// @Tags me-ai
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param file formData file true "Voice note (audio)"
// @Success 200 {object} ai.FoodLogSchema
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 422 {object} map[string]string
// @Failure 429 {object} map[string]string
// @Failure 502 {object} map[string]string
// @Failure 503 {object} map[string]string
// @Router /me/food-logs/voice [post]
func (h *AIGenerateController) SuggestFoodLogFromVoice(c *gin.Context) {
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

	log, err := h.svc.SuggestFoodLogFromVoice(c.Request.Context(), userID, fileHeader.Filename, data)
	if err != nil {
		writeAIGenerateError(c, err)
		return
	}
	c.JSON(http.StatusOK, log)
}

func writeAIGenerateError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrAIInvalidPlan):
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "برنامه تولیدشده معتبر نیست: " + err.Error()})
	case errors.Is(err, service.ErrAIInvalidInput):
		c.JSON(http.StatusBadRequest, gin.H{"error": "ورودی نامعتبر است"})
	case errors.Is(err, service.ErrAINoActiveSubscription):
		c.JSON(http.StatusConflict, gin.H{"error": "برای ذخیره برنامه، ابتدا باید اشتراک فعال با یک مربی داشته باشید"})
	case errors.Is(err, service.ErrAIRateLimited):
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "لطفاً کمی صبر کنید و دوباره تلاش کنید"})
	case errors.Is(err, service.ErrAINotConfigured):
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "دستیار هوشمند فعلاً پیکربندی نشده است"})
	case errors.Is(err, service.ErrAIUpstream):
		c.JSON(http.StatusBadGateway, gin.H{"error": "ارتباط با سرویس هوش مصنوعی برقرار نشد"})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطای داخلی تولید برنامه"})
	}
}
