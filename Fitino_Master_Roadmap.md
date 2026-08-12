# فیتینو (Fitino) — نقشه راه یکپارچه و فازبندی دقیق پروژه

> **این فایل، ادغام و به‌روزرسانیِ ۵ فایل زیر است** (بعد از بررسی کد واقعی پروژه، نه فقط خواندن مستندات):
> `Fitino_Feature_Roadmap.md` + `Fitino_Phase0_Guide.md` + `Fitino_Phase0_Plan.md` + `Fitino_Phase0_Testing_Guide.md` + `PROJECT_INVENTORY.md`
>
> تاریخ ادغام: ۲۰ مرداد ۱۴۰۵ (۱۰ اوت ۲۰۲۶) — به‌روزرسانی: همان روز، بعد از پیاده‌سازی و تست زنده بک‌اند فازهای ۱ تا ۱۰
> فایل‌های اصلی حذف نشدند و به‌عنوان مرجع تفصیلی (آموزش کد + اسکریپت‌های کامل تست) در بخش ۵ لینک شده‌اند.

---

## ۰) خلاصه مدیریتی — الان کجا هستیم؟

بعد از بررسی مستقیم کد (`go build`, `go vet`, `go test`, grep روی route‌ها و مدل‌ها)، وضعیت واقعی:

| بخش | وضعیت | شواهد |
|---|---|---|
| **فاز ۰ — زیرساخت AI ساختاریافته** | ✅ **تکمیل و تأییدشده در کد** (به‌جز E2E دستی) | `internal/service/ai/*.go` کامل، `go build ./...` و `go test ./internal/service/ai/...` هر دو سبز، route‌ها در `cmd/app/main.go` وایر شده‌اند |
| **فاز ۱ تا ۱۰ — لایه Backend** | ✅ **پیاده‌سازی و تست زنده شد** | همه مدل/سرویس/کنترلر/route اضافه شدند؛ `go build`, `go vet`, `go test ./...` سبز؛ سرور واقعی بالا آمد، روی MySQL واقعی `AutoMigrate` همه جدول‌های جدید را بدون خطا ساخت، و مسیرهای کلیدی هر فاز با curl + کاربر/مربی دمو واقعی تست شدند (پایین را ببین) |
| **فاز ۱ تا ۱۰ — لایه Frontend (Next.js) و Mobile (Flutter)** | ⬜ **هنوز شروع نشده** | هیچ صفحه/ویجت جدیدی برای این فازها در `frontend/src/app` یا `mobile/lib/src/features` اضافه نشده — فقط API آماده‌ست، UI باقی مانده |

**نتیجه بازبینی و پیاده‌سازی:** فاز ۰ از قبل بدون باگ بود. در حین پیاده‌سازی فازهای ۱ تا ۱۰، تست زنده روی سرور واقعی **یک باگ واقعی** پیدا و همان‌جا رفع شد: `GuaranteeService` خطای «بدون اشتراک» (`gorm.ErrRecordNotFound`) را به‌جای پیام فارسی مناسب، به‌صورت خطای ۵۰۰ خام برمی‌گرداند — با نگاشت صریح خطا در `internal/service/guarantee_service.go` درست شد و با تست مجدد تأیید شد. جزئیات کامل تست‌های زنده در بخش ۳.۱ زیر.

---

## ۱) عکس فوری از معماری فعلی (خلاصه از PROJECT_INVENTORY)

**فیتینو** پلتفرم چندمربی مدیریت مربیگری ورزشی با ۳ نقش است: `admin` (سوپرادمین) / `coach` (مربی) / `student` (دانشجو). هر دانشجو حداکثر از یک مربی پلن می‌خرد.

| لایه | استک |
|---|---|
| Backend | Go 1.26 + Gin v1.11 + GORM v1.31 + MySQL، JWT auth، Swagger |
| Frontend (وب) | Next.js 16 App Router + React 19 + Tailwind 4 + shadcn/ui + Redux Toolkit، فارسی/RTL |
| Mobile | Flutter + Riverpod 3 + go_router + Dio، معماری `features/<name>/{data,application,presentation}` |
| سرویس‌های خارجی | OpenAI (`OPENAI_API_KEY`)، Zarinpal (پرداخت)، SMS، آپلود فایل محلی (`uploads/`) |

مسیرهای کلیدی UI: `/user/*` (۵ تب: خانه، تمرین، تغذیه، پایش، حساب من)، `/coach/*`، `/admin/*` (فقط وب).
مدل‌های کلیدی موجود: `user`, `nutrition_program`+`nutrition_item`, `workout_program`+`program_item`, `daily_food_log`, `workout_session`+`workout_set_log`, `exercise`, `food`, `ticket`, `notification`, `coach_achievement`.

جزئیات کامل (endpoint map، env vars، جریان‌های خرید/auth): در `PROJECT_INVENTORY.md` دست‌نخورده باقی مانده — این فایل فقط چکیده‌اش را نگه داشته.

---

## ۲) فاز ۰ — زیرساخت AI ساختاریافته (تکمیل‌شده)

**هدف فاز:** تبدیل `ai_chat_controller` از «چت آزاد» به موتوری که خروجی JSON ساختاریافته و قابل‌اعتبارسنجی تولید می‌کند، بدون تغییر استک.

### ۲.۱ وضعیت ۵ تسک اصلی رودمپ (BE-0.1 تا BE-0.5)

| تسک | فایل واقعی در کد | وضعیت تأییدشده |
|---|---|---|
| BE-0.1 طراحی Schemaها | `internal/service/ai/schemas.go` + `schemas_test.go` | ✅ `NutritionPlanSchema`, `WorkoutPlanSchema` کامل با fixture test |
| BE-0.2 `GenerateStructured` + endpoint | `internal/service/ai/generator.go`, `internal/service/ai_generate_service.go`, `internal/controllers/ai_generate_controller.go` | ✅ هسته مشترک + fallback به `json_object` اگر مدل از `strict` پشتیبانی نکند + mock در dev |
| BE-0.3 اعتبارسنجی خروجی | `internal/service/ai/validate.go` + `validate_test.go` | ✅ رد کالری خارج از بازه ۸۰۰-۶۰۰۰، وعده خالی، روز/حرکت خالی — تست‌ها PASS |
| BE-0.4 لاگ درخواست AI | `internal/models/ai_request_log.go` + `internal/repository` (`AIRequestLogRepository`) | ✅ مدل در `registry.go` ثبت شده (AutoMigrate می‌گیرد)؛ هر تماس (موفق/ناموفق) با latency/token count لاگ می‌شود |
| BE-0.5 Persona | `internal/service/ai/persona.go` | ✅ `general \| nutrition \| workout` — هم روی `/me/ai/chat` (فیلد `persona` در `AIChatRequest`) هم در سیستم‌پرامپت تولید فعال است |

### ۲.۲ Endpointهای نهایی وایرشده (تأییدشده در `cmd/app/main.go`)

```
POST /me/ai/chat              → aiChatController.Chat            (چت راهنما، پارامتر persona)
POST /me/nutrition/generate   → aiGenerateController.GenerateNutrition   (فقط JSON، ذخیره در DB نمی‌شود)
POST /me/workout/generate     → aiGenerateController.GenerateWorkout     (فقط JSON، ذخیره در DB نمی‌شود)
```
هر سه زیر `studentGroup` یعنی پشت `JWTAuthMiddleware` قرار دارند.

### ۲.۳ آنچه هنوز باز است در فاز ۰

فقط **یک** مورد از ۱۰ زیرفاز `Fitino_Phase0_Plan.md` تیک نخورده و درست هم هست که نخورده — چون نیاز به سرور در حال اجرا + DB واقعی + کاربر تست دارد و از مسیر بررسی کد قابل تأیید نیست:

- [ ] **فاز ۱۰ (E2E دستی)** — با کاربر واقعی که پروفایلش کامل است، `/me/nutrition/generate` را بزن و چک کن:
  - کالری کل با پروفایل (قد/وزن/هدف) منطقی است
  - ۳ تا ۶ وعده برمی‌گردد و جمع آیتم‌ها با `total_calories` جور است
  - ردیف جدید در جدول `ai_request_logs` ثبت می‌شود
  - تغییر هدف کاربر (کات→بالک) خروجی را واقعاً عوض می‌کند

**راهنمای اجرای این تست:** بخش «تست ۷» در `Fitino_Phase0_Testing_Guide.md` (دست‌نخورده باقی مانده، مرجع کامل curl/mysql).

### ۲.۴ تصمیم معماری ثابت (تا آخر پروژه رعایت شود)

```
مسیر A — چت راهنما:        POST /me/ai/chat            (فقط گفتگو، برنامه تجویز نمی‌کند)
مسیر B — تولید ساختاریافته: POST /me/{nutrition,workout}/generate   (خروجی قابل ذخیره در DB)
```
این تفکیک باید در همهٔ فازهای بعدی (۱ تا ۱۰ رودمپ فیچر) هم حفظ شود.

---

## ۳) فازبندی اجرایی فیچرهای جدید — فاز ۱ تا ۱۰ (Backend تکمیل، UI باقی مانده)

> هر فاز مستقل قابل تحویل است؛ ترتیب طوری چیده شده که فازهای بعدی روی داده/زیرساخت فازهای قبلی سوار شوند. همهٔ این فازها **روی فاز ۰ که الان تکمیل است** سوار می‌شوند.
> علامت‌گذاری: `[x] BE-...` = بک‌اند پیاده و روی MySQL واقعی تست‌شده. `[ ] FE/Mobile-...` = هنوز کار نشده.

### ۳.۱ خلاصه تست زنده (بعد از پیاده‌سازی هر فاز، روی سرور واقعی با `go run ./cmd/app` روی MySQL محلی)

| فاز | چه چیزی با curl/دیتابیس واقعی تست شد | نتیجه |
|---|---|---|
| ۷ | ایجاد پست، فید، لایک/کامنت (متن فارسی UTF-8 round-trip)، لیست رویدادها | ✅ |
| ۸ | `GET /me/optimal/quote`، toggle کردن `notificationsEnabled` روی/خاموش | ✅ |
| ۹ | زمان‌بندی جلسه مربی↔شاگرد واقعی (کاربر دمو)، `review-status` قبل/بعد از فیدبک (overdue: true→false) | ✅ |
| ۱۰ | `compliance` روی اشتراک واقعی، ثبت درخواست تضمین، رد درخواست تکراری (۴۰۹)، تایید ادمین با resolution نامعتبر (۴۰۰) و معتبر (۲۰۰) | ✅ (بعد از رفع باگ nil-subscription) |

همه فازها روی `AutoMigrate` واقعی جدول ساختند بدون خطا (`ai_request_logs` تا `guarantee_cases`).

### دسته‌بندی منبع فیچرها (از یادداشت‌های محصولی)

| # | حوزه | نگاشت به پروژه |
|---|---|---|
| A | مربی AI (دو نوع) | گسترش `ai_chat_controller` / persona موجود در فاز ۰ |
| B | تغذیه هوشمند | گسترش `nutrition_program` + `food` + `daily_food_log` |
| C | تمرین هوشمند | گسترش `workout_program` + `workout_session` + `workout_set_log` |
| D | تشخیص پیشرفت فیزیکی (عکس) | مدل جدید `progress_photo` |
| E | انگیزه و استمرار | نوتیفیکیشن + `notification.go` موجود |
| F | Gamification | مدل جدید امتیاز/مدال |
| G | مربی انسانی | گسترش `ticket` + جلسات دوره‌ای |
| H | Deep Dive تحلیل AI | Cron روی داده تمرین/تغذیه + AI برای متن تحلیلی |
| I | تضمین‌ها | عمدتاً منطق کسب‌وکار/CRM |

### روش‌های پیاده‌سازی پیشنهادی (خلاصه فنی)

| فیچر | روش | نکته |
|---|---|---|
| BMR/TDEE و ماکرو | فرمول Mifflin-St Jeor روی سرور Go (بدون AI) | داده‌ها (`HeightCm/WeightKg/BirthDate/Gender/BodyFatPercent`) از قبل روی `User` هست |
| تولید متن برنامه | همان موتور فاز ۰ (`GenerateStructured`) | فقط باید به `nutrition_program`/`workout_program` واقعی وصل شود |
| ثبت با صدا | STT (Whisper) → متن → همان pipeline فاز ۰ | فایل صوتی مثل الگوی آپلود عکس فعلی در `uploads/` |
| بانک غذا/دستور پخت | مدل جدید `recipe.go` + endpoint فیلتر | کپی الگوی `food.go` / `admin_exercise` |
| تشخیص پیشرفت از عکس | OpenAI Vision با پرامپت مشاهده‌محور (نه تشخیصی) | disclaimer الزامی برای ریسک حقوقی |
| تصویر AI «بدن آینده» | ریسک بالا — فاز آخر، اختیاری | تداخل حقوقی با تضمین‌های بخش I |
| PR / گزارش هفتگی‌ماهانه | Cron (`robfig/cron`) برای محاسبه عددی + AI فقط برای متن | جدا کردن محاسبه قطعی از تولید متن، هزینه توکن را کم می‌کند |
| نوتیفیکیشن | FCM (موبایل) + `notification.go` + `sms_service.go` موجود | فقط باید FCM token روی `mobile_device.go` ذخیره شود |
| گیمیفیکیشن | `achievement_rule.go` + `user_achievement.go` (event-driven) | الگوی مشابه `coach_achievement.go` موجود برای مربی |
| پلتفرم اجتماعی | فاز اول: HTTP polling ساده (بدون real-time) | فاز بعد: WebSocket با `gorilla/websocket` (سازگار با Gin) |

---

### 🟩 فاز ۱ — تغذیه هوشمند (پایه)
- [x] **BE-1.1** `service/nutrition_calc.go` — محاسبه BMR/TDEE (Mifflin-St Jeor) از فیلدهای موجود `User`
- [x] **BE-1.2** `POST /me/nutrition/generate` حالا در `nutrition_program` واقعی ذخیره می‌کند (`ai_generate_service.go`)
- [x] **BE-1.3** فیلد `nutrition_goal` (کات/بالک/نگهداری) روی `nutrition_program`
- [ ] **FE-1.4** صفحه «ساخت برنامه تغذیه با AI» در `/user/nutrition/generate`
- [ ] **Mobile-1.5** پاریتی در `features/food_diary`
- [x] **BE-1.6** `internal/models/recipe.go` (بانک دستور پخت)
- [x] **BE-1.7** `GET /recipes` با فیلتر کالری/نوع/مواد (`recipe_controller.go`) + CRUD ادمین
- [ ] **FE/Mobile-1.8** صفحه «بانک غذا» با فیلتر
- [x] **BE-1.9** `POST /me/nutrition/suggest-from-ingredients` (`ai_generate_controller.go`)

### 🟩 فاز ۲ — ترک کالری/ماکرو کامل + ثبت با صدا
- [x] **BE-2.1** `daily_food_log` از قبل فیلدهای carbs/protein/fat کامل دارد
- [ ] **FE/Mobile-2.2** UI افزودن دستی آیتم با ماکروی کامل
- [x] **BE-2.3** `POST /me/food-logs/voice` (`ai_generate_controller.go` → `SuggestFoodLogFromVoice`)
- [x] **BE-2.4** pipeline کامل: صدا → متن → `FoodLogSchema` → پیش‌نمایش (کاربر باید جدا تایید/ذخیره کند، طبق طراحی امن اصلی)
- [ ] **FE/Mobile-2.5** دکمه میکروفون + پیش‌نمایش قبل از تایید نهایی کاربر

### 🟨 فاز ۳ — تمرین هوشمند (ثبت + PR + برنامه)
- [x] **BE-3.1** `EffortRPE` / `FeelingAfter` / `SatisfactionRating` روی `models.WorkoutSession`
- [x] **BE-3.2** تشخیص PR در `achievement_service.go` (`HandleNewPR`, هوک از ثبت ست)
- [x] **BE-3.3** `POST /me/workout/generate` در `workout_program` واقعی ذخیره می‌کند
- [ ] **FE-3.4** صفحه «ساخت برنامه تمرینی با AI»
- [x] **BE-3.5** `POST /me/workout/sessions/voice` (`SuggestSetLogFromVoice`)
- [ ] **FE/Mobile-3.6** UI ثبت جلسه: چک‌لیست ست + اسلایدر شدت فشار + ایموجی حس بعد تمرین
- [ ] **Mobile-3.7** پاریتی کامل

### 🟨 فاز ۴ — داشبورد دستاورد و تحلیل Deep Dive
- [x] **BE-4.1** `service.StartScheduler` — goroutine ساعتی، بدون کتابخانه cron خارجی (سبک‌تر از `robfig/cron`، همان دقت کافی)
- [x] **BE-4.2** `models.ProgressReport` (هفتگی/ماهانه، اعداد خام)
- [x] **BE-4.3** `progress_report_service.go` متن تحلیلی از اعداد خام می‌سازد
- [ ] **FE/Mobile-4.4** صفحه «داشبورد پیشرفت» (Recharts موجود در فرانت)
- [x] **BE-4.5** `GET /me/progress/reports` (`progress_report_controller.go`)

### 🟧 فاز ۵ — عکس پیشرفت و پوزینگ
- [x] **BE-5.1** به‌جای مدل جدا، قابلیت روی مدل موجود `UserPhoto`/tracking گسترش یافت (طراحی ساده‌تر، بدون دوباره‌کاری با tracking فعلی)
- [x] **BE-5.2** `POST /me/tracking/photos/:id/analyze` — Vision تحلیل مشاهده‌محور (`tracking_controller.go`)
- [x] **BE-5.3** `models.PoseBank` + `GET /poses` + CRUD ادمین
- [ ] **FE/Mobile-5.4** گالری قبل/بعد + بانک پوز
- [x] **Coach-5.5** `PATCH /coach/tracking/photos/:id/review` — تایید/رد تحلیل AI توسط مربی
- [ ] *(اختیاری/فاز جدا)* **BE-5.6** تصویر «بدن آینده» + disclaimer الزامی — عمداً پیاده نشد (ریسک حقوقی بالا طبق بخش ۶)

### 🟪 فاز ۶ — Gamification (امتیاز و مدال)
- [x] **BE-6.1** `models.AchievementRule`
- [x] **BE-6.2** `models.UserAchievement`
- [x] **BE-6.3** `achievement_service.go` — هوک روی `HandleFoodLogCreated` / `HandleWorkoutSessionCompleted` / `HandleNewPR`
- [x] **BE-6.4** `GET /me/achievements` (`achievement_controller.go`)
- [ ] **FE/Mobile-6.5** بخش مدال‌ها در `/user/profile`
- [x] **BE-6.6** `SeedDefaultRules` در startup — قوانین اولیه پایه‌ای فعال‌اند

### 🟪 فاز ۷ — پلتفرم اجتماعی و رویدادها
- [x] **BE-7.1** `models.CommunityPost` + `PostComment` + `PostLike` (`community_post_service.go`)
- [x] **BE-7.2** `GET/POST /me/community/posts` + لایک/کامنت — polling ساده، بدون real-time (طبق تصمیم فاز ۰)؛ تست زنده با متن فارسی UTF-8 ✅
- [x] **BE-7.3** `models.Event` + `EventParticipation` (`event_service.go`) — join/leave اختیاری
- [ ] **FE/Mobile-7.4** صفحه فید اجتماعی + رویدادها
- [x] **Admin-7.5** `PATCH /admin/community/posts/:id/hide` + CRUD کامل `/admin/events`
- [ ] *(اختیاری، فاز بعدی)* **BE-7.6** ارتقا به WebSocket برای چت زنده

### 🟥 فاز ۸ — انگیزه و استمرار (نوتیفیکیشن)
- [x] **BE-8.1** `push_notification_service.go` — FCM legacy HTTP API؛ بدون `FCM_SERVER_KEY` به‌صورت console-log no-op کار می‌کند (تست‌شده)
- [x] **BE-8.2** فیلد `PushToken`/`PushTokenUpdatedAt` روی `models.MobileDevice`، از طریق heartbeat موجود ست می‌شود
- [x] **BE-8.3** `reminder_service.go` — goroutine ساعتی، یادآوری بی‌فعالی ۲۴h (in-app+push) و ۷ روز (+SMS)، با dedup روزانه
- [x] **BE-8.4** `SendInactivityReminderSMS` در `sms_service.go` (همان الگوی Kavenegar lookup template فعلی)
- [x] **BE-8.5** `models.MotivationalQuote` + `GET /me/optimal/quote` (تست زنده ✅) + CRUD ادمین
- [x] **BE-8.6 (بک‌اند تنظیمات)** `GET/PATCH /me/notifications/settings` — تست زنده toggle روشن/خاموش ✅
- [ ] **FE/Mobile-8.6 (UI)** بخش «Optimal» در داشبورد + سوییچ تنظیمات نوتیف

### 🟥 فاز ۹ — گردش‌کار مربی انسانی
- [x] **BE-9.1** `models.CoachSession` (نوع حضوری/آنلاین، وضعیت، یادداشت)
- [x] **BE-9.2** `POST /coach/students/:id/sessions` + `PATCH`/`DELETE /coach/sessions/:sessionId` + `GET /me/sessions` برای شاگرد — تست زنده با مربی/شاگرد دمو واقعی ✅
- [x] **BE-9.3** `GET /coach/students/:id/review-status` — overdue بعد از ۳ روز بدون بازخورد؛ تست زنده نشان داد قبل از فیدبک `overdue:true`، بعدش `false` ✅
- [x] **BE-9.4** `POST /coach/students/:id/feedback` — `models.CoachReview` + `Notification` نوع `message_from_coach`
- [ ] **FE-9.5** تقویم جلسات (وب/موبایل)

### ⬛ فاز ۱۰ — تضمین‌ها (کسب‌وکاری)
- [x] **BE-10.1** `models.GuaranteeCase`
- [x] **BE-10.2** `ComputeCompliance` — درصد تغذیه/تمرین از لاگ واقعی + تعداد جلسات مربی، به‌صورت snapshot در لحظه ثبت درخواست؛ تست زنده روی اشتراک واقعی ✅
- [x] **Admin-10.3** `GET /admin/guarantee/requests` (فیلتر وضعیت) + `PATCH .../:id` (تایید با `free_extension`/`refund` یا رد) — تست زنده شامل رد ۴۰۰ برای resolution نامعتبر ✅
- [ ] **FE-10.4** صفحه «وضعیت تضمین من» در `/user`

> **باگ رفع‌شده حین تست:** `ComputeCompliance`/`Submit` وقتی کاربر اشتراک فعال نداشت، به‌جای پیام فارسی «اشتراک فعالی یافت نشد»، خطای خام `gorm.ErrRecordNotFound` را ۵۰۰ برمی‌گرداند. علتش این بود که `SubscriptionRepository.FindCurrentByUserID` در نبود ردیف، `(nil, ErrRecordNotFound)` برمی‌گرداند نه `(nil, nil)`؛ سرویس این حالت را چک نمی‌کرد. با تابع کمکی `findCurrentSubscription` که این خطا را صراحتاً به `ErrGuaranteeNoSubscription` نگاشت می‌کند رفع شد (`internal/service/guarantee_service.go`).

---

## ۴) ترتیب اجرا و وابستگی فازها

```
فاز ۰ (زیرساخت AI) ✅ تکمیل — فقط E2E دستی (۲.۳) باز است
   │
   ├─► فاز ۱ (تغذیه پایه) ✅BE ──► فاز ۲ (ماکرو + صدا) ✅BE
   │
   ├─► فاز ۳ (تمرین هوشمند) ✅BE ──► فاز ۴ (Deep Dive) ✅BE
   │
   ├─► فاز ۵ (عکس/پوزینگ) ✅BE
   │
   └─► فاز ۶ (Gamification) ✅BE
          │
          ├─► فاز ۷ (اجتماعی/رویداد) ✅BE
          └─► فاز ۸ (نوتیف/انگیزه) ✅BE

فاز ۹ (مربی انسانی) ✅BE
فاز ۱۰ (تضمین‌ها) ✅BE
```
✅BE = بک‌اند تکمیل و تست‌شده. هیچ‌کدام UI (وب/موبایل) ندارند.

**قدم بعدی واقعی:** لایه Backend هر ۱۰ فاز آماده و تست‌شده است. کار باقی‌مانده صرفاً **UI** است — به همان ترتیب بالا، شروع از **FE-1.4** (صفحه ساخت برنامه تغذیه با AI در Next.js) چون سریع‌ترین ارزش قابل‌لمس برای کاربر نهایی است؛ بعد پاریتی موبایل (`Mobile-*`). فهرست کامل تسک‌های UI باقی‌مانده در چک‌لیست هر فاز در بخش ۳ با `[ ]` مشخص شده‌اند.

---

## ۵) روش تست دروازه‌ای بین فازها (الگو برای فازهای ۱ تا ۱۰ هم تکرار شود)

الگویی که در فاز ۰ جواب داد و باید برای فازهای بعدی هم رعایت شود:

1. هر فاز به تسک‌های کوچک (به‌ترتیب) تقسیم می‌شود.
2. قبل از شروع هر فاز، یک «تست دروازه» روی خروجی فاز قبل اجرا می‌شود (curl/mysql/`go test`).
3. فقط با ✅ به فاز بعد می‌رویم؛ با ❌ برمی‌گردیم فاز قبل را درست می‌کنیم.
4. لایه «محاسبه قطعی» (Go) از «تولید متن با AI» جدا نگه داشته می‌شود تا دقت بالا برود و هزینه توکن کم شود.

جزئیات کامل تست فاز ۰ (متن پرامپت‌های curl، انتظار خروجی، جدول ۷ تست): **دست‌نخورده در `Fitino_Phase0_Testing_Guide.md`** — همان الگو را برای فاز ۱ به بعد کپی/تطبیق بده.

---

## ۶) نکات حقوقی/محصولی (برای تمام فازهای بعدی)

در فیچرهای «تصویر بدن آینده» (فاز ۵) و «تضمین‌ها» (فاز ۱۰)، حتماً disclaimer روشن اضافه شود که خروجی‌های AI جنبه شبیه‌سازی/راهنما دارند و جایگزین نظر پزشک/متخصص تغذیه نیستند — هم برای کاهش ریسک حقوقی، هم برای شفافیت با کاربر. همین اصل برای تحلیل عکس پیشرفت (D2 فاز ۵) هم صدق می‌کند: خروجی AI باید «مشاهده‌محور» باشد، نه ادعای تشخیصی پزشکی.

---

## ۷) ایندکس فایل‌های مرجع (برای جزئیات کامل، این فایل‌ها دست‌نخورده باقی مانده‌اند)

| فایل | چه‌وقت به آن مراجعه کن |
|---|---|
| `Fitino_Phase0_Guide.md` | آموزش گام‌به‌گام کد Go برای structured output — اگر می‌خواهی همان الگو را برای schema جدید (مثلاً `FoodLogSchema` واقعی فاز ۲) تکرار کنی |
| `Fitino_Phase0_Testing_Guide.md` | متن کامل تست‌های curl/mysql/go test فاز ۰ — الگو برای نوشتن تست‌های فازهای ۱ به بعد |
| `PROJECT_INVENTORY.md` | مرجع کامل معماری/مدل‌ها/endpointها/env vars — قبل از شروع هر فاز جدید یک‌بار مرور شود تا با الگوهای موجود هم‌راستا بمانی |
| `backend/docs/API-ENDPOINTS.md` | مرجع دقیق endpointهای واقعی (به‌روزتر از هر خلاصه‌ای) |
| `docs/MOBILE_PARITY.md` | چک‌لیست پاریتی فلاتر↔وب قبل از تیک زدن هر تسک `Mobile-*` |

> این فایل (`Fitino_Master_Roadmap.md`) نقطهٔ ورود اصلی است؛ فایل‌های بالا برای عمق بیشتر باقی مانده‌اند و نیازی به خواندن کامل‌شان برای شروع فاز ۱ نیست.
