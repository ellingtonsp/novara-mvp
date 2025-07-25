#!/bin/bash

# 🧪 Frontend Environment Test Script
# Tests frontend functionality across all environments

set -e

echo "🧪 Novara MVP - Frontend Environment Testing"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0

test_result() {
    if [ $1 -eq 0 ]; then
        print_success "$2"
        ((TESTS_PASSED++))
    else
        print_error "$2"
        ((TESTS_FAILED++))
    fi
}

# Function to test frontend URL
test_frontend_url() {
    local url=$1
    local name=$2
    local timeout=15
    
    print_status "Testing $name: $url"
    
    # Test basic accessibility
    if curl -s -f --max-time $timeout "$url" > /dev/null; then
        test_result 0 "$name is accessible"
        return 0
    else
        test_result 1 "$name is not accessible"
        return 1
    fi
}

# Function to test frontend content
test_frontend_content() {
    local url=$1
    local name=$2
    local timeout=15
    
    print_status "Testing $name content..."
    
    # Get the page content
    content=$(curl -s --max-time $timeout "$url" 2>/dev/null || echo "ERROR")
    
    if [[ "$content" == "ERROR" ]]; then
        test_result 1 "$name content test failed - cannot fetch page"
        return 1
    fi
    
    # Test for React app content
    if echo "$content" | grep -q "You don't have to navigate"; then
        test_result 0 "$name React app content detected"
    else
        test_result 1 "$name React app content not found"
        return 1
    fi
    
    # Test for proper HTML structure
    if echo "$content" | grep -q "<!DOCTYPE html>"; then
        test_result 0 "$name HTML structure is valid"
    else
        test_result 1 "$name HTML structure is invalid"
        return 1
    fi
    
    return 0
}

# Function to test frontend API connectivity
test_frontend_api_connectivity() {
    local frontend_url=$1
    local backend_url=$2
    local name=$3
    local timeout=15
    
    print_status "Testing $name API connectivity..."
    
    # Test if backend is accessible from frontend perspective
    if curl -s -f --max-time $timeout "$backend_url/api/health" > /dev/null; then
        test_result 0 "$name backend API is accessible"
    else
        test_result 1 "$name backend API is not accessible"
        return 1
    fi
    
    return 0
}

# Function to test frontend build
test_frontend_build() {
    local environment=$1
    local name=$2
    
    print_status "Testing $name frontend build..."
    
    cd frontend
    
    # Set environment-specific variables
    if [ "$environment" = "development" ]; then
        export VITE_API_URL="http://localhost:9002"
        export VITE_ENV="development"
    elif [ "$environment" = "staging" ]; then
        export VITE_API_URL="https://novara-staging-staging.up.railway.app"
        export VITE_ENV="staging"
    elif [ "$environment" = "production" ]; then
        export VITE_API_URL="https://novara-mvp-production.up.railway.app"
        export VITE_ENV="production"
    fi
    
    # Run frontend tests
    if npm run test:run > /dev/null 2>&1; then
        test_result 0 "$name frontend tests passed"
    else
        test_result 1 "$name frontend tests failed"
        cd ..
        return 1
    fi
    
    # Test build process
    if npm run build > /dev/null 2>&1; then
        test_result 0 "$name frontend build successful"
    else
        test_result 1 "$name frontend build failed"
        cd ..
        return 1
    fi
    
    cd ..
    return 0
}

# Function to test environment-specific features
test_environment_features() {
    local environment=$1
    local name=$2
    
    print_status "Testing $name environment-specific features..."
    
    cd frontend
    
    # Set environment variables
    if [ "$environment" = "development" ]; then
        export VITE_API_URL="http://localhost:9002"
        export VITE_ENV="development"
        export VITE_DEBUG="true"
    elif [ "$environment" = "staging" ]; then
        export VITE_API_URL="https://novara-staging-staging.up.railway.app"
        export VITE_ENV="staging"
        export VITE_DEBUG="true"
    elif [ "$environment" = "production" ]; then
        export VITE_API_URL="https://novara-mvp-production.up.railway.app"
        export VITE_ENV="production"
        export VITE_DEBUG="false"
    fi
    
    # Test environment detection
    if node -e "
        const env = process.env.VITE_ENV;
        const apiUrl = process.env.VITE_API_URL;
        if (env && apiUrl) {
            console.log('Environment:', env);
            console.log('API URL:', apiUrl);
            process.exit(0);
        } else {
            console.log('Missing environment variables');
            process.exit(1);
        }
    " > /dev/null 2>&1; then
        test_result 0 "$name environment variables configured correctly"
    else
        test_result 1 "$name environment variables not configured"
        cd ..
        return 1
    fi
    
    cd ..
    return 0
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the novara-mvp root directory"
    exit 1
fi

# Parse command line arguments
ENVIRONMENT=${1:-"all"}
echo "Testing environment: $ENVIRONMENT"
echo ""

# Test Development Environment
if [ "$ENVIRONMENT" = "all" ] || [ "$ENVIRONMENT" = "development" ]; then
    echo "🔧 Testing Development Environment"
    echo "--------------------------------"
    
    # Test if development servers are running
    if curl -s http://localhost:4200 > /dev/null 2>&1; then
        test_frontend_url "http://localhost:4200" "Development Frontend"
        test_frontend_content "http://localhost:4200" "Development Frontend"
        test_frontend_api_connectivity "http://localhost:4200" "http://localhost:9002" "Development"
    else
        print_warning "Development servers not running. Start with: ./scripts/start-local.sh"
        test_result 1 "Development frontend not accessible"
    fi
    
    test_frontend_build "development" "Development"
    test_environment_features "development" "Development"
    echo ""
fi

# Test Staging Environment
if [ "$ENVIRONMENT" = "all" ] || [ "$ENVIRONMENT" = "staging" ]; then
    echo "🧪 Testing Staging Environment"
    echo "-----------------------------"
    
    STAGING_FRONTEND="https://novara-bd6xsx1ru-novara-fertility.vercel.app"
    STAGING_BACKEND="https://novara-staging-staging.up.railway.app"
    
    test_frontend_url "$STAGING_FRONTEND" "Staging Frontend"
    test_frontend_content "$STAGING_FRONTEND" "Staging Frontend"
    test_frontend_api_connectivity "$STAGING_FRONTEND" "$STAGING_BACKEND" "Staging"
    test_frontend_build "staging" "Staging"
    test_environment_features "staging" "Staging"
    echo ""
fi

# Test Production Environment
if [ "$ENVIRONMENT" = "all" ] || [ "$ENVIRONMENT" = "production" ]; then
    echo "🚀 Testing Production Environment"
    echo "--------------------------------"
    
    PROD_FRONTEND="https://novara-mvp.vercel.app"
    PROD_BACKEND="https://novara-mvp-production.up.railway.app"
    
    test_frontend_url "$PROD_FRONTEND" "Production Frontend"
    test_frontend_content "$PROD_FRONTEND" "Production Frontend"
    test_frontend_api_connectivity "$PROD_FRONTEND" "$PROD_BACKEND" "Production"
    test_frontend_build "production" "Production"
    test_environment_features "production" "Production"
    echo ""
fi

# Summary
echo "📊 Frontend Environment Test Results"
echo "==================================="
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    print_success "🎉 All frontend environment tests passed!"
    exit 0
else
    print_error "⚠️  Some frontend environment tests failed!"
    echo ""
    echo "🔧 Troubleshooting Tips:"
    echo "- Check if development servers are running: ./scripts/start-local.sh"
    echo "- Verify environment variables are set correctly"
    echo "- Check Vercel and Railway deployment status"
    echo "- Run individual environment tests: $0 [development|staging|production]"
    exit 1
fi 