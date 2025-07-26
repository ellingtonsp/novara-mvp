#!/bin/bash

# Novara MVP - Deployment System Test Suite
# Validates the new unified deployment system

set -e

# Colors for output
RED='\x1b[0;31m'
GREEN='\x1b[0;32m'
YELLOW='\x1b[1;33m'
BLUE='\x1b[0;34m'
PURPLE='\x1b[0;35m'
CYAN='\x1b[0;36m'
NC='\x1b[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test results
FAILED_TESTS=()

# Script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Progress spinner
show_spinner() {
    local pid=$1
    local message="$2"
    local spinner_chars="⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
    local i=0
    
    while kill -0 $pid 2>/dev/null; do
        printf "\r${BLUE}${spinner_chars:$i:1} %s${NC}" "$message"
        i=$(( (i+1) % ${#spinner_chars} ))
        sleep 0.1
    done
    printf "\r"
}

# Function to print test status
test_status() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [[ "$status" == "PASS" ]]; then
        echo -e "${GREEN}✅ PASS${NC} - $test_name: $message"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    elif [[ "$status" == "FAIL" ]]; then
        echo -e "${RED}❌ FAIL${NC} - $test_name: $message"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        FAILED_TESTS+=("$test_name: $message")
    elif [[ "$status" == "SKIP" ]]; then
        echo -e "${YELLOW}⏭️  SKIP${NC} - $test_name: $message"
    else
        echo -e "${BLUE}ℹ️  INFO${NC} - $test_name: $message"
    fi
}

# Function to run a test with timeout and progress
run_test_with_progress() {
    local test_name="$1"
    local test_command="$2"
    local expected_exit_code="${3:-0}"
    local timeout_seconds="${4:-30}"
    
    printf "${CYAN}🧪 Testing: $test_name${NC} "
    
    # Run command in background with timeout
    (
        timeout "$timeout_seconds" bash -c "$test_command" >/dev/null 2>&1
        echo $? > "/tmp/test_exit_code_$$"
    ) &
    local test_pid=$!
    
    # Show spinner while test runs
    show_spinner $test_pid "Running..."
    
    # Wait for test to complete
    wait $test_pid 2>/dev/null
    
    # Get exit code
    local actual_exit_code
    if [[ -f "/tmp/test_exit_code_$$" ]]; then
        actual_exit_code=$(cat "/tmp/test_exit_code_$$")
        rm -f "/tmp/test_exit_code_$$"
    else
        actual_exit_code=124  # timeout exit code
    fi
    
    if [[ $actual_exit_code -eq 124 ]]; then
        test_status "$test_name" "FAIL" "Test timed out after ${timeout_seconds}s"
    elif [[ $actual_exit_code -eq $expected_exit_code ]]; then
        test_status "$test_name" "PASS" "Command executed successfully"
    else
        test_status "$test_name" "FAIL" "Expected exit code $expected_exit_code, got $actual_exit_code"
    fi
}

# Function to run a test (simplified version)
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_exit_code="${3:-0}"
    
    printf "${CYAN}🧪 Testing: $test_name${NC} "
    
    if eval "$test_command" >/dev/null 2>&1; then
        local actual_exit_code=$?
        if [[ $actual_exit_code -eq $expected_exit_code ]]; then
            echo -e "${GREEN}✅${NC}"
            test_status "$test_name" "PASS" "Command executed successfully"
        else
            echo -e "${RED}❌${NC}"
            test_status "$test_name" "FAIL" "Expected exit code $expected_exit_code, got $actual_exit_code"
        fi
    else
        echo -e "${RED}❌${NC}"
        test_status "$test_name" "FAIL" "Command failed to execute"
    fi
}

# Function to test file exists
test_file_exists() {
    local test_name="$1"
    local file_path="$2"
    
    printf "${CYAN}📄 Checking: $test_name${NC} "
    
    if [[ -f "$file_path" ]]; then
        echo -e "${GREEN}✅${NC}"
        test_status "$test_name" "PASS" "File exists: $file_path"
    else
        echo -e "${RED}❌${NC}"
        test_status "$test_name" "FAIL" "File not found: $file_path"
    fi
}

# Function to test directory exists
test_dir_exists() {
    local test_name="$1"
    local dir_path="$2"
    
    printf "${CYAN}📁 Checking: $test_name${NC} "
    
    if [[ -d "$dir_path" ]]; then
        echo -e "${GREEN}✅${NC}"
        test_status "$test_name" "PASS" "Directory exists: $dir_path"
    else
        echo -e "${RED}❌${NC}"
        test_status "$test_name" "FAIL" "Directory not found: $dir_path"
    fi
}

# Function to test Node.js module
test_node_module() {
    local test_name="$1"
    local module_path="$2"
    
    printf "${CYAN}🔧 Loading: $test_name${NC} "
    
    if timeout 10s node -e "require('$module_path')" >/dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        test_status "$test_name" "PASS" "Node.js module loads correctly"
    else
        echo -e "${RED}❌${NC}"
        test_status "$test_name" "FAIL" "Node.js module failed to load"
    fi
}

# Progress counter
show_progress() {
    local current=$1
    local total=$2
    local percentage=$((current * 100 / total))
    local bar_length=20
    local filled_length=$((percentage * bar_length / 100))
    
    printf "${BLUE}["
    for ((i=0; i<filled_length; i++)); do printf "█"; done
    for ((i=filled_length; i<bar_length; i++)); do printf "░"; done
    printf "] %d%% (%d/%d)${NC}\n" "$percentage" "$current" "$total"
}

echo -e "${BLUE}🚀 Novara MVP Deployment System Test Suite${NC}"
echo "==========================================="
echo ""

# Change to project root
cd "$PROJECT_ROOT"

# Estimate total tests for progress tracking
TOTAL_ESTIMATED_TESTS=25

echo -e "${PURPLE}📊 Test Progress${NC}"
show_progress 0 $TOTAL_ESTIMATED_TESTS
echo ""

echo -e "${YELLOW}📂 Testing File Structure${NC}"
echo "-------------------------"

# Test core files exist
test_file_exists "Config File" "scripts/deployment-config.js"
test_file_exists "Deploy Orchestrator" "scripts/deploy-orchestrator.js"
test_file_exists "Rollback System" "scripts/rollback.js"
test_file_exists "Deployment Monitor" "scripts/deployment-monitor.js"
test_file_exists "Unified Deploy Script" "scripts/deploy.sh"

# Test directories exist
test_dir_exists "Scripts Directory" "scripts"
test_dir_exists "Frontend Directory" "frontend"
test_dir_exists "Backend Directory" "backend"

# Test logs directory creation
printf "${CYAN}📁 Checking: Logs Directory${NC} "
if [[ ! -d "scripts/logs" ]]; then
    mkdir -p "scripts/logs"
    echo -e "${GREEN}✅${NC}"
    test_status "Logs Directory Creation" "PASS" "Created scripts/logs directory"
else
    echo -e "${GREEN}✅${NC}"
    test_status "Logs Directory" "PASS" "scripts/logs directory exists"
fi

echo ""
show_progress 9 $TOTAL_ESTIMATED_TESTS
echo ""

echo -e "${YELLOW}🔧 Testing Node.js Modules${NC}"
echo "----------------------------"

# Test Node.js modules load correctly
test_node_module "Deployment Config" "./scripts/deployment-config.js"
test_node_module "Deploy Orchestrator" "./scripts/deploy-orchestrator.js"
test_node_module "Rollback System" "./scripts/rollback.js"
test_node_module "Deployment Monitor" "./scripts/deployment-monitor.js"

echo ""
show_progress 13 $TOTAL_ESTIMATED_TESTS
echo ""

echo -e "${YELLOW}⚙️  Testing Configuration${NC}"
echo "-----------------------------"

# Test configuration validation (with shorter timeout)
run_test "Config Validation - Development" "node -e \"const config = require('./scripts/deployment-config.js'); console.log(config.validateEnvironment('development'))\"" 0
run_test "Config Validation - Staging" "node -e \"const config = require('./scripts/deployment-config.js'); console.log(config.validateEnvironment('staging'))\"" 0
run_test "Config Validation - Production" "node -e \"const config = require('./scripts/deployment-config.js'); console.log(config.validateEnvironment('production'))\"" 0

echo ""
show_progress 16 $TOTAL_ESTIMATED_TESTS
echo ""

echo -e "${YELLOW}🖥️  Testing CLI Interfaces${NC}"
echo "-----------------------------"

# Test help outputs (should exit with 0)
run_test "Deploy Orchestrator Help" "node scripts/deploy-orchestrator.js" 0
run_test "Rollback Help" "node scripts/rollback.js" 0
run_test "Monitor Help" "node scripts/deployment-monitor.js" 0

# Test invalid arguments (should exit with 1)
run_test "Deploy Orchestrator Invalid Env" "! node scripts/deploy-orchestrator.js invalid" 0
run_test "Rollback Invalid Env" "! node scripts/rollback.js invalid" 0

echo ""
show_progress 21 $TOTAL_ESTIMATED_TESTS
echo ""

echo -e "${YELLOW}🏥 Testing Health Monitoring${NC}"
echo "-------------------------------"

# Test monitoring system with shorter timeout
run_test_with_progress "Deployment Monitor Single Check" "node scripts/deployment-monitor.js --once" 0 20

echo ""
show_progress 22 $TOTAL_ESTIMATED_TESTS
echo ""

echo -e "${YELLOW}📝 Testing Logging System${NC}"
echo "-----------------------------"

# Test log file creation
TEMP_LOG="scripts/logs/test-deployment-$$-$(date +%s).log"
printf "${CYAN}📝 Testing: Log File Creation${NC} "
echo "Test log entry" > "$TEMP_LOG"

if [[ -f "$TEMP_LOG" ]]; then
    echo -e "${GREEN}✅${NC}"
    test_status "Log File Creation" "PASS" "Successfully created test log file"
    rm -f "$TEMP_LOG"
else
    echo -e "${RED}❌${NC}"
    test_status "Log File Creation" "FAIL" "Failed to create test log file"
fi

echo ""
show_progress 23 $TOTAL_ESTIMATED_TESTS
echo ""

echo -e "${YELLOW}🔧 Testing Script Permissions${NC}"
echo "--------------------------------"

# Test script permissions
printf "${CYAN}🔐 Checking: Deploy Script Executable${NC} "
if [[ -x "scripts/deploy.sh" ]]; then
    echo -e "${GREEN}✅${NC}"
    test_status "Deploy Script Executable" "PASS" "scripts/deploy.sh is executable"
else
    echo -e "${RED}❌${NC}"
    test_status "Deploy Script Executable" "FAIL" "scripts/deploy.sh is not executable"
fi

echo ""
show_progress 24 $TOTAL_ESTIMATED_TESTS
echo ""

echo -e "${YELLOW}🔐 Testing Security Features${NC}"
echo "------------------------------"

# Test production force requirement
printf "${CYAN}🔒 Testing: Production Force Requirement${NC} "
# Test 1: Direct orchestrator call without --force should require it
if timeout 5s node scripts/deploy-orchestrator.js production 2>&1 | grep -q "requires --force" >/dev/null; then
    echo -e "${GREEN}✅${NC}"
    test_status "Production Force Requirement" "PASS" "Production deployment requires --force flag"
elif echo "no" | timeout 5s ./scripts/deploy.sh production 2>&1 | grep -q "Deployment cancelled" >/dev/null; then
    echo -e "${GREEN}✅${NC}"
    test_status "Production Force Requirement" "PASS" "Production deployment has safety confirmation"
else
    echo -e "${RED}❌${NC}"
    test_status "Production Force Requirement" "FAIL" "Production deployment should require --force flag or confirmation"
fi

echo ""
show_progress 25 $TOTAL_ESTIMATED_TESTS
echo ""

echo -e "${YELLOW}📊 Test Results Summary${NC}"
echo "========================"
echo ""
echo -e "${BLUE}Total Tests Run:${NC} $TESTS_RUN"
echo -e "${GREEN}Tests Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Tests Failed:${NC} $TESTS_FAILED"

# Calculate success rate
if [[ $TESTS_RUN -gt 0 ]]; then
    success_rate=$((TESTS_PASSED * 100 / TESTS_RUN))
    echo -e "${CYAN}Success Rate:${NC} ${success_rate}%"
fi

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo "The deployment system is ready for use."
    echo ""
    echo -e "${BLUE}Quick Start:${NC}"
    echo "  ./scripts/deploy.sh staging"
    echo "  ./scripts/deploy.sh production --force"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Failed tests:"
    for failed_test in "${FAILED_TESTS[@]}"; do
        echo -e "${RED}  • $failed_test${NC}"
    done
    echo ""
    echo "Please review the failed tests and fix any issues before using the deployment system."
    echo ""
    echo -e "${BLUE}For help:${NC}"
    echo "  Check docs/deployment-system-v2.md"
    echo "  Review scripts/logs/ for detailed logs"
    echo ""
    exit 1
fi 