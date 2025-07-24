#!/bin/bash
# Novara MVP - Context Verification Script
# Run this at the start of any session to verify critical context

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Novara MVP Context Verification${NC}"
echo "====================================="
echo ""

# Check working directory
echo -e "${CYAN}📁 Working Directory:${NC}"
CURRENT_DIR=$(pwd)
echo "   $CURRENT_DIR"

if [[ "$CURRENT_DIR" == *"novara-mvp"* ]]; then
    echo -e "${GREEN}✅ In correct project directory${NC}"
else
    echo -e "${RED}❌ Not in novara-mvp directory${NC}"
    echo -e "${YELLOW}Please navigate to the project root${NC}"
    exit 1
fi

echo ""

# Check git branch
echo -e "${CYAN}🌿 Git Branch:${NC}"
CURRENT_BRANCH=$(git branch --show-current)
echo "   $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" = "staging" ]; then
    echo -e "${GREEN}✅ On staging branch (safe for staging work)${NC}"
elif [ "$CURRENT_BRANCH" = "main" ]; then
    echo -e "${YELLOW}⚠️  On main branch (production work)${NC}"
elif [ "$CURRENT_BRANCH" = "development" ]; then
    echo -e "${GREEN}✅ On development branch (safe for development)${NC}"
else
    echo -e "${YELLOW}⚠️  On $CURRENT_BRANCH branch${NC}"
fi

echo ""

# Check Railway context
echo -e "${CYAN}🚂 Railway Context:${NC}"
if command -v railway &> /dev/null; then
    RAILWAY_STATUS=$(railway status 2>/dev/null || echo "Not linked")
    echo "   $RAILWAY_STATUS"
    
    if [[ "$RAILWAY_STATUS" == *"staging"* ]]; then
        echo -e "${GREEN}✅ Railway in staging environment${NC}"
    elif [[ "$RAILWAY_STATUS" == *"production"* ]]; then
        echo -e "${YELLOW}⚠️  Railway in production environment${NC}"
    else
        echo -e "${RED}❌ Railway not properly configured${NC}"
    fi
else
    echo -e "${RED}❌ Railway CLI not installed${NC}"
fi

echo ""

# Check Vercel context
echo -e "${CYAN}🌐 Vercel Context:${NC}"
if command -v vercel &> /dev/null; then
    VERCEL_PROJECTS=$(vercel ls 2>/dev/null | head -5 || echo "Not configured")
    echo "   $VERCEL_PROJECTS"
else
    echo -e "${RED}❌ Vercel CLI not installed${NC}"
fi

echo ""

# Show current environment URLs
echo -e "${CYAN}🔗 Current Environment URLs:${NC}"
echo "   Staging Frontend: https://novara-bd6xsx1ru-novara-fertility.vercel.app"
echo "   Staging Backend:  https://novara-staging-staging.up.railway.app"
echo "   Production Frontend: https://novara-mvp.vercel.app"
echo "   Production Backend:  https://novara-mvp-production.up.railway.app"

echo ""

# Show recent commits
echo -e "${CYAN}📝 Recent Commits:${NC}"
git log --oneline -3

echo ""

# Safety warnings
echo -e "${YELLOW}🚨 Safety Reminders:${NC}"
echo "   • NEVER use 'vercel --prod' for staging work"
echo "   • ALWAYS verify Railway environment before deployment"
echo "   • ALWAYS follow Development → Staging → Production workflow"
echo "   • NEVER bypass staging testing"

echo ""
echo -e "${GREEN}✅ Context verification complete${NC}" 