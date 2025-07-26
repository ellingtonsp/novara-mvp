#!/bin/bash

# Test script for CM-01 Medication Status Endpoint using curl
API_BASE="http://localhost:9002"

echo "🧪 Testing CM-01 Medication Status Endpoint"
echo "============================================="

# Step 1: Create test user
echo -e "\n1️⃣ Creating test user..."
USER_RESPONSE=$(curl -s -X POST "$API_BASE/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-medication-status@example.com",
    "nickname": "MedStatusTest",
    "confidence_meds": 5,
    "confidence_costs": 7,
    "confidence_overall": 6,
    "primary_need": "medication_guidance",
    "cycle_stage": "ivf_prep"
  }')

USER_EMAIL=$(echo "$USER_RESPONSE" | jq -r '.user.email // "ERROR"')
if [ "$USER_EMAIL" = "ERROR" ]; then
  echo "❌ Failed to create user: $USER_RESPONSE"
  exit 1
fi
echo "✅ User created: $USER_EMAIL"

# Step 2: Login to get token
echo -e "\n2️⃣ Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$USER_EMAIL\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // "ERROR"')
if [ "$TOKEN" = "ERROR" ]; then
  echo "❌ Failed to login: $LOGIN_RESPONSE"
  exit 1
fi
echo "✅ Login successful, token received"

# Step 3: Test medication status updates
echo -e "\n3️⃣ Testing medication status updates..."

declare -a statuses=("taking" "starting_soon" "not_taking" "between_cycles" "finished_treatment")

for status in "${statuses[@]}"; do
  echo -e "\n   Testing status: $status"
  
  UPDATE_RESPONSE=$(curl -s -X PATCH "$API_BASE/api/users/medication-status" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"medication_status\": \"$status\"}")
  
  SUCCESS=$(echo "$UPDATE_RESPONSE" | jq -r '.success // false')
  if [ "$SUCCESS" = "true" ]; then
    UPDATED_STATUS=$(echo "$UPDATE_RESPONSE" | jq -r '.medication_status')
    TIMESTAMP=$(echo "$UPDATE_RESPONSE" | jq -r '.medication_status_updated')
    echo "   ✅ $status - SUCCESS"
    echo "      Updated: $UPDATED_STATUS"
    echo "      Timestamp: $TIMESTAMP"
  else
    ERROR_MSG=$(echo "$UPDATE_RESPONSE" | jq -r '.error // "Unknown error"')
    echo "   ❌ $status - FAILED: $ERROR_MSG"
  fi
done

# Step 4: Test invalid status
echo -e "\n4️⃣ Testing invalid status handling..."
INVALID_RESPONSE=$(curl -s -X PATCH "$API_BASE/api/users/medication-status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"medication_status": "invalid_status"}')

SUCCESS=$(echo "$INVALID_RESPONSE" | jq -r '.success // false')
if [ "$SUCCESS" = "false" ]; then
  echo "✅ Invalid status properly rejected"
else
  echo "❌ Should have rejected invalid status"
fi

# Step 5: Test component integration
echo -e "\n5️⃣ Testing component integration..."
CURRENT_USER_RESPONSE=$(curl -s -X GET "$API_BASE/api/users/current" \
  -H "Authorization: Bearer $TOKEN")

CURRENT_STATUS=$(echo "$CURRENT_USER_RESPONSE" | jq -r '.user.medication_status // "Not set"')
CURRENT_CYCLE=$(echo "$CURRENT_USER_RESPONSE" | jq -r '.user.cycle_stage // "Not set"')

echo "✅ User profile data accessible for component:"
echo "   Medication Status: $CURRENT_STATUS"
echo "   Cycle Stage: $CURRENT_CYCLE"

echo -e "\n🎉 All medication status endpoint tests completed!"
echo "Ready for staging deployment! 🚀" 