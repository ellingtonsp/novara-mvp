#!/bin/bash
# Setup script for documentation workflow optimization

echo "🚀 Setting up optimized documentation workflow..."

# Create symlink for pre-commit hook
if [ -d ".git/hooks" ]; then
    echo "Installing pre-commit hook..."
    ln -sf ../../.github/hooks/pre-commit .git/hooks/pre-commit
    echo "✅ Pre-commit hook installed"
else
    echo "❌ .git/hooks directory not found. Are you in a git repository?"
    exit 1
fi

# Create required GitHub Actions config files
echo "Creating GitHub Actions configuration files..."

# Create markdown link check config
cat > .github/markdown-link-check-config.json << 'EOF'
{
  "ignorePatterns": [
    {
      "pattern": "^http://localhost"
    },
    {
      "pattern": "^https://localhost"
    }
  ],
  "timeout": "30s",
  "retryOn429": true,
  "retryCount": 3
}
EOF

# Create markdown lint config
cat > .github/.markdownlint.json << 'EOF'
{
  "default": true,
  "MD013": false,
  "MD033": false,
  "MD041": false,
  "no-hard-tabs": false,
  "no-trailing-spaces": true,
  "no-multiple-blanks": true
}
EOF

# Create labeler config for auto-labeling
cat > .github/labeler.yml << 'EOF'
documentation:
  - docs/**
  - '**/*.md'
  - CLAUDE.md
  - README.md

frontend:
  - frontend/**
  - '**/*.tsx'
  - '**/*.ts'
  - '**/*.css'

backend:
  - backend/**
  - '**/*.js'

deployment:
  - .github/**
  - scripts/**
  - '**/*.yml'
  - '**/*.yaml'
EOF

echo "✅ Configuration files created"

# Instructions for using the new workflow
cat << 'EOF'

📚 Documentation Workflow Setup Complete!

What's new:
1. Pre-commit hook prevents mixing docs and code
2. GitHub Actions will fast-track documentation PRs
3. Documentation PRs can skip staging when labeled

How to use:
1. Make documentation changes
2. Commit with prefix "docs: your message"
3. Push to your feature branch
4. Create PR to develop
5. Automation will handle the rest!

Tips:
- Always separate documentation and code commits
- Use "docs:" prefix for documentation commits
- PRs with only docs will be labeled automatically
- One review is enough for documentation PRs

To bypass the pre-commit hook (not recommended):
  git commit --no-verify

EOF