#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Installing dependencies..."
npm install

echo "Building the Next.js application (this will fully compile the app)..."
npm run build

echo "Starting the production server..."
npm run start
