#!/bin/bash
set -e

echo "🚀 Starting Novara Local Development"
echo "==================================="

# Kill any existing processes on our ports
echo "🛑 Cleaning up existing processes..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# Start backend with environment file
echo "📊 Starting backend on port 3002..."
cd backend
npm run local &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend..."
sleep 3
for i in {1..10}; do
    if curl -s http://localhost:3002/api/health >/dev/null 2>&1; then
        echo "✅ Backend ready"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ Backend failed to start"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Start frontend
echo "🎨 Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎯 Development Environment Ready!"
echo "================================"
echo "📊 Backend:  http://localhost:3002/api/health"
echo "🎨 Frontend: http://localhost:3000/ (or check terminal for actual port)"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for user interrupt
trap 'echo ""; echo "🛑 Stopping servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; echo "✅ Stopped"; exit 0' INT

# Keep script running
wait 