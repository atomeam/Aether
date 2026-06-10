#!/bin/bash
# Automated Smoke Test Script
# Tests all critical endpoints automatically

set -e

echo "=== Automated Smoke Test ==="
echo ""

# Configuration
BRIDGE_URL="${BRIDGE_URL:-https://bridge.a-to-mind.com}"
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing $name... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $status, expected $expected_status)"
        ((FAILED++))
    fi
}

# Test bridge endpoints
echo "=== Bridge Worker Tests ==="
test_endpoint "Bridge Health" "$BRIDGE_URL/health" 200
test_endpoint "Bridge API Stack" "$BRIDGE_URL/api/stack" 200
test_endpoint "Bridge Crew Status" "$BRIDGE_URL/crew/status" 200
echo ""

# Test backend endpoints (if running)
echo "=== Backend Tests ==="
if curl -s "$BACKEND_URL/api/stack" > /dev/null 2>&1; then
    test_endpoint "Backend Stack" "$BACKEND_URL/api/stack" 200
    test_endpoint "Backend Agents" "$BACKEND_URL/api/agents" 200
else
    echo -e "${YELLOW}⚠ Backend not running, skipping backend tests${NC}"
fi
echo ""

# Test heartbeat endpoint (requires test data)
echo "=== Heartbeat Test ==="
echo -n "Testing Heartbeat (write)..."
response=$(curl -s -X POST "$BRIDGE_URL/api/ai/heartbeat" \
  -H "Content-Type: application/json" \
  -d '{"ai_id":"test-smoke","name":"Smoke Test","status":"active"}')

if echo "$response" | grep -q '"ok":true'; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi
echo ""

# Test heartbeat read
echo -n "Testing Heartbeat (read)..."
presence=$(curl -s "$BRIDGE_URL/api/ai/presence")
if echo "$presence" | grep -q "test-smoke"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi
echo ""

# Summary
echo "=== Test Summary ==="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
