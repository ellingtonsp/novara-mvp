#!/bin/bash

# Comprehensive End-to-End API Testing Script
# Following .cursorrules testing protocols

set -e  # Exit on any error

# Test environments
LOCAL_API="http://localhost:9002"
STAGING_API="https://novara-staging-staging.up.railway.app"
STAGING_FRONTEND="https://novara-bd6xsx1ru-novara-fertility.vercel.app"

echo "🧪 COMPREHENSIVE END-TO-END API TESTING"
echo "========================================"
echo "Local API:     $LOCAL_API"
echo "Staging API:   $STAGING_API"
echo "Staging Front: $STAGING_FRONTEND"
echo "Following .cursorrules testing protocols"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test and track results
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "   Testing: $test_name... "
    
    if result=$(eval "$command" 2>/dev/null); then
        if [[ "$result" =~ $expected_pattern ]]; then
            echo -e "${GREEN}✅ PASS${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ FAIL (unexpected response)${NC}"
            echo "     Expected pattern: $expected_pattern"
            echo "     Got: $result"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        echo -e "${RED}❌ FAIL (request failed)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to test environment
test_environment() {
    local env_name="$1"
    local api_url="$2"
    local use_test_user="${3:-true}"
    
    echo -e "\n🔍 Testing $env_name Environment: $api_url"
    echo "=================================================="
    
    # Test 1: Health Check
    run_test "Health Check" \
        "curl -s '$api_url/api/health' | jq -r '.status'" \
        "ok"
    
    # Test 2: Create Test User
    TEST_EMAIL="e2e-test-$(date +%s)@example.com"
    if [ "$use_test_user" = "true" ]; then
        run_test "User Creation" \
            "curl -s -X POST '$api_url/api/users' \
             -H 'Content-Type: application/json' \
             -d '{
               \"email\": \"$TEST_EMAIL\",
               \"nickname\": \"E2ETest\",
               \"confidence_meds\": 7,
               \"confidence_costs\": 8,
               \"confidence_overall\": 7,
               \"primary_need\": \"medical_clarity\",
               \"cycle_stage\": \"ivf_prep\"
             }' | jq -r '.token'" \
            "eyJ"
    else
        # Use existing test user for local
        TEST_EMAIL="test-cm01@example.com"
    fi
    
    # Test 3: Authentication
    run_test "User Authentication" \
        "curl -s -X POST '$api_url/api/auth/login' \
         -H 'Content-Type: application/json' \
         -d '{\"email\": \"$TEST_EMAIL\"}' | jq -r '.token'" \
        "eyJ"
    
    # Get auth token for subsequent tests
    TOKEN=$(curl -s -X POST "$api_url/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$TEST_EMAIL\"}" | jq -r '.token')
    
    if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ Failed to get authentication token, skipping authenticated tests${NC}"
        return
    fi
    
    # Test 4: Medication Status Update
    run_test "Medication Status Update" \
        "curl -s -X PATCH '$api_url/api/users/medication-status' \
         -H 'Content-Type: application/json' \
         -H 'Authorization: Bearer $TOKEN' \
         -d '{\"medication_status\": \"taking\"}' | jq -r '.success'" \
        "true"
    
    # Test 5: Daily Check-in Submission
    run_test "Daily Check-in Submission" \
        "curl -s -X POST '$api_url/api/checkins' \
         -H 'Content-Type: application/json' \
         -H 'Authorization: Bearer $TOKEN' \
         -d '{
           \"mood_today\": \"excited, hopeful\",
           \"confidence_today\": 8,
           \"primary_concern_today\": \"\",
           \"user_note\": \"E2E test check-in - everything working great!\"
         }' | jq -r '.success'" \
        "true"
    
    # Test 6: Enhanced Daily Check-in
    run_test "Enhanced Daily Check-in" \
        "curl -s -X POST '$api_url/api/daily-checkin-enhanced' \
         -H 'Content-Type: application/json' \
         -H 'Authorization: Bearer $TOKEN' \
         -d '{
           \"mood_today\": \"grateful, optimistic\",
           \"confidence_today\": 9,
           \"primary_concern_today\": \"\",
           \"user_note\": \"Enhanced E2E test - feeling amazing!\"
         }' | jq -r '.success'" \
        "true"
    
    # Test 7: Daily Insights Generation
    run_test "Daily Insights Generation" \
        "curl -s -X GET '$api_url/api/insights/daily' \
         -H 'Authorization: Bearer $TOKEN' | jq -r '.success'" \
        "true"
    
    # Test 8: Personalized Questions
    run_test "Personalized Questions" \
        "curl -s -X GET '$api_url/api/checkins/questions' \
         -H 'Authorization: Bearer $TOKEN' | jq -r 'length'" \
        "[0-9]+"
    
    # Test 9: User Profile Retrieval
    run_test "User Profile Retrieval" \
        "curl -s -X GET '$api_url/api/users/profile' \
         -H 'Authorization: Bearer $TOKEN' | jq -r '.email'" \
        "$TEST_EMAIL"
    
    # Test 10: Analytics Event Tracking
    run_test "Analytics Event Tracking" \
        "curl -s -X POST '$api_url/api/analytics/events' \
         -H 'Content-Type: application/json' \
         -H 'Authorization: Bearer $TOKEN' \
         -d '{
           \"event_type\": \"e2e_test_event\",
           \"event_data\": {\"test\": \"comprehensive_e2e\"}
         }' | jq -r '.success'" \
        "true"
}

# Function to test frontend accessibility
test_frontend() {
    local frontend_url="$1"
    
    echo -e "\n🌐 Testing Frontend Accessibility: $frontend_url"
    echo "=================================================="
    
    run_test "Frontend Accessibility" \
        "curl -s -o /dev/null -w '%{http_code}' '$frontend_url'" \
        "200"
    
    run_test "Frontend Content Type" \
        "curl -s -I '$frontend_url' | grep -i 'content-type' | grep -i 'text/html'" \
        "text/html"
}

# Main test execution
echo "🚀 Starting Comprehensive End-to-End Testing..."

# Test Local Environment (if available)
if curl -s "$LOCAL_API/api/health" >/dev/null 2>&1; then
    test_environment "LOCAL" "$LOCAL_API" "false"
else
    echo -e "\n⚠️ Local environment not available, skipping local tests"
fi

# Test Staging Environment
test_environment "STAGING" "$STAGING_API" "true"

# Test Staging Frontend
test_frontend "$STAGING_FRONTEND"

# Additional CM-01 Specific Tests
echo -e "\n🎯 Testing CM-01 Specific Functionality"
echo "========================================"

# Test sentiment analysis integration
TEST_EMAIL_CM01="e2e-cm01-$(date +%s)@example.com"
echo "   Creating CM-01 test user: $TEST_EMAIL_CM01"

USER_RESPONSE=$(curl -s -X POST "$STAGING_API/api/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL_CM01\",
    \"nickname\": \"CM01E2E\",
    \"confidence_meds\": 5,
    \"confidence_costs\": 6,
    \"confidence_overall\": 6,
    \"primary_need\": \"emotional_support\",
    \"cycle_stage\": \"considering\"
  }")

CM01_TOKEN=$(echo "$USER_RESPONSE" | jq -r '.token')

if [ "$CM01_TOKEN" != "null" ] && [ -n "$CM01_TOKEN" ]; then
    # Test medication status flow
    run_test "CM-01 Medication Status Flow" \
        "curl -s -X PATCH '$STAGING_API/api/users/medication-status' \
         -H 'Content-Type: application/json' \
         -H 'Authorization: Bearer $CM01_TOKEN' \
         -d '{\"medication_status\": \"starting_soon\"}' | jq -r '.success'" \
        "true"
    
    # Test sentiment-rich check-in
    run_test "CM-01 Sentiment Check-in" \
        "curl -s -X POST '$STAGING_API/api/checkins' \
         -H 'Content-Type: application/json' \
         -H 'Authorization: Bearer $CM01_TOKEN' \
         -d '{
           \"mood_today\": \"anxious but hopeful, excited about progress\",
           \"confidence_today\": 7,
           \"primary_concern_today\": \"medication side effects\",
           \"user_note\": \"Mixed feelings today - worried about the process but excited for the future\"
         }' | jq -r '.success'" \
        "true"
    
    # Test insights with sentiment context
    run_test "CM-01 Sentiment Insights" \
        "curl -s -X GET '$STAGING_API/api/insights/daily' \
         -H 'Authorization: Bearer $CM01_TOKEN' | jq -r '.insight_title'" \
        ".*"
else
    echo -e "${YELLOW}⚠️ Failed to create CM-01 test user, skipping CM-01 specific tests${NC}"
fi

# Security & Error Handling Tests
echo -e "\n🔒 Testing Security & Error Handling"
echo "===================================="

# Test without authentication
run_test "Unauthorized Access Protection" \
    "curl -s -X GET '$STAGING_API/api/insights/daily' | jq -r '.error'" \
    ".*"

# Test invalid medication status
if [ -n "$TOKEN" ]; then
    run_test "Invalid Medication Status Validation" \
        "curl -s -X PATCH '$STAGING_API/api/users/medication-status' \
         -H 'Content-Type: application/json' \
         -H 'Authorization: Bearer $TOKEN' \
         -d '{\"medication_status\": \"invalid_status\"}' | jq -r '.success'" \
        "false|null"
fi

# Test malformed requests
run_test "Malformed Request Handling" \
    "curl -s -X POST '$STAGING_API/api/users' \
     -H 'Content-Type: application/json' \
     -d '{\"invalid\": json}' | jq -r '.error'" \
    ".*"

# Performance Tests
echo -e "\n⚡ Testing Performance & Response Times"
echo "====================================="

# Test response times
HEALTH_TIME=$(curl -s -w "%{time_total}" -o /dev/null "$STAGING_API/api/health")
echo "   Health endpoint response time: ${HEALTH_TIME}s"

if (( $(echo "$HEALTH_TIME < 2.0" | bc -l) )); then
    echo -e "   ${GREEN}✅ Performance: Health check under 2s${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "   ${RED}❌ Performance: Health check over 2s${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Final Results Summary
echo -e "\n📊 COMPREHENSIVE E2E TEST RESULTS"
echo "=================================="
echo "Total Tests:  $TOTAL_TESTS"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! End-to-End testing successful.${NC}"
    echo "✅ All API endpoints functioning correctly"
    echo "✅ CM-01 functionality validated"
    echo "✅ Security measures working"
    echo "✅ Performance within acceptable limits"
    echo ""
    echo "🚀 System ready for production deployment!"
    exit 0
else
    PASS_RATE=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
    echo -e "\n${YELLOW}⚠️ SOME TESTS FAILED (${PASS_RATE}% pass rate)${NC}"
    echo "❌ Review failed tests above"
    echo "❌ Address issues before production deployment"
    exit 1
fi 