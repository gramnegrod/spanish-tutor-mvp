#!/bin/bash

# Test authentication flow
echo "Testing authentication flow..."
echo "=============================="

# Test 1: Check test-auth endpoint
echo -e "\n1. Testing /api/test-auth endpoint:"
curl -s http://localhost:3000/api/test-auth | jq '.'

# Test 2: Check progress endpoint (should require auth)
echo -e "\n2. Testing /api/progress endpoint (should fail without auth):"
curl -s http://localhost:3000/api/progress | jq '.'

# Test 3: Check conversations endpoint (should require auth)
echo -e "\n3. Testing /api/conversations endpoint (should fail without auth):"
curl -s http://localhost:3000/api/conversations | jq '.'

echo -e "\n=============================="
echo "To test with authentication:"
echo "1. Sign in at http://localhost:3000/login"
echo "2. Open Developer Tools > Application > Cookies"
echo "3. Copy the sb-* cookies and test again with:"
echo "   curl -H 'Cookie: sb-*=...' http://localhost:3000/api/progress"