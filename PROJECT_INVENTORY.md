# فیتینو (Fitino) — فایل بک‌آنالیز پروژه

> تاریخ تهیه: ۱۴۰۵/۰۵/۱۹ (۱۰ اوت ۲۰۲۶)  
> هدف: مرجع کامل برای تحلیل و طراحی فیچرهای جدید، هم‌راستا با استک و معماری فعلی  
> مسیر ریشه: `fitness_app/`

این فایل وضعیت **واقعی کد** را خلاصه می‌کند. برای جزئیات endpointها به `backend/docs/API-ENDPOINTS.md` و برای پاریتی موبایل به `docs/MOBILE_PARITY.md` رجوع کنید.

---

## ۱) خلاصه محصول

**فیتینو** پلتفرم چندمربی مدیریت مربیگری ورزشی است:

| نقش | کار اصلی |
|-----|----------|
| **سوپرادمین** | مدیریت کل پلتفرم، مربی‌ها، محتوا، تنظیمات سایت، گزارش موبایل |
| **مربی** | پروفایل/لندینگ، پلن فروش، شاگردان، برنامه تمرین/تغذیه، تیکت، پایش |
| **دانشجو** | خرید پلن، دریافت برنامه، پایش بدن، تغذیه، آموزش، AI، تیکت |

**قوانین کسب‌وکار کلیدی:**
- هر دانشجو حداکثر از **یک مربی** پلن می‌خرد (`AssignedCoachID`)
- ثبت‌نام مربی آزاد است؛ فعال‌سازی پنل با **گیت تأیید** (`coach_status` / مدرک درجه سه)
- درگاه پرداخت: دمو + یکپارچه‌سازی **زرین‌پال** (sandbox قابل تنظیم)
- لندینگ `/` = برند پلتفرم؛ لندینگ مربی = `/coach/[slug]` یا `(landing)/[slug]`

---

## ۲) ساختار ریپو

```
fitness_app/
├── backend/          # API — Go + Gin + GORM + MySQL
├── frontend/         # وب — Next.js App Router
├── mobile/           # اپ — Flutter + Riverpod
├── docs/             # CHATS.md, MOBILE_PARITY.md
├── PROJECT.md        # مستند معماری (بخش «وضعیت فعلی» ممکن است قدیمی باشد)
└── PROJECT_INVENTORY.md  # این فایل
```

| کلاینت | پورت معمول | API |
|--------|------------|-----|
| Backend | `8080` / لوکال `8088` | — |
| Frontend | `3000` | `NEXT_PUBLIC_API_BASE_URL` |
| Mobile | native | همان API |

---

## ۳) استک فنی کامل

### ۳.۱ Backend

| مورد | تکنولوژی / نسخه |
|------|-----------------|
| زبان | Go **1.26.5** (`go.mod`) |
| HTTP | **Gin** v1.11 |
| ORM | **GORM** v1.31 + MySQL driver |
| Auth | JWT (`golang-jwt/jwt/v5`) — access ~15m + refresh ~7d |
| رمز | bcrypt (`golang.org/x/crypto`) |
| Config | Viper + `.env` / `config.yaml` |
| Docs | Swagger (swaggo) |
| CORS | gin-contrib/cors |
| Seed | gorm-seed |
| پرداخت | Zarinpal service (`zarinpal_service.go`) |
| SMS | `sms_service.go` + `SMS_API_KEY` |
| AI | OpenAI (`OPENAI_API_KEY`) — چت دانشجو |

**لایه‌های کد بکند:**

```
backend/
├── cmd/                    # entrypoint
├── config/
├── internal/
│   ├── auth/
│   ├── bootstrap/
│   ├── controllers/        # HTTP handlers
│   ├── middleware/         # jwt, admin, coach, auth
│   ├── models/             # GORM models
│   ├── repository/
│   ├── service/            # business logic
│   ├── seed/
│   └── pkg/ (digits, slug)
├── uploads/                # فایل‌های آپلود
└── docs/                   # API-ENDPOINTS.md, TASKS.md
```

**Middleware نقش‌ها:**
- `JWTAuthMiddleware` — همه مسیرهای محافظت‌شده
- `AdminOnly` — `/admin/*`
- `CoachOnly` — `/coach/*`

### ۳.۲ Frontend (وب)

| مورد | تکنولوژی |
|------|----------|
| فریمورک | **Next.js 16.1.6** (App Router) |
| UI lib | **React 19.2** |
| استایل | **Tailwind CSS 4** + `tw-animate-css` |
| کامپوننت | **shadcn/ui** + **Radix UI** |
| State | **Redux Toolkit** + react-redux (عمدتاً `cartSlice`) |
| HTTP | **Axios** (`src/lib/axios/client.js`) |
| انیمیشن | **Framer Motion** |
| نمودار | **Recharts** |
| جدول | **TanStack Table** |
| DnD | **@dnd-kit** (ادیتور برنامه) |
| فرم/ولیدیشن | **Zod** |
| آیکون | lucide-react, react-icons |
| تم | next-themes (روشن/تاریک) |
| Toast | Sonner + SweetAlert2 |
| تاریخ | jalaali-js |
| Drawer | vaul |
| Compiler | babel-plugin-react-compiler |
| زبان/جهت | فارسی، `dir="rtl"` |

**کلاینت‌های API فرانت:**  
`src/lib/api/{admin,coach,user,content,assets,translateError,baseUrl}.js`

### ۳.۳ Mobile (Flutter)

| مورد | تکنولوژی |
|------|----------|
| SDK | Dart **^3.10** |
| فریمورک | Flutter |
| State | **Riverpod 3** + riverpod_annotation / generator |
| Routing | **go_router** |
| HTTP | **Dio** |
| مدل | Freezed + json_serializable |
| Storage | flutter_secure_storage |
| تاریخ | shamsi_date + intl |
| رسانه | video_player (آموزش) |
| تصویر | image_picker |
| پرداخت/لینک | url_launcher, app_links |
| فونت | IRANSansX |
| فلیور فروشگاه | myket / bazaar / play / appstore |

معماری فیچر: `features/<name>/{data,application,presentation}`

---

## ۴) نقش‌ها، مسیرها و پنل‌ها

| نقش | `User.Role` | پنل وب | مسیر پس از لاگین |
|-----|-------------|--------|------------------|
| سوپرادمین | `admin` | `/admin/*` | `/admin/dashboard` |
| مربی | `coach` | `/coach/*` | `/coach/dashboard` |
| دانشجو | `student` | `/user/*` | `/user/my-programs` (یا dashboard) |

فایل نقش‌ها: `frontend/src/lib/auth/roles.js` · `backend/internal/models/roles.go`

---

## ۵) نقشه UI وب — مسیرها و فیچرها

### ۵.۱ سایت عمومی `(site)`

| مسیر | فیچر |
|------|------|
| `/` | لندینگ برند: Hero، برنامه‌ها، رکوردها، درباره، تماس، Navbar/Footer، سبد |
| `/coaches` | لیست مربی‌های منتشرشده |
| `/coach/[slug]` | لندینگ عمومی مربی + پلن‌ها |
| `(landing)/[slug]` | لندینگ جایگزین/موازی مربی |
| `/auth` | Auth واحد (شماره → ورود/ثبت‌نام) |
| `/auth/login`, `/register`, `/forgot` | ریدایرکت/صفحات کمکی |
| `/auth/register/coach` | ثبت‌نام مربی |
| `/payment`, `/payment/bank`, `/payment/result` | سبد + درگاه دمو/نتیجه |
| `/leadfunnel` | قیف لید مارکتینگ |
| `/ali-rashidabadi/*` | لندینگ/پرداخت اختصاصی یک مربی (کمپین) |

**کامپوننت‌های لندینگ:**  
`Hero`, `ProgramsSection`, `RecordsSection`, `AboutSection`, `ContactSection`, `Navbar`, `Footer`, `CartButton`, `CartDrawer`, …

### ۵.۲ پنل دانشجو `(panel)/user`

ناوبری ۵ تب: **خانه · تمرین · تغذیه · پایش · حساب من**

| مسیر | فیچر |
|------|------|
| `/user/dashboard` | داشبورد (هدف، امروز، رکورد، جلسات، اشتراک، وزن) |
| `/user/onboarding` | آنبوردینگ تدریجی (نام + هدف) |
| `/user/my-programs` (+ detail) | برنامه‌های تمرین/تغذیه + ثبت جلسه |
| `/user/workout-history` | تاریخچه تمرین |
| `/user/food-diary` | کالری‌شمار / لاگ غذا |
| `/user/tracking` | پایش وزن + عکس بدن |
| `/user/profile` | پروفایل کامل + پزشکی + اهداف |
| `/user/orders` (+ detail) | سفارش‌ها |
| `/user/contact` (+ detail) | تیکت با مربی |
| `/user/academy` | آموزش (پادکست/ویدیو/متن) |
| `/user/faq` | سوالات متداول |
| `/user/ai` + FAB | چت هوش مصنوعی |

### ۵.۳ پنل مربی `(panel)/coach`

| مسیر | فیچر |
|------|------|
| `/coach/dashboard` | آمار شاگردان/فروش/اشتراک |
| `/coach/profile` | پروفایل، slug، آواتار/کاور، achievements، مدرک |
| `/coach/plans` (+ new/detail) | CRUD پلن‌های فروش |
| `/coach/students` (+ detail/workout/nutrition) | شاگردان + ادیتور تمرین/تغذیه |
| `/coach/templates` | قالب‌های تمرین |
| `/coach/nutrition-templates` | قالب‌های تغذیه |
| `/coach/tickets` | تیکت‌های شاگردان |
| `/coach/tracking` | پایش شاگردان |
| `/coach/tools/bmi-calculator` | BMI |
| `/coach/tools/calorie-calculator` | کالری |

**ادیتور تمرین:** استراحت بین ست، سوپرست/جاینت/دایره، `setsDetails` (DnD)

### ۵.۴ پنل ادمین `(panel)/admin` (فقط وب)

| مسیر | فیچر |
|------|------|
| `/admin/dashboard` | آمار + فروش ماهانه |
| `/admin/users` | کاربران |
| `/admin/students` | شاگردان کل پلتفرم + تخصیص برنامه |
| `/admin/coaches` (+ detail/requests) | مربی‌ها، تأیید، publish/active |
| `/admin/plans` | مشاهده پلن‌ها |
| `/admin/exercises` | کاتالوگ حرکات |
| `/admin/templates` | قالب تمرین |
| `/admin/nutrition-templates` | قالب تغذیه |
| `/admin/site` | تنظیمات لندینگ برند + hero |
| `/admin/content` | آموزش (Academy) + FAQ |
| `/admin/feedback` | فیدبک‌های سایت |
| `/admin/funnel-leads` | لیدهای قیف |
| `/admin/mobile` | گزارش/تله‌متری اپ موبایل |

### ۵.۵ UI Kit (`components/ui`)

accordion, alert, avatar, badge, breadcrumb, button, card, chart, checkbox, dialog, drawer, dropdown-menu, field, input, label, progress, select, separator, sheet, sidebar, skeleton, sonner, table, tabs, textarea, toggle, toggle-group, tooltip, page-loader, aurora-background, blur-text-animation, BorderGlow, ContainerTextFlip, PixelCanvas, background-*, direction

**سایر:** `components/forms`, `components/tracking`, `components/workout`

### ۵.۶ State فرانت

- Redux: عمدتاً **سبد خرید** (`cartSlice`) — آیتم‌ها به ازای یک مربی
- Session: `lib/auth/session.js`
- تم: local preference / next-themes

---

## ۶) Backend — مدل‌های داده

فایل‌ها در `backend/internal/models/`:

| مدل | حوزه |
|-----|------|
| `user.go` | کاربر، نقش، `AssignedCoachID`, پروفایل دانشجو، `CoachStatus` |
| `user_profile.go` / `user_photo.go` | پروفایل/عکس بدن |
| `coach_profile.go` | slug، بیو، شبکه اجتماعی، publish/active |
| `coach_profile_status.go` | وضعیت تأیید پروفایل |
| `coach_achievement.go` | دستاوردهای مربی |
| `service_plan.go` | پلن فروش (`CoachID`) |
| `subscription.go` | اشتراک (`CoachID`) |
| `order.go` / `transaction.go` | سفارش و تراکنش |
| `workout_program.go` / `program_item.go` / `program_item_set.go` | برنامه تمرین |
| `workout_template.go` | قالب تمرین |
| `workout_session.go` / `workout_set_log.go` | جلسات و لاگ ست |
| `nutrition_program.go` / `nutrition_item.go` | برنامه غذایی |
| `nutrition_template.go` | قالب تغذیه |
| `exercise.go` / `food.go` | کاتالوگ حرکت/غذا |
| `daily_food_log.go` | لاگ روزانه تغذیه |
| `check_in.go` | چک‌این |
| `ticket.go` | تیکت دانشجو↔مربی |
| `notification.go` | اعلان |
| `feedback.go` | فیدبک عمومی سایت |
| `site_settings.go` | تنظیمات سایت + academy/FAQ (JSON) |
| `funnel_lead.go` | لید قیف |
| `mobile_device.go` | دستگاه/تله‌متری موبایل |
| `otp_code.go` / `refresh_token.go` | OTP و refresh JWT |
| `roles.go` | ثابت‌های نقش |

**فیلدهای مهم User:**  
`Name, Email, Phone, Password, Role, AvatarURL, AssignedCoachID, CoachStatus, HeightCm, WeightKg, BirthDate, Gender, Goals, PrimaryGoal, TargetWeightKg, BodyCondition, BodyFatPercent, MedicalHistory, Injuries, PhysicalLimitations, NationalID`

---

## ۷) Backend — Controllers / دامنه API

| Controller | دامنه |
|------------|--------|
| `auth_controller` | ثبت‌نام، لاگین، OTP، ریست رمز، me |
| `me_controller` / `me_dashboard_controller` | پروفایل و داشبورد دانشجو |
| `checkout_controller` / `payment_controller` | سفارش و پرداخت |
| `public_coach_controller` | لیست/لندینگ عمومی مربی |
| `coach_profile/plan/student/program/dashboard` | پنل مربی |
| `coach_ticket` / `coach_achievement` / `coach_exercise` / `coach_food` | تیکت، دستاورد، کاتالوگ |
| `admin_*` | داشبورد، کاربر، شاگرد، پلن، مربی، قالب، تمرین، فیدبک |
| `site_settings_controller` | تنظیمات عمومی + academy/faq |
| `feedback_controller` | فیدبک عمومی |
| `tracking_controller` | پایش |
| `workout_history_controller` | تاریخچه تمرین |
| `daily_food_log_controller` | تغذیه روزانه |
| `me_ticket_controller` | تیکت دانشجو |
| `ai_chat_controller` | چت AI |
| `funnel_controller` | قیف لید |
| `mobile_app_controller` | تله‌متری موبایل |
| `notification_controller` | اعلان‌ها |
| `student_controller` | عملیات مرتبط با دانشجو |

### نقشه خلاصه Endpointها

**Auth:**  
`/auth/register`, `/auth/register/coach`, `/auth/login/password`, `/auth/otp/*`, `/auth/forgot/*`, `/auth/reset-password`, `/auth/logout`, `/auth/me`, `/auth/change-password`, `/auth/check-phone`

**Public:**  
`GET /site-settings`, `POST /feedbacks`, `GET /coaches`, `GET /coaches/:slug`, `GET /coaches/:slug/plans`, `GET /academy`, `GET /faq`

**Student:**  
`/me`, `/me/dashboard`, `/me/programs`, `/me/orders`, `/me/tracking`, `/me/tickets`, `/me/ai/chat`, food-logs, workout-history, subscriptions, `POST /orders/checkout`

**Coach:**  
`/coach/profile`, plans CRUD, students + workout/nutrition programs, dashboard/stats, tickets, tracking, templates, foods/exercises

**Admin:**  
dashboard, users, students, coaches, plans, site-settings, academy/faq, feedbacks, exercises, templates, funnel, mobile reports

**Infra:**  
`GET /uploads/*`, `GET /swagger/*`

جزئیات کامل: `backend/docs/API-ENDPOINTS.md`

---

## ۸) Mobile — فیچرهای پیاده‌شده

طبق `docs/MOBILE_PARITY.md` تقریباً با وب هم‌تراز است (به‌جز پنل ادمین و صفحات مارکتینگ).

| Feature folder | موضوع |
|----------------|--------|
| `auth` | ورود/ثبت‌نام/فراموشی/مربی |
| `onboarding` | آنبوردینگ |
| `dashboard` | داشبورد دانشجو |
| `programs` | برنامه‌ها + ثبت جلسه |
| `workout_history` | تاریخچه |
| `food_diary` | تغذیه |
| `tracking` | پایش |
| `profile` | پروفایل |
| `orders` / `subscription` | سفارش و اشتراک |
| `contact` | تیکت |
| `content` | Academy + FAQ |
| `ai` | چت AI |
| `shell` | Bottom nav ۵ تب |
| `coach_*` | داشبورد، شاگرد، پلن، پروفایل، تیکت، پایش، ابزار، اعلان، کاتالوگ |
| `coach_catalog` | حرکات/غذا |
| `mobile_telemetry` | گزارش به ادمین |

فلیورها: `main_myket.dart`, `main_bazaar.dart`, `main_play.dart`, `main_appstore.dart`

---

## ۹) جریان‌های کلیدی (برای طراحی فیچر)

### خرید پلن

```
دانشجو → لندینگ مربی → افزودن پلن به cart (یک مربی)
→ /payment → POST /orders/checkout
→ Order + Subscription + AssignedCoachID
→ ظاهر شدن در /coach/students
→ مربی تخصیص برنامه → دانشجو در /user/my-programs
```

محدودیت: اگر `AssignedCoachID` ست باشد → `409 Conflict`

### Auth واحد

```
شماره → check-phone
→ موجود: رمز یا OTP
→ جدید: OTP + رمز → onboarding (نام + هدف)
→ redirect بر اساس Role
```

### گیت مربی

```
ثبت‌نام coach → تکمیل پروفایل + مدرک درجه سه
→ submit برای تأیید ادمین
→ تا approve: گیت پنل
→ IsPublished + IsActive برای لندینگ عمومی
```

---

## ۱۰) متغیرهای محیطی

### Backend (نمونه از `env.example`)

```
APP_ENV=development
PORT=8088
DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME
JWT_SECRET
SMS_API_KEY=
OPENAI_API_KEY=
ZARINPAL_SANDBOX=true
```

همچنین در مستند قدیمی‌تر:  
`FRONTEND_ORIGIN`, `ACCESS_TOKEN_DURATION_MINUTES`, `REFRESH_TOKEN_DURATION_DAYS`

### Frontend

```
NEXT_PUBLIC_API_BASE_URL=https://api.fitinoo.ir
```

### Seed ادمین (لوکال)

- Email: `admin@gmail.com`
- Phone: `09150000000`
- Password: `12345678`

---

## ۱۱) تصمیمات معماری تأییدشده (برای هم‌راستایی فیچر جدید)

1. ثبت‌نام مربی آزاد (با گیت تأیید بعدی)
2. یک مربی per دانشجو
3. `/admin` = سوپرادمین؛ مربی پلن خودش را می‌سازد
4. `/` = برند پلتفرم؛ نه لندینگ تک‌مربی
5. RTL + فارسی در همه کلاینت‌ها
6. پنل ادمین عمداً فقط وب (موبایل ندارد، به‌جز گزارش تله‌متری)
7. محتوا (Academy/FAQ) در `site_settings` به‌صورت JSON + API ادمین

---

## ۱۲) چک‌لیست سریع هنگام افزودن فیچر

| لایه | سؤال |
|------|------|
| نقش | برای student / coach / admin است یا عمومی؟ |
| API | endpoint جدید در `controllers` + `service` + در صورت نیاز `models`؟ |
| دسترسی | JWT + کدام middleware؟ |
| وب | زیر کدام route group و layout؟ کامپوننت shadcn موجود کافی است؟ |
| موبایل | آیا پاریتی لازم است؟ (`MOBILE_PARITY.md`) |
| داده | فیلد روی User است یا مدل جدا؟ Coach-scoped است؟ |
| پرداخت/SMS/AI | به سرویس موجود وصل می‌شود یا کلید env جدید؟ |
| مستندات | به‌روزرسانی `API-ENDPOINTS.md` و در صورت نیاز این فایل |

---

## ۱۳) ایندکس مستندات موجود

| فایل | محتوا |
|------|--------|
| `PROJECT.md` | نمای محصول و فازبندی (بخش «نشده» ممکن است outdated باشد) |
| `PROJECT_INVENTORY.md` | **این فایل** — موجودی کامل برای آنالیز |
| `docs/CHATS.md` | خلاصه فیچرهای اخیر وب/بک |
| `docs/MOBILE_PARITY.md` | چک‌لیست پاریتی فلاتر↔وب |
| `backend/docs/API-ENDPOINTS.md` | مرجع API واقعی |
| `backend/docs/TASKS.md` | تسک‌های بکند |
| `frontend/docs/TASKS.md` | تسک‌های فرانت |
| `frontend/docs/frontend-overview.md` | نمای کلی فرانت (بخشی قدیمی) |
| `mobile/docs/STORE_FLAVORS.md` | فلیورهای فروشگاهی |

---

## ۱۴) نقشه ذهنی یک‌صفحه‌ای

```
┌──────────────────────────────────────────────────────────────┐
│  Web (Next 16)     Mobile (Flutter)     Admin (Web only)     │
│  site|user|coach   student+coach        users|coaches|cms    │
└────────────────────────────┬─────────────────────────────────┘
                             │ Axios / Dio + JWT
┌────────────────────────────▼─────────────────────────────────┐
│  Go Gin API                                                  │
│  Auth · Public · Me · Coach · Admin · Pay · AI · Content     │
└────────────────────────────┬─────────────────────────────────┘
                             │ GORM
┌────────────────────────────▼─────────────────────────────────┐
│  MySQL — Users, CoachProfiles, Plans, Subs, Programs, …      │
│  + uploads/  + SMS  + OpenAI  + Zarinpal                     │
└──────────────────────────────────────────────────────────────┘
```

---

*برای آنالیز فیچر جدید: اول نقش و دامنه داده را مشخص کن، بعد ببین مدل/کنترلر مشابه وجود دارد یا باید گسترش یابد، سپس مسیر UI وب و در صورت نیاز پاریتی موبایل را تعریف کن.*
