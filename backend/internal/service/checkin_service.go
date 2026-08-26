package service

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

// DailyCheckInDTO/WeeklyCheckInDTO back the "پایش روزانه"/"پایش هفتگی" cards
// on the Tracking page (and the dashboard quick-entry widgets), and feed the
// weekly AI progress report.
type DailyCheckInDTO struct {
	Date             string   `json:"date"`
	MorningWeightKg  *float64 `json:"morningWeightKg,omitempty"`
	SleepQuality     *int     `json:"sleepQuality,omitempty"`
	ProteinIntakeG   *float64 `json:"proteinIntakeG,omitempty"`
	HasNutritionPlan bool     `json:"hasNutritionPlan"`
}

type DailyCheckInRequest struct {
	MorningWeightKg *float64 `json:"morningWeightKg,omitempty"`
	SleepQuality    *int     `json:"sleepQuality,omitempty"`
	ProteinIntakeG  *float64 `json:"proteinIntakeG,omitempty"`
}

type WeeklyCheckInDTO struct {
	WeekStart string   `json:"weekStart"`
	WaistCm   *float64 `json:"waistCm,omitempty"`
}

type WeeklyCheckInRequest struct {
	WaistCm *float64 `json:"waistCm,omitempty"`
}

var (
	ErrInvalidSleepQuality = errors.New("sleep quality must be between 1 and 5")
)

type CheckInService interface {
	GetTodayDailyCheckIn(ctx context.Context, userID uint) (*DailyCheckInDTO, error)
	SubmitDailyCheckIn(ctx context.Context, userID uint, req *DailyCheckInRequest) (*DailyCheckInDTO, error)
	GetCurrentWeeklyCheckIn(ctx context.Context, userID uint) (*WeeklyCheckInDTO, error)
	SubmitWeeklyCheckIn(ctx context.Context, userID uint, req *WeeklyCheckInRequest) (*WeeklyCheckInDTO, error)
}

type checkInService struct {
	db             *gorm.DB
	subRepo        repository.SubscriptionRepository
	programRepo    repository.ProgramRepository
	achievementSvc AchievementService
}

func NewCheckInService(db *gorm.DB, subRepo repository.SubscriptionRepository, programRepo repository.ProgramRepository, achievementSvc AchievementService) CheckInService {
	return &checkInService{db: db, subRepo: subRepo, programRepo: programRepo, achievementSvc: achievementSvc}
}

func startOfDay(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location())
}

// startOfWeekSaturday rounds down to the most recent Saturday — the same
// week-start convention already used by the progress-report scheduler
// (RunScheduledReports in progress_report_service.go runs weekly on Saturday).
func startOfWeekSaturday(t time.Time) time.Time {
	d := startOfDay(t)
	offset := (int(d.Weekday()) - int(time.Saturday) + 7) % 7
	return d.AddDate(0, 0, -offset)
}

// hasActiveNutritionPlan mirrors the check already used elsewhere
// (me_service.go/student_service.go) for "does this user currently have an
// active nutrition program" — used to decide whether the protein field
// should be requested from the user at all.
func (s *checkInService) hasActiveNutritionPlan(ctx context.Context, userID uint) bool {
	sub, err := s.subRepo.FindCurrentByUserID(ctx, userID, time.Now())
	if err != nil || sub == nil {
		return false
	}
	np, err := s.programRepo.FindActiveNutritionBySubscriptionID(ctx, sub.ID)
	return err == nil && np != nil
}

func (s *checkInService) GetTodayDailyCheckIn(ctx context.Context, userID uint) (*DailyCheckInDTO, error) {
	today := startOfDay(time.Now())
	var row models.DailyCheckIn
	err := s.db.WithContext(ctx).Where("user_id = ? AND date = ?", userID, today).First(&row).Error
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		row = models.DailyCheckIn{UserID: userID, Date: today}
	}
	return s.toDailyDTO(ctx, userID, row), nil
}

func (s *checkInService) SubmitDailyCheckIn(ctx context.Context, userID uint, req *DailyCheckInRequest) (*DailyCheckInDTO, error) {
	if req != nil && req.SleepQuality != nil && (*req.SleepQuality < 1 || *req.SleepQuality > 5) {
		return nil, ErrInvalidSleepQuality
	}

	today := startOfDay(time.Now())
	var row models.DailyCheckIn
	err := s.db.WithContext(ctx).Where("user_id = ? AND date = ?", userID, today).First(&row).Error
	isNew := errors.Is(err, gorm.ErrRecordNotFound)
	if err != nil && !isNew {
		return nil, err
	}
	if isNew {
		row = models.DailyCheckIn{UserID: userID, Date: today}
	}

	if req != nil {
		if req.MorningWeightKg != nil {
			row.MorningWeightKg = req.MorningWeightKg
		}
		if req.SleepQuality != nil {
			row.SleepQuality = req.SleepQuality
		}
		if req.ProteinIntakeG != nil {
			row.ProteinIntakeG = req.ProteinIntakeG
		}
	}

	if isNew {
		if err := s.db.WithContext(ctx).Create(&row).Error; err != nil {
			return nil, err
		}
	} else if err := s.db.WithContext(ctx).Save(&row).Error; err != nil {
		return nil, err
	}

	// Keep the profile's headline weight in sync, same as the old
	// tracking-page weight submission used to do.
	if req != nil && req.MorningWeightKg != nil {
		_ = s.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", userID).
			Update("weight_kg", *req.MorningWeightKg).Error
	}
	if s.achievementSvc != nil {
		s.achievementSvc.HandleTrackingUpdated(ctx, userID)
	}

	return s.toDailyDTO(ctx, userID, row), nil
}

func (s *checkInService) toDailyDTO(ctx context.Context, userID uint, row models.DailyCheckIn) *DailyCheckInDTO {
	return &DailyCheckInDTO{
		Date:             row.Date.Format("2006-01-02"),
		MorningWeightKg:  row.MorningWeightKg,
		SleepQuality:     row.SleepQuality,
		ProteinIntakeG:   row.ProteinIntakeG,
		HasNutritionPlan: s.hasActiveNutritionPlan(ctx, userID),
	}
}

func (s *checkInService) GetCurrentWeeklyCheckIn(ctx context.Context, userID uint) (*WeeklyCheckInDTO, error) {
	weekStart := startOfWeekSaturday(time.Now())
	var row models.WeeklyCheckIn
	err := s.db.WithContext(ctx).Where("user_id = ? AND week_start = ?", userID, weekStart).First(&row).Error
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		row = models.WeeklyCheckIn{UserID: userID, WeekStart: weekStart}
	}
	return &WeeklyCheckInDTO{WeekStart: row.WeekStart.Format("2006-01-02"), WaistCm: row.WaistCm}, nil
}

func (s *checkInService) SubmitWeeklyCheckIn(ctx context.Context, userID uint, req *WeeklyCheckInRequest) (*WeeklyCheckInDTO, error) {
	weekStart := startOfWeekSaturday(time.Now())
	var row models.WeeklyCheckIn
	err := s.db.WithContext(ctx).Where("user_id = ? AND week_start = ?", userID, weekStart).First(&row).Error
	isNew := errors.Is(err, gorm.ErrRecordNotFound)
	if err != nil && !isNew {
		return nil, err
	}
	if isNew {
		row = models.WeeklyCheckIn{UserID: userID, WeekStart: weekStart}
	}
	if req != nil && req.WaistCm != nil {
		row.WaistCm = req.WaistCm
	}
	if isNew {
		if err := s.db.WithContext(ctx).Create(&row).Error; err != nil {
			return nil, err
		}
	} else if err := s.db.WithContext(ctx).Save(&row).Error; err != nil {
		return nil, err
	}
	if s.achievementSvc != nil {
		s.achievementSvc.HandleTrackingUpdated(ctx, userID)
	}
	return &WeeklyCheckInDTO{WeekStart: row.WeekStart.Format("2006-01-02"), WaistCm: row.WaistCm}, nil
}
