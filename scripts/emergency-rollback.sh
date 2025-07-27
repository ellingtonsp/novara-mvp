#!/bin/bash

# 🚨 Emergency Rollback Script
# This script provides emergency rollback capabilities for failed deployments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if Railway CLI is available
check_railway_cli() {
    if ! command -v railway &> /dev/null; then
        error "Railway CLI not found. Install with: npm install -g @railway/cli"
        exit 1
    fi
    
    if ! railway whoami &> /dev/null; then
        error "Not logged into Railway. Run: railway login"
        exit 1
    fi
    
    success "Railway CLI ready"
}

# Function to get deployment status
get_deployment_status() {
    local environment=$1
    local service=$2
    
    log "Checking deployment status for ${environment} ${service}..."
    
    # Get current deployment status
    local status=$(railway status --json 2>/dev/null | jq -r '.status // "unknown"')
    local url=$(railway status --json 2>/dev/null | jq -r '.url // "unknown"')
    
    echo "Status: $status"
    echo "URL: $url"
    
    return 0
}

# Function to rollback Railway deployment
rollback_railway() {
    local environment=$1
    local service=$2
    
    log "🚨 Initiating emergency rollback for ${environment} ${service}..."
    
    # Check if we can access Railway dashboard
    if ! railway projects &> /dev/null; then
        error "Cannot access Railway projects. Please check your login status."
        return 1
    fi
    
    # Link to the correct environment
    log "Linking to ${environment} environment..."
    if railway link --project novara-mvp --environment ${environment} --service ${service} --yes &> /dev/null; then
        success "Linked to ${environment} ${service}"
    else
        warning "Linking failed, attempting to continue..."
    fi
    
    # Get deployment history
    log "Getting deployment history..."
    local deployments=$(railway logs --json 2>/dev/null | jq -r '.deployments // []')
    
    if [ -z "$deployments" ]; then
        warning "No deployment history found"
        return 1
    fi
    
    # Find the previous successful deployment
    local previous_deployment=$(echo "$deployments" | jq -r '.[1].id // empty')
    
    if [ -z "$previous_deployment" ]; then
        error "No previous deployment found for rollback"
        return 1
    fi
    
    log "Rolling back to deployment: $previous_deployment"
    
    # Attempt rollback
    if railway rollback $previous_deployment &> /dev/null; then
        success "Rollback initiated successfully"
        
        # Wait for rollback to complete
        log "Waiting for rollback to complete..."
        sleep 30
        
        # Verify rollback
        get_deployment_status $environment $service
        
    else
        error "Rollback failed"
        return 1
    fi
}

# Function to rollback Vercel deployment
rollback_vercel() {
    local environment=$1
    
    log "🚨 Initiating Vercel rollback for ${environment}..."
    
    # Check if Vercel CLI is available
    if ! command -v vercel &> /dev/null; then
        error "Vercel CLI not found. Install with: npm install -g vercel"
        return 1
    fi
    
    # Get deployment list
    log "Getting Vercel deployment history..."
    local deployments=$(vercel ls --json 2>/dev/null)
    
    if [ -z "$deployments" ]; then
        warning "No Vercel deployment history found"
        return 1
    fi
    
    # Find the previous deployment
    local previous_deployment=$(echo "$deployments" | jq -r '.[1].id // empty')
    
    if [ -z "$previous_deployment" ]; then
        error "No previous Vercel deployment found for rollback"
        return 1
    fi
    
    log "Rolling back to Vercel deployment: $previous_deployment"
    
    # Attempt rollback
    if vercel rollback $previous_deployment &> /dev/null; then
        success "Vercel rollback initiated successfully"
    else
        error "Vercel rollback failed"
        return 1
    fi
}

# Function to check health after rollback
check_health_after_rollback() {
    local environment=$1
    local backend_url=$2
    
    log "🔍 Checking health after rollback..."
    
    # Wait a bit for services to stabilize
    sleep 10
    
    # Test backend health
    if [ -n "$backend_url" ] && [ "$backend_url" != "unknown" ]; then
        log "Testing backend health at: $backend_url/api/health"
        
        local health_response=$(curl -s "$backend_url/api/health" 2>/dev/null || echo "{}")
        local health_status=$(echo "$health_response" | jq -r '.environment // "unknown"')
        
        if [ "$health_status" = "$environment" ]; then
            success "Backend health check passed after rollback"
        else
            warning "Backend health check failed or environment mismatch"
        fi
    else
        warning "Backend URL unknown, skipping health check"
    fi
}

# Function to create emergency issue
create_emergency_issue() {
    local environment=$1
    local service=$2
    local reason=$3
    
    log "📝 Creating emergency issue..."
    
    # Create emergency report
    local report_file="emergency-rollback-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# 🚨 Emergency Rollback Report

**Date:** $(date)
**Environment:** $environment
**Service:** $service
**Reason:** $reason

## Rollback Actions Taken

1. Railway deployment rollback initiated
2. Health checks performed
3. Emergency issue created

## Next Steps

1. Investigate the root cause of the deployment failure
2. Fix the issue in development
3. Test thoroughly before redeploying
4. Update deployment procedures if needed

## Contact

- **Emergency Contact:** Development Team
- **Slack Channel:** #novara-deployments
- **GitHub Issues:** Check for related issues

---
*Generated by Emergency Rollback Script*
EOF

    success "Emergency report created: $report_file"
}

# Main rollback function
main_rollback() {
    local environment=${1:-"staging"}
    local service=${2:-"novara-backend-staging"}
    local reason=${3:-"Deployment failure detected"}
    
    echo ""
    echo "🚨 EMERGENCY ROLLBACK INITIATED"
    echo "================================"
    echo "Environment: $environment"
    echo "Service: $service"
    echo "Reason: $reason"
    echo ""
    
    # Check prerequisites
    check_railway_cli
    
    # Get current status
    get_deployment_status $environment $service
    
    # Confirm rollback
    echo ""
    read -p "⚠️  Are you sure you want to rollback? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        warning "Rollback cancelled by user"
        exit 0
    fi
    
    # Perform rollback
    local rollback_success=true
    
    # Rollback Railway deployment
    if ! rollback_railway $environment $service; then
        error "Railway rollback failed"
        rollback_success=false
    fi
    
    # Rollback Vercel if it's a frontend service
    if [[ "$service" == *"frontend"* ]]; then
        if ! rollback_vercel $environment; then
            warning "Vercel rollback failed (non-critical)"
        fi
    fi
    
    # Check health after rollback
    local backend_url=$(railway status --json 2>/dev/null | jq -r '.url // "unknown"')
    check_health_after_rollback $environment $backend_url
    
    # Create emergency issue
    create_emergency_issue $environment $service "$reason"
    
    # Summary
    echo ""
    echo "📊 ROLLBACK SUMMARY"
    echo "==================="
    
    if [ "$rollback_success" = true ]; then
        success "Rollback completed successfully"
        echo "✅ Railway deployment rolled back"
        echo "✅ Health checks performed"
        echo "✅ Emergency report created"
    else
        error "Rollback partially failed"
        echo "❌ Some rollback steps failed"
        echo "⚠️  Manual intervention may be required"
    fi
    
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Investigate the root cause"
    echo "2. Fix the issue in development"
    echo "3. Test thoroughly before redeploying"
    echo "4. Check the emergency report for details"
    echo ""
}

# CLI usage
if [ $# -eq 0 ]; then
    echo "🚨 Emergency Rollback Script"
    echo ""
    echo "Usage: $0 [environment] [service] [reason]"
    echo ""
    echo "Examples:"
    echo "  $0 staging novara-backend-staging 'Build failure'"
    echo "  $0 production novara-backend-production 'Runtime error'"
    echo "  $0 staging novara-frontend-staging 'Frontend build error'"
    echo ""
    echo "Default: staging novara-backend-staging"
    echo ""
    exit 1
fi

# Run main rollback function
main_rollback "$@"