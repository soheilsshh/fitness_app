# راهنمای راه‌اندازی پنل مدیریتی

## 🔐 اطلاعات ورود پیش‌فرض

پس از راه‌اندازی backend، admin user به صورت خودکار ایجاد می‌شود:

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **مهم**: بعد از اولین ورود، حتماً رمز عبور را تغییر دهید!

## 📝 بررسی Admin User در پایگاه داده

اگر admin user ایجاد نشده است، می‌توانید آن را به صورت دستی بررسی کنید:

### MySQL Query:

```sql
-- بررسی وجود admin user
SELECT * FROM admin_users WHERE username = 'admin';

-- در صورت عدم وجود، می‌توانید آن را دستی ایجاد کنید
-- (اما بهتر است backend را restart کنید تا به صورت خودکار ایجاد شود)
```

## 🔧 ایجاد Admin User دستی (در صورت نیاز)

اگر admin user ایجاد نشده است:

### روش 1: Restart Backend (توصیه می‌شود)

```bash
# Stop backend
# Start backend again - admin user will be created automatically
```

### روش 2: ایجاد دستی با SQL

```sql
-- Hash password برای "admin123" (با bcrypt)
-- می‌توانید از Go استفاده کنید:
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

INSERT INTO admin_users (username, password, created_at) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW());
```

**⚠️ توجه**: بهتر است از backend استفاده کنید تا password به درستی hash شود.

### روش 3: استفاده از Go Script

یک اسکریپت Go برای ایجاد admin user:

```go
package main

import (
    "log"
    "monetizeai-backend/config"
    "monetizeai-backend/controllers"
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
)

func main() {
    cfg := config.LoadConfig()
    db, err := gorm.Open(mysql.Open(cfg.GetDSN()), &gorm.Config{})
    if err != nil {
        log.Fatalf("Failed to connect: %v", err)
    }

    if err := controllers.CreateDefaultAdmin(db); err != nil {
        log.Fatalf("Failed to create admin: %v", err)
    }

    log.Println("Admin user created successfully!")
}
```

## 🔍 Troubleshooting

### مشکل: 401 Unauthorized

**علت‌های احتمالی:**

1. **Admin user ایجاد نشده است**
   - ✅ Backend را restart کنید
   - ✅ لاگ‌های backend را بررسی کنید (`✅ Default admin user created successfully`)

2. **Password اشتباه است**
   - ✅ Username: `admin`
   - ✅ Password: `admin123`

3. **Database مشکل دارد**
   - ✅ اتصال به database را بررسی کنید
   - ✅ جدول `admin_users` وجود دارد؟

### بررسی لاگ‌های Backend

```bash
# بعد از start کردن backend، باید این لاگ‌ها را ببینید:
✅ Admin user check completed successfully
✅ Default admin user created successfully (username: admin, password: admin123)
```

اگر این لاگ‌ها را نمی‌بینید:
- Backend restart نشده
- Database connection مشکل دارد
- Migration اجرا نشده

## 📞 دسترسی به پنل

1. به آدرس `/admin/login` بروید
2. Username: `admin`
3. Password: `admin123`
4. وارد شوید

بعد از ورود موفق، به `/admin/dashboard` هدایت می‌شوید.

## 🔒 تغییر Password

برای تغییر password در production، باید:

1. از backend API استفاده کنید (نیاز به endpoint جدید دارد)
2. یا مستقیماً در database تغییر دهید (با hash کردن password جدید)

**⚠️ مهم**: در production حتماً password را تغییر دهید!

