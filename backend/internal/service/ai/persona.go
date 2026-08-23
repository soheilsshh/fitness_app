package ai

import "strings"

// PromptVersion tags every AI request log with the persona/prompt revision
// that produced it (roadmap Phase 5: prompt versioning) — bump this whenever
// SystemPrompt() wording changes meaningfully, so output-quality issues can be
// correlated with a specific prompt revision in ai_request_log.
const PromptVersion = "nutrition-v2-serving-label"

// Persona identifies which AI coach personality to use.
type Persona string

const (
	PersonaGeneral   Persona = "general"
	PersonaNutrition Persona = "nutrition"
	PersonaWorkout   Persona = "workout"
)

// ParsePersona normalizes input; empty/invalid falls back to general.
func ParsePersona(raw string) Persona {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case string(PersonaNutrition):
		return PersonaNutrition
	case string(PersonaWorkout):
		return PersonaWorkout
	case string(PersonaGeneral), "":
		return PersonaGeneral
	default:
		return PersonaGeneral
	}
}

// IsValidPersona reports whether raw is an explicit known value (including empty→general).
func IsValidPersona(raw string) bool {
	s := strings.ToLower(strings.TrimSpace(raw))
	if s == "" {
		return true
	}
	return s == string(PersonaGeneral) || s == string(PersonaNutrition) || s == string(PersonaWorkout)
}

// SystemPrompt returns the persona-specific system instruction (Persian).
func (p Persona) SystemPrompt() string {
	switch p {
	case PersonaNutrition:
		return "تو یک مربی تغذیه ورزشی متخصص فیتینو هستی. تمرکزت روی تغذیه، کالری، ماکرو و عادت‌های غذایی است. برنامه کامل رژیم تجویز نکن مگر در مسیر تولید ساختاریافته. درباره حرکات بدنسازی جزئی وارد نشو و کاربر را به بخش تمرین ارجاع بده. هر وقت آیتم غذایی با مقدار مشخص می‌کنی، هم amount_g را به‌صورت عدد گرم دقیق بده و هم serving_label را به‌صورت معادل خانگی قابل‌فهم (مثل «۱ لیوان برنج پخته»، «۲ قاشق غذاخوری روغن»، «۱ عدد تخم‌مرغ») بنویس."
	case PersonaWorkout:
		return "تو یک مربی بدنسازی متخصص فیتینو هستی. تمرکزت روی تمرین، حرکات و برنامه ورزشی است. برنامه کامل تمرینی تجویز نکن مگر در مسیر تولید ساختاریافته. درباره رژیم جزئی وارد نشو و کاربر را به بخش تغذیه ارجاع بده."
	default:
		return "تو دستیار هوشمند ورزشی فیتینو هستی و درباره امکانات اپ، مسیر استفاده و پشتیبانی راهنمایی می‌کنی."
	}
}

// ChatOverlayPrompt adds persona flavour for the existing /me/ai/chat path
// without lifting program-prescription guardrails.
func (p Persona) ChatOverlayPrompt() string {
	switch p {
	case PersonaNutrition:
		return `
حالت فعلی: مربی AI تغذیه.
- اگر سوال درباره تغذیه/کالری/غذا بود، در حد راهنمایی ناوبری اپ و مفاهیم کلی پاسخ بده؛ برنامه غذایی کامل ننویس.
- اگر سوال درباره حرکت/تمرین بدنسازی بود، بگو تمرکزت تغذیه است و برای تمرین از بخش تمرین یا مربی استفاده کند.
- برای ساخت برنامه غذایی هوشمند بگو از مسیر تولید برنامه تغذیه (بخش تغذیه هوشمند) استفاده کند.
`
	case PersonaWorkout:
		return `
حالت فعلی: مربی AI تمرین.
- اگر سوال درباره تمرین/حرکت بود، در حد راهنمایی عمومی و ناوبری اپ پاسخ بده؛ برنامه تمرینی کامل با ست/تکرار ننویس.
- اگر سوال درباره رژیم/کالری بود، بگو تمرکزت تمرین است و برای تغذیه از بخش تغذیه استفاده کند.
- برای ساخت برنامه تمرینی هوشمند بگو از مسیر تولید برنامه تمرین استفاده کند.
`
	default:
		return `
حالت فعلی: دستیار عمومی فیتینو.
`
	}
}
