#!/bin/bash

echo "🧪 ON-01 INCREMENTAL VALIDATION TEST"
echo "===================================="
echo "This script runs the ON-01 A/B test validation step-by-step"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if backend is running
echo -e "${BLUE}🔍 Checking backend status...${NC}"
if curl -s http://localhost:9002/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on port 9002${NC}"
else
    echo -e "${RED}❌ Backend not running on port 9002${NC}"
    echo -e "${YELLOW}Starting backend...${NC}"
    
    # Start backend in background
    cd backend
    NODE_ENV=development USE_LOCAL_DATABASE=true PORT=9002 node server.js > ../on01-test-backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    echo -e "${YELLOW}⏳ Waiting for backend to initialize...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:9002/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend started successfully${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ Backend failed to start within 30 seconds${NC}"
            echo -e "${YELLOW}Check logs: on01-test-backend.log${NC}"
            exit 1
        fi
        sleep 1
    done
fi

# Check if frontend is running
echo -e "\n${BLUE}🔍 Checking frontend status...${NC}"
if curl -s http://localhost:4200 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running on port 4200${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend not running on port 4200${NC}"
    echo -e "${YELLOW}You may want to start it with: cd frontend && npm run dev${NC}"
fi

# Set environment variables for testing
export VITE_AB_TEST_ENABLED=true
export VITE_DEBUG_AB_TEST=true
export NODE_ENV=development

echo -e "\n${BLUE}🧪 Starting ON-01 incremental validation test...${NC}"
echo -e "${YELLOW}This test will pause at each step for your review.${NC}"
echo -e "${YELLOW}Press Enter to continue at each prompt.${NC}"
echo ""

# Run the test
node test-ON-01-step-by-step.js

# Check test results
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ON-01 test completed successfully!${NC}"
    
    # Check if report was generated
    if [ -f "ON-01-test-report.json" ]; then
        echo -e "${BLUE}📄 Test report generated: ON-01-test-report.json${NC}"
        
        # Show summary
        echo -e "\n${BLUE}📋 Quick Summary:${NC}"
        node -e "
            const report = JSON.parse(require('fs').readFileSync('ON-01-test-report.json'));
            const { passed, total, successRate } = report.summary;
            console.log(\`✅ \${passed}/\${total} tests passed (\${successRate}%)\`);
            
            if (successRate >= 90) {
                console.log('🎯 Status: PRODUCTION READY');
            } else if (successRate >= 70) {
                console.log('🎯 Status: NEARLY READY - Minor issues to resolve');
            } else {
                console.log('🎯 Status: NEEDS WORK - Significant issues to address');
            }
        "
    fi
else
    echo -e "\n${RED}❌ ON-01 test failed${NC}"
    echo -e "${YELLOW}Check the output above for details${NC}"
fi

# Cleanup
if [ ! -z "$BACKEND_PID" ]; then
    echo -e "\n${YELLOW}🧹 Cleaning up test backend...${NC}"
    kill $BACKEND_PID 2>/dev/null
    rm -f on01-test-backend.log
fi

echo -e "\n${BLUE}🏁 ON-01 incremental validation complete${NC}" 