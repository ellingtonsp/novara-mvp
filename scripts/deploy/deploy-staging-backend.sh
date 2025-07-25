#!/bin/bash

# Novara MVP - Staging Backend Deployment Script
# Handles Railway deployment with proper timeout and status checking

set -e  # Exit on any error

echo "🚂 Deploying Backend to Railway Staging..."
echo "========================================"

# Check Railway context
echo "🔍 Checking Railway context..."
railway status

# Verify we're in the right environment
if ! railway status | grep -q "Environment: staging"; then
    echo "❌ Not in staging environment. Switching..."
    railway environment staging
fi

if ! railway status | grep -q "Service: novara-staging"; then
    echo "❌ Not in novara-staging service. Switching..."
    railway service novara-staging
fi

echo "✅ Railway context verified"

# Deploy with timeout
echo "📦 Deploying to Railway..."
echo "⏱️  This may take 2-3 minutes..."

# Start deployment in background
railway up &
RAILWAY_PID=$!

# Wait for deployment with timeout
TIMEOUT=300  # 5 minutes
ELAPSED=0
INTERVAL=10  # Check every 10 seconds

while [ $ELAPSED -lt $TIMEOUT ]; do
    if ! kill -0 $RAILWAY_PID 2>/dev/null; then
        echo "✅ Railway deployment completed"
        break
    fi
    
    echo "⏳ Deployment in progress... ($ELAPSED seconds elapsed)"
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

# If deployment is still running after timeout, kill it
if kill -0 $RAILWAY_PID 2>/dev/null; then
    echo "⏰ Deployment timeout reached. Killing process..."
    kill $RAILWAY_PID
    echo "⚠️  Deployment may still be running in background"
    echo "💡 Check Railway dashboard for status: https://railway.app/project/f3025bf5-5cd5-4b7b-b045-4d477a4c7835"
else
    echo "✅ Deployment process completed"
fi

# Wait a moment for deployment to settle
echo "⏳ Waiting for deployment to settle..."
sleep 30

# Test backend health
echo "🔍 Testing backend health..."
if curl -f https://novara-staging-staging.up.railway.app/api/health > /dev/null 2>&1; then
    echo "✅ Backend health check passed"
else
    echo "⚠️  Backend health check failed - deployment may still be in progress"
    echo "💡 Check Railway dashboard for deployment status"
fi

echo "🎉 Staging backend deployment script completed!"
echo "🔗 Backend URL: https://novara-staging-staging.up.railway.app"
echo "📊 Railway Dashboard: https://railway.app/project/f3025bf5-5cd5-4b7b-b045-4d477a4c7835" 