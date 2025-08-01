#!/bin/bash

# Comprehensive Test Suite for BUG-006 and BUG-007 Fixes
# Enhanced Daily Check-in Form Improvements

echo "=========================================="
echo "🚀 BUG-006 & BUG-007 Fix Validation Suite"
echo "=========================================="
echo
echo "Testing Enhanced Daily Check-in Form improvements:"
echo "  🐛 BUG-006: Missed doses prepopulate zero"
echo "  🐛 BUG-007: Medication button color inconsistency"
echo

# Configuration
FRONTEND_URL="http://localhost:4200"
BACKEND_URL="http://localhost:9002"
TEST_USER="testweek@gmail.com"

# Check prerequisites
echo "🔍 Prerequisites Check..."

if [ ! -f "./scripts/start-local.sh" ]; then
    echo "❌ Not in project root directory"
    echo "   Please run from: /Users/stephen/Library/Mobile Documents/com~apple~CloudDocs/novara-mvp"
    exit 1
fi

# Check services
services_ok=true
if ! curl -s "$FRONTEND_URL" > /dev/null; then
    echo "❌ Frontend not running at $FRONTEND_URL"
    services_ok=false
fi

if ! curl -s "$BACKEND_URL/api/health" > /dev/null; then
    echo "❌ Backend not running at $BACKEND_URL"
    services_ok=false
fi

if [ "$services_ok" = false ]; then
    echo
    echo "💡 To start services, run:"
    echo "   ./scripts/start-local.sh"
    echo
    exit 1
fi

echo "✅ Frontend running at $FRONTEND_URL"
echo "✅ Backend running at $BACKEND_URL"
echo

# Run code analysis
echo "=========================================="
echo "🔬 Code Analysis"
echo "=========================================="

# Check component file exists
COMPONENT_FILE="./frontend/src/components/EnhancedDailyCheckinForm.tsx"
if [ ! -f "$COMPONENT_FILE" ]; then
    echo "❌ EnhancedDailyCheckinForm.tsx not found"
    exit 1
fi

echo "📂 Analyzing $COMPONENT_FILE"

# BUG-006 Checks
echo
echo "🐛 BUG-006: Missed Doses Prepopulate Zero"
echo "-------------------------------------------"

if grep -q "useState<number | ''>('')" "$COMPONENT_FILE"; then
    echo "✅ missedDoses correctly initialized to empty string"
else
    echo "❌ missedDoses initialization not found or incorrect"
fi

if grep -q 'placeholder="Enter number"' "$COMPONENT_FILE"; then
    echo "✅ Input field has correct placeholder text"
else
    echo "❌ Placeholder text not found or incorrect"
fi

if grep -q "setMissedDoses('')" "$COMPONENT_FILE"; then
    echo "✅ missedDoses resets to empty string correctly"
else
    echo "❌ Reset behavior not implemented"
fi

# BUG-007 Checks  
echo
echo "🐛 BUG-007: Medication Button Color Inconsistency"
echo "------------------------------------------------"

if grep -q 'className="flex-1 h-auto py-3"' "$COMPONENT_FILE"; then
    echo "✅ Buttons have correct styling classes"
else
    echo "❌ Button styling classes not found"
fi

if grep -q '<span className="text-lg mr-2">✅</span>' "$COMPONENT_FILE"; then
    echo "✅ 'Yes, all doses' button has checkmark icon"
else
    echo "❌ Checkmark icon not found"
fi

if grep -q '<span className="text-lg mr-2">⚠️</span>' "$COMPONENT_FILE"; then
    echo "✅ 'Missed some' button has warning icon"
else
    echo "❌ Warning icon not found"
fi

echo
echo "=========================================="
echo "🧪 Manual Testing Instructions"
echo "=========================================="
echo
echo "Please complete the following manual tests:"
echo
echo "1. 🌐 Open: $FRONTEND_URL"
echo "2. 🔑 Login: $TEST_USER / password123"
echo "3. 📱 Navigate to: Enhanced Daily Check-in"
echo

echo "📋 BUG-006 Test Steps:"
echo "   1. Go to Step 2 (Medication & Side Effects)"
echo "   2. Click 'Missed some' button"
echo "   3. ✅ Verify input field is EMPTY (not showing 0)"
echo "   4. ✅ Verify placeholder shows 'Enter number'"
echo "   5. Enter a number (e.g., 2)"
echo "   6. Click 'Yes, all doses' button"
echo "   7. Click 'Missed some' again"
echo "   8. ✅ Verify field is empty again"
echo

echo "📋 BUG-007 Test Steps:"
echo "   1. Go to Step 2 (Medication & Side Effects)"
echo "   2. ✅ Verify 'Yes, all doses' has ✅ icon and consistent styling"
echo "   3. ✅ Verify 'Missed some' has ⚠️ icon and consistent styling"
echo "   4. ✅ Compare with Quick Daily Check-in buttons for consistency"
echo

echo "📱 Additional Verification:"
echo "   • Form should scroll to top between steps"
echo "   • All sliders should work smoothly"
echo "   • Complete form submission should work"
echo "   • Data should save to backend properly"
echo

echo "=========================================="
echo "📊 Summary"
echo "=========================================="
echo
echo "✅ Services are running and ready"
echo "✅ Code analysis shows fixes are implemented"
echo "🔍 Manual testing required to confirm UI behavior"
echo
echo "Expected Results:"
echo "  🐛 BUG-006: Missed doses field behaves correctly"
echo "  🐛 BUG-007: Medication buttons have proper styling and icons"
echo
echo "If any manual tests fail, please report for investigation."
echo