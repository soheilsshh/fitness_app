package repository

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

// OtpRepository defines persistence for OTP codes.
type OtpRepository interface {
	Create(ctx context.Context, code *models.OtpCode) error
	FindValidByPhoneAndPurpose(ctx context.Context, phone, purpose string, now time.Time) (*models.OtpCode, error)
	MarkUsed(ctx context.Context, id uint, usedAt time.Time) error
}

type otpRepository struct {
	db *gorm.DB
}

func NewOtpRepository(db *gorm.DB) OtpRepository {
	return &otpRepository{db: db}
}

func (r *otpRepository) Create(ctx context.Context, code *models.OtpCode) error {
	return r.db.WithContext(ctx).Create(code).Error
}

func (r *otpRepository) FindValidByPhoneAndPurpose(ctx context.Context, phone, purpose string, now time.Time) (*models.OtpCode, error) {
	var otp models.OtpCode
	err := r.db.WithContext(ctx).
		Where("phone = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?", phone, purpose, now).
		Order("created_at DESC").
		First(&otp).Error
	if err != nil {
		return nil, err
	}
	return &otp, nil
}

func (r *otpRepository) MarkUsed(ctx context.Context, id uint, usedAt time.Time) error {
	return r.db.WithContext(ctx).
		Model(&models.OtpCode{}).
		Where("id = ?", id).
		Update("used_at", usedAt).Error
}

