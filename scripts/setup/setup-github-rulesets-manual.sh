#!/bin/bash

# 🛡️ GitHub Branch Protection Rulesets Manual Setup
# Provides both automated (with token) and manual setup options

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

# Repository info
REPO_OWNER="ellingtonsp"
REPO_NAME="novara-mvp"
FULL_REPO="$REPO_OWNER/$REPO_NAME"

echo -e "${GREEN}✅ Repository: $FULL_REPO${NC}"

# Check if staging branch exists
if git show-ref --verify --quiet refs/heads/staging; then
    echo -e "${GREEN}✅ Staging branch exists locally${NC}"
else
    echo -e "${YELLOW}⚠️ Creating staging branch...${NC}"
    git checkout -b staging
    git push origin staging
    echo -e "${GREEN}✅ Staging branch created and pushed${NC}"
fi

echo ""
echo -e "${PURPLE}🎯 Setup Options:${NC}"
echo ""

# Option 1: Try with GitHub CLI
echo -e "${YELLOW}Option 1: GitHub CLI (Recommended)${NC}"
echo "1. Run: gh auth login"
echo "2. Follow the prompts to authenticate"
echo "3. Run: ./scripts/setup-github-rulesets.sh"
echo ""

# Option 2: Manual setup
echo -e "${YELLOW}Option 2: Manual Setup (Most Reliable)${NC}"
echo "1. Go to: https://github.com/$FULL_REPO/settings/rules"
echo "2. Click 'New ruleset'"
echo ""

echo -e "${CYAN}📋 Main Branch Protection Ruleset:${NC}"
echo "   Name: main-branch-protection"
echo "   Enforcement: Active"
echo "   Target: main"
echo "   Rules to enable:"
echo "   ✅ Require a pull request before merging"
echo "     - Require approvals: 2"
echo "     - Dismiss stale PR approvals: ✅"
echo "     - Require review from code owners: ✅"
echo "   ✅ Require status checks to pass before merging"
echo "     - Require branches to be up to date: ✅"
echo "   ✅ Require conversation resolution before merging"
echo "   ✅ Require linear history"
echo "   ✅ Restrict pushes that create files that override protection"
echo "   ✅ Restrict deletions"
echo "   ❌ Do NOT allow force pushes"
echo ""

echo -e "${CYAN}📋 Staging Branch Protection Ruleset:${NC}"
echo "   Name: staging-branch-protection"
echo "   Enforcement: Active"
echo "   Target: staging"
echo "   Rules to enable:"
echo "   ✅ Require a pull request before merging"
echo "     - Require approvals: 1"
echo "     - Dismiss stale PR approvals: ✅"
echo "     - Require review from code owners: ❌"
echo "   ✅ Require status checks to pass before merging"
echo "     - Require branches to be up to date: ✅"
echo "   ✅ Restrict pushes that create files that override protection"
echo "   ✅ Restrict deletions"
echo "   ✅ Allow force pushes (for staging flexibility)"
echo ""

# Option 3: Try with personal access token
echo -e "${YELLOW}Option 3: Personal Access Token${NC}"
echo "If you have a GitHub personal access token:"
echo "1. Set it as: export GITHUB_TOKEN=your_token_here"
echo "2. Run: ./scripts/setup-github-rulesets-token.sh"
echo ""

echo -e "${GREEN}🎉 Ready to set up branch protection!${NC}"
echo ""
echo -e "${BLUE}📚 For detailed instructions, see:${NC}"
echo "   docs/github-branch-protection-guide.md"
echo ""

# Check if user wants to proceed with manual setup
echo -e "${PURPLE}Would you like me to:${NC}"
echo "1. Open the GitHub rules page in your browser"
echo "2. Create a personal access token setup script"
echo "3. Just show the manual instructions"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo -e "${GREEN}Opening GitHub rules page...${NC}"
        open "https://github.com/$FULL_REPO/settings/rules"
        ;;
    2)
        echo -e "${GREEN}Creating token-based setup script...${NC}"
        # Create the token-based script
        cat > scripts/setup-github-rulesets-token.sh << 'EOF'
#!/bin/bash

# 🛡️ GitHub Branch Protection Rulesets Setup with Token
# Uses GITHUB_TOKEN environment variable

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛡️ GitHub Branch Protection Rulesets Setup (Token)${NC}"
echo "========================================================"
echo ""

# Check for token
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ GITHUB_TOKEN not set${NC}"
    echo "Please set your GitHub personal access token:"
    echo "export GITHUB_TOKEN=your_token_here"
    exit 1
fi

# Repository info
REPO_OWNER="ellingtonsp"
REPO_NAME="novara-mvp"
FULL_REPO="$REPO_OWNER/$REPO_NAME"

echo -e "${GREEN}✅ Using token for: $FULL_REPO${NC}"

# Create main branch protection ruleset
echo -e "${YELLOW}Creating main branch protection ruleset...${NC}"

MAIN_RULESET='{
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
    "required_conversation_resolution": {
      "required": true
    },
    "required_linear_history": {
      "required": true
    },
    "restrict_deletions": {
      "enabled": true
    },
    "restrict_pushes": {
      "enabled": true
    }
  }
}'

# Create the main ruleset
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  -d "$MAIN_RULESET" \
  "https://api.github.com/repos/$FULL_REPO/rulesets" > /dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Main branch protection ruleset created${NC}"
else
    echo -e "${RED}❌ Failed to create main branch protection ruleset${NC}"
fi

# Create staging branch protection ruleset
echo -e "${YELLOW}Creating staging branch protection ruleset...${NC}"

STAGING_RULESET='{
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
    "restrict_deletions": {
      "enabled": true
    },
    "restrict_pushes": {
      "enabled": false
    }
  }
}'

# Create the staging ruleset
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  -d "$STAGING_RULESET" \
  "https://api.github.com/repos/$FULL_REPO/rulesets" > /dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Staging branch protection ruleset created${NC}"
else
    echo -e "${RED}❌ Failed to create staging branch protection ruleset${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Branch Protection Rulesets Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Current Rulesets:${NC}"
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$FULL_REPO/rulesets" | \
  jq -r '.[] | "  - \(.name) (enforcement: \(.enforcement))"'

echo ""
echo -e "${YELLOW}⚠️ Next Steps:${NC}"
echo "1. Test the protection by creating a PR to main"
echo "2. Verify that force pushes are blocked"
echo "3. Test staging branch flexibility"
echo "4. Set up status checks (Vercel/Railway)"
EOF

        chmod +x scripts/setup-github-rulesets-token.sh
        echo -e "${GREEN}✅ Token-based script created: scripts/setup-github-rulesets-token.sh${NC}"
        echo ""
        echo -e "${CYAN}To use it:${NC}"
        echo "1. Get a GitHub personal access token from:"
        echo "   https://github.com/settings/tokens"
        echo "2. Set it: export GITHUB_TOKEN=your_token_here"
        echo "3. Run: ./scripts/setup-github-rulesets-token.sh"
        ;;
    3)
        echo -e "${GREEN}Manual instructions displayed above.${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice. Manual instructions displayed above.${NC}"
        ;;
esac

echo ""
echo -e "${GREEN}✅ Setup guide complete!${NC}" 