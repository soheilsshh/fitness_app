# تسک‌های بکند — Morabiyar Multi-Coach

> مرجع: [`PROJECT.md`](../../PROJECT.md)  
> هر تسک با `[ ]` شروع شده — پس از انجام به `[x]` تغییر دهید.

---

## فاز ۰ — آماده‌سازی

### TASK-B0-01: به‌روزرسانی مستندات API
- [x] فایل `API-ENDPOINTS.md` را با endpointهای جدید مربی به‌روز کن
- [x] تفاوت مسیرهای فعلی و هدف را مستند کن
- **خروجی:** `backend/docs/API-ENDPOINTS.md` به‌روز

### TASK-B0-02: تعریف ثابت‌های نقش
- [x] در `internal/models` یا `internal/auth` ثابت‌های `RoleStudent`, `RoleCoach`, `RoleAdmin` تعریف کن
- [x] جایگزینی رشته‌های hardcode در middleware و سرویس‌ها
- **فایل‌ها:** `internal/models/roles.go`, `internal/middleware/admin.go`

---

## فاز ۱ — زیرساخت نقش Coach + دیتابیس ✅

### TASK-B1-01: Migration — فیلد AssignedCoachID روی User
- [x] فیلد `AssignedCoachID *uint` با index به `User` اضافه کن
- [x] در `config/database.go` migrate شود
- **فایل:** `internal/models/user.go`

### TASK-B1-02: Migration — گسترش CoachProfile
- [x] فیلدهای جدید: `Slug`, `DisplayName`, `Title`, `AvatarURL`, `CoverImageURL`, `Instagram`, `WhatsApp`, `Website`, `IsPublished`
- [x] `Slug` unique index
- [x] `TelegramID` → `Telegram` (rename یا alias)
- **فایل:** `internal/models/coach_profile.go`

### TASK-B1-03: Migration — CoachID روی ServicePlan
- [x] فیلد `CoachID uint` با index و NOT NULL (پلن‌های موجود: assign به admin یا migration script)
- **فایل:** `internal/models/service_plan.go`

### TASK-B1-04: Migration — CoachID روی Subscription
- [x] فیلد `CoachID uint` با index
- **فایل:** `internal/models/subscription.go`

### TASK-B1-05: Migration — CoachID روی Order (اختیاری)
- [x] فیلد `CoachID uint` برای گزارش فروش
- **فایل:** `internal/models/order.go`

### TASK-B1-06: CoachProfile Repository
- [x] `CoachProfileRepository` با متدهای: `FindByUserID`, `FindBySlug`, `Create`, `Update`, `SlugExists`
- **فایل جدید:** `internal/repository/coach_profile_repository.go`

### TASK-B1-07: Middleware CoachOnly
- [x] `CoachOnly()` مشابه `AdminOnly` — بررسی `role == "coach"`
- [x] ترکیب با `AuthMiddleware`
- **فایل جدید:** `internal/middleware/coach.go`

### TASK-B1-08: ثبت‌نام مربی
- [x] `POST /auth/register/coach` — `{ name, email, phone, password, displayName?, slug? }`
- [x] ایجاد `User` با `role=coach`
- [x] ایجاد `CoachProfile` خالی یا با slug پیش‌فرض
- [x] برگرداندن JWT
- **فایل‌ها:** `internal/service/auth_service.go`, `internal/controllers/auth_controller.go`, `cmd/main.go`

### TASK-B1-09: به‌روزرسانی seed و validation نقش
- [x] اطمینان از seed admin بدون تغییر
- [x] validation نقش در JWT claims
- **فایل:** `config/database.go`, `internal/auth/jwt.go`

---

## فاز ۲ — پروفایل مربی + API عمومی ✅

### TASK-B2-01: CoachProfile Service
- [x] `GetProfile(ctx, coachUserID)`
- [x] `UpdateProfile(ctx, coachUserID, req)`
- [x] `CheckSlugAvailable(ctx, slug, excludeUserID)`
- [x] تولید slug خودکار از نام در صورت خالی بودن
- **فایل جدید:** `internal/service/coach_profile_service.go`

### TASK-B2-02: آپلود آواتار و کاور
- [x] `POST /coach/profile/avatar` — multipart
- [x] `POST /coach/profile/cover` — multipart
- [x] ذخیره در `./uploads/coaches/{userId}/`
- [x] برگرداندن URL
- **فایل:** `internal/controllers/coach_profile_controller.go`

### TASK-B2-03: API پروفایل مربی (محافظت‌شده)
- [x] `GET /coach/profile` — JWT + CoachOnly
- [x] `PUT /coach/profile` — ویرایش همه فیلدها + slug
- [x] `GET /coach/profile/slug/check?slug=` — بررسی یکتا بودن
- **فایل:** `internal/controllers/coach_profile_controller.go`, `cmd/main.go`

### TASK-B2-04: API عمومی لندینگ مربی
- [x] `GET /coaches/:slug` — پروفایل منتشرشده (`IsPublished=true`)
- [x] `GET /coaches/:slug/plans` — پلن‌های فعال آن مربی
- [x] 404 اگر slug نامعتبر یا unpublished
- **فایل جدید:** `internal/controllers/public_coach_controller.go`

### TASK-B2-05: DTOهای پاسخ عمومی
- [x] `PublicCoachDTO`: displayName, title, bio, about, specialty, avatar, cover, social, plans[]
- [x] `PublicPlanDTO`: id, name, subtitle, type, price, discount, durationDays, isPopular
- **فایل:** `internal/service/coach_profile_service.go`

---

## فاز ۳ — پلن مربی + خرید دمو ✅

### TASK-B3-01: Coach Plan Service
- [x] CRUD پلن با فیلتر `WHERE coach_id = currentCoachID`
- [x] جداسازی از `admin_plan_service` یا refactor مشترک
- **فایل جدید:** `internal/service/coach_plan_service.go`

### TASK-B3-02: API پلن مربی
- [x] `GET /coach/plans` — لیست با pagination
- [x] `POST /coach/plans` — ساخت
- [x] `GET /coach/plans/:id`
- [x] `PATCH /coach/plans/:id`
- [x] `DELETE /coach/plans/:id`
- [x] همه با CoachOnly + مالکیت
- **فایل جدید:** `internal/controllers/coach_plan_controller.go`

### TASK-B3-03: Refactor Admin Plans
- [x] `/admin/plans` — نمایش **همه** پلن‌های پلتفرم (شامل coach_id)
- [x] ادمین نمی‌تواند پلن بسازد (یا فقط مشاهده) — طبق تصمیم super-admin
- **فایل:** `internal/service/admin_plan_service.go`

### TASK-B3-04: Checkout Service (دمو)
- [x] `POST /orders/checkout` — `{ items: [{ planId, qty }] }`
- [x] validation: کاربر `student` باشد
- [x] validation: `AssignedCoachID` خالی باشد (یک مربی per دانشجو)
- [x] validation: همه planIdها متعلق به **یک** coach باشند
- [x] ایجاد `Order` با status=`pending`
- [x] **دمو:** بلافاصله status=`paid`, `PaidAt=now`
- [x] ایجاد `Subscription` با `CoachID` از پلن
- [x] ست کردن `User.AssignedCoachID`
- [x] پاسخ: `{ orderId, trackingCode, paymentGatewayUrl: "/payment/bank?orderId=..." }`
- **فایل جدید:** `internal/service/checkout_service.go`

### TASK-B3-05: Checkout Controller
- [x] `POST /orders/checkout` — JWT + student
- [x] `GET /orders/:id/status` — وضعیت سفارش (اختیاری)
- **فایل جدید:** `internal/controllers/checkout_controller.go`

### TASK-B3-06: Demo Payment Callback
- [x] `POST /payments/demo/confirm` — `{ orderId }` — تأیید دستی دمو
- [x] یا همان auto-confirm در checkout
- **فایل:** `internal/service/checkout_service.go`

### TASK-B3-07: به‌روزرسانی Me Orders
- [x] `GET /me/orders` — شامل `coachName` در آیتم‌ها
- **فایل:** `internal/service/me_service.go`

---

## فاز ۴ — دانشجویان مربی + تخصیص برنامه

### TASK-B4-01: Coach Student Service
- [ ] `ListStudents(coachID)` — فقط `Subscription.CoachID = coachID` یا `User.AssignedCoachID = coachID`
- [ ] `GetStudent(coachID, studentID)` — با بررسی مالکیت
- [ ] pagination + فیلتر status
- **فایل جدید:** `internal/service/coach_student_service.go`

### TASK-B4-02: API دانشجویان مربی
- [ ] `GET /coach/students`
- [ ] `GET /coach/students/:id`
- **فایل جدید:** `internal/controllers/coach_student_controller.go`

### TASK-B4-03: Program Repository — متدهای Write
- [ ] `CreateWorkoutProgram`, `UpdateWorkoutProgram`
- [ ] `CreateNutritionProgram`, `UpdateNutritionProgram`
- [ ] `UpsertWorkoutItems`, `UpsertNutritionItems`
- [ ] `DeactivateOldPrograms` هنگام نسخه جدید
- **فایل:** `internal/repository/program_repository.go`

### TASK-B4-04: Coach Program Service
- [ ] `AssignWorkoutProgram(coachID, studentID, payload)`
- [ ] `AssignNutritionProgram(coachID, studentID, payload)`
- [ ] validation: student متعلق به coach
- [ ] `CoachID` از JWT ست شود
- [ ] یافتن `Subscription` فعال student برای `SubscriptionID`
- **فایل جدید:** `internal/service/coach_program_service.go`

### TASK-B4-05: API تخصیص برنامه
- [ ] `POST /coach/students/:id/workout-programs`
- [ ] `PATCH /coach/students/:id/workout-programs/:programId`
- [ ] `POST /coach/students/:id/nutrition-programs`
- [ ] `PATCH /coach/students/:id/nutrition-programs/:programId`
- [ ] `GET /coach/students/:id/programs` — برنامه‌های فعلی
- **فایل جدید:** `internal/controllers/coach_program_controller.go`

### TASK-B4-06: به‌روزرسانی Me Programs
- [ ] اضافه کردن `coachId`, `coachName`, `coachSlug` به پاسخ
- [ ] `GET /me/programs/:id` — شامل `schedule` / `planByDay` از items
- **فایل:** `internal/service/me_service.go`

### TASK-B4-07: Coach Dashboard Stats
- [ ] `GET /coach/dashboard/stats` — تعداد دانشجویان، اشتراک‌های فعال، فروش ماه
- **فایل جدید:** `internal/service/coach_dashboard_service.go`

---

## فاز ۵ — امنیت و یکپارچگی

### TASK-B5-01: Authorization Helpers
- [ ] `CanCoachAccessStudent(coachID, studentID) bool`
- [ ] `CanCoachAccessPlan(coachID, planID) bool`
- [ ] استفاده در همه سرویس‌های coach
- **فایل جدید:** `internal/service/authorization.go`

### TASK-B5-02: Error Responses یکسان
- [ ] `403 Forbidden` — دسترسی به دانشجو/پلن دیگر
- [ ] `409 Conflict` — دانشجو قبلاً مربی دارد
- [ ] `404 Not Found` — slug / student / plan
- **فایل:** controllers مربوطه

### TASK-B5-03: Logout و Refresh Token
- [ ] اطمینان از invalidate refresh token در logout
- [ ] (اختیاری) endpoint refresh token
- **فایل:** `internal/service/auth_service.go`

### TASK-B5-04: Swagger Update
- [ ] annotate endpointهای جدید
- [ ] `swag init` و به‌روز `docs/swagger.yaml`
- **فایل:** `docs/`

---

## فاز ۶ — سوپرادمین + پولیش

### TASK-B6-01: Admin Coaches API
- [ ] `GET /admin/coaches` — لیست مربی‌ها با pagination
- [ ] `GET /admin/coaches/:id` — جزئیات + تعداد دانشجویان
- [ ] `PATCH /admin/coaches/:id` — `{ isPublished?, isActive? }`
- **فایل جدید:** `internal/controllers/admin_coach_controller.go`

### TASK-B6-02: جداسازی Admin Students
- [ ] `/admin/students` — همه دانشجویان پلتفرم (نه فقط یک مربی)
- [ ] اضافه کردن `coachName` به پاسخ
- **فایل:** `internal/service/admin_student_service.go`

### TASK-B6-03: Admin Dashboard — آمار مربی‌ها
- [ ] `totalCoaches`, `activeCoaches` به stats
- **فایل:** `internal/service/admin_dashboard_service.go`

### TASK-B6-04: تست‌های Integration (اختیاری)
- [ ] تست checkout با محدودیت یک مربی
- [ ] تست coach نمی‌تواند student دیگر را ببیند
- **فایل جدید:** `internal/service/*_test.go`

---

## چک‌لیست نهایی بکند

- [ ] همه routeها در `cmd/main.go` ثبت شده
- [ ] Migration بدون خطا اجرا می‌شود
- [ ] CORS برای فرانت فعال است
- [ ] فایل‌های upload در `/uploads` سرو می‌شوند
- [ ] `API-ENDPOINTS.md` کامل است
- [ ] Swagger به‌روز است

---

## وابستگی بین تسک‌ها

```
B1-* → B2-* → B3-* → B4-* → B5-* → B6-*
         ↓
    B2-04 (public API) قابل تست قبل از B3
    B3-04 (checkout) قبل از B4-01 (students list پر می‌شود)
```
