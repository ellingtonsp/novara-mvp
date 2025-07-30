#!/bin/bash

# Enable Schema V2 in Railway Staging Environment
# This script enables the Schema V2 feature flag and restarts the staging service

echo "🚀 Enabling Schema V2 in Railway Staging Environment"
echo ""

# Check if railway CLI is available
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    echo "   or visit: https://docs.railway.app/develop/cli"
    exit 1
fi

echo "1️⃣ Setting USE_SCHEMA_V2=true in staging environment..."

# Enable Schema V2 feature flag
railway variables --set "USE_SCHEMA_V2=true" --environment staging

if [ $? -eq 0 ]; then
    echo "✅ USE_SCHEMA_V2 environment variable set"
else
    echo "❌ Failed to set environment variable"
    echo "   You may need to run: railway login"
    exit 1
fi

echo ""
echo "2️⃣ Restarting staging service..."

# Restart the staging service to apply changes
railway redeploy --yes

if [ $? -eq 0 ]; then
    echo "✅ Staging service restarted"
else
    echo "❌ Failed to restart service"
    exit 1
fi

echo ""
echo "3️⃣ Waiting for service to come online..."

# Wait a moment for the service to restart
sleep 10

echo ""
echo "✅ Schema V2 enabled in staging environment!"
echo ""
echo "🔍 Next steps:"
echo "1. Run verification script:"
echo "   node backend/scripts/verify-staging-deployment.js"
echo ""
echo "2. Check staging URL:"
echo "   https://novara-staging-staging.up.railway.app/api/v2/status"
echo ""
echo "3. Monitor logs:"
echo "   railway logs --environment staging"