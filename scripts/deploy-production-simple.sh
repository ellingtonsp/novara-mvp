#!/bin/bash

# 🚀 Simple Production Deployment Script
# Quick deployment without hanging

echo "🚀 Novara Production Deployment - Simple Mode"
echo "============================================="

# Verify Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found"
    exit 1
fi

# Set production environment
echo "📦 Setting production environment..."
railway environment production
railway service novara-main

# Verify database
echo "🗄️ Verifying production database..."
DB_CONFIG=$(railway variables | grep AIRTABLE_BASE_ID)

if [[ "$DB_CONFIG" == *"app5QWCcVbCnVg2Gg"* ]]; then
    echo "✅ Production database verified"
else
    echo "❌ Wrong database configuration"
    exit 1
fi

# Deploy with timeout
echo "🚀 Deploying to production..."
echo "⏳ Starting deployment (will timeout after 3 minutes)..."

timeout 180 railway up || {
    echo "⚠️ Deployment timed out or completed"
    echo "🔍 Checking if deployment was successful..."
}

# Quick health check
echo "🧪 Testing production health..."
sleep 5

if curl -s -m 10 https://novara-mvp-production.up.railway.app/api/health | grep -q "ok"; then
    echo "✅ Production is healthy"
    echo "🌐 URL: https://novara-mvp-production.up.railway.app"
else
    echo "⚠️ Health check failed - deployment may still be in progress"
fi

echo "🎉 Deployment script completed"
exit 0 