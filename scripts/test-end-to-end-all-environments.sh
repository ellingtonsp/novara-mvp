#!/bin/bash

# 🎬 Comprehensive End-to-End Testing for All Environments
# Tests local, staging, and production environments for demo readiness
# Leverages existing testing infrastructure and adds comprehensive validation

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_ENVIRONMENTS=0
PASSED_ENVIRONMENTS=0
FAILED_ENVIRONMENTS=0
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Environment URLs
LOCAL_BACKEND="http://localhost:9002"
LOCAL_FRONTEND="http://localhost:4200"
STAGING_BACKEND="https://novara-staging-staging.up.railway.app"
STAGING_FRONTEND="https://novara-bd6xsx1ru-novara-fertility.vercel.app"
PRODUCTION_BACKEND="https://novara-mvp-production.up.railway.app"
PRODUCTION_FRONTEND="https://novara-mvp.vercel.app"

# Test data
TEST_EMAIL="demo.user.$(date +%s)@novara.demo"
TEST_NICKNAME="DemoUser"

# Function to print test results
print_test_result() {
    local test_name="$1"
    local success="$2"
    local message="$3"
    local details="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$success" = "true" ]; then
        echo -e "${GREEN}✅ $test_name${NC}"
        echo -e "   ${CYAN}$message${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ $test_name${NC}"
        echo -e "   ${YELLOW}$message${NC}"
        if [ -n "$details" ]; then
            echo -e "   ${RED}Details: $details${NC}"
        fi
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to print environment results
print_environment_result() {
    local environment="$1"
    local success="$2"
    local message="$3"
    
    TOTAL_ENVIRONMENTS=$((TOTAL_ENVIRONMENTS + 1))
    
    if [ "$success" = "true" ]; then
        echo -e "\n${GREEN}🎉 $environment Environment: READY FOR DEMO${NC}"
        echo -e "   ${CYAN}$message${NC}"
        PASSED_ENVIRONMENTS=$((PASSED_ENVIRONMENTS + 1))
    else
        echo -e "\n${RED}❌ $environment Environment: NOT READY${NC}"
        echo -e "   ${YELLOW}$message${NC}"
        FAILED_ENVIRONMENTS=$((FAILED_ENVIRONMENTS + 1))
    fi
}

# Function to make API requests
make_request() {
    local method="$1"
    local url="$2"
    local headers="$3"
    local data="$4"
    
    local curl_cmd="curl -s -w '\nHTTPSTATUS:%{http_code}\nTIME:%{time_total}'"
    
    if [ "$method" = "POST" ]; then
        curl_cmd="$curl_cmd -X POST"
    elif [ "$method" = "GET" ]; then
        curl_cmd="$curl_cmd -X GET"
    fi
    
    if [ -n "$headers" ]; then
        # Split headers by semicolon and add each as separate -H argument
        IFS=';' read -ra HEADER_ARRAY <<< "$headers"
        for header in "${HEADER_ARRAY[@]}"; do
            if [ -n "$header" ]; then
                curl_cmd="$curl_cmd -H '$header'"
            fi
        done
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$url'"
    
    local response=$(eval $curl_cmd)
    local http_status=$(echo "$response" | grep "HTTPSTATUS:" | cut -d: -f2)
    local response_time=$(echo "$response" | grep "TIME:" | cut -d: -f2)
    local body=$(echo "$response" | sed '/HTTPSTATUS:/d' | sed '/TIME:/d')
    
    echo "{\"status\":\"$http_status\",\"time\":\"$response_time\",\"body\":$body}"
}

# Function to test local environment
test_local_environment() {
    echo -e "\n${BLUE}🏠 Testing Local Environment${NC}"
    echo "================================"
    
    local local_passed=0
    local local_failed=0
    
    # Check if local environment is running
    echo "Checking if local environment is running..."
    
    # Test backend health
    local health_response=$(make_request "GET" "$LOCAL_BACKEND/api/health")
    local health_status=$(echo "$health_response" | jq -r '.status')
    local health_body=$(echo "$health_response" | jq -r '.body')
    
    if [ "$health_status" = "200" ] && echo "$health_body" | jq -r '.status' 2>/dev/null | grep -q "ok"; then
        print_test_result "Local Backend Health" "true" "Backend is running and healthy"
        local_passed=$((local_passed + 1))
    else
        print_test_result "Local Backend Health" "false" "Backend is not running or unhealthy" "$health_body"
        local_failed=$((local_failed + 1))
    fi
    
    # Test frontend accessibility
    local frontend_response=$(curl -s -o /dev/null -w "%{http_code}" "$LOCAL_FRONTEND")
    if [ "$frontend_response" = "200" ]; then
        print_test_result "Local Frontend Accessibility" "true" "Frontend is accessible"
        local_passed=$((local_passed + 1))
    else
        print_test_result "Local Frontend Accessibility" "false" "Frontend is not accessible" "HTTP $frontend_response"
        local_failed=$((local_failed + 1))
    fi
    
    # Test complete user journey (if backend is running)
    if [ "$health_status" = "200" ]; then
        echo "Testing complete user journey..."
        
        # User registration
        local registration_data="{
            \"email\": \"$TEST_EMAIL\",
            \"nickname\": \"$TEST_NICKNAME\",
            \"confidence_meds\": 4,
            \"confidence_costs\": 6,
            \"confidence_overall\": 5,
            \"primary_need\": \"emotional_support\",
            \"cycle_stage\": \"ivf_prep\",
            \"top_concern\": \"medication side effects\",
            \"timezone\": \"America/New_York\",
            \"email_opt_in\": true
        }"
        
        local registration_response=$(make_request "POST" "$LOCAL_BACKEND/api/users" "Content-Type: application/json" "$registration_data")
        local registration_status=$(echo "$registration_response" | jq -r '.status')
        
        if [ "$registration_status" = "201" ]; then
            print_test_result "Local User Registration" "true" "User registration successful"
            local_passed=$((local_passed + 1))
            
            # Extract token for further tests
            local token=$(echo "$registration_response" | jq -r '.body.token' 2>/dev/null || echo "invalid-token")
            
            # Test daily check-in
            local checkin_data="{
                \"mood_today\": 7,
                \"confidence_today\": 6,
                \"top_concern\": \"medication side effects\",
                \"notes\": \"Feeling optimistic today\"
            }"
            
            local checkin_response=$(make_request "POST" "$LOCAL_BACKEND/api/checkins" "Content-Type: application/json; Authorization: Bearer $token" "$checkin_data")
            local checkin_status=$(echo "$checkin_response" | jq -r '.status')
            
            if [ "$checkin_status" = "201" ]; then
                print_test_result "Local Daily Check-in" "true" "Daily check-in successful"
                local_passed=$((local_passed + 1))
            else
                print_test_result "Local Daily Check-in" "false" "Daily check-in failed" "$(echo "$checkin_response" | jq -r '.body')"
                local_failed=$((local_failed + 1))
            fi
            
            # Test insights generation
            local insights_response=$(make_request "GET" "$LOCAL_BACKEND/api/insights/daily" "Authorization: Bearer $token")
            local insights_status=$(echo "$insights_response" | jq -r '.status')
            
            if [ "$insights_status" = "200" ]; then
                print_test_result "Local Insights Generation" "true" "Daily insights generated successfully"
                local_passed=$((local_passed + 1))
            else
                print_test_result "Local Insights Generation" "false" "Insights generation failed" "$(echo "$insights_response" | jq -r '.body')"
                local_failed=$((local_failed + 1))
            fi
            
        else
            print_test_result "Local User Registration" "false" "User registration failed" "$(echo "$registration_response" | jq -r '.body')"
            local_failed=$((local_failed + 1))
        fi
    else
        print_test_result "Local User Journey" "false" "Skipped - backend not running"
        local_failed=$((local_failed + 1))
    fi
    
    # Determine local environment result
    if [ $local_failed -eq 0 ]; then
        print_environment_result "Local" "true" "All tests passed ($local_passed/$local_passed)"
    else
        print_environment_result "Local" "false" "Some tests failed ($local_passed passed, $local_failed failed)"
    fi
}

# Function to test staging environment
test_staging_environment() {
    echo -e "\n${BLUE}🧪 Testing Staging Environment${NC}"
    echo "=================================="
    
    local staging_passed=0
    local staging_failed=0
    
    # Test backend health
    local health_response=$(make_request "GET" "$STAGING_BACKEND/api/health")
    local health_status=$(echo "$health_response" | jq -r '.status')
    local health_body=$(echo "$health_response" | jq -r '.body')
    
    if [ "$health_status" = "200" ] && echo "$health_body" | jq -r '.status' 2>/dev/null | grep -q "ok"; then
        print_test_result "Staging Backend Health" "true" "Backend is running and healthy"
        staging_passed=$((staging_passed + 1))
    else
        print_test_result "Staging Backend Health" "false" "Backend is not running or unhealthy" "$health_body"
        staging_failed=$((staging_failed + 1))
    fi
    
    # Test frontend accessibility
    local frontend_response=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_FRONTEND")
    if [ "$frontend_response" = "200" ]; then
        print_test_result "Staging Frontend Accessibility" "true" "Frontend is accessible"
        staging_passed=$((staging_passed + 1))
    else
        print_test_result "Staging Frontend Accessibility" "false" "Frontend is not accessible" "HTTP $frontend_response"
        staging_failed=$((staging_failed + 1))
    fi
    
    # Test API endpoints (read-only for staging)
    if [ "$health_status" = "200" ]; then
        # Test authentication endpoint (safe)
        local login_data="{\"email\": \"monkey@gmail.com\"}"
        local login_response=$(make_request "POST" "$STAGING_BACKEND/api/auth/login" "Content-Type: application/json" "$login_data")
        local login_status=$(echo "$login_response" | jq -r '.status')
        
        if [ "$login_status" = "200" ]; then
            print_test_result "Staging Authentication" "true" "Authentication endpoint working"
            staging_passed=$((staging_passed + 1))
            
            # Extract token for read-only tests
            local token=$(echo "$login_response" | jq -r '.body.token')
            
            # Test insights endpoint (read-only)
            local insights_response=$(make_request "GET" "$STAGING_BACKEND/api/insights/daily" "Authorization: Bearer $token")
            local insights_status=$(echo "$insights_response" | jq -r '.status')
            
            if [ "$insights_status" = "200" ]; then
                print_test_result "Staging Insights Access" "true" "Insights endpoint accessible"
                staging_passed=$((staging_passed + 1))
            else
                print_test_result "Staging Insights Access" "false" "Insights endpoint failed" "$(echo "$insights_response" | jq -r '.body')"
                staging_failed=$((staging_failed + 1))
            fi
            
        else
            print_test_result "Staging Authentication" "false" "Authentication failed" "$(echo "$login_response" | jq -r '.body')"
            staging_failed=$((staging_failed + 1))
        fi
    else
        print_test_result "Staging API Tests" "false" "Skipped - backend not running"
        staging_failed=$((staging_failed + 1))
    fi
    
    # Determine staging environment result
    if [ $staging_failed -eq 0 ]; then
        print_environment_result "Staging" "true" "All tests passed ($staging_passed/$staging_passed)"
    else
        print_environment_result "Staging" "false" "Some tests failed ($staging_passed passed, $staging_failed failed)"
    fi
}

# Function to test production environment
test_production_environment() {
    echo -e "\n${BLUE}🚀 Testing Production Environment${NC}"
    echo "====================================="
    
    local production_passed=0
    local production_failed=0
    
    # Test backend health
    local health_response=$(make_request "GET" "$PRODUCTION_BACKEND/api/health")
    local health_status=$(echo "$health_response" | jq -r '.status')
    local health_body=$(echo "$health_response" | jq -r '.body')
    
    if [ "$health_status" = "200" ] && echo "$health_body" | jq -r '.status' 2>/dev/null | grep -q "ok"; then
        print_test_result "Production Backend Health" "true" "Backend is running and healthy"
        production_passed=$((production_passed + 1))
    else
        print_test_result "Production Backend Health" "false" "Backend is not running or unhealthy" "$health_body"
        production_failed=$((production_failed + 1))
    fi
    
    # Test frontend accessibility
    local frontend_response=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_FRONTEND")
    if [ "$frontend_response" = "200" ]; then
        print_test_result "Production Frontend Accessibility" "true" "Frontend is accessible"
        production_passed=$((production_passed + 1))
    else
        print_test_result "Production Frontend Accessibility" "false" "Frontend is not accessible" "HTTP $frontend_response"
        production_failed=$((production_failed + 1))
    fi
    
    # Test API endpoints (read-only for production)
    if [ "$health_status" = "200" ]; then
        # Test authentication endpoint (safe)
        local login_data="{\"email\": \"monkey@gmail.com\"}"
        local login_response=$(make_request "POST" "$PRODUCTION_BACKEND/api/auth/login" "Content-Type: application/json" "$login_data")
        local login_status=$(echo "$login_response" | jq -r '.status')
        
        if [ "$login_status" = "200" ]; then
            print_test_result "Production Authentication" "true" "Authentication endpoint working"
            production_passed=$((production_passed + 1))
            
            # Extract token for read-only tests
            local token=$(echo "$login_response" | jq -r '.body.token')
            
            # Test insights endpoint (read-only)
            local insights_response=$(make_request "GET" "$PRODUCTION_BACKEND/api/insights/daily" "Authorization: Bearer $token")
            local insights_status=$(echo "$insights_response" | jq -r '.status')
            
            if [ "$insights_status" = "200" ]; then
                print_test_result "Production Insights Access" "true" "Insights endpoint accessible"
                production_passed=$((production_passed + 1))
            else
                print_test_result "Production Insights Access" "false" "Insights endpoint failed" "$(echo "$insights_response" | jq -r '.body')"
                production_failed=$((production_failed + 1))
            fi
            
        else
            print_test_result "Production Authentication" "false" "Authentication failed" "$(echo "$login_response" | jq -r '.body')"
            production_failed=$((production_failed + 1))
        fi
    else
        print_test_result "Production API Tests" "false" "Skipped - backend not running"
        production_failed=$((production_failed + 1))
    fi
    
    # Determine production environment result
    if [ $production_failed -eq 0 ]; then
        print_environment_result "Production" "true" "All tests passed ($production_passed/$production_passed)"
    else
        print_environment_result "Production" "false" "Some tests failed ($production_passed passed, $production_failed failed)"
    fi
}

# Function to run existing comprehensive tests
run_existing_tests() {
    echo -e "\n${BLUE}🔧 Running Existing Comprehensive Tests${NC}"
    echo "============================================="
    
    # Run API endpoint tests
    echo "Running API endpoint tests..."
    if [ -f "./scripts/testing/api-endpoint-test.sh" ]; then
        ./scripts/testing/api-endpoint-test.sh staging
        if [ $? -eq 0 ]; then
            print_test_result "API Endpoint Tests" "true" "All API endpoints validated"
        else
            print_test_result "API Endpoint Tests" "false" "Some API endpoints failed"
        fi
    else
        print_test_result "API Endpoint Tests" "false" "Test script not found"
    fi
    
    # Run mission critical tests
    echo "Running mission critical tests..."
    if [ -f "./scripts/testing/test-mission-critical.sh" ]; then
        ./scripts/testing/test-mission-critical.sh
        if [ $? -eq 0 ]; then
            print_test_result "Mission Critical Tests" "true" "Core functionality validated"
        else
            print_test_result "Mission Critical Tests" "false" "Core functionality issues detected"
        fi
    else
        print_test_result "Mission Critical Tests" "false" "Test script not found"
    fi
}

# Main execution
main() {
    echo "🎬 Novara End-to-End Testing for All Environments"
    echo "================================================"
    echo "Testing local, staging, and production environments for demo readiness"
    echo ""
    
    # Check dependencies
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ jq is required but not installed. Please install jq first.${NC}"
        exit 1
    fi
    
    # Test all environments
    test_local_environment
    test_staging_environment
    test_production_environment
    
    # Run existing comprehensive tests
    run_existing_tests
    
    # Generate final report
    echo -e "\n${BLUE}📊 Final Test Report${NC}"
    echo "====================="
    echo -e "Environments Tested: $TOTAL_ENVIRONMENTS"
    echo -e "Environments Ready: ${GREEN}$PASSED_ENVIRONMENTS${NC}"
    echo -e "Environments Issues: ${RED}$FAILED_ENVIRONMENTS${NC}"
    echo ""
    echo -e "Total Tests: $TOTAL_TESTS"
    echo -e "Tests Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Tests Failed: ${RED}$FAILED_TESTS${NC}"
    
    # Demo readiness assessment
    echo -e "\n${BLUE}🎯 Demo Readiness Assessment${NC}"
    echo "==============================="
    
    if [ $FAILED_ENVIRONMENTS -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL ENVIRONMENTS ARE DEMO READY!${NC}"
        echo ""
        echo "✅ Local Environment: Ready for development and testing"
        echo "✅ Staging Environment: Ready for integration testing"
        echo "✅ Production Environment: Ready for live demos"
        echo ""
        echo "🚀 Demo URLs:"
        echo "   Local: $LOCAL_FRONTEND"
        echo "   Staging: $STAGING_FRONTEND"
        echo "   Production: $PRODUCTION_FRONTEND"
        echo ""
        echo "💡 Recommended demo flow:"
        echo "   1. Start with production (live demo)"
        echo "   2. Show staging (development process)"
        echo "   3. Show local (development environment)"
        exit 0
    else
        echo -e "${RED}❌ SOME ENVIRONMENTS HAVE ISSUES${NC}"
        echo ""
        echo "Please fix the issues above before proceeding with demos."
        echo ""
        echo "🔧 Quick fixes:"
        echo "   - Local: Run './scripts/start-dev-stable.sh'"
        echo "   - Staging: Check deployment status"
        echo "   - Production: Verify environment variables"
        exit 1
    fi
}

# Run main function
main "$@" 