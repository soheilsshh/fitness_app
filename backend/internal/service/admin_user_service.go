package service

import (
	"context"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

type AdminUserSummary struct {
	ID            uint      `json:"id"`
	FirstName     string    `json:"firstName"`
	LastName      string    `json:"lastName"`
	Phone         string    `json:"phone"`
	ActiveProgram bool      `json:"activeProgram"`
	ProgramsCount int64     `json:"programsCount"`
	OrdersCount   int64     `json:"ordersCount"`
	CreatedAt     time.Time `json:"createdAt"`
}

type AdminUserProgram struct {
	ID            uint      `json:"id"`
	Title         string    `json:"title"`
	Type          string    `json:"type"` // workout | nutrition | both
	Status        string    `json:"status"`
	StartDate     time.Time `json:"startDate"`
	DurationDays  int       `json:"durationDays"`
	RemainingDays int       `json:"remainingDays"`
	Price         int64     `json:"price"`
}

type AdminUserBody struct {
	HeightCm *float64           `json:"heightCm"`
	WeightKg *float64           `json:"weightKg"`
	Photos   []AdminUserPhoto   `json:"photos"`
}

type AdminUserPhoto struct {
	ID   uint   `json:"id"`
	URL  string `json:"url"`
	Name string `json:"name"`
}

type AdminUserDetails struct {
	User     AdminUserSummary  `json:"user"`
	Programs []AdminUserProgram `json:"programs"`
	Body     AdminUserBody      `json:"body"`
}

type AdminUserService interface {
	ListUsers(ctx context.Context, page, pageSize int, query, status string) ([]AdminUserSummary, int64, error)
	GetUserDetails(ctx context.Context, id uint) (*AdminUserDetails, error)
	GetUserPrograms(ctx context.Context, id uint) ([]AdminUserProgram, error)
	GetUserBody(ctx context.Context, id uint) (*AdminUserBody, error)
}

type adminUserService struct {
	db            *gorm.DB
	subRepo       repository.SubscriptionRepository
	txRepo        repository.TransactionRepository
}

func NewAdminUserService(
	db *gorm.DB,
	subRepo repository.SubscriptionRepository,
	txRepo repository.TransactionRepository,
) AdminUserService {
	return &adminUserService{
		db:      db,
		subRepo: subRepo,
		txRepo:  txRepo,
	}
}

func splitName(full string) (first, last string) {
	full = strings.TrimSpace(full)
	if full == "" {
		return "", ""
	}
	parts := strings.Fields(full)
	if len(parts) == 1 {
		return parts[0], ""
	}
	return parts[0], strings.Join(parts[1:], " ")
}

func (s *adminUserService) ListUsers(ctx context.Context, page, pageSize int, query, status string) ([]AdminUserSummary, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 8
	}

	var users []models.User
	dbq := s.db.WithContext(ctx).Model(&models.User{})

	// Optional search on name or phone
	if q := strings.TrimSpace(query); q != "" {
		like := "%" + q + "%"
		dbq = dbq.Where("name LIKE ? OR phone LIKE ?", like, like)
	}

	if err := dbq.Order("created_at DESC").Find(&users).Error; err != nil {
		return nil, 0, err
	}

	now := time.Now()
	filtered := make([]AdminUserSummary, 0, len(users))

	for i := range users {
		u := users[i]

		// compute activeProgram and programsCount from subscriptions
		activeSub, err := s.subRepo.FindCurrentByUserID(ctx, u.ID, now)
		active := err == nil && activeSub != nil

		progCount, err := s.subRepo.CountByUserID(ctx, u.ID)
		if err != nil {
			return nil, 0, err
		}

		ordersCount, err := s.txRepo.CountByUserID(ctx, u.ID)
		if err != nil {
			return nil, 0, err
		}

		summary := AdminUserSummary{
			ID:            u.ID,
			Phone:         u.Phone,
			ActiveProgram: active,
			ProgramsCount: progCount,
			OrdersCount:   ordersCount,
			CreatedAt:     u.CreatedAt,
		}
		summary.FirstName, summary.LastName = splitName(u.Name)

		// status filter: all | active | inactive
		switch status {
		case "active":
			if !summary.ActiveProgram {
				continue
			}
		case "inactive":
			if summary.ActiveProgram {
				continue
			}
		}

		filtered = append(filtered, summary)
	}

	total := int64(len(filtered))

	// apply pagination in memory
	start := (page - 1) * pageSize
	if start >= len(filtered) {
		return []AdminUserSummary{}, total, nil
	}
	end := start + pageSize
	if end > len(filtered) {
		end = len(filtered)
	}
	return filtered[start:end], total, nil
}

func (s *adminUserService) GetUserDetails(ctx context.Context, id uint) (*AdminUserDetails, error) {
	var user models.User
	if err := s.db.WithContext(ctx).First(&user, id).Error; err != nil {
		return nil, err
	}

	now := time.Now()
	progCount, err := s.subRepo.CountByUserID(ctx, user.ID)
	if err != nil {
		return nil, err
	}
	activeSub, err := s.subRepo.FindCurrentByUserID(ctx, user.ID, now)
	active := err == nil && activeSub != nil

	ordersCount, err := s.txRepo.CountByUserID(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	first, last := splitName(user.Name)
	summary := AdminUserSummary{
		ID:            user.ID,
		FirstName:     first,
		LastName:      last,
		Phone:         user.Phone,
		ActiveProgram: active,
		ProgramsCount: progCount,
		OrdersCount:   ordersCount,
		CreatedAt:     user.CreatedAt,
	}

	// Build programs from all subscriptions
	var subs []models.Subscription
	if err := s.db.WithContext(ctx).
		Where("user_id = ?", user.ID).
		Order("starts_at DESC").
		Find(&subs).Error; err != nil {
		return nil, err
	}

	var programs []AdminUserProgram
	for i := range subs {
		sub := subs[i]
		var plan models.ServicePlan
		if err := s.db.WithContext(ctx).First(&plan, sub.ServicePlanID).Error; err != nil {
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

		programs = append(programs, AdminUserProgram{
			ID:            sub.ID,
			Title:         plan.Name,
			Type:          plan.Type,
			Status:        status,
			StartDate:     sub.StartsAt,
			DurationDays:  duration,
			RemainingDays: remaining,
			Price:         plan.PriceCents,
		})
	}

	// Build basic body info from latest check-in and photos
	var latestCheck models.CheckIn
	var hasCheck bool
	if err := s.db.WithContext(ctx).
		Where("user_id = ?", user.ID).
		Order("check_in_date DESC").
		First(&latestCheck).Error; err == nil {
		hasCheck = true
	}

	var weightPtr *float64
	if hasCheck {
		w := latestCheck.Weight
		weightPtr = &w
	}

	var photosDB []models.UserPhoto
	if err := s.db.WithContext(ctx).
		Where("user_id = ?", user.ID).
		Order("uploaded_at DESC").
		Find(&photosDB).Error; err != nil {
		return nil, err
	}

	photos := make([]AdminUserPhoto, 0, len(photosDB))
	for _, p := range photosDB {
		name := p.Type
		if strings.TrimSpace(name) == "" {
			name = "Photo"
		}
		photos = append(photos, AdminUserPhoto{
			ID:   p.ID,
			URL:  p.FilePath,
			Name: name,
		})
	}

	body := AdminUserBody{
		HeightCm: nil, // height is not tracked yet
		WeightKg: weightPtr,
		Photos:   photos,
	}

	return &AdminUserDetails{
		User:     summary,
		Programs: programs,
		Body:     body,
	}, nil
}

// GetUserPrograms returns only the program list for a user (used by admin endpoints).
func (s *adminUserService) GetUserPrograms(ctx context.Context, id uint) ([]AdminUserProgram, error) {
	now := time.Now()

	var subs []models.Subscription
	if err := s.db.WithContext(ctx).
		Where("user_id = ?", id).
		Order("starts_at DESC").
		Find(&subs).Error; err != nil {
		return nil, err
	}

	var programs []AdminUserProgram
	for i := range subs {
		sub := subs[i]
		var plan models.ServicePlan
		if err := s.db.WithContext(ctx).First(&plan, sub.ServicePlanID).Error; err != nil {
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

		programs = append(programs, AdminUserProgram{
			ID:            sub.ID,
			Title:         plan.Name,
			Type:          plan.Type,
			Status:        status,
			StartDate:     sub.StartsAt,
			DurationDays:  duration,
			RemainingDays: remaining,
			Price:         plan.PriceCents,
		})
	}

	return programs, nil
}

// GetUserBody returns only body/measurements & photos for a user (used by admin endpoints).
func (s *adminUserService) GetUserBody(ctx context.Context, id uint) (*AdminUserBody, error) {
	// latest check-in for weight
	var latestCheck models.CheckIn
	var hasCheck bool
	if err := s.db.WithContext(ctx).
		Where("user_id = ?", id).
		Order("check_in_date DESC").
		First(&latestCheck).Error; err == nil {
		hasCheck = true
	}

	var weightPtr *float64
	if hasCheck {
		w := latestCheck.Weight
		weightPtr = &w
	}

	// photos
	var photosDB []models.UserPhoto
	if err := s.db.WithContext(ctx).
		Where("user_id = ?", id).
		Order("uploaded_at DESC").
		Find(&photosDB).Error; err != nil {
		return nil, err
	}

	photos := make([]AdminUserPhoto, 0, len(photosDB))
	for _, p := range photosDB {
		name := p.Type
		if strings.TrimSpace(name) == "" {
			name = "Photo"
		}
		photos = append(photos, AdminUserPhoto{
			ID:   p.ID,
			URL:  p.FilePath,
			Name: name,
		})
	}

	body := &AdminUserBody{
		HeightCm: nil,
		WeightKg: weightPtr,
		Photos:   photos,
	}

	return body, nil
}

