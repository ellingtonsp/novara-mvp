#!/bin/bash
# Kill local development servers with macOS-specific handling

echo "🛑 Stopping local servers..."

# Use macOS-specific port manager for better cleanup
if [ -f "./scripts/macos-port-manager.sh" ]; then
    echo "🍎 Using macOS Port Manager..."
    ./scripts/macos-port-manager.sh clean
else
    echo "⚠️  macOS Port Manager not found, using fallback cleanup..."
    
    # Fallback cleanup
    PORTS="3000 3001 3002 4200 9002"
    for port in $PORTS; do
        PIDS=$(lsof -ti:$port 2>/dev/null)
        if [ ! -z "$PIDS" ]; then
            echo "  Killing processes on port $port: $PIDS"
            echo $PIDS | xargs kill -9 2>/dev/null || true
        fi
    done
    
    # Kill Node.js processes
    NODE_PIDS=$(pgrep -f "node server.js" 2>/dev/null)
    if [ ! -z "$NODE_PIDS" ]; then
        echo "  Killing node server.js processes: $NODE_PIDS"
        echo $NODE_PIDS | xargs kill -9 2>/dev/null || true
    fi
    
    # Kill Vite processes
    VITE_PIDS=$(pgrep -f "vite" 2>/dev/null)
    if [ ! -z "$VITE_PIDS" ]; then
        echo "  Killing vite processes: $VITE_PIDS"
        echo $VITE_PIDS | xargs kill -9 2>/dev/null || true
    fi
    
    # Kill esbuild processes (macOS specific)
    ESBUILD_PIDS=$(pgrep -f "esbuild" 2>/dev/null)
    if [ ! -z "$ESBUILD_PIDS" ]; then
        echo "  Killing esbuild processes: $ESBUILD_PIDS"
        echo $ESBUILD_PIDS | xargs kill -9 2>/dev/null || true
    fi
fi

echo "✅ Local servers stopped"

# Verify cleanup
echo "🔍 Verifying cleanup..."
if [ -f "./scripts/macos-port-manager.sh" ]; then
    ./scripts/macos-port-manager.sh verify
else
    # Fallback verification
    PORTS="3000 3001 3002 4200 9002"
    for port in $PORTS; do
        if lsof -ti:$port >/dev/null 2>&1; then
            echo "  ❌ Port $port is still in use"
        else
            echo "  ✅ Port $port is free"
        fi
    done
fi 