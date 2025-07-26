#!/bin/bash

# 🚀 Robust Staging Deployment Script
# Terminates properly and provides clear feedback

set -e  # Exit on any error

echo "🚀 Novara Staging Deployment - Robust Mode"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log with colors
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Verify we're in the right directory
if [ ! -f "package.json" ]; then
    error "Must run from project root directory"
    exit 1
fi

# Verify Railway CLI is installed
if ! command -v railway &> /dev/null; then
    error "Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi

log "🔍 Verifying Railway context..."

# Switch to staging environment
log "📦 Setting staging environment..."
railway environment staging
railway service novara-staging

# Verify database configuration
log "🗄️ Verifying staging database..."
DB_CONFIG=$(railway variables | grep AIRTABLE_BASE_ID || echo "NOT_FOUND")

if [[ "$DB_CONFIG" == *"appEOWvLjCn5c7Ght"* ]]; then
    success "Staging database verified: appEOWvLjCn5c7Ght"
else
    error "Wrong database configuration detected: $DB_CONFIG"
    error "Expected: appEOWvLjCn5c7Ght (staging)"
    exit 1
fi

# Check current status
log "📊 Checking current deployment status..."
railway status

log "🚀 Deploying to staging..."
log "⏳ This may take 2-3 minutes..."

# Deploy with timeout and proper termination
TIMEOUT=300  # 5 minutes timeout
DEPLOY_LOG="/tmp/railway_staging_deploy_$(date +%s).log"

# Start deployment in background with timeout
timeout $TIMEOUT railway up > "$DEPLOY_LOG" 2>&1 &
DEPLOY_PID=$!

# Monitor deployment
log "🔍 Monitoring deployment progress..."
while kill -0 $DEPLOY_PID 2>/dev/null; do
    if grep -q "Build completed" "$DEPLOY_LOG" 2>/dev/null; then
        success "Build completed successfully"
        break
    fi
    
    if grep -q "error\|Error\|ERROR" "$DEPLOY_LOG" 2>/dev/null; then
        error "Deployment error detected"
        cat "$DEPLOY_LOG"
        kill $DEPLOY_PID 2>/dev/null || true
        exit 1
    fi
    
    sleep 5
done

# Wait for deployment to complete
wait $DEPLOY_PID
DEPLOY_EXIT=$?

# Check deployment result
if [ $DEPLOY_EXIT -eq 0 ]; then
    success "Deployment completed successfully"
else
    error "Deployment failed or timed out"
    cat "$DEPLOY_LOG"
    exit 1
fi

# Clean up log file
rm -f "$DEPLOY_LOG"

# Test staging health
log "🧪 Testing staging health..."
sleep 10

HEALTH_RESPONSE=$(curl -s -m 30 https://novara-staging-staging.up.railway.app/api/health || echo "FAILED")

if [[ "$HEALTH_RESPONSE" == *"ok"* ]]; then
    success "Staging health check passed"
    echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    error "Staging health check failed"
    echo "Response: $HEALTH_RESPONSE"
    exit 1
fi

# Test analytics endpoint
log "🧪 Testing analytics endpoint..."
ANALYTICS_RESPONSE=$(curl -s -m 30 -X POST https://novara-staging-staging.up.railway.app/api/analytics/events \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test" \
    -d '{}' || echo "FAILED")

if [[ "$ANALYTICS_RESPONSE" == *"event_type is required"* ]]; then
    success "Analytics validation working correctly"
else
    warning "Analytics endpoint response: $ANALYTICS_RESPONSE"
fi

success "🎉 Staging deployment completed successfully!"
log "🌐 Staging URL: https://novara-staging-staging.up.railway.app"
log "📊 Health: https://novara-staging-staging.up.railway.app/api/health"

exit 0 