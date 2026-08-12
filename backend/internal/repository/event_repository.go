package repository

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type EventRepository interface {
	Create(ctx context.Context, e *models.Event) error
	Update(ctx context.Context, e *models.Event) error
	Delete(ctx context.Context, id uint) error
	FindByID(ctx context.Context, id uint) (*models.Event, error)
	List(ctx context.Context, onlyActive bool, page, pageSize int) ([]models.Event, int64, error)

	Join(ctx context.Context, eventID, userID uint) error
	Leave(ctx context.Context, eventID, userID uint) error
	IsParticipant(ctx context.Context, eventID, userID uint) (bool, error)
	CountParticipants(ctx context.Context, eventID uint) (int64, error)
	ListParticipants(ctx context.Context, eventID uint, page, pageSize int) ([]models.EventParticipation, int64, error)
}

type eventRepository struct {
	db *gorm.DB
}

func NewEventRepository(db *gorm.DB) EventRepository {
	return &eventRepository{db: db}
}

func (r *eventRepository) Create(ctx context.Context, e *models.Event) error {
	return r.db.WithContext(ctx).Create(e).Error
}

func (r *eventRepository) Update(ctx context.Context, e *models.Event) error {
	return r.db.WithContext(ctx).Save(e).Error
}

func (r *eventRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Event{}, id).Error
}

func (r *eventRepository) FindByID(ctx context.Context, id uint) (*models.Event, error) {
	var e models.Event
	if err := r.db.WithContext(ctx).First(&e, id).Error; err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *eventRepository) List(ctx context.Context, onlyActive bool, page, pageSize int) ([]models.Event, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}
	db := r.db.WithContext(ctx).Model(&models.Event{})
	if onlyActive {
		db = db.Where("is_active = ? AND event_date >= ?", true, time.Now().AddDate(0, 0, -1))
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * pageSize
	var list []models.Event
	if err := db.Order("event_date ASC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *eventRepository) Join(ctx context.Context, eventID, userID uint) error {
	p := models.EventParticipation{EventID: eventID, UserID: userID}
	return r.db.WithContext(ctx).Create(&p).Error
}

func (r *eventRepository) Leave(ctx context.Context, eventID, userID uint) error {
	return r.db.WithContext(ctx).
		Where("event_id = ? AND user_id = ?", eventID, userID).
		Delete(&models.EventParticipation{}).Error
}

func (r *eventRepository) IsParticipant(ctx context.Context, eventID, userID uint) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.EventParticipation{}).
		Where("event_id = ? AND user_id = ?", eventID, userID).Count(&count).Error
	return count > 0, err
}

func (r *eventRepository) CountParticipants(ctx context.Context, eventID uint) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.EventParticipation{}).
		Where("event_id = ?", eventID).Count(&count).Error
	return count, err
}

func (r *eventRepository) ListParticipants(ctx context.Context, eventID uint, page, pageSize int) ([]models.EventParticipation, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	db := r.db.WithContext(ctx).Model(&models.EventParticipation{}).Where("event_id = ?", eventID)
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * pageSize
	var list []models.EventParticipation
	if err := db.Order("created_at ASC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}
