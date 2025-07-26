#!/bin/bash
# Novara MVP - Mission Critical Functionality Test
# Tests all essential API endpoints and user flows

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test configuration
STAGING_BACKEND="https://novara-staging-staging.up.railway.app"
PRODUCTION_BACKEND="https://novara-mvp-production.up.railway.app"
STAGING_FRONTEND="https://novara-ozhbksr6v-novara-fertility.vercel.app"
PRODUCTION_FRONTEND="https://novara-hfew9a56o-novara-fertility.vercel.app"

# Test results tracking
STAGING_PASSED=0
STAGING_FAILED=0
PRODUCTION_PASSED=0
PRODUCTION_FAILED=0

echo -e "${BLUE}🧪 Novara MVP Mission Critical Functionality Test${NC}"
echo "====================================================="
echo ""

# Function to test an endpoint
test_endpoint() {
    local environment=$1
    local endpoint=$2
    local description=$3
    local expected_status=$4
    
    local base_url=""
    if [ "$environment" = "staging" ]; then
        base_url=$STAGING_BACKEND
    else
        base_url=$PRODUCTION_BACKEND
    fi
    
    local url="$base_url$endpoint"
    local response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$url")
    local status_code=${response: -3}
    local response_body=$(cat /tmp/response.json)
    
    echo -e "${CYAN}Testing $environment: $description${NC}"
    echo "   URL: $url"
    echo "   Status: $status_code"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}   ✅ PASSED${NC}"
        if [ "$environment" = "staging" ]; then
            ((STAGING_PASSED++))
        else
            ((PRODUCTION_PASSED++))
        fi
    else
        echo -e "${RED}   ❌ FAILED (Expected: $expected_status, Got: $status_code)${NC}"
        echo "   Response: $response_body"
        if [ "$environment" = "staging" ]; then
            ((STAGING_FAILED++))
        else
            ((PRODUCTION_FAILED++))
        fi
    fi
    echo ""
}

# Function to test frontend connectivity
test_frontend() {
    local environment=$1
    local url=$2
    
    echo -e "${CYAN}Testing $environment Frontend Connectivity${NC}"
    echo "   URL: $url"
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}   ✅ PASSED (HTTP $status_code)${NC}"
        if [ "$environment" = "staging" ]; then
            ((STAGING_PASSED++))
        else
            ((PRODUCTION_PASSED++))
        fi
    else
        echo -e "${RED}   ❌ FAILED (HTTP $status_code)${NC}"
        if [ "$environment" = "staging" ]; then
            ((STAGING_FAILED++))
        else
            ((PRODUCTION_FAILED++))
        fi
    fi
    echo ""
}

# Function to test API integration
test_api_integration() {
    local environment=$1
    local base_url=$2
    
    echo -e "${CYAN}Testing $environment API Integration${NC}"
    
    # Test health endpoint
    test_endpoint "$environment" "/api/health" "Health Check" "200"
    
    # Test check-in questions endpoint (requires auth - should return 401)
    test_endpoint "$environment" "/api/checkins/questions" "Daily Check-in Questions (Auth Required)" "401"
    
    # Test insights endpoint (requires auth - should return 401)
    test_endpoint "$environment" "/api/insights/daily" "Daily Insights (Auth Required)" "401"
    
    # Test user endpoint (requires auth - should return 401)
    test_endpoint "$environment" "/api/users/me" "User Profile (Auth Required)" "401"
    
    # Test checkins endpoint (requires auth - should return 401)
    test_endpoint "$environment" "/api/checkins" "User Check-ins (Auth Required)" "401"
}

# Function to test database connectivity
test_database() {
    local environment=$1
    local base_url=$2
    
    echo -e "${CYAN}Testing $environment Database Connectivity${NC}"
    
    # Test if the API is responding (indicates database is accessible)
    local health_response=$(curl -s "$base_url/api/health")
    
    if echo "$health_response" | grep -q '"status":"ok"'; then
        echo -e "${GREEN}   ✅ API responding - database connectivity inferred${NC}"
        if [ "$environment" = "staging" ]; then
            ((STAGING_PASSED++))
        else
            ((PRODUCTION_PASSED++))
        fi
    else
        echo -e "${RED}   ❌ API not responding - database connectivity issue${NC}"
        echo "   Response: $health_response"
        if [ "$environment" = "staging" ]; then
            ((STAGING_FAILED++))
        else
            ((PRODUCTION_FAILED++))
        fi
    fi
    echo ""
}

# Function to test CORS configuration
test_cors() {
    local environment=$1
    local base_url=$2
    
    echo -e "${CYAN}Testing $environment CORS Configuration${NC}"
    
    local cors_response=$(curl -s -H "Origin: https://novara-mvp.vercel.app" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS "$base_url/api/health" -w "%{http_code}")
    
    local status_code=${cors_response: -3}
    
    if [ "$status_code" = "200" ] || [ "$status_code" = "204" ]; then
        echo -e "${GREEN}   ✅ CORS preflight request successful${NC}"
        if [ "$environment" = "staging" ]; then
            ((STAGING_PASSED++))
        else
            ((PRODUCTION_PASSED++))
        fi
    else
        echo -e "${RED}   ❌ CORS preflight request failed (HTTP $status_code)${NC}"
        if [ "$environment" = "staging" ]; then
            ((STAGING_FAILED++))
        else
            ((PRODUCTION_FAILED++))
        fi
    fi
    echo ""
}

# Function to test performance
test_performance() {
    local environment=$1
    local base_url=$2
    
    echo -e "${CYAN}Testing $environment Performance${NC}"
    
    local start_time=$(date +%s%N)
    curl -s "$base_url/api/health" > /dev/null
    local end_time=$(date +%s%N)
    
    local duration=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds
    
    if [ "$duration" -lt 5000 ]; then  # Less than 5 seconds
        echo -e "${GREEN}   ✅ Response time: ${duration}ms${NC}"
        if [ "$environment" = "staging" ]; then
            ((STAGING_PASSED++))
        else
            ((PRODUCTION_PASSED++))
        fi
    else
        echo -e "${YELLOW}   ⚠️  Slow response time: ${duration}ms${NC}"
        if [ "$environment" = "staging" ]; then
            ((STAGING_FAILED++))
        else
            ((PRODUCTION_FAILED++))
        fi
    fi
    echo ""
}

# Main test execution
echo -e "${BLUE}🚀 Starting Mission Critical Tests${NC}"
echo "====================================="
echo ""

# Test Staging Environment
echo -e "${YELLOW}📋 STAGING ENVIRONMENT TESTS${NC}"
echo "================================"
echo ""

test_frontend "staging" "$STAGING_FRONTEND"
test_api_integration "staging" "$STAGING_BACKEND"
test_database "staging" "$STAGING_BACKEND"
test_cors "staging" "$STAGING_BACKEND"
test_performance "staging" "$STAGING_BACKEND"

echo -e "${YELLOW}📋 PRODUCTION ENVIRONMENT TESTS${NC}"
echo "================================="
echo ""

test_frontend "production" "$PRODUCTION_FRONTEND"
test_api_integration "production" "$PRODUCTION_BACKEND"
test_database "production" "$PRODUCTION_BACKEND"
test_cors "production" "$PRODUCTION_BACKEND"
test_performance "production" "$PRODUCTION_BACKEND"

# Summary
echo -e "${BLUE}📊 TEST SUMMARY${NC}"
echo "==============="
echo ""

echo -e "${YELLOW}Staging Environment:${NC}"
echo "   ✅ Passed: $STAGING_PASSED"
echo "   ❌ Failed: $STAGING_FAILED"
echo "   📊 Success Rate: $(( (STAGING_PASSED * 100) / (STAGING_PASSED + STAGING_FAILED) ))%"
echo ""

echo -e "${YELLOW}Production Environment:${NC}"
echo "   ✅ Passed: $PRODUCTION_PASSED"
echo "   ❌ Failed: $PRODUCTION_FAILED"
echo "   📊 Success Rate: $(( (PRODUCTION_PASSED * 100) / (PRODUCTION_PASSED + PRODUCTION_FAILED) ))%"
echo ""

# Overall status
if [ $STAGING_FAILED -eq 0 ] && [ $PRODUCTION_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL MISSION CRITICAL TESTS PASSED!${NC}"
    echo "   Both environments are fully functional"
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    echo "   Please review the failed tests above"
    exit 1
fi 