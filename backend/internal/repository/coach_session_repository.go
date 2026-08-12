package repository

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type CoachSessionRepository interface {
	Create(ctx context.Context, s *models.CoachSession) error
	Update(ctx context.Context, s *models.CoachSession) error
	FindByID(ctx context.Context, id uint) (*models.CoachSession, error)
	ListByCoach(ctx context.Context, coachID uint, page, pageSize int) ([]models.CoachSession, int64, error)
	ListByStudent(ctx context.Context, studentID uint, page, pageSize int) ([]models.CoachSession, int64, error)
	Delete(ctx context.Context, id uint) error

	CreateReview(ctx context.Context, r *models.CoachReview) error
	LastReviewAt(ctx context.Context, coachID, studentID uint) (*time.Time, error)
	ListReviews(ctx context.Context, coachID, studentID uint, page, pageSize int) ([]models.CoachReview, int64, error)
}

type coachSessionRepository struct {
	db *gorm.DB
}

func NewCoachSessionRepository(db *gorm.DB) CoachSessionRepository {
	return &coachSessionRepository{db: db}
}

func (r *coachSessionRepository) Create(ctx context.Context, s *models.CoachSession) error {
	return r.db.WithContext(ctx).Create(s).Error
}

func (r *coachSessionRepository) Update(ctx context.Context, s *models.CoachSession) error {
	return r.db.WithContext(ctx).Save(s).Error
}

func (r *coachSessionRepository) FindByID(ctx context.Context, id uint) (*models.CoachSession, error) {
	var s models.CoachSession
	if err := r.db.WithContext(ctx).First(&s, id).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *coachSessionRepository) ListByCoach(ctx context.Context, coachID uint, page, pageSize int) ([]models.CoachSession, int64, error) {
	return r.list(ctx, "coach_id = ?", coachID, page, pageSize)
}

func (r *coachSessionRepository) ListByStudent(ctx context.Context, studentID uint, page, pageSize int) ([]models.CoachSession, int64, error) {
	return r.list(ctx, "student_id = ?", studentID, page, pageSize)
}

func (r *coachSessionRepository) list(ctx context.Context, cond string, arg uint, page, pageSize int) ([]models.CoachSession, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	db := r.db.WithContext(ctx).Model(&models.CoachSession{}).Where(cond, arg)
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * pageSize
	var list []models.CoachSession
	if err := db.Order("scheduled_at ASC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *coachSessionRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.CoachSession{}, id).Error
}

func (r *coachSessionRepository) CreateReview(ctx context.Context, review *models.CoachReview) error {
	return r.db.WithContext(ctx).Create(review).Error
}

func (r *coachSessionRepository) LastReviewAt(ctx context.Context, coachID, studentID uint) (*time.Time, error) {
	var review models.CoachReview
	err := r.db.WithContext(ctx).
		Where("coach_id = ? AND student_id = ?", coachID, studentID).
		Order("created_at DESC").First(&review).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &review.CreatedAt, nil
}

func (r *coachSessionRepository) ListReviews(ctx context.Context, coachID, studentID uint, page, pageSize int) ([]models.CoachReview, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	db := r.db.WithContext(ctx).Model(&models.CoachReview{}).Where("coach_id = ? AND student_id = ?", coachID, studentID)
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * pageSize
	var list []models.CoachReview
	if err := db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}
