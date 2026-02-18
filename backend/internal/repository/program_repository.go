package repository

import (
	"context"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type ProgramRepository interface {
	FindActiveWorkoutBySubscriptionID(ctx context.Context, subscriptionID uint) (*models.WorkoutProgram, error)
	FindActiveNutritionBySubscriptionID(ctx context.Context, subscriptionID uint) (*models.NutritionProgram, error)
	FindWorkoutItemsByProgramID(ctx context.Context, programID uint) ([]models.ProgramItem, error)
	FindNutritionItemsByProgramID(ctx context.Context, programID uint) ([]models.NutritionItem, error)
}

type programRepository struct {
	db *gorm.DB
}

func NewProgramRepository(db *gorm.DB) ProgramRepository {
	return &programRepository{db: db}
}

func (r *programRepository) FindActiveWorkoutBySubscriptionID(ctx context.Context, subscriptionID uint) (*models.WorkoutProgram, error) {
	var program models.WorkoutProgram
	err := r.db.WithContext(ctx).
		Where("subscription_id = ? AND is_active = ?", subscriptionID, true).
		Order("version DESC").
		First(&program).Error
	if err != nil {
		return nil, err
	}
	return &program, nil
}

func (r *programRepository) FindActiveNutritionBySubscriptionID(ctx context.Context, subscriptionID uint) (*models.NutritionProgram, error) {
	var program models.NutritionProgram
	err := r.db.WithContext(ctx).
		Where("subscription_id = ? AND is_active = ?", subscriptionID, true).
		Order("version DESC").
		First(&program).Error
	if err != nil {
		return nil, err
	}
	return &program, nil
}

func (r *programRepository) FindWorkoutItemsByProgramID(ctx context.Context, programID uint) ([]models.ProgramItem, error) {
	var items []models.ProgramItem
	err := r.db.WithContext(ctx).
		Where("workout_program_id = ?", programID).
		Order("week_number ASC, day_number ASC, order_index ASC").
		Find(&items).Error
	if err != nil {
		return nil, err
	}
	return items, nil
}

func (r *programRepository) FindNutritionItemsByProgramID(ctx context.Context, programID uint) ([]models.NutritionItem, error) {
	var items []models.NutritionItem
	err := r.db.WithContext(ctx).
		Where("nutrition_program_id = ?", programID).
		Order("day_number ASC, meal_number ASC, order_index ASC").
		Find(&items).Error
	if err != nil {
		return nil, err
	}
	return items, nil
}

