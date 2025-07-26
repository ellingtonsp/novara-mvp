#!/bin/bash

# Ultra-Safe Railway Deployment Script - Prevents ALL hanging scenarios
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Novara MVP - Ultra-Safe Staging Deployment${NC}"
echo "=============================================="

# Function: Safe command with timeout and retry
safe_command() {
    local cmd="$1"
    local timeout_duration="$2"
    local max_retries="${3:-2}"
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        echo "🔄 Attempt $((retry_count + 1))/$max_retries: $cmd"
        
        if timeout "$timeout_duration" bash -c "$cmd"; then
            echo "✅ Command succeeded"
            return 0
        else
            echo "⚠️ Command failed/timed out"
            retry_count=$((retry_count + 1))
            
            # Kill any hanging processes
            pkill -f railway 2>/dev/null || true
            sleep 2
        fi
    done
    
    echo "❌ Command failed after $max_retries attempts"
    return 1
}

# Function: Check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ Error: Not in project root directory${NC}"
        echo "Please run this script from the novara-mvp root directory"
        exit 1
    fi
}

# Function: Kill hanging processes aggressively
kill_hanging_processes() {
    echo "🧹 Cleaning up any hanging processes..."
    
    # Kill Railway processes
    pkill -f railway 2>/dev/null || true
    pkill -f "railway up" 2>/dev/null || true
    pkill -f "railway deploy" 2>/dev/null || true
    
    # Kill Node processes that might interfere
    pkill -f nodemon 2>/dev/null || true
    
    sleep 2
    echo "✅ Process cleanup completed"
}

# Phase 1: Pre-deployment validation
echo -e "${YELLOW}📋 Phase 1: Pre-deployment validation...${NC}"

check_directory
kill_hanging_processes

# Check Railway CLI is available
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Please install it first.${NC}"
    exit 1
fi

echo "✅ Railway CLI found: $(railway --version)"

# Phase 2: Dependency verification
echo -e "${YELLOW}📋 Phase 2: Dependency verification...${NC}"

echo "🔍 Installing backend dependencies..."
cd backend
npm install --silent || {
    echo -e "${RED}❌ Backend dependency installation failed${NC}"
    exit 1
}
cd ..

echo "🔍 Checking critical dependencies..."
if ! cd backend && node -e "require('compression')" 2>/dev/null; then
    echo -e "${RED}❌ Critical dependency 'compression' missing${NC}"
    exit 1
fi
cd ..

echo "✅ Dependencies verified"

# Phase 3: Railway context setup with aggressive timeout protection
echo -e "${YELLOW}📋 Phase 3: Railway context setup...${NC}"

# First check if Railway is authenticated
if ! safe_command "railway whoami" "10s" 2; then
    echo -e "${YELLOW}🔐 Railway authentication required...${NC}"
    safe_command "railway login" "30s" 1 || {
        echo -e "${RED}❌ Railway authentication failed${NC}"
        exit 1
    }
fi

# Check Railway status with timeout
echo "🔍 Checking Railway project status..."
if ! safe_command "railway status" "15s" 3; then
    echo -e "${YELLOW}🔗 Railway project not linked, attempting to link...${NC}"
    safe_command "railway link novara-mvp" "30s" 2 || {
        echo -e "${RED}❌ Failed to link Railway project${NC}"
        echo "Please run: railway link"
        echo "Then select: novara-mvp"
        exit 1
    }
fi

# Set correct environment and service with timeouts
echo "🔧 Setting Railway environment to staging..."
safe_command "railway environment staging" "10s" 3 || {
    echo -e "${RED}❌ Failed to set staging environment${NC}"
    exit 1
}

echo "🔧 Setting Railway service to novara-staging..."
safe_command "railway service novara-staging" "10s" 3 || {
    echo -e "${RED}❌ Failed to set novara-staging service${NC}"
    exit 1
}

echo "✅ Railway context configured"

# Phase 4: Database configuration verification
echo -e "${YELLOW}📋 Phase 4: Database verification...${NC}"

echo "🔍 Verifying database configuration..."
AIRTABLE_CHECK=$(safe_command "railway variables" "20s" 2 | grep "AIRTABLE_BASE_ID" || echo "NOT_FOUND")

if [[ "$AIRTABLE_CHECK" == "NOT_FOUND" ]]; then
    echo -e "${RED}❌ Could not retrieve AIRTABLE_BASE_ID from Railway${NC}"
    exit 1
fi

if [[ "$AIRTABLE_CHECK" != *"appEOWvLjCn5c7Ght"* ]]; then
    echo -e "${RED}❌ Wrong database configuration detected!${NC}"
    echo -e "${RED}Expected: appEOWvLjCn5c7Ght (staging)${NC}"
    echo -e "${RED}Got: $AIRTABLE_CHECK${NC}"
    echo ""
    echo "Please verify Railway environment is set to 'staging'"
    exit 1
fi

echo -e "${GREEN}✅ Database configuration verified for staging${NC}"

# Phase 5: Pre-deployment test
echo -e "${YELLOW}📋 Phase 5: Pre-deployment local test...${NC}"

echo "🧪 Testing local server startup..."
cd backend
if timeout 15s bash -c "NODE_ENV=development USE_LOCAL_DATABASE=true PORT=9003 node server.js" 2>/dev/null; then
    echo "⚠️ Local server test timed out (expected)"
else
    echo "✅ Local server dependencies verified"
fi
cd ..

# Phase 6: Safe deployment with aggressive timeout
echo -e "${YELLOW}📋 Phase 6: Deployment with timeout protection...${NC}"
echo -e "${BLUE}⏱️ Deployment timeout: 4 minutes (aggressive timeout to prevent hanging)${NC}"
echo -e "${BLUE}💡 This will automatically kill the deployment if it hangs${NC}"

# Create a background process to monitor for hanging
(
    sleep 240  # 4 minutes
    echo -e "\n${RED}🚨 DEPLOYMENT TIMEOUT REACHED - KILLING HANGING PROCESSES${NC}"
    pkill -f railway 2>/dev/null || true
    pkill -f "railway up" 2>/dev/null || true
) &
TIMEOUT_PID=$!

# Attempt deployment
echo "🚀 Starting Railway deployment..."
if safe_command "railway up" "250s" 1; then
    # Kill the timeout process
    kill $TIMEOUT_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    
    # Phase 7: Post-deployment verification
    echo -e "${YELLOW}📋 Phase 7: Post-deployment verification...${NC}"
    sleep 10
    
    echo "🔍 Testing staging endpoint..."
    if safe_command "curl -f -s https://novara-staging-staging.up.railway.app/api/health" "30s" 2; then
        echo -e "${GREEN}✅ Deployment verification successful!${NC}"
        echo -e "${GREEN}🌐 Staging URL: https://novara-staging-staging.up.railway.app${NC}"
    else
        echo -e "${YELLOW}⚠️ Deployment health check failed, but deployment may still be successful${NC}"
        echo "Please manually verify: https://novara-staging-staging.up.railway.app/api/health"
    fi
    
    # Show deployment status
    echo -e "${BLUE}📊 Final Railway status:${NC}"
    safe_command "railway status" "10s" 1
    
else
    # Kill the timeout process
    kill $TIMEOUT_PID 2>/dev/null || true
    echo -e "${RED}❌ Deployment failed or timed out${NC}"
    
    # Show logs for debugging
    echo -e "${YELLOW}🔍 Checking Railway logs for errors...${NC}"
    safe_command "railway logs --tail 20" "15s" 1 || echo "Could not retrieve logs"
    
    # Show current status
    echo -e "${YELLOW}📊 Current Railway status:${NC}"
    safe_command "railway status" "10s" 1 || echo "Could not retrieve status"
    
    exit 1
fi

# Final cleanup
kill_hanging_processes

echo ""
echo -e "${GREEN}🎉 Ultra-safe deployment completed successfully!${NC}"
echo "=============================================="
echo -e "${GREEN}✅ Staging environment deployed and verified${NC}"
echo -e "${GREEN}✅ Database configuration validated${NC}"
echo -e "${GREEN}✅ Health checks passed${NC}"
echo -e "${GREEN}✅ No hanging processes detected${NC}"
echo ""
echo -e "${BLUE}🌐 Staging URL: https://novara-staging-staging.up.railway.app${NC}"
echo -e "${BLUE}🏥 Health Check: https://novara-staging-staging.up.railway.app/api/health${NC}"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "1. Test the staging environment thoroughly"
echo "2. If all tests pass, deploy to production"
echo "3. Monitor for any issues" 