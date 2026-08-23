# راهنمای Build و Deploy تغییرات Frontend

## مشکل
تغییرات در فایل‌های TypeScript (مثل `CommentScheduler.ts`) فقط زمانی روی سرور اعمال می‌شوند که:
1. پروژه build شود (تبدیل TypeScript به JavaScript)
2. فایل‌های build شده به سرور آپلود شوند

## مراحل Build و Deploy

### مرحله 1: Build کردن Frontend (محلی)

```bash
# 1. وارد پوشه پروژه شوید
cd /Users/hoseinabsian/Desktop/monetizeai-live-webinar

# 2. وابستگی‌ها را نصب کنید (اگر قبلاً نصب نشده)
npm install

# 3. پروژه را build کنید
npm run build
```

این دستور:
- فایل‌های TypeScript را به JavaScript تبدیل می‌کند
- کدها را بهینه می‌کند
- فایل‌های نهایی را در پوشه `dist/` قرار می‌دهد

### مرحله 2: آپلود فایل‌های Build شده به سرور

بعد از build، باید محتوای پوشه `dist/` را به سرور آپلود کنید:

**گزینه 1: استفاده از SCP**

```bash
# آپلود فایل‌های dist به سرور
scp -r dist/* root@YOUR_SERVER_IP:/var/www/monetizeai-live-webinar/dist/

# یا اگر مسیر متفاوت است:
scp -r dist/* root@YOUR_SERVER_IP:/var/www/monetizeai-frontend/
```

**گزینه 2: استفاده از rsync (بهتر است)**

```bash
# rsync برای آپلود فقط فایل‌های تغییر کرده
rsync -avz --delete dist/ root@YOUR_SERVER_IP:/var/www/monetizeai-live-webinar/dist/
```

**گزینه 3: دستی از طریق FTP/SFTP**

فایل‌های داخل پوشه `dist/` را به سرور آپلود کنید.

### مرحله 3: پاک کردن Cache مرورگر

بعد از آپلود، کاربران باید cache مرورگر را پاک کنند:

- **Chrome/Edge**: `Ctrl+Shift+Delete` (Windows) یا `Cmd+Shift+Delete` (Mac)
- **Safari**: `Cmd+Option+E`
- **Firefox**: `Ctrl+Shift+Delete`

یا می‌توانند Hard Refresh کنند:
- **Windows**: `Ctrl+F5` یا `Ctrl+Shift+R`
- **Mac**: `Cmd+Shift+R`

### مرحله 4: بررسی

1. فایل‌های build شده را بررسی کنید:
   ```bash
   ls -la dist/assets/
   ```

2. در مرورگر، Developer Tools را باز کنید (F12)
3. به تب Network بروید
4. صفحه را refresh کنید
5. فایل `index-*.js` را باز کنید و جستجو کنید: `COMMENT_TIME_OFFSET`
6. باید مقدار `60` را ببینید

## دستور سریع (یک خط)

```bash
npm run build && rsync -avz --delete dist/ root@YOUR_SERVER_IP:/var/www/monetizeai-live-webinar/dist/
```

## نکات مهم

1. **همیشه بعد از تغییر فایل‌های TypeScript باید build کنید**
2. **فقط فایل‌های داخل `dist/` را آپلود کنید، نه `src/`**
3. **cache مرورگر ممکن است باعث شود فایل قدیمی نمایش داده شود**
4. **اگر از CDN استفاده می‌کنید، ممکن است نیاز به invalidate cache باشد**

## بررسی اینکه Build موفق بوده

بعد از build، فایل‌های زیر باید در `dist/` وجود داشته باشند:
- `index.html`
- `assets/index-*.js` (فایل JavaScript اصلی)
- `assets/index-*.css` (فایل CSS اصلی)
- سایر فایل‌های استاتیک

## عیب‌یابی

### اگر بعد از build هنوز مشکل دارید:

1. بررسی کنید که فایل‌های جدید آپلود شده‌اند:
   ```bash
   # روی سرور
   ls -lth /var/www/monetizeai-live-webinar/dist/assets/ | head -5
   ```

2. بررسی کنید که Nginx فایل‌های جدید را سرو می‌کند:
   ```bash
   # روی سرور
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. cache مرورگر را کاملاً پاک کنید

4. در Developer Tools، Network tab را باز کنید و "Disable cache" را فعال کنید

