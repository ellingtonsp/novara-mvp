#!/bin/bash

# ON-01 A/B Experiment - Automated UAT Runner
# This script runs automated tests to validate the A/B test implementation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 ON-01 A/B Experiment - UAT Runner${NC}"
echo "=================================================="

# Check if servers are running
echo -e "\n${YELLOW}📡 Checking server status...${NC}"

# Test backend
if curl -s http://localhost:9002/api/health > /dev/null; then
    echo -e "✅ Backend running on http://localhost:9002"
else
    echo -e "❌ Backend not running. Please start backend first."
    exit 1
fi

# Test frontend
if curl -s http://localhost:4200 > /dev/null; then
    echo -e "✅ Frontend running on http://localhost:4200"
else
    echo -e "❌ Frontend not running. Please start frontend first."
    exit 1
fi

# Check environment variables
echo -e "\n${YELLOW}⚙️  Checking environment configuration...${NC}"
AB_TEST_ENABLED=$(grep "VITE_AB_TEST_ENABLED" frontend/.env.development | cut -d'=' -f2)
FORCE_PATH=$(grep "VITE_FORCE_ONBOARDING_PATH" frontend/.env.development | cut -d'=' -f2)
DEBUG_ENABLED=$(grep "VITE_DEBUG_AB_TEST" frontend/.env.development | cut -d'=' -f2)

echo "  VITE_AB_TEST_ENABLED: $AB_TEST_ENABLED"
echo "  VITE_FORCE_ONBOARDING_PATH: $FORCE_PATH"
echo "  VITE_DEBUG_AB_TEST: $DEBUG_ENABLED"

if [[ "$AB_TEST_ENABLED" == "true" ]]; then
    echo -e "✅ A/B test enabled"
else
    echo -e "❌ A/B test not enabled"
    exit 1
fi

# Test database schema
echo -e "\n${YELLOW}🗄️  Checking database schema...${NC}"
if sqlite3 backend/data/novara-local.db "SELECT name FROM sqlite_master WHERE type='table' AND name='users';" | grep -q "users"; then
    echo -e "✅ Users table exists"
    
    # Check for ON-01 fields
    if sqlite3 backend/data/novara-local.db "PRAGMA table_info(users);" | grep -q "baseline_completed"; then
        echo -e "✅ baseline_completed field exists"
    else
        echo -e "❌ baseline_completed field missing"
        exit 1
    fi
    
    if sqlite3 backend/data/novara-local.db "PRAGMA table_info(users);" | grep -q "onboarding_path"; then
        echo -e "✅ onboarding_path field exists"
    else
        echo -e "❌ onboarding_path field missing"
        exit 1
    fi
else
    echo -e "❌ Users table not found"
    exit 1
fi

# Test API endpoints
echo -e "\n${YELLOW}🔌 Testing API endpoints...${NC}"

# Test baseline endpoint (should require auth)
BASELINE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9002/api/users/baseline)
if [[ "$BASELINE_RESPONSE" == "401" ]]; then
    echo -e "✅ /api/users/baseline endpoint exists (returns 401 without auth)"
else
    echo -e "❌ /api/users/baseline endpoint issue (got $BASELINE_RESPONSE)"
fi

# Test user creation endpoint
USER_CREATE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:9002/api/users -H "Content-Type: application/json" -d '{}')
if [[ "$USER_CREATE_RESPONSE" == "400" ]]; then
    echo -e "✅ /api/users endpoint exists (returns 400 for empty data)"
else
    echo -e "❌ /api/users endpoint issue (got $USER_CREATE_RESPONSE)"
fi

echo -e "\n${GREEN}🎯 UAT Environment Ready!${NC}"
echo -e "${YELLOW}📋 Manual Testing Steps:${NC}"
echo ""
echo -e "1. Open browser to ${BLUE}http://localhost:4200${NC}"
echo -e "2. Open DevTools Console"
echo -e "3. Click 'Start Your Journey'"
echo -e "4. Look for console message: ${GREEN}🧪 A/B Test: FORCED PATH = $FORCE_PATH${NC}"
echo ""
echo -e "${YELLOW}Expected Behavior:${NC}"
if [[ "$FORCE_PATH" == "control" ]]; then
    echo -e "  • Standard 6-question onboarding modal should appear"
    echo -e "  • All fields: email, nickname, 3 confidence sliders, cycle stage, primary concern"
elif [[ "$FORCE_PATH" == "test" ]]; then
    echo -e "  • Fast 3-question onboarding modal should appear"
    echo -e "  • Only: email, cycle stage, primary concern"
    echo -e "  • After first check-in, BaselinePanel should appear"
else
    echo -e "  • Random path assignment (50/50 split)"
fi

echo ""
echo -e "${BLUE}📊 To change test path:${NC}"
echo -e "  Control: sed -i '' 's/VITE_FORCE_ONBOARDING_PATH=.*/VITE_FORCE_ONBOARDING_PATH=control/' frontend/.env.development"
echo -e "  Test:    sed -i '' 's/VITE_FORCE_ONBOARDING_PATH=.*/VITE_FORCE_ONBOARDING_PATH=test/' frontend/.env.development"
echo -e "  Random:  sed -i '' 's/VITE_FORCE_ONBOARDING_PATH=.*/VITE_FORCE_ONBOARDING_PATH=/' frontend/.env.development"

echo ""
echo -e "${GREEN}✅ Ready for manual UAT testing!${NC}" 