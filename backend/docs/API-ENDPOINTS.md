# مستندات API بکند — بر اساس تحلیل فرانت‌اند

این فایل بر اساس تحلیل مستندات فرانت (`frontend/docs`) تهیه شده و تمام endpointهای مورد نیاز برای درست کردن بکند را فهرست می‌کند.

---

## خلاصه تحلیل مستندات فرانت

- **استک فرانت:** Next.js 16، React 19، Redux، Tailwind، Axios با `NEXT_PUBLIC_API_BASE_URL`
- **بخش‌ها:** سایت عمومی، احراز هویت، پرداخت، پنل کاربر، پنل ادمین
- **وضعیت فعلی:** همه داده‌ها mock هستند؛ بکند باید همین endpointها را پیاده کند تا فرانت به API متصل شود.

---

## ۱. احراز هویت (Auth)

| متد   | Endpoint                  | توضیح |
|-------|---------------------------|--------|
| POST  | `/auth/login`             | ورود با `{ phoneOrEmail, password?, otp? }` → خروجی: `{ user, accessToken, refreshToken? }` |
| POST  | `/auth/register`          | ثبت‌نام با اطلاعات کاربر + رمز → کاربر + توکن (در صورت لاگین خودکار بعد از ثبت‌نام) |
| POST  | `/auth/send-otp`          | ارسال OTP به موبایل (در صورت استفاده از OTP) |
| POST  | `/auth/verify-otp`        | تأیید OTP |
| POST  | `/auth/forgot/send-otp`   | ارسال OTP برای فراموشی رمز |
| POST  | `/auth/forgot/verify-otp` | تأیید OTP فراموشی رمز |
| POST  | `/auth/forgot/reset`      | ست کردن رمز جدید بعد از تأیید |

**جایگزین (در صورت استفاده از لینک ایمیل به‌جای OTP):**
- POST `/auth/forgot` → ارسال لینک حاوی توکن
- POST `/auth/reset` → ست کردن رمز جدید با توکن

---

## ۲. سایت عمومی (Public)

| متد  | Endpoint           | توضیح |
|------|--------------------|--------|
| GET  | `/site-settings`   | خواندن تنظیمات صفحه اصلی (فیچرها، آمار، استپ‌ها، اطلاعات تماس، تصویر هدر) برای لندینگ |
| GET  | `/plans/public`    | لیست پلن‌های قابل‌خرید برای نمایش در لندینگ و سبد خرید |
| POST | `/feedbacks`       | ارسال فیدبک از فرم تماس؛ ورودی: `{ fullName, email, phone, message }` |

**اختیاری:** GET `/site-metrics` فقط برای آمار اگر جدا از site-settings پیاده شود.

---

## ۳. پنل کاربر (با توکن – پیشوند `/me`)

| متد   | Endpoint                 | توضیح |
|-------|--------------------------|--------|
| GET   | `/me`                    | پروفایل کاربر جاری |
| PATCH | `/me`                    | به‌روزرسانی پروفایل (نام، موبایل و ...) |
| POST  | `/me/change-password`    | تغییر رمز؛ بدنه: `{ currentPassword, newPassword }` |
| GET   | `/me/orders`             | لیست سفارش‌های کاربر؛ query: `page`, `pageSize`, `status` → خروجی: `{ items, page, pageSize, total }` |
| GET   | `/me/orders/:id`         | جزئیات یک سفارش |
| GET   | `/me/programs`           | لیست برنامه‌های کاربر (فعال/پایان‌یافته) |
| GET   | `/me/programs/:id`       | جزئیات یک برنامه (شامل schedule و planByDay) |

---

## ۴. سفارش و پرداخت

| متد  | Endpoint            | توضیح |
|------|---------------------|--------|
| POST | `/orders/checkout`  | ساخت پیش‌فاکتور/سفارش؛ ورودی: `items: [{ planId, qty }]` (+ اختیاری: کوپن تخفیف). خروجی: `orderId`, `amount`, `paymentGatewayUrl?` |

**Callback درگاه:** بعد از بازگشت از بانک، بکند وضعیت پرداخت را استعلام و سفارش را به `paid` یا `failed` به‌روزرسانی می‌کند؛ فرانت کاربر را به مثلاً `/user/orders/[id]` هدایت می‌کند.

---

## ۵. پنل ادمین – داشبورد

| متد | Endpoint                                | توضیح |
|-----|-----------------------------------------|--------|
| GET | `/admin/dashboard/stats?year=YYYY`      | خروجی: `year`, `totalUsers`, `activeUsers`, `purchasedCourses` |
| GET | `/admin/dashboard/monthly-sales?year=YYYY` | خروجی: آرایه `{ month, courses, sales }` برای ۱۲ ماه |

---

## ۶. پنل ادمین – کاربران

| متد    | Endpoint                                  | توضیح |
|--------|-------------------------------------------|--------|
| GET    | `/admin/users`                            | لیست کاربران؛ query: `page`, `pageSize`, `query`, `status` (all \| active \| inactive) → `{ items, page, pageSize, total }` |
| GET    | `/admin/users/:id`                        | جزئیات کاربر + برنامه‌ها + وضعیت بدنی + عکس‌ها (یا با endpointهای جدا زیر) |
| GET    | `/admin/users/:id/programs`               | *(اختیاری)* اگر در پاسخ `/admin/users/:id` نباشد |
| GET    | `/admin/users/:id/body`                   | *(اختیاری)* اگر در پاسخ `/admin/users/:id` نباشد |
| POST   | `/admin/users/:id/body/photos`            | آپلود عکس body |
| DELETE | `/admin/users/:id/body/photos/:photoId`   | حذف عکس body |

---

## ۷. پنل ادمین – شاگردان

| متد   | Endpoint               | توضیح |
|-------|------------------------|--------|
| GET   | `/admin/students`      | لیست شاگردان؛ query: `page`, `pageSize`, `status` → `{ items, page, pageSize, total }` |
| GET   | `/admin/students/:id`   | جزئیات یک شاگرد |
| PATCH | `/admin/students/:id`  | به‌روزرسانی وضعیت و برنامه (`status`, `planId` و ...) |

---

## ۸. پنل ادمین – تنظیمات سایت

| متد  | Endpoint                                      | توضیح |
|------|-----------------------------------------------|--------|
| GET  | `/admin/site-settings`                        | خواندن تنظیمات (همان ساختار ادمین) |
| PUT  | `/admin/site-settings`                        | ذخیره تنظیمات (featureBullets, stats, steps, contactInfo و ...) |
| POST | `/admin/uploads` یا `/admin/site-settings/hero-image` | آپلود تصویر هدر؛ خروجی: URL ذخیره‌شده برای قرار دادن در SiteSettings |

---

## ۹. پنل ادمین – پلن‌ها

| متد    | Endpoint              | توضیح |
|--------|-----------------------|--------|
| GET    | `/admin/plans`         | لیست پلن‌ها؛ query: `page`, `pageSize`, `query`, `tag` (all \| discounted \| popular) → `{ items, page, pageSize, total }` |
| POST   | `/admin/plans`        | ساخت پلن جدید؛ بدنه مطابق مدل Plan |
| GET    | `/admin/plans/:id`    | جزئیات یک پلن |
| PATCH  | `/admin/plans/:id`    | ویرایش پلن |
| DELETE | `/admin/plans/:id`    | حذف پلن (در صورت پشتیبانی در UI) |

---

## ۱۰. پنل ادمین – فیدبک

| متد | Endpoint             | توضیح |
|-----|----------------------|--------|
| GET | `/admin/feedbacks`   | لیست فیدبک‌ها؛ query: `page`, `pageSize` → `{ items, page, pageSize, total }` |

---

## ۱۱. الگوی برنامه (برای ادمین / ساخت برنامه)

| متد | Endpoint                          | توضیح |
|-----|-----------------------------------|--------|
| GET | `/program-templates` یا `/programs/templates` | لیست الگوهای برنامه (برای ادمین و ساخت برنامه کاربران) |

---

## نکات مهم برای پیاده‌سازی بکند

1. **احراز هویت:** همه endpointهای `/me/*` و `/admin/*` باید با JWT (یا سشن) چک شوند؛ نقش `admin` فقط برای `/admin/*`.
2. **مدل‌های داده:** طبق همان مدل‌های overview (Plan, Order, User, UserProgram, UserBody, Student, Program Template, Site Settings, Feedback) طراحی شوند تا با فرانت یکسان باشند.
3. **سایت عمومی:** `GET /site-settings` و `GET /plans/public` بدون لاگین؛ بقیه ادمین و کاربر پشت احراز هویت.
4. **پرداخت:** بعد از `POST /orders/checkout` فرانت به `paymentGatewayUrl` ریدایرکت می‌کند؛ بکند باید callback بانک را پیاده و وضعیت سفارش را به‌روز کند.

---

## مدل‌های داده (خلاصه از overview فرانت)

- **Plan:** id, title, subtitle, courseName, featuresText, planType, price, discountPrice, discountPercent, isPopular, createdAt, updatedAt
- **Order:** id, createdAt, status (paid|pending|failed|refunded), paymentMethod, trackingCode, items[], discountPercent, note
- **User:** id, firstName, lastName, phone, activeProgram, programsCount, ordersCount, createdAt
- **UserProgram:** userId, programs[] (id, title, type, status, startDate, durationDays, remainingDays, price)
- **UserBody:** userId, heightCm, weightKg, photos[]
- **Student:** id, fullName, phone, status, planTitle, planType, weekly[], restDays[]
- **Program Template:** id, title, goal, level, startDate, durationDays, coach, tags[], schedule, planByDay
- **Site Settings:** heroImage, featureBullets, stats, steps, contactInfo
- **Feedback:** id, fullName, email, phone, message, createdAt

---

*منبع: تحلیل `frontend/docs/frontend-overview.md`, `frontend-pages-site.md`, `frontend-pages-user-panel.md`, `frontend-pages-admin-panel.md`*
