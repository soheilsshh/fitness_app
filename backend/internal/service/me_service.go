package service

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/config"
	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var (
	ErrInvalidProfileField = errors.New("invalid profile field")
	ErrInvalidPhotoType    = errors.New("invalid photo type")
)

// MeProfileDTO matches frontend profile and onboarding forms.
type MeProfileDTO struct {
	ID                  uint         `json:"id"`
	FirstName           string       `json:"firstName"`
	LastName            string       `json:"lastName"`
	Phone               string       `json:"phone"`
	Email               string       `json:"email"`
	HeightCm            *float64     `json:"heightCm,omitempty"`
	WeightKg            *float64     `json:"weightKg,omitempty"`
	BirthDate           *string      `json:"birthDate,omitempty"`
	NationalID          string       `json:"nationalId,omitempty"`
	Gender              string       `json:"gender,omitempty"`
	Goals               []string     `json:"goals"`
	PrimaryGoal         string       `json:"primaryGoal,omitempty"`
	TargetWeightKg      *float64     `json:"targetWeightKg,omitempty"`
	BodyCondition       string       `json:"bodyCondition,omitempty"`
	BodyFatPercent      *float64     `json:"bodyFatPercent,omitempty"`
	MedicalHistory      string       `json:"medicalHistory,omitempty"`
	Injuries            string       `json:"injuries,omitempty"`
	PhysicalLimitations string       `json:"physicalLimitations,omitempty"`
	IsProfileComplete   bool         `json:"isProfileComplete"`
	Photos              []MePhotoDTO `json:"photos"`
	ProgramsCount       int64        `json:"programsCount"`
	OrdersCount         int64        `json:"ordersCount"`
	AssignedCoachID     *uint        `json:"assignedCoachId,omitempty"`
	AssignedCoachName   string       `json:"assignedCoachName,omitempty"`
	AssignedCoachSlug   string       `json:"assignedCoachSlug,omitempty"`
	CreatedAt           time.Time    `json:"createdAt"`
}

type MePhotoDTO struct {
	ID   uint   `json:"id"`
	URL  string `json:"url"`
	Name string `json:"name"`
	Type string `json:"type"`
}

// MeProfileUpdateRequest for PATCH /me.
type MeProfileUpdateRequest struct {
	FirstName           *string   `json:"firstName"`
	LastName            *string   `json:"lastName"`
	HeightCm            *float64  `json:"heightCm"`
	WeightKg            *float64  `json:"weightKg"`
	BirthDate           *string   `json:"birthDate"`
	NationalID          *string   `json:"nationalId"`
	Gender              *string   `json:"gender"`
	Goals               *[]string `json:"goals"`
	PrimaryGoal         *string   `json:"primaryGoal"`
	TargetWeightKg      *float64  `json:"targetWeightKg"`
	BodyCondition       *string   `json:"bodyCondition"`
	BodyFatPercent      *float64  `json:"bodyFatPercent"`
	MedicalHistory      *string   `json:"medicalHistory"`
	Injuries            *string   `json:"injuries"`
	PhysicalLimitations *string   `json:"physicalLimitations"`
}

// MeOrderItemDTO for order items (type, refId, title, qty, price).
type MeOrderItemDTO struct {
	Type   string `json:"type"`
	RefID  string `json:"refId"`
	Title  string `json:"title"`
	Qty    int    `json:"qty"`
	Price  int64  `json:"price"`
}

// MeOrderDTO matches frontend OrderCardLink / OrderDetailsPanel.
type MeOrderDTO struct {
	ID              uint            `json:"id"`
	CreatedAt       time.Time       `json:"createdAt"`
	Status          string          `json:"status"`
	PaymentMethod   string          `json:"paymentMethod"`
	TrackingCode    string          `json:"trackingCode"`
	Items           []MeOrderItemDTO `json:"items"`
	DiscountPercent int             `json:"discountPercent"`
	Note            string          `json:"note"`
	CoachName       string          `json:"coachName,omitempty"`
}

// MeOrderListResponse for GET /me/orders.
type MeOrderListResponse struct {
	Items    []MeOrderDTO `json:"items"`
	Page     int          `json:"page"`
	PageSize int          `json:"pageSize"`
	Total    int64        `json:"total"`
}

// MeProgramDTO for GET /me/programs list (id, title, type, status, startDate, durationDays, remainingDays, price).
type MeProgramDTO struct {
	ID            uint      `json:"id"`
	Title         string    `json:"title"`
	Type          string    `json:"type"`
	Status        string    `json:"status"`
	StartDate     time.Time `json:"startDate"`
	DurationDays  int       `json:"durationDays"`
	RemainingDays int       `json:"remainingDays"`
	Price         int64     `json:"price"`
	CoachID       uint      `json:"coachId,omitempty"`
	CoachName     string    `json:"coachName,omitempty"`
	CoachSlug     string    `json:"coachSlug,omitempty"`
}

// MeProgramsResponse for GET /me/programs.
type MeProgramsResponse struct {
	Programs []MeProgramDTO `json:"programs"`
}

// MeProgramDetailDTO for GET /me/programs/:id (with schedule, planByDay - optional).
type MeProgramDetailDTO struct {
	MeProgramDTO
	Goal       string                 `json:"goal,omitempty"`
	Level      string                 `json:"level,omitempty"`
	Coach      string                 `json:"coach,omitempty"`
	Tags       []string               `json:"tags,omitempty"`
	Schedule   *MeScheduleDTO         `json:"schedule,omitempty"`
	PlanByDay  map[string]MeDayPlanDTO `json:"planByDay,omitempty"`
}

type MeScheduleDTO struct {
	Weekly   []string `json:"weekly"`
	RestDays []string `json:"restDays"`
}

type MeDayPlanDTO struct {
	Workout  *MeWorkoutDTO  `json:"workout,omitempty"`
	Nutrition *MeNutritionDTO `json:"nutrition,omitempty"`
}

type MeWorkoutSetDTO struct {
	SetNumber int    `json:"setNumber"`
	Reps      string `json:"reps,omitempty"`
	IsAMRAP   bool   `json:"isAmrap,omitempty"`
}

type MeWorkoutExerciseDTO struct {
	ExerciseID        uint              `json:"exerciseId,omitempty"`
	Name              string            `json:"name"`
	Sets              int               `json:"sets,omitempty"`
	Reps              string            `json:"reps,omitempty"`
	SetsDetails       []MeWorkoutSetDTO `json:"setsDetails,omitempty"`
	SupersetID        *string           `json:"supersetId,omitempty"`
	WorkoutSystemType string            `json:"workoutSystemType,omitempty"`
	ImageURL         string   `json:"imageUrl,omitempty"`
	GifURL           string   `json:"gifUrl,omitempty"`
	Category         string   `json:"category,omitempty"`
	BodyPart         string   `json:"bodyPart,omitempty"`
	Equipment        string   `json:"equipment,omitempty"`
	Target           string   `json:"target,omitempty"`
	Description      string   `json:"description,omitempty"`
	InstructionSteps []string `json:"instructionSteps,omitempty"`
}

type MeWorkoutDTO struct {
	Title       string                 `json:"title"`
	DurationMin int                    `json:"durationMin"`
	Calories    int                    `json:"calories"`
	Steps       []string               `json:"steps"`
	Exercises   []MeWorkoutExerciseDTO `json:"exercises,omitempty"`
}

type MeNutritionDTO struct {
	CaloriesTarget  int           `json:"caloriesTarget"`
	ProteinTarget   string        `json:"proteinTarget"`
	Meals           []MeMealDTO  `json:"meals"`
}

type MeMealDTO struct {
	Title      string   `json:"title"`
	Detail     string   `json:"detail"`
	FoodID     uint     `json:"foodId,omitempty"`
	Multiplier float64  `json:"multiplier,omitempty"`
	Unit       string   `json:"unit,omitempty"`
	Amount     float64  `json:"amount,omitempty"`
	Calories   float64  `json:"calories,omitempty"`
	Protein    float64  `json:"protein,omitempty"`
	Carbs      float64  `json:"carbs,omitempty"`
	Fat        float64  `json:"fat,omitempty"`
	Fiber      *float64 `json:"fiber,omitempty"`
	Sugar      *float64 `json:"sugar,omitempty"`
}

type MeService interface {
	GetProfile(ctx context.Context, userID uint) (*MeProfileDTO, error)
	UpdateProfile(ctx context.Context, userID uint, req *MeProfileUpdateRequest) (*MeProfileDTO, error)
	UploadBodyPhoto(ctx context.Context, userID uint, file io.Reader, filename string, photoType string) (*MePhotoDTO, error)
	IsProfileComplete(ctx context.Context, user *models.User) (bool, error)
	ListMyOrders(ctx context.Context, userID uint, page, pageSize int, status string) (*MeOrderListResponse, error)
	GetMyOrderByID(ctx context.Context, userID uint, orderID uint) (*MeOrderDTO, error)
	ListMyPrograms(ctx context.Context, userID uint) (*MeProgramsResponse, error)
	GetMyProgramByID(ctx context.Context, userID uint, programID uint) (*MeProgramDetailDTO, error)
}

type meService struct {
	db           *gorm.DB
	userRepo     repository.UserRepository
	orderRepo    repository.OrderRepository
	subRepo      repository.SubscriptionRepository
	planRepo     repository.ServicePlanRepository
	programRepo  repository.ProgramRepository
	exerciseRepo repository.ExerciseRepository
	foodRepo     repository.FoodRepository
}

func NewMeService(
	db *gorm.DB,
	userRepo repository.UserRepository,
	orderRepo repository.OrderRepository,
	subRepo repository.SubscriptionRepository,
	planRepo repository.ServicePlanRepository,
	programRepo repository.ProgramRepository,
	exerciseRepo repository.ExerciseRepository,
	foodRepo repository.FoodRepository,
) MeService {
	return &meService{
		db:           db,
		userRepo:     userRepo,
		orderRepo:    orderRepo,
		subRepo:      subRepo,
		planRepo:     planRepo,
		programRepo:  programRepo,
		exerciseRepo: exerciseRepo,
		foodRepo:     foodRepo,
	}
}

func meSplitName(name string) (first, last string) {
	parts := strings.Fields(strings.TrimSpace(name))
	if len(parts) == 0 {
		return "", ""
	}
	if len(parts) == 1 {
		return parts[0], ""
	}
	return parts[0], strings.Join(parts[1:], " ")
}

func (s *meService) GetProfile(ctx context.Context, userID uint) (*MeProfileDTO, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return s.buildProfileDTO(ctx, user)
}

func (s *meService) buildProfileDTO(ctx context.Context, user *models.User) (*MeProfileDTO, error) {
	first, last := meSplitName(user.Name)

	programsCount, _ := s.subRepo.CountByUserID(ctx, user.ID)

	var ordersCount int64
	s.db.WithContext(ctx).Model(&models.Order{}).Where("user_id = ?", user.ID).Count(&ordersCount)

	initialPhotos, allPhotos := s.loadUserPhotos(ctx, user.ID)
	photoDTOs := mePhotosToDTO(allPhotos)

	complete, err := s.isProfileCompleteFromData(user, initialPhotos)
	if err != nil {
		return nil, err
	}

	var assignedCoachID *uint
	var assignedCoachName, assignedCoachSlug string
	if user.AssignedCoachID != nil && *user.AssignedCoachID > 0 {
		assignedCoachID = user.AssignedCoachID
		assignedCoachName, assignedCoachSlug = s.resolveCoachInfo(ctx, *user.AssignedCoachID)
	}

	var birthDate *string
	if user.BirthDate != nil {
		formatted := user.BirthDate.Format("2006-01-02")
		birthDate = &formatted
	}

	return &MeProfileDTO{
		ID:                  user.ID,
		FirstName:           first,
		LastName:            last,
		Phone:               user.Phone,
		Email:               user.Email,
		HeightCm:            user.HeightCm,
		WeightKg:            user.WeightKg,
		BirthDate:           birthDate,
		NationalID:          user.NationalID,
		Gender:              user.Gender,
		Goals:               user.GetGoals(),
		PrimaryGoal:         user.PrimaryGoal,
		TargetWeightKg:      user.TargetWeightKg,
		BodyCondition:       user.BodyCondition,
		BodyFatPercent:      user.BodyFatPercent,
		MedicalHistory:      user.MedicalHistory,
		Injuries:            user.Injuries,
		PhysicalLimitations: user.PhysicalLimitations,
		IsProfileComplete:   complete,
		Photos:              photoDTOs,
		ProgramsCount:       programsCount,
		OrdersCount:         ordersCount,
		AssignedCoachID:     assignedCoachID,
		AssignedCoachName:   assignedCoachName,
		AssignedCoachSlug:   assignedCoachSlug,
		CreatedAt:           user.CreatedAt,
	}, nil
}

func (s *meService) loadUserPhotos(ctx context.Context, userID uint) (initial []models.UserPhoto, all []models.UserPhoto) {
	s.db.WithContext(ctx).Where("user_id = ?", userID).Order("uploaded_at DESC").Find(&all)
	for _, p := range all {
		if p.CheckInDate == nil {
			initial = append(initial, p)
		}
	}
	return initial, all
}

func mePhotosToDTO(photos []models.UserPhoto) []MePhotoDTO {
	photoDTOs := make([]MePhotoDTO, 0, len(photos))
	for _, p := range photos {
		name := p.Type
		if name == "" {
			name = "Photo"
		}
		photoDTOs = append(photoDTOs, MePhotoDTO{
			ID:   p.ID,
			URL:  p.FilePath,
			Name: name,
			Type: strings.ToLower(strings.TrimSpace(p.Type)),
		})
	}
	return photoDTOs
}

func (s *meService) IsProfileComplete(ctx context.Context, user *models.User) (bool, error) {
	if user == nil {
		return false, nil
	}
	if user.Role != models.RoleStudent {
		return true, nil
	}
	initialPhotos, _ := s.loadUserPhotos(ctx, user.ID)
	return s.isProfileCompleteFromData(user, initialPhotos)
}

func (s *meService) isProfileCompleteFromData(user *models.User, initialPhotos []models.UserPhoto) (bool, error) {
	return models.IsStudentProfileComplete(user, initialPhotos), nil
}

func (s *meService) UpdateProfile(ctx context.Context, userID uint, req *MeProfileUpdateRequest) (*MeProfileDTO, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if req.FirstName != nil || req.LastName != nil {
		first, last := meSplitName(user.Name)
		if req.FirstName != nil {
			first = strings.TrimSpace(*req.FirstName)
		}
		if req.LastName != nil {
			last = strings.TrimSpace(*req.LastName)
		}
		if first == "" || last == "" {
			return nil, fmt.Errorf("%w: firstName and lastName are required", ErrInvalidProfileField)
		}
		user.Name = strings.TrimSpace(first + " " + last)
	}
	if req.HeightCm != nil {
		if *req.HeightCm < 80 || *req.HeightCm > 250 {
			return nil, fmt.Errorf("%w: heightCm must be between 80 and 250", ErrInvalidProfileField)
		}
		user.HeightCm = req.HeightCm
	}
	if req.WeightKg != nil {
		if *req.WeightKg < 20 || *req.WeightKg > 300 {
			return nil, fmt.Errorf("%w: weightKg must be between 20 and 300", ErrInvalidProfileField)
		}
		user.WeightKg = req.WeightKg
	}
	if req.BirthDate != nil {
		parsed, err := time.Parse("2006-01-02", strings.TrimSpace(*req.BirthDate))
		if err != nil {
			return nil, fmt.Errorf("%w: birthDate must be YYYY-MM-DD", ErrInvalidProfileField)
		}
		age := time.Now().Year() - parsed.Year()
		if age < 13 || age > 100 {
			return nil, fmt.Errorf("%w: birthDate is out of allowed range", ErrInvalidProfileField)
		}
		user.BirthDate = &parsed
	}
	if req.NationalID != nil {
		nid := strings.TrimSpace(*req.NationalID)
		if !models.IsValidIranNationalID(nid) {
			return nil, fmt.Errorf("%w: nationalId is invalid", ErrInvalidProfileField)
		}
		user.NationalID = nid
	}
	if req.Gender != nil {
		gender := strings.TrimSpace(*req.Gender)
		if !containsMeString(models.ValidGenders, gender) {
			return nil, fmt.Errorf("%w: gender must be male or female", ErrInvalidProfileField)
		}
		user.Gender = gender
	}
	if req.Goals != nil {
		if len(*req.Goals) == 0 {
			return nil, fmt.Errorf("%w: at least one goal is required", ErrInvalidProfileField)
		}
		for _, goal := range *req.Goals {
			if !containsMeString(models.ValidGoalTags, strings.TrimSpace(goal)) {
				return nil, fmt.Errorf("%w: invalid goal value", ErrInvalidProfileField)
			}
		}
		if err := user.SetGoals(*req.Goals); err != nil {
			return nil, err
		}
	}
	if req.PrimaryGoal != nil {
		primary := strings.TrimSpace(*req.PrimaryGoal)
		if primary == "" {
			return nil, fmt.Errorf("%w: primaryGoal is required", ErrInvalidProfileField)
		}
		user.PrimaryGoal = primary
	}
	if req.TargetWeightKg != nil {
		if *req.TargetWeightKg < 20 || *req.TargetWeightKg > 300 {
			return nil, fmt.Errorf("%w: targetWeightKg must be between 20 and 300", ErrInvalidProfileField)
		}
		user.TargetWeightKg = req.TargetWeightKg
	}
	if req.BodyCondition != nil {
		condition := strings.TrimSpace(*req.BodyCondition)
		if !containsMeString(models.ValidBodyConditions, condition) {
			return nil, fmt.Errorf("%w: invalid bodyCondition", ErrInvalidProfileField)
		}
		user.BodyCondition = condition
	}
	if req.BodyFatPercent != nil {
		if *req.BodyFatPercent < 1 || *req.BodyFatPercent > 60 {
			return nil, fmt.Errorf("%w: bodyFatPercent must be between 1 and 60", ErrInvalidProfileField)
		}
		user.BodyFatPercent = req.BodyFatPercent
	}
	if req.MedicalHistory != nil {
		user.MedicalHistory = strings.TrimSpace(*req.MedicalHistory)
	}
	if req.Injuries != nil {
		user.Injuries = strings.TrimSpace(*req.Injuries)
	}
	if req.PhysicalLimitations != nil {
		user.PhysicalLimitations = strings.TrimSpace(*req.PhysicalLimitations)
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}
	return s.GetProfile(ctx, userID)
}

func containsMeString(list []string, value string) bool {
	for _, item := range list {
		if item == value {
			return true
		}
	}
	return false
}

func (s *meService) UploadBodyPhoto(ctx context.Context, userID uint, file io.Reader, filename string, photoType string) (*MePhotoDTO, error) {
	photoType = strings.ToLower(strings.TrimSpace(photoType))
	if !containsMeString(models.RequiredBodyPhotoTypes, photoType) {
		return nil, ErrInvalidPhotoType
	}

	if _, err := s.userRepo.FindByID(ctx, userID); err != nil {
		return nil, err
	}

	baseDir := meGetUploadDir()
	relDir := filepath.Join("users", fmt.Sprintf("%d", userID))
	dir := filepath.Join(baseDir, relDir)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("creating upload dir: %w", err)
	}

	ext := filepath.Ext(filename)
	if ext == "" {
		ext = ".jpg"
	}
	uniqueName := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	fullPath := filepath.Join(dir, uniqueName)

	dst, err := os.Create(fullPath)
	if err != nil {
		return nil, fmt.Errorf("creating file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		_ = os.Remove(fullPath)
		return nil, fmt.Errorf("writing file: %w", err)
	}

	urlPath := "/" + filepath.ToSlash(filepath.Join("uploads", relDir, uniqueName))

	// Replace existing initial photo of the same type.
	var existing models.UserPhoto
	if err := s.db.WithContext(ctx).
		Where("user_id = ? AND type = ? AND check_in_date IS NULL", userID, photoType).
		First(&existing).Error; err == nil {
		meRemovePhotoFile(existing.FilePath)
		_ = s.db.WithContext(ctx).Delete(&existing).Error
	}

	photo := models.UserPhoto{
		UserID:     userID,
		FilePath:   urlPath,
		Type:       photoType,
		UploadedAt: time.Now(),
	}
	if err := s.db.WithContext(ctx).Create(&photo).Error; err != nil {
		_ = os.Remove(fullPath)
		return nil, err
	}

	return &MePhotoDTO{
		ID:   photo.ID,
		URL:  photo.FilePath,
		Name: photo.Type,
		Type: photo.Type,
	}, nil
}

func meGetUploadDir() string {
	dir := config.GetUploadDir()
	if dir == "" {
		dir = "uploads"
	}
	return dir
}

func meRemovePhotoFile(urlPath string) {
	baseDir := meGetUploadDir()
	relPath := strings.TrimPrefix(urlPath, "/")
	fullPath := filepath.Join(baseDir, filepath.FromSlash(relPath))
	_ = os.Remove(fullPath)
}

func (s *meService) ListMyOrders(ctx context.Context, userID uint, page, pageSize int, status string) (*MeOrderListResponse, error) {
	orders, total, err := s.orderRepo.ListByUserID(ctx, userID, page, pageSize, status)
	if err != nil {
		return nil, err
	}
	items := make([]MeOrderDTO, 0, len(orders))
	for i := range orders {
		o := &orders[i]
		itemDTOs, _ := s.orderItemsToDTO(ctx, o.ID)
		items = append(items, MeOrderDTO{
			ID:              o.ID,
			CreatedAt:       o.CreatedAt,
			Status:          o.Status,
			PaymentMethod:   o.PaymentMethod,
			TrackingCode:    o.TrackingCode,
			Items:           itemDTOs,
			DiscountPercent: o.DiscountPercent,
			Note:            o.Note,
			CoachName:       s.resolveCoachName(ctx, o.CoachID),
		})
	}
	return &MeOrderListResponse{Items: items, Page: page, PageSize: pageSize, Total: total}, nil
}

func (s *meService) orderItemsToDTO(ctx context.Context, orderID uint) ([]MeOrderItemDTO, error) {
	items, err := s.orderRepo.GetOrderItems(ctx, orderID)
	if err != nil {
		return nil, err
	}
	out := make([]MeOrderItemDTO, 0, len(items))
	for _, it := range items {
		refID := it.RefID
		if refID == "" && it.PlanID > 0 {
			refID = fmt.Sprintf("p%d", it.PlanID)
		}
		out = append(out, MeOrderItemDTO{
			Type:  it.ItemType,
			RefID: refID,
			Title: it.Title,
			Qty:   it.Qty,
			Price: it.UnitPriceCents,
		})
	}
	return out, nil
}

func (s *meService) GetMyOrderByID(ctx context.Context, userID uint, orderID uint) (*MeOrderDTO, error) {
	o, err := s.orderRepo.GetByIDAndUserID(ctx, orderID, userID)
	if err != nil {
		return nil, err
	}
	itemDTOs, _ := s.orderItemsToDTO(ctx, o.ID)
	return &MeOrderDTO{
		ID:              o.ID,
		CreatedAt:       o.CreatedAt,
		Status:          o.Status,
		PaymentMethod:   o.PaymentMethod,
		TrackingCode:    o.TrackingCode,
		Items:           itemDTOs,
		DiscountPercent: o.DiscountPercent,
		Note:            o.Note,
		CoachName:       s.resolveCoachName(ctx, o.CoachID),
	}, nil
}

func (s *meService) resolveCoachInfo(ctx context.Context, coachUserID uint) (name, slug string) {
	if coachUserID == 0 {
		return "", ""
	}
	var profile models.CoachProfile
	if err := s.db.WithContext(ctx).Where("user_id = ?", coachUserID).First(&profile).Error; err == nil {
		if profile.DisplayName != "" {
			name = profile.DisplayName
		}
		slug = profile.Slug
	}
	if name == "" {
		user, err := s.userRepo.FindByID(ctx, coachUserID)
		if err == nil {
			name = user.Name
		}
	}
	return name, slug
}

func (s *meService) resolveCoachName(ctx context.Context, coachUserID uint) string {
	name, _ := s.resolveCoachInfo(ctx, coachUserID)
	return name
}

func (s *meService) ListMyPrograms(ctx context.Context, userID uint) (*MeProgramsResponse, error) {
	now := time.Now()
	var subs []models.Subscription
	if err := s.db.WithContext(ctx).Where("user_id = ?", userID).Order("starts_at DESC").Find(&subs).Error; err != nil {
		return nil, err
	}
	programs := make([]MeProgramDTO, 0, len(subs))
	for i := range subs {
		sub := &subs[i]
		plan, err := s.planRepo.FindByID(ctx, sub.ServicePlanID)
		if err != nil {
			continue
		}
		status := "ended"
		if sub.EndsAt == nil || sub.EndsAt.After(now) {
			status = "active"
		}
		duration := plan.DurationDays
		if duration <= 0 && sub.EndsAt != nil {
			duration = int(sub.EndsAt.Sub(sub.StartsAt).Hours() / 24)
		}
		remaining := 0
		if status == "active" && duration > 0 {
			daysPassed := int(now.Sub(sub.StartsAt).Hours() / 24)
			if daysPassed < 0 {
				daysPassed = 0
			}
			if daysPassed < duration {
				remaining = duration - daysPassed
			}
		}
		coachName, coachSlug := s.resolveCoachInfo(ctx, sub.CoachID)
		programs = append(programs, MeProgramDTO{
			ID:            sub.ID,
			Title:         plan.Name,
			Type:          plan.Type,
			Status:        status,
			StartDate:     sub.StartsAt,
			DurationDays:  duration,
			RemainingDays: remaining,
			Price:         plan.PriceCents,
			CoachID:       sub.CoachID,
			CoachName:     coachName,
			CoachSlug:     coachSlug,
		})
	}
	return &MeProgramsResponse{Programs: programs}, nil
}

func (s *meService) GetMyProgramByID(ctx context.Context, userID uint, programID uint) (*MeProgramDetailDTO, error) {
	var sub models.Subscription
	if err := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", programID, userID).First(&sub).Error; err != nil {
		return nil, err
	}
	plan, err := s.planRepo.FindByID(ctx, sub.ServicePlanID)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	status := "ended"
	if sub.EndsAt == nil || sub.EndsAt.After(now) {
		status = "active"
	}
	duration := plan.DurationDays
	if duration <= 0 && sub.EndsAt != nil {
		duration = int(sub.EndsAt.Sub(sub.StartsAt).Hours() / 24)
	}
	remaining := 0
	if status == "active" && duration > 0 {
		daysPassed := int(now.Sub(sub.StartsAt).Hours() / 24)
		if daysPassed < 0 {
			daysPassed = 0
		}
		if daysPassed < duration {
			remaining = duration - daysPassed
		}
	}
	coachName, coachSlug := s.resolveCoachInfo(ctx, sub.CoachID)

	var workoutItems []models.ProgramItem
	var nutritionItems []models.NutritionItem
	if wp, err := s.programRepo.FindActiveWorkoutBySubscriptionID(ctx, sub.ID); err == nil && wp != nil {
		workoutItems, _ = s.programRepo.FindWorkoutItemsByProgramID(ctx, wp.ID)
	}
	if np, err := s.programRepo.FindActiveNutritionBySubscriptionID(ctx, sub.ID); err == nil && np != nil {
		nutritionItems, _ = s.programRepo.FindNutritionItemsByProgramID(ctx, np.ID)
	}
	planByDay, schedule := buildFullPlanByDay(workoutItems, nutritionItems)
	planByDay = enrichWorkoutPlan(ctx, s.exerciseRepo, planByDay)
	planByDay = enrichNutritionPlan(ctx, s.foodRepo, planByDay)
	if schedule == nil {
		schedule = &MeScheduleDTO{Weekly: []string{}, RestDays: []string{}}
	}

	detail := &MeProgramDetailDTO{
		MeProgramDTO: MeProgramDTO{
			ID:            sub.ID,
			Title:         plan.Name,
			Type:          plan.Type,
			Status:        status,
			StartDate:     sub.StartsAt,
			DurationDays:  duration,
			RemainingDays: remaining,
			Price:         plan.PriceCents,
			CoachID:       sub.CoachID,
			CoachName:     coachName,
			CoachSlug:     coachSlug,
		},
		Goal:      plan.Description,
		Level:     "",
		Coach:     coachName,
		Tags:      nil,
		Schedule:  schedule,
		PlanByDay: planByDay,
	}
	return detail, nil
}
