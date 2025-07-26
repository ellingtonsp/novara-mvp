#!/bin/bash

# Novara MVP - Unified Deployment Script
# Simple wrapper around the deployment orchestrator

set -e

# Colors for output
RED='\x1b[0;31m'
GREEN='\x1b[0;32m'
YELLOW='\x1b[1;33m'
BLUE='\x1b[0;34m'
NC='\x1b[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default values
ENVIRONMENT=""
FORCE=false
DRY_RUN=false
VERBOSE=false

# Function to print usage
usage() {
    echo -e "${BLUE}Novara MVP Deployment Script${NC}"
    echo ""
    echo "Usage: $0 <environment> [options]"
    echo ""
    echo "Environments:"
    echo "  development  - Local development environment"
    echo "  staging      - Staging environment (Railway + Vercel)"
    echo "  production   - Production environment (Railway + Vercel)"
    echo ""
    echo "Options:"
    echo "  --force      - Skip confirmation prompts"
    echo "  --dry-run    - Validate configuration without deploying"
    echo "  --verbose    - Enable verbose logging"
    echo "  --help, -h   - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 staging"
    echo "  $0 production --force"
    echo "  $0 staging --dry-run"
    echo ""
}

# Function to print error and exit
error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
    exit 1
}

# Function to print success message
success_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print info message
info_msg() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to print warning message
warn_msg() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        development|staging|production)
            if [[ -n "$ENVIRONMENT" ]]; then
                error_exit "Multiple environments specified. Use only one."
            fi
            ENVIRONMENT="$1"
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            error_exit "Unknown option: $1. Use --help for usage information."
            ;;
    esac
done

# Validate environment is provided
if [[ -z "$ENVIRONMENT" ]]; then
    error_exit "Environment is required. Use --help for usage information."
fi

# Validate environment
case $ENVIRONMENT in
    development|staging|production)
        ;;
    *)
        error_exit "Invalid environment: $ENVIRONMENT. Valid options: development, staging, production"
        ;;
esac

# Change to project root
cd "$PROJECT_ROOT"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    error_exit "Node.js is not installed or not in PATH"
fi

# Check if deployment orchestrator exists
ORCHESTRATOR_PATH="$PROJECT_ROOT/scripts/deploy-orchestrator.js"
if [[ ! -f "$ORCHESTRATOR_PATH" ]]; then
    error_exit "Deployment orchestrator not found at: $ORCHESTRATOR_PATH"
fi

# Build orchestrator arguments
ORCHESTRATOR_ARGS=("$ENVIRONMENT")

if [[ "$FORCE" == true ]]; then
    ORCHESTRATOR_ARGS+=(--force)
fi

if [[ "$DRY_RUN" == true ]]; then
    ORCHESTRATOR_ARGS+=(--dry-run)
fi

if [[ "$VERBOSE" == true ]]; then
    ORCHESTRATOR_ARGS+=(--verbose)
fi

# Print deployment information
echo -e "${BLUE}🚀 Novara MVP Deployment${NC}"
echo "=========================="
echo "Environment: $ENVIRONMENT"
echo "Force: $FORCE"
echo "Dry Run: $DRY_RUN"
echo "Verbose: $VERBOSE"
echo ""

# Confirmation for production (unless forced or dry run)
if [[ "$ENVIRONMENT" == "production" && "$FORCE" != true && "$DRY_RUN" != true ]]; then
    warn_msg "You are about to deploy to PRODUCTION"
    echo "This will affect live users. Make sure you have:"
    echo "  ✅ Tested in staging environment"
    echo "  ✅ Reviewed all changes"
    echo "  ✅ Notified team members"
    echo ""
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation
    
    if [[ "$confirmation" != "yes" ]]; then
        info_msg "Deployment cancelled by user"
        exit 0
    fi
fi

# Run the deployment orchestrator
info_msg "Starting deployment orchestrator..."
echo ""

if node "$ORCHESTRATOR_PATH" "${ORCHESTRATOR_ARGS[@]}"; then
    echo ""
    success_msg "Deployment completed successfully!"
    
    # Print useful information
    if [[ "$ENVIRONMENT" != "development" ]]; then
        echo ""
        echo -e "${BLUE}📋 Post-Deployment Checklist:${NC}"
        echo "  1. Verify application is accessible"
        echo "  2. Test key user journeys"
        echo "  3. Check error monitoring"
        echo "  4. Monitor performance metrics"
        
        if [[ "$ENVIRONMENT" == "production" ]]; then
            echo "  5. Notify team of successful deployment"
            echo "  6. Update release notes"
        fi
    fi
else
    error_exit "Deployment failed. Check the logs for details."
fi 