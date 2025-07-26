#!/bin/bash

# CM-01 UI Test Quick Start Script
# Positive-Reflection NLP & Dynamic Copy

set -e

echo "🎯 CM-01 Sentiment Analysis UI Test Quick Start"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected: /Users/stephen/Library/Mobile Documents/com~apple~CloudDocs/novara-mvp"
    exit 1
fi

echo "✅ Project root directory confirmed"
echo ""

# Check if servers are already running
echo "🔍 Checking if servers are already running..."

BACKEND_RUNNING=false
FRONTEND_RUNNING=false

if curl -s http://localhost:9002/api/health > /dev/null 2>&1; then
    BACKEND_RUNNING=true
    echo "✅ Backend server is running on port 9002"
else
    echo "⚠️  Backend server not running on port 9002"
fi

if curl -s http://localhost:4200 > /dev/null 2>&1; then
    FRONTEND_RUNNING=true
    echo "✅ Frontend server is running on port 4200"
else
    echo "⚠️  Frontend server not running on port 4200"
fi

echo ""

# Start servers if needed
if [ "$BACKEND_RUNNING" = false ] || [ "$FRONTEND_RUNNING" = false ]; then
    echo "🚀 Starting development servers..."
    echo ""
    
    # Kill any existing processes
    ./scripts/kill-local-servers.sh 2>/dev/null || true
    
    # Start servers in background
    ./scripts/start-dev-stable.sh &
    SERVER_PID=$!
    
    echo "⏳ Waiting for servers to start..."
    sleep 10
    
    # Check if servers started successfully
    if curl -s http://localhost:9002/api/health > /dev/null 2>&1; then
        echo "✅ Backend server started successfully"
    else
        echo "❌ Backend server failed to start"
        exit 1
    fi
    
    if curl -s http://localhost:4200 > /dev/null 2>&1; then
        echo "✅ Frontend server started successfully"
    else
        echo "❌ Frontend server failed to start"
        exit 1
    fi
    
    echo ""
else
    echo "✅ Both servers are already running"
    echo ""
fi

# Display test instructions
echo "🎯 CM-01 Sentiment Analysis Test Instructions"
echo "============================================="
echo ""
echo "1. 🌐 Open your browser and navigate to:"
echo "   http://localhost:4200"
echo ""
echo "2. 📝 Complete the daily check-in form with POSITIVE sentiment:"
echo "   - Mood: 'Excited' or 'Hopeful'"
echo "   - Confidence: 8-10"
echo "   - Medication Concern: 'Having such an amazing day! Feeling so blessed and grateful for this journey! 🎉'"
echo ""
echo "3. ✅ Expected Results:"
echo "   - Check-in submits successfully"
echo "   - Insight card displays CELEBRATORY copy with emoji"
echo "   - One of these messages should appear:"
echo "     • 'You're absolutely glowing today! ✨'"
echo "     • 'What a wonderful day to check in! 💜'"
echo "     • 'Your strength is absolutely shining! 🌟'"
echo "     • 'Celebrating YOU today! 🎊'"
echo "     • 'This is the energy we love to see! ⭐'"
echo ""
echo "4. 🔄 Test different scenarios:"
echo "   - Try neutral sentiment: 'Just checking in. Nothing special today.'"
echo "   - Try negative sentiment: 'Really struggling today. Feeling discouraged.'"
echo "   - Try IVF-specific terms: 'Miracle journey continues. Blessed with support.'"
echo ""
echo "5. 📊 Check analytics (optional):"
echo "   - Open browser dev tools (F12)"
echo "   - Go to Console tab"
echo "   - Look for 'sentiment_scored' event logs"
echo ""
echo "📋 Full test script available at:"
echo "   test/integration/test-CM-01-ui-manual.md"
echo ""
echo "🎉 Happy testing! The CM-01 feature should be fully functional."
echo ""

# Keep the script running to maintain server processes
if [ "$BACKEND_RUNNING" = false ] || [ "$FRONTEND_RUNNING" = false ]; then
    echo "💡 Press Ctrl+C to stop the servers when you're done testing"
    echo ""
    wait $SERVER_PID
fi 