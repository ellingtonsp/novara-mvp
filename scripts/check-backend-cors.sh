#!/bin/bash

# Test CORS from command line
echo "🔍 Testing Backend CORS Configuration"
echo "===================================="
echo ""

# Test 1: Direct API call
echo "1️⃣ Testing direct API health check..."
curl -s https://novara-mvp-production.up.railway.app/api/health | jq . || echo "Failed"

echo ""
echo "2️⃣ Testing CORS headers with your domain..."
curl -s -I -X OPTIONS \
  -H "Origin: https://www.novarafertility.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization" \
  https://novara-mvp-production.up.railway.app/api/auth/login 2>&1 | grep -i "access-control\|HTTP"

echo ""
echo "3️⃣ Testing actual login endpoint with CORS..."
curl -X POST https://novara-mvp-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://www.novarafertility.com" \
  -d '{"email":"test@example.com"}' \
  -v 2>&1 | grep -i "access-control\|cors"

echo ""
echo "4️⃣ Checking if backend is running..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://novara-mvp-production.up.railway.app/api/health