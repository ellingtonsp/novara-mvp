#!/bin/bash

# 🧪 API Endpoint Testing Demo
# Demonstrates the comprehensive API endpoint testing capabilities

echo "🧪 Novara API Endpoint Testing Demo"
echo "==================================="
echo ""

echo "📋 Available Test Commands:"
echo "  ./scripts/api-endpoint-test.sh staging     # Test staging environment"
echo "  ./scripts/api-endpoint-test.sh production  # Test production environment"
echo "  ./scripts/api-endpoint-test.sh both        # Test both environments"
echo ""

echo "🎯 What Gets Tested:"
echo "  ✅ Environment Health (Backend, Database, JWT)"
echo "  ✅ Authentication Endpoints (Login, Protected Routes)"
echo "  ✅ Check-in Endpoints (Questions, Last Values)"
echo "  ✅ Insights Endpoints (Daily Insights, Engagement)"
echo "  ✅ Frontend Connectivity (Vercel Deployment)"
echo "  ✅ CORS Configuration (Cross-Origin Requests)"
echo "  ✅ Performance Monitoring (Response Times)"
echo ""

echo "🔒 Production-Safe Testing:"
echo "  ✅ Read-only operations only"
echo "  ✅ No test data creation"
echo "  ✅ Existing user authentication"
echo "  ✅ Performance monitoring without pollution"
echo ""

echo "📊 Sample Test Output:"
echo "  ✅ Health Check"
echo "     Service: Novara API | Environment: production | Response Time: 0.12s"
echo ""
echo "  ✅ Airtable Connection"
echo "     Status: connected"
echo ""
echo "  ✅ Frontend Accessibility"
echo "     Frontend is accessible and responding"
echo ""

echo "🚀 Quick Test Commands:"
echo ""

# Test production health check
echo "Testing production health check..."
HEALTH_RESPONSE=$(curl -s https://novara-mvp-production.up.railway.app/api/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo "✅ Production backend is healthy"
    echo "   Environment: $(echo "$HEALTH_RESPONSE" | jq -r '.environment')"
    echo "   Airtable: $(echo "$HEALTH_RESPONSE" | jq -r '.airtable')"
    echo "   JWT: $(echo "$HEALTH_RESPONSE" | jq -r '.jwt')"
else
    echo "❌ Production backend health check failed"
fi

echo ""

# Test frontend accessibility
echo "Testing frontend accessibility..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://novara-mvp.vercel.app)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Production frontend is accessible"
else
    echo "❌ Production frontend not accessible (HTTP $FRONTEND_STATUS)"
fi

echo ""

echo "📖 For detailed testing, run:"
echo "  ./scripts/api-endpoint-test.sh production"
echo ""
echo "📚 For complete documentation, see:"
echo "  docs/api-endpoint-testing-guide.md"
echo ""
echo "🎉 Demo complete! Your API endpoints are ready for comprehensive testing." 