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

type AdminTemplateSetDTO struct {
	SetNumber int    `json:"setNumber"`
	Reps      string `json:"reps"`
	IsAMRAP   bool   `json:"isAmrap"`
}

type AdminTemplateItemDTO struct {
	DayNumber         int                  `json:"dayNumber"`
	OrderIndex        int                  `json:"orderIndex"`
	ExerciseID        *uint                `json:"exerciseId,omitempty"`
	Exercise          string               `json:"exercise"`
	Notes             string               `json:"notes,omitempty"`
	SupersetID        *string              `json:"supersetId,omitempty"`
	WorkoutSystemType string               `json:"workoutSystemType,omitempty"`
	SetsDetails       []AdminTemplateSetDTO `json:"setsDetails"`
	ImageURL          string               `json:"imageUrl,omitempty"`
	GifURL            string               `json:"gifUrl,omitempty"`
}

type AdminWorkoutTemplateSummary struct {
	ID       uint   `json:"id"`
	Title    string `json:"title"`
	Type     string `json:"type"`
	Gender   string `json:"gender"`
	Location string `json:"location"`
	DayCount int    `json:"dayCount"`
	Target   string `json:"target"`
	Level    string `json:"level"`
	Injury   string `json:"injury"`
	ItemCount int   `json:"itemCount"`
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

type AdminTemplateService interface {
	ListWorkoutTemplates(ctx context.Context, page, pageSize int, query string) (*AdminWorkoutTemplateListResponse, error)
	GetWorkoutTemplate(ctx context.Context, id uint) (*AdminWorkoutTemplateDetail, error)
	CreateWorkoutTemplate(ctx context.Context, req *AdminWorkoutTemplateUpsertRequest) (*AdminWorkoutTemplateDetail, error)
	UpdateWorkoutTemplate(ctx context.Context, id uint, req *AdminWorkoutTemplateUpsertRequest) (*AdminWorkoutTemplateDetail, error)
	DeleteWorkoutTemplate(ctx context.Context, id uint) error
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
	return s.toDetail(ctx, t), nil
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

func (s *adminTemplateService) toDetail(ctx context.Context, t *models.WorkoutTemplate) *AdminWorkoutTemplateDetail {
	ids := make([]uint, 0)
	for _, it := range t.Items {
		if it.ExerciseID != nil && *it.ExerciseID > 0 {
			ids = append(ids, *it.ExerciseID)
		}
	}
	byID := map[uint]*models.Exercise{}
	if list, err := s.exerciseRepo.FindByIDs(ctx, ids); err == nil {
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
				dto.ImageURL = exerciseMediaURL(ex.ImagePath)
				dto.GifURL = exerciseMediaURL(ex.GifPath)
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
