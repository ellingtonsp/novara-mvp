#!/bin/bash

# Fix PostHog Development Configuration
# This script helps enable PostHog tracking in development mode

echo "🔧 Fixing PostHog Development Configuration..."

# Check if we're in the right directory
if [ ! -f "frontend/.env.development" ]; then
    echo "❌ Error: frontend/.env.development not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "📝 Current .env.development configuration:"
echo "----------------------------------------"
cat frontend/.env.development
echo "----------------------------------------"

echo ""
echo "🔧 To enable PostHog tracking in development, you need to:"
echo ""
echo "1. Edit frontend/.env.development"
echo "2. Change VITE_ENABLE_ANALYTICS=false to VITE_ENABLE_ANALYTICS=true"
echo ""
echo "3. Verify VITE_POSTHOG_API_KEY is set correctly"
echo "   Current key: $(grep VITE_POSTHOG_API_KEY frontend/.env.development | cut -d'=' -f2)"
echo ""

# Check if analytics is enabled
if grep -q "VITE_ENABLE_ANALYTICS=false" frontend/.env.development; then
    echo "⚠️  VITE_ENABLE_ANALYTICS is currently set to false"
    echo "   This prevents PostHog events from being sent in development"
    echo ""
    echo "💡 To fix this, run:"
    echo "   sed -i '' 's/VITE_ENABLE_ANALYTICS=false/VITE_ENABLE_ANALYTICS=true/' frontend/.env.development"
    echo ""
    echo "   Or manually edit frontend/.env.development and change:"
    echo "   VITE_ENABLE_ANALYTICS=false → VITE_ENABLE_ANALYTICS=true"
else
    echo "✅ VITE_ENABLE_ANALYTICS is already enabled"
fi

echo ""
echo "🧪 To test PostHog events:"
echo "1. Restart your development server"
echo "2. Open browser console"
echo "3. Sign up a new user or submit a check-in"
echo "4. Check PostHog Live Events: https://app.posthog.com/events"
echo "5. Look for events with environment='development'"
echo ""

echo "🔍 Debugging steps:"
echo "1. Check browser console for '📊 PostHog Event:' logs"
echo "2. Verify PostHog API key is correct"
echo "3. Check PostHog project settings"
echo "4. Ensure no ad blockers are interfering"
echo ""

echo "📊 PostHog Project Info:"
echo "- Project: novara-prod"
echo "- Host: https://app.posthog.com"
echo "- API Key: phx_meqIsTyU7ePRjOoY9OakWamhNVRF6LgmOpTeH6mgNRjtgKu"
echo "" 