#!/bin/bash

set -e

echo "Installing dependencies..."
npm install

echo "Building Next.js static export into dist/..."
npm run build

echo "Done. Upload frontend/dist/ to the server:"
echo "  rsync -av --delete dist/ root@fitinoo.ir:/var/www/fitinoo/frontend/dist/"
