package service

import (
	"context"
	"errors"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var ErrRecipeNotFound = errors.New("recipe not found")

type RecipeDTO struct {
	ID           uint    `json:"id"`
	Title        string  `json:"title"`
	DietType     string  `json:"dietType,omitempty"`
	Calories     int     `json:"calories"`
	ProteinG     float64 `json:"proteinG"`
	CarbsG       float64 `json:"carbsG"`
	FatG         float64 `json:"fatG"`
	Ingredients  string  `json:"ingredients,omitempty"`
	Instructions string  `json:"instructions,omitempty"`
	VideoURL     string  `json:"videoUrl,omitempty"`
	ImageURL     string  `json:"imageUrl,omitempty"`
	Tags         string  `json:"tags,omitempty"`
	IsPublished  bool    `json:"isPublished"`
}

type RecipeListResponse struct {
	Items    []RecipeDTO `json:"items"`
	Total    int64       `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"pageSize"`
}

type RecipeUpsertRequest struct {
	Title        string  `json:"title"`
	DietType     string  `json:"dietType"`
	Calories     int     `json:"calories"`
	ProteinG     float64 `json:"proteinG"`
	CarbsG       float64 `json:"carbsG"`
	FatG         float64 `json:"fatG"`
	Ingredients  string  `json:"ingredients"`
	Instructions string  `json:"instructions"`
	VideoURL     string  `json:"videoUrl"`
	ImageURL     string  `json:"imageUrl"`
	Tags         string  `json:"tags"`
	IsPublished  *bool   `json:"isPublished"`
}

type RecipeService interface {
	List(ctx context.Context, filter repository.RecipeFilter, page, pageSize int) (*RecipeListResponse, error)
	GetByID(ctx context.Context, id uint) (*RecipeDTO, error)
	Create(ctx context.Context, req *RecipeUpsertRequest) (*RecipeDTO, error)
	Update(ctx context.Context, id uint, req *RecipeUpsertRequest) (*RecipeDTO, error)
	Delete(ctx context.Context, id uint) error
}

type recipeService struct {
	repo repository.RecipeRepository
}

func NewRecipeService(repo repository.RecipeRepository) RecipeService {
	return &recipeService{repo: repo}
}

func recipeToDTO(r *models.Recipe) RecipeDTO {
	return RecipeDTO{
		ID:           r.ID,
		Title:        r.Title,
		DietType:     r.DietType,
		Calories:     r.Calories,
		ProteinG:     r.ProteinG,
		CarbsG:       r.CarbsG,
		FatG:         r.FatG,
		Ingredients:  r.Ingredients,
		Instructions: r.Instructions,
		VideoURL:     r.VideoURL,
		ImageURL:     r.ImageURL,
		Tags:         r.Tags,
		IsPublished:  r.IsPublished,
	}
}

func (s *recipeService) List(ctx context.Context, filter repository.RecipeFilter, page, pageSize int) (*RecipeListResponse, error) {
	items, total, err := s.repo.List(ctx, filter, page, pageSize)
	if err != nil {
		return nil, err
	}
	dtos := make([]RecipeDTO, 0, len(items))
	for i := range items {
		dtos = append(dtos, recipeToDTO(&items[i]))
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	return &RecipeListResponse{Items: dtos, Total: total, Page: page, PageSize: pageSize}, nil
}

func (s *recipeService) GetByID(ctx context.Context, id uint) (*RecipeDTO, error) {
	r, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, ErrRecipeNotFound
	}
	dto := recipeToDTO(r)
	return &dto, nil
}

func (s *recipeService) Create(ctx context.Context, req *RecipeUpsertRequest) (*RecipeDTO, error) {
	if req.Title == "" {
		return nil, errors.New("عنوان دستور پخت الزامی است")
	}
	r := &models.Recipe{
		Title:        req.Title,
		DietType:     req.DietType,
		Calories:     req.Calories,
		ProteinG:     req.ProteinG,
		CarbsG:       req.CarbsG,
		FatG:         req.FatG,
		Ingredients:  req.Ingredients,
		Instructions: req.Instructions,
		VideoURL:     req.VideoURL,
		ImageURL:     req.ImageURL,
		Tags:         req.Tags,
		IsPublished:  true,
	}
	if req.IsPublished != nil {
		r.IsPublished = *req.IsPublished
	}
	if err := s.repo.Create(ctx, r); err != nil {
		return nil, err
	}
	dto := recipeToDTO(r)
	return &dto, nil
}

func (s *recipeService) Update(ctx context.Context, id uint, req *RecipeUpsertRequest) (*RecipeDTO, error) {
	r, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, ErrRecipeNotFound
	}
	if req.Title != "" {
		r.Title = req.Title
	}
	r.DietType = req.DietType
	if req.Calories > 0 {
		r.Calories = req.Calories
	}
	r.ProteinG = req.ProteinG
	r.CarbsG = req.CarbsG
	r.FatG = req.FatG
	r.Ingredients = req.Ingredients
	r.Instructions = req.Instructions
	r.VideoURL = req.VideoURL
	r.ImageURL = req.ImageURL
	r.Tags = req.Tags
	if req.IsPublished != nil {
		r.IsPublished = *req.IsPublished
	}
	if err := s.repo.Update(ctx, r); err != nil {
		return nil, err
	}
	dto := recipeToDTO(r)
	return &dto, nil
}

func (s *recipeService) Delete(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}
