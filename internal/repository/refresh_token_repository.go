package repository

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type RefreshTokenRepository interface {
	Create(ctx context.Context, token *models.RefreshToken) error
	RevokeByToken(ctx context.Context, token string) error
	DeleteByUserID(ctx context.Context, userID uint) error
	DeleteByUserIDAndToken(ctx context.Context, userID uint, token string) error
}

type refreshTokenRepository struct {
	db *gorm.DB
}

func NewRefreshTokenRepository(db *gorm.DB) RefreshTokenRepository {
	return &refreshTokenRepository{db: db}
}

func (r *refreshTokenRepository) Create(ctx context.Context, token *models.RefreshToken) error {
	return r.db.WithContext(ctx).Create(token).Error
}

func (r *refreshTokenRepository) RevokeByToken(ctx context.Context, token string) error {
	return r.db.WithContext(ctx).
		Model(&models.RefreshToken{}).
		Where("token = ? AND expires_at > ?", token, time.Now()).
		Update("expires_at", time.Now()).Error
}

func (r *refreshTokenRepository) DeleteByUserID(ctx context.Context, userID uint) error {
	return r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Delete(&models.RefreshToken{}).Error
}

func (r *refreshTokenRepository) DeleteByUserIDAndToken(ctx context.Context, userID uint, token string) error {
	return r.db.WithContext(ctx).
		Where("user_id = ? AND token = ?", userID, token).
		Delete(&models.RefreshToken{}).Error
}


