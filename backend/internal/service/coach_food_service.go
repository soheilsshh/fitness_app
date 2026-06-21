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
