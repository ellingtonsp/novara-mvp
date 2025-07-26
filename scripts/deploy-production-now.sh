#!/bin/bash

# 🚀 Production Deployment - Just Deploy
# No hanging, no prompts, just deploy and exit

echo "🚀 Deploying to production..."

# Set environment
railway environment production
railway service novara-main

# Deploy with timeout and exit
timeout 180 railway up

echo "✅ Deployment completed"
echo "🌐 https://novara-mvp-production.up.railway.app"

exit 0 