package service

import (
	"context"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

type CoachFoodItem struct {
	ID       uint     `json:"id"`
	Name     string   `json:"name"`
	Unit     string   `json:"unit"`
	Amount   float64  `json:"amount"`
	Calories float64  `json:"calories"`
	Fat      float64  `json:"fat"`
	Protein  float64  `json:"protein"`
	Carbs    float64  `json:"carbs"`
	Fiber    *float64 `json:"fiber,omitempty"`
	Sugar    *float64 `json:"sugar,omitempty"`

	// Extended per-100g nutrition panel — null until USDA-enriched, never a
	// guessed value (see cmd/enrichfoods).
	Sodium       *float64 `json:"sodium,omitempty"`
	Cholesterol  *float64 `json:"cholesterol,omitempty"`
	Calcium      *float64 `json:"calcium,omitempty"`
	Iron         *float64 `json:"iron,omitempty"`
	Magnesium    *float64 `json:"magnesium,omitempty"`
	Potassium    *float64 `json:"potassium,omitempty"`
	Phosphorus   *float64 `json:"phosphorus,omitempty"`
	TransFat     *float64 `json:"transFat,omitempty"`
	SaturatedFat *float64 `json:"saturatedFat,omitempty"`

	// The spoon/gram/cup picker — always includes a 1g "گرم" entry.
	ServingUnits []CoachFoodServingUnit `json:"servingUnits"`
}

type CoachFoodServingUnit struct {
	ID           uint    `json:"id"`
	Label        string  `json:"label"`
	GramsPerUnit float64 `json:"gramsPerUnit"`
	IsDefault    bool    `json:"isDefault"`
}

type CoachFoodListResponse struct {
	Items []CoachFoodItem `json:"items"`
	Page  int             `json:"page"`
	Limit int             `json:"limit"`
	Total int64           `json:"total"`
}

type CoachFoodService interface {
	ListFoods(ctx context.Context, page, limit int, query string) (*CoachFoodListResponse, error)
}

type coachFoodService struct {
	repo repository.FoodRepository
}

func NewCoachFoodService(repo repository.FoodRepository) CoachFoodService {
	return &coachFoodService{repo: repo}
}

func foodModelToCoachItem(f *models.Food) CoachFoodItem {
	units := make([]CoachFoodServingUnit, 0, len(f.ServingUnits))
	for _, u := range f.ServingUnits {
		units = append(units, CoachFoodServingUnit{
			ID:           u.ID,
			Label:        u.Label,
			GramsPerUnit: u.GramsPerUnit,
			IsDefault:    u.IsDefault,
		})
	}

	return CoachFoodItem{
		ID:       f.ID,
		Name:     f.Name,
		Unit:     f.Unit,
		Amount:   f.Amount,
		Calories: f.Calories,
		Fat:      f.Fat,
		Protein:  f.Protein,
		Carbs:    f.Carbs,
		Fiber:    f.Fiber,
		Sugar:    f.Sugar,

		Sodium:       f.Sodium,
		Cholesterol:  f.Cholesterol,
		Calcium:      f.Calcium,
		Iron:         f.Iron,
		Magnesium:    f.Magnesium,
		Potassium:    f.Potassium,
		Phosphorus:   f.Phosphorus,
		TransFat:     f.TransFat,
		SaturatedFat: f.SaturatedFat,

		ServingUnits: units,
	}
}

func (s *coachFoodService) ListFoods(ctx context.Context, page, limit int, query string) (*CoachFoodListResponse, error) {
	list, total, err := s.repo.Search(ctx, query, page, limit)
	if err != nil {
		return nil, err
	}

	items := make([]CoachFoodItem, 0, len(list))
	for i := range list {
		items = append(items, foodModelToCoachItem(&list[i]))
	}

	if limit <= 0 {
		limit = 20
	}
	if page <= 0 {
		page = 1
	}

	return &CoachFoodListResponse{
		Items: items,
		Page:  page,
		Limit: limit,
		Total: total,
	}, nil
}
