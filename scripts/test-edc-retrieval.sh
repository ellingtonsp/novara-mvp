#!/bin/bash

echo "🔍 Testing Enhanced Daily Check-in Field Retrieval"
echo "=================================================="
echo ""

EMAIL="bug009@test.com"
PASSWORD="Test123!"
API_URL="http://localhost:9002"

# Login
echo "🔑 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login"
  exit 1
fi

# Get recent checkins
echo "📊 Fetching recent check-ins..."
CHECKINS_RESPONSE=$(curl -s -X GET "$API_URL/api/checkins?limit=1" \
  -H "Authorization: Bearer $TOKEN")

echo ""
echo "🔍 Fields returned from API:"
echo "============================"
echo "$CHECKINS_RESPONSE" | jq '.'

echo ""
echo "📋 Checking for Enhanced fields in response:"
echo "-------------------------------------------"

# Check for each enhanced field
FIELDS=(
  "anxiety_level"
  "side_effects"
  "missed_doses"
  "injection_confidence"
  "appointment_within_3_days"
  "appointment_anxiety"
  "coping_strategies_used"
  "partner_involved_today"
  "wish_knew_more_about"
  "phq4_score"
  "phq4_anxiety"
  "phq4_depression"
)

echo ""
for field in "${FIELDS[@]}"; do
  if echo "$CHECKINS_RESPONSE" | grep -q "\"$field\""; then
    echo "✅ $field - Found in response"
  else
    echo "❌ $field - NOT found in response"
  fi
done

echo ""
echo "🎯 Summary:"
echo "-----------"
echo "The API response will show which Enhanced Daily Check-in fields"
echo "are actually being returned from the database."