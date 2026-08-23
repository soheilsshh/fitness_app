# راهنمای دیباگ مشکل دسترسی‌ها

## مشکل گزارش شده
کاربران جدید (مثل `admin4`) دسترسی‌های اشتباه دارند:
- دسترسی‌هایی که نباید داشته باشند را دارند
- در لیست کاربران "0 دسترسی" نمایش داده می‌شود
- در پروفایل "هیچ دسترسی تعریف نشده است" نمایش داده می‌شود

## تغییرات اعمال شده

### 1. Backend (`backend/cmd/main.go`)
- اطمینان از ایجاد صحیح جدول `admin_user_permissions`
- بررسی وجود جدول و ایجاد آن در صورت نیاز

### 2. Backend (`backend/controllers/admin_users.go`)
- افزودن لاگ‌گذاری کامل برای ردیابی مشکل
- بررسی تعداد رکوردها در جدول `admin_user_permissions` بعد از ذخیره

### 3. Frontend (`src/hooks/usePermissions.ts`)
- حذف fallback برای کاربران غیر admin
- لاگ‌گذاری دقیق برای دسترسی‌های رد شده

## مراحل دیباگ

### مرحله 1: بررسی لاگ‌های سرور
1. سرور Go را restart کنید
2. یک کاربر جدید ایجاد کنید (مثلاً `test_user`)
3. به او 2 دسترسی بدهید: `dashboard.view` و `dashboard.export`
4. در لاگ‌های سرور به دنبال این پیام‌ها بگردید:

```
📋 Assigning 2 permissions to new user test_user: [dashboard.view dashboard.export]
✅ Found 2 permissions in DB to assign
   1. dashboard.view (ID: X)
   2. dashboard.export (ID: Y)
✅ Successfully assigned 2 permissions via Association
✅ Verification: Found 2 records in admin_user_permissions for user Z
✅ Reloaded user test_user with 2 permissions
✅ Admin user created: test_user (ID: Z) with 2 permissions
```

### مرحله 2: بررسی پایگاه داده
اجرای اسکریپت SQL (`backend/scripts/check_permissions.sql`):

```bash
mysql -u root -p monetizeai < backend/scripts/check_permissions.sql
```

یا به صورت دستی:

```sql
-- بررسی کاربر test_user
SELECT 
    au.username,
    ap.key as permission_key,
    ap.name as permission_name
FROM admin_users au
LEFT JOIN admin_user_permissions aup ON au.id = aup.admin_user_id
LEFT JOIN admin_permissions ap ON aup.admin_permission_id = ap.id
WHERE au.username = 'test_user';
```

**انتظار**: باید 2 رکورد برگردد با `dashboard.view` و `dashboard.export`

### مرحله 3: بررسی API Response
1. در مرورگر، Console را باز کنید (F12)
2. به تب Network بروید
3. یک کاربر جدید ایجاد کنید
4. درخواست `POST /admin/admin-users` را پیدا کنید
5. Response را بررسی کنید:

```json
{
  "user": {
    "id": 5,
    "username": "test_user",
    "is_active": true,
    "permissions": [
      {
        "id": 1,
        "key": "dashboard.view",
        "name": "مشاهده داشبورد",
        "category": "dashboard"
      },
      {
        "id": 2,
        "key": "dashboard.export",
        "name": "خروجی داشبورد",
        "category": "dashboard"
      }
    ]
  }
}
```

**اگر `permissions` خالی است**: مشکل در backend است
**اگر `permissions` پر است**: مشکل در frontend است

### مرحله 4: بررسی لاگ‌های Frontend
1. Console مرورگر را باز کنید
2. با کاربر جدید (`test_user`) وارد شوید
3. به دنبال این پیام‌ها بگردید:

```
[Permissions] Loaded 2 permissions for user: test_user
```

**اگر "Loaded 0 permissions" نمایش داده شد**:
- مشکل در endpoint `/admin/admin-users/me/permissions` است
- بررسی کنید که آیا token درست است

**اگر "Loaded 2 permissions" نمایش داده شد**:
- دسترسی‌ها به درستی بارگذاری شده‌اند
- مشکل در `hasPermission` یا UI است

### مرحله 5: تست دسترسی‌ها
با کاربر `test_user` وارد شوید و:

1. **تست Dashboard**:
   - باید بتوانید داشبورد را ببینید ✅
   - باید بتوانید خروجی Excel بگیرید ✅
   - نباید بتوانید کاربران را ببینید ❌
   - نباید بتوانید SMS ببینید ❌

2. **تست Profile**:
   - تنظیمات → پروفایل من
   - باید 2 دسترسی نمایش داده شود
   - باید `dashboard.view` و `dashboard.export` را ببینید

3. **بررسی Console**:
   - اگر سعی کنید به بخش SMS بروید، باید این لاگ را ببینید:
   ```
   [Permissions] User "test_user" denied access to: sms.view
   ```

## مشکلات احتمالی و راه‌حل‌ها

### مشکل 1: جدول `admin_user_permissions` وجود ندارد
**علامت**: خطای SQL در لاگ‌های سرور
**راه‌حل**: 
```sql
CREATE TABLE IF NOT EXISTS `admin_user_permissions` (
  `admin_user_id` bigint unsigned NOT NULL,
  `admin_permission_id` bigint unsigned NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`admin_user_id`,`admin_permission_id`),
  KEY `idx_admin_user_permissions_admin_user_id` (`admin_user_id`),
  KEY `idx_admin_user_permissions_admin_permission_id` (`admin_permission_id`),
  CONSTRAINT `fk_admin_user_permissions_admin_user` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_admin_user_permissions_admin_permission` FOREIGN KEY (`admin_permission_id`) REFERENCES `admin_permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### مشکل 2: دسترسی‌ها ذخیره می‌شوند اما بارگذاری نمی‌شوند
**علامت**: در DB رکورد وجود دارد اما API خالی برمی‌گرداند
**راه‌حل**: بررسی `Preload("Permissions")` در تمام query ها

### مشکل 3: Frontend همه دسترسی‌ها را می‌دهد
**علامت**: کاربر به همه چیز دسترسی دارد
**راه‌حل**: بررسی `hasPermission` در `usePermissions.ts`

### مشکل 4: دسترسی‌ها در لیست کاربران "0" نمایش داده می‌شود
**علامت**: در UI "0 دسترسی" نمایش داده می‌شود
**راه‌حل**: بررسی `fetchData` در `AdminUsersManager.tsx`

## دستورات مفید

### پاک کردن همه کاربران (به جز admin)
```sql
DELETE FROM admin_user_permissions WHERE admin_user_id != 1;
DELETE FROM admin_users WHERE username != 'admin';
```

### اضافه کردن دسترسی به کاربر
```sql
-- پیدا کردن ID کاربر
SELECT id FROM admin_users WHERE username = 'test_user';

-- پیدا کردن ID دسترسی
SELECT id FROM admin_permissions WHERE key = 'dashboard.view';

-- اضافه کردن دسترسی
INSERT INTO admin_user_permissions (admin_user_id, admin_permission_id, created_at)
VALUES (5, 1, NOW());
```

### بررسی تمام دسترسی‌های یک کاربر
```sql
SELECT ap.key, ap.name
FROM admin_user_permissions aup
JOIN admin_permissions ap ON aup.admin_permission_id = ap.id
WHERE aup.admin_user_id = 5;
```

## چک‌لیست نهایی

- [ ] سرور Go restart شده است
- [ ] جدول `admin_user_permissions` وجود دارد
- [ ] لاگ‌های سرور نشان می‌دهد دسترسی‌ها ذخیره شده‌اند
- [ ] Query SQL نشان می‌دهد رکوردها در DB وجود دارند
- [ ] API Response شامل `permissions` است
- [ ] Frontend لاگ می‌کند که دسترسی‌ها بارگذاری شده‌اند
- [ ] `hasPermission` به درستی کار می‌کند
- [ ] UI دسترسی‌ها را به درستی نمایش می‌دهد
- [ ] کاربر فقط به بخش‌هایی که دسترسی دارد، می‌تواند دسترسی پیدا کند

## تماس با پشتیبانی

اگر مشکل همچنان ادامه دارد، لطفاً موارد زیر را ارسال کنید:
1. لاگ‌های سرور هنگام ایجاد کاربر
2. نتیجه query های SQL
3. Screenshot از Console مرورگر
4. Screenshot از Network tab (API responses)

