#!/bin/bash
# Novara MVP - Stable Development Environment
# Using conflict-free port assignments

echo "🚀 Novara MVP - Stable Development (Conflict-Free Ports)"
echo "======================================================="

# Better port assignments (avoiding common conflicts)
BACKEND_PORT=9002   # High port range, rarely used
FRONTEND_PORT=4200  # Angular default (less conflict than 3000)

echo "📊 Backend Port: $BACKEND_PORT"
echo "🎨 Frontend Port: $FRONTEND_PORT"
echo ""

# macOS-specific port cleanup
echo "🍎 macOS Port Management..."
./scripts/macos-port-manager.sh clean

# Verify ports are clean
if ! ./scripts/macos-port-manager.sh verify; then
    echo "❌ Port cleanup failed, trying force cleanup..."
    ./scripts/macos-port-manager.sh force
fi

echo "✅ Ports cleaned and verified"

# Start backend on stable port with PostgreSQL
echo "📊 Starting backend on port $BACKEND_PORT with PostgreSQL..."
cd backend

# Check if PostgreSQL is running
if ! pgrep -x "postgres" > /dev/null; then
    echo "⚠️  PostgreSQL not running. Starting it..."
    if command -v brew &> /dev/null; then
        brew services start postgresql@15
        sleep 2
    else
        echo "❌ PostgreSQL not found. Please install PostgreSQL 15+"
        exit 1
    fi
fi

# Verify PostgreSQL connection
if ! /opt/homebrew/opt/postgresql@15/bin/psql "postgresql://novara:novara_local_dev@localhost:5432/novara_local" -c "SELECT 1;" >/dev/null 2>&1; then
    echo "❌ Cannot connect to PostgreSQL database 'novara_local'"
    echo "   Please ensure PostgreSQL is set up with:"
    echo "   - Database: novara_local"
    echo "   - User: novara"
    echo "   - Password: novara_local_dev"
    exit 1
fi

echo "✅ PostgreSQL connection verified"

# Use dev:postgres command which reads from .env.local
PORT=$BACKEND_PORT npm run dev:postgres &
BACKEND_PID=$!
cd ..

# Wait for backend with proper timeout
echo "⏳ Waiting for backend..."
for i in {1..20}; do
    if curl -s http://localhost:$BACKEND_PORT/api/health >/dev/null 2>&1; then
        echo "✅ Backend ready on port $BACKEND_PORT"
        break
    fi
    if [ $i -eq 20 ]; then
        echo "❌ Backend failed to start"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Start frontend on stable port
echo "🎨 Starting frontend on port $FRONTEND_PORT..."
cd frontend

# Create optimized .env.development with proper API URL
cat > .env.development << EOF
# Novara MVP - Local Development Environment
# Stable Port Strategy: Frontend $FRONTEND_PORT, Backend $BACKEND_PORT

# API Configuration - CRITICAL for database calls
VITE_API_URL=http://localhost:$BACKEND_PORT

# Environment
VITE_ENV=development
VITE_NODE_ENV=development

# Development Settings
VITE_DEBUG=true
VITE_LOG_LEVEL=debug

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_TRACKING=true
EOF

# Start frontend with explicit port configuration
PORT=$FRONTEND_PORT npx vite --port $FRONTEND_PORT &
FRONTEND_PID=$!
cd ..

# Wait for frontend
echo "⏳ Waiting for frontend..."
for i in {1..20}; do
    if curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
        echo "✅ Frontend ready on port $FRONTEND_PORT"
        break
    fi
    if [ $i -eq 20 ]; then
        echo "❌ Frontend failed to start"
        kill $FRONTEND_PID 2>/dev/null || true
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

echo ""
echo "🎉 STABLE DEVELOPMENT ENVIRONMENT READY!"
echo "========================================"
echo ""
echo "📱 Frontend: http://localhost:$FRONTEND_PORT/"
echo "🔧 Backend:  http://localhost:$BACKEND_PORT/"
echo "🏥 Health:   http://localhost:$BACKEND_PORT/api/health"
echo ""
echo "💡 Process IDs:"
echo "   Backend:  $BACKEND_PID (port $BACKEND_PORT)"
echo "   Frontend: $FRONTEND_PID (port $FRONTEND_PORT)"
echo ""
echo "🔒 Port Strategy: Using conflict-free ports"
echo "   ❌ Avoided: 3000, 3001, 3002 (high conflict)"
echo "   ✅ Using: $BACKEND_PORT, $FRONTEND_PORT (stable)"
echo ""
echo "🗄️ Database: PostgreSQL (matching staging/production)"
echo "🔗 API URL: http://localhost:$BACKEND_PORT (configured in .env.local)"
echo "🐘 DB Connection: postgresql://novara:***@localhost:5432/novara_local"
echo ""
echo "🛑 To stop: kill $BACKEND_PID $FRONTEND_PID"
echo "   Or run: ./scripts/kill-local-servers.sh" 