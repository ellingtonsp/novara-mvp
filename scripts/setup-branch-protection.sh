#!/bin/bash

# Setup branch protection rules for the new git workflow

echo "🔒 Setting up branch protection rules..."

# Note: You can set these up manually in GitHub Settings > Branches
echo ""
echo "To protect your branches, go to:"
echo "https://github.com/ellingtonsp/novara-mvp/settings/branches"
echo ""
echo "Recommended protection rules:"
echo ""
echo "1. For 'main' branch (production):"
echo "   - Require pull request before merging"
echo "   - Dismiss stale pull request approvals"
echo "   - Require branches to be up to date"
echo "   - Include administrators"
echo ""
echo "2. For 'staging' branch:"
echo "   - Require pull request before merging"
echo "   - Dismiss stale pull request approvals"
echo "   - Require branches to be up to date"
echo ""
echo "3. Keep 'develop' branch unprotected for flexibility"
echo ""
echo "This ensures:"
echo "- No direct commits to production or staging"
echo "- All changes go through PR review"
echo "- Staging acts as gate to production" 