# تسک‌های فرانت‌اند — Morabiyar Multi-Coach

> مرجع: [`PROJECT.md`](../../PROJECT.md)  
> هر تسک با `[ ]` شروع شده — پس از انجام به `[x]` تغییر دهید.

---

## فاز ۰ — آماده‌سازی

### TASK-F0-01: ساختار پوشه پنل مربی
- [x] ایجاد `src/app/(panel)/coach/` با زیرپوشه‌ها
- [x] `layout.js`, `page.js` (redirect به dashboard)
- [x] `_components/CoachShell.js`, `CoachSidebar.js`, `CoachTopbar.js`
- **الگو:** کپی از `admin/_components/AdminShell.js`

### TASK-F0-02: ثابت‌های نقش و مسیرها
- [x] فایل `src/lib/auth/roles.js` — `ROLES`, `getDashboardPath(role)`
- [x] استفاده در LoginForm, RegisterForm
- **فایل جدید:** `src/lib/auth/roles.js`

### TASK-F0-03: به‌روزرسانی مستندات فرانت
- [x] `frontend-overview.md` — اضافه کردن پنل coach و مسیرهای جدید
- **فایل:** `frontend/docs/frontend-overview.md`

---

## فاز ۱ — زیرساخت نقش Coach + ریدایرکت ✅

### TASK-F1-01: Middleware محافظت مسیر
- [x] ایجاد `src/middleware.js`
- [x] `/admin/*` → فقط `role=admin`
- [x] `/coach/*` → فقط `role=coach` (فقط پنل، نه لندینگ عمومی)
- [x] `/user/*` → فقط `role=student`
- [x] بدون token → redirect `/auth/login`
- [x] نقش اشتباه → redirect به dashboard نقش خودش
- **نکته:** خواندن role از cookie یا decode JWT (یا endpoint `/auth/me`)

### TASK-F1-02: ذخیره نقش در Cookie
- [x] پس از login، `user_role` در cookie هم ست شود (برای middleware)
- [x] یا استفاده از `access_token` decode در edge
- **فایل:** `auth/login/_components/LoginForm.js`, `auth/register/_components/RegisterForm.js`

### TASK-F1-03: ریدایرکت لاگین بر اساس نقش
- [x] `admin` → `/admin/dashboard`
- [x] `coach` → `/coach/dashboard`
- [x] `student` → `/user/my-programs`
- **فایل:** `LoginForm.js`, `RegisterForm.js`

### TASK-F1-04: صفحه ثبت‌نام مربی
- [x] Route: `/auth/register/coach`
- [x] فرم: name, phone, email, password, displayName, slug (اختیاری)
- [x] `POST /auth/register/coach`
- [x] پس از موفقیت → `/coach/profile` (تکمیل پروفایل)
- **فایل جدید:** `src/app/(site)/auth/register/coach/page.js`

### TASK-F1-05: لینک ثبت‌نام مربی در Navbar
- [x] دکمه «ثبت‌نام مربی» در Navbar یا Footer
- **فایل:** `src/app/(site)/_components/Navbar.js`

### TASK-F1-06: Layout پنل مربی (خالی)
- [x] `CoachShell` با Sidebar و Topbar
- [x] آیتم‌های nav اولیه: داشبورد، پروفایل
- [x] صفحه placeholder `/coach/dashboard`
- **فایل‌ها:** `(panel)/coach/layout.js`, `_components/*`

### TASK-F1-07: Logout واقعی
- [x] `POST /auth/logout` + پاک کردن localStorage و cookie
- [x] redirect به `/auth/login`
- [x] در هر سه پنل: user, coach, admin
- **فایل‌ها:** `Sidebar.js`, `AdminSidebar.js`, `CoachSidebar.js`

---

## فاز ۲ — پروفایل مربی + لندینگ عمومی ✅

### TASK-F2-01: صفحه ویرایش پروفایل مربی
- [x] Route: `/coach/profile`
- [x] فرم: displayName, slug, title, bio, about, specialty, phone, instagram, telegram, whatsapp, website
- [x] toggle `isPublished`
- [x] `GET /coach/profile` + `PUT /coach/profile`
- [x] نمایش لینک عمومی: `/coach/{slug}` با دکمه کپی
- **فایل جدید:** `src/app/(panel)/coach/profile/page.jsx`

### TASK-F2-02: آپلود آواتار و کاور
- [x] کامپوننت `ImageUploader` — avatar + cover
- [x] `POST /coach/profile/avatar`, `POST /coach/profile/cover`
- [x] پیش‌نمایش تصویر
- **فایل:** `coach/profile/_components/ProfileForm.jsx`

### TASK-F2-03: بررسی یکتا بودن Slug
- [x] debounced call به `GET /coach/profile/slug/check?slug=`
- [x] نمایش tick/error کنار input
- **فایل:** `ProfileForm.jsx`

### TASK-F2-04: لندینگ عمومی مربی
- [x] Route: `/coach/[slug]` در `(site)` — **بدون** layout پنل
- [x] `GET /coaches/:slug` + `GET /coaches/:slug/plans`
- [x] سکشن‌ها: Hero (cover+avatar), About, Plans, Contact/Social
- [ ] دکمه «خرید» روی هر پلن → addToCart (فاز ۳)
- **فایل جدید:** `src/app/(site)/coach/[slug]/page.js`

### TASK-F2-05: کامپوننت‌های لندینگ مربی
- [x] لندینگ یکپارچه در `CoachLandingClient.jsx`
- [x] طراحی هماهنگ با تم تیره FitPro
- **فایل:** `src/app/(site)/coach/[slug]/_components/*`

### TASK-F2-06: حالت 404 لندینگ مربی
- [x] slug نامعتبر یا unpublished → صفحه «مربی یافت نشد»
- **فایل:** `coach/[slug]/page.js`

### TASK-F2-07: پیش‌نمایش پروفایل از پنل مربی
- [x] دکمه «پیش‌نمایش» → باز کردن `/coach/{slug}` در تب جدید
- **فایل:** `coach/profile/page.jsx`

---

## فاز ۳ — پلن مربی + خرید دمو ✅

### TASK-F3-01: صفحه لیست پلن‌های مربی
- [x] Route: `/coach/plans`
- [x] `GET /coach/plans` با pagination
- [x] دکمه «پلن جدید»
- **فایل جدید:** `src/app/(panel)/coach/plans/page.jsx`

### TASK-F3-02: ساخت پلن جدید
- [x] Route: `/coach/plans/new`
- [x] فرم مطابق `PlanForm` ادمین
- [x] `POST /coach/plans`
- **فایل:** `coach/plans/new/page.jsx`, `_components/PlanForm.jsx`

### TASK-F3-03: ویرایش و حذف پلن
- [x] Route: `/coach/plans/[id]`
- [x] `GET/PATCH/DELETE /coach/plans/:id`
- **فایل:** `coach/plans/[id]/page.jsx`

### TASK-F3-04: به‌روزرسانی Cart Slice
- [x] اضافه: `coachId`, `planId` به آیتم سبد
- [x] validation: همه آیتم‌ها از یک coach
- [x] جلوگیری از افزودن پلن coach دیگر
- **فایل:** `src/store/slices/cartSlice.js`

### TASK-F3-05: به‌روزرسانی CartDrawer
- [x] نمایش نام مربی در سبد
- [x] پیام خطا اگر coach متفاوت
- **فایل:** `src/app/(site)/_components/CartDrawer.js`

### TASK-F3-06: صفحه Payment — اتصال API
- [x] `POST /orders/checkout` با items از cart
- [x] handle خطای 409 (قبلاً مربی دارد)
- [x] redirect به `/payment/bank?orderId=...`
- **فایل:** `src/app/(site)/payment/page.js`

### TASK-F3-07: صفحه Payment Bank (دمو)
- [x] نمایش جزئیات سفارش
- [x] دکمه «پرداخت موفق (دمو)» — confirm
- [x] redirect به `/user/orders/[id]`
- **فایل:** `src/app/(site)/payment/bank/page.js`

### TASK-F3-08: Sidebar مربی — آیتم پلن‌ها
- [x] اضافه `{ href: "/coach/plans", label: "پلن‌ها" }`
- **فایل:** `CoachSidebar.js`

### TASK-F3-09: حذف وابستگی localStorage از admin plans
- [x] `plansStore.js` فقط برای coach استفاده نشود — API واقعی
- [x] admin plans: فقط مشاهده (فاز ۶)
- **فایل:** `(panel)/admin/plans/*`

---

## فاز ۴ — دانشجویان مربی + تخصیص برنامه

### TASK-F4-01: لیست دانشجویان مربی
- [ ] Route: `/coach/students`
- [ ] `GET /coach/students` — جایگزین mock ادمین
- [ ] فیلتر status، pagination
- **فایل جدید:** `src/app/(panel)/coach/students/page.js`

### TASK-F4-02: جزئیات دانشجو
- [ ] Route: `/coach/students/[id]`
- [ ] `GET /coach/students/:id`
- [ ] نمایش: پروفایل، اشتراک، وضعیت بدنی
- **فایل:** `coach/students/[id]/page.js`

### TASK-F4-03: ویرایشگر برنامه تمرین
- [ ] Route: `/coach/students/[id]/workout`
- [ ] فرم هفتگی/روزانه با exercises
- [ ] `POST/PATCH /coach/students/:id/workout-programs`
- **فایل جدید:** `coach/students/[id]/workout/page.jsx`

### TASK-F4-04: ویرایشگر برنامه غذایی
- [ ] Route: `/coach/students/[id]/nutrition`
- [ ] فرم وعده‌ها و ماکروها
- [ ] `POST/PATCH /coach/students/:id/nutrition-programs`
- **فایل جدید:** `coach/students/[id]/nutrition/page.jsx`

### TASK-F4-05: Sidebar مربی — دانشجویان
- [ ] `{ href: "/coach/students", label: "دانشجویان من" }`
- **فایل:** `CoachSidebar.js`

### TASK-F4-06: داشبورد مربی
- [ ] Route: `/coach/dashboard`
- [ ] `GET /coach/dashboard/stats`
- [ ] کارت‌ها: تعداد دانشجویان، اشتراک فعال، فروش
- **فایل:** `coach/dashboard/page.jsx`

### TASK-F4-07: انتقال «شاگردهای من» از ادمین
- [ ] در `AdminSidebar` برچسب را به «همه شاگردان» تغییر بده
- [ ] منطق لیست از API ادمین (همه پلتفرم)
- **فایل:** `AdminSidebar.js`, `admin/students/*`

---

## فاز ۵ — اتصال پنل دانشجو + امنیت

### TASK-F5-01: My Programs — API واقعی
- [ ] حذف `mock.js`
- [ ] `GET /me/programs`
- [ ] نمایش نام مربی
- **فایل:** `user/my-programs/_components/MyProgramsClient.js`

### TASK-F5-02: Program Details — API واقعی
- [ ] `GET /me/programs/:id`
- [ ] نمایش schedule / planByDay
- **فایل:** `user/my-programs/[id]/page.js`

### TASK-F5-03: Orders — API واقعی
- [ ] `GET /me/orders`, `GET /me/orders/:id`
- [ ] حذف `ordersMock.js`
- **فایل:** `user/orders/*`

### TASK-F5-04: Profile — API واقعی
- [ ] `GET/PATCH /me`
- [ ] `POST /me/change-password`
- [ ] حذف داده hardcode
- **فایل:** `user/profile/*`

### TASK-F5-05: Navbar هوشمند
- [ ] اگر لاگین: نمایش نام + لینک پنل + خروج
- [ ] مخفی کردن login/register
- **فایل:** `Navbar.js`

### TASK-F5-06: جلوگیری از خرید مجدد
- [ ] اگر student قبلاً `assignedCoachId` دارد → مخفی کردن دکمه خرید در لندینگ coach دیگر
- [ ] یا نمایش پیام «شما زیر نظر مربی X هستید»
- **فایل:** `coach/[slug]/_components/CoachPlans.js`

### TASK-F5-07: Site Settings — API (لندینگ برند)
- [ ] `GET /site-settings` در لندینگ `/`
- [ ] جایگزینی داده ثابت Hero, Stats, Contact
- **فایل:** `(site)/page.js`, `_components/*`

### TASK-F5-08: Contact Form — API
- [ ] `POST /feedbacks` در ContactSection
- **فایل:** `ContactSection.js`

---

## فاز ۶ — سوپرادمین + پولیش

### TASK-F6-01: صفحه مدیریت مربی‌ها (ادمین)
- [ ] Route: `/admin/coaches`
- [ ] `GET /admin/coaches`
- [ ] لیست با جستجو و pagination
- **فایل جدید:** `src/app/(panel)/admin/coaches/page.js`

### TASK-F6-02: جزئیات مربی در ادمین
- [ ] Route: `/admin/coaches/[id]`
- [ ] `GET /admin/coaches/:id`
- [ ] toggle فعال/غیرفعال
- **فایل:** `admin/coaches/[id]/page.js`

### TASK-F6-03: Sidebar ادمین — مربی‌ها
- [ ] `{ href: "/admin/coaches", label: "مربی‌ها" }`
- **فایل:** `AdminSidebar.js`

### TASK-F6-04: Admin Dashboard — API
- [ ] اتصال `GET /admin/dashboard/stats` و `monthly-sales`
- [ ] حذف `dashboardData.js` mock
- **فایل:** `admin/dashboard/_components/AdminDashboardClient.jsx`

### TASK-F6-05: Admin Plans — فقط مشاهده
- [ ] `GET /admin/plans` — نمایش همه پلن‌ها با نام مربی
- [ ] حذف/create/edit از UI ادمین (یا readonly)
- **فایل:** `admin/plans/*`

### TASK-F6-06: Admin Site Settings — API
- [ ] `GET/PUT /admin/site-settings`
- [ ] آپلود hero image
- **فایل:** `admin/site/*`

### TASK-F6-07: Admin Feedback — API
- [ ] `GET /admin/feedbacks`
- [ ] حذف `feedbackMock.js`
- **فایل:** `admin/feedback/*`

### TASK-F6-08: رفع Navbar دوبل در لندینگ
- [ ] حذف Navbar تکراری از `(site)/page.js`
- **فایل:** `(site)/page.js`

### TASK-F6-09: لندینگ برند — بدون پلن سراسری
- [ ] `ProgramsSection`: یا حذف پلن‌ها یا «مربی‌های برتر» با لینک به `/coach/[slug]`
- [ ] تمرکز روی معرفی برند، نه فروش مستقیم
- **فایل:** `ProgramsSection.js`

### TASK-F6-10: صفحه لیست مربی‌ها (اختیاری)
- [ ] Route: `/coaches` — لیست مربی‌های published
- [ ] نیاز: `GET /coaches` در بکند (تسک اضافی)
- **فایل جدید:** `src/app/(site)/coaches/page.js`

---

## چک‌لیست نهایی فرانت

- [ ] همه پنل‌ها با middleware محافظت می‌شوند
- [ ] Logout در همه پنل‌ها کار می‌کند
- [ ] پنل coach کامل و مستقل از admin است
- [ ] لندینگ `/coach/[slug]` بدون نیاز به لاگین کار می‌کند
- [ ] جریان خرید دمو end-to-end تست شده
- [ ] پنل student به API متصل است
- [ ] لندینگ برند `/` از site-settings می‌خواند
- [ ] مستندات `frontend-overview.md` به‌روز است

---

## وابستگی بین تسک‌ها

```
F0-* → F1-* → F2-* → F3-* → F4-* → F5-* → F6-*
              ↓
         F1-01 (middleware) قبل از همه پنل‌ها
         F2-04 (لندینگ coach) قبل از F3-06 (خرید)
         F3-06 (checkout) قبل از F4-01 (students پر می‌شود)
         F4-03/04 (برنامه) قبل از F5-01/02 (student view)
```

## وابستگی به بکند

| تسک فرانت | نیازمند تسک بکند |
|-----------|------------------|
| F1-04 | B1-08 |
| F2-01 تا F2-07 | B2-* |
| F3-01 تا F3-07 | B3-* |
| F4-01 تا F4-06 | B4-* |
| F5-01 تا F5-04 | B4-06, B3-07 |
| F6-01, F6-02 | B6-01 |
