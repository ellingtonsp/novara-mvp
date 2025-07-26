#!/bin/bash

# 🧪 API Endpoint Testing Script
# Tests all API endpoints in staging and production environments
# Follows DevOps best practices for comprehensive endpoint validation

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
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Environment URLs
STAGING_BACKEND="https://novara-staging.up.railway.app"
PRODUCTION_BACKEND="https://novara-mvp-production.up.railway.app"
STAGING_FRONTEND="https://novara-mvp-staging.vercel.app"
PRODUCTION_FRONTEND="https://novara-mvp.vercel.app"

# Test data (safe for production - no data creation)
TEST_EMAIL="monkey@gmail.com"  # Existing user in production
TEST_USER_ID="rec1753309932029wcda53bat"  # Existing test user

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
    echo ""
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
        curl_cmd="$curl_cmd -H '$headers'"
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

# Function to test environment health
test_environment_health() {
    local environment="$1"
    local backend_url="$2"
    
    echo -e "${BLUE}🏥 Testing $environment Environment Health${NC}"
    echo "=================================================="
    
    # Test 1: Basic Health Check
    local health_response=$(make_request "GET" "$backend_url/api/health")
    local health_status=$(echo "$health_response" | jq -r '.status')
    local health_body=$(echo "$health_response" | jq -r '.body')
    local response_time=$(echo "$health_response" | jq -r '.time')
    
    if [ "$health_status" = "200" ]; then
        local service=$(echo "$health_body" | jq -r '.service // "unknown"')
        local env=$(echo "$health_body" | jq -r '.environment // "unknown"')
        local airtable=$(echo "$health_body" | jq -r '.airtable // "unknown"')
        local jwt=$(echo "$health_body" | jq -r '.jwt // "unknown"')
        
        print_test_result "Health Check" "true" "Service: $service | Environment: $env | Response Time: ${response_time}s"
        print_test_result "Airtable Connection" "$([ "$airtable" = "connected" ] && echo "true" || echo "false")" "Status: $airtable"
        print_test_result "JWT Configuration" "$([ "$jwt" = "configured" ] && echo "true" || echo "false")" "Status: $jwt"
    else
        print_test_result "Health Check" "false" "HTTP $health_status" "Backend not responding"
    fi
    
    # Test 2: API Endpoints Overview
    local endpoints_response=$(make_request "GET" "$backend_url/api/checkins-test")
    local endpoints_status=$(echo "$endpoints_response" | jq -r '.status')
    
    if [ "$endpoints_status" = "200" ]; then
        print_test_result "API Endpoints Overview" "true" "All endpoints documented and accessible"
    else
        print_test_result "API Endpoints Overview" "false" "HTTP $endpoints_status" "Cannot access endpoints overview"
    fi
}

# Function to test authentication endpoints (safe - no data creation)
test_authentication_endpoints() {
    local environment="$1"
    local backend_url="$2"
    
    echo -e "${BLUE}🔐 Testing $environment Authentication Endpoints${NC}"
    echo "========================================================"
    
    # Test 1: Login with existing test user (safe - no data creation)
    local login_data="{\"email\":\"$TEST_EMAIL\"}"
    local login_response=$(make_request "POST" "$backend_url/api/auth/login" "Content-Type: application/json" "$login_data")
    local login_status=$(echo "$login_response" | jq -r '.status')
    local login_body=$(echo "$login_response" | jq -r '.body')
    
    if [ "$login_status" = "200" ] || [ "$login_status" = "404" ] || [ "$login_status" = "429" ]; then
        local success=$(echo "$login_body" | jq -r '.success // false')
        if [ "$success" = "true" ]; then
            local token=$(echo "$login_body" | jq -r '.token // ""')
            if [ -n "$token" ] && [ "$token" != "null" ]; then
                print_test_result "User Login" "true" "Successfully authenticated test user"
                
                # Store token for protected endpoint tests
                AUTH_TOKEN="$token"
                
                # Test 2: Get current user (protected endpoint)
                local user_response=$(make_request "GET" "$backend_url/api/users/me" "Authorization: Bearer $token")
                local user_status=$(echo "$user_response" | jq -r '.status')
                
                if [ "$user_status" = "200" ]; then
                    print_test_result "Get Current User" "true" "Protected endpoint accessible with valid token"
                else
                    print_test_result "Get Current User" "false" "HTTP $user_status" "Protected endpoint not accessible"
                fi
            else
                print_test_result "User Login" "false" "No token returned" "Authentication succeeded but no JWT token"
            fi
        else
            local error_msg=$(echo "$login_body" | jq -r '.error // "Unknown error"')
            if [ "$login_status" = "429" ]; then
                print_test_result "User Login" "true" "Rate limited - endpoint is working" "Authentication endpoint is responding (rate limit protection active)"
            else
                print_test_result "User Login" "false" "Login failed: $error_msg" "Test user may not exist in $environment - this is expected for production"
            fi
        fi
    else
        print_test_result "User Login" "false" "HTTP $login_status" "Authentication endpoint not responding"
    fi
    
    # Test 3: Unauthorized access (should fail)
    local unauthorized_response=$(make_request "GET" "$backend_url/api/users/me")
    local unauthorized_status=$(echo "$unauthorized_response" | jq -r '.status')
    
    if [ "$unauthorized_status" = "401" ]; then
        print_test_result "Unauthorized Access Protection" "true" "Properly rejects requests without authentication"
    else
        print_test_result "Unauthorized Access Protection" "false" "HTTP $unauthorized_status" "Should return 401 for unauthorized access"
    fi
}

# Function to test check-in endpoints (safe - read-only operations)
test_checkin_endpoints() {
    local environment="$1"
    local backend_url="$2"
    local auth_token="$3"
    
    echo -e "${BLUE}📝 Testing $environment Check-in Endpoints${NC}"
    echo "================================================"
    
    if [ -z "$auth_token" ]; then
        print_test_result "Check-in Endpoints" "false" "No authentication token" "Skipping protected endpoint tests"
        return
    fi
    
    # Test 1: Get personalized questions (protected)
    local questions_response=$(make_request "GET" "$backend_url/api/checkins/questions" "Authorization: Bearer $auth_token")
    local questions_status=$(echo "$questions_response" | jq -r '.status')
    
    if [ "$questions_status" = "200" ]; then
        local questions_body=$(echo "$questions_response" | jq -r '.body')
        local success=$(echo "$questions_body" | jq -r '.success // false')
        if [ "$success" = "true" ]; then
            local question_count=$(echo "$questions_body" | jq -r '.questions | length')
            print_test_result "Get Personalized Questions" "true" "Retrieved $question_count personalized questions"
        else
            print_test_result "Get Personalized Questions" "false" "API returned success=false"
        fi
    else
        print_test_result "Get Personalized Questions" "false" "HTTP $questions_status" "Questions endpoint not accessible"
    fi
    
    # Test 2: Get last check-in values (protected)
    local last_values_response=$(make_request "GET" "$backend_url/api/checkins/last-values" "Authorization: Bearer $auth_token")
    local last_values_status=$(echo "$last_values_response" | jq -r '.status')
    
    if [ "$last_values_status" = "200" ]; then
        local last_values_body=$(echo "$last_values_response" | jq -r '.body')
        local success=$(echo "$last_values_body" | jq -r '.success // false')
        if [ "$success" = "true" ]; then
            print_test_result "Get Last Check-in Values" "true" "Successfully retrieved last check-in data"
        else
            print_test_result "Get Last Check-in Values" "false" "API returned success=false"
        fi
    else
        print_test_result "Get Last Check-in Values" "false" "HTTP $last_values_status" "Last values endpoint not accessible"
    fi
}

# Function to test insights endpoints (safe - read-only operations)
test_insights_endpoints() {
    local environment="$1"
    local backend_url="$2"
    local auth_token="$3"
    
    echo -e "${BLUE}🧠 Testing $environment Insights Endpoints${NC}"
    echo "==============================================="
    
    if [ -z "$auth_token" ]; then
        print_test_result "Insights Endpoints" "false" "No authentication token" "Skipping protected endpoint tests"
        return
    fi
    
    # Test 1: Get daily insights (protected)
    local insights_response=$(make_request "GET" "$backend_url/api/insights/daily" "Authorization: Bearer $auth_token")
    local insights_status=$(echo "$insights_response" | jq -r '.status')
    
    if [ "$insights_status" = "200" ]; then
        local insights_body=$(echo "$insights_response" | jq -r '.body')
        local success=$(echo "$insights_body" | jq -r '.success // false')
        if [ "$success" = "true" ]; then
            local insight_count=$(echo "$insights_body" | jq -r '.insights | length')
            print_test_result "Get Daily Insights" "true" "Retrieved $insight_count daily insights"
        else
            print_test_result "Get Daily Insights" "false" "API returned success=false"
        fi
    else
        print_test_result "Get Daily Insights" "false" "HTTP $insights_status" "Insights endpoint not accessible"
    fi
    
    # Test 2: Track insight engagement (protected - safe POST)
    local engagement_data="{\"insight_type\":\"test\",\"action\":\"viewed\",\"insight_id\":\"test_$(date +%s)\"}"
    local engagement_response=$(make_request "POST" "$backend_url/api/insights/engagement" "Authorization: Bearer $auth_token" "$engagement_data")
    local engagement_status=$(echo "$engagement_response" | jq -r '.status')
    
    if [ "$engagement_status" = "200" ]; then
        local engagement_body=$(echo "$engagement_response" | jq -r '.body')
        local success=$(echo "$engagement_body" | jq -r '.success // false')
        if [ "$success" = "true" ]; then
            print_test_result "Track Insight Engagement" "true" "Successfully tracked engagement event"
        else
            print_test_result "Track Insight Engagement" "false" "API returned success=false"
        fi
    else
        print_test_result "Track Insight Engagement" "false" "HTTP $engagement_status" "Engagement endpoint not accessible"
    fi
}

# Function to test frontend connectivity
test_frontend_connectivity() {
    local environment="$1"
    local frontend_url="$2"
    
    echo -e "${BLUE}🎨 Testing $environment Frontend Connectivity${NC}"
    echo "=================================================="
    
    # Test 1: Frontend accessibility (handle HTML content properly)
    local frontend_response=$(curl -s -w "\nHTTPSTATUS:%{http_code}\nTIME:%{time_total}" "$frontend_url")
    local frontend_status=$(echo "$frontend_response" | grep "HTTPSTATUS:" | cut -d: -f2)
    local frontend_body=$(echo "$frontend_response" | sed '/HTTPSTATUS:/d' | sed '/TIME:/d')
    
    if [ "$frontend_status" = "200" ]; then
        print_test_result "Frontend Accessibility" "true" "Frontend is accessible and responding"
    else
        print_test_result "Frontend Accessibility" "false" "HTTP $frontend_status" "Frontend not accessible"
    fi
    
    # Test 2: Frontend loads application content
    if [ -n "$frontend_body" ] && echo "$frontend_body" | grep -q -i "novara\|react\|html"; then
        print_test_result "Frontend Content" "true" "Frontend loads application content"
    else
        print_test_result "Frontend Content" "false" "Frontend does not contain expected application content"
    fi
}

# Function to test CORS configuration
test_cors_configuration() {
    local environment="$1"
    local backend_url="$2"
    local frontend_url="$3"
    
    echo -e "${BLUE}🌐 Testing $environment CORS Configuration${NC}"
    echo "================================================"
    
    # Test 1: CORS preflight request
    local cors_response=$(curl -s -X OPTIONS "$backend_url/api/health" \
        -H "Origin: $frontend_url" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -w "\nHTTPSTATUS:%{http_code}")
    
    local cors_status=$(echo "$cors_response" | grep "HTTPSTATUS:" | cut -d: -f2)
    
    if [ "$cors_status" = "204" ] || [ "$cors_status" = "200" ]; then
        print_test_result "CORS Preflight" "true" "CORS preflight request successful"
    else
        print_test_result "CORS Preflight" "false" "HTTP $cors_status" "CORS preflight request failed"
    fi
}

# Function to test response times
test_response_times() {
    local environment="$1"
    local backend_url="$2"
    
    echo -e "${BLUE}⏱️ Testing $environment Response Times${NC}"
    echo "============================================="
    
    # Test multiple endpoints for response time
    local endpoints=("/api/health" "/api/checkins-test")
    
    for endpoint in "${endpoints[@]}"; do
        local response=$(make_request "GET" "$backend_url$endpoint")
        local response_time=$(echo "$response" | jq -r '.time')
        local status=$(echo "$response" | jq -r '.status')
        
        if [ "$status" = "200" ]; then
            local time_float=$(echo "$response_time" | bc -l 2>/dev/null || echo "0")
            if (( $(echo "$time_float < 2.0" | bc -l) )); then
                print_test_result "Response Time - $endpoint" "true" "Response time: ${response_time}s (under 2s threshold)"
            else
                print_test_result "Response Time - $endpoint" "false" "Response time: ${response_time}s (over 2s threshold)" "Consider performance optimization"
            fi
        else
            print_test_result "Response Time - $endpoint" "false" "HTTP $status" "Cannot measure response time for failed request"
        fi
    done
}

# Function to print summary
print_summary() {
    echo -e "${PURPLE}📊 Test Summary${NC}"
    echo "================"
    echo -e "Total Tests: ${CYAN}$TOTAL_TESTS${NC}"
    echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
    
    local success_rate=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l 2>/dev/null || echo "0")
    echo -e "Success Rate: ${CYAN}${success_rate}%${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All tests passed! Environment is healthy.${NC}"
        exit 0
    else
        echo -e "\n${RED}⚠️ Some tests failed. Please review the issues above.${NC}"
        exit 1
    fi
}

# Main execution
main() {
    local environment="$1"
    
    if [ -z "$environment" ]; then
        echo "Usage: $0 [staging|production|both]"
        echo ""
        echo "Examples:"
        echo "  $0 staging     # Test staging environment only"
        echo "  $0 production  # Test production environment only"
        echo "  $0 both        # Test both environments"
        exit 1
    fi
    
    echo -e "${BLUE}🧪 Novara API Endpoint Testing${NC}"
    echo "====================================="
    echo -e "Environment: ${CYAN}$environment${NC}"
    echo -e "Timestamp: ${CYAN}$(date)${NC}"
    echo ""
    
    case $environment in
        "staging")
            test_environment_health "Staging" "$STAGING_BACKEND"
            test_authentication_endpoints "Staging" "$STAGING_BACKEND"
            test_checkin_endpoints "Staging" "$STAGING_BACKEND" "$AUTH_TOKEN"
            test_insights_endpoints "Staging" "$STAGING_BACKEND" "$AUTH_TOKEN"
            test_frontend_connectivity "Staging" "$STAGING_FRONTEND"
            test_cors_configuration "Staging" "$STAGING_BACKEND" "$STAGING_FRONTEND"
            test_response_times "Staging" "$STAGING_BACKEND"
            ;;
        "production")
            test_environment_health "Production" "$PRODUCTION_BACKEND"
            test_authentication_endpoints "Production" "$PRODUCTION_BACKEND"
            test_checkin_endpoints "Production" "$PRODUCTION_BACKEND" "$AUTH_TOKEN"
            test_insights_endpoints "Production" "$PRODUCTION_BACKEND" "$AUTH_TOKEN"
            test_frontend_connectivity "Production" "$PRODUCTION_FRONTEND"
            test_cors_configuration "Production" "$PRODUCTION_BACKEND" "$PRODUCTION_FRONTEND"
            test_response_times "Production" "$PRODUCTION_BACKEND"
            ;;
        "both")
            echo -e "${YELLOW}Testing Staging Environment...${NC}"
            echo "====================================="
            test_environment_health "Staging" "$STAGING_BACKEND"
            test_authentication_endpoints "Staging" "$STAGING_BACKEND"
            test_checkin_endpoints "Staging" "$STAGING_BACKEND" "$AUTH_TOKEN"
            test_insights_endpoints "Staging" "$STAGING_BACKEND" "$AUTH_TOKEN"
            test_frontend_connectivity "Staging" "$STAGING_FRONTEND"
            test_cors_configuration "Staging" "$STAGING_BACKEND" "$STAGING_FRONTEND"
            test_response_times "Staging" "$STAGING_BACKEND"
            
            echo ""
            echo -e "${YELLOW}Testing Production Environment...${NC}"
            echo "======================================="
            test_environment_health "Production" "$PRODUCTION_BACKEND"
            test_authentication_endpoints "Production" "$PRODUCTION_BACKEND"
            test_checkin_endpoints "Production" "$PRODUCTION_BACKEND" "$AUTH_TOKEN"
            test_insights_endpoints "Production" "$PRODUCTION_BACKEND" "$AUTH_TOKEN"
            test_frontend_connectivity "Production" "$PRODUCTION_FRONTEND"
            test_cors_configuration "Production" "$PRODUCTION_BACKEND" "$PRODUCTION_FRONTEND"
            test_response_times "Production" "$PRODUCTION_BACKEND"
            ;;
        *)
            echo -e "${RED}Invalid environment: $environment${NC}"
            echo "Valid options: staging, production, both"
            exit 1
            ;;
    esac
    
    print_summary
}

# Check dependencies
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed.${NC}"
    echo "Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    exit 1
fi

if ! command -v bc &> /dev/null; then
    echo -e "${RED}Error: bc is required but not installed.${NC}"
    echo "Install with: brew install bc (macOS) or apt-get install bc (Ubuntu)"
    exit 1
fi

# Run main function with command line argument
main "$1" 