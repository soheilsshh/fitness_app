package controllers

import (
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
	"github.com/yourusername/fitness-management/internal/service/ai"
)

type AIGenerateController struct {
	svc *service.AIGenerateService
}

func NewAIGenerateController(svc *service.AIGenerateService) *AIGenerateController {
	return &AIGenerateController{svc: svc}
}

type generateNutritionRequest struct {
	Goal string                  `json:"goal"` // cut | bulk | maintain, defaults to profile's primary goal
	Save *bool                   `json:"save"` // defaults to true — set false for a preview-only call
	Plan *ai.NutritionPlanSchema `json:"plan"` // optional — save the previewed plan without re-calling AI
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

	result, err := h.svc.GenerateNutrition(c.Request.Context(), userID, req.Goal, save, req.Plan)
	if err != nil {
		writeAIGenerateError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

type regenerateMealRequest struct {
	Goal           string `json:"goal"`
	MealName       string `json:"mealName"`
	TargetCalories int    `json:"targetCalories"`
	Reason         string `json:"reason"`
}

// RegenerateMeal godoc
// @Summary Regenerate a single meal of a daily/weekly plan ("تغییر این وعده") without regenerating the whole plan
// @Tags me-ai
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body regenerateMealRequest true "Meal name + reason for the change"
// @Success 200 {object} ai.MealSchema
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 422 {object} map[string]string
// @Failure 429 {object} map[string]string
// @Failure 502 {object} map[string]string
// @Failure 503 {object} map[string]string
// @Router /me/nutrition/regenerate-meal [post]
func (h *AIGenerateController) RegenerateMeal(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req regenerateMealRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	meal, err := h.svc.RegenerateMeal(c.Request.Context(), userID, req.Goal, req.MealName, req.TargetCalories, req.Reason)
	if err != nil {
		writeAIGenerateError(c, err)
		return
	}
	c.JSON(http.StatusOK, meal)
}

type generateWeeklyNutritionRequest struct {
	Goal string                `json:"goal"`
	Save *bool                 `json:"save"`
	Plan *ai.NutritionWeekSchema `json:"plan"`
}

// GenerateWeeklyNutrition godoc
// @Summary Generate a structured 7-day nutrition plan and save it as a draft in the student's program pool (roadmap Phase 3)
// @Tags me-ai
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body generateWeeklyNutritionRequest false "Optional goal override / save flag"
// @Success 200 {object} service.NutritionWeekResult
// @Failure 401 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Failure 422 {object} map[string]string
// @Failure 429 {object} map[string]string
// @Failure 502 {object} map[string]string
// @Failure 503 {object} map[string]string
// @Router /me/nutrition/generate-week [post]
func (h *AIGenerateController) GenerateWeeklyNutrition(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req generateWeeklyNutritionRequest
	_ = c.ShouldBindJSON(&req)
	save := true
	if req.Save != nil {
		save = *req.Save
	}

	result, err := h.svc.GenerateWeeklyNutrition(c.Request.Context(), userID, req.Goal, save, req.Plan)
	if err != nil {
		writeAIGenerateError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

type suggestFromIngredientsRequest struct {
	Ingredients string `json:"ingredients"`
	Goal        string `json:"goal"`        // e.g. کاهش وزن | عضله‌سازی | حفظ وزن — optional
	Preferences string `json:"preferences"` // free-text restrictions/likes/dislikes — optional
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

	suggestion, err := h.svc.SuggestFromIngredients(c.Request.Context(), userID, req.Ingredients, req.Goal, req.Preferences, req.CalorieMin, req.CalorieMax)
	if err != nil {
		writeAIGenerateError(c, err)
		return
	}
	c.JSON(http.StatusOK, suggestion)
}

type generateWorkoutRequest struct {
	Save *bool `json:"save"` // defaults to true — set false for a preview-only call
	Plan *ai.WorkoutPlanSchema `json:"plan"` // optional — save the previewed plan without re-calling AI

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
	result, err := h.svc.GenerateWorkout(c.Request.Context(), userID, save, constraints, req.Plan)
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

type transcribeResponse struct {
	Text string `json:"text"`
}

// TranscribeVoice godoc
// @Summary Transcribe a voice note to raw Persian text only (no structured extraction)
// @Tags me-ai
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param file formData file true "Voice note (audio)"
// @Success 200 {object} transcribeResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 422 {object} map[string]string
// @Failure 429 {object} map[string]string
// @Failure 502 {object} map[string]string
// @Failure 503 {object} map[string]string
// @Router /me/ai/transcribe [post]
func (h *AIGenerateController) TranscribeVoice(c *gin.Context) {
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

	text, err := h.svc.TranscribeOnly(c.Request.Context(), userID, fileHeader.Filename, data)
	if err != nil {
		writeAIGenerateError(c, err)
		return
	}
	c.JSON(http.StatusOK, transcribeResponse{Text: text})
}

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

// AdminUsageSummary godoc
// @Summary Aggregated AI token/cost usage by request type + prompt version (roadmap Phase 5)
// @Tags admin-ai
// @Produce json
// @Security BearerAuth
// @Param days query int false "Lookback window in days (default 30)"
// @Success 200 {object} map[string]interface{}
// @Router /admin/ai/usage [get]
func (h *AIGenerateController) AdminUsageSummary(c *gin.Context) {
	days, _ := strconv.Atoi(c.Query("days"))
	rows, err := h.svc.UsageSummary(c.Request.Context(), days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت آمار مصرف AI"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": rows})
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
		msg := "ارتباط با سرویس هوش مصنوعی برقرار نشد"
		if strings.Contains(err.Error(), "unmarshal") || strings.Contains(err.Error(), "تبدیل جواب") {
			msg = "پاسخ AI ناقص بود — دوباره تلاش کنید"
		}
		c.JSON(http.StatusBadGateway, gin.H{"error": msg})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطای داخلی تولید برنامه"})
	}
}
