#!/bin/bash

set -e

echo "Installing dependencies..."
npm install

echo "Building static SPA export into dist/..."
npm run build

echo "Done. Serve frontend/dist with nginx (see nginx.conf.example)."
