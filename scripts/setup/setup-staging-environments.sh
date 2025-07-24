#!/bin/bash

# 🚀 Staging Environment Setup Script
# Automates the setup of Railway (backend) and Vercel (frontend) staging environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Novara Staging Environment Setup${NC}"
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

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Please install it first:${NC}"
    echo "   npm install -g vercel"
    exit 1
else
    echo -e "${GREEN}✅ Vercel CLI found${NC}"
fi

echo ""

# Railway Backend Setup
echo -e "${BLUE}🔧 Setting up Railway Staging Backend...${NC}"
echo "================================================"

cd backend

# Check if already logged in to Railway
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}🔐 Logging into Railway...${NC}"
    railway login
else
    echo -e "${GREEN}✅ Already logged into Railway${NC}"
fi

# Check if staging project exists
if railway status &> /dev/null; then
    echo -e "${GREEN}✅ Railway staging project already exists${NC}"
else
    echo -e "${YELLOW}🏗️ Creating Railway staging project...${NC}"
    railway init --name "novara-staging"
fi

echo ""
echo -e "${YELLOW}⚠️ Next Steps for Railway Backend:${NC}"
echo "1. Go to Railway dashboard: https://railway.app"
echo "2. Select your 'novara-staging' project"
echo "3. Go to Variables tab"
echo "4. Add these environment variables:"
echo ""
echo -e "${CYAN}Required Variables:${NC}"
echo "   NODE_ENV=staging"
echo "   USE_LOCAL_DATABASE=false"
echo "   DATABASE_TYPE=airtable"
echo "   PORT=3000"
echo "   AIRTABLE_API_KEY=your_staging_airtable_api_key"
echo "   AIRTABLE_BASE_ID=your_staging_airtable_base_id"
echo "   JWT_SECRET=your_staging_jwt_secret_64_chars_min"
echo ""
echo -e "${CYAN}Optional Variables:${NC}"
echo "   LOG_LEVEL=info"
echo "   CORS_ORIGIN=https://novara-mvp-staging.vercel.app"
echo ""

# Vercel Frontend Setup
echo -e "${BLUE}🎨 Setting up Vercel Staging Frontend...${NC}"
echo "================================================"

cd ../frontend

# Check if already logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}🔐 Logging into Vercel...${NC}"
    vercel login
else
    echo -e "${GREEN}✅ Already logged into Vercel${NC}"
fi

echo ""
echo -e "${YELLOW}⚠️ Next Steps for Vercel Frontend:${NC}"
echo "1. Go to Vercel dashboard: https://vercel.com"
echo "2. Create new project or select existing"
echo "3. Connect your GitHub repository"
echo "4. Set project name to: novara-mvp-staging"
echo "5. Add these environment variables:"
echo ""
echo -e "${CYAN}Required Variables:${NC}"
echo "   VITE_ENV=staging"
echo "   VITE_API_URL=https://novara-staging.up.railway.app"
echo ""

# Return to root directory
cd ..

echo -e "${BLUE}📋 Manual Setup Checklist${NC}"
echo "=============================="
echo ""
echo -e "${YELLOW}Railway Backend:${NC}"
echo "□ Set environment variables in Railway dashboard"
echo "□ Deploy backend: cd backend && railway up"
echo "□ Get Railway domain from dashboard"
echo "□ Test health check: curl [RAILWAY_DOMAIN]/api/health"
echo ""
echo -e "${YELLOW}Vercel Frontend:${NC}"
echo "□ Set environment variables in Vercel dashboard"
echo "□ Deploy frontend: cd frontend && vercel --prod"
echo "□ Get Vercel domain from dashboard"
echo "□ Test frontend: curl [VERCEL_DOMAIN]"
echo ""
echo -e "${YELLOW}Integration:${NC}"
echo "□ Update CORS in backend to allow Vercel staging domain"
echo "□ Test full integration: ./scripts/api-endpoint-test.sh staging"
echo "□ Verify user authentication flow"
echo "□ Test daily check-in functionality"
echo ""

echo -e "${GREEN}🎉 Staging Environment Setup Guide Complete!${NC}"
echo ""
echo -e "${CYAN}📚 For detailed instructions, see:${NC}"
echo "   docs/staging-environment-setup.md"
echo ""
echo -e "${CYAN}🧪 To test staging environment:${NC}"
echo "   ./scripts/api-endpoint-test.sh staging"
echo ""
echo -e "${PURPLE}Next: Follow the manual setup steps above to complete your staging environment!${NC}" 