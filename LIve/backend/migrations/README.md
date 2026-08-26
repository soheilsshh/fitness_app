# Database Migrations

این پوشه شامل migration های دیتابیس برای پروژه است.

## Migration: Add affiliate_percentage to admin_users

### فایل: `add_affiliate_percentage_to_admin_users.sql`

این migration فیلد `affiliate_percentage` را به جدول `admin_users` اضافه می‌کند.

### نحوه اجرا:

#### روش 1: اجرای مستقیم SQL (توصیه می‌شود)

```bash
mysql -u [username] -p [database_name] < backend/migrations/add_affiliate_percentage_to_admin_users.sql
```

یا از MySQL CLI:

```sql
source backend/migrations/add_affiliate_percentage_to_admin_users.sql;
```

#### روش 2: Restart Backend (GORM AutoMigrate)

GORM به صورت خودکار فیلد جدید را اضافه می‌کند وقتی backend restart می‌شود:

```bash
# Stop backend
# Start backend again
# Migration به صورت خودکار اجرا می‌شود
```

### بررسی:

بعد از اجرای migration، بررسی کنید:

```sql
-- بررسی وجود فیلد
DESCRIBE admin_users;

-- یا
SHOW COLUMNS FROM admin_users LIKE 'affiliate_percentage';
```

### Rollback (در صورت نیاز):

اگر نیاز به حذف فیلد دارید:

```sql
ALTER TABLE admin_users DROP COLUMN affiliate_percentage;
```
