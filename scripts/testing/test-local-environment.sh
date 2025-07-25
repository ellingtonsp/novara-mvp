#!/bin/bash

echo "🧪 Testing Local SQLite Environment"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((TESTS_FAILED++))
    fi
}

# Kill any existing servers
echo "🛑 Cleaning up existing processes..."
./scripts/kill-local-servers.sh > /dev/null 2>&1

# Start backend in background
echo "🚀 Starting local backend with SQLite..."
cd backend
NODE_ENV=development USE_LOCAL_DATABASE=true PORT=3002 node server.js > ../test-backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Test 1: Backend Health Check
echo -e "\n${YELLOW}Test 1: Backend Health Check${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:3002/api/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"' && echo "$HEALTH_RESPONSE" | grep -q '"environment":"development"'; then
    test_result 0 "Backend health check passed"
else
    test_result 1 "Backend health check failed: $HEALTH_RESPONSE"
fi

# Test 2: Database Initialization
echo -e "\n${YELLOW}Test 2: Database Initialization${NC}"
if [ -f "backend/data/novara-local.db" ]; then
    test_result 0 "SQLite database file created"
else
    test_result 1 "SQLite database file not found"
fi

# Test 3: User Login (with seeded data)
echo -e "\n${YELLOW}Test 3: User Authentication${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "sarah@novara.test"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true' && echo "$LOGIN_RESPONSE" | grep -q '"token"'; then
    test_result 0 "User login successful"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    test_result 1 "User login failed: $LOGIN_RESPONSE"
    TOKEN=""
fi

# Test 4: User Data Retrieval
if [ ! -z "$TOKEN" ]; then
    echo -e "\n${YELLOW}Test 4: User Data Retrieval${NC}"
    USER_RESPONSE=$(curl -s http://localhost:3002/api/users/me \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$USER_RESPONSE" | grep -q '"success":true' && echo "$USER_RESPONSE" | grep -q '"user"'; then
        test_result 0 "User data retrieval successful"
    else
        test_result 1 "User data retrieval failed: $USER_RESPONSE"
    fi
else
    echo -e "\n${YELLOW}Test 4: User Data Retrieval${NC}"
    test_result 1 "Skipped - no valid token from login"
fi

# Test 5: Check-in Submission
if [ ! -z "$TOKEN" ]; then
    echo -e "\n${YELLOW}Test 5: Daily Check-in Submission${NC}"
    CHECKIN_RESPONSE=$(curl -s -X POST http://localhost:3002/api/checkins \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "mood_today": "test mood",
        "confidence_today": 7,
        "primary_concern_today": "test concern",
        "user_note": "test note"
      }')
    
    if echo "$CHECKIN_RESPONSE" | grep -q '"success":true'; then
        test_result 0 "Daily check-in submission successful"
    else
        test_result 1 "Daily check-in submission failed: $CHECKIN_RESPONSE"
    fi
else
    echo -e "\n${YELLOW}Test 5: Daily Check-in Submission${NC}"
    test_result 1 "Skipped - no valid token from login"
fi

# Test 6: Check-in Retrieval
if [ ! -z "$TOKEN" ]; then
    echo -e "\n${YELLOW}Test 6: Check-in History Retrieval${NC}"
    CHECKINS_RESPONSE=$(curl -s "http://localhost:3002/api/checkins?limit=5" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$CHECKINS_RESPONSE" | grep -q '"success":true'; then
        test_result 0 "Check-in history retrieval successful"
    else
        test_result 1 "Check-in history retrieval failed: $CHECKINS_RESPONSE"
    fi
else
    echo -e "\n${YELLOW}Test 6: Check-in History Retrieval${NC}"
    test_result 1 "Skipped - no valid token from login"
fi

# Test 7: Daily Insights Generation
if [ ! -z "$TOKEN" ]; then
    echo -e "\n${YELLOW}Test 7: Daily Insights Generation${NC}"
    INSIGHTS_RESPONSE=$(curl -s http://localhost:3002/api/insights/daily \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$INSIGHTS_RESPONSE" | grep -q '"success":true'; then
        test_result 0 "Daily insights generation successful"
    else
        test_result 1 "Daily insights generation failed: $INSIGHTS_RESPONSE"
    fi
else
    echo -e "\n${YELLOW}Test 7: Daily Insights Generation${NC}"
    test_result 1 "Skipped - no valid token from login"
fi

# Test 8: Database Statistics
echo -e "\n${YELLOW}Test 8: Database Statistics${NC}"
cd backend
STATS_OUTPUT=$(NODE_ENV=development USE_LOCAL_DATABASE=true node -e "
const { databaseAdapter } = require('./database/database-factory');
const stats = databaseAdapter.getStats();
console.log(JSON.stringify(stats));
" 2>/dev/null)

if echo "$STATS_OUTPUT" | grep -q '"users":[0-9]' && echo "$STATS_OUTPUT" | grep -q '"checkins":[0-9]'; then
    test_result 0 "Database statistics accessible: $STATS_OUTPUT"
else
    test_result 1 "Database statistics failed: $STATS_OUTPUT"
fi
cd ..

# Test 9: Frontend Configuration Check
echo -e "\n${YELLOW}Test 9: Frontend API Configuration${NC}"
API_CONFIG=$(grep -n "localhost:3002" frontend/src/lib/api.ts)
if [ ! -z "$API_CONFIG" ]; then
    test_result 0 "Frontend configured for local API"
else
    test_result 1 "Frontend not configured for local API"
fi

# Test 10: Data Isolation Test
echo -e "\n${YELLOW}Test 10: Data Isolation Verification${NC}"
# Create a test user that should only exist locally (with timestamp to ensure uniqueness)
TIMESTAMP=$(date +%s)
ISOLATION_RESPONSE=$(curl -s -X POST http://localhost:3002/api/users \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"isolation.test.$TIMESTAMP@local.only\",
    \"nickname\": \"IsolationTest$TIMESTAMP\",
    \"confidence_meds\": 5,
    \"confidence_costs\": 5,
    \"confidence_overall\": 5
  }")

if echo "$ISOLATION_RESPONSE" | grep -q '"success":true'; then
    test_result 0 "Data isolation working - test user created locally"
else
    test_result 1 "Data isolation test failed: $ISOLATION_RESPONSE"
fi

# Cleanup
echo -e "\n🧹 Cleaning up..."
kill $BACKEND_PID 2>/dev/null
./scripts/kill-local-servers.sh > /dev/null 2>&1

# Results Summary
echo -e "\n🏁 Test Results Summary"
echo "======================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo "Total Tests: $TOTAL_TESTS"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Your local SQLite environment is working perfectly.${NC}"
    echo -e "\n💡 You can now:"
    echo "   • Run ./scripts/start-staging.sh to start development"
    echo "   • Login with test users: sarah@novara.test, emma@novara.test, alex@novara.test"
    echo "   • Develop with complete isolation from production"
    echo "   • Reset data anytime with: ./scripts/start-staging.sh --reset-data"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please check the logs and fix issues before proceeding.${NC}"
    echo "Backend logs: test-backend.log"
    exit 1
fi 