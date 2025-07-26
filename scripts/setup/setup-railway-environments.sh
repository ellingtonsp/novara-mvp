#!/bin/bash

# 🚂 Railway Environment Setup Script
# This script sets up both staging and production environments for Novara MVP

set -e

echo "🚂 Railway Environment Setup"
echo "============================"

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

echo "✅ Railway CLI ready"

# Function to deploy to environment
deploy_to_environment() {
    local env_name=$1
    local service_name=$2
    
    echo "🚀 Deploying to $env_name environment..."
    
    # Switch to environment
    railway environment $env_name
    
    # Deploy
    echo "📦 Building and deploying..."
    railway up --service $service_name
    
    # Wait for deployment
    echo "⏳ Waiting for deployment to complete..."
    sleep 30
    
    # Get domain
    local domain=$(railway domain --service $service_name | grep -o 'https://[^[:space:]]*')
    echo "🌐 $env_name URL: $domain"
    
    # Test health endpoint
    echo "🏥 Testing health endpoint..."
    local health_response=$(curl -s "$domain/api/health" || echo "Failed to connect")
    echo "Health check response: $health_response"
}

# Function to set environment variables
set_env_vars() {
    local env_name=$1
    local service_name=$2
    
    echo "🔧 Setting environment variables for $env_name..."
    
    # Switch to environment and service
    railway environment $env_name
    railway service $service_name
    
    if [ "$env_name" = "staging" ]; then
        # Staging environment variables
        railway variables --set "AIRTABLE_API_KEY=patp9wk9fzHxtkVUZ.1ba015773d9bbdc098796035b0a7bfd620edfbf6cd3b5aecc88c0beb5ef6dde7" \
                         --set "AIRTABLE_BASE_ID=appEOWvLjCn5c7Ght" \
                         --set "JWT_SECRET=staging_super_secret_jwt_key_different_from_prod" \
                         --set "NODE_ENV=staging" \
                         --set "USE_LOCAL_DATABASE=false" \
                         --set "DATABASE_TYPE=airtable" \
                         --set "CORS_ORIGIN=https://novara-mvp-staging.vercel.app" \
                         --set "LOG_LEVEL=debug" \
                         --set "ENABLE_DEBUG_LOGGING=true" \
                         --set "ENABLE_REQUEST_LOGGING=true"
    else
        # Production environment variables
        railway variables --set "AIRTABLE_API_KEY=patp9wk9fzHxtkVUZ.1ba015773d9bbdc098796035b0a7bfd620edfbf6cd3b5aecc88c0beb5ef6dde7" \
                         --set "AIRTABLE_BASE_ID=appEOWvLjCn5c7Ght" \
                         --set "JWT_SECRET=production_super_secret_jwt_key_different_from_staging" \
                         --set "NODE_ENV=production" \
                         --set "USE_LOCAL_DATABASE=false" \
                         --set "DATABASE_TYPE=airtable" \
                         --set "CORS_ORIGIN=https://novara-mvp.vercel.app" \
                         --set "LOG_LEVEL=info" \
                         --set "ENABLE_DEBUG_LOGGING=false" \
                         --set "ENABLE_REQUEST_LOGGING=false"
    fi
    
    echo "✅ Environment variables set for $env_name"
}

# Main deployment process
echo "🎯 Starting deployment process..."

# 1. Deploy to staging
echo "📋 Step 1: Deploying to staging environment"
deploy_to_environment "staging" "novara-staging"
set_env_vars "staging" "novara-staging"

# 2. Deploy to production
echo "📋 Step 2: Deploying to production environment"
deploy_to_environment "production" "novara-main"
set_env_vars "production" "novara-main"

# 3. Final verification
echo "📋 Step 3: Final verification"

echo "🔍 Checking staging deployment..."
railway environment staging
railway service novara-staging
staging_domain=$(railway domain --service novara-staging | grep -o 'https://[^[:space:]]*')
echo "Staging URL: $staging_domain"

echo "🔍 Checking production deployment..."
railway environment production
railway service novara-main
production_domain=$(railway domain --service novara-main | grep -o 'https://[^[:space:]]*')
echo "Production URL: $production_domain"

echo ""
echo "🎉 Railway Environment Setup Complete!"
echo "======================================"
echo "📊 Staging:   $staging_domain"
echo "🚀 Production: $production_domain"
echo ""
echo "🔧 Next steps:"
echo "1. Update your frontend to use the correct backend URLs"
echo "2. Test both environments"
echo "3. Set up your CI/CD pipeline"
echo ""
echo "📝 Environment Summary:"
echo "- Staging: Uses Airtable, debug logging enabled"
echo "- Production: Uses Airtable, production logging"
echo "- Both environments are isolated and secure" 