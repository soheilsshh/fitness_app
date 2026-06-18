package repository

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type TicketRepository interface {
	Create(ctx context.Context, t *models.Ticket) error
	ListByStudentID(ctx context.Context, studentID uint, page, pageSize int) ([]models.Ticket, int64, error)
	GetByIDAndStudentID(ctx context.Context, id, studentID uint) (*models.Ticket, error)
	ListByCoachID(ctx context.Context, coachID uint, page, pageSize int, status string) ([]models.Ticket, int64, error)
	GetByIDAndCoachID(ctx context.Context, id, coachID uint) (*models.Ticket, error)
	Answer(ctx context.Context, id, coachID uint, answer string) error
	UpdateStatus(ctx context.Context, id, coachID uint, status string) error
}

type ticketRepository struct {
	db *gorm.DB
}

func NewTicketRepository(db *gorm.DB) TicketRepository {
	return &ticketRepository{db: db}
}

func (r *ticketRepository) Create(ctx context.Context, t *models.Ticket) error {
	return r.db.WithContext(ctx).Create(t).Error
}

func (r *ticketRepository) ListByStudentID(ctx context.Context, studentID uint, page, pageSize int) ([]models.Ticket, int64, error) {
	db := r.db.WithContext(ctx).Model(&models.Ticket{}).Where("student_id = ?", studentID)
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize
	var list []models.Ticket
	if err := db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *ticketRepository) GetByIDAndStudentID(ctx context.Context, id, studentID uint) (*models.Ticket, error) {
	var t models.Ticket
	if err := r.db.WithContext(ctx).Where("id = ? AND student_id = ?", id, studentID).First(&t).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *ticketRepository) ListByCoachID(ctx context.Context, coachID uint, page, pageSize int, status string) ([]models.Ticket, int64, error) {
	db := r.db.WithContext(ctx).Model(&models.Ticket{}).Where("coach_id = ?", coachID)
	if status != "" {
		db = db.Where("status = ?", status)
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize
	var list []models.Ticket
	if err := db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *ticketRepository) GetByIDAndCoachID(ctx context.Context, id, coachID uint) (*models.Ticket, error) {
	var t models.Ticket
	if err := r.db.WithContext(ctx).Where("id = ? AND coach_id = ?", id, coachID).First(&t).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *ticketRepository) Answer(ctx context.Context, id, coachID uint, answer string) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&models.Ticket{}).
		Where("id = ? AND coach_id = ?", id, coachID).
		Updates(map[string]any{
			"answer":      answer,
			"answered_at": &now,
			"status":      "answered",
		}).Error
}

func (r *ticketRepository) UpdateStatus(ctx context.Context, id, coachID uint, status string) error {
	return r.db.WithContext(ctx).
		Model(&models.Ticket{}).
		Where("id = ? AND coach_id = ?", id, coachID).
		Update("status", status).Error
}

