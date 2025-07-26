#!/bin/bash

# 🧪 Vercel Environment Test Script
# Tests staging and production environments for Novara MVP

set -e

echo "🧪 Novara MVP - Vercel Environment Testing"
echo "=========================================="

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

# Function to test URL
test_url() {
    local url=$1
    local name=$2
    local timeout=10
    
    print_status "Testing $name: $url"
    
    if curl -s -f --max-time $timeout "$url" > /dev/null; then
        print_success "$name is accessible!"
        return 0
    else
        print_error "$name is not accessible!"
        return 1
    fi
}

# Function to test API endpoint
test_api() {
    local base_url=$1
    local name=$2
    local timeout=10
    
    print_status "Testing $name API: $base_url/api/health"
    
    response=$(curl -s --max-time $timeout "$base_url/api/health" 2>/dev/null || echo "ERROR")
    
    if [[ "$response" == *"status"* ]] && [[ "$response" != "ERROR" ]]; then
        print_success "$name API is responding!"
        echo "   Response: $response"
        return 0
    else
        print_error "$name API is not responding!"
        return 1
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the novara-mvp root directory"
    exit 1
fi

echo ""
print_status "Testing Vercel Frontend Environments..."

# Production Frontend
PROD_FRONTEND="https://novara-mvp-novara-fertility.vercel.app"
test_url "$PROD_FRONTEND" "Production Frontend"

# Staging Frontend (if exists)
STAGING_FRONTEND="https://novara-mvp-git-staging-novara-fertility.vercel.app"
test_url "$STAGING_FRONTEND" "Staging Frontend"

echo ""
print_status "Testing Railway Backend Environments..."

# Production Backend
PROD_BACKEND="https://novara-backend.up.railway.app"
test_api "$PROD_BACKEND" "Production Backend"

# Staging Backend
STAGING_BACKEND="https://novara-backend-staging.up.railway.app"
test_api "$STAGING_BACKEND" "Staging Backend"

echo ""
print_status "Testing Environment Variables..."

# Navigate to frontend directory
cd frontend

# Check Vercel environment variables
print_status "Current Vercel environment variables:"
npx vercel env ls

echo ""
print_status "Testing environment variable configuration..."

# Test production environment variables
prod_api_url=$(npx vercel env pull .env.prod 2>/dev/null && grep VITE_API_URL .env.prod | cut -d'=' -f2 || echo "NOT_SET")
if [[ "$prod_api_url" == "https://novara-backend.up.railway.app" ]]; then
    print_success "Production VITE_API_URL is correctly configured"
else
    print_warning "Production VITE_API_URL is not correctly configured: $prod_api_url"
fi

# Test staging environment variables
staging_api_url=$(npx vercel env pull .env.staging 2>/dev/null && grep VITE_API_URL .env.staging | cut -d'=' -f2 || echo "NOT_SET")
if [[ "$staging_api_url" == "https://novara-backend-staging.up.railway.app" ]]; then
    print_success "Staging VITE_API_URL is correctly configured"
else
    print_warning "Staging VITE_API_URL is not correctly configured: $staging_api_url"
fi

# Clean up temporary files
rm -f .env.prod .env.staging

echo ""
print_status "Testing Frontend-Backend Integration..."

# Test if frontend can reach backend APIs
print_status "Testing production frontend → backend integration..."

# Get the actual frontend URL that's working
if curl -s -f "$PROD_FRONTEND" > /dev/null; then
    print_success "Production frontend is accessible"
    
    # Test if frontend can make API calls (this would require a more complex test)
    print_status "Note: Frontend-backend integration test requires manual verification"
    print_status "Please visit: $PROD_FRONTEND"
    print_status "And check if the app loads and can make API calls"
else
    print_error "Production frontend is not accessible"
fi

echo ""
print_status "Deployment Status Summary:"

# Check Vercel deployment status
print_status "Latest Vercel deployments:"
npx vercel ls --limit 5

echo ""
print_success "Vercel environment testing complete!"
echo ""
echo "🎯 Summary:"
echo "   Production Frontend: $PROD_FRONTEND"
echo "   Staging Frontend:    $STAGING_FRONTEND"
echo "   Production Backend:  $PROD_BACKEND"
echo "   Staging Backend:     $STAGING_BACKEND"
echo ""
echo "📋 Next Steps:"
echo "1. If staging frontend is not accessible, configure Git branch deployment in Vercel Dashboard"
echo "2. If backend APIs are failing, check Railway deployment status"
echo "3. Test the complete user flow in both environments"
echo "4. Verify environment variables are correctly set for each environment" 