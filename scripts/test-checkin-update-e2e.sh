#!/bin/bash

# Check-in Update E2E Test Runner
# This script sets up the environment and runs comprehensive tests for check-in update functionality

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}🧪 Check-in Update E2E Test Suite${NC}"
echo -e "${BOLD}=====================================\n${NC}"

# Function to print colored messages
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Checking project structure..."

# Check for required directories
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Backend or frontend directory not found"
    exit 1
fi

print_success "Project structure verified"

# Check if processes are running on the required ports
print_status "Checking if services are running..."

# Check backend (port 9002)
if ! lsof -i :9002 >/dev/null 2>&1; then
    print_warning "Backend not detected on port 9002"
    print_status "Attempting to start backend..."
    
    if [ -f "scripts/start-local.sh" ]; then
        print_status "Starting local development environment..."
        ./scripts/start-local.sh &
        BACKEND_PID=$!
        
        # Wait for backend to start
        print_status "Waiting for backend to start..."
        sleep 10
        
        if ! lsof -i :9002 >/dev/null 2>&1; then
            print_error "Failed to start backend on port 9002"
            print_error "Please manually start the backend with: ./scripts/start-local.sh"
            exit 1
        fi
        
        print_success "Backend started successfully"
    else
        print_error "start-local.sh script not found"
        print_error "Please manually start the backend on port 9002"
        exit 1
    fi
else
    print_success "Backend is running on port 9002"
fi

# Check frontend (port 4200)
if ! lsof -i :4200 >/dev/null 2>&1; then
    print_warning "Frontend not detected on port 4200"
    print_status "Please start the frontend manually:"
    print_status "  cd frontend && npm run dev"
    print_status "The test will focus on backend API functionality"
else
    print_success "Frontend is running on port 4200"
fi

# Verify Node.js version
NODE_VERSION=$(node -v)
print_status "Using Node.js version: $NODE_VERSION"

# Check if test script exists and is executable
TEST_SCRIPT="scripts/test-checkin-update-e2e.js"
if [ ! -f "$TEST_SCRIPT" ]; then
    print_error "Test script not found: $TEST_SCRIPT"
    exit 1
fi

# Make script executable if it isn't
if [ ! -x "$TEST_SCRIPT" ]; then
    print_status "Making test script executable..."
    chmod +x "$TEST_SCRIPT"
fi

print_success "All prerequisites checked"

# Show test information
echo -e "\n${BOLD}${CYAN}Test Information:${NC}"
echo -e "${BLUE}📋 Test Scope:${NC}"
echo "   • Create new check-in (201 status)"
echo "   • Test duplicate prevention (409 status)"
echo "   • Update existing check-in (200 status)"
echo "   • Verify database persistence"
echo "   • Test UI state management"
echo "   • Complete update button flow"
echo ""
echo -e "${BLUE}🔧 Environment:${NC}"
echo "   • Backend: http://localhost:9002"
echo "   • Frontend: http://localhost:4200"
echo "   • Database: PostgreSQL"
echo "   • Test User: checkin-update-test@example.com"

echo -e "\n${BOLD}${YELLOW}⚠️  Important Notes:${NC}"
echo "   • This test will create/modify test data"
echo "   • Existing check-ins for test user will be cleaned up"
echo "   • Test requires PostgreSQL database connection"
echo "   • Backend must be running with auth endpoints enabled"

# Ask for confirmation
echo -e "\n${BOLD}Ready to run the E2E tests?${NC}"
read -p "Press Enter to continue or Ctrl+C to cancel..."

print_status "Starting E2E test execution..."
echo ""

# Run the test script with better error handling
if node "$TEST_SCRIPT"; then
    EXIT_CODE=$?
    echo -e "\n${BOLD}${GREEN}🎉 Test execution completed successfully!${NC}"
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}All tests passed! Check-in update functionality is working correctly.${NC}"
        echo -e "${GREEN}Users can now update their check-ins throughout the day. ✨${NC}"
    else
        echo -e "${YELLOW}Some tests failed. Check the detailed report above.${NC}"
    fi
else
    EXIT_CODE=$?
    echo -e "\n${BOLD}${RED}❌ Test execution failed!${NC}"
    echo -e "${RED}Check the error messages above for details.${NC}"
    
    # Provide troubleshooting tips
    echo -e "\n${BOLD}${YELLOW}Troubleshooting Tips:${NC}"
    echo "1. Ensure backend is running: ./scripts/start-local.sh"
    echo "2. Check PostgreSQL connection"
    echo "3. Verify auth endpoints are working"
    echo "4. Check network connectivity to localhost:9002"
    echo "5. Review backend logs for errors"
fi

# Cleanup message
echo -e "\n${BOLD}${BLUE}📋 Post-Test Information:${NC}"
echo "• Test data was cleaned up automatically"
echo "• Backend logs may contain additional details"
echo "• Test report includes specific failure details"

if [ ! -z "$BACKEND_PID" ]; then
    print_status "Stopping backend process..."
    kill $BACKEND_PID 2>/dev/null || true
fi

echo -e "\n${BOLD}${CYAN}Test suite completed. Thank you! 🚀${NC}"
exit $EXIT_CODE