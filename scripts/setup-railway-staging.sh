#!/bin/bash

# 🚀 Railway Staging Environment Setup Script
# Automates the setup of Railway staging environment variables

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Railway Staging Environment Setup${NC}"
echo "=========================================="
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking Prerequisites...${NC}"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Please install it first:${NC}"
    echo "   npm install -g @railway/cli"
    exit 1
else
    echo -e "${GREEN}✅ Railway CLI found${NC}"
fi

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}🔐 Logging into Railway...${NC}"
    railway login
else
    echo -e "${GREEN}✅ Already logged into Railway${NC}"
fi

echo ""

# Railway Staging Setup
echo -e "${BLUE}🔧 Setting up Railway Staging Environment...${NC}"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "railway.json" ]; then
    echo -e "${RED}❌ Error: railway.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Check if staging environment exists
if railway environment staging &> /dev/null; then
    echo -e "${GREEN}✅ Railway staging environment found${NC}"
else
    echo -e "${YELLOW}🏗️ Creating Railway staging environment...${NC}"
    railway environment new staging
fi

echo ""
echo -e "${YELLOW}⚠️ Next Steps for Railway Staging:${NC}"
echo "1. Go to Railway dashboard: https://railway.app"
echo "2. Select your 'novara-mvp' project"
echo "3. Switch to 'staging' environment (top right dropdown)"
echo "4. Go to Variables tab"
echo "5. Add these environment variables:"
echo ""

echo -e "${CYAN}Required Variables:${NC}"
echo "   NODE_ENV=staging"
echo "   USE_LOCAL_DATABASE=false"
echo "   DATABASE_TYPE=airtable"
echo "   AIRTABLE_API_KEY=your_staging_airtable_api_key"
echo "   AIRTABLE_BASE_ID=your_staging_airtable_base_id"
echo "   JWT_SECRET=your_staging_jwt_secret_64_chars_min"
echo "   CORS_ORIGIN=https://novara-mvp-staging.vercel.app"
echo ""

echo -e "${CYAN}Optional Variables:${NC}"
echo "   LOG_LEVEL=debug"
echo "   ENABLE_DEBUG_LOGGING=true"
echo "   ENABLE_REQUEST_LOGGING=true"
echo ""

echo -e "${BLUE}📋 Manual Setup Checklist${NC}"
echo "=============================="
echo ""
echo -e "${YELLOW}Railway Staging:${NC}"
echo "□ Set environment variables in Railway dashboard (staging environment)"
echo "□ Deploy staging backend: railway environment staging && railway up"
echo "□ Get Railway staging domain from dashboard"
echo "□ Test health check: curl [RAILWAY_STAGING_DOMAIN]/api/health"
echo ""
echo -e "${YELLOW}Integration:${NC}"
echo "□ Update Vercel staging to use Railway staging API URL"
echo "□ Test full staging integration"
echo "□ Verify user authentication flow"
echo "□ Test daily check-in functionality"
echo ""

echo -e "${GREEN}🎉 Railway Staging Environment Setup Guide Complete!${NC}"
echo ""
echo -e "${CYAN}📚 For detailed instructions, see:${NC}"
echo "   backend/railway-staging.env.example"
echo "   docs/deployment-troubleshooting.md"
echo ""
echo -e "${CYAN}🧪 To test staging environment:${NC}"
echo "   ./scripts/api-endpoint-test.sh staging"
echo ""
echo -e "${PURPLE}Next: Follow the manual setup steps above to complete your staging environment!${NC}" 