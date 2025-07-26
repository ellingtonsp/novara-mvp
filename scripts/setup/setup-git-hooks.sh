#!/bin/bash

# Setup Git Hooks for Environment Configuration Protection
# This script installs pre-commit hooks to validate environment configurations

echo "🛡️  Setting up Git Hooks for Environment Configuration Protection"
echo "================================================================"

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Pre-commit hook to validate environment configurations
# This prevents commits that would break environment configurations

echo "🔍 Running pre-commit environment validation..."

# Check if environment config files are being modified
if git diff --cached --name-only | grep -E "(environment-config\.js|scripts/.*\.js)" > /dev/null; then
    echo "⚠️  Environment configuration files modified. Running validation..."
    
    # Run environment validation
    if node scripts/validate-environment-config.js; then
        echo "✅ Environment configuration validation passed"
    else
        echo "❌ Environment configuration validation failed!"
        echo "Please fix the issues before committing."
        exit 1
    fi
else
    echo "✅ No environment configuration files modified"
fi

# Run tests to ensure nothing is broken
echo "🧪 Running tests..."
if npm test; then
    echo "✅ Tests passed"
else
    echo "❌ Tests failed! Please fix before committing."
    exit 1
fi

echo "🎉 Pre-commit checks passed!"
EOF

# Make the hook executable
chmod +x .git/hooks/pre-commit

# Create pre-push hook
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

# Pre-push hook to validate environment configurations before deployment
# This prevents pushing broken configurations to remote

echo "🚀 Running pre-push environment validation..."

# Run comprehensive environment validation
if node scripts/validate-environment-config.js; then
    echo "✅ Environment configurations are valid"
else
    echo "❌ Environment configuration validation failed!"
    echo "Please fix the issues before pushing."
    exit 1
fi

# Run health checks on all environments
echo "🏥 Running health checks..."
if node scripts/comprehensive-health-check.js check; then
    echo "✅ All environments are healthy"
else
    echo "⚠️  Some environments have issues. Continue anyway? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Push cancelled."
        exit 1
    fi
fi

echo "🎉 Pre-push checks passed!"
EOF

# Make the hook executable
chmod +x .git/hooks/pre-push

echo "✅ Git hooks installed successfully!"
echo ""
echo "📋 What these hooks do:"
echo "   pre-commit: Validates environment configs and runs tests before each commit"
echo "   pre-push:   Validates all environments before pushing to remote"
echo ""
echo "🔧 To disable hooks temporarily:"
echo "   git commit --no-verify"
echo "   git push --no-verify"
echo ""
echo "🛡️  Your environment configurations are now protected!" 