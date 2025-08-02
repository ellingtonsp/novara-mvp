#!/bin/bash

echo "🐛 Setting up test for BUG-009: Enhanced Daily Check-in Not Registering"
echo "====================================================="
echo ""

# Test user credentials
EMAIL="bug009@test.com"
PASSWORD="Test123!"
API_URL="http://localhost:9002"

echo "📝 Test Steps:"
echo "1. Creating test user with completed onboarding"
echo "2. Opening the app login page"
echo "3. You'll need to manually login with the test credentials"
echo ""

# Try to create user
echo "🔧 Creating test user..."
SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"firstName\":\"Bug\",\"lastName\":\"Tester\"}")

# Check if user already exists, then login
if [[ $SIGNUP_RESPONSE == *"already exists"* ]]; then
  echo "User already exists, that's OK..."
  LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
else
  TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to create/login user"
  exit 1
fi

echo "✅ User created/exists"

# Update profile to complete onboarding
echo "🔧 Completing user onboarding..."
TRANSFER_DATE=$(date -v+7d +%Y-%m-%d 2>/dev/null || date -d "+7 days" +%Y-%m-%d)

curl -s -X PUT "$API_URL/api/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"baseline_completed\": true,
    \"onboarding_completed\": true,
    \"cycle_stage\": \"stimulation\",
    \"cycle_day\": 5,
    \"transfer_date\": \"$TRANSFER_DATE\"
  }" > /dev/null

echo "✅ User profile updated"
echo ""
echo "📧 Test Account Ready!"
echo "   Email: $EMAIL"
echo "   Password: $PASSWORD"
echo ""
echo "🚀 Opening app..."
echo ""
echo "📋 MANUAL TEST STEPS:"
echo "   1. 🔑 Login with: $EMAIL / $PASSWORD"
echo "   2. ✅ Complete Quick Check-in (mood, medication, confidence)"
echo "   3. 🔗 Click 'Want to share more details?'"
echo "   4. 📝 Complete ALL 4 Enhanced Check-in steps"
echo "   5. 🔄 Navigate to Home tab, then back to Check-in tab"
echo "   6. 🐛 BUG: You'll see a NEW check-in prompt (should show completed status)"
echo ""

# Open the app
open "http://localhost:4200/"