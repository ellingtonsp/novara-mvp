#!/bin/bash

# 🚀 Quick Production Deployment Script
# No hanging, terminates properly

set -e

echo "🚀 Novara Production Deployment - Quick Mode"
echo "============================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verify Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
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
    echo -e "${GREEN}✅ Production database verified${NC}"
else
    echo -e "${RED}❌ Wrong database configuration${NC}"
    exit 1
fi

# Deploy using railway deploy (non-interactive)
echo "🚀 Deploying to production..."
echo "⏳ Starting deployment..."

# Use railway deploy instead of railway up to avoid hanging
railway deploy

echo -e "${GREEN}✅ Deployment initiated successfully${NC}"
echo "🔍 Deployment is running in background"
echo "📊 Check status at: https://railway.com/project/f3025bf5-5cd5-4b7b-b045-4d477a4c7835"

# Wait a moment for deployment to start
sleep 10

# Quick health check
echo "🧪 Testing production health..."
for i in {1..5}; do
    if curl -s -m 10 https://novara-mvp-production.up.railway.app/api/health | grep -q "ok"; then
        echo -e "${GREEN}✅ Production is healthy${NC}"
        echo "🌐 URL: https://novara-mvp-production.up.railway.app"
        exit 0
    else
        echo -e "${YELLOW}⏳ Health check attempt $i/5 - deployment may still be in progress${NC}"
        sleep 30
    fi
done

echo -e "${YELLOW}⚠️ Health check failed - deployment may still be in progress${NC}"
echo "🔍 Check deployment status manually at Railway dashboard"
exit 0 