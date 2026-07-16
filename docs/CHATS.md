# فیتینو — خلاصه گفتگوهای توسعه (وب + بک‌اند)

> آخرین به‌روزرسانی: ۱۴۰۵/۰۴/۲۵  
> منبع: جلسات Cursor روی پروژه `fitness_app`

این سند خروجی گفتگوهای اخیر را برای تیم موبایل/فلاتر و بک‌اند خلاصه می‌کند.

---

## ۱) احراز هویت واحد (Unified Auth)

**هدف:** یک دکمه ورود/ثبت‌نام؛ تشخیص با شماره موبایل.

| وضعیت | جزئیات |
|--------|--------|
| وب | `UnifiedAuthForm` در `/auth` — `POST /auth/check-phone` |
| بک‌اند | `CheckPhone` + OTP/رمز |
| فلاتر | هنوز جدا: login / register / forgot |

**فلو:** شماره → اگر موجود: ورود (رمز یا OTP) → اگر جدید: ثبت‌نام با OTP + رمز → آنبوردینگ کوتاه.

---

## ۲) آنبوردینگ تدریجی

- ثبت‌نام: فقط شماره + OTP + رمز
- آنبوردینگ: نام + هدف اصلی → داشبورد
- عکس بدن / پزشکی / اندازه‌ها: اختیاری در پروفایل
- گیت ورود به پنل: نام واقعی + هدف اصلی

---

## ۳) ناوبری پنل کاربر (۵ دسته)

| تب | زیر‌صفحه‌ها |
|----|-------------|
| خانه | داشبورد |
| تمرین | برنامه‌ها + تاریخچه |
| تغذیه | کالری‌شمار |
| پایش | وزن و عکس بدن |
| حساب من | پروفایل + سفارش‌ها + ارتباط با مربی |

- موبایل وب: Bottom Nav شناور شیشه‌ای (بدون همبرگر)
- دسکتاپ: سایدبار با ۵ دسته + زیر‌آیتم‌ها
- هدر: آموزش + FAQ + تم روز/شب

---

## ۴) آموزش (Academy)

| نوع | ویژگی |
|-----|--------|
| پادکست | کاور، عنوان، توضیح، پلیر صوتی |
| ویدیو | کاور، عنوان، توضیح، پلیر ویدیو |
| متن | کاور، عنوان، توضیح، متن کامل (Sheet) |

- مسیر وب: `/user/academy`
- API: `GET /academy` · ادمین: `GET/PUT /admin/academy` · آپلود: `POST /admin/content-media`
- ذخیره: JSON در `site_settings.academy_items`
- ادمین: `/admin/content` تب آموزش

---

## ۵) سوالات متداول (FAQ)

- مسیر وب: `/user/faq`
- API: `GET /faq` · ادمین: `GET/PUT /admin/faq`
- دسته‌ها: شروع، تمرین/تغذیه، پایش، مربی، پرداخت، **حریم خصوصی**
- جستجو در کلاینت

---

## ۶) سایر بخش‌های وب (برای پاریتی فلاتر)

| بخش | مسیر وب | API اصلی |
|-----|---------|----------|
| داشبورد | `/user/dashboard` | `GET /me/dashboard`, `/me/records` |
| برنامه‌ها | `/user/my-programs` | `GET /me/programs` |
| تاریخچه تمرین | `/user/workout-history` | `GET /me/workout-history` |
| تغذیه | `/user/food-diary` | `/user/food-logs`, `/user/foods` |
| پایش | `/user/tracking` | `/me/tracking`, weight, photos |
| پروفایل | `/user/profile` | `GET/PATCH /me`, avatar, body-photos |
| سفارش‌ها | `/user/orders` | `GET /me/orders` |
| تیکت | `/user/contact` | `GET/POST /me/tickets` |
| هوش مصنوعی | `/user/ai` + FAB | `POST /me/ai/chat` |
| تم | ThemeToggle | local preference |

---

## ۷) پنل ادمین محتوا

- مسیر: `/admin/content`
- منو: «آموزش و FAQ»
- CRUD آموزش + FAQ + آپلود رسانه

---

## ۸) پاکسازی mock

حذف شد (بلااستفاده):

- `siteMock.js`, `plansMock.js`, `studentsMock.js`
- `userProgramsMock.js`, `userBodyMock.js`

آموزش و FAQ فقط از API واقعی می‌آیند.

---

## ۹) نقشه ادامه در فلاتر

جزئیات و چک‌لیست: [`MOBILE_PARITY.md`](./MOBILE_PARITY.md)
