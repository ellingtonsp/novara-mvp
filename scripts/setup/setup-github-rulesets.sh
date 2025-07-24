#!/bin/bash

# 🛡️ GitHub Branch Protection Rulesets Setup Script
# Automatically creates branch protection rulesets using GitHub CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛡️ GitHub Branch Protection Rulesets Setup${NC}"
echo "================================================"
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI not found. Please install it first:${NC}"
    echo "   brew install gh"
    exit 1
else
    echo -e "${GREEN}✅ GitHub CLI found${NC}"
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}🔐 GitHub authentication required${NC}"
    echo "Please authenticate with GitHub:"
    gh auth login
    echo ""
fi

# Get repository info
REPO_OWNER="ellingtonsp"
REPO_NAME="novara-mvp"
FULL_REPO="$REPO_OWNER/$REPO_NAME"

echo -e "${GREEN}✅ Repository: $FULL_REPO${NC}"

# Check if staging branch exists
if gh api repos/$FULL_REPO/branches/staging &> /dev/null; then
    echo -e "${GREEN}✅ Staging branch exists${NC}"
else
    echo -e "${YELLOW}⚠️ Staging branch doesn't exist${NC}"
    echo "Creating staging branch..."
    git checkout -b staging
    git push origin staging
    echo -e "${GREEN}✅ Staging branch created${NC}"
fi

echo ""
echo -e "${PURPLE}🎯 Creating Branch Protection Rulesets...${NC}"
echo ""

# Create main branch protection ruleset
echo -e "${YELLOW}1. Creating main branch protection ruleset...${NC}"

MAIN_RULESET=$(cat <<EOF
{
  "name": "main-branch-protection",
  "enforcement": "active",
  "target": {
    "branch": {
      "protected": true,
      "name": "main"
    }
  },
  "rules": {
    "pull_request": {
      "required": true,
      "required_approving_review_count": 2,
      "dismiss_stale_reviews_on_push": true,
      "require_code_owner_reviews": true
    },
    "status_check": {
      "strict": true,
      "contexts": []
    },
    "required_workflows": [],
    "required_deployments": [],
    "required_signatures": {
      "required": false
    },
    "required_conversation_resolution": {
      "required": true
    },
    "required_linear_history": {
      "required": true
    },
    "required_pull_request_reviews": {
      "required_approving_review_count": 2,
      "dismiss_stale_reviews_on_push": true,
      "require_code_owner_reviews": true
    },
    "restrict_deletions": {
      "enabled": true
    },
    "restrict_pushes": {
      "enabled": true
    },
    "required_status_checks": {
      "strict": true,
      "contexts": []
    }
  }
}
EOF
)

# Create the main ruleset
if gh api repos/$FULL_REPO/rulesets --input - <<< "$MAIN_RULESET" &> /dev/null; then
    echo -e "${GREEN}✅ Main branch protection ruleset created${NC}"
else
    echo -e "${RED}❌ Failed to create main branch protection ruleset${NC}"
    echo "You may need to create it manually in the GitHub web interface"
fi

# Create staging branch protection ruleset
echo -e "${YELLOW}2. Creating staging branch protection ruleset...${NC}"

STAGING_RULESET=$(cat <<EOF
{
  "name": "staging-branch-protection",
  "enforcement": "active",
  "target": {
    "branch": {
      "protected": true,
      "name": "staging"
    }
  },
  "rules": {
    "pull_request": {
      "required": true,
      "required_approving_review_count": 1,
      "dismiss_stale_reviews_on_push": true,
      "require_code_owner_reviews": false
    },
    "status_check": {
      "strict": true,
      "contexts": []
    },
    "required_workflows": [],
    "required_deployments": [],
    "required_signatures": {
      "required": false
    },
    "required_conversation_resolution": {
      "required": false
    },
    "required_linear_history": {
      "required": false
    },
    "required_pull_request_reviews": {
      "required_approving_review_count": 1,
      "dismiss_stale_reviews_on_push": true,
      "require_code_owner_reviews": false
    },
    "restrict_deletions": {
      "enabled": true
    },
    "restrict_pushes": {
      "enabled": false
    },
    "required_status_checks": {
      "strict": true,
      "contexts": []
    }
  }
}
EOF
)

# Create the staging ruleset
if gh api repos/$FULL_REPO/rulesets --input - <<< "$STAGING_RULESET" &> /dev/null; then
    echo -e "${GREEN}✅ Staging branch protection ruleset created${NC}"
else
    echo -e "${RED}❌ Failed to create staging branch protection ruleset${NC}"
    echo "You may need to create it manually in the GitHub web interface"
fi

echo ""
echo -e "${GREEN}🎉 Branch Protection Rulesets Setup Complete!${NC}"
echo ""

# List existing rulesets
echo -e "${PURPLE}📋 Current Rulesets:${NC}"
gh api repos/$FULL_REPO/rulesets | jq -r '.[] | "  - \(.name) (enforcement: \(.enforcement))"'

echo ""
echo -e "${BLUE}🔧 Manual Setup Instructions (if CLI failed):${NC}"
echo ""
echo "1. Go to: https://github.com/$FULL_REPO/settings/rules"
echo "2. Click 'New ruleset'"
echo "3. Configure main branch protection:"
echo "   - Name: main-branch-protection"
echo "   - Target: main"
echo "   - Require PR: ✅"
echo "   - Require approvals: 2"
echo "   - Require status checks: ✅"
echo "   - Restrict deletions: ✅"
echo "   - Allow force pushes: ❌"
echo ""
echo "4. Create staging ruleset:"
echo "   - Name: staging-branch-protection"
echo "   - Target: staging"
echo "   - Require PR: ✅"
echo "   - Require approvals: 1"
echo "   - Allow force pushes: ✅"
echo ""

echo -e "${YELLOW}⚠️ Next Steps:${NC}"
echo "1. Test the protection by creating a PR to main"
echo "2. Verify that force pushes are blocked"
echo "3. Test staging branch flexibility"
echo "4. Set up status checks (Vercel/Railway)"
echo ""

echo -e "${GREEN}✅ Branch protection is now active!${NC}" 