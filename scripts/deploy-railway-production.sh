#!/bin/bash

# Railway Production Deployment Script
# This script uses the CLI method that works consistently

set -e  # Exit on any error

echo "🚂 Railway Production Deployment"
echo "================================="

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found. Run this from the project root."
    exit 1
fi

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Error: Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi

# Verify Railway authentication
echo "🔐 Checking Railway authentication..."
railway whoami

# Check current Railway status
echo "📊 Current Railway status:"
railway status

# Deploy using the CLI method that works
echo "🚀 Deploying to Railway production..."
echo "   Using: cd backend && railway up"
echo ""

cd backend
railway up

# Check deployment status
echo ""
echo "📊 Checking deployment status..."
railway status

# Test health endpoint
echo ""
echo "🏥 Testing health endpoint..."
HEALTH_URL="https://novara-mvp-production.up.railway.app/api/health"
HEALTH_RESPONSE=$(curl -s "$HEALTH_URL")

if [[ "$HEALTH_RESPONSE" == *"ok"* ]]; then
    echo "✅ Health check passed: $HEALTH_RESPONSE"
    echo "🎉 Railway production deployment successful!"
else
    echo "❌ Health check failed: $HEALTH_RESPONSE"
    echo "🔍 Check Railway logs: railway logs"
    exit 1
fi

echo ""
echo "📋 Deployment Summary:"
echo "   Backend URL: https://novara-mvp-production.up.railway.app"
echo "   Health Check: ✅ Working"
echo "   Environment: Production"
echo "   Database: Airtable"
echo ""
echo "✅ Railway production deployment complete!" 