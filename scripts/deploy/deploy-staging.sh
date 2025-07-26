#!/bin/bash
# Novara MVP - Staging Deployment Script
# DEPRECATED: This script is deprecated. Use the new unified deployment system.
# 
# New usage:
#   ./scripts/deploy.sh staging
#   node scripts/deploy-orchestrator.js staging

echo "⚠️ DEPRECATED SCRIPT WARNING"
echo "============================"
echo "This script is deprecated and will be removed in a future version."
echo "Please use the new unified deployment system:"
echo ""
echo "  ./scripts/deploy.sh staging"
echo "  OR"
echo "  node scripts/deploy-orchestrator.js staging"
echo ""
echo "The new system provides:"
echo "  ✅ Better error handling and rollback"
echo "  ✅ Consistent deployment process"
echo "  ✅ Comprehensive logging and monitoring"
echo "  ✅ Automated health checks"
echo ""
read -p "Do you want to continue with the new deployment system? (y/N): " continue_new

if [[ "$continue_new" == "y" || "$continue_new" == "Y" ]]; then
    echo "Redirecting to new deployment system..."
    exec "$(dirname "$0")/../deploy.sh" staging
fi

echo "Deployment cancelled."
exit 1

# Legacy deployment code below (kept for reference but disabled)
exit 1

# Colors for output
RED='\x1b[0;31m'
GREEN='\x1b[0;32m'
YELLOW='\x1b[1;33m'
BLUE='\x1b[0;34m'
NC='\x1b[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

# Check prerequisites
echo ""
echo "🔍 Checking prerequisites..."

if ! command_exists node; then
    echo -e "${RED}❌ Node.js not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm not installed${NC}"
    exit 1
fi

if ! command_exists vercel; then
    echo -e "${YELLOW}⚠️  Vercel CLI not installed. Installing...${NC}"
    npm install -g vercel
fi

if ! command_exists railway; then
    echo -e "${YELLOW}⚠️  Railway CLI not installed. Installing...${NC}"
    npm install -g @railway/cli
fi

print_status 0 "Prerequisites check complete"

echo ""
echo "📦 Building Frontend for Staging..."

# Build frontend with staging configuration
cd frontend

# Check if staging env file exists
if [ ! -f ".env.staging" ]; then
    echo -e "${YELLOW}⚠️  .env.staging not found, copying from example...${NC}"
    cp env.staging.example .env.staging
fi

# Build with staging mode
echo "Building with staging configuration..."
npm run build:staging

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

print_status 0 "Frontend build complete"

# Deploy frontend to Vercel staging
echo ""
echo "🌐 Deploying Frontend to Vercel Staging..."

vercel --prod

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend deployment failed${NC}"
    exit 1
fi

print_status 0 "Frontend deployed to staging"

cd ..

echo ""
echo "🔧 Preparing Backend for Staging..."

# Check if staging env file exists
cd backend

if [ ! -f ".env.staging" ]; then
    echo -e "${YELLOW}⚠️  .env.staging not found, copying from example...${NC}"
    cp env.staging.example .env.staging
fi

# Validate staging configuration
echo "Validating staging configuration..."
if ! grep -q "NODE_ENV=staging" .env.staging; then
    echo -e "${RED}❌ Invalid staging configuration${NC}"
    exit 1
fi

print_status 0 "Backend staging configuration validated"

# Deploy backend to Railway staging
echo ""
echo "🚂 Deploying Backend to Railway Staging..."

railway up --environment staging

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend deployment failed${NC}"
    exit 1
fi

print_status 0 "Backend deployed to staging"

cd ..

echo ""
echo "🧪 Running Staging Health Checks..."

# Wait for deployment to complete
echo "Waiting for services to be ready..."
sleep 30

# Test staging endpoints
echo "Testing staging endpoints..."

# Test backend health
BACKEND_HEALTH=$(curl -s https://novara-staging.up.railway.app/api/health)
if [[ $BACKEND_HEALTH == *"staging"* ]]; then
    print_status 0 "Backend health check passed"
else
    print_status 1 "Backend health check failed"
    echo "Response: $BACKEND_HEALTH"
fi

# Test frontend (basic connectivity)
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://novara-mvp-staging.vercel.app)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    print_status 0 "Frontend connectivity check passed"
else
    print_status 1 "Frontend connectivity check failed (HTTP $FRONTEND_RESPONSE)"
fi

echo ""
echo "🎉 Staging Deployment Complete!"
echo "==============================="
echo ""
echo "🔗 Staging URLs:"
echo "   Frontend: https://novara-mvp-staging.vercel.app"
echo "   Backend:  https://novara-staging.up.railway.app"
echo "   Health:   https://novara-staging.up.railway.app/api/health"
echo ""
echo "📊 Next Steps:"
echo "   1. Test the staging environment"
echo "   2. Verify all features work correctly"
echo "   3. Run integration tests"
echo "   4. Deploy to production when ready"
echo ""
echo "🔄 To deploy to production:"
echo "   ./scripts/deploy-production.sh" 