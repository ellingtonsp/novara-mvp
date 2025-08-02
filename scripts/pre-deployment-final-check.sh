#!/bin/bash

# Final pre-deployment checklist for refactored server
# Run this before deploying to production

echo "🚀 Refactored Server - Final Pre-Deployment Check"
echo "================================================"
echo "Date: $(date)"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Tracking
CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to check something
check() {
    local description="$1"
    local command="$2"
    
    echo -n "Checking: $description... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        ((CHECKS_FAILED++))
        return 1
    fi
}

# Change to project root
cd "$(dirname "$0")/.." || exit 1

echo -e "${BLUE}1. Code Checks${NC}"
echo "─────────────────"
check "Git repository is clean" "[ -z \"\$(git status --porcelain)\" ]"
check "On hotfix branch" "git branch --show-current | grep -q hotfix"
check "All tests passing" "cd backend && npm run test:endpoints"

echo -e "\n${BLUE}2. Implementation Checks${NC}"
echo "──────────────────────────"
check "GET /api/checkins/last-values exists" "grep -q 'router.get.*/last-values' backend/routes/checkins.js"
check "GET /api/checkins/questions exists" "grep -q 'router.get.*/questions' backend/routes/checkins.js"
check "POST /api/daily-checkin-enhanced exists" "grep -q 'app.post.*/daily-checkin-enhanced' backend/server-refactored.js"
check "GET /api/users/profile exists" "grep -q 'router.get.*/profile' backend/routes/users.js"
check "PATCH /api/users/cycle-stage exists" "grep -q 'router.patch.*/cycle-stage' backend/routes/users.js"
check "PATCH /api/users/medication-status exists" "grep -q 'router.patch.*/medication-status' backend/routes/users.js"
check "Question generator utility exists" "[ -f backend/utils/question-generator.js ]"

echo -e "\n${BLUE}3. Server Health Checks${NC}"
echo "─────────────────────────"
# Try to start server briefly
echo -e "${YELLOW}Starting refactored server for health check...${NC}"
cd backend
USE_REFACTORED_SERVER=true PORT=9004 node server-switcher.js > /tmp/server-check.log 2>&1 &
SERVER_PID=$!
sleep 5

if check "Refactored server starts without errors" "ps -p $SERVER_PID > /dev/null"; then
    check "Health endpoint responds" "curl -s http://localhost:9004/api/health | grep -q '\"status\":\"ok\"'"
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
fi
cd ..

echo -e "\n${BLUE}4. Documentation Checks${NC}"
echo "─────────────────────────"
check "Deployment guide exists" "[ -f docs/deployment/REFACTORED_SERVER_DEPLOYMENT.md ]"
check "Endpoint testing docs exist" "[ -f backend/docs/ENDPOINT_TESTING.md ]"
check "Test script exists" "[ -f scripts/test-staging-endpoints.js ]"

echo -e "\n${BLUE}5. PR Status Check${NC}"
echo "───────────────────"
if command -v gh > /dev/null 2>&1; then
    PR_STATUS=$(gh pr view 24 --json state -q .state 2>/dev/null || echo "UNKNOWN")
    if [ "$PR_STATUS" = "OPEN" ]; then
        echo -e "${GREEN}✅ PR #24 is OPEN and ready${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌ PR #24 status: $PR_STATUS${NC}"
        ((CHECKS_FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI not installed - cannot check PR status${NC}"
fi

# Summary
echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}FINAL SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "Checks Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks Failed: ${RED}$CHECKS_FAILED${NC}"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL CHECKS PASSED!${NC}"
    echo -e "${GREEN}The refactored server is ready for deployment.${NC}"
    echo -e "\n${YELLOW}Next Steps:${NC}"
    echo "1. Merge PR #24 to main branch"
    echo "2. Deploy to staging and test"
    echo "3. Update production Railway configuration"
    echo "4. Monitor production deployment"
    exit 0
else
    echo -e "\n${RED}⚠️  SOME CHECKS FAILED!${NC}"
    echo -e "${RED}Please fix the issues above before deploying.${NC}"
    exit 1
fi