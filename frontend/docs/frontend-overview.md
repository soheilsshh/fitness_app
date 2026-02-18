## Frontend Overview

- **Tech stack**: Next.js 16 (App Router, `src/app`), React 19, Redux Toolkit (`@reduxjs/toolkit`, `react-redux`), TailwindCSS 4, Framer Motion, Recharts, SweetAlert2, React Icons.
- **Language / direction**: UI به زبان فارسی و با جهت‌دهی RTL (`<html lang="fa" dir="rtl">` در `RootLayout`).
- **Entrypoint**: روت اصلی در `src/app/page.js` است که به `src/app/(site)/page.js` ری‌اکسپورت می‌شود.
- **Routing model**: 
  - از App Router استفاده شده و ساب‌دیرکتوری‌های `(site)` و `(panel)` برای جداسازی سایت عمومی و پنل‌ها به کار رفته‌اند.
  - همه صفحات با فایل‌های `page.(js|jsx)` در زیرشاخه‌های `src/app` تعریف شده‌اند.
- **Layouts**:
  - `src/app/layout.js`: روت لایوت کل پروژه، ست کردن HTML, `dir="rtl"`, و تزریق Redux `Providers`.
  - `src/app/(site)/layout.js`: لایوت عمومی سایت، شامل `Navbar` و بک‌گراند تیره.
  - `src/app/(site)/auth/layout.js`: لایوت صفحات احراز هویت، با شِل مخصوص (AuthShell) و فوتر.
  - `src/app/(panel)/user/layout.js`: لایوت پنل کاربر، با `PanelShell`، `Sidebar`، `Topbar` و محتوا.
  - `src/app/(panel)/admin/_components/AdminShell.js` (از طریق صفحات ادمین استفاده می‌شود): شِل پنل ادمین با `AdminSidebar` و `AdminTopbar`.

### Global State & API Layer

- **Redux store** (`src/store/store.js`):
  - **اسلایس‌ها**:
    - `exampleSlice`: صرفاً نمونه (در حال حاضر برای بکند کاربرد خاصی ندارد).
    - `cartSlice`: وضعیت سبد خرید پلن‌ها.
  - در `Providers` (فایل `src/app/providers.js`) به‌صورت سراسری به اپ اینجکت شده است.

- **Cart slice** (`src/store/slices/cartSlice.js`):
  - **State shape**:
    - `items: Array<{ id: string; title: string; price: number; qty: number }>`
  - **Reducers**:
    - `addToCart({ id, title, price })`: اگر آیتم وجود نداشته باشد آن را با `qty=1` اضافه می‌کند، در غیر این صورت `qty` را ۱ واحد زیاد می‌کند.
    - `removeFromCart(id)`: حذف آیتم با `id`.
    - `setQty({ id, qty })`: تنظیم تعداد با حداقل ۱.
    - `clearCart()`: خالی کردن سبد.
  - **Selectors**:
    - `selectCartItems(state) -> items`.
    - `selectCartCount(state) -> sum(qty)`.
    - `selectCartTotal(state) -> sum(price * qty)`.

- **Axios client** (`src/lib/axios/client.js`):
  - `api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, timeout: 15000 })`.
  - **نکته**: در حال حاضر هیچ تماس واقعی به `api` در کد نیست؛ برای اتصال بکند باید از این کلاینت در صفحات/کامپوننت‌های مربوط استفاده شود.

### High-Level Route Map

- **Public site (`(site)`)**:
  - `/` → `src/app/(site)/page.js` (صفحه لندینگ).
  - `/auth/login` → صفحه لاگین.
  - `/auth/register` → صفحه ثبت‌نام.
  - `/auth/forgot` → صفحه فراموشی رمز.
  - `/payment` → صفحه مرور سبد و تأیید سفارش.
  - `/payment/bank` → صفحه دمو درگاه بانکی.

- **User Panel (`(panel)/user`)**:
  - `/user` → ریدایرکت به `/user/my-programs`.
  - `/user/profile` → پروفایل کاربر و تغییر رمز.
  - `/user/orders` → لیست سفارش‌های کاربر.
  - `/user/orders/[id]` → جزئیات یک سفارش خاص.
  - `/user/my-programs` → لیست برنامه‌های فعال/قبلی کاربر.
  - `/user/my-programs/[id]` → جزئیات برنامه انتخاب‌شده (تمرین و تغذیه).

- **Admin Panel (`(panel)/admin`)**:
  - `/admin` → ریدایرکت به `/admin/dashboard`.
  - `/admin/dashboard` → داشبورد مدیریتی (آمار و نمودار فروش).
  - `/admin/users` → لیست کاربران.
  - `/admin/users/[id]` → پروفایل کاربر + برنامه‌ها + وضعیت بدنی (Body) + عکس‌ها.
  - `/admin/students` → لیست شاگردان/دانشجوها (دید عملیاتی روی اجرای برنامه‌ها).
  - `/admin/students/[id]` → جزئیات یک شاگرد (وضعیت، برنامه و ...).
  - `/admin/site` → تنظیمات محتوای صفحه اصلی (فیچرها، آمار، استپ‌ها، اطلاعات تماس، تصویر هدر).
  - `/admin/plans` → مدیریت پلن‌های فروش/دوره‌ها.
  - `/admin/plans/new` → فرم ساخت پلن جدید.
  - `/admin/plans/[id]` → جزئیات یک پلن.
  - `/admin/feedback` → مدیریت پیام‌ها و فیدبک‌های سایت.

### Data Models Summary (برای طراحی بکند)

- **Plan (سایت / فروش)**:
  - از دو منبع الهام می‌گیرد:
    - کارت‌های فرانت در `ProgramsSection` (id/title/price/features).
    - مدل مدیریتی در ادمین (`mockPlans` و `planModel`).
  - **فیلدهای پیشنهادشده برای بکند**:
    - `id: string`
    - `title: string`
    - `subtitle: string`
    - `courseName: string`
    - `featuresText: string` (متن multiline برای نمایش بولت‌ها)
    - `planType: "workout" | "nutrition" | "both"`
    - `price: number`
    - `discountPrice: number` (۰ اگر تخفیف ندارد)
    - `discountPercent: number`
    - `isPopular: boolean`
    - `createdAt: ISOString`
    - `updatedAt: ISOString`

- **Order (سفارش)** – از `mockOrders`:
  - `id: string`
  - `createdAt: ISOString`
  - `status: "paid" | "pending" | "failed" | "refunded"`
  - `paymentMethod: string`
  - `trackingCode: string`
  - `items: Array<{ type: "program" | "addon"; refId: string; title: string; qty: number; price: number }>`
  - `discountPercent: number`
  - `note: string`

- **User (کاربر)** – از `mockUsers`:
  - `id: string`
  - `firstName: string`
  - `lastName: string`
  - `phone: string`
  - `activeProgram: boolean`
  - `programsCount: number`
  - `ordersCount: number`
  - `createdAt: ISOString`

- **UserProgram (برنامه‌های یک کاربر)** – از `userProgramsMockByUserId`:
  - `userId: string`
  - `programs: Array<{
      id: string;
      title: string;
      type: "workout" | "nutrition" | "both";
      status: "active" | "ended";
      startDate: ISOString;
      durationDays: number;
      remainingDays: number;
      price: number;
    }>`

- **UserBody (وضعیت بدنی + عکس‌ها)** – از `userBodyMockByUserId`:
  - `userId: string`
  - `heightCm: number`
  - `weightKg: number`
  - `photos: Array<{ id: string; url: string; name: string }>`

- **Student (شاگرد)** – از `mockStudents`:
  - `id: string`
  - `fullName: string`
  - `phone: string`
  - `status: "pending" | "active"`
  - `planTitle: string`
  - `planType: "workout" | "nutrition" | "both"`
  - `weekly: string[]` (نام روزها برای تمرین)
  - `restDays: string[]`

- **Program Template (الگوی برنامه تمرین/تغذیه)** – از `mockPrograms`:
  - `id: string`
  - `title: string`
  - `goal: string`
  - `level: string`
  - `startDate: ISOString`
  - `durationDays: number`
  - `coach: string`
  - `tags: string[]`
  - `schedule: {
      weekly: Array<"sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri">;
      restDays: همان آرایه روزهای استراحت;
    }`
  - `planByDay: {
      [dayKey]: {
        workout?: {
          title: string;
          durationMin: number;
          calories: number;
          steps: string[];
        };
        nutrition?: {
          caloriesTarget: number;
          proteinTarget: string;
          meals: Array<{ title: string; detail: string }>;
        };
      }
    }`

- **Site Settings** – از `defaultSiteSettings`:
  - `heroImage: { file?: File; url?: string } | null` (فقط سمت کلاینت)
  - `featureBullets: { title: string; items: string[] }`
  - `stats: Array<{ id: string; value: string; label: string }>`
  - `steps: Array<{ id: string; title: string; text: string }>`
  - `contactInfo: {
      address: string;
      phone: string;
      email: string;
      instagram: string;
      telegram: string;
      whatsapp: string;
    }`

- **Feedback (فیدبک کاربر)** – از `mockFeedbacks`:
  - `id: string`
  - `fullName: string`
  - `email: string`
  - `phone: string`
  - `message: string`
  - `createdAt: ISOString`

- **Dashboard Stats** – از `dashboardData`:
  - ورودی: `{ year: number }`
  - خروجی `getDashboardStats`:
    - `year: number`
    - `totalUsers: number`
    - `activeUsers: number`
    - `purchasedCourses: number`
  - خروجی `getMonthlySales`:
    - `Array<{ month: string; courses: number; sales: number }>`

### Backend Integration Notes

- در حال حاضر تمام داده‌ها mock و داخل فرانت‌اند هستند؛ اتصال به بکند یعنی:
  - جایگزینی mockها با درخواست‌های `api` (Axios) در کلاینت‌ها/صفحات.
  - تعریف endpointها متناسب با مدل‌های داده‌ای بالا (REST یا GraphQL).
  - استفاده از `NEXT_PUBLIC_API_BASE_URL` برای ست‌کردن base URL.
- در فایل‌های مدیریت (مثل `SiteSettingsClient`, `PlansClient`, `FeedbackClient`, داشبورد و ...) عمداً پیام‌هایی مثل «آماده اتصال به API» وجود دارد که نشان می‌دهد UI برای اتصال مستقیم به API طراحی شده است.

