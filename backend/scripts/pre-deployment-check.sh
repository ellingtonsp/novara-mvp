#!/bin/bash

# Pre-deployment validation script
# Run this before pushing to staging or production

echo "🚀 Pre-Deployment Checklist for Novara MVP"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any checks fail
FAILED=0

# 1. Check current branch
echo "1. Checking Git branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" == "main" ]] || [[ "$CURRENT_BRANCH" == "staging" ]]; then
    echo -e "${RED}❌ You're on $CURRENT_BRANCH branch! Create a feature branch first.${NC}"
    FAILED=1
else
    echo -e "${GREEN}✅ On feature branch: $CURRENT_BRANCH${NC}"
fi
echo ""

# 2. Check for uncommitted changes
echo "2. Checking for uncommitted changes..."
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes:${NC}"
    git status -s
    echo ""
fi

# 3. Run tests
echo "3. Running tests..."
cd frontend && npm test -- --watchAll=false --passWithNoTests
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend tests failed${NC}"
    FAILED=1
else
    echo -e "${GREEN}✅ Frontend tests passed${NC}"
fi
cd ..
echo ""

# 4. Check build
echo "4. Testing production build..."
cd frontend && npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    FAILED=1
else
    echo -e "${GREEN}✅ Frontend build successful${NC}"
    # Clean up build artifacts
    rm -rf dist
fi
cd ..
echo ""

# 5. Check for console.logs in production code
echo "5. Checking for debug console.logs..."
CONSOLE_LOGS=$(grep -r "console\.\(log\|error\|warn\|debug\)" frontend/src --include="*.tsx" --include="*.ts" | grep -v "// eslint-disable" | grep -v "node_modules" | wc -l)
if [ $CONSOLE_LOGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $CONSOLE_LOGS console statements in frontend code${NC}"
    echo "   Consider removing debug logs before production"
fi
echo ""

# 6. Validate Airtable Schema
echo "6. Validating Airtable schema..."
if [ -f "backend/scripts/validate-airtable-schema.js" ]; then
    cd backend && node scripts/validate-airtable-schema.js
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Airtable schema validation failed${NC}"
        FAILED=1
    else
        echo -e "${GREEN}✅ Airtable schema is valid${NC}"
    fi
    cd ..
else
    echo -e "${YELLOW}⚠️  Schema validation script not found${NC}"
fi
echo ""

# 7. Check environment variables
echo "7. Checking required environment variables..."
REQUIRED_VARS=(
    "AIRTABLE_API_KEY"
    "AIRTABLE_BASE_ID"
    "JWT_SECRET"
    "OPENAI_API_KEY"
    "POSTHOG_API_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=($var)
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing environment variables: ${MISSING_VARS[*]}${NC}"
    echo "   Make sure these are set in Railway/Vercel"
    FAILED=1
else
    echo -e "${GREEN}✅ All required environment variables are set${NC}"
fi
echo ""

# 8. Check for sensitive data
echo "8. Checking for exposed secrets..."
SECRETS=$(grep -r "sk-\|key-\|secret-\|password" . --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" --exclude-dir=".git" | grep -v "process.env" | wc -l)
if [ $SECRETS -gt 0 ]; then
    echo -e "${RED}❌ Found potential exposed secrets in code${NC}"
    FAILED=1
else
    echo -e "${GREEN}✅ No exposed secrets found${NC}"
fi
echo ""

# 9. Migration check
echo "9. Checking for pending migrations..."
if [ -f "backend/database/add-medication-taken-column.sql" ]; then
    echo -e "${YELLOW}⚠️  Found migration file: add-medication-taken-column.sql${NC}"
    echo "   Make sure to add 'medication_taken' field to Airtable DailyCheckins table"
fi
echo ""

# Summary
echo "=========================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Create PR to staging branch"
    echo "2. After staging tests pass, create PR to main"
    echo "3. Railway will auto-deploy on merge"
else
    echo -e "${RED}❌ Some checks failed. Please fix issues before deploying.${NC}"
    exit 1
fi