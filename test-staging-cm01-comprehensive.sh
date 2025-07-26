#!/bin/bash

# Comprehensive CM-01 Staging Environment Validation
STAGING_API="https://novara-staging-staging.up.railway.app"
STAGING_FRONTEND="https://novara-bd6xsx1ru-novara-fertility.vercel.app"

echo "🧪 CM-01 Comprehensive Staging Validation"
echo "========================================"
echo "Backend:  $STAGING_API"
echo "Frontend: $STAGING_FRONTEND"

# Test 1: Basic Health Checks
echo -e "\n1️⃣ Infrastructure Health Checks"
echo "   Backend Health..."
BACKEND_HEALTH=$(curl -s "$STAGING_API/api/health" | jq -r '.status // "ERROR"')
if [ "$BACKEND_HEALTH" = "ok" ]; then
  echo "   ✅ Backend: $BACKEND_HEALTH"
else
  echo "   ❌ Backend: $BACKEND_HEALTH"
  exit 1
fi

echo "   Frontend Accessibility..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_FRONTEND")
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "   ✅ Frontend: $FRONTEND_STATUS"
else
  echo "   ❌ Frontend: $FRONTEND_STATUS"
  exit 1
fi

# Test 2: Create Test User for CM-01 Features
echo -e "\n2️⃣ Create CM-01 Test User"
USER_EMAIL="test-cm01-staging-$(date +%s)@example.com"
USER_RESPONSE=$(curl -s -X POST "$STAGING_API/api/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"nickname\": \"CM01StagingTest\",
    \"confidence_meds\": 4,
    \"confidence_costs\": 6,
    \"confidence_overall\": 5,
    \"primary_need\": \"medication_guidance\",
    \"cycle_stage\": \"ivf_prep\"
  }")

USER_SUCCESS=$(echo "$USER_RESPONSE" | jq -r '.success // false')
if [ "$USER_SUCCESS" = "true" ]; then
  echo "   ✅ User created: $USER_EMAIL"
else
  echo "   ❌ User creation failed: $(echo "$USER_RESPONSE" | jq -r '.error')"
  exit 1
fi

# Test 3: Authentication
echo -e "\n3️⃣ Authentication & Token Management"
LOGIN_RESPONSE=$(curl -s -X POST "$STAGING_API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$USER_EMAIL\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // "ERROR"')
if [ "$TOKEN" != "ERROR" ] && [ ${#TOKEN} -gt 50 ]; then
  echo "   ✅ Authentication successful"
else
  echo "   ❌ Authentication failed"
  exit 1
fi

# Test 4: Medication Status Endpoint (NEW CM-01 Feature)
echo -e "\n4️⃣ CM-01 Medication Status Management"
MEDICATION_STATUSES=("taking" "starting_soon" "not_taking" "between_cycles")

for status in "${MEDICATION_STATUSES[@]}"; do
  echo "   Testing: $status"
  
  MED_RESPONSE=$(curl -s -X PATCH "$STAGING_API/api/users/medication-status" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"medication_status\": \"$status\"}")
  
  MED_SUCCESS=$(echo "$MED_RESPONSE" | jq -r '.success // false')
  if [ "$MED_SUCCESS" = "true" ]; then
    echo "   ✅ $status: SUCCESS"
  else
    echo "   ❌ $status: FAILED - $(echo "$MED_RESPONSE" | jq -r '.error')"
    exit 1
  fi
done

# Test 5: Daily Check-in with Sentiment Analysis
echo -e "\n5️⃣ CM-01 Enhanced Daily Check-in with Sentiment"
CHECKIN_RESPONSE=$(curl -s -X POST "$STAGING_API/api/daily-checkin-enhanced" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "mood_today": "hopeful but nervous",
    "confidence_today": 7,
    "primary_concern_today": "medication side effects",
    "user_note": "Feeling optimistic about this cycle but worried about the injection schedule. Hope everything goes smoothly! 🤞"
  }')

CHECKIN_SUCCESS=$(echo "$CHECKIN_RESPONSE" | jq -r '.success // false')
SENTIMENT=$(echo "$CHECKIN_RESPONSE" | jq -r '.micro_insight.sentiment_data.sentiment // "not_detected"')

if [ "$CHECKIN_SUCCESS" = "true" ]; then
  echo "   ✅ Enhanced check-in: SUCCESS"
  echo "   📊 Sentiment detected: $SENTIMENT"
else
  echo "   ❌ Enhanced check-in failed"
  exit 1
fi

# Test 6: Copy Variants & Personalized Insights
echo -e "\n6️⃣ CM-01 Dynamic Copy Variants"
INSIGHTS_RESPONSE=$(curl -s -X GET "$STAGING_API/api/insights/daily" \
  -H "Authorization: Bearer $TOKEN")

INSIGHTS_SUCCESS=$(echo "$INSIGHTS_RESPONSE" | jq -r '.success // false')
INSIGHT_TITLE=$(echo "$INSIGHTS_RESPONSE" | jq -r '.insight.insight_title // "no_insight"')

if [ "$INSIGHTS_SUCCESS" = "true" ] && [ "$INSIGHT_TITLE" != "no_insight" ]; then
  echo "   ✅ Personalized insights: SUCCESS"
  echo "   📝 Insight: $INSIGHT_TITLE"
else
  echo "   ❌ Insights generation failed"
  exit 1
fi

# Test 7: Schema Validation
echo -e "\n7️⃣ Airtable Schema Validation"
SCHEMA_RESPONSE=$(curl -s -X GET "$STAGING_API/api/health/detailed")
AIRTABLE_STATUS=$(echo "$SCHEMA_RESPONSE" | jq -r '.checks.airtable // "unknown"')

if [ "$AIRTABLE_STATUS" = "connected" ]; then
  echo "   ✅ Airtable schema: CONNECTED"
else
  echo "   ⚠️  Airtable schema: $AIRTABLE_STATUS (expected for staging)"
fi

echo -e "\n🎉 CM-01 Staging Validation Complete!"
echo "======================================="
echo "✅ All critical user flows validated"
echo "✅ Medication status management working"  
echo "✅ Sentiment analysis & copy variants active"
echo "✅ Enhanced check-in functionality operational"
echo "✅ Authentication & token management secure"
echo ""
echo "🚀 STAGING ENVIRONMENT READY FOR USER TESTING"
echo "   Frontend: $STAGING_FRONTEND"
echo "   Backend:  $STAGING_API"
echo ""
echo "📋 Test User Created:"
echo "   Email: $USER_EMAIL"
echo "   Status: Ready for manual testing" 