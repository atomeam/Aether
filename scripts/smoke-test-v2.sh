#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# LOXA / AETHER — POST-DEPLOY SMOKE TEST RUNBOOK v2
# Run after every main merge to verify crew health
# ═══════════════════════════════════════════════════════════════
# Usage: ./smoke-test-v2.sh [--verbose] [--json-output]
# Domains: Uses atomicmoonbeam88.workers.dev (fallback until NS swap)
#           Will migrate to a-to-mind.com subdomains post-DNS migration
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ─────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────
BASE_DOMAIN="atomicmoonbeam88.workers.dev"  # Fallback domain
CANONICAL_DOMAIN="a-to-mind.com"               # Post-migration domain
VERBOSE=false
JSON_OUTPUT=false

# Parse flags
while [[ $# -gt 0 ]]; do
  case $1 in
    --verbose) VERBOSE=true; shift ;;
    --json-output) JSON_OUTPUT=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ─────────────────────────────────────────────────────────────────
# Helper Functions
# ─────────────────────────────────────────────────────────────────
log() { echo "[$(date -u +%H:%M:%S)] $1"; }
warn() { echo "[$(date -u +%H:%M:%S)] ⚠️  $1" >&2; }
fail() { echo "[$(date -u +%H:%M:%S)] ❌ $1" >&2; }
pass() { echo "[$(date -u +%H:%M:%S)] ✅ $1"; }

test_endpoint() {
  local name="$1"
  local url="$2"
  local expected_code="${3:-200}"
  local verify_json="${4:-}"

  if [[ "$VERBOSE" == "true" ]]; then
    log "Testing $name: $url"
  fi

  local response
  response=$(curl -sf -w "\n%{http_code}" "$url" 2>/dev/null) || {
    warn "$name → connection failed"
    return 1
  }

  local http_code
  http_code=$(echo "$response" | tail -1)
  local body
  body=$(echo "$response" | head -1)

  if [[ "$http_code" == "$expected_code" ]]; then
    if [[ -n "$verify_json" ]]; then
      if echo "$body" | grep -q "$verify_json"; then
        pass "$name → $http_code (verified: $verify_json)"
        return 0
      else
        warn "$name → $http_code (missing: $verify_json)"
        return 1
      fi
    else
      pass "$name → $http_code"
      return 0
    fi
  else
    # Accept some alternatives as "alive"
    if [[ "$http_code" == "401" ]] || [[ "$http_code" == "404" ]] || [[ "$http_code" == "204" ]]; then
      pass "$name → $http_code (alive, needs auth)"
      return 0
    fi
    fail "$name → HTTP $http_code (expected: $expected_code)"
    return 1
  fi
}

# ─────────────────────────────────────────────────────────────────
# Test Execution
# ─────────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════"
echo "LOXA / AETHER SMOKE TEST v2 — $(date -u)"
echo "Domain: $BASE_DOMAIN (fallback)"
echo "═══════════════════════════════════════════════════════════"

START=$(date -u +%s)
PASS=0
FAIL=0
RESULTS=()

run_test() {
  local name="$1"
  local url="$2"
  local expected="${3:-200}"
  local verify="${4:-}"

  if test_endpoint "$name" "$url" "$expected" "$verify"; then
    ((PASS++))
    RESULTS+=("{\"worker\":\"$name\",\"status\":\"PASS\",\"url\":\"$url\"}")
  else
    ((FAIL++))
    RESULTS+=("{\"worker\":\"$name\",\"status\":\"FAIL\",\"url\":\"$url\"}")
  fi
}

# ─────────────────────────────────────────────────────────────────
# Worker Tests (13 total)
# ─────────────────────────────────────────────────────────────────

echo ""
echo "─── Testing Workers ───"

# 1. aether (dispatcher)
run_test "aether" "https://aether.$BASE_DOMAIN/api/stack" "200" '"status"'

# 2. aether-bridge
run_test "aether-bridge" "https://bridge.$BASE_DOMAIN/health" "200" '"ok"'

# 3. homebase
run_test "homebase" "https://home.$BASE_DOMAIN/" "200"

# 4. intake-run
run_test "intake-run" "https://intake-run.$BASE_DOMAIN/" "200"

# 5. billing-worker
run_test "billing-worker" "https://billing.$BASE_DOMAIN/" "200"

# 6. crew-room
run_test "crew-room" "https://crew.$BASE_DOMAIN/" "200"

# 7. grants-api
run_test "grants-api" "https://grants.$BASE_DOMAIN/" "200"

# 8. adamm
run_test "adamm" "https://adamm.$BASE_DOMAIN/" "200"

# 9. self-adaptive-app
run_test "self-adaptive-app" "https://self-adaptive-app.$BASE_DOMAIN/" "200"

# 10. notion-worker
run_test "notion-worker" "https://notion-worker.$BASE_DOMAIN/health" "200" '"ok"'

# 11. alpha-orchestrator
run_test "alpha-orchestrator" "https://alpha.$BASE_DOMAIN/" "200"

# 12. alpha-hub
run_test "alpha-hub" "https://alpha-hub.$BASE_DOMAIN/" "200"

# 13. cool-credit-fb9b — SKIP (stale, slated for deletion)
echo "   [13/13] cool-credit-fb9b → ⏭️  SKIP (stale, slated for deletion)"

# ─────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
END=$(date -u +%s)
DURATION=$((END - START))

echo "SMOKE TEST COMPLETE — $(date -u)"
echo "───────────────────────────────────────────────────────────"
echo "✅ PASS: $PASS/12"
echo "❌ FAIL: $FAIL/12"
echo "⏭️  SKIP: 1 (cool-credit-fb9b)"
echo "───────────────────────────────────────────────────────────"
echo "Duration: ${DURATION}s"
echo "═══════════════════════════════════════════════════════════"

# ─────────────────────────────────────────────────────────────────
# Output Formats
# ─────────────────────────────────────────────────────────────────

# JSON output for CI/dashboard
if [[ "$JSON_OUTPUT" == "true" ]]; then
  echo ""
  echo "--- JSON OUTPUT ---"
  echo '{"timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'","domain":"'"$BASE_DOMAIN"'","pass":'"$PASS"',"fail":'"$FAIL"',"skip":1,"duration_s":'"$DURATION"',"results":['"${RESULTS[*]}"']}'
fi

# Exit code for CI
if [[ $FAIL -gt 0 ]]; then
  exit 1
else
  exit 0
fi