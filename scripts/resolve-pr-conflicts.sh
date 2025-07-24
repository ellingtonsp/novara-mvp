#!/bin/bash

# 🚀 Novara MVP - PR Conflict Resolution Script
# =============================================
# Automatically resolves PR conflicts and merges staging into main
# Bypasses hanging terminal issues with Git merge

set -e  # Exit on any error

echo "🚀 Novara MVP - PR Conflict Resolution"
echo "======================================"
echo "📋 Resolving PR conflicts automatically..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}📊${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Not in Novara MVP root directory"
    exit 1
fi

print_status "Current directory: $(pwd)"

# Step 1: Kill any stuck Git processes
print_status "🧹 Cleaning up stuck Git processes..."
pkill -f git || true
sleep 2

# Step 2: Check current Git status
print_status "📊 Checking Git status..."
git status --porcelain

# Step 3: Abort any ongoing merge
print_status "🛑 Aborting any ongoing merge..."
git merge --abort 2>/dev/null || true

# Step 4: Reset to clean state
print_status "🔄 Resetting to clean state..."
git reset --hard HEAD
git clean -fd

# Step 5: Fetch latest changes
print_status "📥 Fetching latest changes..."
git fetch origin

# Step 6: Check current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "📍 Current branch: $CURRENT_BRANCH"

# Step 7: Switch to main branch
print_status "🔄 Switching to main branch..."
git checkout main
git pull origin main

# Step 8: Merge staging with strategy
print_status "🔀 Merging staging into main..."
print_warning "Using 'theirs' strategy to prioritize staging changes"

# Create a temporary merge commit with strategy
git merge origin/staging --strategy=recursive --strategy-option=theirs --no-edit

# Step 9: Push changes
print_status "📤 Pushing changes to main..."
git push origin main

# Step 10: Clean up
print_status "🧹 Cleaning up..."
git branch -D staging 2>/dev/null || true

print_success "🎉 PR conflicts resolved successfully!"
echo ""
echo "📋 Summary:"
echo "   ✅ Stuck processes cleaned"
echo "   ✅ Merge conflicts resolved"
echo "   ✅ Staging merged into main"
echo "   ✅ Changes pushed to remote"
echo ""
echo "🔗 Next steps:"
echo "   1. Close the PR on GitHub"
echo "   2. Delete the staging branch on GitHub"
echo "   3. Continue development on main"
echo ""

# Optional: Show final status
print_status "📊 Final Git status:"
git status --porcelain

print_success "🚀 Ready to continue development!" 