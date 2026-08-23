#!/bin/bash
# اسکریپت به‌روزرسانی پروژه روی سرور

echo "🚀 شروع به‌روزرسانی پروژه..."

# رفتن به پوشه پروژه
cd /root/monetizeai-live-webinar || {
    echo "❌ پوشه پروژه پیدا نشد!"
    exit 1
}

# دریافت آخرین تغییرات از git
echo "📥 دریافت آخرین تغییرات از git..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ خطا در دریافت تغییرات از git!"
    exit 1
fi

# Build کردن بک‌اند
echo "🏗️  Build کردن بک‌اند..."
cd backend
go mod tidy
go build -o webinar-server cmd/main.go

if [ $? -ne 0 ]; then
    echo "❌ خطا در build کردن بک‌اند!"
    exit 1
fi

# متوقف کردن سرور قبلی
echo "🛑 متوقف کردن سرور قبلی..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || echo "پورت 8081 آزاد است"
sleep 2

# شروع سرور جدید
echo "🚀 شروع سرور جدید..."
cd /root/monetizeai-live-webinar/backend
nohup ./webinar-server > server.log 2>&1 &
sleep 3

# بررسی وضعیت سرور
if ps aux | grep -v grep | grep -q webinar-server; then
    echo "✅ سرور با موفقیت راه‌اندازی شد!"
    echo "📊 PID سرور: $(pgrep -f webinar-server)"
    echo "📝 لاگ‌ها: tail -f /root/monetizeai-live-webinar/backend/server.log"
else
    echo "❌ سرور راه‌اندازی نشد!"
    echo "📝 بررسی لاگ‌ها: cat /root/monetizeai-live-webinar/backend/server.log"
    exit 1
fi

echo ""
echo "✅ به‌روزرسانی با موفقیت انجام شد!"
echo "🌐 سرور در حال اجرا است"

