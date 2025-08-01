#!/bin/bash

echo "🚀 Disabling rate limiting for local testing..."
echo ""

# Kill existing backend
echo "🛑 Stopping current backend..."
pkill -f "node.*server-switcher.js" || true
sleep 2

# Start backend with rate limiting disabled
echo "🔧 Starting backend with rate limiting disabled..."
cd /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp/backend

# Set environment variable to disable rate limiting
DISABLE_RATE_LIMIT=true NODE_ENV=development USE_REFACTORED_SERVER=true npx nodemon -r dotenv/config server-switcher.js dotenv_config_path=.env.local &

BACKEND_PID=$!
echo "✅ Backend started with PID: $BACKEND_PID (rate limiting disabled)"
echo ""
echo "⚠️  WARNING: Rate limiting is disabled for testing!"
echo "🛑 To restore normal operation, run: ./scripts/start-local.sh"
echo ""
echo "📊 Backend running at: http://localhost:9002"
echo "🔗 Test rapidly without 429 errors!"