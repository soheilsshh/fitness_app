## پنل ادمین (`(panel)/admin`)

این داکیومنت روت‌های زیر `/admin` را به همراه رفتار UI و نیازمندی‌های بک‌اند توضیح می‌دهد.

### لایوت پنل ادمین

- **شِل اصلی**: `AdminShell` (`src/app/(panel)/admin/_components/AdminShell.js`)
- **اجزا**:
  - `AdminSidebar`:
    - لینک به:
      - داشبورد (`/admin/dashboard`)
      - کاربران (`/admin/users`)
      - شاگردان (`/admin/students`)
      - پلن‌ها (`/admin/plans`)
      - تنظیمات سایت (`/admin/site`)
      - فیدبک‌ها (`/admin/feedback`)
  - `AdminTopbar`:
    - عنوان بخش فعلی
    - شاید اطلاعات کاربر ادمین / خروج و ...

### روت ایندکس ادمین

- **Route**: `/admin`
- **فایل**: `src/app/(panel)/admin/page.js`
- **رفتار**:
  - `redirect("/admin/dashboard")`

---

## داشبورد ادمین

- **Route**: `/admin/dashboard`
- **فایل**: `src/app/(panel)/admin/dashboard/page.jsx`
- **کامپوننت**: `AdminDashboardClient` (`dashboard/_components/AdminDashboardClient.jsx`)
- **کامپوننت‌های داخلی**:
  - `DashboardShell`
  - `StatsGrid` + `StatCard`
  - `SalesChart` + `YearSelect`
  - داده‌ها از `dashboardData.js` می‌آیند:
    - `getAvailableYears()`
    - `getDashboardStats({ year })`
    - `getMonthlySales({ year })`

### داده فعلی (mock)

- `getDashboardStats`:
  - از `mockStudents` برای محاسبه:
    - `totalUsers`
    - `activeUsers` (بر اساس `status === "active"`)
  - `purchasedCourses` را از:
    - شمارش keyهای localStorage با prefixهای خاص (در کلاینت).
    - اگر در دسترس نباشد، از `totalUsers` استفاده می‌کند.

- `getMonthlySales`:
  - براساس سال، آرایه‌ای از ۱۲ ماه فارسی با فیلدهای:
    - `month: string`
    - `courses: number`
    - `sales: number`
  - اعداد به صورت pseudo-random تعیین می‌شوند تا نمودار پر شود.

### نیازمندی‌های بک‌اند

- Endpointهای پیشنهادی:
  - GET `/admin/dashboard/stats?year=YYYY`
    - خروجی:
      - `year: number`
      - `totalUsers: number`
      - `activeUsers: number`
      - `purchasedCourses: number`
  - GET `/admin/dashboard/monthly-sales?year=YYYY`
    - خروجی:
      - `Array<{ month: string; courses: number; sales: number }>`

- داده‌ها باید از:
  - جدول کاربران / شاگردان
  - جدول سفارش‌ها / پرداخت‌ها
  استخراج شوند.

---

## مدیریت کاربران

### لیست کاربران

- **Route**: `/admin/users`
- **فایل**: `src/app/(panel)/admin/users/page.js`
- **کامپوننت**: `UsersClient` (`users/_components/UsersClient.js`)
- **داده فعلی**:
  - `mockUsers`:
    - `id: string`
    - `firstName: string`
    - `lastName: string`
    - `phone: string`
    - `activeProgram: boolean`
    - `programsCount: number`
    - `ordersCount: number`
    - `createdAt: ISOString`

### رفتار UI

- قابلیت‌ها:
  - **جستجو** با نام/نام‌خانوادگی یا شماره موبایل.
  - **فیلتر** بر اساس وضعیت برنامه فعال (`activeProgram`):
    - همه
    - فقط فعال‌ها
    - فقط غیرفعال‌ها
  - صفحه‌بندی:
    - `page`, `pageSize` و نمایش شماره صفحه فعلی/کل صفحات.
  - کلیک روی هر ردیف کاربر → رفتن به `/admin/users/[id]`.

### نیازمندی‌های بک‌اند

- Endpoint:
  - GET `/admin/users`
    - پارامترها:
      - `page`, `pageSize`
      - `query` (برای نام/موبایل)
      - `status` (`all | active | inactive`)
    - خروجی:
      - `items: User[]`
      - `page`, `pageSize`, `total`

---

### جزئیات کاربر

- **Route**: `/admin/users/[id]`
- **فایل**: `src/app/(panel)/admin/users/[id]/page.js`
- **کامپوننت**: `UserDetailsClient` (`users/[id]/_components/UserDetailsClient.js`)
- **داده mock**:
  - `userProgramsMockByUserId`:
    - `userId -> programs[]` (ساختار `UserProgram` – در overview شرح داده شد).
  - `userBodyMockByUserId`:
    - `userId -> { heightCm, weightKg, photos[] }`

### رفتار UI

- نمایش:
  - اطلاعات پایه کاربر (similar به `mockUsers`).
  - لیست برنامه‌های کاربر (active/ended).
  - وضعیت بدنی (قد، وزن).
  - گالری عکس‌های Body با قابلیت Lightbox (`ImageLightboxModal`).

### نیازمندی‌های بک‌اند

- Endpoint پیشنهادی:
  - GET `/admin/users/:id`
    - خروجی:
      - اطلاعات `User`
      - لیست `UserProgram`های کاربر
      - اطلاعات `UserBody` و عکس‌ها.
  - Endpoints کمکی:
    - GET `/admin/users/:id/programs`
    - GET `/admin/users/:id/body`
    - امکان آپلود و حذف عکس body:
      - POST `/admin/users/:id/body/photos`
      - DELETE `/admin/users/:id/body/photos/:photoId`

---

## مدیریت شاگردان (Students)

### لیست شاگردان

- **Route**: `/admin/students`
- **فایل**: `src/app/(panel)/admin/students/page.js`
- **کامپوننت**: `StudentsClient` (`students/_components/StudentsClient.js`)
- **داده mock**: `mockStudents`:
  - `id: string`
  - `fullName: string`
  - `phone: string`
  - `status: "pending" | "active"`
  - `planTitle: string`
  - `planType: "workout" | "nutrition" | "both"`
  - `weekly: string[]` (روزهای تمرین)
  - `restDays: string[]`

### رفتار UI

- نمایش لیست شاگردان با وضعیت (pending/active)، نام، موبایل و اطلاعات برنامه.
- احتمالاً قابلیت مرتب‌سازی/فیلتر ساده (بسته به کد داخلی).

### نیازمندی‌های بک‌اند

- Endpoint:
  - GET `/admin/students`
    - پارامترهای صفحه‌بندی و فیلتر وضعیت (`status`).
    - خروجی: `items: Student[]`, `page`, `pageSize`, `total`.

---

### جزئیات شاگرد

- **Route**: `/admin/students/[id]`
- **فایل**: `src/app/(panel)/admin/students/[id]/page.js`
- **کامپوننت**: `StudentDetailsClient` (`students/[id]/_components/StudentDetailsClient.js`)
- **داده mock**:
  - `mockStudents` (پایه).
  - ممکن است از فایل `storage.js` برای persist سمت کلاینت استفاده شده باشد.

### رفتار UI

- نمایش:
  - اطلاعات شاگرد (نام، موبایل، وضعیت).
  - جزئیات برنامه فعلی (روزها، نوع برنامه، و ...).
  - امکان اعمال تغییرات (ثبت فعال‌سازی، تنظیم برنامه و غیره – بسته به UI).

### نیازمندی‌های بک‌اند

- Endpoint:
  - GET `/admin/students/:id`
  - PATCH `/admin/students/:id`
    - تغییر وضعیت (`status`) و تنظیم برنامه (`planId` یا مشخصات برنامه).

---

## تنظیمات سایت (Site Settings)

- **Route**: `/admin/site`
- **فایل**: `src/app/(panel)/admin/site/page.jsx`
- **کامپوننت**: `SiteSettingsClient` (`site/_components/SiteSettingsClient.jsx`)
- **داده mock**: `defaultSiteSettings` (`site/_components/siteMock.js`)

### رفتار UI

- فرم چندبخشی شامل:
  - آپلود تصویر هدر (`ImageUploader`) – سمت کلاینت preview می‌شود.
  - ویرایش Feature Bullets (تیتر + لیست موارد).
  - ویرایش Stats (آمار نمایش داده‌شده در لندینگ).
  - ویرایش Cards/Steps (سه کارت «ثبت پیشرفت، تحلیل روند، پایداری نتیجه»).
  - ویرایش اطلاعات تماس (`ContactInfoEditor`).
- روی دکمه ذخیره:
  - فعلاً فقط SweetAlert2 نمایش می‌دهد که «آماده اتصال به API» است؛ هیچ API واقعی صدا زده نمی‌شود.

### نیازمندی‌های بک‌اند

- Endpoint:
  - GET `/admin/site-settings`
  - PUT `/admin/site-settings`
    - ورودی: همان ساختار `defaultSiteSettings`.
  - در صورت ذخیره فایل‌ها (تصاویر):
    - آپلود جداگانه:
      - POST `/admin/uploads` یا `/admin/site-settings/hero-image`
      - خروجی: URL ذخیره‌شده.
    - ذخیره فقط آدرس فایل در `SiteSettings`.

---

## مدیریت پلن‌ها (Plans)

### لیست پلن‌ها

- **Route**: `/admin/plans`
- **فایل**: `src/app/(panel)/admin/plans/page.jsx`
- **کامپوننت**: `PlansClient` (`plans/_components/PlansClient.jsx`)
- **داده mock**: `mockPlans` (`plans/_components/plansMock.js`)

### رفتار UI

- امکانات:
  - جستجو روی `title`, `subtitle`, `courseName`.
  - فیلتر بر اساس:
    - همه
    - تخفیف‌دار (`discounted`)
    - محبوب (`popular`)
  - نمایش لیستی/جدولی با ستون‌های:
    - پلن
    - نام دوره
    - قیمت
    - وضعیت (تخفیف‌دار/محبوب و ...).
  - صفحه‌بندی با کنترل قبلی/بعدی.
  - دکمه «ساخت پلن» که به `/admin/plans/new` می‌رود.

### نیازمندی‌های بک‌اند

- Endpoint:
  - GET `/admin/plans`
    - پارامترها:
      - `page`, `pageSize`
      - `query`
      - `tag` (`all | discounted | popular`)
    - خروجی:
      - `items: Plan[]`, `page`, `pageSize`, `total`.

---

### ساخت پلن جدید

- **Route**: `/admin/plans/new`
- **فایل**: `src/app/(panel)/admin/plans/new/page.jsx`
- **کامپوننت**: `NewPlanClient` (`plans/new/_components/NewPlanClient.jsx`)
- **مدل پایه**: `buildEmptyPlan()` در `planModel.js`
  - مقدار اولیه:
    - `title: ""`
    - `subtitle: ""`
    - `courseName: ""`
    - `featuresText: ""`
    - `planType: "both"`
    - `price: 0`
    - `discountPrice: 0`
    - `durationDays: ""`
    - `discountPercent: 0`
    - `isPopular: false`

### نیازمندی‌های بک‌اند

- Endpoint:
  - POST `/admin/plans`
    - ورودی: مدل کامل پلن (مطابق `Plan` در overview).
    - خروجی: پلن ایجادشده با `id` و timestamps.

---

### جزئیات پلن

- **Route**: `/admin/plans/[id]`
- **فایل**: `src/app/(panel)/admin/plans/[id]/page.jsx`
- **کامپوننت**: `PlanDetailsClient` (`plans/[id]/_components/PlanDetailsClient.jsx`)

### رفتار UI

- نمایش جزئیات کامل پلن:
  - تیتر، ساب‌تیتر، نام دوره، قیمت، تخفیف، محبوب‌بودن و...
  - امکان ویرایش و ذخیره تغییرات (بسته به UI).

### نیازمندی‌های بک‌اند

- Endpoint:
  - GET `/admin/plans/:id`
  - PATCH `/admin/plans/:id`
  - DELETE `/admin/plans/:id` (در صورت پشتیبانی حذف).

---

## مدیریت فیدبک‌ها

- **Route**: `/admin/feedback`
- **فایل**: `src/app/(panel)/admin/feedback/page.jsx`
- **کامپوننت**: `FeedbackClient` (`feedback/_components/FeedbackClient.jsx`)
- **داده mock**: `mockFeedbacks`:
  - `id: string`
  - `fullName: string`
  - `email: string`
  - `phone: string`
  - `message: string`
  - `createdAt: ISOString`

### رفتار UI

- لیست فیدبک‌ها (`FeedbackList`) با:
  - صفحه‌بندی ساده (`PaginationBar`).
  - تعداد کل پیام‌ها (نمایش در هدر).
  - کلیک روی یک فیدبک → باز کردن مودال (`FeedbackDetailsModal`) و نمایش جزئیات.

### نیازمندی‌های بک‌اند

- Endpoint:
  - GET `/admin/feedbacks`
    - پارامترها: `page`, `pageSize`.
    - خروجی: `items: Feedback[]`, `page`, `pageSize`, `total`.

- فرانت در بخش عمومی (مثلاً `ContactSection`) می‌تواند فرم ارسال فیدبک داشته باشد:
  - POST `/feedbacks`
    - ورودی: `{ fullName, email, phone, message }`
    - خروجی: success / error.

---

## ملاحظات امنیتی و سطوح دسترسی

- تمام روت‌های `/admin/*` باید صرفاً برای کاربران با نقش **ادمین** قابل دسترسی باشند.
- پیشنهاد در بک‌اند:
  - JWT شامل `role: "admin" | "user" | ...`.
  - میدل‌ویر مشترک:
    - احراز هویت (بررسی توکن).
    - بررسی `role` برای endpointهای `/admin/*`.
- در API:
  - تمام endpointهای `GET/POST/PATCH/DELETE /admin/...` باید به نقش‌های مجاز محدود شوند.

