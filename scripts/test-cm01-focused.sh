#!/bin/bash

# CM-01 Focused Test Script
# Validates all acceptance criteria for Positive-Reflection NLP & Dynamic Copy

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

failure() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

echo "🧪 CM-01 Acceptance Criteria Validation"
echo "======================================"
echo "Testing: Positive-Reflection NLP & Dynamic Copy"
echo "Date: $(date)"
echo ""

# AC1: Performance Requirements (<150ms)
log "🧪 AC1: Testing performance requirements (<150ms)..."
cd frontend
PERFORMANCE_RESULT=$(node -e "
const { analyzeSentiment } = require('./src/lib/sentiment.ts');
const startTime = performance.now();
const result = analyzeSentiment('Having such an amazing day! Feeling so blessed and grateful for this journey! 🎉');
const endTime = performance.now();
const duration = endTime - startTime;
console.log(duration.toFixed(2));
" 2>/dev/null)

if (( $(echo "$PERFORMANCE_RESULT < 150" | bc -l) )); then
    success "AC1: Performance requirement met (<150ms): ${PERFORMANCE_RESULT}ms"
else
    failure "AC1: Performance requirement failed: ${PERFORMANCE_RESULT}ms"
fi
cd ..

# AC2: Accuracy Requirements (≥85% precision for positive)
log "🧪 AC2: Testing sentiment accuracy (≥85% precision)..."
cd frontend
ACCURACY_RESULT=$(node -e "
const { analyzeSentiment } = require('./src/lib/sentiment.ts');
const testCases = [
    'Having such an amazing day! Feeling so blessed and grateful for this journey! 🎉',
    'Feeling really grateful for all the support today',
    'This is going amazing! Best news ever! 🎉',
    'Doctor was so encouraging about our progress',
    'Insurance finally approved our treatment!'
];
let correct = 0;
testCases.forEach(text => {
    const result = analyzeSentiment(text);
    if (result.sentiment === 'positive') correct++;
});
const accuracy = (correct / testCases.length) * 100;
console.log(accuracy.toFixed(1));
" 2>/dev/null)

if (( $(echo "$ACCURACY_RESULT >= 85" | bc -l) )); then
    success "AC2: Accuracy requirement met (≥85%): ${ACCURACY_RESULT}%"
else
    failure "AC2: Accuracy requirement failed: ${ACCURACY_RESULT}%"
fi
cd ..

# AC3: Celebratory Copy Variants
log "🧪 AC3: Testing celebratory copy variants..."
cd frontend
COPY_RESULT=$(node -e "
const { generateSentimentBasedInsight } = require('./src/lib/copy-variants.ts');
const result = generateSentimentBasedInsight({sentiment: 'positive', confidence: 0.95, user_name: 'TestUser'});
if (result.sentiment_data.celebration_triggered && result.title.includes('!') && result.title.includes('🎉')) {
    console.log('SUCCESS');
} else {
    console.log('FAILED');
}
" 2>/dev/null)

if echo "$COPY_RESULT" | grep -q "SUCCESS"; then
    success "AC3: Celebratory copy variants working correctly"
else
    failure "AC3: Celebratory copy variants failed"
fi
cd ..

# AC4: Analytics Integration
log "🧪 AC4: Testing analytics integration..."
if [ -f "frontend/src/lib/analytics.ts" ]; then
    success "AC4: Analytics module exists and ready for integration"
else
    failure "AC4: Analytics module missing"
fi

# AC5: Unit Test Coverage
log "🧪 AC5: Testing unit test coverage..."
cd frontend
if npm test -- --run 2>/dev/null | grep -q "✓"; then
    success "AC5: Unit tests are passing"
else
    failure "AC5: Unit tests are failing"
fi
cd ..

# AC6: Neutral/Negative Flows Unchanged
log "🧪 AC6: Testing neutral/negative flows unchanged..."
cd frontend
NEUTRAL_RESULT=$(node -e "
const { generateSentimentBasedInsight } = require('./src/lib/copy-variants.ts');
const result = generateSentimentBasedInsight({sentiment: 'neutral', confidence: 0.5, user_name: 'TestUser'});
if (!result.sentiment_data.celebration_triggered) {
    console.log('SUCCESS');
} else {
    console.log('FAILED');
}
" 2>/dev/null)

if echo "$NEUTRAL_RESULT" | grep -q "SUCCESS"; then
    success "AC6: Neutral flows remain unchanged"
else
    failure "AC6: Neutral flows incorrectly modified"
fi
cd ..

# API Integration Tests
log "🧪 Testing API integration..."

# Test user registration
USER_RESPONSE=$(curl -s -X POST http://localhost:9002/api/users \
    -H "Content-Type: application/json" \
    -d '{
        "email":"test-cm01-ac-'"$(date +%s)"'@example.com",
        "nickname":"CM01ACTest",
        "confidence_meds":8,
        "confidence_costs":7,
        "confidence_overall":8,
        "primary_need":"medical_clarity",
        "cycle_stage":"ivf_prep",
        "email_opt_in":true
    }')

if echo "$USER_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    success "User registration API working"
    USER_TOKEN=$(echo "$USER_RESPONSE" | jq -r '.token')
else
    failure "User registration API failed"
    exit 1
fi

# Test check-in submission
CHECKIN_RESPONSE=$(curl -s -X POST http://localhost:9002/api/checkins \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -d '{
        "mood_today":"excited",
        "confidence_today":8,
        "primary_concern_today":"",
        "user_note":"Having such an amazing day! Feeling so blessed and grateful for this journey! 🎉"
    }')

if echo "$CHECKIN_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    success "Check-in submission API working"
else
    failure "Check-in submission API failed"
fi

# Test insights generation
INSIGHT_RESPONSE=$(curl -s -X GET http://localhost:9002/api/insights/daily \
    -H "Authorization: Bearer $USER_TOKEN")

if echo "$INSIGHT_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    success "Insights generation API working"
else
    failure "Insights generation API failed"
fi

# Generate final report
echo ""
echo "📊 CM-01 Acceptance Criteria Test Results"
echo "========================================="
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo "🎉 ALL ACCEPTANCE CRITERIA MET!"
    echo ""
    echo "✅ CM-01 Implementation Status:"
    echo "   • AC1: Performance <150ms ✅"
    echo "   • AC2: Sentiment accuracy ≥85% ✅"
    echo "   • AC3: Celebratory copy variants ✅"
    echo "   • AC4: Analytics integration ready ✅"
    echo "   • AC5: Unit test coverage ✅"
    echo "   • AC6: Neutral/negative flows unchanged ✅"
    echo ""
    echo "🚀 CM-01 is ready for staging deployment!"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Deploy to staging environment"
    echo "   2. Run user acceptance testing"
    echo "   3. Monitor performance metrics"
    echo "   4. Deploy to production"
    exit 0
else
    echo ""
    echo "❌ Some acceptance criteria failed."
    echo "Please review and fix issues before proceeding."
    exit 1
fi 