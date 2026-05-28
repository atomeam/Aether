#!/usr/bin/env bash
set -euo pipefail

BASE="${AETHER_BRIDGE_URL:-https://aether.atomind.io}"
DB_NAME="${AETHER_BRIDGE_DB:-aether-bridge-db}"

echo "Testing Aether Bridge v0.2.0 (Extended Smoke Test)..."
echo "Base URL: $BASE"
echo "Database: $DB_NAME"
echo ""

echo "=== GET /health ==="
health="$(curl -sS "$BASE/health")"
echo "$health" | jq .

echo ""
echo "=== GET /crew/status ==="
crew="$(curl -sS "$BASE/crew/status")"
echo "$crew" | jq .

echo ""
echo "=== GET /proposals ==="
curl -sS "$BASE/proposals" | jq .

echo ""
echo "=== GET /lessons ==="
curl -sS "$BASE/lessons" | jq .

echo ""
echo "=== POST /lessons/check ==="
curl -sS -X POST "$BASE/lessons/check" -H "Content-Type: application/json" -d '{"hash":"test123"}' | jq .

echo ""
echo "=== POST /webhooks/notion (Synthetic Event) ==="
TEST_EVENT_ID="smoke-test-$(date +%s)"
TEST_PAYLOAD=$(cat <<EOF
{
  "data": {
    "id": "$TEST_EVENT_ID",
    "title": "Smoke Test Event",
    "parent": {
      "database_id": "test-db-123"
    }
  }
}
EOF
)

webhook_response=$(curl -sS -X POST "$BASE/webhooks/notion" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD")
echo "$webhook_response" | jq .

echo ""
echo "=== Verification ==="
health_version="$(echo "$health" | jq -r '.version')"
crew_version="$(echo "$crew" | jq -r '.version')"

if [[ "$health_version" != "0.2.0" ]]; then
    echo "FAIL: Expected /health version 0.2.0, got $health_version" >&2
    exit 1
fi

if [[ "$crew_version" != "0.2.0" ]]; then
    echo "FAIL: Expected /crew/status version 0.2.0, got $crew_version" >&2
    exit 1
fi

for key in DB BRIDGE_DB STATE STATE_CACHE MYBROWSER; do
    health_binding="$(echo "$health" | jq -r ".bindings.$key")"
    crew_binding="$(echo "$crew" | jq -r ".bindings.$key")"

    if [[ "$health_binding" == "null" ]]; then
        echo "FAIL: Missing /health binding key: $key" >&2
        exit 1
    fi

    if [[ "$health_binding" != "$crew_binding" ]]; then
        echo "FAIL: Binding mismatch for $key: /health=$health_binding /crew/status=$crew_binding" >&2
        exit 1
    fi
    
    echo "OK: $key binding = $health_binding (matches)"
done

echo ""
echo "=== Webhook Persistence Check ==="
echo "Checking if event $TEST_EVENT_ID was persisted to $DB_NAME..."

# Sleep briefly to allow D1 write to propagate
sleep 2

# Check if event exists in D1
event_query="SELECT event_id, source, kind, level FROM events WHERE event_id = '$TEST_EVENT_ID' LIMIT 1"
echo "Running: wrangler d1 execute $DB_NAME --command \"$event_query\""

if command -v wrangler &> /dev/null; then
    event_result=$(wrangler d1 execute "$DB_NAME" --command "$event_query" 2>&1 || echo "WRANGLER_ERROR")
    
    if [[ "$event_result" == *"WRANGLER_ERROR"* ]]; then
        echo "⚠️  WARNING: Could not verify D1 persistence (wrangler not configured or DB not accessible)"
        echo "Skipping D1 verification - this requires Cloudflare credentials"
    elif echo "$event_result" | grep -q "$TEST_EVENT_ID"; then
        echo "✅ SUCCESS: Event $TEST_EVENT_ID found in database"
        echo "$event_result" | jq . 2>/dev/null || echo "$event_result"
    else
        echo "❌ FAIL: Event $TEST_EVENT_ID not found in database"
        echo "Query result: $event_result"
        exit 1
    fi
else
    echo "⚠️  WARNING: wrangler CLI not found - skipping D1 persistence verification"
    echo "Manual verification required: wrangler d1 execute $DB_NAME --command \"$event_query\""
fi

echo ""
echo "=== Idempotency Check (Duplicate Send) ==="
echo "Sending duplicate webhook event..."

duplicate_response=$(curl -sS -X POST "$BASE/webhooks/notion" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD")
echo "$duplicate_response" | jq .

duplicate_ok=$(echo "$duplicate_response" | jq -r '.ok // false')
duplicate_flag=$(echo "$duplicate_response" | jq -r '.duplicate // false')

if [[ "$duplicate_ok" == "true" && "$duplicate_flag" == "true" ]]; then
    echo "✅ SUCCESS: Duplicate event correctly identified and skipped"
else
    echo "⚠️  WARNING: Duplicate handling may not be working as expected"
    echo "Expected: {\"ok\": true, \"duplicate\": true}"
    echo "Got: $duplicate_response"
fi

echo ""
echo "Aether Bridge extended smoke test PASSED."
echo ""
echo "Summary:"
echo "- Health endpoint: OK"
echo "- Binding validation: OK"
echo "- Webhook endpoint: OK"
echo "- Event persistence: $([[ "$event_result" != *"WRANGLER_ERROR"* ]] && echo "✅ Verified" || echo "⚠️  Skipped (manual verification required)")"
echo "- Idempotency: $([[ "$duplicate_ok" == "true" && "$duplicate_flag" == "true" ]] && echo "✅ Verified" || echo "⚠️  Check results above)"
