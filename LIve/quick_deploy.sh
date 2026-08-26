#!/bin/bash

# Quick Deploy Script for Workflow Engine Fixes
# This script will help you deploy fixes to the server

SERVER="root@webinar.sianacademy.com"
BACKEND_PATH="/root/monetizeai-live-webinar/backend"

echo "🚀 Quick Deploy Script"
echo "======================"
echo ""
echo "This script will help you deploy the fixes."
echo "You need to run commands manually on the server."
echo ""
echo "Step 1: First, upload the backend files to server"
echo "Run this command from your local machine:"
echo ""
echo "rsync -avz --exclude '*.log' --exclude '.git' --exclude 'main' backend/ ${SERVER}:${BACKEND_PATH}/"
echo ""
echo "Step 2: Then SSH into server and run the commands below:"
echo ""
echo "ssh ${SERVER}"
echo ""
echo "Once connected, copy and paste these commands:"
echo ""
echo "----------------------------------------"
echo "cd ${BACKEND_PATH}"
echo "go build -o main cmd/main.go"
echo "if [ \$? -eq 0 ]; then"
echo "    echo '✅ Build successful!'"
echo "    supervisorctl stop monetizeai-backend"
echo "    cp main main.backup.\$(date +%Y%m%d_%H%M%S)"
echo "    supervisorctl start monetizeai-backend"
echo "    echo '✅ Service restarted!'"
echo "    supervisorctl status monetizeai-backend"
echo "    echo ''"
echo "    echo '📋 Recent logs:'"
echo "    supervisorctl tail -50 monetizeai-backend"
echo "else"
echo "    echo '❌ Build failed!'"
echo "    exit 1"
echo "fi"
echo "----------------------------------------"
echo ""
echo "Press Enter to continue with Step 1 (upload files)..."
read

echo "📦 Uploading files..."
rsync -avz --exclude '*.log' --exclude '.git' --exclude 'main' --exclude '*.backup' \
    backend/ ${SERVER}:${BACKEND_PATH}/

if [ $? -eq 0 ]; then
    echo "✅ Files uploaded successfully!"
    echo ""
    echo "Now SSH into server and run the build commands:"
    echo "ssh ${SERVER}"
    echo ""
    echo "Then run:"
    echo "cd ${BACKEND_PATH}"
    echo "go build -o main cmd/main.go"
    echo "supervisorctl stop monetizeai-backend"
    echo "cp main main.backup.\$(date +%Y%m%d_%H%M%S)"
    echo "supervisorctl start monetizeai-backend"
    echo "supervisorctl status monetizeai-backend"
else
    echo "❌ Upload failed! Please check your connection."
    exit 1
fi

