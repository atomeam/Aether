#!/bin/bash
# Test script for relay webhook endpoints
# Run this after starting the backend with: npm run dev:backend

echo "=== Testing Relay Webhook Endpoints ==="
echo ""

# Test 1: Health check
echo "Test 1: GET /relay/health"
curl -s http://localhost:3000/relay/health | jq .
echo ""
echo ""

# Test 2: Assign a task
echo "Test 2: POST /relay/assign"
curl -s -X POST http://localhost:3000/relay/assign \
  -H "Content-Type: application/json" \
  -d '{
    "to": "Devin",
    "from": "manual",
    "task": "Test task from script",
    "priority": "normal"
  }' | jq .
echo ""
echo ""

# Test 3: Get queue
echo "Test 3: GET /relay/queue?agent=Devin"
curl -s "http://localhost:3000/relay/queue?agent=Devin" | jq .
echo ""
echo ""

# Test 4: Get errors
echo "Test 4: GET /relay/errors?limit=10"
curl -s "http://localhost:3000/relay/errors?limit=10" | jq .
echo ""
echo ""

# Test 5: Update task status (using a fake task ID)
echo "Test 5: POST /relay/status"
curl -s -X POST http://localhost:3000/relay/status \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "test_task_123",
    "status": "completed",
    "result": "Test completed"
  }' | jq .
echo ""
echo ""

echo "=== Tests Complete ==="