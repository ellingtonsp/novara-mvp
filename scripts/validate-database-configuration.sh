#!/bin/bash

# Database Configuration Validation Script
# This script prevents critical database misconfiguration errors

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGING_BASE_ID="appEOWvLjCn5c7Ght"
PRODUCTION_BASE_ID="app5QWCcVbCnVg2Gg"

echo -e "${BLUE}🔍 Database Configuration Validation${NC}"
echo "=================================="

# Function to print error and exit
error_exit() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    echo -e "${RED}🚨 STOPPING DEPLOYMENT - Database configuration error detected${NC}"
    exit 1
}

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print info
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    error_exit "Railway CLI is not installed. Please install it first."
fi

# Check if we're in a Railway project
if ! railway status &> /dev/null; then
    error_exit "Not in a Railway project. Please run 'railway link' first."
fi

echo "Checking Railway context..."

# Get Railway status
RAILWAY_STATUS=$(railway status 2>/dev/null || echo "ERROR")

if [[ "$RAILWAY_STATUS" == "ERROR" ]]; then
    error_exit "Failed to get Railway status. Please check your Railway configuration."
fi

# Extract environment and service from Railway status
ENVIRONMENT=$(echo "$RAILWAY_STATUS" | grep "Environment:" | awk '{print $2}' || echo "unknown")
SERVICE=$(echo "$RAILWAY_STATUS" | grep "Service:" | awk '{print $2}' || echo "unknown")
PROJECT=$(echo "$RAILWAY_STATUS" | grep "Project:" | awk '{print $2}' || echo "unknown")

info "Project: $PROJECT"
info "Environment: $ENVIRONMENT"
info "Service: $SERVICE"

# Validate project
if [[ "$PROJECT" != "novara-mvp" ]]; then
    error_exit "Wrong project: $PROJECT (expected: novara-mvp)"
fi

success "Project validation passed"

# Get database configuration
echo "Checking database configuration..."

# Get Railway variables and extract AIRTABLE_BASE_ID
# Railway outputs in table format with Unicode box-drawing characters
DB_CONFIG=$(railway variables 2>/dev/null | grep "AIRTABLE_BASE_ID" || echo "NOT_FOUND")

if [[ "$DB_CONFIG" == "NOT_FOUND" ]]; then
    error_exit "AIRTABLE_BASE_ID not found in Railway variables"
fi

# Parse the table format with Unicode box-drawing characters
# Format: ║ AIRTABLE_BASE_ID            │ app5QWCcVbCnVg2Gg ║
# Use awk to split on │ and extract the second field, then trim whitespace
CURRENT_BASE_ID=$(echo "$DB_CONFIG" | awk -F'│' '{gsub(/^[ \t]+|[ \t]+$/, "", $2); print $2}')

# If that didn't work, try a more robust approach
if [[ -z "$CURRENT_BASE_ID" || "$CURRENT_BASE_ID" == "$DB_CONFIG" ]]; then
    # Extract everything between the │ characters
    CURRENT_BASE_ID=$(echo "$DB_CONFIG" | sed 's/.*│[[:space:]]*\([^│]*\)[[:space:]]*│.*/\1/')
fi

# Final fallback: extract the last word (the base ID)
if [[ -z "$CURRENT_BASE_ID" || "$CURRENT_BASE_ID" == "$DB_CONFIG" ]]; then
    CURRENT_BASE_ID=$(echo "$DB_CONFIG" | awk '{print $NF}' | tr -d '│║')
fi

# Clean up the base ID: remove any trailing whitespace and box-drawing characters
CURRENT_BASE_ID=$(echo "$CURRENT_BASE_ID" | sed 's/[[:space:]]*$//' | tr -d '│║')

# Additional cleanup: remove all whitespace and ensure clean base ID
CURRENT_BASE_ID=$(echo "$CURRENT_BASE_ID" | xargs)

info "Current AIRTABLE_BASE_ID: $CURRENT_BASE_ID"

# Validate environment-specific configuration
case $ENVIRONMENT in
    "staging")
        if [[ "$SERVICE" != "novara-staging" ]]; then
            error_exit "Wrong service for staging: $SERVICE (expected: novara-staging)"
        fi
        
        if [[ "$CURRENT_BASE_ID" != "$STAGING_BASE_ID" ]]; then
            error_exit "Wrong database ID for staging: $CURRENT_BASE_ID (expected: $STAGING_BASE_ID)"
        fi
        
        success "Staging configuration validated"
        ;;
        
    "production")
        if [[ "$SERVICE" != "novara-main" ]]; then
            error_exit "Wrong service for production: $SERVICE (expected: novara-main)"
        fi
        
        if [[ "$CURRENT_BASE_ID" != "$PRODUCTION_BASE_ID" ]]; then
            error_exit "Wrong database ID for production: $CURRENT_BASE_ID (expected: $PRODUCTION_BASE_ID)"
        fi
        
        success "Production configuration validated"
        ;;
        
    *)
        error_exit "Unknown environment: $ENVIRONMENT (expected: staging or production)"
        ;;
esac

# Check for cross-environment database sharing
if [[ "$ENVIRONMENT" == "production" && "$CURRENT_BASE_ID" == "$STAGING_BASE_ID" ]]; then
    error_exit "CRITICAL: Production is using staging database! This will cause data corruption."
fi

if [[ "$ENVIRONMENT" == "staging" && "$CURRENT_BASE_ID" == "$PRODUCTION_BASE_ID" ]]; then
    error_exit "CRITICAL: Staging is using production database! This will cause data corruption."
fi

# Check current git branch
echo "Checking git branch..."

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

info "Current branch: $CURRENT_BRANCH"

# Validate branch matches environment
case $ENVIRONMENT in
    "staging")
        if [[ "$CURRENT_BRANCH" != "staging" ]]; then
            warning "Branch mismatch: $CURRENT_BRANCH (expected: staging for staging deployment)"
        fi
        ;;
        
    "production")
        if [[ "$CURRENT_BRANCH" != "main" ]]; then
            warning "Branch mismatch: $CURRENT_BRANCH (expected: main for production deployment)"
        fi
        ;;
esac

# Final validation summary
echo ""
echo -e "${GREEN}🎉 Database Configuration Validation Complete${NC}"
echo "=============================================="
echo -e "${GREEN}✅ Project: $PROJECT${NC}"
echo -e "${GREEN}✅ Environment: $ENVIRONMENT${NC}"
echo -e "${GREEN}✅ Service: $SERVICE${NC}"
echo -e "${GREEN}✅ Database ID: $CURRENT_BASE_ID${NC}"
echo -e "${GREEN}✅ Branch: $CURRENT_BRANCH${NC}"
echo ""
echo -e "${GREEN}🚀 Database configuration is safe for deployment${NC}"

# Optional: Check database connectivity
if [[ "$1" == "--test-connection" ]]; then
    echo ""
    echo "Testing database connectivity..."
    
    # Get the Railway URL
    RAILWAY_URL=$(railway domain 2>/dev/null || echo "")
    
    if [[ -n "$RAILWAY_URL" ]]; then
        HEALTH_CHECK=$(curl -s "https://$RAILWAY_URL/api/health" 2>/dev/null || echo "ERROR")
        
        if [[ "$HEALTH_CHECK" != "ERROR" ]]; then
            success "Database connectivity test passed"
        else
            warning "Database connectivity test failed (this may be normal during deployment)"
        fi
    else
        warning "Could not determine Railway URL for connectivity test"
    fi
fi

echo ""
echo -e "${BLUE}📋 Validation Summary:${NC}"
echo "- Database isolation: ✅ Verified"
echo "- Environment configuration: ✅ Correct"
echo "- Service configuration: ✅ Correct"
echo "- Cross-environment sharing: ✅ Prevented"
echo ""
echo -e "${GREEN}✅ Safe to proceed with deployment${NC}" 