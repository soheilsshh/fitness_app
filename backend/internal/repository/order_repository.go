package repository

import (
	"context"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type OrderRepository interface {
	ListByUserID(ctx context.Context, userID uint, page, pageSize int, status string) ([]models.Order, int64, error)
	GetByIDAndUserID(ctx context.Context, orderID, userID uint) (*models.Order, error)
	GetOrderItems(ctx context.Context, orderID uint) ([]models.OrderItem, error)
}

type orderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) OrderRepository {
	return &orderRepository{db: db}
}

func (r *orderRepository) ListByUserID(ctx context.Context, userID uint, page, pageSize int, status string) ([]models.Order, int64, error) {
	db := r.db.WithContext(ctx).Model(&models.Order{}).Where("user_id = ?", userID)
	if status != "" && status != "all" {
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
	var list []models.Order
	if err := db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *orderRepository) GetByIDAndUserID(ctx context.Context, orderID, userID uint) (*models.Order, error) {
	var o models.Order
	if err := r.db.WithContext(ctx).Where("id = ? AND user_id = ?", orderID, userID).First(&o).Error; err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *orderRepository) GetOrderItems(ctx context.Context, orderID uint) ([]models.OrderItem, error) {
	var items []models.OrderItem
	if err := r.db.WithContext(ctx).Where("order_id = ?", orderID).Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}
