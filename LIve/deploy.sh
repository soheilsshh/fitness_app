#!/bin/bash

# MonetizeAI Webinar Deployment Script
# This script sets up HTTPS for your VPS

echo "🚀 Starting MonetizeAI Webinar HTTPS Setup..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
apt install -y nginx certbot python3-certbot-nginx

# Create directories
echo "📁 Creating directories..."
mkdir -p /var/www/monetizeai-frontend
mkdir -p /var/www/monetizeai-backend

# Copy Nginx configuration
echo "⚙️  Setting up Nginx configuration..."
cp nginx.conf /etc/nginx/sites-available/monetizeai-webinar
ln -sf /etc/nginx/sites-available/monetizeai-webinar /etc/nginx/sites-enabled/

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    systemctl reload nginx
else
    echo "❌ Nginx configuration failed"
    exit 1
fi

# Get SSL certificate
echo "🔒 Getting SSL certificate..."
certbot --nginx -d live.sianmarketing.com --non-interactive --agree-tos --email your-email@example.com

# Build and deploy frontend
echo "🏗️  Building frontend..."
cd frontend
npm install
npm run build
cp -r dist/* /var/www/monetizeai-frontend/

# Set permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data /var/www/monetizeai-frontend
chmod -R 755 /var/www/monetizeai-frontend

# Build and deploy backend
echo "🏗️  Building backend..."
cd ../backend
go mod tidy
go build -o monetizeai-backend cmd/main.go
cp monetizeai-backend /var/www/monetizeai-backend/
cp config.production.yaml /var/www/monetizeai-backend/config.yaml

# Create systemd service for backend
echo "⚙️  Creating backend service..."
cat > /etc/systemd/system/monetizeai-backend.service << EOF
[Unit]
Description=MonetizeAI Webinar Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/monetizeai-backend
ExecStart=/var/www/monetizeai-backend/monetizeai-backend
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Start and enable services
echo "🚀 Starting services..."
systemctl daemon-reload
systemctl enable monetizeai-backend
systemctl start monetizeai-backend
systemctl reload nginx

# Check services status
echo "📊 Checking services status..."
systemctl status monetizeai-backend --no-pager
systemctl status nginx --no-pager

echo "✅ Deployment completed!"
echo "🌐 Frontend: https://live.sianmarketing.com"
echo "🔗 API: https://sianmarketing.com/live/api"
echo ""
echo "📝 Next steps:"
echo "1. Update your DNS records to point live.sianmarketing.com to this server"
echo "2. Test the application at https://live.sianmarketing.com"
echo "3. Monitor logs: journalctl -u monetizeai-backend -f" 