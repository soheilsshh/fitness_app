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
	FindWorkoutProgramByID(ctx context.Context, id uint) (*models.WorkoutProgram, error)
	FindNutritionProgramByID(ctx context.Context, id uint) (*models.NutritionProgram, error)
	CreateWorkoutProgram(ctx context.Context, program *models.WorkoutProgram) error
	CreateNutritionProgram(ctx context.Context, program *models.NutritionProgram) error
	UpdateWorkoutProgram(ctx context.Context, program *models.WorkoutProgram) error
	UpdateNutritionProgram(ctx context.Context, program *models.NutritionProgram) error
	UpsertWorkoutItems(ctx context.Context, programID uint, items []models.ProgramItem) error
	UpsertNutritionItems(ctx context.Context, programID uint, items []models.NutritionItem) error
	DeactivateWorkoutPrograms(ctx context.Context, subscriptionID uint) error
	DeactivateNutritionPrograms(ctx context.Context, subscriptionID uint) error
	MaxWorkoutVersion(ctx context.Context, subscriptionID uint) (int, error)
	MaxNutritionVersion(ctx context.Context, subscriptionID uint) (int, error)
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
		Preload("SetsDetails", func(db *gorm.DB) *gorm.DB {
			return db.Order("set_number ASC")
		}).
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

func (r *programRepository) FindWorkoutProgramByID(ctx context.Context, id uint) (*models.WorkoutProgram, error) {
	var program models.WorkoutProgram
	if err := r.db.WithContext(ctx).First(&program, id).Error; err != nil {
		return nil, err
	}
	return &program, nil
}

func (r *programRepository) FindNutritionProgramByID(ctx context.Context, id uint) (*models.NutritionProgram, error) {
	var program models.NutritionProgram
	if err := r.db.WithContext(ctx).First(&program, id).Error; err != nil {
		return nil, err
	}
	return &program, nil
}

func (r *programRepository) CreateWorkoutProgram(ctx context.Context, program *models.WorkoutProgram) error {
	return r.db.WithContext(ctx).Create(program).Error
}

func (r *programRepository) CreateNutritionProgram(ctx context.Context, program *models.NutritionProgram) error {
	return r.db.WithContext(ctx).Create(program).Error
}

func (r *programRepository) UpdateWorkoutProgram(ctx context.Context, program *models.WorkoutProgram) error {
	return r.db.WithContext(ctx).Save(program).Error
}

func (r *programRepository) UpdateNutritionProgram(ctx context.Context, program *models.NutritionProgram) error {
	return r.db.WithContext(ctx).Save(program).Error
}

func (r *programRepository) UpsertWorkoutItems(ctx context.Context, programID uint, items []models.ProgramItem) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var itemIDs []uint
		if err := tx.Model(&models.ProgramItem{}).
			Where("workout_program_id = ?", programID).
			Pluck("id", &itemIDs).Error; err != nil {
			return err
		}
		if len(itemIDs) > 0 {
			if err := tx.Where("program_item_id IN ?", itemIDs).Delete(&models.ProgramItemSet{}).Error; err != nil {
				return err
			}
		}
		if err := tx.Where("workout_program_id = ?", programID).Delete(&models.ProgramItem{}).Error; err != nil {
			return err
		}
		if len(items) == 0 {
			return nil
		}
		for i := range items {
			items[i].ID = 0
			items[i].WorkoutProgramID = programID
			for j := range items[i].SetsDetails {
				items[i].SetsDetails[j].ID = 0
				items[i].SetsDetails[j].ProgramItemID = 0
			}
			if err := tx.Create(&items[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *programRepository) UpsertNutritionItems(ctx context.Context, programID uint, items []models.NutritionItem) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("nutrition_program_id = ?", programID).Delete(&models.NutritionItem{}).Error; err != nil {
			return err
		}
		if len(items) == 0 {
			return nil
		}
		return tx.Create(&items).Error
	})
}

func (r *programRepository) DeactivateWorkoutPrograms(ctx context.Context, subscriptionID uint) error {
	return r.db.WithContext(ctx).
		Model(&models.WorkoutProgram{}).
		Where("subscription_id = ? AND is_active = ?", subscriptionID, true).
		Update("is_active", false).Error
}

func (r *programRepository) DeactivateNutritionPrograms(ctx context.Context, subscriptionID uint) error {
	return r.db.WithContext(ctx).
		Model(&models.NutritionProgram{}).
		Where("subscription_id = ? AND is_active = ?", subscriptionID, true).
		Update("is_active", false).Error
}

func (r *programRepository) MaxWorkoutVersion(ctx context.Context, subscriptionID uint) (int, error) {
	var maxVersion *int
	err := r.db.WithContext(ctx).
		Model(&models.WorkoutProgram{}).
		Where("subscription_id = ?", subscriptionID).
		Select("MAX(version)").
		Scan(&maxVersion).Error
	if err != nil {
		return 0, err
	}
	if maxVersion == nil {
		return 0, nil
	}
	return *maxVersion, nil
}

func (r *programRepository) MaxNutritionVersion(ctx context.Context, subscriptionID uint) (int, error) {
	var maxVersion *int
	err := r.db.WithContext(ctx).
		Model(&models.NutritionProgram{}).
		Where("subscription_id = ?", subscriptionID).
		Select("MAX(version)").
		Scan(&maxVersion).Error
	if err != nil {
		return 0, err
	}
	if maxVersion == nil {
		return 0, nil
	}
	return *maxVersion, nil
}
