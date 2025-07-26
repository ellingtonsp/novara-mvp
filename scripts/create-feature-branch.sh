#!/bin/bash

# 🌿 Feature Branch Creation Script
# Enforces sustainable branch strategy

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌿 Novara MVP - Feature Branch Creator${NC}"
echo "=================================="

# Check if we're on development branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "development" ]; then
    echo -e "${RED}❌ ERROR: You must be on 'development' branch to create feature branches${NC}"
    echo -e "${YELLOW}Current branch: $CURRENT_BRANCH${NC}"
    echo -e "${BLUE}Please run: git checkout development${NC}"
    exit 1
fi

# Get branch type
echo -e "${BLUE}Select branch type:${NC}"
echo "1) feature/ (new features)"
echo "2) fix/ (bug fixes)"
echo "3) docs/ (documentation)"
echo "4) hotfix/ (critical fixes)"
echo "5) refactor/ (code refactoring)"
read -p "Enter choice (1-5): " BRANCH_TYPE_CHOICE

case $BRANCH_TYPE_CHOICE in
    1) BRANCH_PREFIX="feature" ;;
    2) BRANCH_PREFIX="fix" ;;
    3) BRANCH_PREFIX="docs" ;;
    4) BRANCH_PREFIX="hotfix" ;;
    5) BRANCH_PREFIX="refactor" ;;
    *) echo -e "${RED}Invalid choice${NC}"; exit 1 ;;
esac

# Get epic ID for features
if [ "$BRANCH_PREFIX" = "feature" ]; then
    echo -e "${BLUE}Enter Epic ID (e.g., AN-02, CM-01):${NC}"
    read -p "Epic ID: " EPIC_ID
    if [ -z "$EPIC_ID" ]; then
        echo -e "${RED}Epic ID is required for feature branches${NC}"
        exit 1
    fi
fi

# Get description
echo -e "${BLUE}Enter branch description (kebab-case):${NC}"
echo "Examples: churn-risk-flag, checkin-counting-fix, railway-cli-update"
read -p "Description: " DESCRIPTION

if [ -z "$DESCRIPTION" ]; then
    echo -e "${RED}Description is required${NC}"
    exit 1
fi

# Create branch name
if [ "$BRANCH_PREFIX" = "feature" ]; then
    BRANCH_NAME="${BRANCH_PREFIX}/${EPIC_ID}-${DESCRIPTION}"
else
    BRANCH_NAME="${BRANCH_PREFIX}/${DESCRIPTION}"
fi

# Validate branch name
if [[ ! $BRANCH_NAME =~ ^[a-z]+/[a-zA-Z0-9-]+$ ]]; then
    echo -e "${RED}❌ Invalid branch name: $BRANCH_NAME${NC}"
    echo "Branch name must be: lowercase/description (kebab-case)"
    exit 1
fi

# Check if branch already exists
if git show-ref --verify --quiet refs/heads/$BRANCH_NAME; then
    echo -e "${RED}❌ Branch '$BRANCH_NAME' already exists${NC}"
    exit 1
fi

# Create and switch to branch
echo -e "${BLUE}Creating branch: $BRANCH_NAME${NC}"
git checkout -b $BRANCH_NAME

# Push to remote
echo -e "${BLUE}Pushing to remote...${NC}"
git push -u origin $BRANCH_NAME

echo -e "${GREEN}✅ Successfully created feature branch: $BRANCH_NAME${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Make your changes"
echo "2. Commit with conventional commit message:"
echo "   git commit -m \"feat: Add churn risk flagging system\""
echo "3. Push changes: git push"
echo "4. Create PR: $BRANCH_NAME → development"
echo ""
echo -e "${YELLOW}🎯 Remember: Follow progressive integration workflow${NC}"
echo "   feature → development → staging → stable → main" 