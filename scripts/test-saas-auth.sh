#!/bin/bash
# Test SaaS route authentication
# Verifies 401 response for unauthenticated requests

BRIDGE_URL="${BRIDGE_URL:-https://bridge.a-to-mind.com}"

echo "=== SaaS Route Auth Tests ==="
echo "Testing against: $BRIDGE_URL"
echo ""

# Test 1: GET /saas/tasks without auth - should return 401
echo "Test 1: GET /saas/tasks (no auth) - expect 401"
response=$(curl -s -o /dev/null -w "%{http_code}" "$BRIDGE_URL/saas/tasks")
if [ "$response" = "401" ]; then
  echo "  ✓ PASS: Received 401 as expected"
else
  echo "  ✗ FAIL: Expected 401, got $response"
fi

# Test 2: POST /saas/tasks without auth - should return 401
echo ""
echo "Test 2: POST /saas/tasks (no auth) - expect 401"
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"title":"test"}' \
  "$BRIDGE_URL/saas/tasks")
if [ "$response" = "401" ]; then
  echo "  ✓ PASS: Received 401 as expected"
else
  echo "  ✗ FAIL: Expected 401, got $response"
fi

# Test 3: GET /saas/tasks with invalid token - should return 401
echo ""
echo "Test 3: GET /saas/tasks (invalid token) - expect 401"
response=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer invalid-token-123" \
  "$BRIDGE_URL/saas/tasks")
if [ "$response" = "401" ]; then
  echo "  ✓ PASS: Received 401 as expected"
else
  echo "  ✗ FAIL: Expected 401, got $response"
fi

# Test 4: GET /saas/health (no auth required) - should return 200
echo ""
echo "Test 4: GET /saas/health (no auth) - expect 200"
response=$(curl -s -w "%{http_code}" "$BRIDGE_URL/saas/health")
code="${response: -3}"
body="${response:0:${#response}-3}"
if [ "$code" = "200" ]; then
  echo "  ✓ PASS: Received 200 as expected"
  echo "  Response: $body"
else
  echo "  ✗ FAIL: Expected 200, got $code"
fi

# Test 5: GET /saas/tasks with malformed Authorization header - should return 401
echo ""
echo "Test 5: GET /saas/tasks (malformed auth header) - expect 401"
response=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: NotBearer token" \
  "$BRIDGE_URL/saas/tasks")
if [ "$response" = "401" ]; then
  echo "  ✓ PASS: Received 401 as expected"
else
  echo "  ✗ FAIL: Expected 401, got $response"
fi

echo ""
echo "=== Tests Complete ==="