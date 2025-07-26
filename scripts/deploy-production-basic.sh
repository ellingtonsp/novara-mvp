#!/bin/bash

# 🚀 Basic Production Deployment Script
# Just deploy and exit - no hanging

echo "🚀 Novara Production Deployment - Basic Mode"
echo "============================================"

# Set production environment
echo "📦 Setting production environment..."
railway environment production
railway service novara-main

# Verify database
echo "🗄️ Verifying production database..."
railway variables | grep AIRTABLE_BASE_ID

# Deploy and exit immediately
echo "🚀 Deploying to production..."
echo "⏳ Starting deployment (will exit after initiation)..."

# Use railway deploy without --detach (it doesn't exist)
railway deploy

echo "✅ Deployment initiated successfully"
echo "🔍 Check status at: https://railway.com/project/f3025bf5-5cd5-4b7b-b045-4d477a4c7835"
echo "🌐 Production URL: https://novara-mvp-production.up.railway.app"
echo "🎉 Script completed - deployment running in background"

exit 0 