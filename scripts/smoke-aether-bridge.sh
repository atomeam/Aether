#!/usr/bin/env bash
set -euo pipefail

BASE="${AETHER_BRIDGE_URL:-https://aether.atomicmoonbeam88.workers.dev}"

echo "Testing Aether Bridge v0.2.0..."
echo "Base URL: $BASE"
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

for key in DB STATE STATE_CACHE MYBROWSER; do
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
echo "Aether Bridge smoke test PASSED."
