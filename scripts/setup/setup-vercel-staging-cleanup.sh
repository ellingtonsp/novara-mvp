#!/bin/bash

# 🚀 Vercel Staging Setup & Cleanup Script
# Sets up staging branch deployment and cleans up failed deployments

set -e

echo "🚀 Novara MVP - Vercel Staging Setup & Cleanup"
echo "=============================================="

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

print_status "Setting up staging branch deployment and cleaning up environments..."

# Navigate to frontend directory
cd frontend

# Check if Vercel CLI is installed
if ! command -v npx vercel &> /dev/null; then
    print_error "Vercel CLI not found. Please install it first: npm i -g vercel"
    exit 1
fi

echo ""
print_status "Step 1: Checking current deployments..."

# Get current deployments
npx vercel ls

echo ""
print_status "Step 2: Setting up staging branch deployment..."

# Check if staging branch exists
if ! git branch -r | grep -q "origin/staging"; then
    print_warning "Staging branch doesn't exist remotely. Creating it..."
    
    # Go back to root directory to create staging branch
    cd ..
    
    # Create and push staging branch
    git checkout -b staging
    git push -u origin staging
    
    print_success "Staging branch created and pushed to origin"
    
    # Go back to frontend directory
    cd frontend
else
    print_success "Staging branch already exists"
fi

echo ""
print_status "Step 3: Deploying staging branch..."

# Deploy staging branch
print_status "Deploying from staging branch..."
npx vercel --target staging

print_success "Staging deployment initiated!"

echo ""
print_status "Step 4: Cleaning up failed deployments..."

# Function to remove a deployment
remove_deployment() {
    local deployment_url=$1
    local deployment_id=$(echo "$deployment_url" | sed 's|https://||' | sed 's|\.vercel\.app||')
    
    print_status "Removing deployment: $deployment_id"
    
    # Try to remove the deployment
    if npx vercel remove "$deployment_id" --yes 2>/dev/null; then
        print_success "Removed: $deployment_id"
    else
        print_warning "Could not remove: $deployment_id (may already be gone)"
    fi
}

# Get list of failed deployments and remove them
print_status "Identifying failed deployments..."

# Get deployments and filter for failed ones
deployments=$(npx vercel ls --json 2>/dev/null | jq -r '.[] | select(.state == "ERROR") | .url' 2>/dev/null || echo "")

if [ -n "$deployments" ]; then
    echo "$deployments" | while read -r deployment_url; do
        if [ -n "$deployment_url" ]; then
            remove_deployment "$deployment_url"
        fi
    done
else
    print_success "No failed deployments found to clean up"
fi

echo ""
print_status "Step 5: Verifying environment variables for staging..."

# Check if staging environment variables are set
staging_vars=$(npx vercel env ls | grep "Preview" | grep "VITE_API_URL" || echo "")

if [ -n "$staging_vars" ]; then
    print_success "Staging environment variables are configured"
else
    print_warning "Staging environment variables may need configuration"
    print_status "Run: ./scripts/setup-vercel-environments.sh to configure"
fi

echo ""
print_status "Step 6: Testing staging deployment..."

# Wait a moment for deployment to complete
sleep 5

# Test staging URL
STAGING_URL="https://novara-mvp-git-staging-novara-fertility.vercel.app"
print_status "Testing staging URL: $STAGING_URL"

if curl -s -f "$STAGING_URL" > /dev/null; then
    print_success "Staging deployment is accessible!"
else
    print_warning "Staging deployment may still be building or needs configuration"
    print_status "Check Vercel dashboard for deployment status"
fi

echo ""
print_status "Step 7: Setting up Git branch deployment in Vercel Dashboard..."

print_warning "IMPORTANT: You need to configure Git branch deployment in Vercel Dashboard:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Select your novara-mvp project"
echo "3. Go to Settings → Git"
echo "4. Add 'staging' branch to Preview Deployments"
echo "5. Set Root Directory to 'frontend'"
echo "6. Set Build Command to 'npm run build'"
echo "7. Set Output Directory to 'dist'"

echo ""
print_success "Vercel staging setup and cleanup complete!"
echo ""
echo "🎯 Summary:"
echo "   Production: https://novara-mvp-novara-fertility.vercel.app"
echo "   Staging:    https://novara-mvp-git-staging-novara-fertility.vercel.app"
echo "   Backend:    Railway (production) / Railway Staging (staging)"
echo ""
echo "📋 Next Steps:"
echo "1. Configure Git branch deployment in Vercel Dashboard"
echo "2. Test staging environment: ./scripts/test-vercel-environments.sh"
echo "3. Push to staging branch to trigger auto-deployment"
echo ""
echo "🔄 Workflow:"
echo "   git checkout staging"
echo "   git add . && git commit -m 'feat: new feature'"
echo "   git push origin staging"
echo "   # Vercel auto-deploys from staging branch" 