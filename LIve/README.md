# MonetizeAI Webinar Platform

A modern, full-stack webinar platform featuring live video streaming, real-time chat, and user registration. Built with React, TypeScript, Tailwind CSS, and Go (Gin), this project is designed for high engagement and seamless user experience.

## Features

- **User Registration:** Simple registration flow to access the webinar.
- **Time-based Video Streaming:** Automatically plays different videos based on the current time slot.
- **Live Chat:** Real-time chat with all users, including admin controls.
- **Responsive UI:** Mobile-friendly and visually appealing interface.
- **Admin Panel:** Endpoints for managing webinar state and chat.
- **Realistic Attendance:** Randomized viewer and chat counts for a lively atmosphere.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn-ui
- **Backend:** Go, Gin, Viper, MySQL

## Directory Structure

```
live-webinar-illusionist-main/
  backend/      # Go backend (API, streaming, chat, admin)
  src/          # React frontend (UI, pages, components)
  public/       # Static assets (videos, icons)
```

## Getting Started

### Backend

1. Install Go 1.20+ and MySQL.
2. Copy `backend/config.yaml` and set your DB credentials.
3. Run `go mod tidy` in the `backend/` directory.
4. Start the backend server:
   ```sh
   go run backend/cmd/main.go
   ```

### Frontend

1. Install Node.js and npm.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the frontend dev server:
   ```sh
   npm run dev
   ```

## API Endpoints

- `POST /api/register` — Register a user
- `GET /api/webinar` — Get webinar info
- `GET /api/chat` — Get chat messages
- `POST /api/chat` — Post a chat message
- `GET /video/:video` — Stream video files

## Video Streaming

- Place your video files in `backend/videos/` (e.g., `video1.mp4`, `video2.mp4`).
- The backend streams videos with range support and CORS enabled.

## Customization

- Edit time slots, video logic, and UI in the frontend (`src/`).
- Backend logic and API endpoints can be extended in `backend/`.


# پلتفرم وبینار MonetizeAI

پلتفرم مدرن و کامل وبینار با قابلیت پخش زنده ویدیو، چت آنلاین و ثبت‌نام کاربران. ساخته شده با React، TypeScript، Tailwind CSS و Go (Gin)، این پروژه برای تعامل بالا و تجربه کاربری بی‌نقص طراحی شده است.

## ویژگی‌ها

- **ثبت‌نام کاربران:** فرآیند ساده ثبت‌نام برای دسترسی به وبینار
- **پخش ویدیو بر اساس زمان:** پخش خودکار ویدیوهای مختلف بر اساس بازه زمانی
- **چت زنده:** چت آنلاین با تمام کاربران، شامل کنترل‌های ادمین
- **رابط کاربری واکنش‌گرا:** رابط کاربری سازگار با موبایل و جذاب
- **پنل ادمین:** نقاط پایانی برای مدیریت وضعیت وبینار و چت
- **حضور واقع‌گرایانه:** تعداد تصادفی بینندگان و پیام‌های چت برای جو زنده

## تکنولوژی‌های استفاده شده

- **فرانت‌اند:** React، TypeScript، Vite، Tailwind CSS، shadcn-ui
- **بک‌اند:** Go، Gin، Viper، MySQL

## ساختار پوشه‌ها

```
live-webinar-illusionist-main/
  backend/      # بک‌اند Go (API، پخش، چت، ادمین)
  src/          # فرانت‌اند React (UI، صفحات، کامپوننت‌ها)
  public/       # فایل‌های استاتیک (ویدیوها، آیکون‌ها)
```

## شروع کار

### بک‌اند

1. نصب Go 1.20+ و MySQL
2. کپی کردن `backend/config.yaml` و تنظیم اطلاعات پایگاه داده
3. اجرای `go mod tidy` در پوشه `backend/`
4. راه‌اندازی سرور بک‌اند:
   ```sh
   go run backend/cmd/main.go
   ```

### فرانت‌اند

1. نصب Node.js و npm
2. نصب وابستگی‌ها:
   ```sh
   npm install
   ```
3. راه‌اندازی سرور توسعه فرانت‌اند:
   ```sh
   npm run dev
   ```

## نقاط پایانی API

- `POST /api/register` — ثبت‌نام کاربر
- `GET /api/webinar` — دریافت اطلاعات وبینار
- `GET /api/chat` — دریافت پیام‌های چت
- `POST /api/chat` — ارسال پیام چت
- `GET /video/:video` — پخش فایل‌های ویدیو

## پخش ویدیو

- فایل‌های ویدیو را در `backend/videos/` قرار دهید (مثل `video1.mp4`، `video2.mp4`)
- بک‌اند ویدیوها را با پشتیبانی از range و CORS پخش می‌کند
