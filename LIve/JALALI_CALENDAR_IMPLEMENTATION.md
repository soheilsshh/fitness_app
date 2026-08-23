# 📅 پیاده‌سازی سیستم تقویم شمسی کامل

این مستندات نحوه استفاده از سیستم تقویم شمسی جدید که با **dayjs + jalaliday** پیاده‌سازی شده را توضیح می‌دهد.

---

## 🎯 استراتژی کلی

- **نمایش**: همه تاریخ‌ها به صورت شمسی نمایش داده می‌شوند
- **ذخیره‌سازی**: در دیتابیس و API همچنان میلادی باقی می‌مانند
- **تبدیل**: تبدیل‌ها به صورت خودکار در Frontend انجام می‌شود

---

## 📁 فایل‌های ایجاد شده

### 1. ماژول Utility
**مسیر**: `src/utils/jalali.ts`

این فایل شامل تمام توابع لازم برای کار با تاریخ شمسی است.

#### توابع اصلی:

```typescript
// تبدیل میلادی به شمسی
toJalali(date: Date | string, format?: string): string

// تبدیل شمسی به میلادی
toGregorian(jy: number, jm: number, jd: number, hour?: number, minute?: number): Date

// فرمت کردن تاریخ شمسی
formatJalali(date: Date | string, format: string): string

// دریافت تاریخ شمسی فعلی
nowJalali(format?: string): string

// پارس کردن ورودی شمسی
parseJalaliInput(input: string): Date | null

// دریافت آبجکت تاریخ شمسی
getJalaliDate(date: Date | string): { year: number; month: number; day: number } | null

// نام ماه شمسی
getJalaliMonthName(month: number): string

// نام روز شمسی
getJalaliDayName(date: Date | string): string

// تبدیل اعداد انگلیسی به فارسی
toPersianDigits(str: string | number): string

// تبدیل اعداد فارسی به انگلیسی
toEnglishDigits(str: string): string

// فیکس کردن UTC به timezone ایران
fixUTCToIran(date: Date | string): Date
```

### 2. کامپوننت PersianDatePicker
**مسیر**: `src/components/PersianDatePicker/index.tsx`

کامپوننت کامل برای انتخاب تاریخ شمسی.

#### Props:

```typescript
interface PersianDatePickerProps {
  value?: Date | string | null;        // تاریخ میلادی
  onChange: (date: Date | null) => void; // callback با تاریخ میلادی
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minDate?: Date | string;              // حداقل تاریخ قابل انتخاب
  maxDate?: Date | string;              // حداکثر تاریخ قابل انتخاب
  showTime?: boolean;                   // نمایش time picker
  inline?: boolean;                     // حالت inline (همیشه باز)
}
```

#### مثال استفاده:

```tsx
import PersianDatePicker from '@/components/PersianDatePicker';

const [date, setDate] = useState<Date | null>(null);

<PersianDatePicker
  value={date}
  onChange={(newDate) => setDate(newDate)}
  placeholder="تاریخ را انتخاب کنید"
  showTime={false}
/>

// برای ارسال به API، date را به ISO string تبدیل کنید:
const isoString = date?.toISOString(); // یا date?.toJSON()
```

### 3. کامپوننت PersianTimePicker
**مسیر**: `src/components/PersianTimePicker/index.tsx`

کامپوننت ساده برای انتخاب زمان (24 ساعته).

#### Props:

```typescript
interface PersianTimePickerProps {
  value?: string | null;                // فرمت: "HH:mm"
  onChange: (time: string | null) => void; // callback با فرمت "HH:mm"
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}
```

#### مثال استفاده:

```tsx
import PersianTimePicker from '@/components/PersianTimePicker';

const [time, setTime] = useState<string | null>(null);

<PersianTimePicker
  value={time}
  onChange={(newTime) => setTime(newTime)}
  placeholder="ساعت را انتخاب کنید"
/>
```

---

## 🔄 تبدیل تاریخ‌ها در نمایش

### در جداول و لیست‌ها:

```tsx
import { formatJalali, toPersianDigits } from '@/utils/jalali';

// تاریخ و زمان کامل
const formatted = formatJalali(date, 'YYYY/MM/DD HH:mm:ss');
const withPersianDigits = toPersianDigits(formatted);

// فقط تاریخ
const dateOnly = formatJalali(date, 'YYYY/MM/DD');

// تاریخ کامل با نام روز و ماه
import { getJalaliDate, getJalaliMonthName, getJalaliDayName } from '@/utils/jalali';

const jalali = getJalaliDate(date);
const dayName = getJalaliDayName(date);
const monthName = getJalaliMonthName(jalali?.month || 0);

// نمایش: "یکشنبه، ۲۰ دی ۱۴۰۳"
const fullDate = `${dayName}، ${toPersianDigits(jalali?.day)} ${monthName} ${toPersianDigits(jalali?.year)}`;
```

---

## 📝 مثال‌های کامل

### 1. استفاده در فرم:

```tsx
import React, { useState } from 'react';
import PersianDatePicker from '@/components/PersianDatePicker';
import { config } from '@/config/environment';

const MyForm = () => {
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);

  const handleSubmit = async () => {
    const response = await fetch(`${config.API_BASE_URL}/api/endpoint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduled_at: scheduledAt?.toISOString(), // ارسال به صورت میلادی
      }),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>تاریخ و زمان:</label>
      <PersianDatePicker
        value={scheduledAt}
        onChange={setScheduledAt}
        showTime={true}
        placeholder="تاریخ و زمان را انتخاب کنید"
      />
      <button type="submit">ارسال</button>
    </form>
  );
};
```

### 2. نمایش در جدول:

```tsx
import { formatJalali, toPersianDigits } from '@/utils/jalali';

const DataTable = ({ items }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>تاریخ</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>
              {toPersianDigits(formatJalali(new Date(item.created_at), 'YYYY/MM/DD HH:mm'))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

### 3. ترکیب DatePicker + TimePicker:

```tsx
import { useState } from 'react';
import PersianDatePicker from '@/components/PersianDatePicker';
import PersianTimePicker from '@/components/PersianTimePicker';
import { toGregorian, getJalaliDate } from '@/utils/jalali';

const DateTimeForm = () => {
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const handleDateTimeChange = (newDate: Date | null, newTime: string | null) => {
    if (newDate && newTime) {
      const [hour, minute] = newTime.split(':').map(Number);
      const jalali = getJalaliDate(newDate);
      if (jalali) {
        const combined = toGregorian(jalali.year, jalali.month, jalali.day, hour, minute);
        setDate(combined);
      }
    }
  };

  return (
    <div>
      <PersianDatePicker
        value={date}
        onChange={(newDate) => handleDateTimeChange(newDate, time)}
      />
      <PersianTimePicker
        value={time}
        onChange={(newTime) => handleDateTimeChange(date, newTime)}
      />
    </div>
  );
};
```

---

## 🔧 تغییرات انجام شده در فایل‌های موجود

### 1. PaymentsList.tsx
- ✅ تبدیل تمام نمایش تاریخ‌ها به شمسی
- ✅ استفاده از `formatJalali` و `toPersianDigits`
- ✅ به‌روزرسانی helper component `PersianDateDisplay`

### 2. AvanakMessageManager.tsx
- ✅ جایگزینی `datetime-local` input با `PersianDatePicker`
- ✅ افزودن import کامپوننت جدید

---

## ⚠️ نکات مهم

1. **همیشه Date object به API ارسال کنید**: استفاده از `.toISOString()` یا `.toJSON()`

2. **دریافت از API**: تاریخ‌های دریافتی را با `fixUTCToIran()` فیکس کنید اگر نیاز است

3. **Sorting و Filtering**: همچنان بر اساس تاریخ میلادی انجام می‌شود (backend)

4. **Timezone**: تمام تبدیل‌ها با timezone ایران (`Asia/Tehran`) انجام می‌شود

---

## 🚀 مراحل بعدی (برای Developerها)

اگر می‌خواهید سایر فرم‌ها را هم به‌روزرسانی کنید:

1. **جستجوی فایل‌های با date input:**
   ```bash
   grep -r "type.*date\|datetime-local" src/components
   ```

2. **جایگزینی:**
   - `type="date"` → `<PersianDatePicker />`
   - `type="datetime-local"` → `<PersianDatePicker showTime={true} />`
   - `type="time"` → `<PersianTimePicker />`

3. **به‌روزرسانی نمایش تاریخ‌ها:**
   - جایگزینی `toLocaleDateString` با `formatJalali`
   - استفاده از `toPersianDigits` برای اعداد

---

## 📚 منابع

- [dayjs Documentation](https://day.js.org/)
- [jalaliday Plugin](https://github.com/jalaali/jalaali-js)
- [dayjs timezone Plugin](https://github.com/iamkun/dayjs/blob/dev/docs/en/Plugin.md#timezone)

---

## ✅ چک‌لیست

- [x] نصب dayjs + jalaliday
- [x] ایجاد ماژول jalali.ts
- [x] ساخت PersianDatePicker
- [x] ساخت PersianTimePicker
- [x] به‌روزرسانی PaymentsList
- [x] به‌روزرسانی AvanakMessageManager
- [ ] به‌روزرسانی SMSMessageManager
- [ ] به‌روزرسانی سایر فرم‌ها
- [ ] تست کامل TypeScript
- [ ] تست در محیط production

---

**آخرین به‌روزرسانی**: 2024
**نسخه**: 1.0.0
