#!/bin/bash
# Novara MVP - Staging Frontend Deployment Script
# SAFETY: This script ONLY deploys to staging, never production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Frontend to STAGING Environment${NC}"
echo "================================================"
echo ""

# Safety check - verify we're on staging branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "staging" ]; then
    echo -e "${RED}❌ SAFETY CHECK FAILED: Not on staging branch${NC}"
    echo -e "${YELLOW}Current branch: $CURRENT_BRANCH${NC}"
    echo -e "${YELLOW}Please switch to staging branch first:${NC}"
    echo "   git checkout staging"
    exit 1
fi

echo -e "${GREEN}✅ Safety check passed: On staging branch${NC}"

# Check prerequisites
echo ""
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check complete${NC}"

# Build frontend for staging
echo ""
echo -e "${BLUE}📦 Building Frontend for Staging...${NC}"

cd frontend

# Check if staging env file exists
if [ ! -f ".env.staging" ]; then
    echo -e "${YELLOW}⚠️  .env.staging not found, copying from example...${NC}"
    cp env.staging.example .env.staging
fi

# Build with staging mode
echo "Building with staging configuration..."
npm run build:staging

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend build complete${NC}"

# Deploy to Vercel staging (SAFETY: Explicitly target staging)
echo ""
echo -e "${BLUE}🌐 Deploying Frontend to Vercel STAGING...${NC}"
echo -e "${YELLOW}⚠️  SAFETY: Using --target staging to prevent production deployment${NC}"

vercel --target staging

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend staging deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend deployed to STAGING${NC}"

cd ..

echo ""
echo -e "${GREEN}🎉 Staging Frontend Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo -e "${CYAN}📋 Next Steps:${NC}"
echo "1. Test the staging environment"
echo "2. Verify all features work correctly"
echo "3. Run integration tests"
echo "4. Deploy to production when ready (using separate script)"
echo ""
echo -e "${CYAN}🔗 Staging URL:${NC}"
echo "   Frontend: https://novara-mvp-staging.vercel.app"
echo ""
echo -e "${YELLOW}⚠️  REMEMBER: This was a STAGING deployment only${NC}"
echo -e "${YELLOW}   Production deployment requires separate approval and script${NC}" 