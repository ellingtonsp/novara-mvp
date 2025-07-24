#!/bin/bash
# Novara MVP - Development Environment Validation
# Validates that the development environment is properly configured

echo "🔍 Validating Development Environment..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
port_available() {
    ! lsof -i :$1 >/dev/null 2>&1
}

# Function to check if file exists
file_exists() {
    [ -f "$1" ]
}

# Function to check if directory exists
dir_exists() {
    [ -d "$1" ]
}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        FAILED=1
    fi
}

FAILED=0

echo ""
echo "📋 System Requirements:"
echo "----------------------"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status 0 "Node.js installed: $NODE_VERSION"
else
    print_status 1 "Node.js not installed"
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_status 0 "npm installed: $NPM_VERSION"
else
    print_status 1 "npm not installed"
fi

# Check git
if command_exists git; then
    GIT_VERSION=$(git --version)
    print_status 0 "Git installed: $GIT_VERSION"
else
    print_status 1 "Git not installed"
fi

echo ""
echo "🔧 Port Availability:"
echo "-------------------"

# Check stable ports
if port_available 4200; then
    print_status 0 "Port 4200 (frontend) available"
else
    print_status 1 "Port 4200 (frontend) in use"
fi

if port_available 9002; then
    print_status 0 "Port 9002 (backend) available"
else
    print_status 1 "Port 9002 (backend) in use"
fi

echo ""
echo "📁 File Structure:"
echo "-----------------"

# Check backend files
if dir_exists "backend"; then
    print_status 0 "Backend directory exists"
    
    if file_exists "backend/package.json"; then
        print_status 0 "Backend package.json exists"
    else
        print_status 1 "Backend package.json missing"
    fi
    
    if file_exists "backend/server.js"; then
        print_status 0 "Backend server.js exists"
    else
        print_status 1 "Backend server.js missing"
    fi
    
    if file_exists "backend/env.development.example"; then
        print_status 0 "Backend development env example exists"
    else
        print_status 1 "Backend development env example missing"
    fi
else
    print_status 1 "Backend directory missing"
fi

# Check frontend files
if dir_exists "frontend"; then
    print_status 0 "Frontend directory exists"
    
    if file_exists "frontend/package.json"; then
        print_status 0 "Frontend package.json exists"
    else
        print_status 1 "Frontend package.json missing"
    fi
    
    if file_exists "frontend/vite.config.ts"; then
        print_status 0 "Frontend vite.config.ts exists"
    else
        print_status 1 "Frontend vite.config.ts missing"
    fi
    
    if file_exists "frontend/env.development.example"; then
        print_status 0 "Frontend development env example exists"
    else
        print_status 1 "Frontend development env example missing"
    fi
else
    print_status 1 "Frontend directory missing"
fi

echo ""
echo "📦 Dependencies:"
echo "---------------"

# Check backend dependencies
if dir_exists "backend/node_modules"; then
    print_status 0 "Backend node_modules exists"
else
    print_status 1 "Backend node_modules missing (run: cd backend && npm install)"
fi

# Check frontend dependencies
if dir_exists "frontend/node_modules"; then
    print_status 0 "Frontend node_modules exists"
else
    print_status 1 "Frontend node_modules missing (run: cd frontend && npm install)"
fi

echo ""
echo "🗄️ Database:"
echo "-----------"

# Check SQLite database
if file_exists "backend/data/novara-local.db"; then
    print_status 0 "SQLite database exists"
else
    print_status 1 "SQLite database missing (will be created on first run)"
fi

echo ""
echo "🔧 Environment Configuration:"
echo "---------------------------"

# Check if environment files exist
if file_exists "backend/.env.development"; then
    print_status 0 "Backend .env.development exists"
else
    echo -e "${YELLOW}⚠️  Backend .env.development missing (copy from env.development.example)${NC}"
fi

if file_exists "frontend/.env.development"; then
    print_status 0 "Frontend .env.development exists"
else
    echo -e "${YELLOW}⚠️  Frontend .env.development missing (copy from env.development.example)${NC}"
fi

echo ""
echo "🚀 Scripts:"
echo "----------"

# Check startup scripts
if file_exists "scripts/start-dev-stable.sh"; then
    print_status 0 "Stable development script exists"
else
    print_status 1 "Stable development script missing"
fi

if file_exists "scripts/kill-local-servers.sh"; then
    print_status 0 "Kill servers script exists"
else
    print_status 1 "Kill servers script missing"
fi

echo ""
echo "📊 Summary:"
echo "----------"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Development environment is ready!${NC}"
    echo ""
    echo "🚀 To start development:"
    echo "   ./scripts/start-dev-stable.sh"
    echo ""
    echo "🛑 To stop development:"
    echo "   ./scripts/kill-local-servers.sh"
else
    echo -e "${RED}❌ Some issues found. Please fix them before starting development.${NC}"
    echo ""
    echo "💡 Common fixes:"
    echo "   - Run 'npm install' in both backend/ and frontend/ directories"
    echo "   - Copy env.example files to .env.development files"
    echo "   - Kill processes using ports 4200 and 9002"
fi

echo ""
echo "🔗 URLs (when running):"
echo "   Frontend: http://localhost:4200"
echo "   Backend:  http://localhost:9002"
echo "   Health:   http://localhost:9002/api/health" 