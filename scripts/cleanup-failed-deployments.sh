#!/bin/bash

# 🧹 Vercel Failed Deployments Cleanup Script
# Removes failed deployments to clean up the Vercel project

set -e

echo "🧹 Novara MVP - Failed Deployments Cleanup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the novara-mvp root directory"
    exit 1
fi

print_status "Cleaning up failed Vercel deployments..."

# Navigate to frontend directory
cd frontend

# Check if Vercel CLI is installed
if ! command -v npx vercel &> /dev/null; then
    print_error "Vercel CLI not found. Please install it first: npm i -g vercel"
    exit 1
fi

echo ""
print_status "Step 1: Identifying failed deployments..."

# Get list of failed deployments
failed_deployments=$(npx vercel ls | grep "Error" | awk '{print $3}' | sed 's|https://||' | sed 's|\.vercel\.app||')

if [ -z "$failed_deployments" ]; then
    print_success "No failed deployments found!"
    exit 0
fi

echo "Found failed deployments:"
echo "$failed_deployments"

echo ""
print_status "Step 2: Removing failed deployments..."

# Function to remove a deployment
remove_deployment() {
    local deployment_id=$1
    print_status "Removing deployment: $deployment_id"
    
    # Try to remove the deployment
    if npx vercel remove "$deployment_id" --yes 2>/dev/null; then
        print_success "Removed: $deployment_id"
    else
        print_warning "Could not remove: $deployment_id (may already be gone)"
    fi
}

# Remove each failed deployment
echo "$failed_deployments" | while read -r deployment_id; do
    if [ -n "$deployment_id" ]; then
        remove_deployment "$deployment_id"
        # Small delay to avoid rate limiting
        sleep 1
    fi
done

echo ""
print_status "Step 3: Verifying cleanup..."

# Check remaining deployments
remaining_failed=$(npx vercel ls | grep "Error" | wc -l)

if [ "$remaining_failed" -eq 0 ]; then
    print_success "All failed deployments have been cleaned up!"
else
    print_warning "Some failed deployments may still exist. Check manually:"
    npx vercel ls | grep "Error"
fi

echo ""
print_status "Step 4: Current deployment status..."

# Show current deployments
npx vercel ls | head -10

echo ""
print_success "Failed deployments cleanup complete!"
echo ""
echo "🎯 Summary:"
echo "   Production: https://novara-mvp-novara-fertility.vercel.app"
echo "   Staging:    https://novara-opyu8zycu-novara-fertility.vercel.app"
echo ""
echo "📋 Next Steps:"
echo "1. Configure Git branch deployment in Vercel Dashboard"
echo "2. Test both environments"
echo "3. Set up monitoring for future deployments" 