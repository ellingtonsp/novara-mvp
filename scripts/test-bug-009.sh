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
echo "2. Browser will open directly to check-in tab"
echo "3. Complete Quick Daily Check-in"
echo "4. Click 'Want to share more details?'"
echo "5. Complete all 4 steps of Enhanced Daily Check-in"
echo "6. Navigate away and return to check-in tab"
echo "7. BUG: You should NOT see a new check-in prompt"
echo ""

# Try to create user
echo "🔧 Creating test user..."
SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"firstName\":\"Bug\",\"lastName\":\"Tester\"}")

# Check if user already exists, then login
if [[ $SIGNUP_RESPONSE == *"already exists"* ]]; then
  echo "User already exists, logging in..."
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

echo "✅ User created/logged in successfully"

# Update profile to complete onboarding
echo "🔧 Completing user onboarding..."
curl -s -X PUT "$API_URL/api/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "baseline_completed": true,
    "onboarding_completed": true,
    "cycle_stage": "stimulation",
    "cycle_day": 5,
    "transfer_date": "'$(date -v+7d +%Y-%m-%d)'"
  }' > /dev/null

echo "✅ User profile updated"
echo ""
echo "📧 Test Account:"
echo "   Email: $EMAIL"
echo "   Password: $PASSWORD"
echo ""

# Create auto-login HTML
cat > /tmp/bug009-test.html << EOF
<!DOCTYPE html>
<html>
<head>
  <title>BUG-009 Test</title>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    #status { margin: 20px 0; padding: 10px; background: #f0f0f0; }
    .error { color: red; }
    .success { color: green; }
  </style>
</head>
<body>
  <h1>BUG-009: Enhanced Daily Check-in Test</h1>
  <div id="status">Setting up test environment...</div>
  
  <script>
    const status = document.getElementById('status');
    
    // Auto-login with the test credentials
    fetch('$API_URL/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: '$EMAIL',
        password: '$PASSWORD'
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        status.className = 'success';
        status.innerHTML = '✅ Login successful! Redirecting to check-in tab in 2 seconds...';
        
        setTimeout(() => {
          window.location.href = 'http://localhost:4200/#checkin';
        }, 2000);
      } else {
        status.className = 'error';
        status.innerHTML = '❌ Login failed: ' + (data.message || 'Unknown error');
      }
    })
    .catch(error => {
      status.className = 'error';
      status.innerHTML = '❌ Error: ' + error.message;
    });
  </script>
</body>
</html>
EOF

echo "🚀 Opening browser to test BUG-009..."
echo ""
echo "📋 IMPORTANT TEST STEPS:"
echo "   1. ✅ Complete Quick Check-in (mood, medication, confidence)"
echo "   2. 🔗 Click 'Want to share more details?'"
echo "   3. 📝 Complete ALL 4 Enhanced Check-in steps:"
echo "      - Step 1: Mood & Mental Health"
echo "      - Step 2: Treatment & Side Effects"
echo "      - Step 3: Support & Coping"
echo "      - Step 4: Information Needs"
echo "   4. 🔄 Navigate to Home tab, then back to Check-in tab"
echo "   5. 🐛 BUG: You'll see a NEW check-in prompt (should show completed status)"
echo ""

# Wait a moment then open browser
sleep 2
open /tmp/bug009-test.html