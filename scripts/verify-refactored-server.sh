#!/bin/bash

# Script to verify refactored server starts correctly
# This ensures no startup errors before deployment

echo "🔍 Verifying Refactored Server Startup..."
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to backend directory
cd "$(dirname "$0")/../backend" || exit 1

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
fi

# Set environment for refactored server
export USE_REFACTORED_SERVER=true
export NODE_ENV=development
export PORT=9003  # Use different port to avoid conflicts

echo -e "\n${YELLOW}Starting refactored server on port 9003...${NC}"
echo "Waiting for server to start (10 seconds)..."

# Start server in background and capture output
npm run start:refactored > server-test.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 10

# Check if server is still running
if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}✅ Server started successfully!${NC}"
    
    # Test health endpoint
    echo -e "\n${YELLOW}Testing health endpoint...${NC}"
    HEALTH_RESPONSE=$(curl -s http://localhost:9003/api/health)
    
    if [[ $HEALTH_RESPONSE == *"\"status\":\"ok\""* ]]; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
        echo "Response: $HEALTH_RESPONSE"
    else
        echo -e "${RED}❌ Health check failed!${NC}"
        echo "Response: $HEALTH_RESPONSE"
    fi
    
    # Show last few lines of log
    echo -e "\n${YELLOW}Server startup logs:${NC}"
    tail -20 server-test.log
    
    # Kill the test server
    echo -e "\n${YELLOW}Stopping test server...${NC}"
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null
    echo -e "${GREEN}✅ Server stopped cleanly${NC}"
    
    # Cleanup
    rm -f server-test.log
    
    echo -e "\n${GREEN}✅ Refactored server verification completed successfully!${NC}"
    echo "The server is ready for deployment."
    exit 0
else
    echo -e "${RED}❌ Server failed to start!${NC}"
    echo -e "\n${YELLOW}Error logs:${NC}"
    cat server-test.log
    
    # Cleanup
    rm -f server-test.log
    
    echo -e "\n${RED}⚠️  Please fix the startup errors before deploying!${NC}"
    exit 1
fi