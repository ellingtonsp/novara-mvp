#!/bin/bash

# 🚀 Automated Staging Deployment - No User Interaction
# This script deploys to staging without requiring any manual environment selection

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

log "🚀 Starting Automated Staging Deployment"

# Step 1: Verify we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    error "Must run from project root directory"
    exit 1
fi
success "Project structure verified"

# Step 2: Check Railway CLI
if ! command -v railway &> /dev/null; then
    error "Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi
success "Railway CLI found"

# Step 3: Check if logged in
if ! railway whoami &> /dev/null; then
    error "Not logged into Railway. Run: railway login"
    exit 1
fi
success "Logged into Railway"

# Step 4: Get current status
log "🔍 Checking current Railway status..."
CURRENT_STATUS=$(railway status 2>/dev/null || echo "not_connected")

if [[ "$CURRENT_STATUS" == "not_connected" ]]; then
    log "🔗 Linking to Railway project..."
    if railway link &> /dev/null; then
        success "Linked to Railway project"
    else
        error "Failed to link to Railway project"
        exit 1
    fi
fi

# Step 5: Check current environment
CURRENT_ENV=$(railway status 2>/dev/null | grep "Environment:" | awk '{print $2}' || echo "unknown")
log "Current environment: $CURRENT_ENV"

# Step 6: Switch to staging if needed
if [[ "$CURRENT_ENV" != "staging" ]]; then
    log "🔄 Switching to staging environment..."
    
    # Try to link to staging environment
    if railway link --environment staging &> /dev/null; then
        success "Switched to staging environment"
    else
        # If that fails, try to find staging in the project
        log "🔍 Searching for staging environment..."
        
        # Get available environments (this might be interactive, so we'll handle it)
        ENV_LIST=$(railway environment 2>/dev/null | grep -v "Select an environment" | grep -v "^$" || echo "")
        
        if echo "$ENV_LIST" | grep -q "staging"; then
            log "Found staging environment, attempting to link..."
            # Try alternative linking method
            if railway link --environment staging &> /dev/null; then
                success "Successfully linked to staging environment"
            else
                error "Could not link to staging environment"
                log "Available environments:"
                echo "$ENV_LIST"
                exit 1
            fi
        else
            error "Staging environment not found"
            log "Available environments:"
            echo "$ENV_LIST"
            exit 1
        fi
    fi
else
    success "Already in staging environment"
fi

# Step 7: Verify we're in staging
CURRENT_ENV=$(railway status 2>/dev/null | grep "Environment:" | awk '{print $2}' || echo "unknown")
if [[ "$CURRENT_ENV" != "staging" ]]; then
    error "Failed to switch to staging environment. Current: $CURRENT_ENV"
    exit 1
fi
success "Environment verified: staging"

# Step 8: Deploy backend
log "📦 Deploying backend to staging..."
cd backend

if railway up; then
    success "Backend deployed successfully to staging"
else
    error "Backend deployment failed"
    exit 1
fi

cd ..

# Step 9: Get deployment URL
log "🔗 Getting deployment URL..."
DEPLOY_URL=$(railway status 2>/dev/null | grep "Deploy" | awk '{print $2}' || echo "")
if [[ -n "$DEPLOY_URL" ]]; then
    success "Staging deployment URL: $DEPLOY_URL"
else
    warning "Could not retrieve deployment URL"
fi

# Step 10: Health check
log "🏥 Running health check..."
if [[ -n "$DEPLOY_URL" ]]; then
    HEALTH_URL="$DEPLOY_URL/api/health"
    if curl -s "$HEALTH_URL" | grep -q "status.*ok"; then
        success "Health check passed"
    else
        warning "Health check failed or endpoint not responding"
    fi
else
    warning "Skipping health check - no deployment URL available"
fi

success "🎉 Staging deployment completed successfully!"
log "📊 Staging URL: $DEPLOY_URL"
log "🏥 Health Check: $DEPLOY_URL/api/health" 