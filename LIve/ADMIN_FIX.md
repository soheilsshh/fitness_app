# حل مشکل جدول admin_users

## 🔴 مشکل

```
Error 1146 (42S02): Table 'monetizeai.admin_users' doesn't exist
```

این خطا یعنی جدول `admin_users` در پایگاه داده وجود ندارد.

## ✅ راه حل

### روش 1: Restart Backend (توصیه می‌شود)

Backend را restart کنید تا migration اجرا شود و جدول ایجاد شود:

```bash
# Stop backend
# Start backend again
# Migration به صورت خودکار اجرا می‌شود و جدول admin_users ایجاد می‌شود
```

### روش 2: اجرای Migration دستی با Script

یک script Go برای ایجاد جدول و admin user:

```bash
cd backend
go run scripts/create_admin.go
```

### روش 3: ایجاد دستی با SQL

اگر نمی‌توانید backend را restart کنید، می‌توانید جدول را دستی ایجاد کنید:

```sql
-- ایجاد جدول admin_users
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(191) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_admin_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ایجاد admin user (password: admin123 - hash شده)
INSERT INTO admin_users (username, password, created_at) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW());
```

⚠️ **توجه**: بهتر است از script Go استفاده کنید تا password به درستی hash شود.

## 🔍 بررسی

بعد از ایجاد جدول، بررسی کنید:

```sql
-- بررسی وجود جدول
SHOW TABLES LIKE 'admin_users';

-- بررسی admin user
SELECT id, username, created_at FROM admin_users WHERE username = 'admin';
```

## 🔐 اطلاعات ورود

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **مهم**: بعد از اولین ورود، حتماً password را تغییر دهید!

