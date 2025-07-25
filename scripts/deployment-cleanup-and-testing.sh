#!/bin/bash

# Deployment Cleanup and CI/CD Protocol Testing Script
# This script cleans up failed deployments and tests updated CI/CD protocols

set -e

echo "🚀 Starting Deployment Cleanup and CI/CD Protocol Testing"
echo "========================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log with colors
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Pre-flight checks
log_info "Running pre-flight checks..."

# Check required tools
if ! command_exists vercel; then
    log_error "Vercel CLI not found. Please install with: npm i -g vercel"
    exit 1
fi

if ! command_exists railway; then
    log_error "Railway CLI not found. Please install with: npm i -g @railway/cli"
    exit 1
fi

# Check current environment
log_info "Checking current environment..."
CURRENT_BRANCH=$(git branch --show-current)
CURRENT_DIR=$(pwd)

log_info "Current branch: $CURRENT_BRANCH"
log_info "Current directory: $CURRENT_DIR"

# Verify we're in the right project
if [[ ! -f "package.json" ]] || [[ ! -f "frontend/package.json" ]] || [[ ! -f "backend/package.json" ]]; then
    log_error "Not in Novara MVP project directory"
    exit 1
fi

# Phase 1: Clean up failed Vercel deployments
log_info "Phase 1: Cleaning up failed Vercel deployments"

# Get list of failed deployments
log_info "Identifying failed deployments..."
FAILED_DEPLOYMENTS=$(vercel ls --json 2>/dev/null | jq -r '.[] | select(.state == "ERROR") | .id' 2>/dev/null || echo "")

if [[ -n "$FAILED_DEPLOYMENTS" ]]; then
    log_warning "Found failed deployments:"
    echo "$FAILED_DEPLOYMENTS" | while read -r deployment_id; do
        if [[ -n "$deployment_id" ]]; then
            log_warning "  - $deployment_id"
        fi
    done
    
    # Note: Vercel doesn't provide a direct way to delete deployments via CLI
    # We'll document them for manual cleanup
    log_info "Failed deployments should be cleaned up manually in Vercel dashboard"
else
    log_success "No failed deployments found"
fi

# Phase 2: Test CI/CD protocols
log_info "Phase 2: Testing CI/CD protocols"

# Test 1: Environment validation
log_info "Test 1: Environment validation"
if [[ "$CURRENT_BRANCH" == "staging" ]]; then
    log_success "✓ Correct branch for staging environment"
else
    log_warning "⚠ Not on staging branch (current: $CURRENT_BRANCH)"
fi

# Test 2: Railway context validation
log_info "Test 2: Railway context validation"
RAILWAY_STATUS=$(railway status 2>/dev/null || echo "ERROR")
if [[ "$RAILWAY_STATUS" == *"staging"* ]]; then
    log_success "✓ Railway context is staging"
else
    log_warning "⚠ Railway context may not be staging: $RAILWAY_STATUS"
fi

# Test 3: Environment variable validation
log_info "Test 3: Environment variable validation"
if [[ -f "frontend/.env.staging" ]] && [[ -f "backend/env.staging.example" ]]; then
    log_success "✓ Staging environment files exist"
else
    log_warning "⚠ Missing staging environment files"
fi

# Test 4: Pre-deployment safety checks
log_info "Test 4: Pre-deployment safety checks"

# Check for uncommitted changes
if [[ -n "$(git status --porcelain)" ]]; then
    log_warning "⚠ Uncommitted changes detected"
    git status --short
else
    log_success "✓ No uncommitted changes"
fi

# Check for proper branch protection
if [[ "$CURRENT_BRANCH" == "main" ]]; then
    log_warning "⚠ Direct deployment to main branch detected"
else
    log_success "✓ Not deploying directly to main"
fi

# Phase 3: Test deployment scripts
log_info "Phase 3: Testing deployment scripts"

# Test staging deployment script
if [[ -f "scripts/deploy-staging.sh" ]]; then
    log_success "✓ Staging deployment script exists"
    # Test script syntax without executing
    if bash -n scripts/deploy-staging.sh 2>/dev/null; then
        log_success "✓ Staging deployment script syntax is valid"
    else
        log_error "✗ Staging deployment script has syntax errors"
    fi
else
    log_warning "⚠ Staging deployment script not found"
fi

# Test production deployment script
if [[ -f "scripts/deploy-production.sh" ]]; then
    log_success "✓ Production deployment script exists"
    # Test script syntax without executing
    if bash -n scripts/deploy-production.sh 2>/dev/null; then
        log_success "✓ Production deployment script syntax is valid"
    else
        log_error "✗ Production deployment script has syntax errors"
    fi
else
    log_warning "⚠ Production deployment script not found"
fi

# Phase 4: Test monitoring and alerting
log_info "Phase 4: Testing monitoring and alerting"

# Test health check script
if [[ -f "scripts/environment-health-check.js" ]]; then
    log_success "✓ Health check script exists"
    # Test script execution
    if node scripts/environment-health-check.js >/dev/null 2>&1; then
        log_success "✓ Health check script executes successfully"
    else
        log_warning "⚠ Health check script has issues"
    fi
else
    log_warning "⚠ Health check script not found"
fi

# Test deployment monitoring
if [[ -f "scripts/simple-deployment-tracker.js" ]]; then
    log_success "✓ Deployment tracker exists"
else
    log_warning "⚠ Deployment tracker not found"
fi

# Phase 5: Generate CI/CD protocol report
log_info "Phase 5: Generating CI/CD protocol report"

REPORT_FILE="deployment-cleanup-report-$(date +%Y%m%d-%H%M%S).md"

cat > "$REPORT_FILE" << EOF
# Deployment Cleanup and CI/CD Protocol Test Report

**Generated:** $(date)
**Branch:** $CURRENT_BRANCH
**Environment:** $(railway status 2>/dev/null | grep Environment | cut -d: -f2 | xargs || echo "Unknown")

## Summary

This report documents the cleanup of failed deployments and testing of CI/CD protocols to minimize build failure alerts.

## Failed Deployments

$(if [[ -n "$FAILED_DEPLOYMENTS" ]]; then
    echo "The following failed deployments were identified:"
    echo "$FAILED_DEPLOYMENTS" | while read -r deployment_id; do
        if [[ -n "$deployment_id" ]]; then
            echo "- $deployment_id"
        fi
    done
    echo ""
    echo "**Action Required:** Clean up these deployments manually in the Vercel dashboard"
else
    echo "No failed deployments found."
fi)

## CI/CD Protocol Test Results

### Environment Validation
- Branch validation: $(if [[ "$CURRENT_BRANCH" == "staging" ]]; then echo "✅ PASS"; else echo "⚠️ WARNING"; fi)
- Railway context: $(if [[ "$RAILWAY_STATUS" == *"staging"* ]]; then echo "✅ PASS"; else echo "⚠️ WARNING"; fi)
- Environment files: $(if [[ -f "frontend/.env.staging" ]] && [[ -f "backend/env.staging.example" ]]; then echo "✅ PASS"; else echo "⚠️ WARNING"; fi)

### Safety Checks
- Uncommitted changes: $(if [[ -n "$(git status --porcelain)" ]]; then echo "⚠️ WARNING"; else echo "✅ PASS"; fi)
- Direct main deployment: $(if [[ "$CURRENT_BRANCH" == "main" ]]; then echo "⚠️ WARNING"; else echo "✅ PASS"; fi)

### Script Validation
- Staging deployment script: $(if [[ -f "scripts/deploy-staging.sh" ]]; then echo "✅ EXISTS"; else echo "❌ MISSING"; fi)
- Production deployment script: $(if [[ -f "scripts/deploy-production.sh" ]]; then echo "✅ EXISTS"; else echo "❌ MISSING"; fi)
- Health check script: $(if [[ -f "scripts/environment-health-check.js" ]]; then echo "✅ EXISTS"; else echo "❌ MISSING"; fi)
- Deployment tracker: $(if [[ -f "scripts/simple-deployment-tracker.js" ]]; then echo "✅ EXISTS"; else echo "❌ MISSING"; fi)

## Recommendations

1. **Immediate Actions:**
   - Clean up failed deployments in Vercel dashboard
   - Review and commit any uncommitted changes
   - Ensure proper environment variables are set

2. **CI/CD Improvements:**
   - Implement automated deployment rollback procedures
   - Add deployment success/failure notifications
   - Enhance monitoring for build failures

3. **Protocol Enhancements:**
   - Add pre-deployment validation checks
   - Implement deployment health monitoring
   - Create automated cleanup procedures

## Next Steps

1. Review this report and address any warnings
2. Test deployment procedures in staging environment
3. Implement recommended improvements
4. Schedule regular cleanup procedures

EOF

log_success "Report generated: $REPORT_FILE"

# Phase 6: Create automated cleanup script
log_info "Phase 6: Creating automated cleanup script"

cat > "scripts/automated-cleanup.sh" << 'EOF'
#!/bin/bash

# Automated Deployment Cleanup Script
# Run this script regularly to maintain clean deployment history

set -e

echo "🧹 Starting automated deployment cleanup..."

# Clean up old deployment logs
find . -name "deployment-cleanup-report-*.md" -mtime +7 -delete 2>/dev/null || true

# Clean up old test reports
find . -name "test-report.json" -mtime +3 -delete 2>/dev/null || true

# Clean up old log files
find . -name "*.log" -mtime +1 -delete 2>/dev/null || true

# Clean up node_modules in case of corruption
if [[ -d "node_modules" ]] && [[ ! -f "node_modules/.package-lock.json" ]]; then
    echo "Cleaning up corrupted node_modules..."
    rm -rf node_modules
fi

if [[ -d "frontend/node_modules" ]] && [[ ! -f "frontend/node_modules/.package-lock.json" ]]; then
    echo "Cleaning up corrupted frontend node_modules..."
    rm -rf frontend/node_modules
fi

if [[ -d "backend/node_modules" ]] && [[ ! -f "backend/node_modules/.package-lock.json" ]]; then
    echo "Cleaning up corrupted backend node_modules..."
    rm -rf backend/node_modules
fi

echo "✅ Automated cleanup completed"
EOF

chmod +x scripts/automated-cleanup.sh
log_success "Created automated cleanup script: scripts/automated-cleanup.sh"

# Final summary
echo ""
echo "🎯 DEPLOYMENT CLEANUP AND CI/CD TESTING COMPLETE"
echo "================================================"
log_success "Report generated: $REPORT_FILE"
log_success "Automated cleanup script created: scripts/automated-cleanup.sh"
echo ""
echo "📋 Next Steps:"
echo "1. Review the generated report"
echo "2. Clean up failed deployments in Vercel dashboard"
echo "3. Address any warnings in the report"
echo "4. Test deployment procedures"
echo "5. Schedule regular cleanup with: ./scripts/automated-cleanup.sh"
echo ""
echo "🔒 Remember: Always test in staging before production!" 