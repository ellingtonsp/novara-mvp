#!/bin/bash

# Test Enhanced Daily Check-in Form Bug Fixes
# BUG-006: Missed doses prepopulate zero
# BUG-007: Medication button color inconsistency

echo "=========================================="
echo "🧪 Testing Enhanced Daily Check-in Form Fixes"
echo "=========================================="
echo

# Configuration
FRONTEND_URL="http://localhost:4200"
TEST_USER="testweek@gmail.com"
TEST_PASSWORD="password123"

echo "🔧 Test Configuration:"
echo "   Frontend URL: $FRONTEND_URL"
echo "   Test User: $TEST_USER"
echo "   Target: Enhanced Daily Check-in Form"
echo

# Verify services are running
echo "🔍 Checking if services are running..."

# Check frontend
if ! curl -s "$FRONTEND_URL" > /dev/null; then
    echo "❌ Frontend not running at $FRONTEND_URL"
    echo "   Run: ./scripts/start-local.sh"
    exit 1
fi
echo "✅ Frontend running at $FRONTEND_URL"

# Check backend
if ! curl -s "http://localhost:9002/api/health" > /dev/null; then
    echo "❌ Backend not running at http://localhost:9002"
    echo "   Run: ./scripts/start-local.sh"
    exit 1
fi
echo "✅ Backend running at http://localhost:9002"

echo
echo "=========================================="
echo "🎯 MANUAL TESTING INSTRUCTIONS"
echo "=========================================="
echo
echo "Please perform the following tests manually in your browser:"
echo
echo "1. 🌐 Navigate to: $FRONTEND_URL"
echo "2. 🔑 Login with: $TEST_USER / $TEST_PASSWORD"
echo "3. 📱 Navigate to Enhanced Daily Check-in form"
echo

echo "🐛 BUG-006: Missed Doses Prepopulate Zero"
echo "   Expected Behavior:"
echo "   ✅ When selecting 'Missed some', input field should be EMPTY"
echo "   ✅ Field should show placeholder 'Enter number'"
echo "   ✅ When switching back to 'Yes, all doses', missed doses should reset to empty"
echo "   ✅ useState should initialize missedDoses to empty string ''"
echo
echo "   Test Steps:"
echo "   1. Go to Step 2 (Medication & Side Effects)"
echo "   2. Click 'Missed some' button"
echo "   3. Check input field is empty (not showing 0)"
echo "   4. Check placeholder text says 'Enter number'"
echo "   5. Enter a number (e.g., 2)"
echo "   6. Click 'Yes, all doses' button"
echo "   7. Click 'Missed some' again - field should be empty"
echo

echo "🐛 BUG-007: Medication Button Color Inconsistency"
echo "   Expected Behavior:"
echo "   ✅ 'Yes, all doses' button should have ✅ icon"
echo "   ✅ 'Missed some' button should have ⚠️ icon"
echo "   ✅ Both buttons should have 'h-auto py-3' styling"
echo "   ✅ Visual appearance should match QuickDailyCheckinForm"
echo
echo "   Test Steps:"
echo "   1. Go to Step 2 (Medication & Side Effects)"
echo "   2. Verify 'Yes, all doses' button has ✅ icon and proper styling"
echo "   3. Verify 'Missed some' button has ⚠️ icon and proper styling"
echo "   4. Compare with Quick Daily Check-in buttons for consistency"
echo

echo "📋 Additional Verification:"
echo "   • Form should scroll to top when navigating between steps"
echo "   • All sliders should use UnifiedSlider component"
echo "   • Data should save properly to backend"
echo

echo "=========================================="
echo "🔍 CODE VERIFICATION"
echo "=========================================="
echo

echo "📂 Checking EnhancedDailyCheckinForm.tsx implementation..."

# Check for correct missedDoses initialization
if grep -q "const \[missedDoses, setMissedDoses\] = useState<number | ''>('');" /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp/frontend/src/components/EnhancedDailyCheckinForm.tsx; then
    echo "✅ missedDoses correctly initialized to empty string"
else
    echo "❌ missedDoses not properly initialized"
fi

# Check for correct button styling and icons
if grep -q 'className="flex-1 h-auto py-3"' /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp/frontend/src/components/EnhancedDailyCheckinForm.tsx; then
    echo "✅ Buttons have correct h-auto py-3 styling"
else
    echo "❌ Button styling missing h-auto py-3"
fi

if grep -q '<span className="text-lg mr-2">✅</span>' /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp/frontend/src/components/EnhancedDailyCheckinForm.tsx; then
    echo "✅ 'Yes, all doses' button has ✅ icon"
else
    echo "❌ 'Yes, all doses' button missing ✅ icon"
fi

if grep -q '<span className="text-lg mr-2">⚠️</span>' /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp/frontend/src/components/EnhancedDailyCheckinForm.tsx; then
    echo "✅ 'Missed some' button has ⚠️ icon"
else
    echo "❌ 'Missed some' button missing ⚠️ icon"
fi

# Check for correct reset behavior
if grep -q 'setMissedDoses(\x27\x27);' /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp/frontend/src/components/EnhancedDailyCheckinForm.tsx; then
    echo "✅ missedDoses resets to empty string when selecting 'Yes, all doses'"
else
    echo "❌ missedDoses reset behavior not implemented"
fi

# Check for correct placeholder
if grep -q 'placeholder="Enter number"' /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp/frontend/src/components/EnhancedDailyCheckinForm.tsx; then
    echo "✅ Input field has correct placeholder"
else
    echo "❌ Input field missing correct placeholder"
fi

echo
echo "=========================================="
echo "🚀 TESTING SUMMARY"
echo "=========================================="
echo
echo "✅ Services are running and ready for testing"
echo "📋 Manual testing instructions provided above"
echo "🔍 Code verification completed"
echo
echo "Please complete the manual testing steps and confirm:"
echo "1. BUG-006: Missed doses field behavior is correct"
echo "2. BUG-007: Medication buttons have proper styling and icons"
echo
echo "If any issues are found, please report them for further investigation."
echo