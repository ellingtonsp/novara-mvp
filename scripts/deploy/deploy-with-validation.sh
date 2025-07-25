#!/bin/bash

# Novara Deployment Script with Validation
# This script ensures all environments are validated before and after deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate environment
validate_environment() {
    local env=$1
    print_status "Validating $env environment..."
    
    if npm run "health-check:$env" >/dev/null 2>&1; then
        print_success "$env environment validation passed"
        return 0
    else
        print_error "$env environment validation failed"
        return 1
    fi
}

# Function to run environment validator
run_validator() {
    print_status "Running environment validator..."
    
    if npm run validate-environments >/dev/null 2>&1; then
        print_success "Environment validator passed"
        return 0
    else
        print_error "Environment validator failed"
        return 1
    fi
}

# Function to check git status
check_git_status() {
    print_status "Checking git status..."
    
    if [[ -n $(git status --porcelain) ]]; then
        print_warning "Uncommitted changes detected"
        read -p "Do you want to commit changes before deployment? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            read -p "Enter commit message: " commit_message
            git commit -m "$commit_message"
        fi
    else
        print_success "Git working directory is clean"
    fi
}

# Function to deploy to staging
deploy_staging() {
    print_status "Deploying to staging..."
    
    # Check if we're on staging branch
    current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "staging" ]]; then
        print_warning "Not on staging branch. Current branch: $current_branch"
        read -p "Do you want to switch to staging branch? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git checkout staging
        else
            print_error "Deployment cancelled"
            exit 1
        fi
    fi
    
    # Push to staging
    print_status "Pushing to staging branch..."
    git push origin staging
    
    print_success "Staging deployment triggered"
    print_status "Waiting for deployment to complete..."
    sleep 30
    
    # Wait for deployment and validate
    print_status "Validating staging deployment..."
    for i in {1..10}; do
        if validate_environment "staging"; then
            print_success "Staging deployment successful!"
            return 0
        else
            print_warning "Staging validation attempt $i failed, retrying in 30 seconds..."
            sleep 30
        fi
    done
    
    print_error "Staging deployment validation failed after 10 attempts"
    return 1
}

# Function to deploy to production
deploy_production() {
    print_status "Deploying to production..."
    
    # Check if we're on main branch
    current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "main" ]]; then
        print_warning "Not on main branch. Current branch: $current_branch"
        read -p "Do you want to switch to main branch? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git checkout main
        else
            print_error "Deployment cancelled"
            exit 1
        fi
    fi
    
    # Push to main
    print_status "Pushing to main branch..."
    git push origin main
    
    print_success "Production deployment triggered"
    print_status "Waiting for deployment to complete..."
    sleep 60
    
    # Wait for deployment and validate
    print_status "Validating production deployment..."
    for i in {1..10}; do
        if validate_environment "production"; then
            print_success "Production deployment successful!"
            return 0
        else
            print_warning "Production validation attempt $i failed, retrying in 60 seconds..."
            sleep 60
        fi
    done
    
    print_error "Production deployment validation failed after 10 attempts"
    return 1
}

# Main deployment function
main() {
    local target_env=$1
    
    echo "============================================================"
    echo "🚀 Novara Deployment Script with Validation"
    echo "============================================================"
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command_exists git; then
        print_error "git is not installed"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
    
    # Pre-deployment validation
    print_status "Running pre-deployment validation..."
    
    if ! run_validator; then
        print_error "Pre-deployment validation failed. Please fix issues before deploying."
        exit 1
    fi
    
    # Check git status
    check_git_status
    
    # Deploy based on target environment
    case $target_env in
        "staging")
            print_status "Starting staging deployment..."
            if deploy_staging; then
                print_success "🎉 Staging deployment completed successfully!"
            else
                print_error "❌ Staging deployment failed"
                exit 1
            fi
            ;;
        "production")
            print_status "Starting production deployment..."
            
            # Validate staging first
            print_status "Validating staging environment before production deployment..."
            if ! validate_environment "staging"; then
                print_error "Staging environment validation failed. Cannot proceed with production deployment."
                exit 1
            fi
            
            if deploy_production; then
                print_success "🎉 Production deployment completed successfully!"
            else
                print_error "❌ Production deployment failed"
                exit 1
            fi
            ;;
        *)
            print_error "Invalid target environment. Use 'staging' or 'production'"
            echo "Usage: $0 [staging|production]"
            exit 1
            ;;
    esac
    
    # Final validation
    print_status "Running final validation..."
    if run_validator; then
        print_success "✅ All validations passed!"
    else
        print_warning "⚠️  Some validations failed. Please check manually."
    fi
    
    echo "============================================================"
    print_success "Deployment script completed!"
    echo "============================================================"
}

# Check if target environment is provided
if [[ $# -eq 0 ]]; then
    print_error "No target environment specified"
    echo "Usage: $0 [staging|production]"
    exit 1
fi

# Run main function with provided arguments
main "$@" 