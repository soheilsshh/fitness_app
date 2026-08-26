# گزارش ارزیابی عملکرد سیستم (Performance Audit Report)

**تاریخ:** $(date)
**هدف:** شناسایی نقاط کندی و فرصت‌های بهینه‌سازی در Backend و Frontend

---

## 📊 خلاصه وضعیت فعلی

### Backend
- **تعداد فایل‌های Go:** 66 فایل
- **تعداد کوئری‌های دیتابیس:** 138+ کوئری شناسایی شده
- **Index های موجود:** ✅ Index های عملکردی قبلاً اضافه شده‌اند
- **Connection Pool:** ✅ بهینه شده (MaxOpen=50, MaxIdle=20)

### Frontend
- **تعداد فایل‌های TypeScript/TSX:** 107+ فایل
- **حجم Bundle (dist):** 3.8MB
- **فایل‌های بزرگ:** 
  - `LiveWebinar.tsx`: ~1246 خط
  - `VideoPlayer.tsx`: ~1688 خط
  - `AdminPanel.tsx`: بزرگ

---

## 🔴 نقاط کندی با اولویت بالا

### 1. Backend: فراخوانی مکرر `LoadConfigFromDB` در Scheduler
**مشکل:** 
- `LoadConfigFromDB` در `scheduler.go` به صورت مکرر فراخوانی می‌شود
- این تابع برای هر بار فراخوانی، چندین کوئری دیتابیس برای خواندن `SystemConfig` اجرا می‌کند
- در scheduler که هر 5 ثانیه اجرا می‌شود، این باعث بار اضافی روی دیتابیس می‌شود

**مکان‌های مشکل:**
- `backend/scheduler/scheduler.go`: خطوط 65, 200, 253, 269, 322, 343, 355, 631
- `backend/config/config.go`: `LoadConfigFromDB` و `getConfigValueFromDB`

**راه‌حل پیشنهادی:**
- اضافه کردن کش در memory برای SystemConfig
- تازه‌سازی کش هر 30-60 ثانیه یا در صورت تغییر
- استفاده از sync.RWMutex برای thread-safety

**اولویت:** 🔴 **بسیار بالا** - تاثیر مستقیم بر عملکرد scheduler

---

### 2. Backend: کوئری‌های متعدد در حلقه‌های SMS/Avanak
**مشکل:**
- در `scheduler.go` در تابع `startStreamingForToday`، کوئری‌های متعددی در حلقه اجرا می‌شوند
- برای هر کاربر، کوئری‌های جداگانه برای ارسال SMS اجرا می‌شود
- `db.Create(&logEntry)` برای هر پیام در حلقه اجرا می‌شود

**مکان‌های مشکل:**
- `backend/scheduler/scheduler.go`: خطوط 1026-1065 (SMS), 1260-1292 (Avanak)

**راه‌حل پیشنهادی:**
- استفاده از Batch Insert برای لاگ‌ها
- Pre-fetch کردن داده‌های مورد نیاز قبل از حلقه
- استفاده از Bulk Operations

**اولویت:** 🟡 **متوسط** - فقط در صورت ارسال پیام‌های زیاد تاثیر دارد

---

### 3. Backend: کوئری‌های Stats در Admin Dashboard
**مشکل:**
- کوئری‌های پیچیده برای آمار در `admin_stats.go`
- ممکن است برای هر بار بارگذاری dashboard چند کوئری سنگین اجرا شود

**مکان‌های مشکل:**
- `backend/controllers/admin_stats.go`: خطوط 214-504

**راه‌حل پیشنهادی:**
- اضافه کردن کش برای آمار dashboard (TTL: 1-5 دقیقه)
- بهینه‌سازی کوئری‌های GROUP BY
- استفاده از Materialized Views (در صورت امکان)

**اولویت:** 🟡 **متوسط** - فقط برای admin dashboard

---

### 4. Frontend: حجم بالای Bundle
**مشکل:**
- حجم Bundle: 3.8MB
- فایل‌های بزرگ که ممکن است به صورت lazy load نشده باشند

**راه‌حل پیشنهادی:**
- بررسی استفاده از Lazy Loading برای کامپوننت‌های بزرگ
- Code Splitting بهتر در vite.config.ts
- بررسی dependency های غیرضروری

**اولویت:** 🟡 **متوسط** - بهبود زمان بارگذاری اولیه

---

### 5. Frontend: رندرینگ‌های غیرضروری
**مشکل:**
- `LiveWebinar.tsx` دارای 35+ `useEffect` و `useState`
- ممکن است رندرینگ‌های غیرضروری داشته باشد

**راه‌حل پیشنهادی:**
- استفاده از `useMemo` و `useCallback` برای جلوگیری از رندرینگ‌های غیرضروری
- بررسی dependency های useEffect

**اولویت:** 🟢 **پایین** - فقط در صورت مشاهده lag در UI

---

## ✅ نقاط مثبت (نیازی به تغییر نیست)

1. **Index های دیتابیس:** Index های عملکردی قبلاً اضافه شده‌اند ✅
2. **Connection Pool:** بهینه شده و مناسب است ✅
3. **Prepared Statements:** فعال است ✅
4. **Code Splitting:** تا حدودی در vite.config.ts پیاده‌سازی شده ✅

---

## 📋 برنامه بهینه‌سازی (مرحله‌ای)

### فاز 1: بهینه‌سازی Backend Config Caching (اولویت بالا)
- [ ] اضافه کردن کش برای SystemConfig
- [ ] تست عملکرد قبل و بعد
- [ ] اطمینان از thread-safety

### فاز 2: بهینه‌سازی Batch Operations (اولویت متوسط)
- [ ] Batch Insert برای SMS/Avanak Logs
- [ ] تست عملکرد

### فاز 3: بهینه‌سازی Frontend (اولویت متوسط)
- [ ] بررسی و بهینه‌سازی Bundle Size
- [ ] Lazy Loading برای کامپوننت‌های بزرگ
- [ ] استفاده از useMemo/useCallback

---

## ⚠️ نکات مهم

1. **تغییرات تدریجی:** هر تغییر باید جداگانه تست شود
2. **Backward Compatibility:** خروجی API ها نباید تغییر کند
3. **Performance Testing:** قبل و بعد از هر تغییر باید تست شود
4. **Monitoring:** بعد از deploy باید عملکرد را زیر نظر گرفت

