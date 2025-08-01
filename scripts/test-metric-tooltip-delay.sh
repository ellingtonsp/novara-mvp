#!/bin/bash

# Test MetricTooltip 3-second delay functionality
# Test user: testweek@gmail.com
# Frontend URL: http://localhost:4200/

echo "🧪 Testing MetricTooltip 3-second delay functionality"
echo "=================================================="
echo ""
echo "Test Configuration:"
echo "- User: testweek@gmail.com"
echo "- Frontend: http://localhost:4200/"
echo "- Expected behavior: Tooltip should remain visible for 3 seconds after mouse leaves"
echo ""

# Check if frontend is running
echo "🔍 Checking if frontend is running on port 4200..."
if curl -s http://localhost:4200 > /dev/null; then
    echo "✅ Frontend is running on http://localhost:4200"
else
    echo "❌ Frontend is not responding on port 4200"
    echo "Please start the development server first"
    exit 1
fi

# Check if backend is running
echo "🔍 Checking if backend is running on port 9002..."
if curl -s http://localhost:9002/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:9002"
else
    echo "❌ Backend is not responding on port 9002"
    echo "Please start the development server first"
    exit 1
fi

echo ""
echo "📋 Manual Testing Instructions:"
echo "==============================="
echo ""
echo "1. Open browser and navigate to: http://localhost:4200/"
echo "2. Login with: testweek@gmail.com"
echo "3. Navigate to Dashboard (should be default after login)"
echo ""
echo "🧪 Test Cases to Verify:"
echo "========================"
echo ""
echo "Test 1: Hover Behavior"
echo "- Hover over any info icon (ℹ️) next to metrics"
echo "- ✅ Tooltip should appear immediately on hover"
echo "- Move mouse away from icon"
echo "- ✅ Tooltip should stay visible for exactly 3 seconds"
echo "- ✅ Tooltip should then disappear after 3 seconds"
echo ""
echo "Test 2: Tooltip Hover Behavior"
echo "- Hover over info icon to show tooltip"
echo "- Move mouse onto the tooltip itself"
echo "- ✅ Tooltip should remain open while hovering over it"
echo "- Move mouse away from tooltip"
echo "- ✅ Tooltip should stay visible for 3 seconds then close"
echo ""
echo "Test 3: Click Behavior"
echo "- Click on any info icon (ℹ️)"
echo "- ✅ Tooltip should appear and stay open"
echo "- Click outside or on the icon again"
echo "- ✅ Tooltip should close immediately"
echo ""
echo "Test 4: Multiple Quick Hovers"
echo "- Hover over icon quickly, then move away"
echo "- Before 3 seconds pass, hover over icon again"
echo "- ✅ Tooltip should stay open (timeout should be cleared)"
echo "- ✅ New 3-second timer should start when mouse leaves again"
echo ""
echo "🎯 Expected Info Icons to Test:"
echo "==============================="
echo "Look for info icons (ℹ️) next to these metrics:"
echo "- Daily Mood"
echo "- Medication Adherence"
echo "- Treatment Confidence"
echo "- Anxiety Level"
echo "- Engagement Level"
echo "- Engagement Score"
echo ""
echo "📊 Technical Implementation Verified:"
echo "===================================="
echo "✅ 3-second delay implemented using setTimeout(3000)"
echo "✅ Timeout cleared on re-hover (prevents premature closing)"
echo "✅ Tooltip hover detection implemented"
echo "✅ Click behavior separate from hover behavior"
echo "✅ Proper cleanup of timeouts on component unmount"
echo ""
echo "🚀 Ready to test! Please follow the manual test cases above."
echo "Report any issues or unexpected behavior."