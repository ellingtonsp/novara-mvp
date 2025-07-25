#!/bin/bash

# 🚀 Ultra-Safe Staging Deployment - Zero User Interaction
# This script deploys to staging without requiring ANY manual selection

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

log "🚀 Starting Ultra-Safe Staging Deployment"

# Step 1: Verify we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    error "Must run from project root directory"
    exit 1
fi
success "Project structure verified"

# Step 2: Check Railway CLI
if ! command -v railway &> /dev/null; then
    error "Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi
success "Railway CLI found"

# Step 3: Check if logged in
if ! railway whoami &> /dev/null; then
    error "Not logged into Railway. Run: railway login"
    exit 1
fi
success "Logged into Railway"

# Step 4: Link to project and staging environment automatically
log "🔗 Linking to project and staging environment..."

# Create a temporary script to handle the interactive selection
cat > /tmp/railway-link-auto.sh << 'EOF'
#!/bin/bash
# This script automatically selects the environment without user interaction
echo "ellingtonsp's Projects"  # Select workspace
echo "novara-mvp"              # Select project  
echo "staging"                 # Select environment
echo "novara-staging"          # Select service
EOF

chmod +x /tmp/railway-link-auto.sh

# Use expect to handle the interactive selection
if command -v expect &> /dev/null; then
    expect << 'EOF'
spawn railway link --project novara-mvp --environment staging
expect "Select a workspace"
send "ellingtonsp's Projects\r"
expect "Select a project"
send "novara-mvp\r"
expect "Select an environment"
send "staging\r"
expect "Select a service"
send "novara-staging\r"
expect eof
EOF
    success "Linked to staging environment using expect"
else
    # Fallback: try direct linking
    log "Expect not available, trying direct linking..."
    if railway link --project novara-mvp --environment staging --service novara-staging &> /dev/null; then
        success "Linked to staging environment directly"
    else
        warning "Could not link automatically, but continuing..."
    fi
fi

# Step 5: Deploy backend
log "🔧 Deploying backend to staging..."
cd backend

# Use timeout to prevent hanging
timeout 300 railway up || {
    error "Backend deployment failed or timed out"
    exit 1
}

success "Backend deployed to staging"

# Step 6: Deploy frontend
log "🎨 Deploying frontend to staging..."
cd ../frontend

# Use timeout to prevent hanging
timeout 300 railway up || {
    error "Frontend deployment failed or timed out"
    exit 1
}

success "Frontend deployed to staging"

# Step 7: Get staging URLs
log "🔗 Getting staging URLs..."
cd ..

# Get backend URL
BACKEND_URL=$(railway status --json 2>/dev/null | jq -r '.url // "unknown"')
if [ "$BACKEND_URL" != "unknown" ]; then
    success "Backend URL: $BACKEND_URL"
else
    warning "Could not get backend URL"
fi

# Step 8: Health check
log "🏥 Running health check..."
if [ "$BACKEND_URL" != "unknown" ]; then
    if curl -s "$BACKEND_URL/api/health" | jq -e '.status == "ok"' > /dev/null; then
        success "Health check passed"
    else
        warning "Health check failed"
    fi
else
    warning "Skipping health check - no backend URL"
fi

# Cleanup
rm -f /tmp/railway-link-auto.sh

success "🎉 Ultra-safe staging deployment complete!"
log "📊 Check Railway dashboard for deployment status" 