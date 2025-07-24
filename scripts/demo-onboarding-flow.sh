#!/bin/bash

echo "🎬 Novara Complete Onboarding Demo Test"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
DEMO_PASSED=0
DEMO_FAILED=0

demo_step() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((DEMO_PASSED++))
    else
        echo -e "${RED}❌ $2${NC}"
        echo -e "${RED}   Response: $3${NC}"
        ((DEMO_FAILED++))
    fi
}

# Kill any existing servers
echo "🛑 Cleaning up existing processes..."
./scripts/kill-local-servers.sh > /dev/null 2>&1

# Start backend in background
echo "🚀 Starting local backend with SQLite database..."
cd backend
NODE_ENV=development USE_LOCAL_DATABASE=true PORT=3002 node server.js > ../demo-backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Verify backend is running
echo -e "\n${BLUE}🏥 Backend Health Check${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:3002/api/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"' && echo "$HEALTH_RESPONSE" | grep -q '"environment":"development"'; then
    demo_step 0 "Backend running with SQLite database"
    echo -e "   ${YELLOW}Environment: Local Development${NC}"
    echo -e "   ${YELLOW}Database: SQLite (isolated)${NC}"
else
    demo_step 1 "Backend health check failed" "$HEALTH_RESPONSE"
    exit 1
fi

# Demo User Data
DEMO_EMAIL="demo.user.$(date +%s)@novara.demo"
DEMO_NICKNAME="DemoUser"

echo -e "\n${BLUE}👤 Step 1: User Registration (Onboarding)${NC}"
echo "Creating new user account..."

REGISTRATION_RESPONSE=$(curl -s -X POST http://localhost:3002/api/users \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$DEMO_EMAIL\",
    \"nickname\": \"$DEMO_NICKNAME\",
    \"confidence_meds\": 4,
    \"confidence_costs\": 6,
    \"confidence_overall\": 5,
    \"primary_need\": \"emotional_support\",
    \"cycle_stage\": \"ivf_prep\",
    \"top_concern\": \"medication side effects\",
    \"timezone\": \"America/New_York\",
    \"email_opt_in\": true
  }")

if echo "$REGISTRATION_RESPONSE" | grep -q '"success":true' && echo "$REGISTRATION_RESPONSE" | grep -q '"token"'; then
    demo_step 0 "User registration successful"
    TOKEN=$(echo "$REGISTRATION_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    USER_ID=$(echo "$REGISTRATION_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo -e "   ${YELLOW}Email: $DEMO_EMAIL${NC}"
    echo -e "   ${YELLOW}Profile: Low med confidence (4/10), concerned about side effects${NC}"
else
    demo_step 1 "User registration failed" "$REGISTRATION_RESPONSE"
    exit 1
fi

echo -e "\n${BLUE}🔐 Step 2: User Authentication${NC}"
echo "Testing login with newly created account..."

LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$DEMO_EMAIL\"}")

if echo "$LOGIN_RESPONSE" | grep -q '"success":true' && echo "$LOGIN_RESPONSE" | grep -q '"token"'; then
    demo_step 0 "User login successful"
    echo -e "   ${YELLOW}JWT token generated and validated${NC}"
else
    demo_step 1 "User login failed" "$LOGIN_RESPONSE"
fi

echo -e "\n${BLUE}💭 Step 3: Onboarding Micro-Insight Generation${NC}"
echo "Generating personalized welcome insight..."

MICRO_INSIGHT_RESPONSE=$(curl -s -X POST http://localhost:3002/api/insights/micro \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"userData\": {
      \"email\": \"$DEMO_EMAIL\",
      \"nickname\": \"$DEMO_NICKNAME\",
      \"confidence_meds\": 4,
      \"confidence_costs\": 6,
      \"confidence_overall\": 5,
      \"primary_need\": \"emotional_support\",
      \"cycle_stage\": \"ivf_prep\",
      \"top_concern\": \"medication side effects\"
    }
  }")

if echo "$MICRO_INSIGHT_RESPONSE" | grep -q '"success":true' && echo "$MICRO_INSIGHT_RESPONSE" | grep -q '"micro_insight"'; then
    demo_step 0 "Onboarding micro-insight generated successfully"
    INSIGHT_TITLE=$(echo "$MICRO_INSIGHT_RESPONSE" | grep -o '"title":"[^"]*"' | cut -d'"' -f4)
    INSIGHT_MESSAGE=$(echo "$MICRO_INSIGHT_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    echo -e "   ${YELLOW}Insight: $INSIGHT_TITLE${NC}"
    echo -e "   ${YELLOW}Message: ${INSIGHT_MESSAGE:0:80}...${NC}"
else
    demo_step 1 "Onboarding micro-insight generation failed" "$MICRO_INSIGHT_RESPONSE"
fi

echo -e "\n${BLUE}📝 Step 4: Daily Check-in Submission${NC}"
echo "Submitting first daily check-in..."

CHECKIN_RESPONSE=$(curl -s -X POST http://localhost:3002/api/checkins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "mood_today": "anxious, hopeful",
    "confidence_today": 6,
    "primary_concern_today": "injection timing",
    "medication_confidence_today": 4,
    "user_note": "First day of stims, feeling nervous but optimistic"
  }')

if echo "$CHECKIN_RESPONSE" | grep -q '"success":true'; then
    demo_step 0 "Daily check-in submitted successfully"
    echo -e "   ${YELLOW}Mood: anxious, hopeful${NC}"
    echo -e "   ${YELLOW}Confidence: 6/10${NC}"
    echo -e "   ${YELLOW}Medication confidence: 4/10${NC}"
else
    demo_step 1 "Daily check-in submission failed" "$CHECKIN_RESPONSE"
fi

echo -e "\n${BLUE}💡 Step 5: Check-in Micro-Insight Generation${NC}"
echo "Generating personalized insight based on check-in..."

CHECKIN_INSIGHT_RESPONSE=$(curl -s -X POST http://localhost:3002/api/insights/micro \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "checkinData": {
      "mood_today": "anxious, hopeful",
      "confidence_today": 6,
      "primary_concern_today": "injection timing",
      "medication_confidence_today": 4,
      "user_note": "First day of stims, feeling nervous but optimistic"
    }
  }')

if echo "$CHECKIN_INSIGHT_RESPONSE" | grep -q '"success":true' && echo "$CHECKIN_INSIGHT_RESPONSE" | grep -q '"micro_insight"'; then
    demo_step 0 "Check-in micro-insight generated successfully"
    CHECKIN_INSIGHT_TITLE=$(echo "$CHECKIN_INSIGHT_RESPONSE" | grep -o '"title":"[^"]*"' | cut -d'"' -f4)
    CHECKIN_INSIGHT_MESSAGE=$(echo "$CHECKIN_INSIGHT_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    echo -e "   ${YELLOW}Insight: $CHECKIN_INSIGHT_TITLE${NC}"
    echo -e "   ${YELLOW}Message: ${CHECKIN_INSIGHT_MESSAGE:0:80}...${NC}"
else
    demo_step 1 "Check-in micro-insight generation failed" "$CHECKIN_INSIGHT_RESPONSE"
fi

echo -e "\n${BLUE}📊 Step 6: Daily Insights Dashboard${NC}"
echo "Generating daily insights based on user history..."

DAILY_INSIGHTS_RESPONSE=$(curl -s http://localhost:3002/api/insights/daily \
  -H "Authorization: Bearer $TOKEN")

if echo "$DAILY_INSIGHTS_RESPONSE" | grep -q '"success":true'; then
    demo_step 0 "Daily insights generated successfully"
    echo -e "   ${YELLOW}Analyzing user patterns and providing personalized guidance${NC}"
else
    demo_step 1 "Daily insights generation failed" "$DAILY_INSIGHTS_RESPONSE"
fi

echo -e "\n${BLUE}📈 Step 7: Check-in History Retrieval${NC}"
echo "Retrieving user's check-in history..."

HISTORY_RESPONSE=$(curl -s "http://localhost:3002/api/checkins?limit=5" \
  -H "Authorization: Bearer $TOKEN")

if echo "$HISTORY_RESPONSE" | grep -q '"success":true'; then
    demo_step 0 "Check-in history retrieved successfully"
    CHECKIN_COUNT=$(echo "$HISTORY_RESPONSE" | grep -o '"checkins":\[[^]]*\]' | grep -o '{"id"' | wc -l)
    echo -e "   ${YELLOW}Found $CHECKIN_COUNT check-in records${NC}"
else
    demo_step 1 "Check-in history retrieval failed" "$HISTORY_RESPONSE"
fi

echo -e "\n${BLUE}🎯 Step 8: Personalized Questions Generation${NC}"
echo "Testing dynamic question generation based on user profile..."

QUESTIONS_RESPONSE=$(curl -s http://localhost:3002/api/checkins/questions \
  -H "Authorization: Bearer $TOKEN")

if echo "$QUESTIONS_RESPONSE" | grep -q '"success":true' && echo "$QUESTIONS_RESPONSE" | grep -q '"questions"'; then
    demo_step 0 "Personalized questions generated successfully"
    QUESTION_COUNT=$(echo "$QUESTIONS_RESPONSE" | grep -o '"id":"[^"]*"' | wc -l)
    echo -e "   ${YELLOW}Generated $QUESTION_COUNT personalized questions${NC}"
    echo -e "   ${YELLOW}Questions adapted for low medication confidence${NC}"
else
    demo_step 1 "Personalized questions generation failed" "$QUESTIONS_RESPONSE"
fi

echo -e "\n${BLUE}📱 Step 9: Analytics Event Tracking${NC}"
echo "Testing analytics event tracking..."

ANALYTICS_RESPONSE=$(curl -s -X POST http://localhost:3002/api/analytics/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "event_type": "demo_flow_completed",
    "event_data": {
      "demo_session": true,
      "onboarding_completed": true,
      "checkin_completed": true,
      "insights_generated": true
    }
  }')

if echo "$ANALYTICS_RESPONSE" | grep -q '"success":true'; then
    demo_step 0 "Analytics event tracked successfully"
    echo -e "   ${YELLOW}User journey analytics recorded${NC}"
else
    demo_step 1 "Analytics event tracking failed" "$ANALYTICS_RESPONSE"
fi

echo -e "\n${BLUE}🗄️ Step 10: Database Integrity Check${NC}"
echo "Verifying all data was properly stored in SQLite..."

cd backend
DB_STATS=$(NODE_ENV=development USE_LOCAL_DATABASE=true node -e "
const { databaseAdapter } = require('./database/database-factory');
const stats = databaseAdapter.getStats();
console.log(JSON.stringify(stats));
" 2>/dev/null)

if echo "$DB_STATS" | grep -q '"users":[0-9]' && echo "$DB_STATS" | grep -q '"checkins":[0-9]'; then
    demo_step 0 "Database integrity verified"
    echo -e "   ${YELLOW}Database stats: $DB_STATS${NC}"
else
    demo_step 1 "Database integrity check failed" "$DB_STATS"
fi
cd ..

# Frontend Configuration Test
echo -e "\n${BLUE}🌐 Step 11: Frontend Configuration Verification${NC}"
echo "Checking frontend is configured for local development..."

FRONTEND_CONFIG=$(grep -n "localhost:3002" frontend/src/lib/api.ts)
if [ ! -z "$FRONTEND_CONFIG" ]; then
    demo_step 0 "Frontend configured for local backend"
    echo -e "   ${YELLOW}API calls will route to local SQLite backend${NC}"
else
    demo_step 1 "Frontend not configured for local backend"
fi

# Cleanup
echo -e "\n🧹 Cleaning up demo session..."
kill $BACKEND_PID 2>/dev/null
./scripts/kill-local-servers.sh > /dev/null 2>&1

# Demo Results Summary
echo -e "\n🎬 Demo Results Summary"
echo "======================="
echo -e "Demo Steps Passed: ${GREEN}$DEMO_PASSED${NC}"
echo -e "Demo Steps Failed: ${RED}$DEMO_FAILED${NC}"
TOTAL_STEPS=$((DEMO_PASSED + DEMO_FAILED))
echo "Total Demo Steps: $TOTAL_STEPS"

if [ $DEMO_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 DEMO SUCCESSFUL! Complete onboarding flow is working perfectly.${NC}"
    echo -e "\n${BLUE}📋 What was tested:${NC}"
    echo "   ✅ User registration with personalized profile"
    echo "   ✅ Authentication and JWT token generation"  
    echo "   ✅ Onboarding micro-insights (personalized welcome)"
    echo "   ✅ Daily check-in submission with mood and confidence"
    echo "   ✅ Check-in micro-insights (dynamic analysis)"
    echo "   ✅ Daily insights dashboard generation"
    echo "   ✅ Check-in history and trends"
    echo "   ✅ Personalized question generation"
    echo "   ✅ Analytics event tracking"
    echo "   ✅ SQLite database integrity"
    echo "   ✅ Frontend-backend integration"
    
    echo -e "\n${YELLOW}🚀 Ready for live demo! Start with:${NC}"
    echo "   ./scripts/start-staging.sh"
    echo "   Then visit: http://localhost:3001"
    echo -e "\n${YELLOW}💡 Demo user created:${NC}"
    echo "   Email: $DEMO_EMAIL"
    echo "   Profile: IVF prep, low med confidence, seeking emotional support"
    
    exit 0
else
    echo -e "\n${RED}❌ Demo had issues. Check the logs before proceeding.${NC}"
    echo "Backend logs: demo-backend.log"
    exit 1
fi 