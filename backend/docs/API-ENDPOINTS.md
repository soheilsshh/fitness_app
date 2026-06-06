# مستندات API بکند — Morabiyar Multi-Coach

> مرجع معماری: [`PROJECT.md`](../../PROJECT.md)  
> وضعیت: ✅ پیاده‌شده | 🔜 برنامه‌ریزی‌شده | ⚠️ تفاوت با مستندات قدیمی فرانت

---

## نقش‌ها (Roles)

| نقش | مقدار `User.Role` | دسترسی |
|-----|------------------|--------|
| دانشجو | `student` | `/me/*` |
| مربی | `coach` | `/coach/*` |
| سوپرادمین | `admin` | `/admin/*` |

ثابت‌ها در `internal/models/roles.go`: `RoleStudent`, `RoleCoach`, `RoleAdmin`

---

## نگاشت مسیرها — مستندات قدیمی vs پیاده‌سازی فعلی

| مستند قدیمی فرانت | مسیر واقعی بکند | وضعیت |
|-------------------|-----------------|--------|
| `POST /auth/login` | `POST /auth/login/password` | ✅ |
| `POST /auth/send-otp` | `POST /auth/otp/request` | ✅ |
| `POST /auth/verify-otp` | `POST /auth/otp/verify` | ✅ |
| `POST /auth/forgot/verify-otp` + `POST /auth/forgot/reset` | `POST /auth/reset-password` | ✅ |
| `GET /plans/public` | — | 🔜 حذف — پلن‌ها per-coach از `/coaches/:slug/plans` |
| `POST /admin/plans` (ساخت توسط ادمین) | — | 🔜 فقط مربی پلن می‌سازد |

---

## ۱. احراز هویت (Auth)

### عمومی

| متد | Endpoint | وضعیت | توضیح |
|-----|----------|--------|-------|
| POST | `/auth/register` | ✅ | ثبت‌نام دانشجو — `{ name, email, phone, password }` |
| POST | `/auth/register/coach` | ✅ | ثبت‌نام مربی — `{ name, email, phone, password, displayName?, slug? }` |
| POST | `/auth/login/password` | ✅ | `{ identifier, password }` |
| POST | `/auth/otp/request` | ✅ | ارسال OTP |
| POST | `/auth/otp/verify` | ✅ | `{ phone, code }` |
| POST | `/auth/forgot/send-otp` | ✅ | OTP بازیابی رمز |
| POST | `/auth/reset-password` | ✅ | `{ phone, code, new_password }` |

### محافظت‌شده (JWT)

| متد | Endpoint | وضعیت | توضیح |
|-----|----------|--------|-------|
| POST | `/auth/logout` | ✅ | باطل کردن refresh token |
| GET | `/auth/me` | ✅ | پروفایل ساده auth |
| POST | `/auth/change-password` | ✅ | `{ currentPassword, newPassword }` |

---

## ۲. سایت عمومی (Public)

| متد | Endpoint | وضعیت | توضیح |
|-----|----------|--------|-------|
| GET | `/site-settings` | ✅ | تنظیمات لندینگ **برند پلتفرم** |
| POST | `/feedbacks` | ✅ | `{ fullName, email, phone, message }` |
| GET | `/coaches/:slug` | ✅ | پروفایل عمومی مربی (لندینگ — `IsPublished=true`) |
| GET | `/coaches/:slug/plans` | ✅ | پلن‌های فعال یک مربی |
| GET | `/plans/public` | ❌ | **حذف شده** — جایگزین: `/coaches/:slug/plans` |

---

## ۳. پنل دانشجو (`/me/*` — JWT + student)

| متد | Endpoint | وضعیت | توضیح |
|-----|----------|--------|-------|
| GET | `/me` | ✅ | پروفایل کامل |
| PATCH | `/me` | ✅ | به‌روزرسانی پروفایل |
| POST | `/me/change-password` | ✅ | تغییر رمز |
| GET | `/me/orders` | ✅ | لیست سفارش‌ها |
| GET | `/me/orders/:id` | ✅ | جزئیات سفارش |
| GET | `/me/programs` | ✅ | لیست برنامه‌ها (+ `coachName` در فاز بعد) |
| GET | `/me/programs/:id` | ✅ | جزئیات برنامه |
| GET | `/subscriptions/current` | ✅ | اشتراک فعال |
| GET | `/subscriptions` | ✅ | تاریخچه اشتراک |
| GET | `/programs/current` | ✅ | برنامه تمرین/غذای فعلی |

---

## ۴. سفارش و پرداخت (دمو)

| متد | Endpoint | وضعیت | توضیح |
|-----|----------|--------|-------|
| POST | `/orders/checkout` | 🔜 | `{ items: [{ planId, qty }] }` — دمو auto-confirm |
| POST | `/payments/demo/confirm` | 🔜 | تأیید دستی دمو (اختیاری) |

**قوانین checkout:**
- فقط `student`
- هر دانشجو فقط **یک مربی** — اگر `AssignedCoachID` ست باشد → `409 Conflict`
- همه `planId`ها باید متعلق به **یک** مربی باشند
- پس از پرداخت: `Subscription.CoachID` + `User.AssignedCoachID` ست می‌شود

---

## ۵. پنل مربی (`/coach/*` — JWT + coach) ✅ (پروفایل)

### پروفایل

| متد | Endpoint | وضعیت | توضیح |
|-----|----------|--------|-------|
| GET | `/coach/profile` | ✅ | خواندن پروفایل مربی |
| PUT | `/coach/profile` | ✅ | ویرایش پروفایل + slug |
| GET | `/coach/profile/slug/check?slug=` | ✅ | بررسی یکتا بودن slug |
| POST | `/coach/profile/avatar` | ✅ | آپلود آواتار |
| POST | `/coach/profile/cover` | ✅ | آپلود کاور |

### پلن‌ها

| متد | Endpoint | توضیح |
|-----|----------|-------|
| GET | `/coach/plans` | لیست پلن‌های خود مربی |
| POST | `/coach/plans` | ساخت پلن |
| GET | `/coach/plans/:id` | جزئیات |
| PATCH | `/coach/plans/:id` | ویرایش |
| DELETE | `/coach/plans/:id` | حذف |

### دانشجویان

| متد | Endpoint | توضیح |
|-----|----------|-------|
| GET | `/coach/students` | دانشجویان این مربی |
| GET | `/coach/students/:id` | جزئیات دانشجو |
| GET | `/coach/students/:id/programs` | برنامه‌های فعلی |
| POST | `/coach/students/:id/workout-programs` | تخصیص برنامه تمرین |
| PATCH | `/coach/students/:id/workout-programs/:programId` | ویرایش |
| POST | `/coach/students/:id/nutrition-programs` | تخصیص برنامه غذایی |
| PATCH | `/coach/students/:id/nutrition-programs/:programId` | ویرایش |

### داشبورد

| متد | Endpoint | توضیح |
|-----|----------|-------|
| GET | `/coach/dashboard/stats` | آمار دانشجویان و فروش |

---

## ۶. پنل سوپرادمین (`/admin/*` — JWT + admin)

| بخش | Endpointها | وضعیت |
|-----|------------|--------|
| داشبورد | `GET /admin/dashboard/stats`, `GET /admin/dashboard/monthly-sales` | ✅ |
| کاربران | `GET /admin/users`, `GET /admin/users/:id`, programs, body, photos | ✅ |
| شاگردان (همه پلتفرم) | `GET /admin/students`, `GET /admin/students/:id`, `PATCH` | ✅ |
| پلن‌ها (مشاهده) | `GET /admin/plans`, `GET /admin/plans/:id` | ✅ (ساخت/ویرایش → مربی) |
| تنظیمات سایت | `GET/PUT /admin/site-settings`, `POST /admin/site-settings/hero-image` | ✅ |
| فیدبک | `GET /admin/feedbacks` | ✅ |
| مربی‌ها | `GET /admin/coaches`, `GET /admin/coaches/:id`, `PATCH` | 🔜 |

---

## ۷. زیرساخت

| متد | Endpoint | توضیح |
|-----|----------|-------|
| GET | `/uploads/*` | فایل‌های آپلود شده |
| GET | `/swagger/*` | Swagger UI |

---

## مدل‌های داده — تغییرات Multi-Coach

### User
- `Role`: `student` | `coach` | `admin`
- `AssignedCoachID *uint` — مربی فعلی دانشجو (حداکثر یک مربی) 🔜

### CoachProfile (گسترش یافته) 🔜
- `Slug`, `DisplayName`, `Title`, `AvatarURL`, `CoverImageURL`
- `Bio`, `AboutCoach`, `Specialty`
- `ContactPhone`, `Instagram`, `Telegram`, `WhatsApp`, `Website`
- `IsPublished`

### ServicePlan
- `CoachID uint` — مالک پلن 🔜

### Subscription
- `CoachID uint` — مربی مسئول 🔜

### Order
- `CoachID uint` — برای گزارش فروش 🔜

---

## نکات امنیتی

1. همه `/me/*` → JWT + نقش `student` (یا هر نقش لاگین‌شده برای پروفایل خود)
2. همه `/coach/*` → JWT + `CoachOnly` middleware
3. همه `/admin/*` → JWT + `AdminOnly` middleware
4. مربی فقط به دانشجویان و پلن‌های خودش دسترسی دارد
5. لندینگ عمومی مربی: فقط `IsPublished=true`

---

*به‌روزرسانی: فاز ۰ — آماده‌سازی Multi-Coach*
