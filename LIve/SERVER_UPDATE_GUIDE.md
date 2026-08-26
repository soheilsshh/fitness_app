# راهنمای آپدیت سرور برای تقویم شمسی

## مشکل
خطا در build: `Rollup failed to resolve import "dayjs"`

## علت
کتابخانه‌های `dayjs` و `jalaliday` روی سرور نصب نشده‌اند.

## راه حل

### گام 1: رفتن به دایرکتوری پروژه
```bash
cd /var/www/monetizeai-live-webinar
```

### گام 2: Pull کردن تغییرات از Git (اگر هنوز pull نکرده‌اید)
```bash
# اگر merge conflict دارید، ابتدا آن را حل کنید:
git merge --abort  # یا merge را complete کنید

# سپس pull کنید:
git pull origin main
# یا
git pull origin master
```

### گام 3: نصب Dependencies
```bash
npm install
```

این دستور:
- `dayjs` را نصب می‌کند
- `jalaliday` را نصب می‌کند
- تمام dependencies دیگر را هم بررسی می‌کند

### گام 4: Build کردن پروژه
```bash
cd /var/www/monetizeai-live-webinar
npm run build
```

### گام 5: Restart کردن سرویس (اگر نیاز است)
بسته به setup شما:
```bash
# اگر PM2 استفاده می‌کنید:
pm2 restart monetizeai

# یا اگر systemd:
systemctl restart monetizeai

# یا اگر nginx:
nginx -s reload
```

## اگر npm install خطا داد:

### 1. بررسی کنید که node_modules وجود دارد:
```bash
ls -la node_modules/ | grep dayjs
```

### 2. اگر وجود ندارد، پاک کنید و دوباره نصب کنید:
```bash
rm -rf node_modules package-lock.json
npm install
```

### 3. بررسی نسخه Node.js:
```bash
node --version
npm --version
```

باید Node.js >= 16 و npm >= 8 باشد.

## بررسی نهایی

بعد از npm install، بررسی کنید که پکیج‌ها نصب شده‌اند:
```bash
npm list dayjs jalaliday
```

باید چیزی شبیه این ببینید:
```
├── dayjs@1.11.19
└── jalaliday@3.1.1
```

## خلاصه دستورات (Copy-Paste):

```bash
cd /var/www/monetizeai-live-webinar
git pull
npm install
npm run build
```

اگر همه چیز موفق بود، build کامل می‌شود! 🎉
