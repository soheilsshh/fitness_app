package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var ErrExerciseNotFound = errors.New("exercise not found")

type AdminExerciseItem struct {
	ID               uint     `json:"id"`
	ExternalID       string   `json:"externalId"`
	Name             string   `json:"name"`
	Category         string   `json:"category"`
	BodyPart         string   `json:"bodyPart"`
	Equipment        string   `json:"equipment"`
	Description      string   `json:"description"`
	InstructionSteps []string `json:"instructionSteps"`
	MuscleGroup      string   `json:"muscleGroup"`
	Target           string   `json:"target"`
	SecondaryMuscles []string `json:"secondaryMuscles"`
	ImageURL         string   `json:"imageUrl"`
	GifURL           string   `json:"gifUrl"`
	IsActive         bool     `json:"isActive"`
}

type AdminExerciseListResponse struct {
	Items    []AdminExerciseItem `json:"items"`
	Page     int                 `json:"page"`
	PageSize int                 `json:"pageSize"`
	Total    int64               `json:"total"`
}

type CoachExerciseCreateRequest struct {
	Name        string `json:"name"`
	Category    string `json:"category"`
	BodyPart    string `json:"bodyPart"`
	Equipment   string `json:"equipment"`
	Target      string `json:"target"`
	Description string `json:"description"`
	ImagePath   string `json:"imagePath"`
	GifPath     string `json:"gifPath"`
}

type AdminExerciseCreateRequest struct {
	ExternalID       string   `json:"externalId"`
	Name             string   `json:"name"`
	Category         string   `json:"category"`
	BodyPart         string   `json:"bodyPart"`
	Equipment        string   `json:"equipment"`
	Description      string   `json:"description"`
	InstructionSteps []string `json:"instructionSteps"`
	MuscleGroup      string   `json:"muscleGroup"`
	Target           string   `json:"target"`
	SecondaryMuscles []string `json:"secondaryMuscles"`
	ImagePath        string   `json:"imagePath"`
	GifPath          string   `json:"gifPath"`
	IsActive         *bool    `json:"isActive"`
}

type AdminExerciseUpdateRequest struct {
	Name             *string  `json:"name"`
	Category         *string  `json:"category"`
	BodyPart         *string  `json:"bodyPart"`
	Equipment        *string  `json:"equipment"`
	Description      *string  `json:"description"`
	InstructionSteps []string `json:"instructionSteps"`
	MuscleGroup      *string  `json:"muscleGroup"`
	Target           *string  `json:"target"`
	SecondaryMuscles []string `json:"secondaryMuscles"`
	ImagePath        *string  `json:"imagePath"`
	GifPath          *string  `json:"gifPath"`
	IsActive         *bool    `json:"isActive"`
}

type AdminExerciseService interface {
	ListExercises(ctx context.Context, page, pageSize int, query, category, bodyPart, equipment string) (*AdminExerciseListResponse, error)
	ListCategories(ctx context.Context) ([]string, error)
	GetExerciseByID(ctx context.Context, id uint) (*AdminExerciseItem, error)
	CreateExercise(ctx context.Context, req *AdminExerciseCreateRequest) (*AdminExerciseItem, error)
	CreateCoachExercise(ctx context.Context, req *CoachExerciseCreateRequest) (*AdminExerciseItem, error)
	UpdateExercise(ctx context.Context, id uint, req *AdminExerciseUpdateRequest) (*AdminExerciseItem, error)
	DeleteExercise(ctx context.Context, id uint) error
}

type adminExerciseService struct {
	repo repository.ExerciseRepository
}

func NewAdminExerciseService(repo repository.ExerciseRepository) AdminExerciseService {
	return &adminExerciseService{repo: repo}
}

func exerciseMediaURL(path string) string {
	path = strings.TrimSpace(path)
	if path == "" {
		return ""
	}
	if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") || strings.HasPrefix(path, "/") {
		return path
	}
	return "/exercises-media/" + strings.TrimPrefix(path, "./")
}

func decodeStringSlice(data string) []string {
	if strings.TrimSpace(data) == "" {
		return []string{}
	}
	var out []string
	if err := json.Unmarshal([]byte(data), &out); err != nil {
		return []string{}
	}
	return out
}

func encodeStringSlice(items []string) string {
	if items == nil {
		items = []string{}
	}
	b, err := json.Marshal(items)
	if err != nil {
		return "[]"
	}
	return string(b)
}

func exerciseToItem(e *models.Exercise) AdminExerciseItem {
	return AdminExerciseItem{
		ID:               e.ID,
		ExternalID:       e.ExternalID,
		Name:             e.Name,
		Category:         e.Category,
		BodyPart:         e.BodyPart,
		Equipment:        e.Equipment,
		Description:      e.Description,
		InstructionSteps: decodeStringSlice(e.InstructionSteps),
		MuscleGroup:      e.MuscleGroup,
		Target:           e.Target,
		SecondaryMuscles: decodeStringSlice(e.SecondaryMuscles),
		ImageURL:         exerciseMediaURL(e.ImagePath),
		GifURL:           exerciseMediaURL(e.GifPath),
		IsActive:         e.IsActive,
	}
}

func (s *adminExerciseService) ListExercises(ctx context.Context, page, pageSize int, query, category, bodyPart, equipment string) (*AdminExerciseListResponse, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	list, total, err := s.repo.List(ctx, page, pageSize, query, category, bodyPart, equipment)
	if err != nil {
		return nil, err
	}

	items := make([]AdminExerciseItem, 0, len(list))
	for i := range list {
		items = append(items, exerciseToItem(&list[i]))
	}

	return &AdminExerciseListResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	}, nil
}

func (s *adminExerciseService) ListCategories(ctx context.Context) ([]string, error) {
	cats, err := s.repo.ListCategories(ctx)
	if err != nil {
		return nil, err
	}
	if cats == nil {
		return []string{}, nil
	}
	return cats, nil
}

func (s *adminExerciseService) GetExerciseByID(ctx context.Context, id uint) (*AdminExerciseItem, error) {
	e, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrExerciseNotFound
		}
		return nil, err
	}
	item := exerciseToItem(e)
	return &item, nil
}

func (s *adminExerciseService) generateUniqueExternalID(ctx context.Context) (string, error) {
	for i := 0; i < 8; i++ {
		b := make([]byte, 4)
		if _, err := rand.Read(b); err != nil {
			return "", err
		}
		id := fmt.Sprintf("mc%s", hex.EncodeToString(b))
		_, err := s.repo.FindByExternalID(ctx, id)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return id, nil
		}
		if err != nil {
			return "", err
		}
	}
	return "", errors.New("failed to generate external id")
}

func (s *adminExerciseService) CreateCoachExercise(ctx context.Context, req *CoachExerciseCreateRequest) (*AdminExerciseItem, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return nil, errors.New("name is required")
	}

	externalID, err := s.generateUniqueExternalID(ctx)
	if err != nil {
		return nil, err
	}

	e := &models.Exercise{
		ExternalID:       externalID,
		Name:             name,
		Category:         strings.TrimSpace(req.Category),
		BodyPart:         strings.TrimSpace(req.BodyPart),
		Equipment:        strings.TrimSpace(req.Equipment),
		Target:           strings.TrimSpace(req.Target),
		Description:      strings.TrimSpace(req.Description),
		InstructionSteps: encodeStringSlice(nil),
		SecondaryMuscles: encodeStringSlice(nil),
		ImagePath:        strings.TrimSpace(req.ImagePath),
		GifPath:          strings.TrimSpace(req.GifPath),
		IsActive:         true,
	}

	if err := s.repo.Create(ctx, e); err != nil {
		return nil, err
	}
	item := exerciseToItem(e)
	return &item, nil
}

func (s *adminExerciseService) CreateExercise(ctx context.Context, req *AdminExerciseCreateRequest) (*AdminExerciseItem, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return nil, errors.New("name is required")
	}

	externalID := strings.TrimSpace(req.ExternalID)
	if externalID == "" {
		return nil, errors.New("externalId is required")
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	e := &models.Exercise{
		ExternalID:       externalID,
		Name:             name,
		Category:         strings.TrimSpace(req.Category),
		BodyPart:         strings.TrimSpace(req.BodyPart),
		Equipment:        strings.TrimSpace(req.Equipment),
		Description:      strings.TrimSpace(req.Description),
		InstructionSteps: encodeStringSlice(req.InstructionSteps),
		MuscleGroup:      strings.TrimSpace(req.MuscleGroup),
		Target:           strings.TrimSpace(req.Target),
		SecondaryMuscles: encodeStringSlice(req.SecondaryMuscles),
		ImagePath:        strings.TrimSpace(req.ImagePath),
		GifPath:          strings.TrimSpace(req.GifPath),
		IsActive:         isActive,
	}

	if err := s.repo.Create(ctx, e); err != nil {
		return nil, err
	}
	item := exerciseToItem(e)
	return &item, nil
}

func (s *adminExerciseService) UpdateExercise(ctx context.Context, id uint, req *AdminExerciseUpdateRequest) (*AdminExerciseItem, error) {
	e, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrExerciseNotFound
		}
		return nil, err
	}

	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" {
			return nil, errors.New("name cannot be empty")
		}
		e.Name = name
	}
	if req.Category != nil {
		e.Category = strings.TrimSpace(*req.Category)
	}
	if req.BodyPart != nil {
		e.BodyPart = strings.TrimSpace(*req.BodyPart)
	}
	if req.Equipment != nil {
		e.Equipment = strings.TrimSpace(*req.Equipment)
	}
	if req.Description != nil {
		e.Description = strings.TrimSpace(*req.Description)
	}
	if req.InstructionSteps != nil {
		e.InstructionSteps = encodeStringSlice(req.InstructionSteps)
	}
	if req.MuscleGroup != nil {
		e.MuscleGroup = strings.TrimSpace(*req.MuscleGroup)
	}
	if req.Target != nil {
		e.Target = strings.TrimSpace(*req.Target)
	}
	if req.SecondaryMuscles != nil {
		e.SecondaryMuscles = encodeStringSlice(req.SecondaryMuscles)
	}
	if req.ImagePath != nil {
		e.ImagePath = strings.TrimSpace(*req.ImagePath)
	}
	if req.GifPath != nil {
		e.GifPath = strings.TrimSpace(*req.GifPath)
	}
	if req.IsActive != nil {
		e.IsActive = *req.IsActive
	}

	if err := s.repo.Update(ctx, e); err != nil {
		return nil, err
	}
	item := exerciseToItem(e)
	return &item, nil
}

func (s *adminExerciseService) DeleteExercise(ctx context.Context, id uint) error {
	_, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrExerciseNotFound
		}
		return err
	}
	return s.repo.Delete(ctx, id)
}
