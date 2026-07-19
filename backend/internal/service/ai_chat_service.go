package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"github.com/yourusername/fitness-management/config"
)

var (
	ErrAINotConfigured = errors.New("openai api key not configured")
	ErrAIRateLimited   = errors.New("ai rate limited")
	ErrAIInvalidInput  = errors.New("invalid ai input")
	ErrAIUpstream      = errors.New("openai upstream error")
)

const (
	aiMaxMessageRunes   = 1200
	aiMaxHistoryMessages = 12
	aiRateWindow         = time.Minute
	aiRateMaxPerWindow   = 20
)

// Fixed guardrail replies — never invent programs / PEDs.
const (
	aiProgramRedirectMsg = "برای تهیه برنامه تمرین یا تغذیه باید از طریق مربی‌های فیتینو اقدام کنی. من نمی‌تونم برنامه تمرین، رژیم غذایی یا مکمل/داروی نیروزا پیشنهاد یا تجویز کنم."
	aiOutOfScopeMsg      = "من دستیار فیتینو هستم و فقط درباره امکانات اپ، حساب کاربری و مسیر استفاده از فیتینو راهنمایی می‌کنم. برای موضوعات خارج از این حیطه متأسفانه پاسخ نمی‌دم."
	aiSteroidRefuseMsg   = "درباره استروئید، داروهای نیروزا یا روش‌های غیرقانونی/غیرایمن هیچ راهنمایی ارائه نمی‌کنم. برای برنامه اصولی تمرین و تغذیه از مربی‌های فیتینو کمک بگیر."
	aiDevMockMsg         = "این پاسخ تستی محیط توسعه است (کلید هوش مصنوعی تنظیم نشده). در پروداکشن با OPENAI_API_KEY پاسخ واقعی از مدل دریافت می‌شود. بپرس درباره ورود، پنل شاگرد، مربی یا پرداخت — من فقط راهنمای امکانات فیتینو هستم."
)

func aiDevMockReply(userMessage string) string {
	_ = userMessage
	return aiDevMockMsg
}

type AIChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type AIChatRequest struct {
	Message  string          `json:"message" binding:"required"`
	History  []AIChatMessage `json:"history"`
	PagePath string          `json:"pagePath"`
}

type AIChatResponse struct {
	Reply string `json:"reply"`
}

type AIChatService struct {
	meService MeService
	client    *http.Client

	mu    sync.Mutex
	rates map[uint][]time.Time
}

func NewAIChatService(meService MeService) *AIChatService {
	return &AIChatService{
		meService: meService,
		client:    &http.Client{Timeout: 45 * time.Second},
		rates:     make(map[uint][]time.Time),
	}
}

func (s *AIChatService) Chat(ctx context.Context, userID uint, req *AIChatRequest) (*AIChatResponse, error) {
	if req == nil {
		return nil, ErrAIInvalidInput
	}

	message := strings.TrimSpace(req.Message)
	if message == "" || utf8.RuneCountInString(message) > aiMaxMessageRunes {
		return nil, ErrAIInvalidInput
	}

	if !s.allow(userID) {
		return nil, ErrAIRateLimited
	}

	// Hard guardrails before calling the model.
	if hitsSteroidTopic(message) {
		return &AIChatResponse{Reply: aiSteroidRefuseMsg}, nil
	}
	if hitsProgramOrDietTopic(message) {
		return &AIChatResponse{Reply: aiProgramRedirectMsg}, nil
	}

	cfg := config.Get()
	if strings.TrimSpace(cfg.OpenAI.APIKey) == "" {
		if config.IsDevelopment() {
			return &AIChatResponse{Reply: aiDevMockReply(message)}, nil
		}
		return nil, ErrAINotConfigured
	}

	profile, err := s.meService.GetProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	system := buildFitinoSystemPrompt(profile, strings.TrimSpace(req.PagePath))
	messages := []map[string]string{
		{"role": "system", "content": system},
	}
	for _, m := range sanitizeHistory(req.History) {
		messages = append(messages, map[string]string{
			"role":    m.Role,
			"content": m.Content,
		})
	}
	messages = append(messages, map[string]string{
		"role":    "user",
		"content": message,
	})

	reply, err := s.callOpenAI(ctx, cfg, messages)
	if err != nil {
		return nil, err
	}

	reply = strings.TrimSpace(reply)
	if reply == "" {
		return &AIChatResponse{Reply: aiOutOfScopeMsg}, nil
	}

	// Post-filter: if the model slipped into program/diet/PED content, replace.
	if hitsSteroidTopic(reply) {
		return &AIChatResponse{Reply: aiSteroidRefuseMsg}, nil
	}
	if looksLikeProgramPrescription(reply) {
		return &AIChatResponse{Reply: aiProgramRedirectMsg}, nil
	}

	return &AIChatResponse{Reply: reply}, nil
}

func (s *AIChatService) allow(userID uint) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-aiRateWindow)
	kept := make([]time.Time, 0, len(s.rates[userID]))
	for _, t := range s.rates[userID] {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}
	if len(kept) >= aiRateMaxPerWindow {
		s.rates[userID] = kept
		return false
	}
	s.rates[userID] = append(kept, now)
	return true
}

func sanitizeHistory(history []AIChatMessage) []AIChatMessage {
	if len(history) == 0 {
		return nil
	}
	start := 0
	if len(history) > aiMaxHistoryMessages {
		start = len(history) - aiMaxHistoryMessages
	}
	out := make([]AIChatMessage, 0, len(history)-start)
	for _, m := range history[start:] {
		role := strings.ToLower(strings.TrimSpace(m.Role))
		content := strings.TrimSpace(m.Content)
		if content == "" || utf8.RuneCountInString(content) > aiMaxMessageRunes {
			continue
		}
		if role != "user" && role != "assistant" {
			continue
		}
		out = append(out, AIChatMessage{Role: role, Content: content})
	}
	return out
}

func buildFitinoSystemPrompt(profile *MeProfileDTO, pagePath string) string {
	var b strings.Builder
	b.WriteString(`تو «دستیار فیتینو» هستی — راهنمای فارسی‌زبان داخل اپلیکیشن فیتینو (Fitino / fitinoo.ir).
برند: فیتینو، پلتفرم کوچینگ آنلاین تناسب اندام در ایران با مربی‌های تأییدشده، پنل کاربر/مربی/ادمین، و هویت بصری آبی‌سبز (#187272 تا #26fce3).

قابلیت‌های اپ برای ورزشکار (دانش آموز/کاربر):
- خانه/داشبورد: خلاصه پیشرفت، جلسات، پایش
- تمرین: برنامه‌های من، جزئیات برنامه، ثبت جلسه، تاریخچه تمرینات
- تغذیه: کالری‌شمار / دفترچه غذای روزانه (ثبت غذا نسبت به اهداف مربی)
- پایش: ثبت وزن و عکس‌های جلو/پشت/بغل طبق اشتراک فعال
- حساب من: پروفایل Progressive، سفارش‌ها، ارتباط با مربی (تیکت)، سوالات متداول
- احراز هویت با موبایل/OTP، سبد خرید و پرداخت، لندینگ مربی

قوانین اجباری (هرگز نقض نکن):
1) فقط درباره فیتینو، امکانات اپ، مسیر استفاده، حساب کاربر، سفارش، تیکت، پروفایل، پایش و سوالات پشتیبانی مرتبط پاسخ بده.
2) سوالات خارج از حیطه فیتینو (سیاست، برنامه‌نویسی عمومی، اخبار، سرگرمی بی‌ربط، پزشکی عمومی و غیره) را مودبانه رد کن و بگو فقط راهنمای فیتینو هستی.
3) هرگز برنامه تمرین، برنامه غذایی/رژیم، ست/تکرار/مکرو سایکل، کالری هدف تجویزی، یا پروتکل مکمل/دارو طراحی یا پیشنهاد نکن. اگر کاربر چنین چیزی خواست دقیقاً بگو: برای تهیه برنامه تمرین یا تغذیه از طریق مربی‌های فیتینو اقدام کند.
4) درباره استروئید، سارمز، داروهای نیروزا، دوپینگ یا روش‌های خطرناک هیچ راهنمایی نده؛ رد کن و به مربی‌های فیتینو ارجاع بده.
5) اطلاعات پزشکی حساس کاربر را بازگو یا تشخیص نده؛ فقط در حد راهنمایی ناوبری اپ کمک کن.
6) پاسخ‌ها کوتاه، واضح، دوستانه و به فارسی باشه. در صورت نیاز مسیر منو را بگو (مثلاً حساب من ← ارتباط با مربی).

`)

	if pagePath != "" {
		b.WriteString("صفحه فعلی کاربر در اپ: ")
		b.WriteString(pagePath)
		b.WriteString("\n")
	}

	if profile == nil {
		return b.String()
	}

	b.WriteString("\nاطلاعات کاربر (فقط برای شخصی‌سازی راهنمایی ناوبری — برنامه نساز):\n")
	name := strings.TrimSpace(profile.FirstName + " " + profile.LastName)
	if name != "" {
		b.WriteString("- نام: " + name + "\n")
	}
	if profile.PrimaryGoal != "" {
		b.WriteString("- هدف اصلی: " + profile.PrimaryGoal + "\n")
	}
	if len(profile.Goals) > 0 {
		b.WriteString("- اهداف: " + strings.Join(profile.Goals, "، ") + "\n")
	}
	if profile.AssignedCoachName != "" {
		b.WriteString("- مربی اختصاصی: " + profile.AssignedCoachName + "\n")
	} else {
		b.WriteString("- مربی اختصاصی: هنوز تخصیص داده نشده\n")
	}
	b.WriteString(fmt.Sprintf("- پروفایل کامل: %v | پیشرفت پروفایل: ", profile.IsProfileComplete))
	if profile.ProfileProgress != nil {
		b.WriteString(fmt.Sprintf("%d%%\n", profile.ProfileProgress.Percent))
	} else {
		b.WriteString("نامشخص\n")
	}
	b.WriteString(fmt.Sprintf("- تعداد برنامه‌ها: %d | تعداد سفارش‌ها: %d\n", profile.ProgramsCount, profile.OrdersCount))
	if profile.HeightCm != nil {
		b.WriteString(fmt.Sprintf("- قد: %.0f cm\n", *profile.HeightCm))
	}
	if profile.WeightKg != nil {
		b.WriteString(fmt.Sprintf("- وزن: %.1f kg\n", *profile.WeightKg))
	}
	if profile.TargetWeightKg != nil {
		b.WriteString(fmt.Sprintf("- وزن هدف (ثبت‌شده): %.1f kg\n", *profile.TargetWeightKg))
	}
	if profile.BodyCondition != "" {
		b.WriteString("- وضعیت بدن (خوداظهاری): " + profile.BodyCondition + "\n")
	}
	if profile.Injuries != "" {
		b.WriteString("- آسیب‌ها (فقط آگاهی؛ برنامه نده): دارد\n")
	}
	if profile.MedicalHistory != "" {
		b.WriteString("- سابقه پزشکی (فقط آگاهی؛ تشخیص/برنامه نده): دارد\n")
	}

	return b.String()
}

func hitsSteroidTopic(text string) bool {
	t := strings.ToLower(text)
	keys := []string{
		"استروئید", "استرویید", "استروئیدها", "سارم", "sarm", "steroid", "anabolic",
		"وینسترول", "تستوسترون تزریق", "دکا", "ناندرولون", "ترنبولون",
		"دوپینگ", "هورمون رشد",
	}
	for _, k := range keys {
		if strings.Contains(t, strings.ToLower(k)) {
			return true
		}
	}
	return false
}

func hitsProgramOrDietTopic(text string) bool {
	t := strings.ToLower(text)
	// Strong intent phrases — avoid blocking normal nav questions like «برنامه‌های من کجاست»
	phrases := []string{
		"برنامه تمرین بده", "برنامه تمرینی بده", "تمرین بده", "برام برنامه بنویس",
		"رژیم بده", "رژیم غذایی بده", "برنامه غذایی بده", "برنامه تغذیه بده",
		"چند ست", "چند تکرار", "مکرو سایکل", "write me a workout", "make me a program",
		"meal plan", "diet plan", "workout plan for me", "برنامه بدنسازی بده",
		"چه تمرینی انجام بدم", "چی بخورم برای", "کالری هدفم چقدر باشه",
		"استروئید سیکلی", "دوره حجم",
	}
	for _, p := range phrases {
		if strings.Contains(t, strings.ToLower(p)) {
			return true
		}
	}
	// Broader ask patterns with program/diet verbs
	want := strings.Contains(t, "بده") || strings.Contains(t, "بنویس") || strings.Contains(t, "طراحی") ||
		strings.Contains(t, "پیشنهاد کن") || strings.Contains(t, "تجویز")
	topic := strings.Contains(t, "برنامه تمرین") || strings.Contains(t, "برنامه غذایی") ||
		strings.Contains(t, "برنامه تغذیه") || strings.Contains(t, "رژیم") ||
		strings.Contains(t, "workout program") || strings.Contains(t, "meal plan")
	return want && topic
}

func looksLikeProgramPrescription(text string) bool {
	t := strings.ToLower(text)
	markers := []string{
		"ست ×", "ست x", "تکرار:", "روز ۱:", "روز 1:", "هفته ۱",
		"breakfast:", "ناهار:", "شام:", "کالری هدف:", "پروتئین هدف:",
		"سیکل استروئید", "دوز:",
	}
	hits := 0
	for _, m := range markers {
		if strings.Contains(t, m) {
			hits++
		}
	}
	return hits >= 2
}

type openAIChatRequest struct {
	Model       string              `json:"model"`
	Messages    []map[string]string `json:"messages"`
	Temperature float32             `json:"temperature"`
	MaxTokens   int                 `json:"max_tokens"`
}

type openAIChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func (s *AIChatService) callOpenAI(ctx context.Context, cfg config.Config, messages []map[string]string) (string, error) {
	oai := cfg.OpenAI
	payload := openAIChatRequest{
		Model:       oai.Model,
		Messages:    messages,
		Temperature: 0.4,
		MaxTokens:   500,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	url := oai.BaseURL + "/chat/completions"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+oai.APIKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrAIUpstream, err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	var parsed openAIChatResponse
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return "", fmt.Errorf("%w: invalid response", ErrAIUpstream)
	}
	if resp.StatusCode >= 300 {
		msg := "upstream error"
		if parsed.Error != nil && parsed.Error.Message != "" {
			msg = parsed.Error.Message
		}
		return "", fmt.Errorf("%w: %s", ErrAIUpstream, msg)
	}
	if len(parsed.Choices) == 0 {
		return "", fmt.Errorf("%w: empty choices", ErrAIUpstream)
	}
	return parsed.Choices[0].Message.Content, nil
}
