package service

import (
	"context"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

// AdminStudentItem matches frontend StudentsClient list item.
type AdminStudentItem struct {
	ID        uint     `json:"id"`
	FullName  string   `json:"fullName"`
	Phone     string   `json:"phone"`
	Status    string   `json:"status"`    // "pending" | "active"
	PlanTitle string   `json:"planTitle"`
	PlanType  string   `json:"planType"` // "workout" | "nutrition" | "both"
	Weekly    []string `json:"weekly"`
	RestDays  []string `json:"restDays"`
}

// AdminStudentDetail extends item with optional fields for detail page.
type AdminStudentDetail struct {
	AdminStudentItem
	StartDate     *time.Time `json:"startDate,omitempty"`
	DurationDays  int        `json:"durationDays,omitempty"`
	RemainingDays int        `json:"remainingDays,omitempty"`
}

// AdminStudentListResponse for GET /admin/students.
type AdminStudentListResponse struct {
	Items    []AdminStudentItem `json:"items"`
	Page     int                `json:"page"`
	PageSize int                `json:"pageSize"`
	Total    int64              `json:"total"`
}

// AdminStudentPatchRequest for PATCH /admin/students/:id.
type AdminStudentPatchRequest struct {
	Status *string `json:"status"` // "pending" | "active"
	PlanID *uint   `json:"planId"`
}

type AdminStudentService interface {
	ListStudents(ctx context.Context, page, pageSize int, status, query string) (*AdminStudentListResponse, error)
	GetStudentByID(ctx context.Context, id uint) (*AdminStudentDetail, error)
	UpdateStudent(ctx context.Context, id uint, req *AdminStudentPatchRequest) error
}

type adminStudentService struct {
	db       *gorm.DB
	userRepo repository.UserRepository
	subRepo  repository.SubscriptionRepository
	planRepo repository.ServicePlanRepository
}

func NewAdminStudentService(
	db *gorm.DB,
	userRepo repository.UserRepository,
	subRepo repository.SubscriptionRepository,
	planRepo repository.ServicePlanRepository,
) AdminStudentService {
	return &adminStudentService{
		db:       db,
		userRepo: userRepo,
		subRepo:  subRepo,
		planRepo: planRepo,
	}
}

func (s *adminStudentService) ListStudents(ctx context.Context, page, pageSize int, status, query string) (*AdminStudentListResponse, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	db := s.db.WithContext(ctx).Model(&models.User{}).Where("role = ?", "student")

	if q := strings.TrimSpace(query); q != "" {
		like := "%" + q + "%"
		db = db.Where("name LIKE ? OR phone LIKE ?", like, like)
	}

	now := time.Now()
	switch status {
	case "active":
		db = db.Where("id IN (SELECT DISTINCT user_id FROM subscriptions WHERE ends_at IS NULL OR ends_at > ?)", now)
	case "pending":
		db = db.Where("id NOT IN (SELECT DISTINCT user_id FROM subscriptions WHERE ends_at IS NULL OR ends_at > ?)", now)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}

	var users []models.User
	offset := (page - 1) * pageSize
	if err := db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
		return nil, err
	}

	items := make([]AdminStudentItem, 0, len(users))
	for i := range users {
		item, err := s.userToStudentItem(ctx, &users[i], now)
		if err != nil {
			continue
		}
		items = append(items, *item)
	}

	return &AdminStudentListResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	}, nil
}

func (s *adminStudentService) userToStudentItem(ctx context.Context, u *models.User, now time.Time) (*AdminStudentItem, error) {
	status := "pending"
	if u.CoachStatus != "" {
		status = u.CoachStatus
	} else {
		_, err := s.subRepo.FindCurrentByUserID(ctx, u.ID, now)
		if err == nil {
			status = "active"
		}
	}

	planTitle := ""
	planType := "both"
	sub, err := s.subRepo.FindCurrentByUserID(ctx, u.ID, now)
	if err == nil && sub != nil {
		plan, err := s.planRepo.FindByID(ctx, sub.ServicePlanID)
		if err == nil && plan != nil {
			planTitle = plan.Name
			planType = plan.Type
			if planType == "" {
				planType = "both"
			}
		}
	}

	return &AdminStudentItem{
		ID:        u.ID,
		FullName:  strings.TrimSpace(u.Name),
		Phone:     u.Phone,
		Status:    status,
		PlanTitle: planTitle,
		PlanType:  planType,
		Weekly:    []string{},
		RestDays:  []string{},
	}, nil
}

func (s *adminStudentService) GetStudentByID(ctx context.Context, id uint) (*AdminStudentDetail, error) {
	var user models.User
	if err := s.db.WithContext(ctx).First(&user, id).Error; err != nil {
		return nil, err
	}
	now := time.Now()
	item, err := s.userToStudentItem(ctx, &user, now)
	if err != nil {
		return nil, err
	}
	detail := &AdminStudentDetail{AdminStudentItem: *item}

	sub, err := s.subRepo.FindCurrentByUserID(ctx, user.ID, now)
	if err == nil && sub != nil {
		detail.StartDate = &sub.StartsAt
		plan, err := s.planRepo.FindByID(ctx, sub.ServicePlanID)
		if err == nil && plan != nil {
			detail.DurationDays = plan.DurationDays
			if sub.EndsAt != nil && sub.EndsAt.After(now) {
				detail.RemainingDays = int(sub.EndsAt.Sub(now).Hours() / 24)
				if detail.RemainingDays < 0 {
					detail.RemainingDays = 0
				}
			}
		}
	}
	return detail, nil
}

func (s *adminStudentService) UpdateStudent(ctx context.Context, id uint, req *AdminStudentPatchRequest) error {
	var user models.User
	if err := s.db.WithContext(ctx).First(&user, id).Error; err != nil {
		return err
	}

	if req.Status != nil {
		statusVal := strings.TrimSpace(*req.Status)
		if statusVal == "pending" || statusVal == "active" {
			if err := s.db.WithContext(ctx).Model(&user).Update("coach_status", statusVal).Error; err != nil {
				return err
			}
		}
	}

	if req.PlanID != nil {
		planID := *req.PlanID
		plan, err := s.planRepo.FindByID(ctx, planID)
		if err != nil {
			return err
		}
		now := time.Now()
		var endAt *time.Time
		if plan != nil && plan.DurationDays > 0 {
			e := now.AddDate(0, 0, plan.DurationDays)
			endAt = &e
		}
		sub := models.Subscription{
			UserID:        id,
			ServicePlanID: planID,
			StartsAt:      now,
			EndsAt:        endAt,
		}
		if err := s.db.WithContext(ctx).Create(&sub).Error; err != nil {
			return err
		}
	}
	return nil
}
