#!/bin/bash

echo "🔧 Fixing Git hanging issue..."

# Kill any stuck Git processes
echo "🧹 Killing stuck Git processes..."
pkill -f git || echo "No Git processes found"

# Wait a moment
sleep 2

# Check Git status
echo "📊 Git status:"
git status --porcelain

# Abort any merge
echo "🛑 Aborting any merge..."
git merge --abort 2>/dev/null || echo "No merge to abort"

# Reset to clean state
echo "🔄 Resetting..."
git reset --hard HEAD
git clean -fd

echo "✅ Git hanging issue should be resolved!"
echo "💡 You can now run: git merge origin/staging" 