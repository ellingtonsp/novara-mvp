#!/bin/bash

# 🚂 Railway Staging Deployment Script
# This script deploys the Novara MVP backend to Railway staging environment

set -e

echo "🚂 Railway Staging Deployment"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "railway.json" ]; then
    echo "❌ Error: railway.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

echo "🔍 Checking Railway login status..."
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged into Railway. Please run: railway login"
    exit 1
fi

echo "📋 Current Railway projects:"
railway projects

echo ""
echo "🚀 Deploying to Railway staging..."
echo "⚠️  Make sure you're on the 'staging' branch!"

# Deploy to Railway
railway up --service staging

echo ""
echo "✅ Deployment initiated!"
echo "🔍 Check deployment status at: https://railway.app/dashboard"
echo "🌐 Staging URL: https://novara-staging-production.up.railway.app"
echo ""
echo "📊 To check logs: railway logs --service staging"
echo "🔧 To open Railway dashboard: railway open" 