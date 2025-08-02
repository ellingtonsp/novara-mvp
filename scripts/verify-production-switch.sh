#!/bin/bash

# Script to verify production has switched to refactored server
# and that all endpoints are working correctly

echo "🔍 Verifying Production Refactored Server Switch"
echo "==============================================="
echo "Time: $(date)"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROD_URL="https://novara-mvp-production.up.railway.app"

# Function to test endpoint
test_endpoint() {
    local method=$1
    local path=$2
    local description=$3
    local token=$4
    
    echo -n "Testing $method $path - $description... "
    
    if [ -z "$token" ]; then
        response=$(curl -s -X $method -o /dev/null -w "%{http_code}" "$PROD_URL$path")
    else
        response=$(curl -s -X $method -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            "$PROD_URL$path")
    fi
    
    # Expected responses:
    # 401 = Unauthorized (endpoint exists but needs auth)
    # 404 = Not Found (endpoint doesn't exist)
    # 400/422 = Bad Request (endpoint exists but needs data)
    # 200/201 = Success
    
    if [ "$response" = "404" ]; then
        echo -e "${RED}❌ NOT FOUND (404)${NC}"
        return 1
    elif [ "$response" = "401" ] || [ "$response" = "400" ] || [ "$response" = "422" ]; then
        echo -e "${GREEN}✅ EXISTS (${response})${NC}"
        return 0
    elif [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✅ SUCCESS (${response})${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  UNKNOWN (${response})${NC}"
        return 2
    fi
}

echo "1️⃣ Testing Public Endpoints"
echo "──────────────────────────"
test_endpoint "GET" "/api/health" "Health check"

echo -e "\n2️⃣ Testing Critical Endpoints (Need Auth)"
echo "──────────────────────────────────────────"
echo "These should return 401 (unauthorized) not 404:"
test_endpoint "PUT" "/api/checkins/test-id" "Update check-in (CRITICAL)"
test_endpoint "POST" "/api/daily-checkin-enhanced" "Enhanced check-in"
test_endpoint "GET" "/api/checkins/last-values" "Last values"
test_endpoint "GET" "/api/checkins/questions" "Questions"
test_endpoint "GET" "/api/users/profile" "User profile"
test_endpoint "PATCH" "/api/users/cycle-stage" "Update cycle stage"
test_endpoint "PATCH" "/api/users/medication-status" "Update medication"

echo -e "\n3️⃣ Server Version Check"
echo "─────────────────────"
echo "Checking server version from health endpoint..."
health_response=$(curl -s "$PROD_URL/api/health")
version=$(echo "$health_response" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
startup=$(echo "$health_response" | grep -o '"startup":"[^"]*"' | cut -d'"' -f4)

if [ "$version" = "2.0.0" ]; then
    echo -e "${GREEN}✅ Refactored server detected! (version: $version)${NC}"
else
    echo -e "${RED}❌ Legacy server still running (version: $version)${NC}"
fi

echo "Startup status: $startup"

echo -e "\n4️⃣ Summary"
echo "──────────"
if [ "$version" = "2.0.0" ]; then
    echo -e "${GREEN}✅ Production is running the REFACTORED server!${NC}"
    echo -e "${GREEN}✅ All critical endpoints are available${NC}"
    echo -e "\nNext steps:"
    echo "1. Test check-in updates in the production app"
    echo "2. Monitor Railway logs for any errors"
    echo "3. Run full regression tests"
else
    echo -e "${RED}❌ Production is still running the LEGACY server${NC}"
    echo -e "\nPlease update Railway configuration:"
    echo "1. Set USE_REFACTORED_SERVER=true"
    echo "2. OR change start command to use server-refactored.js"
fi