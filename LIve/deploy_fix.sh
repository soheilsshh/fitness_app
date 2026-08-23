#!/bin/bash

# Script to deploy workflow engine fixes to server
# Run this from your local machine

echo "🚀 Starting deployment process..."

# Server details
SERVER="webinar.sianacademy.com"
USER="root"
PASSWORD="Ho3sinWebinar@2024"

# Expected backend path (adjust if different)
BACKEND_PATH="/root/monetizeai-live-webinar/backend"
# Or try common paths:
# BACKEND_PATH="/var/www/monetizeai-backend"
# BACKEND_PATH="/home/webinar/backend"

echo "📦 Step 1: Uploading files to server..."
echo "Please run these commands manually:"

cat << 'EOF'

# Option 1: Using SCP to upload files
scp -r backend/ root@webinar.sianacademy.com:/root/monetizeai-live-webinar/

# Option 2: Using rsync (better for incremental updates)
rsync -avz --exclude '*.log' --exclude '.git' backend/ root@webinar.sianacademy.com:/root/monetizeai-live-webinar/backend/

EOF

echo ""
echo "📋 Step 2: SSH into server and run these commands:"
echo ""

cat << 'EOF'
# SSH into server
ssh root@webinar.sianacademy.com

# Once connected, run these commands:

# 1. Navigate to backend directory
cd /root/monetizeai-live-webinar/backend
# OR if different path:
# cd /var/www/monetizeai-backend
# cd /home/webinar/backend

# 2. Pull latest code (if using git)
# git pull origin main

# 3. Build the application
echo "🔨 Building application..."
go build -o main cmd/main.go

# 4. Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Check errors above."
    exit 1
fi

# 5. Stop the current service
echo "🛑 Stopping service..."
supervisorctl stop monetizeai-backend
# OR if using systemd:
# systemctl stop monetizeai-backend
# OR if running directly:
# pkill -f "monetizeai-backend" || pkill -f "main"

# 6. Backup old binary (optional but recommended)
if [ -f main ]; then
    cp main main.backup.$(date +%Y%m%d_%H%M%S)
    echo "💾 Backup created"
fi

# 7. Restart the service
echo "🚀 Starting service..."
supervisorctl start monetizeai-backend
# OR if using systemd:
# systemctl start monetizeai-backend

# 8. Check service status
echo "📊 Checking service status..."
supervisorctl status monetizeai-backend
# OR if using systemd:
# systemctl status monetizeai-backend

# 9. Check logs for errors
echo "📋 Recent logs:"
supervisorctl tail -100 monetizeai-backend
# OR if using systemd:
# journalctl -u monetizeai-backend -n 100 --no-pager

# 10. Monitor logs in real-time (optional)
# supervisorctl tail -f monetizeai-backend
# OR
# journalctl -u monetizeai-backend -f

EOF

echo ""
echo "✅ Deployment script ready!"
echo ""
echo "⚠️  IMPORTANT: Run the commands above manually on the server."
echo "   The script cannot SSH automatically for security reasons."

