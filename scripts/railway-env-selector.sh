#!/bin/bash

# 🚀 Automated Railway Environment Selector
# This script automatically selects the appropriate Railway environment without user interaction

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

# Function to select environment automatically
select_environment() {
    local target_env=$1
    
    log "🔍 Automatically selecting Railway environment: $target_env"
    
    # Get current status
    local current_status=$(railway status 2>/dev/null || echo "not_connected")
    
    if [[ "$current_status" == "not_connected" ]]; then
        log "🔗 Not connected to Railway project, attempting to link..."
        # Try to link to the project automatically
        if railway link &> /dev/null; then
            success "Linked to Railway project"
        else
            error "Failed to link to Railway project"
            return 1
        fi
    fi
    
    # Check current environment
    local current_env=$(railway status 2>/dev/null | grep "Environment:" | awk '{print $2}' || echo "unknown")
    
    if [[ "$current_env" == "$target_env" ]]; then
        success "Already connected to $target_env environment"
        return 0
    fi
    
    log "🔄 Switching from $current_env to $target_env environment..."
    
    # Use expect-like approach to handle interactive prompts
    # Create a temporary script to handle the environment selection
    cat > /tmp/railway_env_switch.exp << EOF
#!/usr/bin/expect -f
set timeout 30
spawn railway environment
expect "Select an environment"
send "\r"
expect "production"
send "\r"
expect "staging"
send "\r"
expect eof
EOF
    
    # Make the expect script executable and run it
    chmod +x /tmp/railway_env_switch.exp
    
    # Alternative approach: use railway link with environment flag
    if railway link --environment "$target_env" &> /dev/null; then
        success "Successfully switched to $target_env environment"
        return 0
    else
        # Fallback: try to find the environment in the project
        log "🔍 Searching for $target_env environment in project..."
        
        # Get list of environments and try to match
        local env_list=$(railway environment 2>/dev/null | grep -v "Select an environment" | grep -v "^$" || echo "")
        
        if echo "$env_list" | grep -q "$target_env"; then
            # Environment exists, try to link to it
            if railway link --environment "$target_env" &> /dev/null; then
                success "Successfully linked to $target_env environment"
                return 0
            fi
        fi
        
        error "Could not switch to $target_env environment"
        return 1
    fi
}

# Function to deploy to specific environment
deploy_to_environment() {
    local target_env=$1
    
    log "🚀 Starting deployment to $target_env environment"
    
    # First, select the environment
    if ! select_environment "$target_env"; then
        error "Failed to select $target_env environment"
        return 1
    fi
    
    # Verify we're in the correct environment
    local current_env=$(railway status 2>/dev/null | grep "Environment:" | awk '{print $2}' || echo "unknown")
    
    if [[ "$current_env" != "$target_env" ]]; then
        error "Environment verification failed. Expected: $target_env, Got: $current_env"
        return 1
    fi
    
    success "Environment verified: $current_env"
    
    # Deploy the backend
    log "📦 Deploying backend to $target_env..."
    if railway up; then
        success "Backend deployed successfully to $target_env"
    else
        error "Backend deployment failed"
        return 1
    fi
    
    # Get the deployment URL
    local deploy_url=$(railway status 2>/dev/null | grep "Deploy" | awk '{print $2}' || echo "")
    if [[ -n "$deploy_url" ]]; then
        success "Deployment URL: $deploy_url"
    fi
    
    return 0
}

# Main execution
main() {
    local target_env=${1:-"staging"}
    
    log "🚀 Railway Environment Selector"
    log "Target environment: $target_env"
    
    case "$target_env" in
        "staging"|"production"|"development")
            deploy_to_environment "$target_env"
            ;;
        *)
            error "Invalid environment: $target_env"
            echo "Usage: $0 [staging|production|development]"
            exit 1
            ;;
    esac
}

# Run main function with arguments
main "$@" 