#!/bin/bash

echo "🔍 Detailed CORS Debug"
echo "====================="
echo ""

# Test with verbose output
echo "Testing CORS preflight with full headers..."
echo ""
curl -X OPTIONS https://novara-mvp-production.up.railway.app/api/auth/login \
  -H "Origin: https://www.novarafertility.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization" \
  -i

echo ""
echo "Testing without www..."
echo ""
curl -X OPTIONS https://novara-mvp-production.up.railway.app/api/auth/login \
  -H "Origin: https://novarafertility.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization" \
  -i 2>&1 | head -20