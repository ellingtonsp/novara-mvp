#!/bin/bash

# BUG-013: Test Insight Feedback UI Fix
# Tests that the insight feedback shows proper "Helpful/Not Helpful" UI instead of generic buttons

echo "🐛 Testing BUG-013: Insight Feedback UI Fix"
echo "============================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Build and start the application
echo ""
echo "🔧 Building and starting the application..."
echo ""

# Kill any existing processes
echo "🛑 Killing existing processes..."
pkill -f "vite"
pkill -f "node.*server"
sleep 2

# Start backend on port 9002
echo "🚀 Starting backend on port 9002..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Check if backend is running
if ! curl -s http://localhost:9002/api/health > /dev/null; then
    echo "❌ Backend failed to start on port 9002"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend is running on port 9002"

# Start frontend on port 4200
echo "🚀 Starting frontend on port 4200..."
cd frontend
npm run dev -- --port 4200 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for frontend to initialize..."
sleep 10

# Check if frontend is running
if ! curl -s http://localhost:4200 > /dev/null; then
    echo "❌ Frontend failed to start on port 4200"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Frontend is running on port 4200"

# Test the insight feedback endpoint
echo ""
echo "🧪 Testing Insight Feedback API Endpoint..."
echo ""

# Create a test user and login to get a token
echo "📝 Testing with existing test user..."

# Test login to get token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:9002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    echo "Response: $LOGIN_RESPONSE"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Authentication successful"

# Test the insight feedback endpoint
echo ""
echo "🧪 Testing insight feedback API endpoint..."

FEEDBACK_RESPONSE=$(curl -s -X POST http://localhost:9002/api/insights/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "insight_id": "test_insight_123",
    "helpful": true,
    "comment": "This was very helpful!",
    "insight_context": {
      "sentiment": "positive",
      "copy_variant_used": "confidence_rising",
      "confidence_factors": {"confidence": 0.85}
    },
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
  }')

echo "📊 Feedback API Response: $FEEDBACK_RESPONSE"

if echo $FEEDBACK_RESPONSE | grep -q '"success":true'; then
    echo "✅ Insight feedback API endpoint working correctly"
else
    echo "❌ Insight feedback API endpoint not working"
    echo "Response: $FEEDBACK_RESPONSE"
fi

# Test negative feedback with comment
echo ""
echo "🧪 Testing negative feedback with comment..."

NEGATIVE_FEEDBACK_RESPONSE=$(curl -s -X POST http://localhost:9002/api/insights/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "insight_id": "test_insight_456",
    "helpful": false,
    "comment": "Could be more specific to my situation",
    "insight_context": {
      "sentiment": "neutral",
      "copy_variant_used": "general_support",
      "confidence_factors": {"confidence": 0.65}
    }
  }')

echo "📊 Negative Feedback API Response: $NEGATIVE_FEEDBACK_RESPONSE"

if echo $NEGATIVE_FEEDBACK_RESPONSE | grep -q '"success":true'; then
    echo "✅ Negative feedback with comment working correctly"
else
    echo "❌ Negative feedback endpoint not working"
fi

echo ""
echo "📱 Manual Testing Instructions:"
echo "================================"
echo ""
echo "1. Open http://localhost:4200 in your browser"
echo "2. Login with test@example.com / password123"
echo "3. Navigate to the daily insights section"
echo "4. Look for the insight feedback section at the bottom"
echo "5. Verify you see:"
echo "   ✓ 'Was this insight helpful?' text"
echo "   ✓ Green 'Helpful' button with thumbs up icon"
echo "   ✓ Orange 'Not helpful' button with thumbs down icon" 
echo "   ✗ NO generic buttons (thumbs up, bookmark, share, refresh)"
echo ""
echo "6. Test 'Helpful' button:"
echo "   - Click 'Helpful' button"
echo "   - Should show 'Thanks for the feedback!' message"
echo "   - Should submit feedback to backend API"
echo ""
echo "7. Test 'Not helpful' button:"
echo "   - Refresh page to get new insight"
echo "   - Click 'Not helpful' button"
echo "   - Should show comment box with:"
echo "     * 'Help us improve - what would have been more helpful?' prompt"
echo "     * Text area for feedback"
echo "     * Character counter (0/300)"
echo "     * 'Skip' and 'Submit' buttons"
echo "   - Enter a comment and click 'Submit'"
echo "   - Should show 'Thanks for helping us improve!' message"
echo ""
echo "8. Check browser console for:"
echo "   ✅ '✅ Insight feedback submitted to backend:' messages"
echo "   ✅ PostHog analytics tracking"
echo "   ❌ No error messages"
echo ""

# Keep servers running for manual testing
echo "🔄 Servers are running for manual testing..."
echo "   Backend: http://localhost:9002"
echo "   Frontend: http://localhost:4200"
echo ""
echo "Press Ctrl+C to stop servers and exit"

# Wait for user interrupt
trap 'echo ""; echo "🛑 Stopping servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "✅ Servers stopped"; exit 0' INT

# Keep script running
while true; do
    sleep 1
done