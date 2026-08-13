package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var (
	ErrFoodLogNotFound           = errors.New("food log not found")
	ErrFoodLogInvalidDate        = errors.New("invalid log date")
	ErrFoodLogNameRequired       = errors.New("foodName is required for manual entries")
	ErrFoodLogFoodNotFound       = errors.New("food not found in catalog")
	ErrFoodLogEntryRequired      = errors.New("either foodId or foodName is required")
	ErrFoodLogServingUnitInvalid = errors.New("servingUnitId does not belong to the requested food")
)

type CreateFoodLogRequest struct {
	LogDate    string  `json:"logDate"`
	FoodID     *uint   `json:"foodId,omitempty"`
	FoodName   string  `json:"foodName"`
	Quantity   string  `json:"quantity"`
	MealType   string  `json:"mealType,omitempty"`
	Multiplier float64 `json:"multiplier,omitempty"`
	Calories   float64 `json:"calories,omitempty"`
	Protein    float64 `json:"protein,omitempty"`
	Carbs      float64 `json:"carbs,omitempty"`
	Fat        float64 `json:"fat,omitempty"`

	// Serving-picker path (spoon/gram/cup) — takes priority over Multiplier
	// when FoodID is set. Either send Grams directly, or ServingUnitID +
	// ServingQty (e.g. 2 × "قاشق غذاخوری") and the server resolves grams.
	Grams         *float64 `json:"grams,omitempty"`
	ServingUnitID *uint    `json:"servingUnitId,omitempty"`
	ServingQty    *float64 `json:"servingQty,omitempty"`
}

type DailyFoodLogDTO struct {
	ID        uint    `json:"id"`
	LogDate   string  `json:"logDate"`
	FoodID    *uint   `json:"foodId,omitempty"`
	FoodName  string  `json:"foodName"`
	Quantity  string  `json:"quantity"`
	MealType  string  `json:"mealType,omitempty"`
	Calories  float64 `json:"calories"`
	Protein   float64 `json:"protein"`
	Carbs     float64 `json:"carbs"`
	Fat       float64 `json:"fat"`
	CreatedAt string  `json:"createdAt"`
}

type DailyMacroTotals struct {
	Calories float64 `json:"calories"`
	Protein  float64 `json:"protein"`
	Carbs    float64 `json:"carbs"`
	Fat      float64 `json:"fat"`
}

type DailyFoodLogListResponse struct {
	Date   string            `json:"date"`
	Items  []DailyFoodLogDTO `json:"items"`
	Totals DailyMacroTotals  `json:"totals"`
}

type DailyFoodLogService interface {
	CreateLog(ctx context.Context, userID uint, req *CreateFoodLogRequest) (*DailyFoodLogDTO, error)
	ListByDate(ctx context.Context, userID uint, dateStr string) (*DailyFoodLogListResponse, error)
	DeleteLog(ctx context.Context, userID uint, logID uint) error
}

type dailyFoodLogService struct {
	logRepo        repository.DailyFoodLogRepository
	foodRepo       repository.FoodRepository
	achievementSvc AchievementService
}

func NewDailyFoodLogService(
	logRepo repository.DailyFoodLogRepository,
	foodRepo repository.FoodRepository,
	achievementSvc AchievementService,
) DailyFoodLogService {
	return &dailyFoodLogService{
		logRepo:        logRepo,
		foodRepo:       foodRepo,
		achievementSvc: achievementSvc,
	}
}

func (s *dailyFoodLogService) CreateLog(ctx context.Context, userID uint, req *CreateFoodLogRequest) (*DailyFoodLogDTO, error) {
	if req == nil {
		return nil, ErrFoodLogEntryRequired
	}

	logDate, err := parseFoodLogDate(req.LogDate)
	if err != nil {
		return nil, ErrFoodLogInvalidDate
	}

	log := &models.DailyFoodLog{
		UserID:   userID,
		LogDate:  logDate,
		MealType: normalizeMealType(req.MealType),
	}

	if req.FoodID != nil && *req.FoodID > 0 {
		food, err := s.foodRepo.FindByID(ctx, *req.FoodID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, ErrFoodLogFoodNotFound
			}
			return nil, err
		}

		base := MeMealDTO{
			Title:  strings.TrimSpace(req.FoodName),
			Detail: strings.TrimSpace(req.Quantity),
		}

		var meal MeMealDTO
		if grams, ok, err := s.resolveGrams(ctx, food, req); err != nil {
			return nil, err
		} else if ok {
			meal = foodModelToMealDTOByGrams(food, grams, base)
		} else {
			meal = foodModelToMealDTO(food, mealMultiplier(req.Multiplier), base)
		}

		log.FoodID = req.FoodID
		log.FoodName = meal.Title
		if log.FoodName == "" {
			log.FoodName = food.Name
		}
		log.Quantity = meal.Detail
		if log.Quantity == "" {
			log.Quantity = formatFoodQuantity(meal.Amount, meal.Unit)
		}
		log.Calories = meal.Calories
		log.Protein = meal.Protein
		log.Carbs = meal.Carbs
		log.Fat = meal.Fat
	} else {
		name := strings.TrimSpace(req.FoodName)
		if name == "" {
			return nil, ErrFoodLogNameRequired
		}
		log.FoodName = name
		log.Quantity = strings.TrimSpace(req.Quantity)
		log.Calories = req.Calories
		log.Protein = req.Protein
		log.Carbs = req.Carbs
		log.Fat = req.Fat
	}

	if err := s.logRepo.Create(ctx, log); err != nil {
		return nil, err
	}
	if s.achievementSvc != nil {
		s.achievementSvc.HandleFoodLogCreated(ctx, userID)
	}

	dto := dailyFoodLogToDTO(*log)
	return &dto, nil
}

// resolveGrams turns the serving-picker part of a request into a gram
// amount: either Grams directly, or ServingUnitID (validated against this
// food) times ServingQty. ok=false means neither was provided, so the
// caller should fall back to the legacy Multiplier path.
func (s *dailyFoodLogService) resolveGrams(ctx context.Context, food *models.Food, req *CreateFoodLogRequest) (float64, bool, error) {
	if req.Grams != nil && *req.Grams > 0 {
		return *req.Grams, true, nil
	}
	if req.ServingUnitID == nil {
		return 0, false, nil
	}

	unit, err := s.foodRepo.FindServingUnitByID(ctx, *req.ServingUnitID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, false, ErrFoodLogServingUnitInvalid
		}
		return 0, false, err
	}
	if unit.FoodID != food.ID {
		return 0, false, ErrFoodLogServingUnitInvalid
	}

	qty := 1.0
	if req.ServingQty != nil && *req.ServingQty > 0 {
		qty = *req.ServingQty
	}
	return unit.GramsPerUnit * qty, true, nil
}

func (s *dailyFoodLogService) ListByDate(ctx context.Context, userID uint, dateStr string) (*DailyFoodLogListResponse, error) {
	logDate, err := parseFoodLogDate(dateStr)
	if err != nil {
		return nil, ErrFoodLogInvalidDate
	}

	list, err := s.logRepo.FindByUserIDAndDate(ctx, userID, logDate)
	if err != nil {
		return nil, err
	}

	items := make([]DailyFoodLogDTO, 0, len(list))
	totals := DailyMacroTotals{}
	for _, row := range list {
		dto := dailyFoodLogToDTO(row)
		items = append(items, dto)
		totals.Calories += dto.Calories
		totals.Protein += dto.Protein
		totals.Carbs += dto.Carbs
		totals.Fat += dto.Fat
	}

	return &DailyFoodLogListResponse{
		Date:   formatFoodLogDate(logDate),
		Items:  items,
		Totals: totals,
	}, nil
}

func (s *dailyFoodLogService) DeleteLog(ctx context.Context, userID uint, logID uint) error {
	if logID == 0 {
		return ErrFoodLogNotFound
	}
	err := s.logRepo.Delete(ctx, logID, userID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrFoodLogNotFound
	}
	return err
}

func parseFoodLogDate(raw string) (time.Time, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return normalizeFoodLogDate(time.Now()), nil
	}
	t, err := time.ParseInLocation("2006-01-02", trimmed, time.Local)
	if err != nil {
		return time.Time{}, fmt.Errorf("%w: expected YYYY-MM-DD", ErrFoodLogInvalidDate)
	}
	return normalizeFoodLogDate(t), nil
}

func normalizeFoodLogDate(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.Local)
}

func formatFoodLogDate(t time.Time) string {
	return normalizeFoodLogDate(t).Format("2006-01-02")
}

func dailyFoodLogToDTO(log models.DailyFoodLog) DailyFoodLogDTO {
	dto := DailyFoodLogDTO{
		ID:        log.ID,
		LogDate:   formatFoodLogDate(log.LogDate),
		FoodName:  log.FoodName,
		Quantity:  log.Quantity,
		MealType:  log.MealType,
		Calories:  log.Calories,
		Protein:   log.Protein,
		Carbs:     log.Carbs,
		Fat:       log.Fat,
		CreatedAt: log.CreatedAt.Format(time.RFC3339),
	}
	if log.FoodID != nil && *log.FoodID > 0 {
		id := *log.FoodID
		dto.FoodID = &id
	}
	return dto
}

func normalizeMealType(raw string) string {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "breakfast", "lunch", "dinner", "snack":
		return strings.ToLower(strings.TrimSpace(raw))
	default:
		return ""
	}
}
