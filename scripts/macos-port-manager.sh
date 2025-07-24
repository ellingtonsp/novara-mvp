#!/bin/bash
# Novara MVP - macOS Port Manager
# Handles macOS-specific port management and process cleanup

echo "🍎 macOS Port Manager"
echo "===================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ports we use
FRONTEND_PORT=4200
BACKEND_PORT=9002

# Function to check if port is available
port_available() {
    ! lsof -i :$1 >/dev/null 2>&1
}

# Function to kill processes on a port
kill_port() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}🛑 Killing processes on port $port: $pids${NC}"
        echo $pids | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Function to kill Node.js and related processes
kill_node_processes() {
    echo -e "${YELLOW}🛑 Cleaning up Node.js processes...${NC}"
    
    # Kill Node.js processes
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    
    # Kill Vite processes
    pkill -f "vite" 2>/dev/null || true
    
    # Kill esbuild processes (common macOS issue)
    pkill -f "esbuild" 2>/dev/null || true
    
    # Kill any remaining processes in our project directory
    ps aux | grep -E "(node|vite|esbuild)" | grep "novara-mvp" | awk '{print $2}' | xargs kill -9 2>/dev/null || true
    
    sleep 2
}

# Function to check for macOS-specific issues
check_macos_issues() {
    echo -e "${BLUE}🔍 Checking for macOS-specific issues...${NC}"
    
    # Check for esbuild processes (common macOS issue)
    local esbuild_pids=$(ps aux | grep "esbuild" | grep -v grep | awk '{print $2}')
    if [ -n "$esbuild_pids" ]; then
        echo -e "${YELLOW}⚠️  Found esbuild processes: $esbuild_pids${NC}"
        echo $esbuild_pids | xargs kill -9 2>/dev/null || true
    fi
    
    # Check for orphaned Node.js processes
    local node_pids=$(ps aux | grep "node" | grep -v grep | grep -v "Cursor" | awk '{print $2}')
    if [ -n "$node_pids" ]; then
        echo -e "${YELLOW}⚠️  Found Node.js processes: $node_pids${NC}"
        echo $node_pids | xargs kill -9 2>/dev/null || true
    fi
    
    # Check for Vite processes
    local vite_pids=$(ps aux | grep "vite" | grep -v grep | awk '{print $2}')
    if [ -n "$vite_pids" ]; then
        echo -e "${YELLOW}⚠️  Found Vite processes: $vite_pids${NC}"
        echo $vite_pids | xargs kill -9 2>/dev/null || true
    fi
}

# Function to clean ports
clean_ports() {
    echo -e "${BLUE}🧹 Cleaning ports...${NC}"
    
    # Kill processes on our specific ports
    kill_port $FRONTEND_PORT
    kill_port $BACKEND_PORT
    
    # Also clean problematic ports
    kill_port 3000
    kill_port 3001
    kill_port 3002
    kill_port 5173
    
    # Kill Node.js processes
    kill_node_processes
    
    # Check for macOS-specific issues
    check_macos_issues
    
    sleep 3
}

# Function to verify ports are clean
verify_ports() {
    echo -e "${BLUE}✅ Verifying ports are clean...${NC}"
    
    if port_available $FRONTEND_PORT; then
        echo -e "${GREEN}✅ Port $FRONTEND_PORT is free${NC}"
    else
        echo -e "${RED}❌ Port $FRONTEND_PORT is still in use${NC}"
        return 1
    fi
    
    if port_available $BACKEND_PORT; then
        echo -e "${GREEN}✅ Port $BACKEND_PORT is free${NC}"
    else
        echo -e "${RED}❌ Port $BACKEND_PORT is still in use${NC}"
        return 1
    fi
    
    return 0
}

# Function to show port status
show_status() {
    echo -e "${BLUE}📊 Port Status:${NC}"
    
    if port_available $FRONTEND_PORT; then
        echo -e "${GREEN}✅ Port $FRONTEND_PORT: Available${NC}"
    else
        local pids=$(lsof -ti :$FRONTEND_PORT 2>/dev/null)
        echo -e "${RED}❌ Port $FRONTEND_PORT: In use by PIDs $pids${NC}"
    fi
    
    if port_available $BACKEND_PORT; then
        echo -e "${GREEN}✅ Port $BACKEND_PORT: Available${NC}"
    else
        local pids=$(lsof -ti :$BACKEND_PORT 2>/dev/null)
        echo -e "${RED}❌ Port $BACKEND_PORT: In use by PIDs $pids${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}🔍 Active Node.js/Vite Processes:${NC}"
    ps aux | grep -E "(node|vite|esbuild)" | grep -v grep | grep -v "Cursor" || echo "No active processes found"
}

# Function to force cleanup
force_cleanup() {
    echo -e "${RED}🚨 Force cleanup mode${NC}"
    
    # Kill everything aggressively
    pkill -f "node" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "esbuild" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    
    # Kill specific ports
    kill_port $FRONTEND_PORT
    kill_port $BACKEND_PORT
    kill_port 3000
    kill_port 3001
    kill_port 3002
    kill_port 5173
    
    sleep 5
    
    # Verify cleanup
    verify_ports
}

# Main script logic
case "${1:-status}" in
    "clean")
        clean_ports
        verify_ports
        ;;
    "force")
        force_cleanup
        ;;
    "status")
        show_status
        ;;
    "verify")
        verify_ports
        ;;
    *)
        echo "Usage: $0 {clean|force|status|verify}"
        echo ""
        echo "Commands:"
        echo "  clean   - Clean ports and processes"
        echo "  force   - Force cleanup (aggressive)"
        echo "  status  - Show current port status"
        echo "  verify  - Verify ports are available"
        echo ""
        show_status
        ;;
esac 