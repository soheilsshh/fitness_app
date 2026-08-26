# سیستم گردش‌کار (Workflow Automation) وبینار

## 📋 مقدمه

این سیستم یک موتور گردش‌کار قدرتمند برای اتوماسیون پیامک‌ها و تماس‌های صوتی در وبینار است. با استفاده از این سیستم می‌توانید:

- پیامک‌های خودکار قبل، حین و بعد از وبینار ارسال کنید
- تماس‌های صوتی اتوماتیک برای یادآوری و فالوآپ داشته باشید
- کاربران را بر اساس رفتارشان (دیده/ندیده، خریده/نخریده) هدف‌گذاری کنید
- تگ‌گذاری و دسته‌بندی خودکار کاربران

## 🏗️ معماری

### Backend (Go)

#### مدل‌ها (`backend/models/workflow.go`)
- **Workflow**: گردش کار اصلی
- **WorkflowStep**: مراحل هر گردش کار
- **WorkflowExecutionLog**: لاگ اجرای مراحل
- **User** (به‌روزرسانی شده): فیلدهای جدید برای tracking

#### سرویس‌ها
- **`services/notification/sms_service.go`**: سرویس ارسال پیامک
- **`services/notification/voice_service.go`**: سرویس تماس صوتی
- **`services/notification/workflow_executor.go`**: موتور اجرای گردش‌کارها

#### Controller
- **`controllers/admin_workflow.go`**: APIهای مدیریت workflow

#### Scheduler
- Job دوره‌ای هر 5 دقیقه برای اجرای مراحل سررسید شده

### Frontend (React + TypeScript)

#### صفحات
- **`src/pages/AdminWorkflows.tsx`**: صفحه مدیریت گردش‌کارها
  - لیست workflow‌ها
  - فرم ایجاد/ویرایش
  - لاگ اجراها

## 🚀 نصب و راه‌اندازی

### 1. Migration دیتابیس

مدل‌های جدید به‌صورت خودکار در startup migrate می‌شوند:

```bash
cd backend
go run cmd/main.go
```

### 2. Seed داده‌های نمونه (اختیاری)

برای ایجاد workflow‌های نمونه:

```bash
cd backend
go run scripts/seed_workflows.go
```

این دستور 4 workflow نمونه ایجاد می‌کند:
1. وارم‌آپ 24 ساعته تا کارگاه
2. فالوآپ بعد کارگاه - تماشا کرده ولی نخریده
3. فالوآپ کسانی که اصلاً نیامدند
4. تشکر از خریداران

**⚠️ نکته مهم**: همه workflow‌های seed شده به‌صورت پیش‌فرض **غیرفعال** هستند. قبل از فعال‌سازی:
- کدهای پترن SMS را در تنظیمات هر مرحله تنظیم کنید
- شناسه پیام‌های Avanak را وارد کنید
- workflow را از پنل ادمین فعال کنید

### 3. دسترسی به پنل

```
http://localhost:8080/admin/workflows
```

## 📖 راهنمای استفاده

### ایجاد Workflow جدید

1. وارد پنل ادمین شوید
2. روی "ایجاد گردش کار جدید" کلیک کنید
3. اطلاعات کلی را وارد کنید:
   - **نام**: نام توصیفی برای workflow
   - **توضیحات**: توضیحات اختیاری
   - **نوع تریگر**:
     - `شروع از زمان ثبت‌نام`: مراحل بر اساس زمان ثبت‌نام کاربر اجرا می‌شوند
     - `نزدیک شروع وبینار`: مراحل بر اساس زمان شروع وبینار
     - `بعد از اتمام وبینار`: مراحل بر اساس زمان پایان وبینار
   - **وبینار**: می‌توانید workflow را به یک وبینار خاص محدود کنید یا برای همه وبینارها اعمال شود
   - **فعال/غیرفعال**: وضعیت فعال‌سازی

4. مراحل (Steps) را اضافه کنید

### تنظیمات هر مرحله

#### 1. تاخیر (Delay)
- تعداد دقیقه بعد از زمان تریگر
- مثال: 
  - `0` = بلافاصله
  - `60` = یک ساعت بعد
  - `1440` = یک روز بعد

#### 2. نوع اکشن (Action Type)
- **ارسال پیامک**: ارسال SMS با پترن
- **تماس صوتی**: ارسال تماس صوتی Avanak
- **اضافه کردن تگ**: تگ‌گذاری کاربر
- **تغییر وضعیت**: تغییر فیلد کاربر (مثل purchase_status)
- **توقف سایر گردش‌کارها**: متوقف کردن workflow‌های دیگر برای این کاربر

#### 3. هدف (Segment)
کاربران هدف را انتخاب کنید:

- **همه ثبت‌نام‌کننده‌ها**: بدون فیلتر
- **ثبت‌نام کرده ولی وارد نشده**: `first_join_at IS NULL`
- **کمتر دیده و خارج شده**: کمتر از X دقیقه تماشا کرده
- **تماشا کرده اما نخریده**: `first_join_at NOT NULL AND purchase_status = 'none'`
- **تا پیشنهاد دیده اما نخریده**: حداقل X دقیقه دیده اما نخریده
- **خریدار قسطی**: `purchase_status = 'installment'`
- **خریدار کامل**: `purchase_status = 'full'`
- **بر اساس تگ**: کاربرانی که تگ خاصی دارند

#### 4. تنظیمات اکشن

**برای SMS:**
- کد پترن: کد پترن ملی‌پیامک
- پارامترها (JSON): مقادیر پارامترها
  ```json
  {
    "name": "{{first_name}}",
    "time": "{{webinar_start_time}}",
    "link": "{{cta_link}}"
  }
  ```

**Placeholders موجود:**
- `{{first_name}}`: نام
- `{{last_name}}`: نام خانوادگی
- `{{phone}}`: شماره تلفن
- `{{webinar_title}}`: عنوان وبینار
- `{{webinar_start_time}}`: زمان شروع وبینار
- `{{webinar_end_time}}`: زمان پایان وبینار

**برای تماس صوتی:**
- شناسه پیام آوانک: Message ID در سیستم Avanak

**برای تگ:**
- نام تگ: مثلاً `warmup_sent`, `followup_1`

**برای تغییر وضعیت:**
- فیلد: `purchase_status` یا `tags`
- مقدار: مثلاً `installment`, `full`, `none`

## 🔄 نحوه کار سیستم

### 1. Scheduler
هر 5 دقیقه یک بار:
```go
processWorkflows(db, workflowExecutor, loc)
```

### 2. Workflow Executor
برای هر workflow فعال:
1. کاربران مرتبط را پیدا می‌کند
2. زمان تریگر را محاسبه می‌کند:
   - `on_registration` → `user.registered_at`
   - `before_webinar` → `webinar.start_time`
   - `after_webinar` → `webinar.end_time`
3. برای هر مرحله:
   - `scheduled_time = trigger_time + delay_minutes`
   - اگر `scheduled_time <= now` و قبلاً اجرا نشده:
     - بررسی segment
     - اجرای اکشن
     - ثبت لاگ

### 3. Idempotency
هر مرحله برای هر کاربر فقط یک بار اجرا می‌شود (unique index روی `workflow_step_id, participant_id`)

## 📊 مثال‌های کاربردی

### مثال 1: یادآوری قبل از وبینار

```
Workflow: وارم‌آپ 24 ساعته
Trigger: on_registration

Step 1:
- Delay: 60 دقیقه
- Action: send_sms
- Segment: all_registered
- Pattern: "سلام {{first_name}}، ثبت‌نام شما تایید شد. وبینار {{webinar_start_time}}"

Step 2:
- Delay: 1320 دقیقه (22 ساعت)
- Action: send_sms
- Segment: all_registered
- Pattern: "{{first_name}} عزیز، 2 ساعت تا شروع وبینار باقی مانده"

Step 3:
- Delay: 1410 دقیقه (23.5 ساعت)
- Action: send_sms
- Segment: all_registered
- Pattern: "فقط 30 دقیقه تا شروع! لینک: ..."
```

### مثال 2: فالوآپ بعد از وبینار

```
Workflow: فالوآپ تماشاگران
Trigger: after_webinar

Step 1:
- Delay: 30 دقیقه
- Action: send_sms
- Segment: attended_not_bought
- Min Watch: 10 دقیقه
- Pattern: "ممنون از حضورتون {{first_name}}! پیشنهاد ویژه: ..."

Step 2:
- Delay: 1440 دقیقه (24 ساعت)
- Action: send_voice
- Segment: attended_not_bought
- Voice ID: 12345

Step 3:
- Delay: 2880 دقیقه (48 ساعت)
- Action: send_sms
- Segment: attended_not_bought
- Pattern: "آخرین فرصت {{first_name}}! تخفیف امروز تموم میشه"
```

### مثال 3: تگ‌گذاری خودکار

```
Workflow: تگ‌گذاری خریداران
Trigger: after_webinar

Step 1:
- Delay: 10 دقیقه
- Action: add_tag
- Segment: buyers_full
- Tag: "buyer_full_payment"

Step 2:
- Delay: 10 دقیقه
- Action: add_tag
- Segment: buyers_installment
- Tag: "buyer_installment"
```

## 🔍 مانیتورینگ و Debug

### لاگ‌های اجرا
در پنل ادمین > گردش‌کارها > لاگ اجراها:
- تاریخ و ساعت اجرا
- نام workflow و شماره مرحله
- شماره تلفن کاربر
- وضعیت (موفق/خطا)
- پیام خطا (در صورت وجود)

### لاگ‌های سرور
```bash
tail -f backend/logs/workflow.log
```

## ⚠️ نکات مهم

1. **تست قبل از فعال‌سازی**: همیشه workflow را ابتدا غیرفعال ایجاد کنید و بعد از تست فعال کنید

2. **کدهای پترن**: مطمئن شوید کدهای پترن SMS در سیستم ملی‌پیامک تایید شده‌اند

3. **حجم ارسال**: برای workflow‌هایی با حجم بالا، delay مناسب تنظیم کنید تا همه پیام‌ها یکباره ارسال نشوند

4. **Segment دقیق**: segment‌ها را دقیق تنظیم کنید تا پیام‌های تکراری ارسال نشود

5. **Placeholder‌ها**: از placeholder‌های صحیح استفاده کنید (با `{{` و `}}`)

6. **JSON معتبر**: در فیلد پارامترهای SMS، JSON معتبر وارد کنید

## 🛠️ توسعه و سفارشی‌سازی

### افزودن Segment جدید

در `workflow_executor.go`:

```go
case "my_custom_segment":
    // Your logic here
    return true
```

### افزودن Action جدید

1. در `models/workflow.go` به enum `action_type` اضافه کنید
2. در `workflow_executor.go` در `executeStepAction` handle کنید
3. در UI در `AdminWorkflows.tsx` به dropdown اضافه کنید

### افزودن Placeholder جدید

در `workflow_executor.go` در `replacePlaceholders`:

```go
value = strings.ReplaceAll(value, "{{my_placeholder}}", myValue)
```

## 📞 پشتیبانی

برای سوالات یا مشکلات:
1. لاگ‌های سرور را بررسی کنید
2. لاگ‌های اجرا در پنل ادمین را چک کنید
3. از بخش تست در پنل SMS برای تست پترن‌ها استفاده کنید

## 🎯 بهترین روش‌ها (Best Practices)

1. **نام‌گذاری واضح**: نام workflow‌ها و مراحل را واضح و توصیفی انتخاب کنید

2. **توضیحات کامل**: در فیلد توضیحات هدف workflow را بنویسید

3. **تست تدریجی**: ابتدا با segment کوچک (مثلاً یک کاربر تست) شروع کنید

4. **مانیتورینگ مداوم**: لاگ‌ها را به‌طور منظم بررسی کنید

5. **Backup**: قبل از تغییرات بزرگ، از workflow‌های موجود export بگیرید

6. **Documentation**: تغییرات مهم را مستند کنید

## 🚀 آینده سیستم

قابلیت‌های پیشنهادی برای نسخه‌های بعدی:
- [ ] شرط‌های پیچیده‌تر (AND/OR)
- [ ] A/B Testing
- [ ] گزارش‌گیری پیشرفته
- [ ] Template Library
- [ ] Visual Workflow Builder
- [ ] Webhook Integration
- [ ] Email Support

---

**نسخه**: 1.0.0  
**تاریخ**: دسامبر 2024  
**توسعه‌دهنده**: MonetizeAI Team

