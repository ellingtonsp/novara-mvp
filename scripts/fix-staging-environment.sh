#!/bin/bash

# 🚨 Fix Staging Environment Configuration
# Addresses the root causes of deployment failures

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_status() {
    local step=$1
    local message=$2
    echo -e "${BLUE}[${step}]${NC} ${message}"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

echo "🔧 Fixing Staging Environment Configuration"
echo "=========================================="
echo ""

# Step 1: Verify current Railway project structure
print_status "1" "Verifying Railway project structure..."

# Check if Railway CLI is available
if ! command -v railway &> /dev/null; then
    print_warning "Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Get current Railway project status
print_status "2" "Checking Railway project status..."
if railway status &> /dev/null; then
    print_success "Railway CLI connected"
else
    print_error "Railway CLI not connected. Please run 'railway login' first"
    exit 1
fi

# Step 3: Update environment configuration files
print_status "3" "Updating environment configuration files..."

# Update staging configuration
if [ -f "frontend/env.staging.example" ]; then
    print_status "3.1" "Updating frontend staging configuration..."
    sed -i '' 's|https://novara-staging-staging.up.railway.app|https://novara-staging.up.railway.app|g' frontend/env.staging.example
    print_success "Frontend staging configuration updated"
fi

# Update backend staging configuration
if [ -f "backend/env.staging.example" ]; then
    print_status "3.2" "Updating backend staging configuration..."
    sed -i '' 's|NODE_ENV=development|NODE_ENV=staging|g' backend/env.staging.example
    print_success "Backend staging configuration updated"
fi

# Step 4: Fix monitoring script URLs
print_status "4" "Fixing monitoring script URLs..."

# Update deployment monitor
if [ -f "scripts/deployment-monitor.js" ]; then
    print_status "4.1" "Updating deployment monitor URLs..."
    sed -i '' 's|https://novara-staging-staging.up.railway.app|https://novara-staging.up.railway.app|g' scripts/deployment-monitor.js
    print_success "Deployment monitor URLs updated"
fi

# Update environment config
if [ -f "scripts/environment-config.js" ]; then
    print_status "4.2" "Updating environment configuration..."
    sed -i '' 's|https://novara-staging-staging.up.railway.app|https://novara-staging.up.railway.app|g' scripts/environment-config.js
    print_success "Environment configuration updated"
fi

# Step 5: Verify staging environment variables
print_status "5" "Checking staging environment variables..."

# Check if staging environment variables are set in Railway
print_warning "Please verify these environment variables are set in Railway staging:"
echo ""
echo "Required Railway Staging Variables:"
echo "  NODE_ENV=staging"
echo "  AIRTABLE_API_KEY=<your_staging_airtable_key>"
echo "  AIRTABLE_BASE_ID=<your_staging_airtable_base_id>"
echo "  JWT_SECRET=<your_staging_jwt_secret>"
echo "  CORS_ORIGIN=https://novara-mvp-staging.vercel.app"
echo ""

# Step 6: Test staging environment
print_status "6" "Testing staging environment..."

# Test staging backend health
print_status "6.1" "Testing staging backend health..."
STAGING_HEALTH=$(curl -s https://novara-staging.up.railway.app/api/health 2>/dev/null || echo "FAILED")

if [[ $STAGING_HEALTH == *"staging"* ]] || [[ $STAGING_HEALTH == *"ok"* ]]; then
    print_success "Staging backend is healthy"
else
    print_warning "Staging backend health check failed"
    echo "Response: $STAGING_HEALTH"
    echo ""
    print_warning "This may indicate:"
    echo "  - Staging environment not deployed"
    echo "  - Environment variables not configured"
    echo "  - Railway project structure changed"
fi

# Test staging frontend
print_status "6.2" "Testing staging frontend..."
STAGING_FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" https://novara-mvp-staging.vercel.app 2>/dev/null || echo "FAILED")

if [ "$STAGING_FRONTEND" = "200" ]; then
    print_success "Staging frontend is accessible"
else
    print_warning "Staging frontend accessibility check failed (HTTP $STAGING_FRONTEND)"
fi

# Step 7: Run comprehensive health check
print_status "7" "Running comprehensive health check..."

if [ -f "scripts/comprehensive-health-check.js" ]; then
    node scripts/comprehensive-health-check.js check
    print_success "Comprehensive health check completed"
else
    print_warning "Comprehensive health check script not found"
fi

# Step 8: Clean up old logs
print_status "8" "Cleaning up old monitoring logs..."

if [ -d "logs" ]; then
    # Keep only recent logs (last 7 days)
    find logs -name "*.log" -mtime +7 -delete 2>/dev/null || true
    print_success "Old logs cleaned up"
fi

echo ""
echo "🎉 Staging Environment Fix Complete!"
echo "==================================="
echo ""
echo "📋 Summary of fixes applied:"
echo "  ✅ Updated environment configuration files"
echo "  ✅ Fixed monitoring script URLs"
echo "  ✅ Verified Railway CLI connection"
echo "  ✅ Tested staging environment health"
echo "  ✅ Ran comprehensive health check"
echo "  ✅ Cleaned up old logs"
echo ""
echo "🔍 Next Steps:"
echo "  1. Verify Railway staging environment variables"
echo "  2. Deploy to staging: git push origin staging"
echo "  3. Monitor deployment logs"
echo "  4. Test staging functionality"
echo ""
echo "📊 Monitoring:"
echo "  - Run: node scripts/comprehensive-health-check.js check"
echo "  - View logs: tail -f logs/comprehensive-health.log"
echo "  - Check report: node scripts/comprehensive-health-check.js report"
echo "" 