#!/bin/bash

# Quick slider test script - opens all relevant pages for testing

echo "🎯 Opening Slider Test Pages..."
echo "================================"

# Get the frontend URL
FRONTEND_URL="http://localhost:4200"

# Check if frontend is running
if curl -s "$FRONTEND_URL" > /dev/null; then
    echo "✅ Frontend is running at $FRONTEND_URL"
else
    echo "❌ Frontend not detected at $FRONTEND_URL"
    echo "Please ensure local environment is running: ./scripts/start-local.sh"
    exit 1
fi

echo ""
echo "📋 Test Instructions:"
echo "1. Test onboarding sliders:"
echo "   - Click 'Logout' if logged in"
echo "   - Start signup flow"
echo "   - Test all 3 confidence sliders"
echo ""
echo "2. Test check-in sliders:"
echo "   - Login with existing account or complete signup"
echo "   - Test Quick Daily Check-in confidence slider"
echo "   - Test Enhanced Daily Check-in sliders"
echo ""
echo "3. Look for:"
echo "   ✓ Centered handles on track"
echo "   ✓ No cross-line artifacts"
echo "   ✓ Smooth drag interaction"
echo "   ✓ Linear 1-10 scale (5 at 50%, not centered)"
echo ""

# Open frontend in default browser
echo "🌐 Opening frontend in browser..."
open "$FRONTEND_URL" 2>/dev/null || xdg-open "$FRONTEND_URL" 2>/dev/null || echo "Please open $FRONTEND_URL in your browser"

echo ""
echo "📊 Test checklist available at:"
echo "   ./scripts/test-slider-visual-fixes.md"
echo ""
echo "✨ Happy testing!"