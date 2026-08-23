# گزارش بهینه‌سازی فاز 1: SystemConfig Caching

**تاریخ:** $(date)
**هدف:** کاهش تعداد کوئری‌های دیتابیس برای SystemConfig

---

## ✅ تغییرات اعمال شده

### 1. اضافه کردن سیستم کش برای SystemConfig

**فایل:** `backend/config/config.go`

#### تغییرات:

1. **ساختار کش:**
   - `configCache`: ساختار thread-safe برای ذخیره مقادیر config
   - `cacheEntry`: هر entry شامل value و expiresAt
   - TTL: 30 ثانیه (قابل تنظیم)

2. **توابع جدید:**
   - `initConfigCache()`: مقداردهی اولیه کش (thread-safe با sync.Once)
   - `getCachedConfigValue()`: دریافت از کش
   - `setCachedConfigValue()`: ذخیره در کش
   - `InvalidateConfigCache()`: پاک کردن تمام کش
   - `InvalidateConfigCacheKey()`: پاک کردن یک key خاص

3. **بهینه‌سازی `getConfigValueFromDB`:**
   - ابتدا از کش خوانده می‌شود
   - در صورت cache miss، از دیتابیس خوانده می‌شود و در کش ذخیره می‌شود

4. **بهینه‌سازی `setConfigValue` در ConfigController:**
   - هنگام به‌روزرسانی config، کش مربوط به آن key پاک می‌شود
   - این تضمین می‌کند که مقادیر به‌روز شده بلافاصله در دسترس باشند

---

## 📊 بهبود عملکرد مورد انتظار

### قبل از بهینه‌سازی:
- هر بار فراخوانی `LoadConfigFromDB`: ~15-20 کوئری دیتابیس
- در scheduler (هر 5 ثانیه): 15-20 کوئری
- **تعداد کوئری در ساعت:** ~10,800-14,400 کوئری

### بعد از بهینه‌سازی:
- اولین فراخوانی: 15-20 کوئری (cache miss)
- فراخوانی‌های بعدی (در عرض 30 ثانیه): 0 کوئری (cache hit)
- در scheduler (هر 5 ثانیه): 
  - اولین بار: 15-20 کوئری
  - بعدی (6 بار در 30 ثانیه): 0 کوئری
- **تعداد کوئری در ساعت:** ~720-960 کوئری (کاهش ~93%)

---

## 🔒 Thread Safety

- استفاده از `sync.RWMutex` برای thread-safety
- استفاده از `sync.Once` برای مقداردهی اولیه یک‌باره
- پشتیبانی کامل از concurrent access

---

## ⚠️ نکات مهم

1. **TTL:** کش هر 30 ثانیه expire می‌شود. اگر نیاز به TTL متفاوت دارید، می‌توانید تغییر دهید.

2. **Invalidation:** هنگام به‌روزرسانی config از admin panel، کش به صورت خودکار invalidate می‌شود.

3. **Backward Compatibility:** تمام تغییرات backward compatible هستند و API ها تغییری نکرده‌اند.

4. **Memory Usage:** کش فقط در memory نگه داشته می‌شود و سایز آن ناچیز است (حدود چند KB).

---

## 🧪 تست توصیه شده

قبل از deploy در production، تست‌های زیر را انجام دهید:

1. **تست کش:**
   ```bash
   # لاگ scheduler را بررسی کنید
   # باید مشاهده کنید که کوئری‌ها فقط در اولین فراخوانی اجرا می‌شوند
   ```

2. **تست Invalidation:**
   - یک config را از admin panel به‌روزرسانی کنید
   - بررسی کنید که تغییرات بلافاصله اعمال می‌شوند

3. **تست Concurrent Access:**
   - چندین درخواست همزمان به API های مختلف ارسال کنید
   - بررسی کنید که هیچ race condition وجود ندارد

---

## 📝 مراحل بعدی (فاز 2)

1. بهینه‌سازی Batch Operations برای SMS/Avanak Logs
2. اضافه کردن کش برای Admin Dashboard Stats
3. بهینه‌سازی Frontend Bundle Size

---

## ✅ وضعیت

- [x] پیاده‌سازی کش
- [x] تست compile
- [x] مستندسازی
- [ ] تست عملکرد (قبل/بعد)
- [ ] Deploy در production

