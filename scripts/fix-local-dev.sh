#!/bin/bash

# 🔧 Fix Local Development Issues
# Resolves common local development problems

set -e

echo "🔧 Fixing Local Development Issues"
echo "=================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Kill any hanging processes
echo "🧹 Cleaning up hanging processes..."
pkill -f "npm test" || echo "No npm test processes found"
pkill -f "nodemon" || echo "No nodemon processes found"
pkill -f "node server.js" || echo "No server processes found"

# 2. Install dependencies
echo "📦 Installing dependencies..."
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Fix database permissions (if needed)
echo "🗄️ Checking database permissions..."
if [ -f "backend/data/novara-local.db" ]; then
    chmod 644 backend/data/novara-local.db || echo "Database permissions OK"
fi

# 4. Clear any temporary files
echo "🧹 Clearing temporary files..."
rm -f backend/.app-ready || echo "No .app-ready file found"
rm -f backend/data/novara-local.db-shm backend/data/novara-local.db-wal 2>/dev/null || echo "No WAL files found"

# 5. Test the fixes
echo "🧪 Testing fixes..."
echo -e "${YELLOW}Running quick test suite...${NC}"
npm test

echo -e "${GREEN}✅ Local development issues fixed!${NC}"
echo ""
echo "🚀 You can now run:"
echo "   ./scripts/start-dev-stable.sh  # Start local development"
echo "   npm test                       # Run tests (no hanging)"
echo "   npm run test:full              # Run full test suite" 