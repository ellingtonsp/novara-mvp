#!/bin/bash

# 🚀 Safe Staging Deployment Script
# Terminates after successful deployment

set -e  # Exit on any error

echo "🚀 Novara Staging Deployment - Safe Mode"
echo "======================================="

# Verify we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Verify Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Error: Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi

echo "🔍 Verifying Railway context..."

# Switch to staging environment
echo "📦 Setting staging environment..."
railway environment staging
railway service novara-staging

# Verify database configuration
echo "🗄️ Verifying staging database..."
DB_CONFIG=$(railway variables | grep AIRTABLE_BASE_ID)
if [[ $DB_CONFIG != *"appEOWvLjCn5c7Ght"* ]]; then
    echo "❌ CRITICAL ERROR: Wrong database configuration detected!"
    echo "Expected: appEOWvLjCn5c7Ght (staging)"
    echo "Found: $DB_CONFIG"
    exit 1
fi

echo "✅ Staging database verified: appEOWvLjCn5c7Ght"

# Deploy with timeout
echo "🚀 Deploying to staging..."
echo "⏳ This may take 2-3 minutes..."

# Use timeout to prevent hanging
timeout 300 railway up || {
    echo "⚠️ Railway deployment timed out, but checking if it succeeded..."
}

# Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
sleep 30

# Test staging health
echo "🔍 Testing staging health..."
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s https://novara-staging-staging.up.railway.app/api/health > /dev/null 2>&1; then
        echo "✅ Staging deployment successful!"
        
        # Get final health status
        HEALTH=$(curl -s https://novara-staging-staging.up.railway.app/api/health | jq -r '.status')
        ENV=$(curl -s https://novara-staging-staging.up.railway.app/api/health | jq -r '.environment')
        VERSION=$(curl -s https://novara-staging-staging.up.railway.app/api/health | jq -r '.version')
        
        echo "🎉 STAGING DEPLOYMENT COMPLETE!"
        echo "=============================="
        echo "✅ Status: $HEALTH"
        echo "✅ Environment: $ENV"
        echo "✅ Version: $VERSION"
        echo "✅ URL: https://novara-staging-staging.up.railway.app"
        echo ""
        echo "🧪 Ready for testing before production deployment!"
        exit 0
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "⏳ Waiting for staging to be ready... (attempt $RETRY_COUNT/$MAX_RETRIES)"
        sleep 15
    fi
done

echo "❌ Staging deployment failed or timed out"
echo "🔍 Check Railway logs: railway logs --tail 50"
exit 1 