#!/bin/bash

# ON-01 UAT Retest Script (After CORS Fix)
# Verifies the baseline completion fix works in browser

set -e

echo "🧪 ON-01 UAT RETEST (After CORS Fix)"
echo "===================================="
echo "This script helps verify the baseline completion fix"
echo ""

# Check if backend is running
echo "🔍 Checking backend status..."
if ! curl -s http://localhost:9002/api/health > /dev/null; then
    echo "❌ Backend not running on port 9002"
    echo "Please start the backend first:"
    echo "  cd backend && NODE_ENV=development USE_LOCAL_DATABASE=true PORT=9002 node server.js"
    exit 1
fi
echo "✅ Backend is running"

# Check if frontend is running
echo "🔍 Checking frontend status..."
if ! curl -s http://localhost:4200 > /dev/null; then
    echo "❌ Frontend not running on port 4200"
    echo "Please start the frontend first:"
    echo "  cd frontend && npm run dev"
    exit 1
fi
echo "✅ Frontend is running"

# Test CORS fix
echo "🔍 Testing CORS fix..."
CORS_TEST=$(curl -s -X OPTIONS http://localhost:9002/api/users/baseline \
  -H "Origin: http://localhost:4200" \
  -H "Access-Control-Request-Method: PATCH" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -w "%{http_code}" -o /dev/null)

if [ "$CORS_TEST" = "204" ]; then
    echo "✅ CORS fix verified - PATCH method allowed"
else
    echo "❌ CORS fix failed - PATCH method not allowed"
    exit 1
fi

echo ""
echo "🎯 UAT RETEST INSTRUCTIONS"
echo "=========================="
echo ""
echo "The CORS fix has been applied and verified. Now test in browser:"
echo ""
echo "1. 🌐 Open browser and navigate to http://localhost:4200"
echo ""
echo "2. ⚡ Test Fast Lane Journey:"
echo "   - Set VITE_FORCE_ONBOARDING_PATH=test in frontend .env"
echo "   - Complete Fast Lane form (3 fields)"
echo "   - Complete Baseline Panel"
echo "   - Verify insights are accessible"
echo ""
echo "3. 🔄 Test Control Path Journey:"
echo "   - Set VITE_FORCE_ONBOARDING_PATH=control in frontend .env"
echo "   - Complete full onboarding form"
echo "   - Verify no baseline panel appears"
echo "   - Verify insights accessible immediately"
echo ""
echo "4. 🚫 Test Insights Blocking:"
echo "   - Create incomplete test user (Fast Lane only, no baseline)"
echo "   - Try to access insights"
echo "   - Verify blocking message appears"
echo ""
echo "5. 📊 Test A/B Distribution:"
echo "   - Open 10 incognito browser sessions"
echo "   - Navigate to http://localhost:4200"
echo "   - Record Fast Lane vs Control distribution"
echo "   - Should be roughly 50/50 (40-60% range)"
echo ""
echo "🎯 EXPECTED RESULTS:"
echo "==================="
echo "✅ No CORS errors in browser console"
echo "✅ Baseline completion works without errors"
echo "✅ Users can access insights after completion"
echo "✅ A/B distribution is balanced"
echo "✅ No console errors or data corruption"
echo ""
echo "📝 If any issues occur:"
echo "======================"
echo "1. Check browser console for errors"
echo "2. Verify backend is running on port 9002"
echo "3. Check frontend .env configuration"
echo "4. Run: node test-ON-01-uat-baseline-fix.js"
echo ""
echo "🚀 Ready for UAT retesting!"
echo "Open http://localhost:4200 in your browser to start." 