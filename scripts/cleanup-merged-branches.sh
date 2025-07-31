#!/bin/bash

# Branch cleanup script - removes branches that have been merged

echo "🧹 Branch Cleanup Tool"
echo "===================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# First, fetch latest from remote
echo "📡 Fetching latest from remote..."
git fetch --prune origin

echo ""
echo "🔍 Analyzing branches..."
echo ""

# 1. Delete the merged hotfix branch
echo -e "${YELLOW}Hotfix branches to clean:${NC}"
echo "- origin/hotfix/insights-new-user-bug-and-onboarding-logic (merged to main)"

read -p "Delete remote hotfix branch? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin --delete hotfix/insights-new-user-bug-and-onboarding-logic
    echo -e "${GREEN}✓ Deleted remote hotfix branch${NC}"
fi

echo ""
echo -e "${YELLOW}Local branches to consider cleaning:${NC}"

# List local branches that might be stale
BRANCHES_TO_CLEAN=(
    "backup-ON-01-fixes-20250728-0256"
    "development"  # We now use 'develop'
    "feature/actionable-insights"
    "feature/AP-01-appointment-prep-checklist"
    "feature/mobile-ui-improvements"
    "feature/ON-01-onboarding-ab-experiment"
    "feature/ON-01-simplified-ab-test"
    "feature/onboarding-flow-fixes"
    "feature/postgresql-schema-refactor"
    "fix/mobile-component-scope"
    "fix/ON-01-build-errors"
    "fix/ON-01-syntax-error"
    "fix/production-deployment-railway-service"
    "stable"
    "staging-test-combined"
)

echo ""
for branch in "${BRANCHES_TO_CLEAN[@]}"; do
    if git show-ref --verify --quiet refs/heads/$branch; then
        echo "- $branch"
    fi
done

echo ""
read -p "Would you like to delete these local branches? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    for branch in "${BRANCHES_TO_CLEAN[@]}"; do
        if git show-ref --verify --quiet refs/heads/$branch; then
            git branch -D $branch 2>/dev/null
            echo -e "${GREEN}✓ Deleted local branch: $branch${NC}"
        fi
    done
fi

echo ""
echo -e "${YELLOW}Remote branches that could be cleaned:${NC}"
echo "Check GitHub for branches that haven't been updated in 30+ days"
echo "https://github.com/ellingtonsp/novara-mvp/branches/stale"

echo ""
echo "✨ Branch cleanup complete!"
echo ""
echo "Current active branches:"
echo "- develop (default, active development)"
echo "- staging (pre-production testing)"
echo "- main (production)"