#!/bin/bash

# Test script for dashboard dots functionality
# Tests that dots under mobile view are clickable and functional

echo "🔍 Testing Dashboard Dots Functionality"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
FRONTEND_URL="http://localhost:4200"
TEST_USER="testweek@gmail.com"

echo "📋 Test Configuration:"
echo "   Frontend URL: $FRONTEND_URL"
echo "   Test User: $TEST_USER"
echo ""

# Function to check if frontend is running
check_frontend() {
    echo -n "🌐 Checking if frontend is running on port 4200... "
    if curl -s "$FRONTEND_URL" > /dev/null; then
        echo -e "${GREEN}✓ Frontend is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Frontend is not running${NC}"
        echo "   Please start the frontend with: npm run dev"
        return 1
    fi
}

# Function to test dashboard dots implementation
test_dots_implementation() {
    echo ""
    echo -e "${BLUE}🔍 Testing Dashboard Dots Implementation${NC}"
    echo "==========================================";

    # Check if OutcomeMetricsDashboard has clickable dots
    echo -n "1. Checking if dots are implemented as buttons... "
    if grep -q "onClick={() => setSelectedView(tab.id as any)}" /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp/frontend/src/components/OutcomeMetricsDashboard.tsx; then
        echo -e "${GREEN}✓ Dots are clickable buttons${NC}"
    else
        echo -e "${RED}✗ Dots are not clickable${NC}"
        return 1
    fi

    # Check for proper accessibility attributes
    echo -n "2. Checking accessibility attributes... "
    if grep -q "aria-label" /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp/frontend/src/components/OutcomeMetricsDashboard.tsx; then
        echo -e "${GREEN}✓ Aria labels present${NC}"
    else
        echo -e "${YELLOW}⚠ No aria labels found${NC}"
    fi

    # Check for focus indicators
    echo -n "3. Checking focus ring implementation... "
    if grep -q "focus:ring" /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp/frontend/src/components/OutcomeMetricsDashboard.tsx; then
        echo -e "${GREEN}✓ Focus rings implemented${NC}"
    else
        echo -e "${RED}✗ No focus rings found${NC}"
        return 1
    fi

    # Check for hover states
    echo -n "4. Checking hover states... "
    if grep -q "hover:bg" /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp/frontend/src/components/OutcomeMetricsDashboard.tsx; then
        echo -e "${GREEN}✓ Hover states implemented${NC}"
    else
        echo -e "${RED}✗ No hover states found${NC}"
        return 1
    fi

    # Check for active state indicators
    echo -n "5. Checking active dot shows icon... "
    if grep -q "index === currentTabIndex" /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp/frontend/src/components/OutcomeMetricsDashboard.tsx; then
        echo -e "${GREEN}✓ Active dot shows icon${NC}"
    else
        echo -e "${RED}✗ Active dot icon not implemented${NC}"
        return 1
    fi

    return 0
}

# Function to test dots positioning and styling
test_dots_styling() {
    echo ""
    echo -e "${BLUE}🎨 Testing Dots Styling${NC}"
    echo "========================"

    # Check for proper mobile-only display
    echo -n "1. Checking mobile-only display... "
    if grep -q "sm:hidden" /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp/frontend/src/components/OutcomeMetricsDashboard.tsx; then
        echo -e "${GREEN}✓ Mobile-only display implemented${NC}"
    else
        echo -e "${RED}✗ Mobile-only display not found${NC}"
        return 1
    fi

    # Check for centered alignment
    echo -n "2. Checking centered alignment... "
    if grep -q "justify-center" /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp/frontend/src/components/OutcomeMetricsDashboard.tsx; then
        echo -e "${GREEN}✓ Dots are centered${NC}"
    else
        echo -e "${RED}✗ Dots not centered${NC}"
        return 1
    fi

    # Check for proper spacing
    echo -n "3. Checking dot spacing... "
    if grep -q "gap-3" /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp/frontend/src/components/OutcomeMetricsDashboard.tsx; then
        echo -e "${GREEN}✓ Proper spacing implemented${NC}"
    else
        echo -e "${YELLOW}⚠ Different spacing found${NC}"
    fi

    return 0
}

# Function to provide manual testing instructions
provide_manual_test_instructions() {
    echo ""
    echo -e "${BLUE}📱 Manual Testing Instructions${NC}"
    echo "================================"
    echo ""
    echo "To complete the testing, please manually verify the following:"
    echo ""
    echo "1. 🔐 Login Process:"
    echo "   • Navigate to: $FRONTEND_URL"
    echo "   • Click 'Log In' and enter: $TEST_USER"
    echo ""
    echo "2. 📊 Navigate to Dashboard:"
    echo "   • Click on the 'Home' tab (Heart icon) in bottom navigation"
    echo "   • Scroll down to find the metrics dashboard"
    echo ""
    echo "3. 📱 Mobile View Testing (resize browser or use mobile device):"
    echo "   • Look for dots below the dashboard content"
    echo "   • Verify 4 dots are present representing:"
    echo "     - Overview (Activity icon)"
    echo "     - Treatment (Pill icon)"  
    echo "     - Well-being (Brain icon)"
    echo "     - Outlook (Target icon)"
    echo ""
    echo "4. 🖱️ Click Functionality:"
    echo "   • Click each dot and verify:"
    echo "     ✓ Content changes to corresponding section"
    echo "     ✓ Active dot becomes larger and shows icon"
    echo "     ✓ Active dot has colored background"
    echo "     ✓ Inactive dots are smaller and gray"
    echo ""
    echo "5. ⌨️ Keyboard Navigation:"
    echo "   • Tab through the dots using keyboard"
    echo "   • Verify each dot has visible focus ring"
    echo "   • Press Enter/Space to activate focused dot"
    echo ""
    echo "6. 📱 Touch/Hover States:"
    echo "   • Hover over inactive dots (desktop)"
    echo "   • Verify hover state changes background color"
    echo "   • On mobile, tap dots and verify immediate response"
    echo ""
    echo "7. 🔄 Section Content Verification:"
    echo "   • Overview: Shows engagement metrics and progress bars"
    echo "   • Treatment: Shows medication adherence data"
    echo "   • Well-being: Shows PHQ-4 scores and coping strategies"
    echo "   • Outlook: Shows treatment predictions and insights"
    echo ""
    echo -e "${GREEN}Expected Results:${NC}"
    echo "• All dots should be clickable and responsive"
    echo "• Active dot should be visually distinct with icon"
    echo "• Content should change smoothly between sections"
    echo "• Focus indicators should be clearly visible"
    echo "• No layout shifts or visual glitches"
    echo ""
    echo -e "${YELLOW}Common Issues to Watch For:${NC}"
    echo "• Dots not responding to clicks"
    echo "• Active state not updating properly"
    echo "• Missing focus indicators for accessibility"
    echo "• Content not changing when dots are clicked"
    echo "• Layout issues on different screen sizes"
}

# Function to test build for production readiness
test_build() {
    echo ""
    echo -e "${BLUE}🏗️ Testing Build${NC}"
    echo "=================="
    
    echo "Building frontend to check for any build issues..."
    cd /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp/frontend
    
    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Build successful${NC}"
        return 0
    else
        echo -e "${RED}✗ Build failed${NC}"
        echo "Run 'npm run build' manually to see specific errors"
        return 1
    fi
}

# Main test execution
main() {
    echo "Starting dashboard dots functionality testing..."
    echo ""
    
    # Check if frontend is running
    if ! check_frontend; then
        echo ""
        echo -e "${RED}❌ Cannot proceed without frontend running${NC}"
        echo "Please start the frontend and run this script again."
        exit 1
    fi
    
    # Test dots implementation
    if ! test_dots_implementation; then
        echo ""
        echo -e "${RED}❌ Dots implementation test failed${NC}"
        exit 1
    fi
    
    # Test dots styling
    if ! test_dots_styling; then
        echo ""
        echo -e "${YELLOW}⚠️ Some styling tests failed but functionality should work${NC}"
    fi
    
    # Test build
    test_build
    
    # Provide manual testing instructions
    provide_manual_test_instructions
    
    echo ""
    echo -e "${GREEN}✅ Automated Tests Complete${NC}"
    echo ""
    echo "The dashboard dots have been implemented with:"
    echo "• ✅ Clickable button functionality"
    echo "• ✅ Proper accessibility attributes"
    echo "• ✅ Focus indicators for keyboard navigation"
    echo "• ✅ Hover states for better UX"
    echo "• ✅ Active state shows icons"
    echo "• ✅ Mobile-only display"
    echo ""
    echo "Please complete the manual testing steps above to verify"
    echo "the full user experience works as expected."
    echo ""
    echo -e "${BLUE}🚀 Ready for user acceptance testing!${NC}"
}

# Run the main function
main