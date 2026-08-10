# فازبندی اجرایی فاز ۰ — ۱۰ فاز قابل‌اجرا

> مبنا: `Fitino_Feature_Roadmap.md` (BE-0.1 … BE-0.5) + `Fitino_Phase0_Guide.md`  
> تست‌ها: همگام با `Fitino_Phase0_Testing_Guide.md`  
> استک واقعی: Go/Gin/GORM + `ai_chat_service.go`  
> تاریخ: ۱۰ اوت ۲۰۲۶

---

## قانون اجرا

1. فازها را **به ترتیب** انجام بده.
2. در **شروع هر فاز (۲ تا ۱۰)** اول بلوک «پرامپت تست فاز قبلی» را اجرا کن.
3. فقط اگر نتیجه ✅ بود، کارهای همان فاز را شروع کن. اگر ❌ بود، برگرد فاز قبل را درست کن.
4. جزئیات بیشتر هر تست در `Fitino_Phase0_Testing_Guide.md` است — پرامپت‌های این فایل خلاصهٔ عملی همان راهنما هستند.
5. هرجا `<TOKEN>` دیدی، JWT لاگین تستی را بگذار.

### گرفتن JWT (یک‌بار، قبل از فاز ۲ به بعد)

```bash
curl -X POST http://localhost:8088/auth/login/password \
  -H "Content-Type: application/json" \
  -d '{"phone": "09150000000", "password": "12345678"}'
```

`access_token` را کپی کن.

### Endpoint مرجع فاز ۰ (همگام با راهنمای تست)

```text
POST /me/nutrition/generate   ← تولید JSON تغذیه (مسیر تست فاز ۰)
POST /me/ai/chat              ← چت موجود (persona در فاز ۸)
```

در فاز ۰ هنوز در `nutrition_program` ذخیره نکن — فقط JSON برگردان.

### معماری دو مسیر (ثابت تا آخر)

```
مسیر A — چت راهنما: POST /me/ai/chat  (برنامه نساز)
مسیر B — تولید ساختاریافته: /me/nutrition/generate (+ workout در فاز ۴)
```

---

## نقشه ۱۰ فاز

```
فاز ۱  پیش‌نیاز و اسکلت
  │  [تست ۱ راهنما: سرور]
فاز ۲  Schemaها (BE-0.1)
  │  [تست compile/schema]
فاز ۳  Generator تغذیه + endpoint (BE-0.2)
  │  [تست ۳ راهنما: JSON تغذیه]
فاز ۴  Generator تمرین + هسته مشترک (BE-0.2)
  │  [تست workout JSON]
فاز ۵  Validation (BE-0.3)
  │  [تست ۴ راهنما: go test]
فاز ۶  مدل AIRequestLog + Migrate (BE-0.4)
  │  [تست ۲ راهنما: جدول]
فاز ۷  اتصال لاگ به generator (BE-0.4)
  │  [تست ۵ راهنما: ردیف لاگ]
فاز ۸  Persona (BE-0.5)
  │  [تست ۶ راهنما: persona]
فاز ۹  یکپارچه‌سازی نهایی routes/wiring
  │  [چک یکپارچگی]
فاز ۱۰ تست سرتاسری E2E + آماده‌باش فاز ۱ رودمپ
       [تست ۷ راهنما]
```

---

## فاز ۱ — پیش‌نیاز و اسکلت پوشه

**هدف:** محیط و اسکلت فایل‌ها آماده شود؛ هنوز منطق business کامل نیست.  
**تسک رودمپ:** زیرساخت شروع

### کارها

- [ ] بک‌اند را طوری راه بینداز که روی `:8088` بالا بماند
- [ ] `OPENAI_API_KEY` در `.env` ست باشد
- [ ] `OPENAI_MODEL` / `OPENAI_BASE_URL` از `config` خوانده شود (هاردکد نکن)
- [ ] پوشه و فایل‌های خالی بساز:

```
fitness_app/backend/internal/service/ai/
  ├── schemas.go
  ├── generator.go
  ├── validate.go
  └── persona.go

fitness_app/backend/internal/models/
  └── ai_request_log.go
```

- [ ] پکیج `service/ai` جدا بماند تا `ai_chat_service.go` شلوغ نشود
- [ ] `go build ./...` از پوشه `backend` پاس شود

### Definition of Done

- [ ] سرور اجرا می‌شود
- [ ] پکیج جدید بدون منطق سنگین، compile می‌شود
- [ ] JWT تستی قابل گرفتن است

---

## فاز ۲ — طراحی JSON Schemaها (BE-0.1)

### 🧪 پرامپت تست فاز قبلی (قبل از شروع فاز ۲)

> معادل **تست ۱** در `Fitino_Phase0_Testing_Guide.md`

```bash
# ۱) سرور بالاست؟
curl http://localhost:8088/swagger/index.html

# ۲) بیلد سالم است؟
cd fitness_app/backend
go build ./...
```

| نتیجه | معنی |
|--------|------|
| ✅ صفحه swagger / کد ۲۰۰ + build بدون خطا | برو سراغ کارهای فاز ۲ |
| ❌ `connection refused` | اول بک‌اند را اجرا کن (فاز ۱) |
| ❌ خطای compile | اسکلت/import فاز ۱ را درست کن |

---

**هدف:** قرارداد خروجی AI قبل از هر HTTP call مشخص باشد.  
**فایل:** `internal/service/ai/schemas.go`

### کارها

- [ ] `NutritionPlanSchema` + `MealSchema` + `FoodItem`
- [ ] `WorkoutPlanSchema` + `WorkoutDaySchema` + `ExerciseSchema`
- [ ] `FoodLogSchema` و `SetLogSchema` (فعلاً فقط تعریف/stub)
- [ ] هم‌ترازی ذهنی با مدل‌های موجود (`NutritionProgram`, `NutritionItem`, `WorkoutProgram`, `DailyFoodLog`, `WorkoutSetLog`)
- [ ] enumهای پیشنهادی: `cut|bulk|maintain` و `strength|hypertrophy|fat_loss`

### Definition of Done

- [ ] structها compile می‌شوند
- [ ] یک fixture JSON نمونه با struct تغذیه match است

---

## فاز ۳ — Generator تغذیه + endpoint تست (BE-0.2)

### 🧪 پرامپت تست فاز قبلی (قبل از شروع فاز ۳)

> چک فاز ۲ — schemaها آماده و قابل unmarshal هستند

```bash
cd fitness_app/backend

# اگر fixture تستی ساختی (پیشنهادی):
go test ./internal/service/ai/ -run Schema -v

# حداقل: بیلد پکیج ai
go build ./internal/service/ai/
```

دستی: یک JSON نمونه تغذیه را با چشم با فیلدهای `NutritionPlanSchema` مقایسه کن  
(`goal_type`, `total_calories`, `protein_g`, `carbs_g`, `fat_g`, `meals[].items[]`).

| نتیجه | معنی |
|--------|------|
| ✅ build/test پاس + فیلدها کامل | شروع فاز ۳ |
| ❌ فیلد کم / compile error | برگرد فاز ۲ |

---

**هدف:** AI برای تغذیه JSON معتبر برگرداند (هنوز بدون validate اجباری سخت و بدون لاگ DB).  
**فایل:** `internal/service/ai/generator.go` + کنترلر/route

### کارها

- [ ] کلاینت HTTP با `config.Get().OpenAI` (BaseURL + Model + APIKey)
- [ ] `GenerateNutritionPlan(ctx, userContext) (*NutritionPlanSchema, error)`
- [ ] `response_format` با `json_schema` + `strict: true`؛ اگر GapGPT پشتیبانی نکرد → fallback `json_object`
- [ ] route: `POST /me/nutrition/generate` زیر `studentGroup` (همگام با راهنمای تست)
- [ ] از `MeService.GetProfile` برای `userContext` استفاده کن
- [ ] در dev بدون کلید: mock JSON معتبر برگردان
- [ ] **ذخیره در DB نکن**

### Definition of Done

- [ ] پاسخ endpoint فقط JSON خام است (نه متن فارسی دور JSON)
- [ ] فیلدهای `meals` و `total_calories` حاضرند
- [ ] `/me/ai/chat` خراب نشده

---

## فاز ۴ — Generator تمرین + هسته مشترک (BE-0.2 ادامه)

### 🧪 پرامپت تست فاز قبلی (قبل از شروع فاز ۴)

> معادل **تست ۳** در `Fitino_Phase0_Testing_Guide.md`

```bash
curl -X POST http://localhost:8088/me/nutrition/generate \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -v
```

چک‌لیست روی جواب (طبق راهنما):

- [ ] `meals` خالی نباشد
- [ ] `total_calories` بین ۸۰۰ تا ۶۰۰۰
- [ ] هر آیتم فیلدهایش پر باشد (نه null/خالی)
- [ ] خروجی **فقط** JSON باشد، نه `"اینم برنامه: {…}"`

| نتیجه | معنی |
|--------|------|
| ✅ JSON کامل | شروع فاز ۴ |
| ❌ متن آزاد | `ResponseFormat` در `generator.go` را درست کن |
| ❌ ۵۰۰ «خطا در تبدیل جواب AI» | خروجی خام را لاگ کن و schema/prompt را اصلاح کن |
| ❌ ۴۲۲ | اگر validate را زود وصل کرده‌ای، فعلاً OK است؛ وگرنه بعداً در فاز ۵ |

---

**هدف:** همان الگو برای تمرین + هسته مشترک `GenerateStructured`.

### کارها

- [ ] هسته عمومی: `GenerateStructured(ctx, schemaName, jsonSchema, systemPrompt, userContext)`
- [ ] `GenerateWorkoutPlan(...)`
- [ ] endpoint تست تمرین (مثلاً `POST /me/workout/generate`) — فقط JSON، بدون ذخیره
- [ ] rate-limit سبک مثل الگوی `AIChatService.allow`

### Definition of Done

- [ ] workout JSON با حداقل یک روز و یک حرکت برمی‌گردد
- [ ] تغذیه همچنان طبق تست ۳ پاس است

---

## فاز ۵ — اعتبارسنجی خروجی (BE-0.3)

### 🧪 پرامپت تست فاز قبلی (قبل از شروع فاز ۵)

```bash
curl -X POST http://localhost:8088/me/workout/generate \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -v
```

چک:

- [ ] پاسخ JSON است
- [ ] حداقل یک `days[]` با `exercises[]`
- [ ] `sets` > 0

| نتیجه | معنی |
|--------|------|
| ✅ | شروع فاز ۵ |
| ❌ | برگرد فاز ۴ |

---

**هدف:** داده مخرب/نامعقول به کلاینت (و بعداً DB) نرسد.  
**فایل:** `internal/service/ai/validate.go`

### کارها

- [ ] `ValidateNutritionPlan` (کالری ۸۰۰–۶۰۰۰، وعده خالی ممنوع، ماکرو منفی ممنوع)
- [ ] `ValidateWorkoutPlan` (روز/حرکت خالی ممنوع، sets منطقی)
- [ ] stubهای `ValidateFoodLog` / `ValidateSetLog`
- [ ] قبل از return موفق در کنترلر: validate اجباری → شکست = `422` با پیام فارسی
- [ ] فایل تست: `internal/service/ai/validate_test.go` طبق راهنمای تست

### Definition of Done

- [ ] داده بد رد می‌شود
- [ ] داده خوب پاس می‌شود
- [ ] `go test ./internal/service/ai/... -v` برای validate سبز است

---

## فاز ۶ — مدل `AIRequestLog` + AutoMigrate (BE-0.4 مدل)

### 🧪 پرامپت تست فاز قبلی (قبل از شروع فاز ۶)

> معادل **تست ۴** در `Fitino_Phase0_Testing_Guide.md`

```bash
cd fitness_app/backend
go test ./internal/service/ai/... -v
```

باید تست‌هایی مثل این پاس شوند:

- `TestValidateNutritionPlan_RejectsBadCalories`
- `TestValidateNutritionPlan_RejectsEmptyMeals`

| نتیجه | معنی |
|--------|------|
| ✅ PASS | شروع فاز ۶ |
| ❌ FAIL | شرط‌های `ValidateNutritionPlan` را کامل کن (فاز ۵) |

---

**هدف:** جدول لاگ در DB ساخته شود (هنوز الزامی نیست همه callها لاگ شوند — آن کار فاز ۷ است).  
**فایل:** `internal/models/ai_request_log.go`

### فیلدهای مدل

| فیلد | توضیح |
|------|--------|
| `UserID` | کاربر |
| `RequestType` | `nutrition_plan` / `workout_plan` / … |
| `Persona` | اختیاری |
| `InputText` | context |
| `OutputJSON` | پاسخ خام |
| `Model` | مدل |
| `Success` | موفق/ناموفق |
| `ErrorMsg` | خطا |
| `LatencyMs` | اختیاری |
| توکن‌ها | اختیاری اگر API بدهد |

### کارها

- [ ] مدل GORM بساز
- [ ] به `models.AllModels()` اضافه کن
- [ ] سرور را یک‌بار ری‌استارت کن تا `AutoMigrate` جدول را بسازد
- [ ] truncate برای متن‌های خیلی بزرگ را طراحی کن (پیاده‌سازی insert در فاز ۷)

### Definition of Done

- [ ] سرور بدون خطای migrate بالا می‌آید
- [ ] جدول `ai_request_logs` در DB وجود دارد

---

## فاز ۷ — اتصال لاگ به generator (BE-0.4 لاگ‌گیری)

### 🧪 پرامپت تست فاز قبلی (قبل از شروع فاز ۷)

> معادل **تست ۲** در `Fitino_Phase0_Testing_Guide.md`

```bash
mysql -u <DB_USER> -p<DB_PASSWORD> <DB_NAME> -e "SHOW TABLES LIKE 'ai_request_logs';"
mysql -u <DB_USER> -p<DB_PASSWORD> <DB_NAME> -e "DESCRIBE ai_request_logs;"
```

باید ستون‌هایی مثل `user_id`, `request_type`, `input_text`, `output_json`, `success`, `error_msg`, `created_at` را ببینی.

| نتیجه | معنی |
|--------|------|
| ✅ جدول و ستون‌ها هستند | شروع فاز ۷ |
| ❌ جدولی نیست | `AIRequestLog` را به `AllModels` اضافه کن و سرور را ری‌استارت کن (فاز ۶) |

---

**هدف:** هر تماس structured AI (موفق/ناموفق) یک ردیف لاگ بسازد.

### کارها

- [ ] بعد از هر generate موفق: `Success=true` + `OutputJSON`
- [ ] بعد از خطا: `Success=false` + `ErrorMsg`
- [ ] `RequestType` درست ست شود (`nutrition_plan` / `workout_plan`)
- [ ] truncate ورودی/خروجی خیلی بزرگ

### Definition of Done

- [ ] بعد از یک `POST /me/nutrition/generate` موفق، ردیف جدید با `success=1` دیده می‌شود
- [ ] با کلید خراب (تست تکمیلی راهنما) ردیف `success=0` ثبت می‌شود

---

## فاز ۸ — Persona مربی AI (BE-0.5)

### 🧪 پرامپت تست فاز قبلی (قبل از شروع فاز ۸)

> معادل **تست ۵** در `Fitino_Phase0_Testing_Guide.md`

```bash
# ۱) یک generate موفق
curl -X POST http://localhost:8088/me/nutrition/generate \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"

# ۲) آخرین لاگ
mysql -u <DB_USER> -p<DB_PASSWORD> <DB_NAME> -e \
  "SELECT id, user_id, request_type, success, created_at FROM ai_request_logs ORDER BY id DESC LIMIT 1;"
```

| نتیجه | معنی |
|--------|------|
| ✅ ردیف تازه با `success=1` | شروع فاز ۸ |
| ❌ ردیفی نیست | insert لاگ را در کنترلر/generator فاز ۷ اضافه کن |

**تست تکمیلی (اختیاری ولی توصیه‌شده):**  
`OPENAI_API_KEY` را عمداً خراب کن → ری‌استارت → دوباره generate → باید `success=0` و `error_msg` پر شود → بعد کلید را درست کن.

---

**هدف:** تفکیک `general | nutrition | workout` بدون شکستن guardrail چت.  
**فایل:** `internal/service/ai/persona.go` (+ تغییر `AIChatRequest`)

### کارها

- [ ] `SystemPrompt()` برای هر persona
- [ ] فیلد اختیاری `persona` روی `AIChatRequest` (پیش‌فرض `general`)
- [ ] اتصال به prompt چت + system prompt مسیر generate
- [ ] حتی با `persona=nutrition` از `/me/ai/chat` برنامه غذایی تجویز نشود
- [ ] persona نامعتبر → `400` یا fallback به `general`

### Definition of Done

- [ ] personaهای مختلف لحن/حوزه متفاوت می‌دهند
- [ ] چت همچنان برنامه کامل تجویز نمی‌کند

---

## فاز ۹ — یکپارچه‌سازی نهایی (wiring / routes / تثبیت)

### 🧪 پرامپت تست فاز قبلی (قبل از شروع فاز ۹)

> معادل **تست ۶** در `Fitino_Phase0_Testing_Guide.md`

```bash
# persona تغذیه + سوال تمرینی
curl -X POST http://localhost:8088/me/ai/chat \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"persona": "nutrition", "message": "بهترین حرکت برای سینه چیه؟"}'

# همان سوال با persona تمرین
curl -X POST http://localhost:8088/me/ai/chat \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"persona": "workout", "message": "بهترین حرکت برای سینه چیه؟"}'
```

| نتیجه | معنی |
|--------|------|
| ✅ جواب‌ها متفاوت (تغذیه منحرف/محدود، تمرین پاسخ حوزه‌ای) | شروع فاز ۹ |
| ❌ دو جواب کاملاً یکسان | `persona` به `SystemPrompt()` وصل نشده — فاز ۸ |

> نکته محصولی: چت فعلی ممکن است هنوز برای تجویز برنامه/حرکت guardrail داشته باشد. مهم این است که **تفاوت persona** دیده شود و پارامتر نادیده گرفته نشود.

---

**هدف:** همه تکه‌ها در `main.go` تمیز wire شده باشند و مسیرها پایدار بمانند.

### کارها

- [ ] ساخت سرویس/کنترلر structured AI در `cmd/app/main.go`
- [ ] routeهای نهایی تثبیت‌شده:
  - `POST /me/nutrition/generate`
  - `POST /me/workout/generate` (اگر در فاز ۴ اضافه شد)
  - `POST /me/ai/chat` با `persona`
- [ ] godoc/swagger برای endpointهای جدید
- [ ] اطمینان: چت راهنما و generate از هم جدا هستند
- [ ] پاکسازی endpoint/کد موقت اضافی

### Definition of Done

- [ ] یک ری‌استارت تمیز سرور، همه routeها پاسخ می‌دهند
- [ ] تست‌های ۱ تا ۶ راهنما در صورت تکرار، همچنان سبزند

---

## فاز ۱۰ — تست سرتاسری E2E + آماده‌باش فاز ۱ رودمپ

### 🧪 پرامپت تست فاز قبلی (قبل از شروع فاز ۱۰)

چک یکپارچگی سریع بعد از فاز ۹:

```bash
# سرور
curl http://localhost:8088/swagger/index.html

# تغذیه
curl -X POST http://localhost:8088/me/nutrition/generate \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"

# چت با persona
curl -X POST http://localhost:8088/me/ai/chat \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"persona": "general", "message": "چطور وارد پنل شاگرد بشم؟"}'

# لاگ
mysql -u <DB_USER> -p<DB_PASSWORD> <DB_NAME> -e \
  "SELECT id, request_type, success FROM ai_request_logs ORDER BY id DESC LIMIT 3;"
```

| نتیجه | معنی |
|--------|------|
| ✅ همه پاسخ منطقی + لاگ تازه | شروع کارهای فاز ۱۰ (E2E کامل) |
| ❌ هر کدام شکست | برگرد فاز ۹ / فاز مربوطه |

---

**هدف:** فاز ۰ را طبق **تست ۷** راهنما ببند و نقطه اتصال فاز ۱ رودمپ را مشخص کن.

### کار فاز ۱۰ — تست ۷ (End-to-End) از راهنما

با کاربر واقعی که پروفایلش کامل است (قد/وزن/هدف):

1. لاگین کن
2. `POST /me/nutrition/generate` را بزن
3. چک کن:
   - [ ] کالری با پروفایل منطقی است
   - [ ] تعداد وعده‌ها ۳ تا ۶ است
   - [ ] جمع تقریبی آیتم‌ها با `total_calories` جور است
   - [ ] ردیف جدید در `ai_request_logs` هست
4. هدف پروفایل را عوض کن (مثلاً کات → بالک) و ببین خروجی واقعاً تغییر می‌کند

### کارهای آماده‌باش فاز ۱ (فقط یادداشت/تصمیم — کد ذخیره برنامه اینجا نیست)

- [ ] تصمیم برای `CoachID` / `SubscriptionID` اجباری روی `NutritionProgram` وقتی منبع AI است
- [ ] تأیید خارج از محدوده: UI ساخت برنامه، STT، Cron، ذخیره DB → فازهای بعدی رودمپ
- [ ] تیک زدن DoD کلی پایین

### Definition of Done نهایی فاز ۰

- [ ] پکیج `internal/service/ai/` کامل است (schema + generator + validate + persona)
- [ ] `POST /me/nutrition/generate` JSON معتبر می‌دهد
- [ ] validate جلوی داده بد را می‌گیرد (`go test` سبز)
- [ ] `ai_request_logs` پر می‌شود
- [ ] persona روی چت اثر دارد
- [ ] تست‌های ۱→۷ راهنمای تست پاس شده‌اند

**بعد از این → شروع فاز ۱ رودمپ:** ذخیره واقعی در `nutrition_program` + UI.

---

## نگاشت سریع

| فاز این فایل | تسک رودمپ | تست دروازه شروع (از راهنما / معادل) |
|--------------|-----------|--------------------------------------|
| ۱ | اسکلت | — |
| ۲ | BE-0.1 | تست ۱ — سرور |
| ۳ | BE-0.2 تغذیه | تست schema/build |
| ۴ | BE-0.2 تمرین | تست ۳ — JSON تغذیه |
| ۵ | BE-0.3 | تست workout JSON |
| ۶ | BE-0.4 مدل | تست ۴ — `go test` validate |
| ۷ | BE-0.4 لاگ | تست ۲ — جدول `ai_request_logs` |
| ۸ | BE-0.5 | تست ۵ — ردیف لاگ |
| ۹ | یکپارچه‌سازی | تست ۶ — persona |
| ۱۰ | E2E / آماده‌باش | چک یکپارچگی + **تست ۷** |

---

## خارج از محدوده کل فاز ۰

- ذخیره در `nutrition_program` / `workout_program`
- UI «ساخت برنامه با AI»
- STT / ویس
- Cron گزارش هفتگی
- تضعیف کامل guardrail چت بدون مسیر محصولی جایگزین

---

## لینک‌ها

- تست عملی: `Fitino_Phase0_Testing_Guide.md`
- راهنمای آموزشی کد: `Fitino_Phase0_Guide.md`
- رودمپ کلی: `Fitino_Feature_Roadmap.md`
- کد چت فعلی: `backend/internal/service/ai_chat_service.go`

---

## چک‌لیست پیشرفت ۱۰ فاز

- [x] فاز ۱ — پیش‌نیاز و اسکلت
- [x] فاز ۲ — schemas *(بعد از ✅ تست ۱)*
- [x] فاز ۳ — generator تغذیه *(بعد از ✅ تست schema)*
- [x] فاز ۴ — generator تمرین *(بعد از ✅ تست ۳)*
- [x] فاز ۵ — validate *(بعد از ✅ تست workout)*
- [x] فاز ۶ — مدل لاگ + migrate *(بعد از ✅ تست ۴)*
- [x] فاز ۷ — insert لاگ *(بعد از ✅ تست ۲)*
- [x] فاز ۸ — persona *(بعد از ✅ تست ۵)*
- [x] فاز ۹ — wiring نهایی *(بعد از ✅ تست ۶)*
- [ ] فاز ۱۰ — E2E تست ۷ + آماده‌باش فاز ۱ رودمپ *(نیاز به سرور در حال اجرا + JWT + DB)*
