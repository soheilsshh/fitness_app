# گزارش بهینه‌سازی فاز 2: Batch Operations برای Logs

**تاریخ:** $(date)
**هدف:** کاهش تعداد کوئری‌های INSERT برای SMS/Avanak Logs با استفاده از Batch Insert

---

## ✅ تغییرات اعمال شده

### 1. بهینه‌سازی Batch Insert برای SMS/Avanak Logs

**فایل‌های تغییر یافته:**
- `backend/scheduler/scheduler.go`: 3 تابع
- `backend/controllers/sms_message.go`: 1 تابع

#### توابع بهینه‌سازی شده:

1. **`processAutomaticSMSMessages` (scheduler.go)**
   - قبل: `db.Create(&logEntry)` در هر iteration (N کوئری)
   - بعد: جمع‌آوری log entries و batch insert هر 100 تا

2. **`processScheduledSMSMessages` (scheduler.go)**
   - قبل: `db.Create(&logEntry)` در هر iteration (N کوئری)
   - بعد: جمع‌آوری log entries و batch insert هر 100 تا

3. **`processAutomaticAvanakMessages` (scheduler.go)**
   - قبل: `db.Create(&logEntry)` در هر iteration (N کوئری)
   - بعد: جمع‌آوری log entries و batch insert هر 100 تا

4. **`processInstantSend` (controllers/sms_message.go)**
   - قبل: `db.Create(&logEntry)` در هر iteration (N کوئری)
   - بعد: جمع‌آوری log entries و batch insert هر 100 تا

---

## 📊 بهبود عملکرد مورد انتظار

### قبل از بهینه‌سازی:
- برای 1000 کاربر: **1000 کوئری INSERT**
- زمان اجرا: ~100-200ms برای کوئری‌ها + زمان ارسال SMS

### بعد از بهینه‌سازی:
- برای 1000 کاربر: **10 کوئری INSERT** (batch size = 100)
- زمان اجرا: ~10-20ms برای کوئری‌ها + زمان ارسال SMS
- **کاهش 99% در تعداد کوئری‌ها**

### مثال عملی:

**سناریو: ارسال SMS به 500 کاربر**

**قبل:**
- 500 کوئری `INSERT INTO sms_message_logs ...`
- زمان: ~50-100ms فقط برای کوئری‌ها
- Load روی دیتابیس: بالا

**بعد:**
- 5 کوئری `INSERT INTO sms_message_logs ...` (batch of 100)
- زمان: ~5-10ms فقط برای کوئری‌ها
- Load روی دیتابیس: پایین

---

## 🔧 جزئیات پیاده‌سازی

### الگوی استفاده شده:

```go
// 1. ایجاد slice با capacity مناسب
logEntries := make([]models.SMSMessageLog, 0, len(users))
const batchSize = 100

// 2. جمع‌آوری log entries در حلقه
for _, user := range users {
    // ... ارسال SMS ...
    
    logEntry := models.SMSMessageLog{...}
    logEntries = append(logEntries, logEntry)
    
    // 3. Batch insert هنگام رسیدن به batch size
    if len(logEntries) >= batchSize {
        db.CreateInBatches(logEntries, batchSize)
        logEntries = logEntries[:0] // Clear اما capacity حفظ می‌شود
    }
}

// 4. Insert کردن باقی‌مانده
if len(logEntries) > 0 {
    db.CreateInBatches(logEntries, batchSize)
}
```

### مزایای این الگو:

1. **Memory Efficient:** استفاده از `[:0]` برای clear کردن slice بدون از دست دادن capacity
2. **Batch Size:** 100 entry در هر batch (تعادل بین performance و memory)
3. **Error Handling:** خطاهای batch insert لاگ می‌شوند
4. **Backward Compatible:** خروجی دقیقاً همان است

---

## ⚠️ نکات مهم

1. **Batch Size:** 100 انتخاب شده است که:
   - برای دیتابیس‌های MySQL مناسب است
   - از مشکل packet size جلوگیری می‌کند
   - حافظه کمی استفاده می‌کند

2. **Memory Usage:** 
   - برای هر log entry حدود 200-300 bytes
   - برای 100 entry: ~20-30KB در memory
   - بسیار کم و قابل قبول

3. **Transaction Safety:**
   - GORM's `CreateInBatches` به صورت خودکار transaction را مدیریت می‌کند
   - در صورت خطا، batch insert fail می‌شود اما سایر batch ها اجرا می‌شوند

4. **Backward Compatibility:**
   - رفتار دقیقاً همان است
   - فقط performance بهبود یافته

---

## 🧪 تست توصیه شده

قبل از deploy در production:

1. **تست Batch Insert:**
   ```bash
   # ارسال SMS به تعداد زیادی کاربر (مثلاً 500)
   # بررسی لاگ‌ها و اطمینان از اینکه همه لاگ‌ها ذخیره شده‌اند
   ```

2. **تست Memory:**
   - بررسی مصرف حافظه هنگام ارسال به تعداد زیادی کاربر
   - باید ثابت باقی بماند

3. **تست Error Handling:**
   - تست سناریوی خطا در batch insert
   - اطمینان از اینکه لاگ‌های خطا ثبت می‌شوند

---

## 📝 مراحل بعدی (فاز 3)

1. بهینه‌سازی Frontend Bundle Size
2. اضافه کردن کش برای Admin Dashboard Stats
3. بهینه‌سازی رندرینگ Frontend (useMemo/useCallback)

---

## ✅ وضعیت

- [x] پیاده‌سازی Batch Insert برای SMS Logs (scheduler)
- [x] پیاده‌سازی Batch Insert برای SMS Logs (controller)
- [x] پیاده‌سازی Batch Insert برای Avanak Logs
- [x] تست compile
- [x] مستندسازی
- [ ] تست عملکرد (قبل/بعد)
- [ ] Deploy در production

