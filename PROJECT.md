# Morabiyar — مستندات پروژه

> آخرین به‌روزرسانی: ۱۴۰۵/۰۳/۱۶  
> هدف: تبدیل سامانه فعلی به **پلتفرم چندمربی** با پنل جداگانه برای مربی، دانشجو و سوپرادمین.

---

## خلاصه محصول

**Morabiyar (FitPro)** یک پلتفرم مدیریت مربیگری ورزشی است که:

- چندین **مربی** می‌توانند در پلتفرم فعالیت کنند
- هر مربی **پلن فروش** (تمرین / تغذیه / ترکیبی) تعریف می‌کند
- هر مربی یک **لندینگ عمومی** (پروفایل + پلن‌ها + تماس) دارد
- **دانشجو** پلن را خریداری می‌کند و زیر نظر همان مربی قرار می‌گیرد
- مربی به دانشجویان خود **برنامه تمرین و غذایی** اختصاص می‌دهد
- **سوپرادمین** کل پلتفرم را مدیریت می‌کند (کاربران، مربی‌ها، تنظیمات سایت)

---

## تصمیمات معماری (تأییدشده)

| # | تصمیم | جزئیات |
|---|--------|--------|
| 1 | ثبت‌نام مربی | **آزاد** — بدون تأیید ادمین (فعلاً) |
| 2 | محدودیت دانشجو | هر دانشجو فقط از **۱ مربی** می‌تواند پلن بخرد |
| 3 | پنل ادمین | پنل فعلی `/admin` به عنوان **super-admin** باقی می‌ماند |
| 4 | لندینگ اصلی | `/` مربوط به **برند پلتفرم** است (نه لندینگ تک‌مربی) |
| 5 | درگاه پرداخت | فعلاً **دمو** — بدون اتصال واقعی به بانک |

---

## نقش‌ها و پنل‌ها

| نقش | `User.Role` | پنل | مسیر پس از لاگین |
|-----|-------------|-----|------------------|
| سوپرادمین | `admin` | پنل ادمین | `/admin/dashboard` |
| مربی | `coach` | پنل مربی | `/coach/dashboard` |
| دانشجو | `student` | پنل دانشجو | `/user/my-programs` |

### مسیرهای عمومی

| مسیر | توضیح |
|------|-------|
| `/` | لندینگ برند پلتفرم |
| `/coach/[slug]` | لندینگ عمومی هر مربی |
| `/auth/login` | ورود |
| `/auth/register` | ثبت‌نام دانشجو |
| `/auth/register/coach` | ثبت‌نام مربی (جدید) |
| `/payment` | تأیید سفارش (دمو) |
| `/payment/bank` | درگاه دمو |

---

## معماری سیستم

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 16)                    │
│  (site)          (panel)/user      (panel)/coach   (panel)/admin │
└──────────────────────────┬──────────────────────────────────┘
                           │ Axios + JWT
┌──────────────────────────▼──────────────────────────────────┐
│                   Backend (Go + Gin + GORM)                  │
│  Auth │ Coach API │ Student API │ Admin API │ Public API     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                        MySQL Database                        │
└─────────────────────────────────────────────────────────────┘
```

### جریان کلیدی: خرید پلن و زیرمجموعه شدن

```
دانشجو → لندینگ مربی (/coach/ali-rezaei)
       → انتخاب پلن → سبد خرید
       → /payment → POST /orders/checkout (دمو)
       → ایجاد Order + Subscription با CoachID
       → دانشجو در لیست /coach/students مربی ظاهر می‌شود
       → مربی برنامه تمرین/غذا تخصیص می‌دهد
       → دانشجو در /user/my-programs می‌بیند
```

### محدودیت: یک مربی per دانشجو

- هر `User` با `role=student` حداکثر **یک** `Subscription` فعال دارد
- `User.CoachID` (یا فیلد مشابه) مربی فعلی دانشجو را نگه می‌دارد
- در `checkout`: اگر دانشجو قبلاً مربی دارد → خطای `409 Conflict`
- پس از انقضای اشتراک، امکان خرید از مربی جدید (فاز بعدی — فعلاً مسدود)

---

## مدل داده — تغییرات نسبت به وضعیت فعلی

### User (تغییر)

| فیلد | تغییر |
|------|-------|
| `Role` | مقادیر: `student` \| `coach` \| `admin` |
| `AssignedCoachID` | `*uint` — مربی فعلی دانشجو (null = بدون مربی) |

### CoachProfile (گسترش)

| فیلد | نوع | توضیح |
|------|-----|-------|
| `UserID` | uint | FK یکتا |
| `Slug` | string | یکتا — `ali-rezaei` |
| `DisplayName` | string | نام نمایشی |
| `Title` | string | عنوان — «مربی بدنسازی» |
| `Bio` | text | معرفی کوتاه |
| `AboutCoach` | text | درباره مربی |
| `Specialty` | string | تخصص |
| `AvatarURL` | string | تصویر پروفایل |
| `CoverImageURL` | string | بنر |
| `ContactPhone` | string | |
| `Instagram` | string | |
| `Telegram` | string | |
| `WhatsApp` | string | |
| `Website` | string | |
| `IsPublished` | bool | نمایش در لندینگ عمومی |

### ServicePlan (تغییر)

| فیلد جدید | توضیح |
|-----------|-------|
| `CoachID` | uint — مالک پلن (مربی) |

### Subscription (تغییر)

| فیلد جدید | توضیح |
|-----------|-------|
| `CoachID` | uint — کپی از `ServicePlan.CoachID` هنگام خرید |

### Order (تغییر اختیاری)

| فیلد جدید | توضیح |
|-----------|-------|
| `CoachID` | uint — برای گزارش فروش مربی |

### مدل‌های بدون تغییر اساسی

`WorkoutProgram`, `NutritionProgram`, `ProgramItem`, `NutritionItem`, `UserPhoto`, `CheckIn`, `Feedback`, `SiteSettings`, `RefreshToken`, `OtpCode`

---

## API — نقشه endpointها (هدف نهایی)

### Auth

| متد | مسیر | نقش |
|-----|------|-----|
| POST | `/auth/register` | عمومی — دانشجو |
| POST | `/auth/register/coach` | عمومی — مربی |
| POST | `/auth/login/password` | عمومی |
| POST | `/auth/otp/request` | عمومی |
| POST | `/auth/otp/verify` | عمومی |
| POST | `/auth/logout` | JWT |
| GET | `/auth/me` | JWT |

### عمومی

| متد | مسیر |
|-----|------|
| GET | `/site-settings` |
| GET | `/coaches/:slug` |
| GET | `/coaches/:slug/plans` |
| POST | `/feedbacks` |

### دانشجو (`/me/*`)

| متد | مسیر |
|-----|------|
| GET/PATCH | `/me` |
| GET | `/me/orders`, `/me/orders/:id` |
| GET | `/me/programs`, `/me/programs/:id` |
| POST | `/orders/checkout` |

### مربی (`/coach/*`)

| متد | مسیر |
|-----|------|
| GET/PUT | `/coach/profile` |
| POST | `/coach/profile/avatar`, `/coach/profile/cover` |
| GET | `/coach/profile/slug/check` |
| CRUD | `/coach/plans`, `/coach/plans/:id` |
| GET | `/coach/students`, `/coach/students/:id` |
| POST/PATCH | `/coach/students/:id/workout-programs` |
| POST/PATCH | `/coach/students/:id/nutrition-programs` |
| GET | `/coach/dashboard/stats` |

### سوپرادمین (`/admin/*`)

پنل فعلی حفظ می‌شود + اضافه:

| متد | مسیر |
|-----|------|
| GET | `/admin/coaches` |
| GET | `/admin/coaches/:id` |
| PATCH | `/admin/coaches/:id` (فعال/غیرفعال) |

---

## وضعیت فعلی پروژه

### بکند — پیاده‌شده

- Auth (رمز + OTP)
- `/me/*` (پروفایل، سفارش، برنامه)
- `/admin/*` (داشبورد، کاربران، شاگردان، پلن، سایت، فیدبک)
- `GET /site-settings`, `POST /feedbacks`

### بکند — نشده

- نقش `coach` و APIهای مربی
- `CoachID` روی Plan/Subscription
- `GET /coaches/:slug`
- `POST /orders/checkout`
- API نوشتن برنامه تمرین/غذا
- محدودیت یک مربی per دانشجو

### فرانت — پیاده‌شده (UI)

- لندینگ برند، auth، پنل user، پنل admin
- اتصال API: auth + admin users

### فرانت — نشده

- پنل `/coach/*`
- لندینگ `/coach/[slug]`
- ثبت‌نام مربی
- middleware محافظت مسیر
- اتصال اکثر صفحات به API

---

## فازبندی پروژه

| فاز | عنوان | مدت تقریبی |
|-----|--------|------------|
| 0 | آماده‌سازی و مستندات | ۱ روز |
| 1 | زیرساخت نقش coach + دیتابیس | ۳–۴ روز |
| 2 | پروفایل مربی + لندینگ عمومی | ۴–۵ روز |
| 3 | پلن مربی + خرید دمو | ۴–۵ روز |
| 4 | دانشجویان مربی + تخصیص برنامه | ۵–۷ روز |
| 5 | اتصال پنل دانشجو + امنیت | ۳–۴ روز |
| 6 | سوپرادمین + پولیش | ۲–۳ روز |

**جمع تقریبی:** ۳–۴ هفته

جزئیات تسک‌ها:
- بکند: [`backend/docs/TASKS.md`](backend/docs/TASKS.md)
- فرانت: [`frontend/docs/TASKS.md`](frontend/docs/TASKS.md)

---

## استک فنی

| لایه | تکنولوژی |
|------|----------|
| Frontend | Next.js 16, React 19, Redux Toolkit, Tailwind 4, Axios, Framer Motion |
| Backend | Go 1.24, Gin, GORM, MySQL, JWT, Swagger |
| Auth | JWT (access 15min + refresh 7d), bcrypt, OTP |
| Deploy | Backend `:8080`, Frontend `:3000` |

---

## متغیرهای محیطی

### Backend

```
PORT=8080
FRONTEND_ORIGIN=http://localhost:3000
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
JWT_SECRET
ACCESS_TOKEN_DURATION_MINUTES=15
REFRESH_TOKEN_DURATION_DAYS=7
```

### Frontend

```
NEXT_PUBLIC_API_BASE_URL=https://api.fitinoo.ir
```

---

## کاربر seed شده (ادمین)

- Email: `admin@gmail.com`
- Phone: `09150000000`
- Password: `12345678`

---

## فایل‌های مستندات

| فایل | محتوا |
|------|-------|
| `PROJECT.md` | این فایل — نمای کلی پروژه |
| `backend/docs/TASKS.md` | تسک‌های بکند به تفکیک فاز |
| `frontend/docs/TASKS.md` | تسک‌های فرانت به تفکیک فاز |
| `backend/docs/API-ENDPOINTS.md` | مستندات API فعلی |
| `frontend/docs/frontend-overview.md` | نمای کلی فرانت |
