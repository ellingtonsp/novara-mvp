#!/bin/bash

# 🚀 Vercel Environment Setup Script
# Sets up staging and production environments for Novara MVP

set -e

echo "🚀 Novara MVP - Vercel Environment Setup"
echo "========================================"

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

print_status "Setting up Vercel environments for staging and production..."

# Navigate to frontend directory
cd frontend

# Check if Vercel CLI is installed
if ! command -v npx vercel &> /dev/null; then
    print_error "Vercel CLI not found. Please install it first: npm i -g vercel"
    exit 1
fi

print_status "Current Vercel project status:"
npx vercel project ls

echo ""
print_status "Setting up environment variables..."

# Production Environment Variables
print_status "Setting up PRODUCTION environment variables..."

# Remove existing production variables that might be incorrect
npx vercel env rm VITE_API_URL production --yes 2>/dev/null || true
npx vercel env rm VITE_ENV production --yes 2>/dev/null || true

# Set production environment variables
echo "Setting VITE_API_URL for production..."
npx vercel env add VITE_API_URL production <<< "https://novara-backend.up.railway.app"

echo "Setting VITE_ENV for production..."
npx vercel env add VITE_ENV production <<< "production"

echo "Setting NODE_ENV for production..."
npx vercel env add NODE_ENV production <<< "production"

# Preview/Staging Environment Variables
print_status "Setting up STAGING environment variables..."

# Remove existing preview variables that might be incorrect
npx vercel env rm VITE_API_URL preview --yes 2>/dev/null || true
npx vercel env rm VITE_ENV preview --yes 2>/dev/null || true

# Set staging environment variables
echo "Setting VITE_API_URL for staging..."
npx vercel env add VITE_API_URL preview <<< "https://novara-backend-staging.up.railway.app"

echo "Setting VITE_ENV for staging..."
npx vercel env add VITE_ENV preview <<< "staging"

echo "Setting NODE_ENV for staging..."
npx vercel env add NODE_ENV preview <<< "production"

# Development Environment Variables (for local testing)
print_status "Setting up DEVELOPMENT environment variables..."

# Remove existing development variables that might be incorrect
npx vercel env rm VITE_API_URL development --yes 2>/dev/null || true
npx vercel env rm VITE_ENV development --yes 2>/dev/null || true

# Set development environment variables
echo "Setting VITE_API_URL for development..."
npx vercel env add VITE_API_URL development <<< "http://localhost:9002"

echo "Setting VITE_ENV for development..."
npx vercel env add VITE_ENV development <<< "development"

echo "Setting NODE_ENV for development..."
npx vercel env add NODE_ENV development <<< "development"

print_success "Environment variables configured!"

echo ""
print_status "Current environment variables:"
npx vercel env ls

echo ""
print_status "Setting up deployment configuration..."

# Create a proper vercel.json for production
cat > vercel.json << 'EOF'
{
  "version": 2,
  "name": "novara-mvp",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "functions": {
    "app/api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  }
}
EOF

print_success "Production vercel.json configured!"

# Create staging-specific vercel.json
cat > vercel-staging.json << 'EOF'
{
  "version": 2,
  "name": "novara-mvp-staging",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "functions": {
    "app/api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  }
}
EOF

print_success "Staging vercel-staging.json configured!"

echo ""
print_status "Deployment URLs:"
echo "Production: https://novara-mvp-novara-fertility.vercel.app"
echo "Staging:    https://novara-mvp-git-staging-novara-fertility.vercel.app (after staging branch deployment)"

echo ""
print_warning "IMPORTANT: You need to configure Git branch deployment in Vercel Dashboard:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Select your novara-mvp project"
echo "3. Go to Settings → Git"
echo "4. Add 'staging' branch to Preview Deployments"
echo "5. Set Root Directory to 'frontend'"

echo ""
print_status "Testing current production deployment..."
if curl -s -f https://novara-mvp-novara-fertility.vercel.app > /dev/null; then
    print_success "Production deployment is accessible!"
else
    print_warning "Production deployment might have issues - check Vercel dashboard"
fi

echo ""
print_success "Vercel environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Configure Git branch deployment in Vercel Dashboard"
echo "2. Push to staging branch to test staging deployment"
echo "3. Test both environments with: ./scripts/test-vercel-environments.sh"
echo ""
echo "📋 Environment Summary:"
echo "   Production: https://novara-mvp-novara-fertility.vercel.app"
echo "   Staging:    https://novara-mvp-git-staging-novara-fertility.vercel.app"
echo "   Backend:    Railway (production) / Railway Staging (staging)" 