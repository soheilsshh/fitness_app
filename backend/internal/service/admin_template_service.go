package service

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var ErrWorkoutTemplateNotFound = errors.New("workout template not found")
var ErrNutritionTemplateNotFound = errors.New("nutrition template not found")

type AdminTemplateSetDTO struct {
	SetNumber int    `json:"setNumber"`
	Reps      string `json:"reps"`
	IsAMRAP   bool   `json:"isAmrap"`
}

type AdminTemplateItemDTO struct {
	DayNumber         int                   `json:"dayNumber"`
	OrderIndex        int                   `json:"orderIndex"`
	ExerciseID        *uint                 `json:"exerciseId,omitempty"`
	Exercise          string                `json:"exercise"`
	Notes             string                `json:"notes,omitempty"`
	SupersetID        *string               `json:"supersetId,omitempty"`
	WorkoutSystemType string                `json:"workoutSystemType,omitempty"`
	SetsDetails       []AdminTemplateSetDTO `json:"setsDetails"`
	ImageURL          string                `json:"imageUrl,omitempty"`
	GifURL            string                `json:"gifUrl,omitempty"`
}

type AdminWorkoutTemplateSummary struct {
	ID        uint   `json:"id"`
	Title     string `json:"title"`
	Type      string `json:"type"`
	Gender    string `json:"gender"`
	Location  string `json:"location"`
	DayCount  int    `json:"dayCount"`
	Target    string `json:"target"`
	Level     string `json:"level"`
	Injury    string `json:"injury"`
	ItemCount int    `json:"itemCount"`
}

type AdminWorkoutTemplateDetail struct {
	AdminWorkoutTemplateSummary
	Items []AdminTemplateItemDTO `json:"items"`
}

type AdminWorkoutTemplateListResponse struct {
	Items    []AdminWorkoutTemplateSummary `json:"items"`
	Page     int                           `json:"page"`
	PageSize int                           `json:"pageSize"`
	Total    int64                         `json:"total"`
}

type AdminWorkoutTemplateUpsertRequest struct {
	Title    string                 `json:"title"`
	Type     string                 `json:"type"`
	Gender   string                 `json:"gender"`
	Location string                 `json:"location"`
	DayCount int                    `json:"dayCount"`
	Target   string                 `json:"target"`
	Level    string                 `json:"level"`
	Injury   string                 `json:"injury"`
	Items    []AdminTemplateItemDTO `json:"items"`
}

type AdminNutritionMealItemDTO struct {
	MenuName    string  `json:"menuName,omitempty"`
	OrderIndex  int     `json:"orderIndex"`
	FoodID      *uint   `json:"foodId,omitempty"`
	FoodName    string  `json:"foodName"`
	FoodImage   string  `json:"foodImage,omitempty"`
	Unit        string  `json:"unit,omitempty"`
	Value       float64 `json:"value"`
	Description string  `json:"description,omitempty"`
}

type AdminNutritionMealDTO struct {
	MealOrder   int                         `json:"mealOrder"`
	MealName    string                      `json:"mealName"`
	MealCalorie int                         `json:"mealCalorie"`
	StartTime   string                      `json:"startTime,omitempty"`
	EndTime     string                      `json:"endTime,omitempty"`
	Items       []AdminNutritionMealItemDTO `json:"items"`
}

type AdminNutritionTemplateSummary struct {
	ID         uint   `json:"id"`
	Title      string `json:"title"`
	Type       string `json:"type"`
	Gender     string `json:"gender"`
	Target     string `json:"target"`
	Limitation string `json:"limitation"`
	Calorie    int    `json:"calorie"`
	IsPro      bool   `json:"isPro"`
	MealCount  int    `json:"mealCount"`
}

type AdminNutritionTemplateDetail struct {
	AdminNutritionTemplateSummary
	Description string                  `json:"description"`
	Meals       []AdminNutritionMealDTO `json:"meals"`
}

type AdminNutritionTemplateListResponse struct {
	Items    []AdminNutritionTemplateSummary `json:"items"`
	Page     int                             `json:"page"`
	PageSize int                             `json:"pageSize"`
	Total    int64                           `json:"total"`
}

type AdminNutritionTemplateUpsertRequest struct {
	Title       string                  `json:"title"`
	Type        string                  `json:"type"`
	Gender      string                  `json:"gender"`
	Target      string                  `json:"target"`
	Limitation  string                  `json:"limitation"`
	Calorie     int                     `json:"calorie"`
	Description string                  `json:"description"`
	IsPro       bool                    `json:"isPro"`
	Meals       []AdminNutritionMealDTO `json:"meals"`
}

type AdminTemplateService interface {
	ListWorkoutTemplates(ctx context.Context, page, pageSize int, query string) (*AdminWorkoutTemplateListResponse, error)
	GetWorkoutTemplate(ctx context.Context, id uint) (*AdminWorkoutTemplateDetail, error)
	CreateWorkoutTemplate(ctx context.Context, req *AdminWorkoutTemplateUpsertRequest) (*AdminWorkoutTemplateDetail, error)
	UpdateWorkoutTemplate(ctx context.Context, id uint, req *AdminWorkoutTemplateUpsertRequest) (*AdminWorkoutTemplateDetail, error)
	DeleteWorkoutTemplate(ctx context.Context, id uint) error

	ListNutritionTemplates(ctx context.Context, page, pageSize int, query string) (*AdminNutritionTemplateListResponse, error)
	GetNutritionTemplate(ctx context.Context, id uint) (*AdminNutritionTemplateDetail, error)
	CreateNutritionTemplate(ctx context.Context, req *AdminNutritionTemplateUpsertRequest) (*AdminNutritionTemplateDetail, error)
	UpdateNutritionTemplate(ctx context.Context, id uint, req *AdminNutritionTemplateUpsertRequest) (*AdminNutritionTemplateDetail, error)
	DeleteNutritionTemplate(ctx context.Context, id uint) error
}

type adminTemplateService struct {
	templateRepo repository.TemplateRepository
	exerciseRepo repository.ExerciseRepository
	db           *gorm.DB
}

func NewAdminTemplateService(
	db *gorm.DB,
	templateRepo repository.TemplateRepository,
	exerciseRepo repository.ExerciseRepository,
) AdminTemplateService {
	return &adminTemplateService{db: db, templateRepo: templateRepo, exerciseRepo: exerciseRepo}
}

func (s *adminTemplateService) ListWorkoutTemplates(ctx context.Context, page, pageSize int, query string) (*AdminWorkoutTemplateListResponse, error) {
	list, total, err := s.templateRepo.ListWorkoutTemplatesPaged(ctx, page, pageSize, query)
	if err != nil {
		return nil, err
	}
	items := make([]AdminWorkoutTemplateSummary, 0, len(list))
	for _, t := range list {
		var c int64
		_ = s.db.WithContext(ctx).Model(&models.TemplateProgramItem{}).
			Where("workout_template_id = ?", t.ID).Count(&c)
		items = append(items, AdminWorkoutTemplateSummary{
			ID: t.ID, Title: t.Title, Type: t.Type, Gender: t.Gender,
			Location: t.Location, DayCount: t.DayCount, Target: t.Target,
			Level: t.Level, Injury: t.Injury, ItemCount: int(c),
		})
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	return &AdminWorkoutTemplateListResponse{Items: items, Page: page, PageSize: pageSize, Total: total}, nil
}

func (s *adminTemplateService) GetWorkoutTemplate(ctx context.Context, id uint) (*AdminWorkoutTemplateDetail, error) {
	t, err := s.templateRepo.FindWorkoutTemplateByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkoutTemplateNotFound
		}
		return nil, err
	}
	return workoutTemplateToDetail(ctx, s.exerciseRepo, t), nil
}

func (s *adminTemplateService) CreateWorkoutTemplate(ctx context.Context, req *AdminWorkoutTemplateUpsertRequest) (*AdminWorkoutTemplateDetail, error) {
	title := strings.TrimSpace(req.Title)
	if title == "" {
		return nil, errors.New("title is required")
	}
	sourceID, err := s.templateRepo.NextManualWorkoutSourceID(ctx)
	if err != nil {
		return nil, err
	}
	dayCount := req.DayCount
	if dayCount <= 0 {
		dayCount = maxDayFromItems(req.Items)
	}
	if dayCount <= 0 {
		dayCount = 1
	}
	items := s.mapItems(req.Items)
	t := &models.WorkoutTemplate{
		SourceID: sourceID,
		Title:    title,
		Type:     strings.TrimSpace(req.Type),
		Gender:   strings.TrimSpace(req.Gender),
		Location: strings.TrimSpace(req.Location),
		DayCount: dayCount,
		Target:   strings.TrimSpace(req.Target),
		Injury:   strings.TrimSpace(req.Injury),
		Level:    strings.TrimSpace(req.Level),
		Items:    items,
	}
	if err := s.templateRepo.CreateWorkoutTemplate(ctx, t); err != nil {
		return nil, err
	}
	return s.GetWorkoutTemplate(ctx, t.ID)
}

func (s *adminTemplateService) UpdateWorkoutTemplate(ctx context.Context, id uint, req *AdminWorkoutTemplateUpsertRequest) (*AdminWorkoutTemplateDetail, error) {
	t, err := s.templateRepo.FindWorkoutTemplateByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkoutTemplateNotFound
		}
		return nil, err
	}
	title := strings.TrimSpace(req.Title)
	if title == "" {
		return nil, errors.New("title is required")
	}
	dayCount := req.DayCount
	if dayCount <= 0 {
		dayCount = maxDayFromItems(req.Items)
	}
	if dayCount <= 0 {
		dayCount = t.DayCount
	}
	t.Title = title
	t.Type = strings.TrimSpace(req.Type)
	t.Gender = strings.TrimSpace(req.Gender)
	t.Location = strings.TrimSpace(req.Location)
	t.DayCount = dayCount
	t.Target = strings.TrimSpace(req.Target)
	t.Injury = strings.TrimSpace(req.Injury)
	t.Level = strings.TrimSpace(req.Level)
	if err := s.templateRepo.UpdateWorkoutTemplateMeta(ctx, t); err != nil {
		return nil, err
	}
	if req.Items != nil {
		if err := s.templateRepo.ReplaceWorkoutTemplateItems(ctx, id, s.mapItems(req.Items)); err != nil {
			return nil, err
		}
	}
	return s.GetWorkoutTemplate(ctx, id)
}

func (s *adminTemplateService) DeleteWorkoutTemplate(ctx context.Context, id uint) error {
	_, err := s.templateRepo.FindWorkoutTemplateByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrWorkoutTemplateNotFound
		}
		return err
	}
	return s.templateRepo.DeleteWorkoutTemplate(ctx, id)
}

func (s *adminTemplateService) mapItems(in []AdminTemplateItemDTO) []models.TemplateProgramItem {
	out := make([]models.TemplateProgramItem, 0, len(in))
	for i, it := range in {
		name := strings.TrimSpace(it.Exercise)
		if name == "" {
			continue
		}
		day := it.DayNumber
		if day <= 0 {
			day = 1
		}
		order := it.OrderIndex
		if order <= 0 {
			order = i + 1
		}
		item := models.TemplateProgramItem{
			DayNumber:         day,
			OrderIndex:        order,
			Exercise:          name,
			Notes:             strings.TrimSpace(it.Notes),
			SupersetID:        it.SupersetID,
			WorkoutSystemType: normalizeWorkoutSystemType(it.WorkoutSystemType),
		}
		if it.ExerciseID != nil && *it.ExerciseID > 0 {
			id := *it.ExerciseID
			item.ExerciseID = &id
		}
		sets := make([]models.TemplateProgramItemSet, 0, len(it.SetsDetails))
		for j, st := range it.SetsDetails {
			num := st.SetNumber
			if num <= 0 {
				num = j + 1
			}
			sets = append(sets, models.TemplateProgramItemSet{
				SetNumber: num,
				Reps:      strings.TrimSpace(st.Reps),
				IsAMRAP:   st.IsAMRAP,
			})
		}
		item.SetsDetails = sets
		out = append(out, item)
	}
	return out
}

func workoutTemplateToDetail(ctx context.Context, exerciseRepo repository.ExerciseRepository, t *models.WorkoutTemplate) *AdminWorkoutTemplateDetail {
	warmMediaDonorCache(ctx, exerciseRepo)
	ids := make([]uint, 0)
	for _, it := range t.Items {
		if it.ExerciseID != nil && *it.ExerciseID > 0 {
			ids = append(ids, *it.ExerciseID)
		}
	}
	byID := map[uint]*models.Exercise{}
	if list, err := exerciseRepo.FindByIDs(ctx, ids); err == nil {
		for i := range list {
			byID[list[i].ID] = &list[i]
		}
	}
	items := make([]AdminTemplateItemDTO, 0, len(t.Items))
	for _, it := range t.Items {
		dto := AdminTemplateItemDTO{
			DayNumber:         it.DayNumber,
			OrderIndex:        it.OrderIndex,
			ExerciseID:        it.ExerciseID,
			Exercise:          it.Exercise,
			Notes:             it.Notes,
			SupersetID:        it.SupersetID,
			WorkoutSystemType: it.WorkoutSystemType,
		}
		for _, st := range it.SetsDetails {
			dto.SetsDetails = append(dto.SetsDetails, AdminTemplateSetDTO{
				SetNumber: st.SetNumber,
				Reps:      st.Reps,
				IsAMRAP:   st.IsAMRAP,
			})
		}
		if it.ExerciseID != nil {
			if ex := byID[*it.ExerciseID]; ex != nil {
				gifPath := ex.GifPath
				imagePath := ex.ImagePath
				if strings.TrimSpace(gifPath) == "" {
					if donor := lookupMediaDonor(ex.Name); donor != nil {
						gifPath = donor.GifPath
						if strings.TrimSpace(imagePath) == "" {
							imagePath = donor.ImagePath
						}
					}
				}
				dto.ImageURL = exerciseMediaURL(imagePath)
				dto.GifURL = exerciseMediaURL(gifPath)
				if dto.ImageURL == "" {
					dto.ImageURL = dto.GifURL
				}
			}
		}
		items = append(items, dto)
	}
	return &AdminWorkoutTemplateDetail{
		AdminWorkoutTemplateSummary: AdminWorkoutTemplateSummary{
			ID: t.ID, Title: t.Title, Type: t.Type, Gender: t.Gender,
			Location: t.Location, DayCount: t.DayCount, Target: t.Target,
			Level: t.Level, Injury: t.Injury, ItemCount: len(items),
		},
		Items: items,
	}
}

func maxDayFromItems(items []AdminTemplateItemDTO) int {
	max := 0
	for _, it := range items {
		if it.DayNumber > max {
			max = it.DayNumber
		}
	}
	return max
}

func (s *adminTemplateService) ListNutritionTemplates(ctx context.Context, page, pageSize int, query string) (*AdminNutritionTemplateListResponse, error) {
	list, total, err := s.templateRepo.ListNutritionTemplatesPaged(ctx, page, pageSize, query)
	if err != nil {
		return nil, err
	}
	items := make([]AdminNutritionTemplateSummary, 0, len(list))
	for _, t := range list {
		var c int64
		_ = s.db.WithContext(ctx).Model(&models.TemplateMeal{}).
			Where("nutrition_template_id = ?", t.ID).Count(&c)
		items = append(items, AdminNutritionTemplateSummary{
			ID: t.ID, Title: t.Title, Type: t.Type, Gender: t.Gender,
			Target: t.Target, Limitation: t.Limitation, Calorie: t.Calorie,
			IsPro: t.IsPro, MealCount: int(c),
		})
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	return &AdminNutritionTemplateListResponse{Items: items, Page: page, PageSize: pageSize, Total: total}, nil
}

func (s *adminTemplateService) GetNutritionTemplate(ctx context.Context, id uint) (*AdminNutritionTemplateDetail, error) {
	t, err := s.templateRepo.FindNutritionTemplateByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNutritionTemplateNotFound
		}
		return nil, err
	}
	return nutritionTemplateToDetail(t), nil
}

func (s *adminTemplateService) CreateNutritionTemplate(ctx context.Context, req *AdminNutritionTemplateUpsertRequest) (*AdminNutritionTemplateDetail, error) {
	title := strings.TrimSpace(req.Title)
	if title == "" {
		return nil, errors.New("title is required")
	}
	sourceID, err := s.templateRepo.NextManualNutritionSourceID(ctx)
	if err != nil {
		return nil, err
	}
	t := &models.NutritionTemplate{
		SourceID:    sourceID,
		Title:       title,
		Type:        strings.TrimSpace(req.Type),
		Gender:      strings.TrimSpace(req.Gender),
		Target:      strings.TrimSpace(req.Target),
		Limitation:  strings.TrimSpace(req.Limitation),
		Calorie:     req.Calorie,
		Description: strings.TrimSpace(req.Description),
		IsPro:       req.IsPro,
		Version:     1,
		Meals:       mapNutritionMeals(req.Meals),
	}
	if err := s.templateRepo.CreateNutritionTemplate(ctx, t); err != nil {
		return nil, err
	}
	return s.GetNutritionTemplate(ctx, t.ID)
}

func (s *adminTemplateService) UpdateNutritionTemplate(ctx context.Context, id uint, req *AdminNutritionTemplateUpsertRequest) (*AdminNutritionTemplateDetail, error) {
	t, err := s.templateRepo.FindNutritionTemplateByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNutritionTemplateNotFound
		}
		return nil, err
	}
	title := strings.TrimSpace(req.Title)
	if title == "" {
		return nil, errors.New("title is required")
	}
	t.Title = title
	t.Type = strings.TrimSpace(req.Type)
	t.Gender = strings.TrimSpace(req.Gender)
	t.Target = strings.TrimSpace(req.Target)
	t.Limitation = strings.TrimSpace(req.Limitation)
	t.Calorie = req.Calorie
	t.Description = strings.TrimSpace(req.Description)
	t.IsPro = req.IsPro
	if err := s.templateRepo.UpdateNutritionTemplateMeta(ctx, t); err != nil {
		return nil, err
	}
	if req.Meals != nil {
		if err := s.templateRepo.ReplaceNutritionTemplateMeals(ctx, id, mapNutritionMeals(req.Meals)); err != nil {
			return nil, err
		}
	}
	return s.GetNutritionTemplate(ctx, id)
}

func (s *adminTemplateService) DeleteNutritionTemplate(ctx context.Context, id uint) error {
	_, err := s.templateRepo.FindNutritionTemplateByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNutritionTemplateNotFound
		}
		return err
	}
	return s.templateRepo.DeleteNutritionTemplate(ctx, id)
}

func mapNutritionMeals(in []AdminNutritionMealDTO) []models.TemplateMeal {
	out := make([]models.TemplateMeal, 0, len(in))
	for i, m := range in {
		name := strings.TrimSpace(m.MealName)
		if name == "" {
			continue
		}
		order := m.MealOrder
		if order <= 0 {
			order = i + 1
		}
		meal := models.TemplateMeal{
			MealOrder:   order,
			MealName:    name,
			MealCalorie: m.MealCalorie,
			StartTime:   strings.TrimSpace(m.StartTime),
			EndTime:     strings.TrimSpace(m.EndTime),
		}
		items := make([]models.TemplateMealItem, 0, len(m.Items))
		for j, it := range m.Items {
			foodName := strings.TrimSpace(it.FoodName)
			if foodName == "" {
				continue
			}
			itemOrder := it.OrderIndex
			if itemOrder <= 0 {
				itemOrder = j + 1
			}
			item := models.TemplateMealItem{
				MenuName:    strings.TrimSpace(it.MenuName),
				OrderIndex:  itemOrder,
				FoodName:    foodName,
				FoodImage:   strings.TrimSpace(it.FoodImage),
				Unit:        strings.TrimSpace(it.Unit),
				Value:       it.Value,
				Description: strings.TrimSpace(it.Description),
			}
			if it.FoodID != nil && *it.FoodID > 0 {
				id := *it.FoodID
				item.FoodID = &id
			}
			items = append(items, item)
		}
		meal.Items = items
		out = append(out, meal)
	}
	return out
}

func nutritionTemplateToDetail(t *models.NutritionTemplate) *AdminNutritionTemplateDetail {
	meals := make([]AdminNutritionMealDTO, 0, len(t.Meals))
	for _, m := range t.Meals {
		dto := AdminNutritionMealDTO{
			MealOrder:   m.MealOrder,
			MealName:    m.MealName,
			MealCalorie: m.MealCalorie,
			StartTime:   m.StartTime,
			EndTime:     m.EndTime,
		}
		for _, it := range m.Items {
			dto.Items = append(dto.Items, AdminNutritionMealItemDTO{
				MenuName:    it.MenuName,
				OrderIndex:  it.OrderIndex,
				FoodID:      it.FoodID,
				FoodName:    it.FoodName,
				FoodImage:   it.FoodImage,
				Unit:        it.Unit,
				Value:       it.Value,
				Description: it.Description,
			})
		}
		meals = append(meals, dto)
	}
	return &AdminNutritionTemplateDetail{
		AdminNutritionTemplateSummary: AdminNutritionTemplateSummary{
			ID: t.ID, Title: t.Title, Type: t.Type, Gender: t.Gender,
			Target: t.Target, Limitation: t.Limitation, Calorie: t.Calorie,
			IsPro: t.IsPro, MealCount: len(meals),
		},
		Description: t.Description,
		Meals:       meals,
	}
}
