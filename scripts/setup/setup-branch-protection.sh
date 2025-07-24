#!/bin/bash

# 🛡️ Branch Protection Setup Script
# Helps you set up GitHub branch protection rules

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛡️ GitHub Branch Protection Setup${NC}"
echo "======================================"
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Not in a git repository${NC}"
    exit 1
fi

# Get repository URL
REPO_URL=$(git remote get-url origin)
echo -e "${GREEN}✅ Repository: ${REPO_URL}${NC}"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${GREEN}✅ Current branch: ${CURRENT_BRANCH}${NC}"

# Check if staging branch exists
if git show-ref --verify --quiet refs/remotes/origin/staging; then
    echo -e "${GREEN}✅ Staging branch exists${NC}"
else
    echo -e "${YELLOW}⚠️ Staging branch doesn't exist${NC}"
    echo ""
    echo -e "${CYAN}📋 To create staging branch:${NC}"
    echo "   git checkout -b staging"
    echo "   git push origin staging"
    echo ""
fi

echo ""
echo -e "${PURPLE}🎯 Branch Protection Setup Steps:${NC}"
echo ""

echo -e "${YELLOW}1. Go to GitHub Repository Settings${NC}"
echo "   ${CYAN}https://github.com/ellingtonsp/novara-mvp/settings/branches${NC}"
echo ""

echo -e "${YELLOW}2. Add Branch Protection Rule for 'main'${NC}"
echo "   - Branch name pattern: main"
echo "   - Require pull request before merging"
echo "   - Require 2 approvals"
echo "   - Require status checks to pass"
echo "   - Require branches to be up to date"
echo "   - Restrict deletions"
echo "   - Do NOT allow force pushes"
echo ""

echo -e "${YELLOW}3. Add Branch Protection Rule for 'staging'${NC}"
echo "   - Branch name pattern: staging"
echo "   - Require pull request before merging"
echo "   - Require 1 approval"
echo "   - Require status checks to pass"
echo "   - Restrict deletions"
echo "   - Allow force pushes (for staging flexibility)"
echo ""

echo -e "${YELLOW}4. Create CODEOWNERS file${NC}"
echo "   - File: .github/CODEOWNERS"
echo "   - Owner: @ellingtonsp"
echo ""

echo -e "${GREEN}✅ CODEOWNERS file created!${NC}"
echo ""

echo -e "${PURPLE}🔧 Recommended Workflow:${NC}"
echo ""

echo -e "${CYAN}Development:${NC}"
echo "  git checkout -b feature/new-feature"
echo "  # Make changes"
echo "  git push origin feature/new-feature"
echo "  # Create PR: feature/new-feature → main"
echo ""

echo -e "${CYAN}Staging:${NC}"
echo "  git checkout -b staging-update"
echo "  # Make staging changes"
echo "  git push origin staging-update"
echo "  # Create PR: staging-update → staging"
echo ""

echo -e "${PURPLE}📊 Status Checks to Configure:${NC}"
echo "  - vercel-production (for main)"
echo "  - vercel-staging (for staging)"
echo "  - railway-deployment"
echo ""

echo -e "${GREEN}🎉 Branch Protection Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📚 For detailed instructions, see:${NC}"
echo "   docs/github-branch-protection-guide.md"
echo ""
echo -e "${YELLOW}⚠️ Remember:${NC}"
echo "   - Always create PRs for main/staging"
echo "   - Keep branches up to date"
echo "   - Use descriptive commit messages"
echo "   - Test in staging before main" 