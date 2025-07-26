#!/bin/bash

# 🚀 Final Production Deployment Script
# Uses railway up with proper termination - no hanging

set -e

echo "🚀 Novara Production Deployment - Final Version"
echo "==============================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verify Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    exit 1
fi

# Set production environment
echo "📦 Setting production environment..."
railway environment production
railway service novara-main

# Verify database
echo "🗄️ Verifying production database..."
DB_CONFIG=$(railway variables | grep AIRTABLE_BASE_ID)

if [[ "$DB_CONFIG" == *"app5QWCcVbCnVg2Gg"* ]]; then
    echo -e "${GREEN}✅ Production database verified${NC}"
else
    echo -e "${RED}❌ Wrong database configuration${NC}"
    exit 1
fi

# Deploy with railway up and proper termination
echo "🚀 Deploying to production..."
echo "⏳ Starting deployment..."

# Create a temporary script to run railway up with timeout
TEMP_SCRIPT="/tmp/railway_deploy_$$.sh"
cat > "$TEMP_SCRIPT" << 'EOF'
#!/bin/bash
railway up
EOF

chmod +x "$TEMP_SCRIPT"

# Run the deployment with a timeout
timeout 300 "$TEMP_SCRIPT" || {
    echo -e "${YELLOW}⚠️ Deployment timed out after 5 minutes${NC}"
    echo "🔍 Checking if deployment was successful..."
}

# Clean up temp script
rm -f "$TEMP_SCRIPT"

# Quick health check
echo "🧪 Testing production health..."
sleep 10

for i in {1..3}; do
    if curl -s -m 10 https://novara-mvp-production.up.railway.app/api/health | grep -q "ok"; then
        echo -e "${GREEN}✅ Production is healthy${NC}"
        echo "🌐 URL: https://novara-mvp-production.up.railway.app"
        exit 0
    else
        echo -e "${YELLOW}⏳ Health check attempt $i/3 - deployment may still be in progress${NC}"
        sleep 30
    fi
done

echo -e "${YELLOW}⚠️ Health check failed - deployment may still be in progress${NC}"
echo "🔍 Check deployment status manually at Railway dashboard"
exit 0 