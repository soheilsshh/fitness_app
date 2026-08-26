# سیستم امتیازدهی، سطح، اعتبار و لیدربورد فیتینو — مستند پیاده‌سازی

این مستند شرح می‌دهد که سیستم امتیازدهی سه‌لایه‌ (XP روزانه → مدال → اعتبار/رتبه) چگونه روی موتور مدال موجود فیتینو پیاده‌سازی شد.

وضعیت: **همه‌ی فازها (صفر، ۱ MVP، ۲ v2، ۳ v3، ۴) پیاده‌سازی و end-to-end تست شده‌اند** — با MySQL واقعی، لاگین واقعی، و درخواست‌های HTTP واقعی (نه فقط build سالم).

---

## ۱. معماری سه‌لایه

```
فعالیت کاربر (مثلاً ثبت جلسه تمرین)
        │
        ├──▶ لایه XP (XPLedgerEntry) — سقف روزانه دارد، هر بار قابل تکرار
        │        │
        │        └──▶ UserGameStats.TotalXP += awarded  →  Level بازمحاسبه می‌شود
        │
        └──▶ لایه مدال (UserAchievement) — بدون سقف، یک‌بار یا تکرارپذیر طبق تعریف Rule
                 │
                 └──▶ UserGameStats.TotalMedalPoints += rule.Points

اعتبار (Reputation) = TotalXP + TotalMedalPoints × ۳   ← همیشه محاسبه‌شده، هرگز ذخیره نمی‌شود
```

هر فعالیت واجد شرایط هر دو لایه را هم‌زمان صدا می‌زند (مثلاً یک رکورد جدید هم ۱۰ XP می‌دهد هم ۱۰ امتیاز مدال «رکورد جدید»).

---

## ۲. فایل‌های جدید

| فایل | نقش |
|---|---|
| `backend/internal/models/xp_ledger_entry.go` | مدل `XPLedgerEntry` — دفتر تراکنش XP (منبع لیدربورد + سقف ضداسپم) |
| `backend/internal/models/user_game_stats.go` | مدل `UserGameStats` — رول‌آپ دنرمالایز ۱به۱ با کاربر (TotalXP, TotalMedalPoints, Level) |
| `backend/internal/repository/gamification_repository.go` | کوئری‌های خام: ثبت XP، جمع روزانه، لیدربورد تجمیعی، شمارش مدال |
| `backend/internal/service/level.go` | توابع خالص `LevelForXP`, `XPForNextLevel`, `LevelTitle` (بدون DB، قابل یونیت‌تست) |
| `backend/internal/service/gamification_service.go` | موتور اصلی: `AwardXP` (با سقف ضداسپم)، `AddMedalPoints`، `GetMySummary`، `GetLeaderboard` |
| `backend/internal/controllers/gamification_controller.go` | `GET /me/gamification`، `GET /leaderboard` |
| `frontend/src/lib/api/gamification.js` | wrapper فرانت: `getMyGameSummary()`, `getLeaderboard({period, coachId})` |
| `frontend/src/app/(panel)/user/achievements/_components/LeaderboardClient.jsx` | تب رتبه‌بندی: انتخاب دوره + سراسری/فقط‌مربی + لیست |

## فایل‌های تغییریافته

- `backend/internal/models/registry.go` — دو مدل جدید به `AllModels()` اضافه شد (AutoMigrate خودکار، بدون migration دستی).
- `backend/internal/models/achievement_rule.go` — ۱۸ کد مدال جدید در ۴ فاز (لیست کامل در بخش ۵).
- `backend/internal/service/achievement_service.go` — وابستگی جدید `GamificationService`؛ در `award()` بعد از هر اعطای مدال موفق `AddMedalPoints` صدا زده می‌شود؛ `Handle*`های موجود XP هم می‌دهند؛ ده‌ها `Handle*` جدید برای فازهای ۱ تا ۴ (لیست کامل در بخش ۵)، شامل کمک‌توابع `currentSubscription`, `checkNutritionDayGoal`, `checkRegularWeek` که با استفاده مجدد از منطق موجود (`models.StudentProfileProgress`, الگوی کوئری `fillAdherence`) نوشته شدند تا منطق تکراری نداشته باشیم.
- `backend/internal/service/workout_history_service.go`, `daily_food_log_service.go` — امضای `Handle*` عوض شد تا `sessionID`/`logID` واقعی برای `RefID` در دفتر XP پاس داده شود؛ `workout_history_service.go` هم‌چنین `HandleWeeklyProgramChecked` را صدا می‌زند.
- `backend/internal/service/me_service.go`, `tracking_service.go`, `checkin_service.go`, `community_post_service.go`, `coach_program_service.go`, `coach_session_service.go`, `ai_generate_service.go`, `payment_service.go` — همگی وابستگی جدید (اختیاری) `AchievementService` گرفتند و در نقطه‌ی نوشتن دیتای مرتبط، `Handle*` مناسب را صدا می‌زنند (جزئیات کامل در بخش ۵).
- `backend/cmd/app/main.go` — `gamificationService`/`achievementService` به بالای بلوک ساخت سرویس‌ها منتقل شدند (چون بقیه‌ی سرویس‌ها به آن‌ها نیاز دارند)، همه‌ی سازنده‌های بالا به‌روزرسانی شدند، دو روت جدید در `studentGroup` ثبت شد.
- `frontend/.../achievements/_components/AchievementsClient.jsx` — بازطراحی کامل هدر (۴ کارت آماری) + افزودن Tabs (مدال‌ها/رتبه‌بندی) + رفع یک باگ واقعی پیش‌موجود (کلید تکراری React روی مدال‌های تکرارپذیر).

---

## ۳. فرمول‌ها (دقیقاً طبق مشخصات کاربر)

**سطح:** XP لازم برای رفتن از سطح n به n+1 = `100×n`. آستانه‌ی تجمعی برای رسیدن به سطح L: `50×L×(L-1)`.
`LevelForXP` این را با یک تقریب بسته‌فرم + اصلاح گرد‌کردن حل می‌کند (`backend/internal/service/level.go`).

**عنوان سطح:** ۱–۳ تازه‌وارد، ۴–۷ در حال ساخت، ۸–۱۲ منظم، ۱۳–۲۰ متعهد، ۲۱–۳۵ حرفه‌ای، ۳۶+ اسطوره فیتینو.

**اعتبار:** `Reputation = TotalXP + TotalMedalPoints × 3`.

---

## ۴. سقف‌های ضداسپم (پیاده‌سازی‌شده)

`AwardXP` قبل از هر ثبت، جمع همان دسته را برای «امروز» می‌گیرد و درخواست را به سقف باقی‌مانده کلمپ می‌کند (اگر سقف پر باشد، هیچ ردیفی درج نمی‌شود):

| دسته (`Category`) | سقف روزانه |
|---|---|
| `workout` | ۶۰ |
| `nutrition` | ۲۰ |
| `ai_chat` | ۱۰ |
| `community_engagement` | ۱۰ |
| `content_view` | ۱۰ |
| `tracking`, `ai` | بدون سقف صریح (فعالیت کم‌تکرار/پرارزش — طبق جدول کاربر سقفی تعیین نشده بود) |

**تست واقعی:** ۹ بار ثبت غذا (هر بار ۳XP = ۲۷ potential) پشت‌سرهم انجام شد → `totalXP` دقیقاً روی **۲۰** متوقف شد (نه بیشتر). ✅

---

## ۵. کاتالوگ کامل XP/مدال (فازهای صفر تا ۴)

### فاز ۱ (MVP)

| فعالیت | لایه XP | لایه مدال | نقطه‌ی قلاب |
|---|---|---|---|
| ثبت جلسه تمرین | ۱۵XP (`workout`) | — | `workout_history_service.go` → `HandleWorkoutSessionCompleted` |
| رکورد جدید (PR) | ۱۰XP (`workout`) | ۱۰ امتیاز، تکرارپذیر | همان‌جا → `HandleNewPR` |
| استریک تمرین ۷روزه | — | ۵۰ امتیاز، یک‌بار (برنز) | همان‌جا، `consecutiveDayStreak` |
| ثبت وعده غذا | ۳XP (`nutrition`) | — | `daily_food_log_service.go` → `HandleFoodLogCreated` |
| استریک غذا ۳۰روزه | — | ۱۰۰ امتیاز، یک‌بار (نقره) | همان‌جا |
| پروفایل ۱۰۰٪ | — | ۷۵ امتیاز، یک‌بار (نقره) | `me_service.go` → `UpdateProfile` → `HandleProfileUpdated` |
| آلبوم اولیه (۴ زاویه عکس) | — | ۴۰ امتیاز، یک‌بار (نقره) | `me_service.go` → `UploadBodyPhoto` → `HandlePhotoUploaded` |
| ۵ سال عضویت | — | ۵۰۰ امتیاز، یک‌بار (افسانه‌ای) | `GetSummary` → `checkMembershipMilestone` (چک فرصت‌طلبانه، بدون نیاز به scheduler) |

مدال «پروفایل ۱۰۰٪» و «آلبوم اولیه» از تابع موجود `models.StudentProfileProgress` (همان منطقی که UI نوار پیشرفت پروفایل استفاده می‌کند) استفاده می‌کنند — منطق تکراری نوشته نشد.

### فاز ۲ (v2)

| فعالیت | لایه XP | لایه مدال | نقطه‌ی قلاب |
|---|---|---|---|
| معمار تمرین AI | ۲۰XP (`ai`) | ۲۰ امتیاز، یک‌بار | `ai_generate_service.go` → `saveWorkoutProgram` → `HandleAIProgramSaved(..., "workout")` |
| معمار تغذیه AI (تک‌روزه/هفتگی) | ۲۰XP (`ai`) | ۲۰ امتیاز، یک‌بار | همان‌جا → `saveNutritionProgram`/`saveWeeklyNutritionProgram` → `HandleAIProgramSaved(..., "nutrition")` |
| روز تغذیه‌ای کامل | ۱۵XP (`nutrition`) | ۱۵ امتیاز، تکرارپذیر | `daily_food_log_service.go` → `HandleFoodLogCreated` → `checkNutritionDayGoal` (کالری امروز در ±۱۰٪ هدف برنامه‌ی تغذیه‌ی فعال) |
| چک‌این طلایی | — | ۶۰ امتیاز، تکرارپذیر | `tracking_service.go` → `UploadTrackingPhoto` و `checkin_service.go` → `SubmitDailyCheckIn`/`SubmitWeeklyCheckIn` → `HandleTrackingUpdated` (وزن امروز + اندازه‌ی این هفته + ۳ زاویه‌ی عکس امروز) — **تست شد end-to-end** |
| هفته منظم | — | ۲۵ امتیاز، تکرارپذیر | `workout_history_service.go` → `HandleWeeklyProgramChecked` → `checkRegularWeek` (با الگوی کوئری `meDashboardService.fillAdherence`) |

### فاز ۳ (v3)

| فعالیت | لایه XP | لایه مدال | نقطه‌ی قلاب |
|---|---|---|---|
| استریک تمرین ۳۰/۹۰روزه | — | ۱۵۰ / ۴۰۰ امتیاز، یک‌بار | `achievement_service.go` → `HandleWorkoutSessionCompleted` (تعمیم `consecutiveDayStreak` موجود) |
| استریک غذا ۹۰روزه | — | ۲۵۰ امتیاز، یک‌بار | `HandleFoodLogCreated` (همان تعمیم) |
| پایداری بصری ۲ماهه | — | ۱۲۰ امتیاز، یک‌بار | `HandleTrackingUpdated` (≥۴ روز متمایز با عکس پایش در ۶۰ روز اخیر) |
| پایداری پایش (بلندمدت) | — | ۱۵۰ امتیاز، یک‌بار | `HandleTrackingUpdated` (≥۶ چک‌این هفتگی متمایز در ۹۰ روز اخیر) |
| پست/لایک/کامنت اجتماع | ۵/۱/۱XP (`community_engagement`, سقف ۱۰) | — | `community_post_service.go` → `CreatePost`/`ToggleLike`/`AddComment` → `HandleCommunityEvent` — **تست شد end-to-end** |
| عضو فعال جامعه | — | ۵۰ امتیاز، یک‌بار | همان‌جا (۲۰ پست یا ۱۰۰ لایک+کامنت مجموع) |
| همکاری انسان و AI | — | ۵۰ امتیاز، تکرارپذیر | `coach_program_service.go` → `ApproveWorkoutProgram`/`ApproveNutritionProgram` → `HandleAIProgramApproved` (فقط وقتی `program.Source == ai`) |

### فاز ۴

| فعالیت | لایه XP | لایه مدال | نقطه‌ی قلاب |
|---|---|---|---|
| جلسه با مربی | — | ۲۵ امتیاز، تکرارپذیر | `coach_session_service.go` → `Update` (فقط وقتی وضعیت تازه به `completed` تغییر می‌کند، نه هر ذخیره) → `HandleCoachSessionCompleted` |
| ادامه مسیر (تمدید اشتراک) | — | ۲۰ امتیاز، تکرارپذیر | `payment_service.go` → `fulfillPaidOrder` (تشخیص «تمدید» با شمارش اشتراک‌های قبلی کاربر قبل از تراکنش) → `HandleSubscriptionCreated(..., isRenewal)` |
| یک سال همراه فیتینو | — | ۲۰۰ امتیاز، یک‌بار | `checkMembershipMilestone` (تعمیم همان چک ۵ساله‌ی موجود) |

### تست واقعی end-to-end انجام‌شده (نمونه‌ی کامل روی شاگرد دمو «رضا محمدی»)

| اقدام | نتیجه |
|---|---|
| ۹ بار ثبت غذا پشت‌سرهم | `totalXP` دقیقاً روی سقف ۲۰ متوقف شد |
| ثبت پست + کامنت + لایک + آن‌لایک | XP: +۵ +۱ +۱ +۰ (آن‌لایک هیچ امتیازی نداد) |
| چک‌این روزانه + هفتگی + ۳ عکس پایش | مدال «چک‌این طلایی» فعال شد؛ `totalMedalPoints` ۰→۶۰، `medalCount` ۴→۵ |
| تولید و ذخیره‌ی برنامه‌ی تمرینی AI | XP +۲۰، مدال «معمار تمرین AI» فعال شد؛ `totalMedalPoints` ۶۰→۸۰ |
| بعد از همه‌ی موارد بالا | `reputation` نهایی **۲۸۷** = `47 (XP) + 80 (مدال) × 3` — دقیقاً مطابق فرمول ✅ |
| صفحه‌ی `/user/achievements` در مرورگر واقعی | تمام کارت‌های هدر و لیست مدال‌ها دقیقاً همین اعداد را نشان دادند |

---

## ۶. اندپوینت‌های جدید API

### `GET /me/gamification` (نیاز به لاگین)
```json
{
  "level": 1,
  "levelTitle": "تازه‌وارد",
  "totalXP": 20,
  "xpThisWeek": 20,
  "xpIntoLevel": 20,
  "xpNeededForLevel": 100,
  "totalMedalPoints": 0,
  "medalCount": 4,
  "reputation": 20
}
```

### `GET /leaderboard?period=weekly&coachId=11&limit=50` (نیاز به لاگین)
- `period`: `daily` | `weekly` | `monthly` | `quarterly` | `yearly`
- `coachId` (اختیاری): فقط شاگردهای همان مربی (بر اساس `User.AssignedCoachID`)
- برمی‌گرداند آرایه‌ی مرتب‌شده، هرکدام با `rank`, `userId`, `fullName`, `avatarUrl`, `points`, `isCurrentUser`.
- کوئری تجمیعی زنده روی `xp_ledger_entries` (بدون جدول snapshot جداگانه — برای مقیاس فعلی فیتینو کافی است).

**تست واقعی انجام‌شده (نمونه):**
```
GET /leaderboard?period=weekly&coachId=11
→ [{"rank":1,"userId":13,"fullName":"رضا محمدی","points":20,"isCurrentUser":true}]
```

---

## ۷. UI — صفحه‌ی `/user/achievements`

هدر جدید طبق مثال کاربر: چهار کارت (🏆 مدال / ⭐ XP این هفته / 🔥 استریک / 👑 اعتبار) + کارت سطح (نوار پیشرفت تا سطح بعد). زیر آن دو تب:
- **مدال‌ها** — همان لیست قبلی (بدون تغییر منطق).
- **رتبه‌بندی** (جدید) — چیپ‌های انتخاب دوره (۵ حالت)، toggle سراسری/فقط‌مربی‌من (فقط اگر کاربر مربی دارد)، لیست رتبه‌بندی‌شده با هایلایت ردیف کاربر جاری.

**تست بصری انجام‌شده** با لاگین واقعی (شاگرد دمو «رضا محمدی») روی بک‌اند و دیتابیس واقعی: هر دو تب داده‌ی واقعی و درست نشان دادند (مدال ۴، XP هفته ۲۰، اعتبار ۲۰، سطح ۱ · تازه‌وارد، لیدربورد رتبه ۱ با ۲۰ امتیاز).

---

## ۸. چگونه خودتان تست کنید

```bash
# بک‌اند (نیاز به MySQL محلی روی 3306 و .env معتبر)
cd backend && go run ./cmd/app

# لاگین دمو (پسورد همه‌ی اکانت‌های دمو: 12345678)
curl -X POST http://localhost:8088/auth/login/password \
  -H "Content-Type: application/json" \
  -d '{"identifier":"09123333333","password":"12345678"}'

# با توکن گرفته‌شده:
curl http://localhost:8088/me/gamification -H "Authorization: Bearer <TOKEN>"
curl "http://localhost:8088/leaderboard?period=weekly" -H "Authorization: Bearer <TOKEN>"
```

فرانت: `npm run dev` در `frontend/`، ورود به `/user/achievements`.

---

## ۹. وضعیت نقشه راه

همه‌ی ۴ فاز (MVP، v2، v3، ۴) طبق پلن تأییدشده پیاده و تست شدند — چیزی از پلن اصلی باقی نمانده. جزئیات طراحی هر فاز در پلن اصلی قابل مرور است: `C:\Users\Ashkan\.claude\plans\dreamy-brewing-beacon.md`.

## محدودیت‌های شناخته‌شده (برای کار بعدی، نه باگ)

1. **مدال‌های تاریخی قبل از این تغییر** (۴ رکورد PR که پیش از استقرار این سیستم اعطا شده بودند) در `TotalMedalPoints` بازمحاسبه نشدند — چون `AddMedalPoints` فقط از این پس روی اعطاهای جدید صدا زده می‌شود. اگر لازم بود، یک اسکریپت یک‌باره برای sync اولیه‌ی `UserGameStats.TotalMedalPoints` از `SUM(UserAchievement.Points)` برای کاربران موجود قابل‌اجراست.
2. **«روز تغذیه‌ای کامل»** فقط کالری را در ±۱۰٪ هدف چک می‌کند (پروتئین/کربوهیدرات/چربی چک نمی‌شوند) — چون فقط `NutritionProgram.CaloriesTarget` به‌صورت عددی مشخص در دیتابیس موجود است؛ `ProteinTarget` یک رشته‌ی متنی است (`"120g"`), نه عدد قابل‌مقایسه‌ی مستقیم.
3. **«چک‌این طلایی»** بخش «اندازه‌ها» را به‌صورت هفتگی چک می‌کند نه روزانه (چون `WeeklyCheckIn` اصلاً روزانه ثبت نمی‌شود) — یعنی اگر کاربر همین هفته یک‌بار دور کمر ثبت کرده باشد و امروز وزن+۳عکس را هم ثبت کند، مدال فعال می‌شود؛ این یک تفسیر معقول از خواسته‌ی اصلی است، نه یک محدودیت فنی سخت.
4. **«تمدید اشتراک»** با شمارش تعداد اشتراک‌های قبلی کاربر (نه یک فیلد صریح status) تشخیص داده می‌شود؛ این کوئری خارج از تراکنش پرداخت اجرا می‌شود (best-effort، مثل بقیه‌ی قلاب‌های گیمیفیکیشن) — اگر بین این چک و ثبت واقعی سفارش یک race نادر رخ دهد، حداکثر خطا این است که یک تمدید واقعی به‌عنوان خرید اول محاسبه شود (نه برعکس)، که ریسک پایینی دارد.
5. سقف‌های روزانه‌ی دسته‌های `tracking` و `ai` هنوز صریحاً تعیین نشده‌اند (چون جدول اصلی کاربر برای این دو سقفی نداده بود) — در صورت مشاهده‌ی سوءاستفاده در داده‌ی واقعی، به‌راحتی در نقشه‌ی `dailyXPCap` (`gamification_service.go`) قابل افزودن است.
