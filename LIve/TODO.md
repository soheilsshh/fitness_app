# TODO List

## پیاده‌سازی سرویس‌های پیامکی

### ✅ تکمیل شده

- [x] سرویس Faraz SMS - اضافه شد
  - [x] ساختار سرویس (`backend/services/faraz.go`)
  - [x] Config structure (`backend/config/config.go`)
  - [x] تابع `SendSimpleSMS` برای ارسال پیامک ساده
  - [x] تابع `SendScheduledSMS` برای ارسال زمان‌بندی شده
  - [x] تبدیل خودکار شماره تلفن به فرمت E.164

### 📋 TODO: پیامک‌های ساده

**هدف:** اضافه کردن قابلیت ارسال پیامک‌های ساده (بدون pattern) از طریق Faraz SMS

#### موارد لازم:

1. **اضافه کردن به Config:**
   - [ ] اضافه کردن تنظیمات Faraz SMS به `config.yaml`
     ```yaml
     faraz_sms:
       api_key: "OWYzZmNmNGYtZjEzMi00YjIyLWJhMzgtYmFjZjQ3NWFmMjIxMDcwZGE0ZWMwZDcyYzAxNjcxZDlkMjU0MzAzZmJhMGY="
       from_number: "+983000505"  # شماره فرستنده (باید تنظیم شود)
       enabled: true
     ```

2. **اضافه کردن به Controllers:**
   - [ ] ایجاد controller برای مدیریت پیامک‌های ساده
   - [ ] API endpoint برای ارسال پیامک ساده
   - [ ] API endpoint برای ارسال bulk SMS
   - [ ] API endpoint برای زمان‌بندی پیامک

3. **اضافه کردن به Models (در صورت نیاز):**
   - [ ] مدل برای ذخیره تاریخچه پیامک‌های ساده (SimpleSMSLog)
   - [ ] ذخیره لاگ ارسال‌ها

4. **ادغام با سیستم موجود:**
   - [ ] اضافه کردن FarazSMS service به main.go
   - [ ] اضافه کردن routes برای API endpoints
   - [ ] تست اتصال و ارسال

5. **Admin Panel Integration (اختیاری):**
   - [ ] UI برای ارسال پیامک ساده از admin panel
   - [ ] لیست تاریخچه پیامک‌های ارسال شده
   - [ ] مدیریت شماره فرستنده

#### نکات مهم:

- **API Key:** `OWYzZmNmNGYtZjEzMi00YjIyLWJhMzgtYmFjZjQ3NWFmMjIxMDcwZGE0ZWMwZDcyYzAxNjcxZDlkMjU0MzAzZmJhMGY=`
- **Base URL:** `https://edge.ippanel.com/v1`
- **Endpoint:** `POST /api/send`
- **Authentication:** Header: `Authorization: API_KEY`
- **Format:** همه شماره‌ها باید در فرمت E.164 باشند (مثلاً: +989120000000)
- **Sender Number:** باید یک شماره معتبر از حساب Faraz SMS باشد

#### مستندات API:

- داکیومنت کامل در فایل: `faraz sms.txt`
- روش ارسال: Webservice SMS
- پارامترها:
  - `sending_type`: "webservice"
  - `from_number`: شماره فرستنده (E.164)
  - `message`: متن پیام
  - `params.recipients`: آرایه شماره گیرندگان (E.164)
  - `send_time`: اختیاری - برای زمان‌بندی (YYYY-MM-DD HH:MM:SS UTC)

---

## سایر TODO ها

(می‌توانید TODO های دیگر را اینجا اضافه کنید)

