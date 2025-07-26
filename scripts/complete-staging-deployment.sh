#!/bin/bash

# Complete CM-01 Staging Deployment Validation
# Run this after Airtable schema has been fixed

STAGING_API="https://novara-staging-staging.up.railway.app"
STAGING_FRONTEND="https://novara-bd6xsx1ru-novara-fertility.vercel.app"

echo "🎯 Final CM-01 Staging Deployment Validation"
echo "==========================================="
echo "Backend:  $STAGING_API"
echo "Frontend: $STAGING_FRONTEND"

# Step 1: Validate Airtable Schema
echo -e "\n1️⃣ Validating Airtable Schema..."
./scripts/validate-staging-schema.sh
if [ $? -ne 0 ]; then
  echo "❌ Airtable schema validation failed. Please fix schema first."
  exit 1
fi

echo "✅ Airtable schema validated successfully!"

# Step 2: Test Medication Status Endpoint
echo -e "\n2️⃣ Testing Medication Status Endpoint..."

# Create test user for medication status testing
TEST_EMAIL="staging-final-$(date +%s)@example.com"
echo "   Creating test user: $TEST_EMAIL"

USER_RESPONSE=$(curl -s -X POST "$STAGING_API/api/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"nickname\": \"StagingTest\",
    \"confidence_meds\": 7,
    \"confidence_costs\": 8,
    \"confidence_overall\": 7,
    \"primary_need\": \"medication_guidance\",
    \"cycle_stage\": \"ivf_prep\"
  }")

if ! echo "$USER_RESPONSE" | jq -e '.token' > /dev/null 2>&1; then
  echo "❌ Failed to create test user"
  echo "Response: $USER_RESPONSE"
  exit 1
fi

TOKEN=$(echo "$USER_RESPONSE" | jq -r '.token')
echo "   ✅ Test user created successfully"

# Test medication status update
echo "   Testing medication status update..."
STATUS_RESPONSE=$(curl -s -X PATCH "$STAGING_API/api/users/medication-status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"medication_status": "taking"}')

if echo "$STATUS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "   ✅ Medication status endpoint working correctly"
else
  echo "   ❌ Medication status endpoint failed"
  echo "   Response: $STATUS_RESPONSE"
  exit 1
fi

# Step 3: Test Complete User Flow
echo -e "\n3️⃣ Testing Complete CM-01 User Flow..."

# Test check-in submission
echo "   Testing daily check-in..."
CHECKIN_RESPONSE=$(curl -s -X POST "$STAGING_API/api/checkins" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "mood_today": "excited, hopeful",
    "confidence_today": 8,
    "primary_concern_today": "",
    "user_note": "Final staging test - everything working great!"
  }')

if echo "$CHECKIN_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "   ✅ Daily check-in working correctly"
else
  echo "   ❌ Daily check-in failed"
  echo "   Response: $CHECKIN_RESPONSE"
  exit 1
fi

# Test insights generation
echo "   Testing daily insights..."
INSIGHTS_RESPONSE=$(curl -s -X GET "$STAGING_API/api/insights/daily" \
  -H "Authorization: Bearer $TOKEN")

if echo "$INSIGHTS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "   ✅ Daily insights working correctly"
else
  echo "   ❌ Daily insights failed"
  echo "   Response: $INSIGHTS_RESPONSE"
  exit 1
fi

# Step 4: Frontend Validation
echo -e "\n4️⃣ Validating Frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_FRONTEND")

if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "   ✅ Frontend accessible and healthy"
else
  echo "   ❌ Frontend not accessible (HTTP $FRONTEND_STATUS)"
  exit 1
fi

echo -e "\n🎉 CM-01 STAGING DEPLOYMENT COMPLETE!"
echo "=================================="
echo "✅ Airtable schema validated"
echo "✅ Medication status endpoint working"
echo "✅ Daily check-ins functional"
echo "✅ Insights generation working"
echo "✅ Frontend accessible"
echo ""
echo "🚀 Ready for stable → main → production deployment!"
echo ""
echo "Next steps:"
echo "1. User acceptance testing in staging"
echo "2. Merge staging → stable"
echo "3. Production deployment" 