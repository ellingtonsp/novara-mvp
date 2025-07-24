#!/bin/bash
set -e  # Exit on any error

echo "🚀 Starting local staging environment..."

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Kill existing processes
echo "🛑 Cleaning up existing processes..."
"$SCRIPT_DIR/kill-local-servers.sh"

# Staging environment variables
export NODE_ENV=development
export USE_LOCAL_DATABASE=true
export DATABASE_TYPE=sqlite
export JWT_SECRET=staging_test_secret
export PORT=3002

# Legacy Airtable vars (for production fallback only)
export AIRTABLE_API_KEY=patp9wk9fzHxtkVUZ.1ba015773d9bbdc098796035b0a7bfd620edfbf6cd3b5aecc88c0beb5ef6dde7
export AIRTABLE_BASE_ID=appEOWvLjCn5c7Ght

# Start backend
echo "📊 Starting local backend with SQLite database on port 3002..."
cd "$PROJECT_ROOT/backend"

# Check if backend dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Initialize and seed local database
echo "🗄️ Setting up local SQLite database..."
if [ ! -f "data/novara-local.db" ] || [ "$1" = "--reset-data" ]; then
    echo "🌱 Seeding database with test data..."
    node scripts/seed-test-data.js
fi

# Start backend in background
nohup node server.js > ../staging-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
for i in {1..10}; do
    if curl -s http://localhost:3002/api/health >/dev/null 2>&1; then
        echo "✅ Backend ready on port 3002"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ Backend failed to start after 10 seconds"
        echo "📋 Backend logs:"
        tail -20 ../staging-backend.log
        exit 1
    fi
    sleep 1
done

# Verify local database environment
HEALTH_RESPONSE=$(curl -s http://localhost:3002/api/health)
if echo "$HEALTH_RESPONSE" | grep -q '"environment":"development"'; then
    echo "✅ Backend confirmed running in LOCAL DEVELOPMENT mode with SQLite"
else
    echo "❌ Backend not in local development mode! Response: $HEALTH_RESPONSE"
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend..."
cd "$PROJECT_ROOT/frontend"

# Check if frontend dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo ""
echo "🎯 Environment Ready!"
echo "📊 Backend (staging): http://localhost:3002"
echo "🎨 Frontend: http://localhost:3001 (will start now)"
echo "🔍 Health check: http://localhost:3002/api/health"
echo ""
echo "⚠️  IMPORTANT: You are in LOCAL DEVELOPMENT mode with isolated SQLite database!"
echo "📋 Backend logs: $PROJECT_ROOT/staging-backend.log"
echo ""

# Start frontend (this will block and show output)
npm run dev 