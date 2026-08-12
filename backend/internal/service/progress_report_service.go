package service

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
	"github.com/yourusername/fitness-management/internal/service/ai"
)

const (
	PeriodTypeWeekly  = "weekly"
	PeriodTypeMonthly = "monthly"
)

type ProgressReportDTO struct {
	ID                  uint    `json:"id"`
	PeriodType          string  `json:"periodType"`
	PeriodStart         string  `json:"periodStart"`
	PeriodEnd           string  `json:"periodEnd"`
	TotalSessions       int     `json:"totalSessions"`
	TotalSets           int     `json:"totalSets"`
	TotalVolumeKg       float64 `json:"totalVolumeKg"`
	TotalPRs            int     `json:"totalPRs"`
	BestDayLabel        string  `json:"bestDayLabel,omitempty"`
	HeaviestExercise    string  `json:"heaviestExercise,omitempty"`
	HeaviestWeightKg    float64 `json:"heaviestWeightKg,omitempty"`
	LongestSessionMin   int     `json:"longestSessionMin"`
	ShortestSessionMin  int     `json:"shortestSessionMin"`
	AvgCaloriesLogged   float64 `json:"avgCaloriesLogged"`
	VolumeChangePercent float64 `json:"volumeChangePercent"`
	AnalysisText        string  `json:"analysisText,omitempty"`
}

type ProgressReportListResponse struct {
	Items    []ProgressReportDTO `json:"items"`
	Total    int64               `json:"total"`
	Page     int                 `json:"page"`
	PageSize int                 `json:"pageSize"`
}

// ProgressReportService computes deterministic weekly/monthly rollups (roadmap
// BE-4.1/BE-4.2) and asks AI only to phrase them as readable text (BE-4.3).
type ProgressReportService interface {
	ListReports(ctx context.Context, userID uint, periodType string, page, pageSize int) (*ProgressReportListResponse, error)
	ComputeAndSaveReport(ctx context.Context, userID uint, periodType string, periodStart, periodEnd time.Time) (*models.ProgressReport, error)
	// RunScheduledReports computes weekly/monthly reports for every user with an
	// active subscription, skipping periods already computed. Meant to be called
	// from a periodic scheduler (roadmap BE-4.1's "cron").
	RunScheduledReports(ctx context.Context, now time.Time)
}

type progressReportService struct {
	db         *gorm.DB
	reportRepo repository.ProgressReportRepository
	subRepo    repository.SubscriptionRepository
}

func NewProgressReportService(db *gorm.DB, reportRepo repository.ProgressReportRepository, subRepo repository.SubscriptionRepository) ProgressReportService {
	return &progressReportService{db: db, reportRepo: reportRepo, subRepo: subRepo}
}

func (s *progressReportService) ListReports(ctx context.Context, userID uint, periodType string, page, pageSize int) (*ProgressReportListResponse, error) {
	items, total, err := s.reportRepo.ListByUser(ctx, userID, periodType, page, pageSize)
	if err != nil {
		return nil, err
	}
	dtos := make([]ProgressReportDTO, 0, len(items))
	for i := range items {
		dtos = append(dtos, progressReportToDTO(&items[i]))
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}
	return &ProgressReportListResponse{Items: dtos, Total: total, Page: page, PageSize: pageSize}, nil
}

func progressReportToDTO(r *models.ProgressReport) ProgressReportDTO {
	return ProgressReportDTO{
		ID:                  r.ID,
		PeriodType:          r.PeriodType,
		PeriodStart:         r.PeriodStart.Format("2006-01-02"),
		PeriodEnd:           r.PeriodEnd.Format("2006-01-02"),
		TotalSessions:       r.TotalSessions,
		TotalSets:           r.TotalSets,
		TotalVolumeKg:       r.TotalVolumeKg,
		TotalPRs:            r.TotalPRs,
		BestDayLabel:        r.BestDayLabel,
		HeaviestExercise:    r.HeaviestExercise,
		HeaviestWeightKg:    r.HeaviestWeightKg,
		LongestSessionMin:   r.LongestSessionMin,
		ShortestSessionMin:  r.ShortestSessionMin,
		AvgCaloriesLogged:   r.AvgCaloriesLogged,
		VolumeChangePercent: r.VolumeChangePercent,
		AnalysisText:        r.AnalysisText,
	}
}

func (s *progressReportService) ComputeAndSaveReport(ctx context.Context, userID uint, periodType string, periodStart, periodEnd time.Time) (*models.ProgressReport, error) {
	report := &models.ProgressReport{
		UserID:      userID,
		PeriodType:  periodType,
		PeriodStart: periodStart,
		PeriodEnd:   periodEnd,
	}

	var sessions []models.WorkoutSession
	if err := s.db.WithContext(ctx).
		Where("user_id = ? AND completed_at >= ? AND completed_at < ?", userID, periodStart, periodEnd).
		Find(&sessions).Error; err != nil {
		return nil, err
	}
	report.TotalSessions = len(sessions)
	bestScore := -1
	for _, sess := range sessions {
		if sess.DurationMin > report.LongestSessionMin {
			report.LongestSessionMin = sess.DurationMin
		}
		if report.ShortestSessionMin == 0 || (sess.DurationMin > 0 && sess.DurationMin < report.ShortestSessionMin) {
			report.ShortestSessionMin = sess.DurationMin
		}
		score := sess.EffortRPE + sess.SatisfactionRating
		if score > bestScore {
			bestScore = score
			label := sess.DayLabel
			if label == "" {
				label = sess.DayKey
			}
			report.BestDayLabel = label
		}
	}

	var sets []models.WorkoutSetLog
	if err := s.db.WithContext(ctx).
		Where("user_id = ? AND performed_at >= ? AND performed_at < ?", userID, periodStart, periodEnd).
		Find(&sets).Error; err != nil {
		return nil, err
	}
	report.TotalSets = len(sets)
	for _, set := range sets {
		report.TotalVolumeKg += set.WeightKg * float64(set.Reps)
		if set.IsPR {
			report.TotalPRs++
		}
		if set.WeightKg > report.HeaviestWeightKg {
			report.HeaviestWeightKg = set.WeightKg
			report.HeaviestExercise = set.ExerciseName
		}
	}

	var foodLogs []models.DailyFoodLog
	if err := s.db.WithContext(ctx).
		Where("user_id = ? AND log_date >= ? AND log_date < ?", userID, periodStart, periodEnd).
		Find(&foodLogs).Error; err != nil {
		return nil, err
	}
	caloriesByDay := map[string]float64{}
	for _, fl := range foodLogs {
		key := fl.LogDate.Format("2006-01-02")
		caloriesByDay[key] += fl.Calories
	}
	if len(caloriesByDay) > 0 {
		sum := 0.0
		for _, c := range caloriesByDay {
			sum += c
		}
		report.AvgCaloriesLogged = sum / float64(len(caloriesByDay))
	}

	if prev, err := s.reportRepo.FindLatestBefore(ctx, userID, periodType, periodStart); err == nil && prev != nil {
		report.PrevPeriodVolumeKg = prev.TotalVolumeKg
		if prev.TotalVolumeKg > 0 {
			report.VolumeChangePercent = (report.TotalVolumeKg - prev.TotalVolumeKg) / prev.TotalVolumeKg * 100
		}
	}

	report.AnalysisText = s.generateAnalysisText(ctx, userID, report)

	if err := s.reportRepo.Create(ctx, report); err != nil {
		return nil, err
	}
	return report, nil
}

// generateAnalysisText is best-effort: if AI is unavailable or returns an
// invalid response, the report still saves with the deterministic numbers and
// an empty AnalysisText rather than failing the whole computation.
func (s *progressReportService) generateAnalysisText(ctx context.Context, userID uint, report *models.ProgressReport) string {
	var b strings.Builder
	b.WriteString(fmt.Sprintf("بازه: %s\n", report.PeriodType))
	b.WriteString(fmt.Sprintf("تعداد جلسات تمرین: %d\n", report.TotalSessions))
	b.WriteString(fmt.Sprintf("تعداد ست‌ها: %d\n", report.TotalSets))
	b.WriteString(fmt.Sprintf("حجم کل تمرین: %.0f کیلوگرم\n", report.TotalVolumeKg))
	b.WriteString(fmt.Sprintf("رکوردهای جدید: %d\n", report.TotalPRs))
	if report.HeaviestExercise != "" {
		b.WriteString(fmt.Sprintf("سنگین‌ترین حرکت: %s با %.1f کیلوگرم\n", report.HeaviestExercise, report.HeaviestWeightKg))
	}
	if report.BestDayLabel != "" {
		b.WriteString(fmt.Sprintf("بهترین روز: %s\n", report.BestDayLabel))
	}
	if report.VolumeChangePercent != 0 {
		b.WriteString(fmt.Sprintf("تغییر حجم نسبت به دوره قبل: %.1f درصد\n", report.VolumeChangePercent))
	}
	if report.AvgCaloriesLogged > 0 {
		b.WriteString(fmt.Sprintf("میانگین کالری ثبت‌شده در روزهای فعال: %.0f\n", report.AvgCaloriesLogged))
	}

	analysis, genRes, err := ai.GenerateProgressAnalysis(ctx, b.String())
	if err == nil {
		if verr := ai.ValidateProgressAnalysis(analysis); verr == nil {
			_ = genRes
			return analysis.SummaryText
		}
	}
	log.Printf("progress-report: ai analysis unavailable for user=%d period=%s err=%v", userID, report.PeriodType, err)
	return ""
}

// RunScheduledReports computes weekly reports every Saturday and monthly
// reports on the 1st, for every user with an active subscription. Safe to
// call repeatedly — ExistsForPeriod makes it idempotent per period.
func (s *progressReportService) RunScheduledReports(ctx context.Context, now time.Time) {
	userIDs, err := s.subRepo.FindActiveUserIDs(ctx, now)
	if err != nil {
		log.Printf("progress-report scheduler: failed to list active users: %v", err)
		return
	}

	if now.Weekday() == time.Saturday {
		periodEnd := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		periodStart := periodEnd.AddDate(0, 0, -7)
		s.runForUsers(ctx, userIDs, PeriodTypeWeekly, periodStart, periodEnd)
	}

	if now.Day() == 1 {
		periodEnd := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		periodStart := periodEnd.AddDate(0, -1, 0)
		s.runForUsers(ctx, userIDs, PeriodTypeMonthly, periodStart, periodEnd)
	}
}

func (s *progressReportService) runForUsers(ctx context.Context, userIDs []uint, periodType string, periodStart, periodEnd time.Time) {
	for _, userID := range userIDs {
		exists, err := s.reportRepo.ExistsForPeriod(ctx, userID, periodType, periodStart)
		if err != nil {
			log.Printf("progress-report scheduler: exists-check failed user=%d: %v", userID, err)
			continue
		}
		if exists {
			continue
		}
		if _, err := s.ComputeAndSaveReport(ctx, userID, periodType, periodStart, periodEnd); err != nil {
			log.Printf("progress-report scheduler: compute failed user=%d period=%s: %v", userID, periodType, err)
		}
	}
}

// StartScheduler launches a background goroutine that checks hourly whether
// it's time to compute weekly/monthly reports (roadmap BE-4.1). Intentionally
// dependency-free (no external cron lib) — an hourly ticker is precise enough
// for a daily/weekly cadence and keeps the build self-contained.
func StartScheduler(ctx context.Context, svc ProgressReportService) {
	go func() {
		ticker := time.NewTicker(time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case t := <-ticker.C:
				if t.Hour() == 3 {
					svc.RunScheduledReports(ctx, t)
				}
			}
		}
	}()
}
