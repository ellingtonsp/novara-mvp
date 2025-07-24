#!/bin/bash

# 🚀 Novara MVP - Automated PR Creation Script
# Helps create consistent pull requests with Cursor assistance

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Novara MVP - PR Creation Assistant${NC}"
echo "=========================================="

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Current branch:${NC} $CURRENT_BRANCH"

# Get commit messages since last main
echo -e "${YELLOW}Recent commits:${NC}"
git log --oneline origin/main..HEAD

# Get changed files
echo -e "${YELLOW}Changed files:${NC}"
git diff --name-only origin/main..HEAD

# Suggest PR title
echo ""
echo -e "${GREEN}📝 Suggested PR Title:${NC}"
echo "feat: [brief description of changes]"

# Suggest PR description
echo ""
echo -e "${GREEN}📄 Suggested PR Description:${NC}"
echo "## 🎯 Changes"
echo "- [List your changes here]"
echo ""
echo "## 🧪 Testing"
echo "- [ ] Tested locally"
echo "- [ ] Tested in staging environment"
echo "- [ ] No breaking changes"
echo ""
echo "## 📱 User Impact"
echo "- [How this affects IVF patients]"
echo ""
echo "## 🚨 Breaking Changes"
echo "- [Any breaking changes?]"

echo ""
echo -e "${BLUE}🌐 Next Steps:${NC}"
echo "1. Go to: https://github.com/ellingtonsp/novara-mvp/pulls"
echo "2. Click 'New pull request'"
echo "3. Base: main, Compare: $CURRENT_BRANCH"
echo "4. Use the suggested title and description above"
echo "5. Create and merge the PR"

echo ""
echo -e "${YELLOW}💡 Pro Tip:${NC} Use Cursor's AI to help write better commit messages and PR descriptions!" 