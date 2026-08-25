package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/service/ai"
)

// FunnelPublicBasePath is the public Next.js route for the sales funnel.
const FunnelPublicBasePath = "/analysis"

func funnelPaymentPath(token string) string {
	return FunnelPublicBasePath + "/payment?token=" + token
}

type AnalyzeFunnelRequest struct {
	CheckoutToken      string  `json:"checkoutToken"`
	Gender             string  `json:"gender"`
	PrimaryGoal        string  `json:"primaryGoal"`
	ActivityLevel      string  `json:"activityLevel"`
	TrainingEnv        string  `json:"trainingEnv"`
	TrainingFrequency  string  `json:"trainingFrequency"`
	Experience         string  `json:"experience"`
	NutritionChallenge string  `json:"nutritionChallenge"`
	SleepHours         string  `json:"sleepHours"`
	StressLevel        string  `json:"stressLevel"`
	MainObstacle       string  `json:"mainObstacle"`
	Commitment         string  `json:"commitment"`
	Age                int     `json:"age"`
	HeightCm           float64 `json:"heightCm"`
	WeightKg           float64 `json:"weightKg"`
}

type FunnelTextBlockDTO struct {
	Title string `json:"title"`
	Body  string `json:"body"`
}

type FunnelRouteBlockDTO struct {
	Title      string `json:"title"`
	Body       string `json:"body"`
	SuccessPct int    `json:"successPct"`
}

type FunnelTrendChartDTO struct {
	Title  string `json:"title"`
	YLabel string `json:"yLabel"`
	Values []int  `json:"values"`
	YMax   int    `json:"yMax"`
}

type FunnelChartBarDTO struct {
	Label string `json:"label"`
	Value int    `json:"value"`
}

type FunnelAnalysisDTO struct {
	AIWarning            string               `json:"aiWarning"`
	StatusSummary        FunnelTextBlockDTO   `json:"statusSummary"`
	CustomSolution       FunnelTextBlockDTO   `json:"customSolution"`
	RoutePrediction      FunnelRouteBlockDTO  `json:"routePrediction"`
	TrendChart           FunnelTrendChartDTO  `json:"trendChart"`
	ChartBars            []FunnelChartBarDTO  `json:"chartBars"`
	AnalysisReadyTitle   string               `json:"analysisReadyTitle"`
	AnalysisReadyBody    string               `json:"analysisReadyBody"`
	AIGuard              string               `json:"aiGuard"`
	SuccessPct           int                  `json:"successPct"`
	// Source tells the client how the packet was produced: openai | mock | fallback.
	Source string `json:"source"`
}

func applyFunnelMetrics(lead *models.FunnelLead, req *CreateFunnelLeadRequest) {
	if lead == nil || req == nil {
		return
	}
	if req.Age > 0 {
		lead.Age = req.Age
	}
	if req.HeightCm > 0 {
		lead.HeightCm = req.HeightCm
	}
	if req.WeightKg > 0 {
		lead.WeightKg = req.WeightKg
	}
	if raw := strings.TrimSpace(req.AnalysisJSON); raw != "" {
		lead.AnalysisJSON = raw
	}
}

func (s *funnelService) Analyze(ctx context.Context, req *AnalyzeFunnelRequest) (*FunnelAnalysisDTO, error) {
	if req == nil {
		return nil, ErrFunnelInvalidInput
	}
	if token := strings.TrimSpace(req.CheckoutToken); token != "" {
		if lead, err := s.repo.FindByCheckoutToken(ctx, token); err == nil && lead != nil {
			fillAnalyzeFromLead(req, lead)
		}
	}
	if strings.TrimSpace(req.PrimaryGoal) == "" {
		return nil, ErrFunnelInvalidInput
	}
	packet, err := generateFunnelAnalysisPacket(ctx, req)
	if err != nil {
		return nil, err
	}
	return packet, nil
}

func (s *funnelService) ensureLeadAnalysis(ctx context.Context, lead *models.FunnelLead) error {
	if lead == nil {
		return nil
	}
	if strings.TrimSpace(lead.AnalysisJSON) == "" {
		req := analyzeReqFromLead(lead)
		packet, err := generateFunnelAnalysisPacket(ctx, req)
		if err != nil {
			return err
		}
		raw, err := json.Marshal(packet)
		if err != nil {
			return err
		}
		lead.AnalysisJSON = string(raw)
		if strings.TrimSpace(lead.AnalysisTitle) == "" {
			lead.AnalysisTitle = packet.AnalysisReadyTitle
		}
		if strings.TrimSpace(lead.AnalysisBody) == "" {
			lead.AnalysisBody = packet.StatusSummary.Body
		}
		if err := s.repo.Update(ctx, lead); err != nil {
			return err
		}
	}
	return nil
}

// persistFunnelAIAnalysis writes the funnel AI packet into funnel_ai_analyses
// keyed by phone so nutrition/workout generators can load it later.
func (s *funnelService) persistFunnelAIAnalysis(ctx context.Context, lead *models.FunnelLead, req *CreateFunnelLeadRequest) error {
	if s.analysisRepo == nil || lead == nil {
		return nil
	}
	phone := strings.TrimSpace(lead.Phone)
	if phone == "" {
		return nil
	}

	now := time.Now()
	row := &models.FunnelAIAnalysis{
		Phone:              phone,
		PrimaryGoal:        lead.PrimaryGoal,
		ActivityLevel:      lead.ActivityLevel,
		TrainingEnv:        lead.TrainingEnv,
		Experience:         lead.Experience,
		NutritionChallenge: lead.NutritionChallenge,
		MainObstacle:       lead.MainObstacle,
		Commitment:         lead.Commitment,
		Scenario:           lead.Scenario,
		Age:                lead.Age,
		HeightCm:           lead.HeightCm,
		WeightKg:           lead.WeightKg,
		AnalysisJSON:       lead.AnalysisJSON,
		AnalyzedAt:         &now,
	}
	if lead.ID > 0 {
		id := lead.ID
		row.FunnelLeadID = &id
	}
	if req != nil {
		if g := strings.TrimSpace(req.Gender); g != "" {
			row.Gender = g
		}
		if tf := strings.TrimSpace(req.TrainingFrequency); tf != "" {
			row.TrainingFrequency = tf
		}
		if sh := strings.TrimSpace(req.SleepHours); sh != "" {
			row.SleepHours = sh
		}
		if sl := strings.TrimSpace(req.StressLevel); sl != "" {
			row.StressLevel = sl
		}
		answers, _ := json.Marshal(map[string]interface{}{
			"gender":             req.Gender,
			"primaryGoal":        req.PrimaryGoal,
			"activityLevel":      req.ActivityLevel,
			"trainingEnv":        req.TrainingEnv,
			"trainingFrequency":  req.TrainingFrequency,
			"experience":         req.Experience,
			"nutritionChallenge": req.NutritionChallenge,
			"sleepHours":         req.SleepHours,
			"stressLevel":        req.StressLevel,
			"mainObstacle":       req.MainObstacle,
			"commitment":         req.Commitment,
			"age":                req.Age,
			"heightCm":           req.HeightCm,
			"weightKg":           req.WeightKg,
		})
		row.AnswersJSON = string(answers)
	}

	fillAnalysisNarrativeFields(row, lead.AnalysisJSON)

	if s.userRepo != nil {
		if user, err := s.userRepo.FindByPhone(ctx, phone); err == nil && user != nil {
			uid := user.ID
			row.UserID = &uid
		}
	}

	return s.analysisRepo.Create(ctx, row)
}

func fillAnalysisNarrativeFields(row *models.FunnelAIAnalysis, rawJSON string) {
	rawJSON = strings.TrimSpace(rawJSON)
	if row == nil || rawJSON == "" {
		return
	}
	var packet FunnelAnalysisDTO
	if err := json.Unmarshal([]byte(rawJSON), &packet); err != nil {
		return
	}
	row.AnalysisSource = packet.Source
	row.AIWarning = packet.AIWarning
	row.StatusSummary = packet.StatusSummary.Body
	row.CustomSolution = packet.CustomSolution.Body
	row.RoutePrediction = packet.RoutePrediction.Body
	row.SuccessPct = packet.SuccessPct
	if row.SuccessPct == 0 {
		row.SuccessPct = packet.RoutePrediction.SuccessPct
	}
}

func fillAnalyzeFromLead(req *AnalyzeFunnelRequest, lead *models.FunnelLead) {
	if strings.TrimSpace(req.PrimaryGoal) == "" {
		req.PrimaryGoal = lead.PrimaryGoal
	}
	if strings.TrimSpace(req.ActivityLevel) == "" {
		req.ActivityLevel = lead.ActivityLevel
	}
	if strings.TrimSpace(req.TrainingEnv) == "" {
		req.TrainingEnv = lead.TrainingEnv
	}
	if strings.TrimSpace(req.Experience) == "" {
		req.Experience = lead.Experience
	}
	if strings.TrimSpace(req.NutritionChallenge) == "" {
		req.NutritionChallenge = lead.NutritionChallenge
	}
	if strings.TrimSpace(req.MainObstacle) == "" {
		req.MainObstacle = lead.MainObstacle
	}
	if strings.TrimSpace(req.Commitment) == "" {
		req.Commitment = lead.Commitment
	}
	if req.Age <= 0 {
		req.Age = lead.Age
	}
	if req.HeightCm <= 0 {
		req.HeightCm = lead.HeightCm
	}
	if req.WeightKg <= 0 {
		req.WeightKg = lead.WeightKg
	}
}

func analyzeReqFromLead(lead *models.FunnelLead) *AnalyzeFunnelRequest {
	return &AnalyzeFunnelRequest{
		PrimaryGoal:        lead.PrimaryGoal,
		ActivityLevel:      lead.ActivityLevel,
		TrainingEnv:        lead.TrainingEnv,
		Experience:         lead.Experience,
		NutritionChallenge: lead.NutritionChallenge,
		MainObstacle:       lead.MainObstacle,
		Commitment:         lead.Commitment,
		Age:                lead.Age,
		HeightCm:           lead.HeightCm,
		WeightKg:           lead.WeightKg,
	}
}

func generateFunnelAnalysisPacket(ctx context.Context, req *AnalyzeFunnelRequest) (*FunnelAnalysisDTO, error) {
	userCtx := buildFunnelAnalysisPrompt(req)
	schema, res, err := ai.GenerateFunnelAnalysis(ctx, userCtx)
	if err != nil {
		dto := buildPersonalizedFunnelDTO(req)
		dto.Source = "fallback"
		return dto, nil
	}
	if res != nil && res.UsedMock {
		dto := buildPersonalizedFunnelDTO(req)
		dto.Source = "mock"
		return dto, nil
	}
	if err := ai.ValidateFunnelAnalysis(schema); err != nil {
		// Keep AI narrative text when present; only fill missing charts locally.
		if schema != nil && strings.TrimSpace(schema.AIWarning) != "" &&
			strings.TrimSpace(schema.StatusSummaryBody) != "" {
			dto := funnelSchemaToDTO(schema)
			fillMissingCharts(dto, req)
			dto.Source = "openai"
			return dto, nil
		}
		dto := buildPersonalizedFunnelDTO(req)
		dto.Source = "fallback"
		return dto, nil
	}
	dto := funnelSchemaToDTO(schema)
	fillMissingCharts(dto, req)
	dto.Source = "openai"
	return dto, nil
}

func fillMissingCharts(dto *FunnelAnalysisDTO, req *AnalyzeFunnelRequest) {
	if dto == nil {
		return
	}
	if len(dto.TrendChart.Values) != 12 || strings.TrimSpace(dto.TrendChart.Title) == "" {
		dto.TrendChart = buildPersonalizedTrendChart(req)
	}
	if len(dto.ChartBars) != 5 {
		dto.ChartBars = buildPersonalizedChartBars(req)
	}
}

func buildPersonalizedFunnelDTO(req *AnalyzeFunnelRequest) *FunnelAnalysisDTO {
	if req == nil {
		return &FunnelAnalysisDTO{Source: "fallback"}
	}
	goal := funnelGoalLabel(req.PrimaryGoal)
	activity := funnelActivityLabel(req.ActivityLevel)
	env := funnelEnvLabel(req.TrainingEnv)
	exp := funnelExpLabel(req.Experience)
	nutrition := funnelNutritionLabel(req.NutritionChallenge)
	obstacle := funnelObstacleLabel(req.MainObstacle)
	commit := funnelCommitLabel(req.Commitment)

	pct := 82
	switch req.MainObstacle {
	case "plateau":
		pct = 86
	case "motivation":
		pct = 78
	case "knowledge":
		pct = 84
	}
	if req.Commitment == "max_results" {
		pct += 4
	} else if req.Commitment == "steady" {
		pct += 2
	}
	if pct > 95 {
		pct = 95
	}
	if pct < 55 {
		pct = 55
	}

	metricsNote := ""
	if req.Age > 0 && req.HeightCm > 0 && req.WeightKg > 0 {
		base := 10*req.WeightKg + 6.25*req.HeightCm - 5*float64(req.Age)
		bmr := int(base + 5)
		if strings.TrimSpace(req.Gender) == "female" {
			bmr = int(base - 161)
		}
		h := req.HeightCm / 100
		bmi := 0.0
		if h > 0 {
			bmi = req.WeightKg / (h * h)
		}
		metricsNote = fmt.Sprintf(" BMR تخمینی %d و BMI حدود %.1f در تحلیل لحاظ شد.", bmr, bmi)
	}

	sleep := funnelSleepLabel(req.SleepHours)
	if strings.TrimSpace(req.SleepHours) == "" {
		sleep = "الگوی خواب فعلی"
	}
	stress := funnelStressLabel(req.StressLevel)
	if strings.TrimSpace(req.StressLevel) == "" {
		stress = obstacle
	}
	aiWarning := fmt.Sprintf(
		"تحلیل سیستم: برای هدف «%s» با تغذیه «%s»، خواب «%s» و استرس «%s»، بدن شما به تغییرات یکنواخت حساس است. با تعهد «%s» و سطح «%s»، ایجنت‌های فیتینو پروتکل بارگذاری و تغذیه را برای جلوگیری از استپ تنظیم می‌کنند.",
		goal, nutrition, sleep, stress, commit, exp,
	)
	statusBody := fmt.Sprintf(
		"بر اساس پاسخ‌های شما (فعالیت: %s، چالش تغذیه: %s)، سیستم متابولیک در وضعیت نیازمند کالیبراسیون قرار دارد.%s رژیم‌های عمومی معمولاً با «%s» هم‌راستا نیستند.",
		activity, nutrition, metricsNote, obstacle,
	)
	solutionBody := fmt.Sprintf(
		"پروتکل اختصاصی فیتینو برای «%s» طراحی می‌شود: تمرین در محیط %s، سطح %s، و تغذیه متناسب با چالش «%s». تعهد شما (%s) در شدت برنامه اعمال می‌شود.",
		goal, env, exp, nutrition, commit,
	)
	routeBody := fmt.Sprintf(
		"با توجه به هدف «%s» و مانع «%s»، مسیر پیشنهادی بر حفظ عضله و بازیابی متابولیسم متمرکز است.",
		goal, obstacle,
	)

	return &FunnelAnalysisDTO{
		AIWarning: aiWarning,
		StatusSummary: FunnelTextBlockDTO{
			Title: "خلاصه وضعیت",
			Body:  statusBody,
		},
		CustomSolution: FunnelTextBlockDTO{
			Title: "راهکار اختصاصی ایجنت‌های فیتینو",
			Body:  solutionBody,
		},
		RoutePrediction: FunnelRouteBlockDTO{
			Title:      "پیش‌بینی مسیر",
			Body:       routeBody,
			SuccessPct: pct,
		},
		TrendChart:         buildPersonalizedTrendChart(req),
		ChartBars:          buildPersonalizedChartBars(req),
		AnalysisReadyTitle: "📊 گزارش آنالیز اختصاصی بدنی شما آماده است",
		AnalysisReadyBody:  "داده‌های فیزیولوژیک و پاسخ‌های ارزیابی ثبت شد. پس از تکمیل سفارش، کالیبراسیون برنامه توسط سیستم هوشمند فیتینو آغاز می‌شود.",
		AIGuard:            "پایش ضد استپ فیتینو: به محض کند شدن چربی‌سوزی، سیستم هوشمند برنامه را بدون هزینه اضافه به‌روز می‌کند.",
		SuccessPct:         pct,
	}
}

func funnelSchemaToDTO(a *ai.FunnelAnalysisSchema) *FunnelAnalysisDTO {
	pct := a.SuccessPct
	if pct < 55 {
		pct = 55
	}
	if pct > 95 {
		pct = 95
	}
	statusTitle := strings.TrimSpace(a.StatusSummaryTitle)
	if statusTitle == "" {
		statusTitle = "خلاصه وضعیت"
	}
	solutionTitle := strings.TrimSpace(a.CustomSolutionTitle)
	if solutionTitle == "" {
		solutionTitle = "راهکار اختصاصی ایجنت‌های فیتینو"
	}
	routeTitle := strings.TrimSpace(a.RoutePredictionTitle)
	if routeTitle == "" {
		routeTitle = "پیش‌بینی مسیر"
	}
	return &FunnelAnalysisDTO{
		AIWarning: a.AIWarning,
		StatusSummary: FunnelTextBlockDTO{
			Title: statusTitle,
			Body:  a.StatusSummaryBody,
		},
		CustomSolution: FunnelTextBlockDTO{
			Title: solutionTitle,
			Body:  a.CustomSolutionBody,
		},
		RoutePrediction: FunnelRouteBlockDTO{
			Title:      routeTitle,
			Body:       a.RoutePredictionBody,
			SuccessPct: pct,
		},
		TrendChart: FunnelTrendChartDTO{
			Title:  a.TrendChartTitle,
			YLabel: a.TrendChartYLabel,
			Values: append([]int(nil), a.TrendChartValues...),
			YMax:   a.TrendChartYMax,
		},
		ChartBars:          funnelChartBarsToDTO(a.ChartBars),
		AnalysisReadyTitle: a.AnalysisReadyTitle,
		AnalysisReadyBody:  a.AnalysisReadyBody,
		AIGuard:            a.AIGuard,
		SuccessPct:         pct,
	}
}

func funnelChartBarsToDTO(bars []ai.FunnelChartBarSchema) []FunnelChartBarDTO {
	out := make([]FunnelChartBarDTO, 0, len(bars))
	for _, bar := range bars {
		out = append(out, FunnelChartBarDTO{Label: bar.Label, Value: bar.Value})
	}
	return out
}

func buildPersonalizedTrendChart(req *AnalyzeFunnelRequest) FunnelTrendChartDTO {
	switch strings.TrimSpace(req.PrimaryGoal) {
	case "muscle_gain":
		return FunnelTrendChartDTO{
			Title:  "پیش‌بینی روند ۱۲ هفته عضله‌سازی فعال (هایپرتروفی)",
			YLabel: "پیشرفت حجم عضلانی (٪)",
			Values: []int{4, 9, 14, 18, 22, 26, 29, 32, 35, 37, 39, 40},
			YMax:   40,
		}
	case "fitness":
		return FunnelTrendChartDTO{
			Title:  "پیش‌بینی روند ۱۲ هفته فرم‌دهی و آمادگی بدنی",
			YLabel: "امتیاز فرم و آمادگی (٪)",
			Values: []int{6, 11, 16, 20, 24, 27, 30, 33, 35, 37, 39, 40},
			YMax:   40,
		}
	default:
		return FunnelTrendChartDTO{
			Title:  "پیش‌بینی روند ۱۲ هفته کاهش چربی فعال (چربی‌سوزی فعال)",
			YLabel: "درصد چربی تخمینی بدن (وزن)",
			Values: []int{40, 34, 30, 27, 24, 21, 19, 16, 13, 10, 6, 2},
			YMax:   40,
		}
	}
}

func buildPersonalizedChartBars(req *AnalyzeFunnelRequest) []FunnelChartBarDTO {
	boost := 0
	if req.Commitment == "max_results" {
		boost = 4
	} else if req.Commitment == "steady" {
		boost = 2
	}
	clamp := func(v int) int {
		v += boost
		if v < 40 {
			return 40
		}
		if v > 95 {
			return 95
		}
		return v
	}
	switch strings.TrimSpace(req.PrimaryGoal) {
	case "muscle_gain":
		return []FunnelChartBarDTO{
			{Label: "قدرت", Value: clamp(72)},
			{Label: "حجم", Value: clamp(85)},
			{Label: "استقامت", Value: clamp(58)},
			{Label: "ریکاوری", Value: clamp(64)},
			{Label: "ثبات", Value: clamp(68)},
		}
	case "fitness":
		return []FunnelChartBarDTO{
			{Label: "فرم", Value: clamp(78)},
			{Label: "انرژی", Value: clamp(82)},
			{Label: "قدرت", Value: clamp(68)},
			{Label: "تعادل", Value: clamp(75)},
			{Label: "ثبات", Value: clamp(72)},
		}
	default:
		return []FunnelChartBarDTO{
			{Label: "چربی‌سوزی", Value: clamp(88)},
			{Label: "حفظ عضله", Value: clamp(70)},
			{Label: "ثبات", Value: clamp(62)},
			{Label: "متابولیسم", Value: clamp(55)},
			{Label: "استقامت", Value: clamp(60)},
		}
	}
}

func buildFunnelAnalysisPrompt(req *AnalyzeFunnelRequest) string {
	bmr := 0
	bmi := 0.0
	if req.Age > 0 && req.HeightCm > 0 && req.WeightKg > 0 {
		base := 10*req.WeightKg + 6.25*req.HeightCm - 5*float64(req.Age)
		bmr = int(base + 5)
		if strings.TrimSpace(req.Gender) == "female" {
			bmr = int(base - 161)
		}
		h := req.HeightCm / 100
		if h > 0 {
			bmi = req.WeightKg / (h * h)
		}
	}
	var b strings.Builder
	b.WriteString("داده‌های فانل ارزیابی هوشمند فیتینو (منبع حقیقت برای متن):\n")
	fmt.Fprintf(&b, "- هدف اصلی: %s\n", funnelGoalLabel(req.PrimaryGoal))
	if g := strings.TrimSpace(req.Gender); g != "" {
		fmt.Fprintf(&b, "- جنسیت: %s\n", funnelGenderLabel(g))
	}
	fmt.Fprintf(&b, "- فعالیت روزانه: %s\n", funnelActivityLabel(req.ActivityLevel))
	if tf := strings.TrimSpace(req.TrainingFrequency); tf != "" {
		fmt.Fprintf(&b, "- تعداد جلسات ورزش: %s\n", funnelTrainingFreqLabel(tf))
	}
	fmt.Fprintf(&b, "- سطح تجربه/آمادگی: %s\n", funnelExpLabel(req.Experience))
	fmt.Fprintf(&b, "- وضعیت تغذیه: %s\n", funnelNutritionLabel(req.NutritionChallenge))
	if sh := strings.TrimSpace(req.SleepHours); sh != "" {
		fmt.Fprintf(&b, "- خواب شبانه: %s\n", funnelSleepLabel(sh))
	}
	if sl := strings.TrimSpace(req.StressLevel); sl != "" {
		fmt.Fprintf(&b, "- استرس روزانه: %s\n", funnelStressLabel(sl))
	} else {
		fmt.Fprintf(&b, "- مانع اصلی: %s\n", funnelObstacleLabel(req.MainObstacle))
	}
	fmt.Fprintf(&b, "- تعهد و آمادگی اجرا: %s\n", funnelCommitLabel(req.Commitment))
	if req.Age > 0 {
		fmt.Fprintf(&b, "- سن: %d سال\n", req.Age)
	}
	if req.HeightCm > 0 {
		fmt.Fprintf(&b, "- قد: %.0f سانتی‌متر\n", req.HeightCm)
	}
	if req.WeightKg > 0 {
		fmt.Fprintf(&b, "- وزن: %.1f کیلوگرم\n", req.WeightKg)
	}
	if bmr > 0 {
		fmt.Fprintf(&b, "- BMR تخمینی (میفلین، پایه مردانه): %d کیلوکالری\n", bmr)
	}
	if bmi > 0 {
		fmt.Fprintf(&b, "- BMI تخمینی: %.1f\n", bmi)
	}
	b.WriteString("این داده‌ها از پاسخ‌های همین فانل (و در صورت وجود، رکورد ذخیره‌شده در دیتابیس) آمده‌اند. متن را شخصی‌سازی کن.")
	return b.String()
}

func funnelGoalLabel(v string) string {
	switch v {
	case "weight_loss":
		return "چربی‌سوزی و کاهش وزن"
	case "muscle_gain":
		return "عضله‌سازی"
	case "fitness":
		return "فیتنس و فرم‌دهی"
	default:
		return v
	}
}

func funnelActivityLabel(v string) string {
	switch v {
	case "sedentary":
		return "کم‌تحرک"
	case "moderate":
		return "تحرک متوسط"
	case "active":
		return "پرتحرک"
	default:
		return v
	}
}

func funnelEnvLabel(v string) string {
	switch v {
	case "home":
		return "خانه"
	case "gym":
		return "باشگاه"
	default:
		return v
	}
}

func funnelExpLabel(v string) string {
	switch v {
	case "beginner":
		return "مبتدی"
	case "intermediate":
		return "متوسط"
	case "advanced":
		return "پیشرفته"
	default:
		return v
	}
}

func funnelNutritionLabel(v string) string {
	switch v {
	case "irregular":
		return "تغذیه نامنظم"
	case "partly_controlled":
		return "تغذیه نسبتاً کنترل‌شده"
	case "controlled":
		return "تغذیه منظم"
	case "sweets":
		return "ریزه‌خواری و شیرینی"
	case "low_appetite":
		return "کم‌اشتهایی"
	case "no_time":
		return "کمبود وقت برای آشپزی"
	default:
		return v
	}
}

func funnelObstacleLabel(v string) string {
	switch v {
	case "motivation":
		return "رها شدن مسیر / کمبود نظارت"
	case "plateau":
		return "استپ وزنی"
	case "knowledge":
		return "نداشتن مسیر اصولی"
	default:
		return v
	}
}

func funnelCommitLabel(v string) string {
	switch v {
	case "flexible":
		return "تغییرات ساده و کم‌فشار"
	case "steady":
		return "پایبندی در بیشتر روزها"
	case "max_results":
		return "برنامه جدی و پرشدت"
	default:
		return v
	}
}

func funnelGenderLabel(v string) string {
	switch v {
	case "male":
		return "مرد"
	case "female":
		return "زن"
	case "prefer_not_say":
		return "ترجیح نداده"
	default:
		return v
	}
}

func funnelTrainingFreqLabel(v string) string {
	switch v {
	case "none":
		return "بدون ورزش منظم"
	case "sessions_1_3":
		return "۱ تا ۳ جلسه در هفته"
	case "sessions_4_plus":
		return "۴ جلسه یا بیشتر"
	default:
		return v
	}
}

func funnelSleepLabel(v string) string {
	switch v {
	case "under_6":
		return "کمتر از ۶ ساعت"
	case "hours_6_8":
		return "۶ تا ۸ ساعت"
	case "over_8":
		return "بیشتر از ۸ ساعت"
	default:
		return v
	}
}

func funnelStressLabel(v string) string {
	switch v {
	case "low":
		return "کم"
	case "medium":
		return "متوسط"
	case "high":
		return "زیاد"
	default:
		return v
	}
}
