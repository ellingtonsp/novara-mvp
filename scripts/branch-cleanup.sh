#!/bin/bash

# 🧹 Branch Cleanup Script
# Removes merged branches and cleans up repository

set -e

echo "🧹 Novara Branch Cleanup"
echo "========================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if we're on a safe branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "stable" ]]; then
    echo -e "${RED}❌ Cannot run cleanup from main or stable branch${NC}"
    echo "Please switch to staging or development branch first"
    exit 1
fi

echo -e "${BLUE}📍 Current branch: $CURRENT_BRANCH${NC}"

# Fetch latest changes
echo "📥 Fetching latest changes..."
git fetch --prune

# List branches that can be safely deleted
echo -e "\n${YELLOW}🔍 Analyzing branches for cleanup...${NC}"

# Branches merged into main (safe to delete)
MERGED_INTO_MAIN=$(git branch --merged main | grep -v "main" | grep -v "stable" | grep -v "staging" | grep -v "development" || true)

# Branches merged into staging (safe to delete)
MERGED_INTO_STAGING=$(git branch --merged staging | grep -v "main" | grep -v "stable" | grep -v "staging" | grep -v "development" || true)

# Test branches that can be deleted
TEST_BRANCHES=$(git branch | grep "test/" || true)

# Feature branches that are likely completed
FEATURE_BRANCHES=$(git branch | grep "feature/" | grep -v "feature/AN-01-event-tracking-instrumentation" | grep -v "feature/CM-01-positive-reflection-nlp" || true)

# Fix branches that are likely completed
FIX_BRANCHES=$(git branch | grep "fix/" | grep -v "fix/railway-staging-deployment" || true)

# Housekeeping branches
HOUSEKEEPING_BRANCHES=$(git branch | grep "housekeeping/" || true)

echo -e "\n${GREEN}✅ Branches safe to delete:${NC}"

# Combine all safe branches
SAFE_TO_DELETE=""
if [[ -n "$MERGED_INTO_MAIN" ]]; then
    echo -e "${BLUE}📋 Merged into main:${NC}"
    echo "$MERGED_INTO_MAIN" | sed 's/^/  - /'
    SAFE_TO_DELETE="$SAFE_TO_DELETE $MERGED_INTO_MAIN"
fi

if [[ -n "$MERGED_INTO_STAGING" ]]; then
    echo -e "${BLUE}📋 Merged into staging:${NC}"
    echo "$MERGED_INTO_STAGING" | sed 's/^/  - /'
    SAFE_TO_DELETE="$SAFE_TO_DELETE $MERGED_INTO_STAGING"
fi

if [[ -n "$TEST_BRANCHES" ]]; then
    echo -e "${BLUE}🧪 Test branches:${NC}"
    echo "$TEST_BRANCHES" | sed 's/^/  - /'
    SAFE_TO_DELETE="$SAFE_TO_DELETE $TEST_BRANCHES"
fi

if [[ -n "$FEATURE_BRANCHES" ]]; then
    echo -e "${BLUE}🎯 Feature branches:${NC}"
    echo "$FEATURE_BRANCHES" | sed 's/^/  - /'
    SAFE_TO_DELETE="$SAFE_TO_DELETE $FEATURE_BRANCHES"
fi

if [[ -n "$FIX_BRANCHES" ]]; then
    echo -e "${BLUE}🔧 Fix branches:${NC}"
    echo "$FIX_BRANCHES" | sed 's/^/  - /'
    SAFE_TO_DELETE="$SAFE_TO_DELETE $FIX_BRANCHES"
fi

if [[ -n "$HOUSEKEEPING_BRANCHES" ]]; then
    echo -e "${BLUE}🏠 Housekeeping branches:${NC}"
    echo "$HOUSEKEEPING_BRANCHES" | sed 's/^/  - /'
    SAFE_TO_DELETE="$SAFE_TO_DELETE $HOUSEKEEPING_BRANCHES"
fi

# Remove duplicates and trim
SAFE_TO_DELETE=$(echo "$SAFE_TO_DELETE" | tr ' ' '\n' | sort -u | grep -v '^$' | tr '\n' ' ')

if [[ -z "$SAFE_TO_DELETE" ]]; then
    echo -e "${GREEN}🎉 No branches to clean up!${NC}"
    exit 0
fi

echo -e "\n${YELLOW}⚠️  Branches to be deleted:${NC}"
echo "$SAFE_TO_DELETE" | tr ' ' '\n' | sed 's/^/  - /'

# Confirm deletion
echo -e "\n${RED}⚠️  WARNING: This will permanently delete the above branches${NC}"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ Cleanup cancelled${NC}"
    exit 0
fi

# Delete local branches
echo -e "\n${BLUE}🗑️  Deleting local branches...${NC}"
for branch in $SAFE_TO_DELETE; do
    if git branch -d "$branch" 2>/dev/null; then
        echo -e "  ✅ Deleted: $branch"
    elif git branch -D "$branch" 2>/dev/null; then
        echo -e "  ✅ Force deleted: $branch"
    else
        echo -e "  ❌ Failed to delete: $branch"
    fi
done

# Clean up remote tracking branches
echo -e "\n${BLUE}🧹 Cleaning up remote tracking branches...${NC}"
git remote prune origin

# Show final branch status
echo -e "\n${GREEN}🎉 Cleanup complete!${NC}"
echo -e "\n${BLUE}📋 Current branches:${NC}"
git branch -v

echo -e "\n${GREEN}✅ Repository is now clean and organized!${NC}" 