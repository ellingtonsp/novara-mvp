#!/bin/bash
# Simple Development Startup Script - Reliable & Fast

echo "🚀 Novara MVP - Simple Development Start"
echo "======================================="

# Function to kill processes gracefully
cleanup_ports() {
    echo "🛑 Cleaning up ports..."
    
    # Kill any existing processes on our ports
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    lsof -ti :3002 | xargs kill -9 2>/dev/null || true
    
    # Wait a moment for processes to die
    sleep 2
    
    echo "✅ Ports cleaned"
}

# Function to start backend
start_backend() {
    echo "📊 Starting backend..."
    
    cd backend
    
    # Create .env.development if it doesn't exist
    if [ ! -f .env.development ]; then
        echo "NODE_ENV=development
PORT=3002
USE_LOCAL_DATABASE=true
DATABASE_TYPE=sqlite
JWT_SECRET=dev_secret_key_not_for_production" > .env.development
    fi
    
    # Start backend in background
    npm run local > ../backend.log 2>&1 &
    BACKEND_PID=$!
    
    cd ..
    
    # Wait for backend to be ready
    echo "⏳ Waiting for backend..."
    for i in {1..20}; do
        if curl -s http://localhost:3002/api/health >/dev/null 2>&1; then
            echo "✅ Backend ready on port 3002"
            return 0
        fi
        sleep 1
    done
    
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null || true
    return 1
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting frontend..."
    
    cd frontend
    
    # Create .env.development if it doesn't exist
    if [ ! -f .env.development ]; then
        echo "VITE_API_URL=http://localhost:3002
VITE_ENV=development" > .env.development
    fi
    
    # Start frontend in background
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    cd ..
    
    # Wait for frontend to be ready
    echo "⏳ Waiting for frontend..."
    for i in {1..20}; do
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            echo "✅ Frontend ready on port 3000"
            return 0
        fi
        sleep 1
    done
    
    echo "❌ Frontend failed to start"
    kill $FRONTEND_PID 2>/dev/null || true
    return 1
}

# Main execution
main() {
    # Cleanup first
    cleanup_ports
    
    # Start backend
    if ! start_backend; then
        echo "❌ Failed to start backend"
        exit 1
    fi
    
    # Start frontend
    if ! start_frontend; then
        echo "❌ Failed to start frontend"
        cleanup_ports
        exit 1
    fi
    
    echo ""
    echo "🎉 Development environment ready!"
    echo "================================="
    echo "🎨 Frontend: http://localhost:3000/"
    echo "📊 Backend:  http://localhost:3002/"
    echo "🏥 Health:   http://localhost:3002/api/health"
    echo ""
    echo "📋 Logs:"
    echo "   Backend:  tail -f backend.log"
    echo "   Frontend: tail -f frontend.log"
    echo ""
    echo "🛑 To stop: ./scripts/kill-local-servers.sh"
    echo ""
}

# Run with error handling
set -e
trap cleanup_ports EXIT

main 