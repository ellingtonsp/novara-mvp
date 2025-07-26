#!/bin/bash
# Novara MVP - Production Deployment Script
# DEPRECATED: This script is deprecated. Use the new unified deployment system.
# 
# New usage:
#   ./scripts/deploy.sh production --force
#   node scripts/deploy-orchestrator.js production --force

echo "⚠️ DEPRECATED SCRIPT WARNING"
echo "============================"
echo "This script is deprecated and will be removed in a future version."
echo "Please use the new unified deployment system:"
echo ""
echo "  ./scripts/deploy.sh production --force"
echo "  OR"
echo "  node scripts/deploy-orchestrator.js production --force"
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
    exec "$(dirname "$0")/../deploy.sh" production --force
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

# Safety confirmation
echo -e "${YELLOW}⚠️  PRODUCTION DEPLOYMENT WARNING ⚠️${NC}"
echo "This will deploy to the LIVE production environment."
echo "Make sure you have:"
echo "  ✅ Tested in staging environment"
echo "  ✅ Reviewed all changes"
echo "  ✅ Backed up production data"
echo "  ✅ Notified team members"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 1
fi

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

# Pre-deployment staging test
echo ""
echo "🧪 Running pre-deployment staging test..."

STAGING_HEALTH=$(curl -s https://novara-staging.up.railway.app/api/health)
if [[ $STAGING_HEALTH == *"staging"* ]]; then
    print_status 0 "Staging environment is healthy"
else
    echo -e "${RED}❌ Staging environment is not healthy. Please fix staging first.${NC}"
    echo "Response: $STAGING_HEALTH"
    exit 1
fi

echo ""
echo "📦 Building Frontend for Production..."

# Build frontend with production configuration
cd frontend

# Check if production env file exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  .env.production not found, copying from example...${NC}"
    cp env.production.example .env.production
fi

# Build with production mode
echo "Building with production configuration..."
npm run build:production

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

print_status 0 "Frontend build complete"

# Deploy frontend to Vercel production
echo ""
echo "🌐 Deploying Frontend to Vercel Production..."

vercel --prod --env production

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend deployment failed${NC}"
    exit 1
fi

print_status 0 "Frontend deployed to production"

cd ..

echo ""
echo "🔧 Preparing Backend for Production..."

# Check if production env file exists
cd backend

if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  .env.production not found, copying from example...${NC}"
    cp env.production.example .env.production
fi

# Validate production configuration
echo "Validating production configuration..."
if ! grep -q "NODE_ENV=production" .env.production; then
    echo -e "${RED}❌ Invalid production configuration${NC}"
    exit 1
fi

print_status 0 "Backend production configuration validated"

# Deploy backend to Railway production
echo ""
echo "🚂 Deploying Backend to Railway Production..."

railway up --environment production

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend deployment failed${NC}"
    exit 1
fi

print_status 0 "Backend deployed to production"

cd ..

echo ""
echo "🧪 Running Production Health Checks..."

# Wait for deployment to complete
echo "Waiting for services to be ready..."
sleep 45

# Test production endpoints
echo "Testing production endpoints..."

# Test backend health
BACKEND_HEALTH=$(curl -s https://novara-mvp-production.up.railway.app/api/health)
if [[ $BACKEND_HEALTH == *"production"* ]]; then
    print_status 0 "Backend health check passed"
else
    print_status 1 "Backend health check failed"
    echo "Response: $BACKEND_HEALTH"
fi

# Test frontend (basic connectivity)
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://novara-mvp.vercel.app)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    print_status 0 "Frontend connectivity check passed"
else
    print_status 1 "Frontend connectivity check failed (HTTP $FRONTEND_RESPONSE)"
fi

# Test API connectivity from frontend
echo "Testing API connectivity..."
API_TEST=$(curl -s https://novara-mvp.vercel.app)
if [[ $API_TEST == *"Novara"* ]]; then
    print_status 0 "Frontend API connectivity check passed"
else
    print_status 1 "Frontend API connectivity check failed"
fi

echo ""
echo "🎉 Production Deployment Complete!"
echo "================================="
echo ""
echo "🔗 Production URLs:"
echo "   Frontend: https://novara-mvp.vercel.app"
echo "   Backend:  https://novara-mvp-production.up.railway.app"
echo "   Health:   https://novara-mvp-production.up.railway.app/api/health"
echo ""
echo "📊 Deployment Summary:"
echo "   ✅ Frontend deployed to Vercel"
echo "   ✅ Backend deployed to Railway"
echo "   ✅ Health checks passed"
echo "   ✅ API connectivity verified"
echo ""
echo "🔍 Post-Deployment Checklist:"
echo "   1. Test user registration/login"
echo "   2. Test daily check-in flow"
echo "   3. Test insights generation"
echo "   4. Monitor error logs"
echo "   5. Check analytics tracking"
echo ""
echo "📈 Monitoring:"
echo "   - Railway dashboard: https://railway.app"
echo "   - Vercel dashboard: https://vercel.com"
echo "   - Application logs: Check Railway/Vercel dashboards"
echo ""
echo "🔄 Rollback (if needed):"
echo "   ./scripts/rollback-production.sh" 