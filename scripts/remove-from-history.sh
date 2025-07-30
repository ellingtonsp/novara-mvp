#!/bin/bash

echo "🔒 SECURITY: Removing exposed credentials from git history"
echo "⚠️  WARNING: This will rewrite git history!"
echo ""
echo "Files to remove from history:"
echo "- backend/scripts/test-*.js"
echo "- Any file containing the exposed password"
echo ""
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Create backup
echo "📦 Creating backup branch..."
git branch backup-before-cleanup

# Remove files from all commits
echo "🔧 Removing files from git history..."
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch backend/scripts/test-*.js' \
  --prune-empty --tag-name-filter cat -- --all

# Clean up
echo "🧹 Cleaning up..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ History cleaned!"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Force push all branches:"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "2. IMMEDIATELY rotate your database password in Railway"
echo ""
echo "3. Update .env files with new DATABASE_URL"
echo ""
echo "4. Notify all team members to:"
echo "   - Delete their local repos"
echo "   - Re-clone from GitHub"
echo ""
echo "5. Check GitGuardian to confirm the alert is resolved"