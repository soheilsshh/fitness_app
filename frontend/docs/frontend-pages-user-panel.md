## پنل کاربر (`(panel)/user`)

این فایل تمام صفحات زیر `/user` را به همراه رفتار UI و نیازمندی‌های بک‌اند توضیح می‌دهد.

### لایوت پنل کاربر

- **فایل**: `src/app/(panel)/user/layout.js`
- **کامپوننت**: `PanelShell` (`src/app/(panel)/user/_components/PanelShell.js`)
- **ساختار**:
  - سایدبار (`Sidebar`) با آیتم‌های ناوبری (`NavItem`)، شامل لینک‌هایی مثل:
    - داشبورد/خانه کاربر
    - برنامه‌های من
    - سفارش‌ها
    - پروفایل
  - `Topbar` در بالای محتوا:
    - نشان‌دادن عنوان صفحه فعلی.
    - دکمه‌های ورود/خروج و شاید میانبرها.
  - محتوای صفحه به عنوان `children` داخل شِل قرار می‌گیرد.

### روت ایندکس پنل کاربر

- **Route**: `/user`
- **فایل**: `src/app/(panel)/user/page.js`
- **رفتار**:
  - با استفاده از `redirect("/user/my-programs")` کاربر را به صفحه «برنامه‌های من» هدایت می‌کند.
  - نیازی به بک‌اند جداگانه ندارد، اما نشان می‌دهد که صفحه اصلی پنل، صفحه برنامه‌هاست.

---

## پروفایل کاربر

- **Route**: `/user/profile`
- **فایل**: `src/app/(panel)/user/profile/page.js`
- **کامپوننت**: `ProfileClient` (`profile/_components/ProfileClient.js`)

### رفتار UI (کلی)

- نمایش اطلاعات کاربر (نام، شماره موبایل و سایر فیلدها، بسته به UI).
- امکان **تغییر رمز عبور** از طریق `ChangePasswordModal`.

### نیازمندی‌های بک‌اند

- Endpoint برای **خواندن اطلاعات پروفایل**:
  - GET `/me`
    - استفاده از توکن احراز هویت برای شناسایی کاربر.
    - خروجی: مدل `User` (یا مدل گسترده‌تر شامل فیلدهای اضافی).

- Endpoint برای **به‌روزرسانی پروفایل**:
  - PATCH `/me`
    - ورودی: فیلدهایی که کاربر اجازه تغییرشان را دارد (نام، ایمیل و ...).

- Endpoint برای **تغییر رمز عبور**:
  - POST `/me/change-password`
    - بدنه پیشنهادی: `{ currentPassword: string, newPassword: string }`
    - خطاها: رمز فعلی اشتباه، سیاست پیچیدگی رمز و ...

---

## لیست سفارش‌های کاربر

- **Route**: `/user/orders`
- **فایل**: `src/app/(panel)/user/orders/page.js`
- **کامپوننت**: `OrdersListClient` (`orders/_components/OrdersListClient.js`)
- **داده فعلی**:
  - از `mockOrders` (`orders/_components/ordersMock.js`) استفاده می‌کند که ساختار سفارش را به شکل زیر دارد:
    - `id: string`
    - `createdAt: ISOString`
    - `status: "paid" | "pending" | "failed" | "refunded"`
    - `paymentMethod: string`
    - `trackingCode: string`
    - `items: Array<{ type: "program" | "addon"; refId: string; title: string; qty: number; price: number }>`
    - `discountPercent: number`
    - `note: string`

### رفتار UI (کلی)

- نمایش لیست سفارش‌ها با امکان:
  - فیلتر بر اساس وضعیت (`status`).
  - صفحه‌بندی (pagination) با استفاده از mock طولانی.
  - کلیک روی هر سفارش و رفتن به جزئیات (`/user/orders/[id]`).

### نیازمندی‌های بک‌اند

- Endpoint:
  - GET `/me/orders`
    - ورودی: پارامترهای query برای صفحه‌بندی و فیلتر (مثلاً `page`, `pageSize`, `status`).
    - خروجی:
      - `items: Order[]`
      - `page`, `pageSize`, `total`

- مدل `Order` باید با مدل استفاده‌شده در ادمین هم‌تراز باشد (در overview آمده است).

---

## جزئیات سفارش

- **Route**: `/user/orders/[id]`
- **فایل**: `src/app/(panel)/user/orders/[id]/page.js`
- **کامپوننت**: `OrderDetailsClient` (`orders/_components/OrderDetailsClient.js`)

### رفتار UI (کلی)

- نمایش:
  - وضعیت سفارش، تاریخ، کد رهگیری، روش پرداخت.
  - آیتم‌های داخل سفارش (برنامه‌ها، addons).
  - جمع کل، تخفیف و یادداشت‌ها.

### نیازمندی‌های بک‌اند

- Endpoint:
  - GET `/me/orders/:id`
    - خروجی: یک `Order` کامل (مشخصات بالا).

- ممکن است لازم باشد endpoint عمومی `/orders/:id` فقط توسط مدیر/ادمین قابل استفاده باشد؛ برای کاربر معمولی حتماً باید احراز هویت شود تا فقط سفارش‌های خودش را ببیند.

---

## برنامه‌های من (لیست)

- **Route**: `/user/my-programs`
- **فایل**: `src/app/(panel)/user/my-programs/page.js`
- **کامپوننت**: `MyProgramsListClient` (`my-programs/_components/MyProgramsListClient.js`)
- **داده فعلی**:
  - از `mockPrograms` (`my-programs/_components/mock.js`) استفاده می‌کند (الگوی کلی Program Template را در overview شرح دادیم).
  - هر برنامه شامل اطلاعات هدف، سطح، تاریخ شروع، مدت، مربی، تگ‌ها، `schedule` و `planByDay` است.

### رفتار UI (کلی)

- نمایش کارت برای هر برنامه کاربر:
  - عنوان، هدف، سطح، تاریخ شروع، مدت.
  - وضعیت برنامه (فعال / تمام‌شده).
  - لینک به جزئیات `/user/my-programs/[id]`.
- کنترل‌ها:
  - فیلترها (`FilterChips`) برای فیلتر موقعیت برنامه‌ها (مثلاً active/ended).
  - امکان صفحه‌بندی با `Pagination`.

### نیازمندی‌های بک‌اند

- Endpoint:
  - GET `/me/programs`
    - خروجی:
      - `programs: Array<UserProgram>`
        - هر `UserProgram` به یک Program Template اصلی (الگوی تمرین/تغذیه) متصل است.

- برای نمایش جزئیات برنامه در ادمین و پنل کاربر بهتر است:
  - مدل `UserProgram` شامل `programTemplateId` باشد.
  - یک endpoint جدا برای `ProgramTemplate`ها داشته باشیم:
    - GET `/program-templates` (یا `/programs/templates`) → برای ادمین و ساخت برنامه‌ها.

---

## جزئیات برنامه کاربر

- **Route**: `/user/my-programs/[id]`
- **فایل**: `src/app/(panel)/user/my-programs/[id]/page.js`
- **کامپوننت**: `ProgramDetailsClient` (`my-programs/_components/ProgramDetailsClient.js`)

### رفتار UI (کلی)

- نمایش:
  - جزئیات کامل برنامه:
    - هدف، سطح، مربی، مدت، تاریخ شروع، تگ‌ها.
  - **هفته/روزها**:
    - تقویم هفتگی (Days of week) بر اساس `schedule.weekly` و `restDays`.
  - **برای هر روز**:
    - در صورت وجود `workout`: عنوان تمرین، مدت (دقیقه), کالری تقریبی, لیست تمرین‌ها.
    - در صورت وجود `nutrition`: کالری هدف، پروتئین هدف، لیست وعده‌ها.

### نیازمندی‌های بک‌اند

- Endpoint:
  - GET `/me/programs/:id`
    - خروجی:
      - یا تمام ساختار `UserProgram` + `planByDay` همانند mock.
      - یا `UserProgram` + رفرنس به `ProgramTemplate` که در سمت سرور join/expand شود.

- با توجه به اینکه `mockPrograms` ساختار template را دارد، پیشنهاد:
  - در بک‌اند:
    - `ProgramTemplate` (ساختار کلی برنامه).
    - `UserProgram` (انتساب برنامه به کاربر + وضعیت و پیشرفت).

---

## نیازمندی‌های امنیت و احراز هویت در پنل کاربر

- تمام روت‌های زیر `/user` باید **فقط برای کاربران لاگین‌شده** قابل دسترسی باشد.
- پیشنهاد:
  - استفاده از middleware در Next.js (یا چک احراز هویت در لایه API) که:
    - اگر توکن معتبر نبود، ریدایرکت به `/auth/login` انجام شود.
  - در بک‌اند:
    - تمام endpointهای `GET /me/*`، `GET /me/orders`, `GET /me/programs` و ... باید توکن JWT / سشن معتبر را بررسی کنند.

