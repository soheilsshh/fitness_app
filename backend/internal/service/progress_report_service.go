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
	HeaviestReps        int     `json:"heaviestReps,omitempty"`
	LongestSessionMin   int     `json:"longestSessionMin"`
	ShortestSessionMin  int     `json:"shortestSessionMin"`
	AvgCaloriesLogged   float64 `json:"avgCaloriesLogged"`
	AvgProteinLogged    float64 `json:"avgProteinLogged,omitempty"`
	VolumeChangePercent float64 `json:"volumeChangePercent"`

	// Card 1 — عملکرد تمرین
	AvgSessionMin        int     `json:"avgSessionMin"`
	LegSessionCount      int     `json:"legSessionCount"`
	UpperSessionCount    int     `json:"upperSessionCount"`
	MostImprovedExercise string  `json:"mostImprovedExercise,omitempty"`
	MostImprovedPercent  float64 `json:"mostImprovedPercent,omitempty"`

	// Card 2 — تغییرات بدنی
	WaistChangeCm     float64 `json:"waistChangeCm"`
	AvgWeightChangeKg float64 `json:"avgWeightChangeKg"`
	BodyTrendLabel    string  `json:"bodyTrendLabel,omitempty"`
	CheckInCount      int     `json:"checkInCount"`
	StartWeightKg     float64 `json:"startWeightKg,omitempty"`
	CurrentWeightKg   float64 `json:"currentWeightKg,omitempty"`
	StartWaistCm      float64 `json:"startWaistCm,omitempty"`
	CurrentWaistCm    float64 `json:"currentWaistCm,omitempty"`

	// Card 3 — ریکاوری و وضعیت بدن
	AvgSleepQuality         float64 `json:"avgSleepQuality"`
	AvgFeelingScore         float64 `json:"avgFeelingScore"`
	StreakDays              int     `json:"streakDays"`
	CommonPainArea          string  `json:"commonPainArea,omitempty"`
	PainSeverityLabel       string  `json:"painSeverityLabel,omitempty"`
	GoodSleepNights         int     `json:"goodSleepNights"`
	GoodSleepNightsTotal    int     `json:"goodSleepNightsTotal"`
	HighEnergySessions      int     `json:"highEnergySessions"`
	HighEnergySessionsTotal int     `json:"highEnergySessionsTotal"`
	DiscomfortSessions      int     `json:"discomfortSessions"`

	AnalysisText string `json:"analysisText,omitempty"`
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
	db            *gorm.DB
	reportRepo    repository.ProgressReportRepository
	subRepo       repository.SubscriptionRepository
	notifications repository.NotificationRepository
	streakSvc     StreakService
}

func NewProgressReportService(
	db *gorm.DB,
	reportRepo repository.ProgressReportRepository,
	subRepo repository.SubscriptionRepository,
	notifications repository.NotificationRepository,
	streakSvc StreakService,
) ProgressReportService {
	return &progressReportService{db: db, reportRepo: reportRepo, subRepo: subRepo, notifications: notifications, streakSvc: streakSvc}
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
		HeaviestReps:        r.HeaviestReps,
		LongestSessionMin:   r.LongestSessionMin,
		ShortestSessionMin:  r.ShortestSessionMin,
		AvgCaloriesLogged:   r.AvgCaloriesLogged,
		AvgProteinLogged:    r.AvgProteinLogged,
		VolumeChangePercent: r.VolumeChangePercent,

		AvgSessionMin:        r.AvgSessionMin,
		LegSessionCount:      r.LegSessionCount,
		UpperSessionCount:    r.UpperSessionCount,
		MostImprovedExercise: r.MostImprovedExercise,
		MostImprovedPercent:  r.MostImprovedPercent,

		WaistChangeCm:     r.WaistChangeCm,
		AvgWeightChangeKg: r.AvgWeightChangeKg,
		BodyTrendLabel:    r.BodyTrendLabel,
		CheckInCount:      r.CheckInCount,
		StartWeightKg:     r.StartWeightKg,
		CurrentWeightKg:   r.CurrentWeightKg,
		StartWaistCm:      r.StartWaistCm,
		CurrentWaistCm:    r.CurrentWaistCm,

		AvgSleepQuality:         r.AvgSleepQuality,
		AvgFeelingScore:         r.AvgFeelingScore,
		StreakDays:              r.StreakDays,
		CommonPainArea:          r.CommonPainArea,
		PainSeverityLabel:       r.PainSeverityLabel,
		GoodSleepNights:         r.GoodSleepNights,
		GoodSleepNightsTotal:    r.GoodSleepNightsTotal,
		HighEnergySessions:      r.HighEnergySessions,
		HighEnergySessionsTotal: r.HighEnergySessionsTotal,
		DiscomfortSessions:      r.DiscomfortSessions,

		AnalysisText: r.AnalysisText,
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
			report.HeaviestReps = set.Reps
		}
	}
	if report.TotalSessions > 0 {
		totalMin := 0
		for _, sess := range sessions {
			totalMin += sess.DurationMin
		}
		report.AvgSessionMin = totalMin / report.TotalSessions
	}
	s.computeBodyPartSplit(ctx, sets, report)
	computeMostImprovedExercise(sets, report)
	s.computeBodyChanges(ctx, userID, periodStart, periodEnd, report)
	s.computeRecovery(ctx, userID, sessions, report)

	var foodLogs []models.DailyFoodLog
	if err := s.db.WithContext(ctx).
		Where("user_id = ? AND log_date >= ? AND log_date < ?", userID, periodStart, periodEnd).
		Find(&foodLogs).Error; err != nil {
		return nil, err
	}
	caloriesByDay := map[string]float64{}
	proteinByDay := map[string]float64{}
	for _, fl := range foodLogs {
		key := fl.LogDate.Format("2006-01-02")
		caloriesByDay[key] += fl.Calories
		proteinByDay[key] += fl.Protein
	}
	if len(caloriesByDay) > 0 {
		sum := 0.0
		for _, c := range caloriesByDay {
			sum += c
		}
		report.AvgCaloriesLogged = sum / float64(len(caloriesByDay))
	}
	if len(proteinByDay) > 0 {
		sum := 0.0
		for _, p := range proteinByDay {
			sum += p
		}
		report.AvgProteinLogged = sum / float64(len(proteinByDay))
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

// legBodyParts/upperBodyParts classify the real seeded Exercise.Category
// values (10 total) into a leg/upper split for Card 1's "تمرین پا در برابر
// بالاتنه" — "کاردیو" and "گردن" are neither and don't count toward either.
var legBodyParts = map[string]bool{"قسمت بالایی پاها": true, "پایین پاها": true}
var upperBodyParts = map[string]bool{
	"بالای بازوها": true, "برگشت": true, "شانه‌ها": true,
	"قفسه سینه": true, "پایین بازوها": true, "کمر": true,
}

// computeBodyPartSplit classifies each session (via its logged sets' exercise
// category) as leg-dominant or upper-dominant. A session with no matching
// exercises isn't counted either way — this is a heuristic, not exact.
func (s *progressReportService) computeBodyPartSplit(ctx context.Context, sets []models.WorkoutSetLog, report *models.ProgressReport) {
	if len(sets) == 0 {
		return
	}
	idSet := map[uint]bool{}
	nameSet := map[string]bool{}
	for _, set := range sets {
		if set.ExerciseID != nil {
			idSet[*set.ExerciseID] = true
		}
		nameSet[strings.ToLower(strings.TrimSpace(set.ExerciseName))] = true
	}
	ids := make([]uint, 0, len(idSet))
	for id := range idSet {
		ids = append(ids, id)
	}
	names := make([]string, 0, len(nameSet))
	for n := range nameSet {
		names = append(names, n)
	}

	var exercises []models.Exercise
	s.db.WithContext(ctx).Where("id IN ? OR LOWER(name) IN ?", ids, names).Find(&exercises)
	categoryByID := map[uint]string{}
	categoryByName := map[string]string{}
	for _, ex := range exercises {
		categoryByID[ex.ID] = ex.Category
		categoryByName[strings.ToLower(strings.TrimSpace(ex.Name))] = ex.Category
	}

	setsBySession := map[uint][]models.WorkoutSetLog{}
	for _, set := range sets {
		setsBySession[set.WorkoutSessionID] = append(setsBySession[set.WorkoutSessionID], set)
	}
	for _, sessSets := range setsBySession {
		legCount, upperCount := 0, 0
		for _, set := range sessSets {
			cat := ""
			if set.ExerciseID != nil {
				cat = categoryByID[*set.ExerciseID]
			}
			if cat == "" {
				cat = categoryByName[strings.ToLower(strings.TrimSpace(set.ExerciseName))]
			}
			if legBodyParts[cat] {
				legCount++
			} else if upperBodyParts[cat] {
				upperCount++
			}
		}
		if legCount == 0 && upperCount == 0 {
			continue
		}
		if legCount > upperCount {
			report.LegSessionCount++
		} else {
			report.UpperSessionCount++
		}
	}
}

// computeMostImprovedExercise compares each exercise's first- and
// last-logged weight within the period and picks the largest % gain.
func computeMostImprovedExercise(sets []models.WorkoutSetLog, report *models.ProgressReport) {
	type span struct {
		first, last     float64
		firstAt, lastAt time.Time
	}
	byExercise := map[string]*span{}
	for _, set := range sets {
		if set.WeightKg <= 0 {
			continue
		}
		sp, ok := byExercise[set.ExerciseName]
		if !ok {
			byExercise[set.ExerciseName] = &span{
				first: set.WeightKg, last: set.WeightKg,
				firstAt: set.PerformedAt, lastAt: set.PerformedAt,
			}
			continue
		}
		if set.PerformedAt.Before(sp.firstAt) {
			sp.first = set.WeightKg
			sp.firstAt = set.PerformedAt
		}
		if set.PerformedAt.After(sp.lastAt) {
			sp.last = set.WeightKg
			sp.lastAt = set.PerformedAt
		}
	}
	bestPct := 0.0
	for name, sp := range byExercise {
		if sp.first <= 0 || sp.last <= sp.first {
			continue
		}
		pct := (sp.last - sp.first) / sp.first * 100
		if pct > bestPct {
			bestPct = pct
			report.MostImprovedExercise = name
			report.MostImprovedPercent = pct
		}
	}
}

// computeBodyChanges fills Card 2 from the new DailyCheckIn/WeeklyCheckIn
// tables (weight moved off the old periodic CheckIn) and derives a
// deterministic trend label by comparing the weight direction against the
// user's PrimaryGoal (cut/bulk/maintain) — same goal-parsing rule as
// mapPrimaryGoalToPlanGoal in ai_generate_service.go.
func (s *progressReportService) computeBodyChanges(ctx context.Context, userID uint, periodStart, periodEnd time.Time, report *models.ProgressReport) {
	var dailyCheckIns []models.DailyCheckIn
	s.db.WithContext(ctx).
		Where("user_id = ? AND date >= ? AND date < ?", userID, periodStart, periodEnd).
		Order("date ASC").Find(&dailyCheckIns)

	var weeklyCheckIns []models.WeeklyCheckIn
	s.db.WithContext(ctx).
		Where("user_id = ? AND week_start >= ? AND week_start < ?", userID, periodStart, periodEnd).
		Order("week_start ASC").Find(&weeklyCheckIns)

	report.CheckInCount = len(dailyCheckIns) + len(weeklyCheckIns)

	for _, d := range dailyCheckIns {
		if d.MorningWeightKg == nil {
			continue
		}
		if report.StartWeightKg == 0 {
			report.StartWeightKg = *d.MorningWeightKg
		}
		report.CurrentWeightKg = *d.MorningWeightKg
	}
	if report.StartWeightKg > 0 {
		report.AvgWeightChangeKg = report.CurrentWeightKg - report.StartWeightKg
	}

	for _, w := range weeklyCheckIns {
		if w.WaistCm == nil {
			continue
		}
		if report.StartWaistCm == 0 {
			report.StartWaistCm = *w.WaistCm
		}
		report.CurrentWaistCm = *w.WaistCm
	}
	if report.StartWaistCm > 0 {
		report.WaistChangeCm = report.CurrentWaistCm - report.StartWaistCm
	}

	if report.CheckInCount == 0 {
		return
	}
	var user models.User
	goal := ""
	if err := s.db.WithContext(ctx).Select("primary_goal").First(&user, userID).Error; err == nil {
		goal = strings.ToLower(user.PrimaryGoal)
	}
	switch {
	case strings.Contains(goal, "cut") || strings.Contains(goal, "loss") || strings.Contains(goal, "لاغر") || strings.Contains(goal, "کاهش"):
		switch {
		case report.AvgWeightChangeKg < -0.1:
			report.BodyTrendLabel = "improving"
		case report.AvgWeightChangeKg > 0.3:
			report.BodyTrendLabel = "needs_attention"
		default:
			report.BodyTrendLabel = "stable"
		}
	case strings.Contains(goal, "bulk") || strings.Contains(goal, "gain") || strings.Contains(goal, "حجم") || strings.Contains(goal, "افزایش"):
		switch {
		case report.AvgWeightChangeKg > 0.1:
			report.BodyTrendLabel = "improving"
		case report.AvgWeightChangeKg < -0.3:
			report.BodyTrendLabel = "needs_attention"
		default:
			report.BodyTrendLabel = "stable"
		}
	default:
		report.BodyTrendLabel = "stable"
	}
}

// feelingScores maps the post-workout survey's FeelingAfter enum to a 1-5
// scale for Card 3's average.
var feelingScores = map[string]int{"exhausted": 1, "tired": 2, "ok": 3, "good": 4, "great": 5}

// computeRecovery fills Card 3 from DailyCheckIn.SleepQuality and the
// post-workout survey fields (FeelingAfter/PainArea/PainNote) already on
// WorkoutSession, plus the existing streak service for consecutive days.
func (s *progressReportService) computeRecovery(ctx context.Context, userID uint, sessions []models.WorkoutSession, report *models.ProgressReport) {
	var dailyCheckIns []models.DailyCheckIn
	s.db.WithContext(ctx).
		Where("user_id = ? AND date >= ? AND date < ? AND sleep_quality IS NOT NULL", userID, report.PeriodStart, report.PeriodEnd).
		Find(&dailyCheckIns)

	sleepSum := 0
	for _, d := range dailyCheckIns {
		if d.SleepQuality == nil {
			continue
		}
		sleepSum += *d.SleepQuality
		report.GoodSleepNightsTotal++
		if *d.SleepQuality >= 4 {
			report.GoodSleepNights++
		}
	}
	if report.GoodSleepNightsTotal > 0 {
		report.AvgSleepQuality = float64(sleepSum) / float64(report.GoodSleepNightsTotal)
	}

	feelingSum := 0
	painCounts := map[string]int{}
	painNotesByArea := map[string][]string{}
	for _, sess := range sessions {
		if score, ok := feelingScores[sess.FeelingAfter]; ok {
			feelingSum += score
			report.HighEnergySessionsTotal++
			if sess.FeelingAfter == "good" || sess.FeelingAfter == "great" {
				report.HighEnergySessions++
			}
		}
		area := strings.TrimSpace(sess.PainArea)
		if area == "" || area == "none" {
			continue
		}
		report.DiscomfortSessions++
		painCounts[area]++
		if note := strings.TrimSpace(sess.PainNote); note != "" {
			painNotesByArea[area] = append(painNotesByArea[area], note)
		}
	}
	if report.HighEnergySessionsTotal > 0 {
		report.AvgFeelingScore = float64(feelingSum) / float64(report.HighEnergySessionsTotal)
	}

	topArea, topCount := "", 0
	for area, c := range painCounts {
		if c > topCount {
			topCount = c
			topArea = area
		}
	}
	report.CommonPainArea = topArea
	// PainSeverityLabel (if topArea is set) is filled in by generateAnalysisText,
	// which is the only place that talks to the AI and has the note text.
	if topArea != "" {
		notes := painNotesByArea[topArea]
		report.PainNotesForAI = strings.Join(notes, " | ")
	}

	if s.streakSvc != nil {
		if streak, err := s.streakSvc.GetStreak(ctx, userID); err == nil && streak != nil {
			report.StreakDays = streak.CurrentStreak
		}
	}
}

// generateAnalysisText is best-effort: if AI is unavailable or returns an
// invalid response, the report still saves with the deterministic numbers and
// an empty AnalysisText rather than failing the whole computation. All the
// numbers themselves were already computed in Go above — AI only writes the
// narrative (and, from the pain notes text specifically, a severity word),
// but it's given the last ~3 months of trend so the narrative isn't limited
// to this single week/month (per the explicit ask: prose should read the
// 3-month trend even though the cards themselves stay week-over-week).
func (s *progressReportService) generateAnalysisText(ctx context.Context, userID uint, report *models.ProgressReport) string {
	var b strings.Builder
	b.WriteString(fmt.Sprintf("بازه: %s\n", report.PeriodType))
	b.WriteString(fmt.Sprintf("تعداد جلسات تمرین: %d (میانگین %d دقیقه)\n", report.TotalSessions, report.AvgSessionMin))
	b.WriteString(fmt.Sprintf("تعداد ست‌ها: %d\n", report.TotalSets))
	b.WriteString(fmt.Sprintf("حجم کل تمرین: %.0f کیلوگرم (تغییر نسبت به هفته قبل: %.1f درصد)\n", report.TotalVolumeKg, report.VolumeChangePercent))
	b.WriteString(fmt.Sprintf("رکوردهای جدید: %d\n", report.TotalPRs))
	b.WriteString(fmt.Sprintf("جلسات پا: %d، جلسات بالاتنه: %d\n", report.LegSessionCount, report.UpperSessionCount))
	if report.HeaviestExercise != "" {
		b.WriteString(fmt.Sprintf("سنگین‌ترین حرکت: %s با %.1f کیلوگرم\n", report.HeaviestExercise, report.HeaviestWeightKg))
	}
	if report.MostImprovedExercise != "" {
		b.WriteString(fmt.Sprintf("بیشترین پیشرفت: %s (%.1f درصد)\n", report.MostImprovedExercise, report.MostImprovedPercent))
	}
	if report.BestDayLabel != "" {
		b.WriteString(fmt.Sprintf("بهترین روز: %s\n", report.BestDayLabel))
	}
	if report.AvgCaloriesLogged > 0 {
		b.WriteString(fmt.Sprintf("میانگین کالری ثبت‌شده در روزهای فعال: %.0f\n", report.AvgCaloriesLogged))
	}
	if report.AvgProteinLogged > 0 {
		b.WriteString(fmt.Sprintf("میانگین پروتئین ثبت‌شده در روزهای فعال: %.0f گرم\n", report.AvgProteinLogged))
	}
	if report.CheckInCount > 0 {
		b.WriteString(fmt.Sprintf("تغییر وزن: %.1f کیلوگرم (از %.1f به %.1f)\n", report.AvgWeightChangeKg, report.StartWeightKg, report.CurrentWeightKg))
		if report.StartWaistCm > 0 {
			b.WriteString(fmt.Sprintf("تغییر دور کمر: %.1f سانتی‌متر\n", report.WaistChangeCm))
		}
	}
	if report.AvgSleepQuality > 0 {
		b.WriteString(fmt.Sprintf("میانگین کیفیت خواب: %.1f از ۵ (%d از %d شب خواب خوب)\n", report.AvgSleepQuality, report.GoodSleepNights, report.GoodSleepNightsTotal))
	}
	if report.AvgFeelingScore > 0 {
		b.WriteString(fmt.Sprintf("میانگین حس پس از تمرین: %.1f از ۵\n", report.AvgFeelingScore))
	}
	if report.StreakDays > 0 {
		b.WriteString(fmt.Sprintf("استریک فعلی: %d روز متوالی\n", report.StreakDays))
	}
	if report.CommonPainArea != "" {
		b.WriteString(fmt.Sprintf("ناحیه‌ی ناراحتی پرتکرار: %s (در %d جلسه)\n", report.CommonPainArea, report.DiscomfortSessions))
		if report.PainNotesForAI != "" {
			b.WriteString(fmt.Sprintf("توضیحات کاربر درباره‌ی این ناراحتی: %s\n", report.PainNotesForAI))
		}
	}

	if trend := s.buildThreeMonthTrendContext(ctx, userID, report.PeriodType, report.PeriodStart); trend != "" {
		b.WriteString("\nروند ۳ ماه اخیر (برای تشخیص الگوی کلی‌تر، نه فقط این بازه):\n")
		b.WriteString(trend)
	}

	system := ""
	if report.CommonPainArea != "" {
		system = "اگر توضیحات کاربر درباره‌ی ناراحتی داده شده، فیلد pain_severity را یکی از «خفیف»، «متوسط» یا «شدید» بر اساس متن او پر کن؛ در غیر این صورت رشته خالی بگذار."
	}
	analysis, genRes, err := ai.GenerateProgressAnalysis(ctx, b.String()+"\n"+system)
	if err == nil {
		if verr := ai.ValidateProgressAnalysis(analysis); verr == nil {
			_ = genRes
			report.PainSeverityLabel = strings.TrimSpace(analysis.PainSeverity)
			return analysis.SummaryText
		}
	}
	log.Printf("progress-report: ai analysis unavailable for user=%d period=%s err=%v", userID, report.PeriodType, err)
	return ""
}

// buildThreeMonthTrendContext summarizes up to the last 12 same-period-type
// reports (≈3 months of weekly reports) into a short trend line for the AI
// prompt — deterministic numbers already stored from prior computations,
// just re-read and formatted.
func (s *progressReportService) buildThreeMonthTrendContext(ctx context.Context, userID uint, periodType string, before time.Time) string {
	items, _, err := s.reportRepo.ListByUser(ctx, userID, periodType, 1, 12)
	if err != nil || len(items) == 0 {
		return ""
	}
	var b strings.Builder
	for i := len(items) - 1; i >= 0; i-- {
		r := items[i]
		if !r.PeriodStart.Before(before) {
			continue
		}
		b.WriteString(fmt.Sprintf(
			"- %s: %d جلسه، %.0f کیلوگرم حجم، %d رکورد\n",
			r.PeriodStart.Format("2006-01-02"), r.TotalSessions, r.TotalVolumeKg, r.TotalPRs,
		))
	}
	return b.String()
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
			continue
		}
		if periodType == PeriodTypeWeekly {
			s.notifyReportReady(ctx, userID)
		}
	}
}

// notifyReportReady creates an in-app notification once a new weekly report
// is computed. Notifications are pull-based (ListRecent), so the user simply
// sees it unread the next time they open the app — no push needed here.
func (s *progressReportService) notifyReportReady(ctx context.Context, userID uint) {
	if s.notifications == nil {
		return
	}
	if err := s.notifications.Create(ctx, &models.Notification{
		UserID:     userID,
		Type:       models.NotificationTypeWeeklyReportReady,
		Title:      "گزارش هوشمند پیشرفت این هفته‌ات آماده است",
		Message:    "تحلیل تازه‌ای از عملکرد این هفته‌ات آماده شده — از بخش پایش پیشرفت ببینش.",
		ActionPath: "/user/tracking",
	}); err != nil {
		log.Printf("progress-report scheduler: notification insert failed user=%d: %v", userID, err)
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
