#!/bin/bash
# Development Startup Script - Starts and keeps processes running

echo "🚀 Novara MVP - Development Environment"
echo "======================================"

# Kill any existing processes first
echo "🛑 Cleaning up existing processes..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
lsof -ti :3002 | xargs kill -9 2>/dev/null || true
sleep 2
echo "✅ Ports cleaned"

# Start backend
echo "📊 Starting backend on port 3002..."
cd backend

# Ensure .env.development exists
if [ ! -f .env.development ]; then
    echo "NODE_ENV=development
PORT=3002
USE_LOCAL_DATABASE=true
DATABASE_TYPE=sqlite
JWT_SECRET=dev_secret_key_not_for_production" > .env.development
fi

npm run local &
BACKEND_PID=$!
cd ..

# Wait for backend
echo "⏳ Waiting for backend..."
for i in {1..15}; do
    if curl -s http://localhost:3002/api/health >/dev/null 2>&1; then
        echo "✅ Backend ready"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "❌ Backend failed to start"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Start frontend
echo "🎨 Starting frontend on port 3000..."
cd frontend

# Ensure .env.development exists
if [ ! -f .env.development ]; then
    echo "VITE_API_URL=http://localhost:3002
VITE_ENV=development" > .env.development
fi

npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend
echo "⏳ Waiting for frontend..."
for i in {1..15}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Frontend ready"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "❌ Frontend failed to start"
        kill $FRONTEND_PID 2>/dev/null || true
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

echo ""
echo "🎉 SUCCESS! Your development environment is running!"
echo "=================================================="
echo ""
echo "📱 Frontend: http://localhost:3000/"
echo "🔧 Backend:  http://localhost:3002/"
echo "🏥 Health:   http://localhost:3002/api/health"
echo ""
echo "💡 Process IDs:"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "🛑 To stop all servers: ./scripts/kill-local-servers.sh"
echo ""
echo "✅ Both processes are now running in the background."
echo "   You can close this terminal and they'll keep running." 