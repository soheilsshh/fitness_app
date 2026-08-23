# راهنمای کامل دیپلوی پروژه وبینار روی سرور اوبونتو

این راهنما شما را در تمام مراحل لازم برای دیپلوی بک‌اند و فرانت‌اند پروژه وبینار روی یک سرور مجازی اوبونتو (VPS) با استفاده از Nginx، Supervisor و SSL راهنمایی می‌کند.

**دامنه هدف**: `webinar.sianacademy.com`

---

### پیش‌نیازها

1.  **یک سرور مجازی (VPS)** با سیستم‌عامل **اوبونتو 22.04** یا بالاتر.
2.  **دسترسی SSH** به سرور با کاربر `root` یا یک کاربر با دسترسی `sudo`.
3.  **دامنه `webinar.sianacademy.com`** که رکورد DNS آن (A Record) به آدرس IP سرور شما اشاره می‌کند.

---

### مرحله ۱: آماده‌سازی سرور

ابتدا وارد سرور خود شوید و سیستم را به‌روز کنید.

```bash
sudo apt update && sudo apt upgrade -y
```

ابزارهای مورد نیاز مانند `git`, `unzip` و `build-essential` را نصب کنید.

```bash
sudo apt install -y git unzip build-essential
```

---

### مرحله ۲: نصب و تنظیم بک‌اند (Go)

#### ۱. نصب Go

آخرین نسخه Go را از وب‌سایت رسمی آن دانلود و نصب کنید.

```bash
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
```

مسیر Go را به `PATH` سیستم اضافه کنید.

```bash
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.profile
source ~/.profile
```

#### ۲. کلون کردن و بیلد پروژه

پروژه را از مخزن گیت خود کلون کنید.

```bash
git clone <آدرس-مخزن-گیت-شما> /var/www/monetizeai
cd /var/www/monetizeai/backend
```

وابستگی‌ها را نصب کرده و پروژه را بیلد کنید.

```bash
go mod tidy
go build -o webinar_backend ./cmd
```

یک فایل اجرایی به نام `webinar_backend` ساخته می‌شود.

#### ۳. تنظیم Supervisor برای مدیریت بک‌اند

Supervisor یک ابزار عالی برای مدیریت پردازه‌ها است که در صورت بروز خطا، برنامه شما را به طور خودکار ری‌استارت می‌کند.

```bash
sudo apt install -y supervisor
```

یک فایل کانفیگ جدید برای Supervisor ایجاد کنید.

```bash
sudo nano /etc/supervisor/conf.d/webinar_backend.conf
```

محتوای زیر را در این فایل قرار دهید:

```ini
[program:webinar_backend]
command=/var/www/monetizeai-live-webinar/backend/webinar_backend
directory=/var/www/monetizeai-live-webinar/backend
autostart=true
autorestart=true
stderr_logfile=/var/log/webinar_backend.err.log
stdout_logfile=/var/log/webinar_backend.out.log
user=root ; یا نام کاربری که با آن پروژه را اجرا می‌کنید
```

سپس Supervisor را به‌روز کرده و سرویس را استارت کنید.

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start webinar_backend
```

برای اطمینان از اجرای صحیح، وضعیت آن را بررسی کنید:

```bash
sudo supervisorctl status webinar_backend
```

---

### مرحله ۳: نصب و تنظیم فرانت‌اند (React + Vite)

#### ۱. نصب Node.js و npm

از NodeSource برای نصب نسخه جدید Node.js استفاده کنید.

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### ۲. بیلد کردن پروژه فرانت‌اند

ابتدا فایل `.env.production` را در ریشه پروژه فرانت‌اند (`/var/www/monetizeai`) ایجاد کنید:

```bash
sudo nano /var/www/monetizeai/.env.production
```

محتوای زیر را در آن قرار دهید:

```
VITE_API_BASE_URL=https://webinar.sianacademy.com/api
```

سپس وابستگی‌ها را نصب و پروژه را بیلد کنید.

```bash
cd /var/www/monetizeai
npm install
npm run build
```

فایل‌های استاتیک در پوشه `dist` ساخته می‌شوند.

---

### مرحله ۴: نصب و تنظیم Nginx

Nginx به عنوان یک وب‌سرور و پراکسی معکوس عمل می‌کند. درخواست‌ها را از کاربران دریافت کرده و آن‌ها را به سرویس مناسب (فرانت‌اند یا بک‌اند) هدایت می‌کند.

```bash
sudo apt install -y nginx
```

یک فایل کانفیگ جدید برای سایت خود در Nginx ایجاد کنید.

```bash
sudo nano /etc/nginx/sites-available/webinar.sianacademy.com
```

محتوای زیر را در این فایل قرار دهید:

```nginx
server {
    listen 80;
    server_name webinar.sianacademy.com;

    # ریدایرکت تمام درخواست‌های HTTP به HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name webinar.sianacademy.com;

    # مسیر فایل‌های SSL (در مرحله بعد ایجاد می‌شوند)
    ssl_certificate /etc/letsencrypt/live/webinar.sianacademy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/webinar.sianacademy.com/privkey.pem;

    # تنظیمات SSL
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # روت اصلی برای فایل‌های فرانت‌اند
    root /var/www/monetizeai/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    # پراکسی برای API بک‌اند
    location /api/ {
        proxy_pass http://localhost:8081; # پورت بک‌اند شما
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # پراکسی برای WebSocket (چت)
    location /api/chat {
        proxy_pass http://localhost:8081/api/chat;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # پراکسی برای استریم ویدیو (HTTP-FLV)
    location /live/ {
        proxy_pass http://localhost:8089; # پورت سرور HTTP-FLV
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

این کانفیگ را فعال کنید.

```bash
sudo ln -s /etc/nginx/sites-available/webinar.sianacademy.com /etc/nginx/sites-enabled/
sudo nginx -t # برای تست کانفیگ
sudo systemctl restart nginx
```

---

### مرحله ۵: نصب گواهی SSL با Certbot

Certbot به طور خودکار گواهی SSL را از Let's Encrypt دریافت و نصب می‌کند.

```bash
sudo apt install -y certbot python3-certbot-nginx
```

گواهی را برای دامنه خود دریافت کنید.

```bash
sudo certbot --nginx -d webinar.sianacademy.com
```

Certbot به طور خودکار فایل کانفیگ Nginx شما را برای استفاده از SSL به‌روز می‌کند.

در پایان، Nginx را ری‌استارت کنید.

```bash
sudo systemctl restart nginx
```

---

### پایان!

اکنون پروژه شما باید روی دامنه `https://webinar.sianacademy.com` به درستی در دسترس باشد. بک‌اند توسط Supervisor مدیریت می‌شود و Nginx درخواست‌ها را به صورت امن و بهینه به سرویس‌های شما هدایت می‌کند.
