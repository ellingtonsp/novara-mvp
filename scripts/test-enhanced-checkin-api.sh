#!/bin/bash

echo "🧪 Testing Enhanced Daily Check-in API Flow"
echo "=========================================="
echo ""

# Test user credentials
EMAIL="bug009@test.com"
PASSWORD="Test123!"
API_URL="http://localhost:9002"

# Login to get token
echo "🔑 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login"
  exit 1
fi

echo "✅ Logged in successfully"

# Get today's date
TODAY=$(date +%Y-%m-%d)

# Submit Enhanced Check-in with all required fields
echo ""
echo "📝 Submitting Enhanced Check-in..."
CHECKIN_RESPONSE=$(curl -s -X POST "$API_URL/api/checkins" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"mood_today\": \"hopeful\",
    \"confidence_today\": 7,
    \"medication_taken\": \"yes\",
    \"user_note\": \"Testing enhanced check-in completion\",
    \"date_submitted\": \"$TODAY\",
    \"anxiety_level\": 4,
    \"side_effects\": [\"Headache\", \"Fatigue\"],
    \"missed_doses\": 0,
    \"injection_confidence\": 8,
    \"appointment_within_3_days\": true,
    \"appointment_anxiety\": 3,
    \"coping_strategies_used\": [\"Deep breathing\", \"Gentle exercise\"],
    \"partner_involved_today\": true,
    \"wish_knew_more_about\": [\"Success rates\", \"Next steps in treatment\"],
    \"phq4_score\": 3,
    \"phq4_anxiety\": 2,
    \"phq4_depression\": 1
  }")

# Check response
if [[ $CHECKIN_RESPONSE == *"error"* ]]; then
  echo "❌ Check-in submission failed:"
  echo "$CHECKIN_RESPONSE" | jq .
else
  echo "✅ Enhanced Check-in submitted successfully!"
fi

# Check today's check-in status
echo ""
echo "🔍 Checking today's check-in status..."
STATUS_RESPONSE=$(curl -s -X GET "$API_URL/api/checkins/today" \
  -H "Authorization: Bearer $TOKEN")

if [[ $STATUS_RESPONSE == *"\"hasCheckedIn\":true"* ]]; then
  echo "✅ Today's check-in is properly registered as completed!"
  echo ""
  echo "🎉 BUG-009 FIX VERIFIED: Enhanced check-in completion is working!"
else
  echo "❌ Check-in not registered as completed"
  echo "$STATUS_RESPONSE" | jq .
fi