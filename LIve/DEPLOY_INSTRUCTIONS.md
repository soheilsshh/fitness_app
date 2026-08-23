# دستورالعمل Deploy برای رفع مشکل 502

## مشکل
Backend با خطای 502 Bad Gateway crash می‌کند.

## راه حل
فایل‌های جدید compile شده و باید روی سرور deploy شوند.

## مراحل Deploy

### 1. اتصال به سرور
```bash
ssh root@webinar.sianacademy.com
# Password: Ho3sinWebinar@2024
```

### 2. رفتن به دایرکتوری Backend
```bash
cd /root/monetizeai-live-webinar/backend
# یا اگر path متفاوت است:
# cd /var/www/monetizeai-backend
# cd /home/webinar/backend
```

### 3. Pull کردن کد جدید (اگر از Git استفاده می‌کنید)
```bash
git pull origin main
# یا
git pull origin master
```

### 4. Build کردن Application
```bash
go build -o main cmd/main.go
```

### 5. بررسی موفقیت Build
```bash
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi
```

### 6. Backup گرفتن از Binary قدیمی
```bash
if [ -f main ]; then
    cp main main.backup.$(date +%Y%m%d_%H%M%S)
    echo "💾 Backup created"
fi
```

### 7. متوقف کردن Service فعلی
```bash
# اگر از Supervisor استفاده می‌کنید:
supervisorctl stop monetizeai-backend

# یا اگر از systemd استفاده می‌کنید:
systemctl stop monetizeai-backend

# یا اگر مستقیماً اجرا می‌کنید:
pkill -f "monetizeai-backend" || pkill -f "main"
```

### 8. راه‌اندازی مجدد Service
```bash
# اگر از Supervisor استفاده می‌کنید:
supervisorctl start monetizeai-backend

# یا اگر از systemd استفاده می‌کنید:
systemctl start monetizeai-backend
```

### 9. بررسی وضعیت Service
```bash
# Supervisor:
supervisorctl status monetizeai-backend

# systemd:
systemctl status monetizeai-backend
```

### 10. بررسی لاگ‌ها
```bash
# Supervisor:
supervisorctl tail -100 monetizeai-backend

# systemd:
journalctl -u monetizeai-backend -n 100 --no-pager

# Monitor real-time:
supervisorctl tail -f monetizeai-backend
# یا
journalctl -u monetizeai-backend -f
```

## اگر Build موفق نبود

### بررسی خطاهای Compile
```bash
cd /root/monetizeai-live-webinar/backend
go build ./... 2>&1 | head -50
```

### بررسی Dependencies
```bash
go mod download
go mod tidy
```

### بررسی Go Version
```bash
go version
# باید Go 1.18+ باشد
```

## اگر Service Start نشد

### بررسی لاگ‌های دقیق
```bash
# Supervisor:
supervisorctl tail -f monetizeai-backend

# systemd:
journalctl -u monetizeai-backend -f
```

### بررسی Port
```bash
netstat -tulpn | grep :8080
# یا port دیگری که استفاده می‌کنید
```

### بررسی Process
```bash
ps aux | grep main
ps aux | grep monetizeai
```

## نکات مهم

1. **قبل از Deploy**: همیشه backup بگیرید
2. **بعد از Deploy**: لاگ‌ها را بررسی کنید
3. **اگر مشکل داشت**: به backup قبلی برگردید:
   ```bash
   cp main.backup.* main
   supervisorctl restart monetizeai-backend
   ```

## تغییرات انجام شده

1. ✅ رفع خطای Generic Function در `admin_workflow.go`
2. ✅ رفع خطای Syntax در JSON response
3. ✅ رفع خطای go vet در `advanced_executor.go`
4. ✅ اضافه کردن Error Handling برای Scheduler
5. ✅ قرار دادن Scheduler در Goroutine برای جلوگیری از Crash

## تست بعد از Deploy

1. بررسی API Health:
   ```bash
   curl http://localhost:8080/api/admin/stats?filter=all
   ```

2. بررسی Login:
   ```bash
   curl -X POST http://localhost:8080/api/admin/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin"}'
   ```

3. بررسی در Browser:
   - باز کردن `https://webinar.sianacademy.com/admin`
   - تست Login
   - بررسی Dashboard

