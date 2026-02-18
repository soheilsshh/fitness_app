package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type StudentController struct {
	studentService service.StudentService
}

func NewStudentController(studentService service.StudentService) *StudentController {
	return &StudentController{studentService: studentService}
}

// DTOs

type studentMeResponse struct {
	ID        uint      `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type planSummary struct {
	ID           uint   `json:"id"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	PriceCents   int64  `json:"price_cents"`
	DurationDays int    `json:"duration_days"`
	Type         string `json:"type"`
	IsActive     bool   `json:"is_active"`
}

type subscriptionResponse struct {
	ID                  uint       `json:"id"`
	StartsAt            time.Time  `json:"starts_at"`
	EndsAt              *time.Time `json:"ends_at,omitempty"`
	LastCheckInDate     *time.Time `json:"last_checkin_date,omitempty"`
	NextCheckInDueDate  *time.Time `json:"next_checkin_due_date,omitempty"`
	CheckinFrequencyDays int       `json:"checkin_frequency_days"`
	Plan                planSummary `json:"plan"`
}

type currentSubscriptionResponse struct {
	ActiveSubscription *subscriptionResponse `json:"active_subscription"`
	Message            string                `json:"message,omitempty"`
}

type subscriptionsListResponse struct {
	Subscriptions []subscriptionResponse `json:"subscriptions"`
	Page          int                    `json:"page"`
	Limit         int                    `json:"limit"`
}

type workoutItemResponse struct {
	ID         uint   `json:"id"`
	WeekNumber int    `json:"week_number"`
	DayNumber  int    `json:"day_number"`
	OrderIndex int    `json:"order_index"`
	Exercise   string `json:"exercise"`
	Sets       int    `json:"sets"`
	Reps       string `json:"reps"`
	RestTime   string `json:"rest_time"`
	Tempo      string `json:"tempo"`
	Notes      string `json:"notes"`
}

type workoutProgramResponse struct {
	ID            uint                   `json:"id"`
	Title         string                 `json:"title"`
	Version       int                    `json:"version"`
	DurationWeeks int                    `json:"duration_weeks"`
	LastUpdatedAt time.Time              `json:"last_updated_at"`
	Items         []workoutItemResponse  `json:"items"`
}

type nutritionItemResponse struct {
	ID         uint    `json:"id"`
	DayNumber  int     `json:"day_number"`
	MealNumber int     `json:"meal_number"`
	OrderIndex int     `json:"order_index"`
	Food       string  `json:"food"`
	Quantity   string  `json:"quantity"`
	Calories   int     `json:"calories"`
	Protein    float64 `json:"protein"`
	Carbs      float64 `json:"carbs"`
	Fat        float64 `json:"fat"`
	Notes      string  `json:"notes"`
}

type nutritionProgramResponse struct {
	ID            uint                    `json:"id"`
	Title         string                  `json:"title"`
	Version       int                     `json:"version"`
	DurationWeeks int                     `json:"duration_weeks"`
	LastUpdatedAt time.Time               `json:"last_updated_at"`
	Items         []nutritionItemResponse `json:"items"`
}

type currentProgramsResponse struct {
	WorkoutProgram   *workoutProgramResponse   `json:"workout_program,omitempty"`
	NutritionProgram *nutritionProgramResponse `json:"nutrition_program,omitempty"`
	Message          string                    `json:"message,omitempty"`
}

// Handlers

// GetMe returns basic profile of the currently authenticated student.
func (h *StudentController) GetMe(c *gin.Context) {
	userIDVal, exists := c.Get(middleware.ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID, ok := userIDVal.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user id in context"})
		return
	}

	user, err := h.studentService.GetMe(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := studentMeResponse{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Phone:     user.Phone,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
	}

	c.JSON(http.StatusOK, resp)
}

// GetCurrentSubscription returns the active subscription (if any) for the student.
func (h *StudentController) GetCurrentSubscription(c *gin.Context) {
	userIDVal, exists := c.Get(middleware.ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID, ok := userIDVal.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user id in context"})
		return
	}

	data, err := h.studentService.GetCurrentSubscription(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if data == nil {
		c.JSON(http.StatusOK, currentSubscriptionResponse{
			ActiveSubscription: nil,
			Message:            "هیچ پلن فعالی ندارید",
		})
		return
	}

	sub := data.Subscription
	plan := data.Plan

	respSub := &subscriptionResponse{
		ID:                   sub.ID,
		StartsAt:             sub.StartsAt,
		EndsAt:               sub.EndsAt,
		LastCheckInDate:      sub.LastCheckInDate,
		NextCheckInDueDate:   sub.NextCheckInDueDate,
		CheckinFrequencyDays: sub.CheckinFrequencyDays,
		Plan: planSummary{
			ID:           plan.ID,
			Name:         plan.Name,
			Description:  plan.Description,
			PriceCents:   plan.PriceCents,
			DurationDays: plan.DurationDays,
			Type:         plan.Type,
			IsActive:     plan.IsActive,
		},
	}

	c.JSON(http.StatusOK, currentSubscriptionResponse{
		ActiveSubscription: respSub,
	})
}

// ListSubscriptions returns paginated subscription history for the student.
func (h *StudentController) ListSubscriptions(c *gin.Context) {
	userIDVal, exists := c.Get(middleware.ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID, ok := userIDVal.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user id in context"})
		return
	}

	page := 1
	limit := 10
	if pStr := c.Query("page"); pStr != "" {
		if p, err := strconv.Atoi(pStr); err == nil && p > 0 {
			page = p
		}
	}
	if lStr := c.Query("limit"); lStr != "" {
		if l, err := strconv.Atoi(lStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	data, err := h.studentService.ListSubscriptions(c.Request.Context(), userID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	subs := make([]subscriptionResponse, 0, len(data))
	for _, item := range data {
		sub := item.Subscription
		plan := item.Plan
		subs = append(subs, subscriptionResponse{
			ID:                   sub.ID,
			StartsAt:             sub.StartsAt,
			EndsAt:               sub.EndsAt,
			LastCheckInDate:      sub.LastCheckInDate,
			NextCheckInDueDate:   sub.NextCheckInDueDate,
			CheckinFrequencyDays: sub.CheckinFrequencyDays,
			Plan: planSummary{
				ID:           plan.ID,
				Name:         plan.Name,
				Description:  plan.Description,
				PriceCents:   plan.PriceCents,
				DurationDays: plan.DurationDays,
				Type:         plan.Type,
				IsActive:     plan.IsActive,
			},
		})
	}

	c.JSON(http.StatusOK, subscriptionsListResponse{
		Subscriptions: subs,
		Page:          page,
		Limit:         limit,
	})
}

// GetCurrentPrograms returns the current workout and nutrition programs (if any) for the active subscription.
func (h *StudentController) GetCurrentPrograms(c *gin.Context) {
	userIDVal, exists := c.Get(middleware.ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID, ok := userIDVal.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user id in context"})
		return
	}

	data, err := h.studentService.GetCurrentPrograms(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := currentProgramsResponse{}

	if data.Workout != nil && data.Workout.Program != nil {
		wp := data.Workout.Program
		items := make([]workoutItemResponse, 0, len(data.Workout.Items))
		for _, it := range data.Workout.Items {
			items = append(items, workoutItemResponse{
				ID:         it.ID,
				WeekNumber: it.WeekNumber,
				DayNumber:  it.DayNumber,
				OrderIndex: it.OrderIndex,
				Exercise:   it.Exercise,
				Sets:       it.Sets,
				Reps:       it.Reps,
				RestTime:   it.RestTime,
				Tempo:      it.Tempo,
				Notes:      it.Notes,
			})
		}
		resp.WorkoutProgram = &workoutProgramResponse{
			ID:            wp.ID,
			Title:         wp.Title,
			Version:       wp.Version,
			DurationWeeks: wp.DurationWeeks,
			LastUpdatedAt: wp.LastUpdatedAt,
			Items:         items,
		}
	}

	if data.Nutrition != nil && data.Nutrition.Program != nil {
		np := data.Nutrition.Program
		items := make([]nutritionItemResponse, 0, len(data.Nutrition.Items))
		for _, it := range data.Nutrition.Items {
			items = append(items, nutritionItemResponse{
				ID:         it.ID,
				DayNumber:  it.DayNumber,
				MealNumber: it.MealNumber,
				OrderIndex: it.OrderIndex,
				Food:       it.Food,
				Quantity:   it.Quantity,
				Calories:   it.Calories,
				Protein:    it.Protein,
				Carbs:      it.Carbs,
				Fat:        it.Fat,
				Notes:      it.Notes,
			})
		}
		resp.NutritionProgram = &nutritionProgramResponse{
			ID:            np.ID,
			Title:         np.Title,
			Version:       np.Version,
			DurationWeeks: np.DurationWeeks,
			LastUpdatedAt: np.LastUpdatedAt,
			Items:         items,
		}
	}

	if resp.WorkoutProgram == nil && resp.NutritionProgram == nil {
		resp.Message = "هیچ برنامه فعالی برای شما ثبت نشده است"
	}

	c.JSON(http.StatusOK, resp)
}

