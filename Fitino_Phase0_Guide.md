# راهنمای کامل اجرای فاز ۰ — زیرساخت هوش مصنوعی ساختاریافته
> این راهنما قدم‌به‌قدم و برای کسی که تازه‌کاره نوشته شده. هر بخش رو با مثال کد واقعی (Go) توضیح می‌دم.

---

## ۱) اول بفهمیم چرا اصلاً این فاز لازمه

الان تو پروژه‌ت یک `ai_chat_controller` داری که کاربر پیام می‌فرسته و AI (مثل ChatGPT) جواب متنی می‌ده. این برای **چت** عالیه، اما یک مشکل بزرگ داره:

> اگه از AI بخوای «برای من برنامه غذایی بنویس»، AI یک **متن آزاد و بدون‌ساختار** برمی‌گردونه. مثلاً:
> *"صبحانه: ۲ تخم‌مرغ + نان سنگک... ناهار: ۲۰۰ گرم مرغ + برنج..."*

این متن رو **نمی‌تونی مستقیم توی دیتابیس ذخیره کنی**، چون:
- کالری هر وعده رو نمی‌دونی (باید حساب کنی)
- نمی‌تونی توی جدول `nutrition_program` که ستون‌های مشخص (کالری، پروتئین، کربوهیدرات...) داره بریزیش
- نمی‌تونی توی اپ نمودار یا چک‌لیست ازش بسازی، چون فقط یک تیکه متنه

**راه‌حل:** به‌جای اینکه از AI بخوای «متن بنویس»، به‌ش می‌گی «این فرم (schema) رو دقیقاً با همین فرمت پر کن». به این کار می‌گن **Structured Output** یا **Function Calling**.

### مثال ساده برای درک بهتر

**روش قدیم (چت آزاد):**
```
کاربر: برام صبحانه ۴۰۰ کالری بنویس
AI: "میتونی ۲ عدد تخم‌مرغ آب‌پز با یک تکه نان سنگک بخوری که در حدود ۴۰۰ کالری داره..."
```
این یک رشته متن ساده‌ست. برنامه‌ت نمی‌تونه بفهمه کالریش دقیقاً چنده، پروتئینش چنده و...

**روش جدید (Structured Output):**
```
کاربر: برام صبحانه ۴۰۰ کالری بنویس
AI: {
  "meal_name": "صبحانه",
  "items": [
    {"food": "تخم‌مرغ آب‌پز", "amount_g": 100, "calories": 155, "protein_g": 13},
    {"food": "نان سنگک", "amount_g": 60, "calories": 165, "protein_g": 5}
  ],
  "total_calories": 320
}
```
این یک **JSON با ساختار مشخص**ه که مستقیم می‌تونی با کد Go بخونیش و توی دیتابیس بریزیش.

**نتیجه:** فاز ۰ یعنی یاد گرفتن اینکه چطور AI رو مجبور کنیم به‌جای متن آزاد، همیشه این نوع JSON منظم برگردونه.

---

## ۲) پیش‌نیازها قبل از شروع کدنویسی

1. مطمئن شو `OPENAI_API_KEY` توی فایل `.env` بک‌اندت ست شده (طبق `PROJECT_INVENTORY.md` این کلید از قبل استفاده می‌شه، پس احتمالاً داری)
2. مدل پیشنهادی: از یک مدل OpenAI که از قابلیت **Structured Outputs / function calling با `strict: true`** پشتیبانی می‌کنه استفاده کن (این رو موقع نوشتن کد در تنظیمات درخواست مشخص می‌کنی، نیازی به سرویس یا کتابخانه جدید نیست)
3. جایی که الان کد `ai_chat_controller` هست رو باز کن تا ببینیم چطور به OpenAI وصل می‌شه (این‌الان با API استاندارد `/v1/chat/completions` کار می‌کنه احتمالاً)

---

## ۳) BE-0.1 — طراحی JSON Schemaهای پایه

اولین قدم اینه که مشخص کنی هر خروجی AI دقیقاً باید چه شکلی باشه. این کار رو **قبل از نوشتن هر کد Go**ای انجام بده، روی کاغذ یا یک فایل جدا.

### قدم عملی: یک فایل جدید بساز

```
backend/internal/service/ai/schemas.go
```

و توش این‌طوری تعریف کن (این کد Go structها هستن که هم برای Unmarshal کردن جواب AI و هم برای ساخت خود Schema که به AI می‌فرستی استفاده می‌شن):

```go
package ai

// ---- Schema برنامه تغذیه ----
type NutritionPlanSchema struct {
	GoalType    string           `json:"goal_type"`     // "cut" | "bulk" | "maintain"
	TotalCalories int            `json:"total_calories"`
	ProteinG    int              `json:"protein_g"`
	CarbsG      int              `json:"carbs_g"`
	FatG        int              `json:"fat_g"`
	Meals       []MealSchema     `json:"meals"`
}

type MealSchema struct {
	Name  string       `json:"name"`  // "صبحانه", "ناهار", ...
	Items []FoodItem   `json:"items"`
}

type FoodItem struct {
	FoodName  string  `json:"food_name"`
	AmountG   float64 `json:"amount_g"`
	Calories  int     `json:"calories"`
	ProteinG  float64 `json:"protein_g"`
	CarbsG    float64 `json:"carbs_g"`
	FatG      float64 `json:"fat_g"`
}

// ---- Schema برنامه تمرین ----
type WorkoutPlanSchema struct {
	GoalType string            `json:"goal_type"` // "strength" | "hypertrophy" | "fat_loss"
	Days     []WorkoutDaySchema `json:"days"`
}

type WorkoutDaySchema struct {
	DayName   string             `json:"day_name"` // "روز ۱ - سینه و سه‌سر"
	Exercises []ExerciseSchema   `json:"exercises"`
}

type ExerciseSchema struct {
	ExerciseName string `json:"exercise_name"`
	Sets         int    `json:"sets"`
	Reps         string `json:"reps"` // "8-12" چون گاهی رنج تکرار میدن
	RestSeconds  int    `json:"rest_seconds"`
}

// ---- Schema ثبت غذا با صدا (فاز ۲) ----
type FoodLogSchema struct {
	Items []FoodItem `json:"items"`
	Notes string     `json:"notes"`
}

// ---- Schema ثبت ست تمرین با صدا (فاز ۳) ----
type SetLogSchema struct {
	ExerciseName string  `json:"exercise_name"`
	WeightKg     float64 `json:"weight_kg"`
	Reps         int     `json:"reps"`
	IsPR         bool    `json:"is_pr"`
}
```

> 💡 **نکته مهم برای مبتدی:** این structها دو کار می‌کنن — هم به Go می‌گن جواب AI قراره چه شکلی باشه (برای `json.Unmarshal`)، هم از روی همین‌ها یک JSON Schema برای OpenAI می‌سازیم (قدم بعد).

---

## ۴) BE-0.2 — سرویس `GenerateStructured` برای صدا زدن AI

حالا باید تابعی بنویسیم که:
1. یک schema (مثل `NutritionPlanSchema`) و یک context (اطلاعات کاربر) بگیره
2. به OpenAI درخواست بزنه و بگه «فقط طبق این فرمت جواب بده»
3. جواب رو تبدیل به struct Go کنه و برگردونه

### فایل جدید:
```
backend/internal/service/ai/generator.go
```

```go
package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type OpenAIRequest struct {
	Model       string          `json:"model"`
	Messages    []Message       `json:"messages"`
	ResponseFormat ResponseFormat `json:"response_format"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ResponseFormat struct {
	Type       string     `json:"type"` // "json_schema"
	JSONSchema JSONSchema `json:"json_schema"`
}

type JSONSchema struct {
	Name   string      `json:"name"`
	Strict bool        `json:"strict"`
	Schema interface{} `json:"schema"` // خود ساختار JSON Schema
}

// GenerateNutritionPlan یک نمونه مشخص برای تغذیه است.
// همین الگو را برای WorkoutPlan و بقیه هم تکرار می‌کنی.
func GenerateNutritionPlan(userContext string) (*NutritionPlanSchema, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")

	// این بخش، توصیف "فرم" برای AI است — دقیقاً منطبق با struct بالا
	jsonSchema := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"goal_type":      map[string]string{"type": "string"},
			"total_calories": map[string]string{"type": "integer"},
			"protein_g":      map[string]string{"type": "integer"},
			"carbs_g":        map[string]string{"type": "integer"},
			"fat_g":          map[string]string{"type": "integer"},
			"meals": map[string]interface{}{
				"type": "array",
				"items": map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"name": map[string]string{"type": "string"},
						"items": map[string]interface{}{
							"type": "array",
							"items": map[string]interface{}{
								"type": "object",
								"properties": map[string]interface{}{
									"food_name": map[string]string{"type": "string"},
									"amount_g":  map[string]string{"type": "number"},
									"calories":  map[string]string{"type": "integer"},
									"protein_g": map[string]string{"type": "number"},
									"carbs_g":   map[string]string{"type": "number"},
									"fat_g":     map[string]string{"type": "number"},
								},
								"required": []string{"food_name", "amount_g", "calories", "protein_g", "carbs_g", "fat_g"},
							},
						},
					},
					"required": []string{"name", "items"},
				},
			},
		},
		"required": []string{"goal_type", "total_calories", "protein_g", "carbs_g", "fat_g", "meals"},
	}

	reqBody := OpenAIRequest{
		Model: "gpt-4o", // یا هر مدلی که در تنظیمات پروژه استفاده می‌کنید
		Messages: []Message{
			{Role: "system", Content: "تو یک متخصص تغذیه ورزشی فارسی‌زبان هستی. طبق اطلاعات کاربر یک برنامه غذایی دقیق و واقع‌بینانه بساز."},
			{Role: "user", Content: userContext},
		},
		ResponseFormat: ResponseFormat{
			Type: "json_schema",
			JSONSchema: JSONSchema{
				Name:   "nutrition_plan",
				Strict: true,
				Schema: jsonSchema,
			},
		},
	}

	bodyBytes, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var apiResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, err
	}
	if len(apiResp.Choices) == 0 {
		return nil, fmt.Errorf("پاسخی از AI دریافت نشد")
	}

	var plan NutritionPlanSchema
	if err := json.Unmarshal([]byte(apiResp.Choices[0].Message.Content), &plan); err != nil {
		return nil, fmt.Errorf("خطا در تبدیل جواب AI: %w", err)
	}

	return &plan, nil
}
```

### حالا در کنترلر صداش بزن:

```go
// در ai_chat_controller.go یا یک کنترلر جدید nutrition_ai_controller.go
func (c *NutritionAIController) GeneratePlan(ctx *gin.Context) {
	userID := middleware.GetUserID(ctx)
	user := c.userRepo.FindByID(userID)

	// یک متن خلاصه از وضعیت کاربر بساز که به AI بدی
	userContext := fmt.Sprintf(
		"سن: %d, قد: %.0f سانتی‌متر, وزن: %.1f کیلوگرم, جنسیت: %s, هدف: %s, سطح تمرینی: %s",
		user.Age(), user.HeightCm, user.WeightKg, user.Gender, user.PrimaryGoal, user.BodyCondition,
	)

	plan, err := ai.GenerateNutritionPlan(userContext)
	if err != nil {
		ctx.JSON(500, gin.H{"error": "خطا در تولید برنامه غذایی"})
		return
	}

	// اینجا BE-0.3 (اعتبارسنجی) قبل از ذخیره اجرا میشه — بخش بعدی
	ctx.JSON(200, plan)
}
```

**نکته یادگیری:** فرق اصلی این با چت معمولی فقط همون بخش `ResponseFormat` با `"type": "json_schema"` و `"strict": true` است. این دقیقاً همون چیزیه که OpenAI رو مجبور می‌کنه هیچ‌وقت متن آزاد برنگردونه.

---

## ۵) BE-0.3 — اعتبارسنجی خروجی قبل از ذخیره

حتی با schema هم AI می‌تونه اشتباه کنه (مثلاً کالری منفی بده یا وعده خالی برگردونه). این لایه یه چک‌ساده‌ست، **جدا از AI**، که با کد معمولی Go می‌نویسی:

```go
// backend/internal/service/ai/validate.go
package ai

import "errors"

func ValidateNutritionPlan(plan *NutritionPlanSchema) error {
	if plan.TotalCalories < 800 || plan.TotalCalories > 6000 {
		return errors.New("کالری کل خارج از محدوده منطقی است")
	}
	if len(plan.Meals) == 0 {
		return errors.New("هیچ وعده‌ای در برنامه وجود ندارد")
	}
	for _, meal := range plan.Meals {
		if len(meal.Items) == 0 {
			return errors.New("وعده " + meal.Name + " آیتم غذایی ندارد")
		}
	}
	return nil
}
```

و در کنترلر:
```go
if err := ai.ValidateNutritionPlan(plan); err != nil {
    ctx.JSON(422, gin.H{"error": "برنامه تولیدشده معتبر نیست: " + err.Error()})
    return
}
// حالا امن است که در nutrition_program ذخیره شود
```

> چرا این قدم مهمه؟ چون هیچ‌وقت نباید کورکورانه به خروجی AI اعتماد کنی — این لایه جلوی داده خراب رفتن به دیتابیس رو می‌گیره.

---

## ۶) BE-0.4 — جدول لاگ درخواست‌های AI

برای اینکه بدونی چقدر هزینه/توکن مصرف شده و بتونی باگ‌ها رو دیباگ کنی، هر تماس با AI رو لاگ کن.

### مدل GORM جدید:
```go
// backend/internal/models/ai_request_log.go
package models

import "time"

type AIRequestLog struct {
	ID          uint   `gorm:"primaryKey"`
	UserID      uint
	RequestType string // "nutrition_plan", "workout_plan", "food_log_voice", ...
	InputText   string `gorm:"type:text"`
	OutputJSON  string `gorm:"type:text"`
	Success     bool
	ErrorMsg    string
	CreatedAt   time.Time
}
```

بعد از هر فراخوانی موفق/ناموفق، یک رکورد ذخیره کن. این کار بعداً برای فاز ۴ (Deep Dive) و محاسبه هزینه AI هم به‌درد می‌خوره.

---

## ۷) BE-0.5 — چند «شخصیت» (Persona) برای AI

طبق یادداشت‌های خودت، دو مربی داری: **مربی هوش مصنوعی تغذیه** و **مربی هوش مصنوعی تمرین** (و شاید یک مربی عمومی). این یعنی همون `ai_chat_controller` فعلی باید بدونه الان داره با کدوم «شخصیت» صحبت می‌کنه.

ساده‌ترین راه: یک enum/ثابت اضافه کن:

```go
// backend/internal/models/ai_persona.go
package models

type AIPersona string

const (
	PersonaGeneral   AIPersona = "general"
	PersonaNutrition AIPersona = "nutrition"
	PersonaWorkout   AIPersona = "workout"
)

func (p AIPersona) SystemPrompt() string {
	switch p {
	case PersonaNutrition:
		return "تو یک مربی تغذیه ورزشی متخصص هستی. فقط درباره تغذیه، کالری و رژیم صحبت کن."
	case PersonaWorkout:
		return "تو یک مربی بدنسازی متخصص هستی. فقط درباره تمرین، حرکات و برنامه ورزشی صحبت کن."
	default:
		return "تو دستیار هوشمند ورزشی فیتینو هستی."
	}
}
```

و در endpoint چت، یک پارامتر `persona` از فرانت/موبایل بگیر و همین `SystemPrompt()` رو به‌عنوان پیام سیستم به AI بفرست.

---

## ۸) ترتیب دقیق اجرا (چک‌لیست روزانه برای یک نفر مبتدی)

| روز | کار |
|-----|-----|
| ۱ | فایل `schemas.go` رو بساز، فقط `NutritionPlanSchema` رو کامل کن (بقیه بعداً) |
| ۲ | فایل `generator.go` رو بساز، تابع `GenerateNutritionPlan` رو با یک تست دستی (مثلاً از یک فایل `main_test.go` یا Postman روی endpoint موقت) امتحان کن |
| ۳ | مطمئن شو جواب AI واقعاً JSON معتبر برمی‌گرده — با `fmt.Println` خروجی خام رو چاپ کن و ببین |
| ۴ | `validate.go` رو بنویس و به کنترلر وصل کن |
| ۵ | مدل `AIRequestLog` رو بساز، migration بزن (`AutoMigrate`)، و لاگ‌گیری رو اضافه کن |
| ۶ | `AIPersona` رو اضافه کن و در `ai_chat_controller` موجود تست کن که تغییر persona واقعاً رفتار AI رو عوض می‌کنه |
| ۷ | همه‌چیز رو با Postman یا curl تست کن، بعد بری سراغ فاز ۱ (endpoint واقعی `POST /me/nutrition/generate`) |

### نمونه تست با curl (برای مرحله ۳):
```bash
curl -X POST http://localhost:8088/me/nutrition/generate \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json"
```
اگه جواب یک JSON منظم با `meals` و `total_calories` گرفتی، یعنی فاز ۰ کار می‌کنه. ✅

---

## ۹) اشتباهات رایجی که مبتدی‌ها می‌کنن (حتماً بخون)

1. **فراموش کردن `strict: true`** → بدون این، AI ممکنه فیلد کم بذاره یا فرمت رو کمی عوض کنه و کدت کرش کنه.
2. **مستقیم ذخیره در دیتابیس بدون validate** → همیشه قدم ۵ (اعتبارسنجی) رو رد نکن.
3. **API Key رو هاردکد کردن توی کد** → همیشه از `os.Getenv("OPENAI_API_KEY")` بخون، نه رشته مستقیم.
4. **یک تابع غول‌پیکر برای همه schemaها** → همون‌طور که بالا نشون دادم، برای هر schema (تغذیه، تمرین، ...) یک تابع جدا بساز؛ کد تمیزتر و دیباگش راحت‌تره.
5. **تست نکردن با داده‌های واقعی کاربر** → قبل از رفتن به فاز ۱، حتماً با چند تا کاربر واقعی/تستی با سن و هدف متفاوت امتحان کن ببین AI منطقی جواب می‌ده.

---

## ۱۰) خروجی نهایی فاز ۰ چیه؟

وقتی این فاز تموم شد، باید بتونی:
- ✅ یک endpoint داشته باشی که با اطلاعات کاربر تماس بگیره و AI یک JSON منظم برگردونه (نه متن آزاد)
- ✅ اون JSON رو validate کنی
- ✅ لاگ کامل هر تماس AI رو داشته باشی
- ✅ بتونی چت رو بین چند persona (تغذیه/تمرین/عمومی) عوض کنی

بعد از این، فاز ۱ (تغذیه هوشمند واقعی) فقط یعنی: همین `GenerateNutritionPlan` رو به `nutrition_program` واقعی وصل کنی و توی فرانت/موبایل نمایش بدی — که چون زیرساختش الان آماده‌ست، خیلی سریع‌تر پیش می‌ره.
