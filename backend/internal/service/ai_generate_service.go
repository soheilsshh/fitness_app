package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"github.com/yourusername/fitness-management/config"
	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
	"github.com/yourusername/fitness-management/internal/service/ai"
)

const (
	aiGenRateWindow       = time.Minute
	aiGenRateMaxPerWindow = 10
	aiLogTextMaxRunes     = 12000
)

// AIGenerateService orchestrates structured AI generation for phase 0.
type AIGenerateService struct {
	meService MeService
	logRepo   repository.AIRequestLogRepository

	mu    sync.Mutex
	rates map[uint][]time.Time
}

func NewAIGenerateService(meService MeService, logRepo repository.AIRequestLogRepository) *AIGenerateService {
	return &AIGenerateService{
		meService: meService,
		logRepo:   logRepo,
		rates:     make(map[uint][]time.Time),
	}
}

func (s *AIGenerateService) GenerateNutrition(ctx context.Context, userID uint) (*ai.NutritionPlanSchema, error) {
	if !s.allow(userID) {
		return nil, ErrAIRateLimited
	}

	profile, err := s.meService.GetProfile(ctx, userID)
	if err != nil {
		return nil, err
	}
	userContext := buildAIUserContext(profile)
	persona := string(ai.PersonaNutrition)

	plan, genRes, genErr := ai.GenerateNutritionPlan(ctx, userContext)
	s.persistLog(ctx, userID, "nutrition_plan", persona, userContext, genRes, genErr)

	if genErr != nil {
		return nil, mapAIGenErr(genErr)
	}
	if err := ai.ValidateNutritionPlan(plan); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrAIInvalidPlan, err.Error())
	}
	return plan, nil
}

func (s *AIGenerateService) GenerateWorkout(ctx context.Context, userID uint) (*ai.WorkoutPlanSchema, error) {
	if !s.allow(userID) {
		return nil, ErrAIRateLimited
	}

	profile, err := s.meService.GetProfile(ctx, userID)
	if err != nil {
		return nil, err
	}
	userContext := buildAIUserContext(profile)
	persona := string(ai.PersonaWorkout)

	plan, genRes, genErr := ai.GenerateWorkoutPlan(ctx, userContext)
	s.persistLog(ctx, userID, "workout_plan", persona, userContext, genRes, genErr)

	if genErr != nil {
		return nil, mapAIGenErr(genErr)
	}
	if err := ai.ValidateWorkoutPlan(plan); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrAIInvalidPlan, err.Error())
	}
	return plan, nil
}

var ErrAIInvalidPlan = errors.New("ai plan validation failed")

func mapAIGenErr(err error) error {
	switch {
	case errors.Is(err, ai.ErrNotConfigured):
		return ErrAINotConfigured
	case errors.Is(err, ai.ErrUpstream), errors.Is(err, ai.ErrEmptyResponse):
		return ErrAIUpstream
	case errors.Is(err, ai.ErrUnmarshal):
		return fmt.Errorf("%w: خطا در تبدیل جواب AI", ErrAIUpstream)
	default:
		return err
	}
}

func (s *AIGenerateService) allow(userID uint) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-aiGenRateWindow)
	kept := make([]time.Time, 0, len(s.rates[userID]))
	for _, t := range s.rates[userID] {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}
	if len(kept) >= aiGenRateMaxPerWindow {
		s.rates[userID] = kept
		return false
	}
	s.rates[userID] = append(kept, now)
	return true
}

func (s *AIGenerateService) persistLog(
	ctx context.Context,
	userID uint,
	requestType, persona, input string,
	genRes *ai.GenerateResult,
	genErr error,
) {
	if s.logRepo == nil {
		return
	}
	entry := &models.AIRequestLog{
		UserID:      userID,
		RequestType: requestType,
		Persona:     persona,
		InputText:   truncateRunes(input, aiLogTextMaxRunes),
		Success:     genErr == nil,
		ModelName:   strings.TrimSpace(config.Get().OpenAI.Model),
	}
	if genRes != nil {
		entry.OutputJSON = truncateRunes(string(genRes.RawJSON), aiLogTextMaxRunes)
		entry.LatencyMs = genRes.LatencyMs
		entry.PromptTokens = genRes.PromptTokens
		entry.CompletionTokens = genRes.CompletionTokens
		if genRes.Model != "" {
			entry.ModelName = genRes.Model
		}
	}
	if genErr != nil {
		entry.ErrorMsg = truncateRunes(genErr.Error(), 2000)
	}
	_ = s.logRepo.Create(ctx, entry)
}

func buildAIUserContext(profile *MeProfileDTO) string {
	if profile == nil {
		return "اطلاعات پروفایل در دسترس نیست. یک برنامه متعادل عمومی بساز."
	}
	var b strings.Builder
	b.WriteString("اطلاعات کاربر برای ساخت برنامه:\n")
	name := strings.TrimSpace(profile.FirstName + " " + profile.LastName)
	if name != "" {
		b.WriteString("- نام: " + name + "\n")
	}
	if profile.Gender != "" {
		b.WriteString("- جنسیت: " + profile.Gender + "\n")
	}
	if profile.BirthDate != nil && *profile.BirthDate != "" {
		b.WriteString("- تاریخ تولد: " + *profile.BirthDate + "\n")
	}
	if profile.HeightCm != nil {
		b.WriteString(fmt.Sprintf("- قد: %.0f cm\n", *profile.HeightCm))
	}
	if profile.WeightKg != nil {
		b.WriteString(fmt.Sprintf("- وزن: %.1f kg\n", *profile.WeightKg))
	}
	if profile.TargetWeightKg != nil {
		b.WriteString(fmt.Sprintf("- وزن هدف: %.1f kg\n", *profile.TargetWeightKg))
	}
	if profile.BodyFatPercent != nil {
		b.WriteString(fmt.Sprintf("- درصد چربی بدن: %.1f\n", *profile.BodyFatPercent))
	}
	if profile.PrimaryGoal != "" {
		b.WriteString("- هدف اصلی: " + profile.PrimaryGoal + "\n")
	}
	if len(profile.Goals) > 0 {
		b.WriteString("- اهداف: " + strings.Join(profile.Goals, "، ") + "\n")
	}
	if profile.BodyCondition != "" {
		b.WriteString("- وضعیت بدن: " + profile.BodyCondition + "\n")
	}
	if profile.Injuries != "" {
		b.WriteString("- آسیب‌ها (رعایت احتیاط): " + truncateRunes(profile.Injuries, 300) + "\n")
	}
	if profile.PhysicalLimitations != "" {
		b.WriteString("- محدودیت فیزیکی: " + truncateRunes(profile.PhysicalLimitations, 300) + "\n")
	}
	b.WriteString("یک برنامه واقع‌بینانه و مناسب سبک زندگی ایرانی پیشنهاد بده.")
	return b.String()
}

func truncateRunes(s string, max int) string {
	if max <= 0 || utf8.RuneCountInString(s) <= max {
		return s
	}
	runes := []rune(s)
	return string(runes[:max]) + "…"
}
