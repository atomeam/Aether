#!/usr/bin/env bash
# Validate wrangler.toml configs across the monorepo:
# 1. Env interface bindings match wrangler.toml declarations
# 2. Resource ID format validation (KV 32-char hex, D1 UUID, etc.)
# 3. Cross-config divergence (root vs apps/bridge)
# 4. Cron triggers with no scheduled() handler
# 5. Worker name conflicts

set -euo pipefail

ERRORS=0
WARNINGS=0

echo "=== Wrangler Config Consistency Check ==="
echo ""

# --- Collect all wrangler.toml files ---
WRANGLER_FILES=$(find . -name 'wrangler.toml' -not -path '*/node_modules/*' -not -path '*/.git/*' | sort)

if [ -z "$WRANGLER_FILES" ]; then
  echo "⚠️  No wrangler.toml files found"
  exit 0
fi

echo "Found configs:"
for f in $WRANGLER_FILES; do echo "  $f"; done
echo ""

# --- 1. Resource ID format validation ---
echo "--- Resource ID Format ---"
while IFS= read -r wfile; do
  # Check KV namespace IDs (should be 32-char hex)
  while IFS= read -r line; do
    id=$(echo "$line" | grep -oP 'id\s*=\s*"\K[^"]+' || true)
    if [ -n "$id" ] && [ ${#id} -ne 32 ]; then
      # Could be a preview_id or some other format, check if it looks like hex
      if echo "$id" | grep -qP '^[0-9a-f]+$'; then
        echo "  ⚠️  $wfile: KV ID '$id' is ${#id} chars (expected 32)"
        WARNINGS=$((WARNINGS + 1))
      fi
    fi
  done < <(grep -A1 'kv_namespaces' "$wfile" | grep 'id\s*=' || true)

  # Check D1 database IDs (should be UUID format)
  while IFS= read -r line; do
    id=$(echo "$line" | grep -oP 'database_id\s*=\s*"\K[^"]+' || true)
    if [ -n "$id" ]; then
      if ! echo "$id" | grep -qP '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'; then
        echo "  ❌ $wfile: D1 database_id '$id' is not valid UUID format"
        ERRORS=$((ERRORS + 1))
      fi
    fi
  done < <(grep 'database_id' "$wfile" || true)
done <<< "$WRANGLER_FILES"
echo ""

# --- 2. Worker name conflicts ---
echo "--- Worker Name Uniqueness ---"
NAMES=""
while IFS= read -r wfile; do
  name=$(grep -oP '^name\s*=\s*"\K[^"]+' "$wfile" || true)
  if [ -n "$name" ]; then
    if echo "$NAMES" | grep -q "^${name}|"; then
      existing=$(echo "$NAMES" | grep "^${name}|" | cut -d'|' -f2)
      # Root + apps/bridge sharing a name is a known monorepo pattern (warning, not error)
      if { [ "$wfile" = "./wrangler.toml" ] || [ "$wfile" = "./apps/bridge/wrangler.toml" ]; } && \
         { [ "$existing" = "./wrangler.toml" ] || [ "$existing" = "./apps/bridge/wrangler.toml" ]; }; then
        echo "  ⚠️  Root and apps/bridge both use worker name '$name'"
        echo "     Deploy from root uses root config; deploy from apps/bridge uses bridge config."
        echo "     Ensure only one path deploys to production."
        WARNINGS=$((WARNINGS + 1))
      else
        echo "  ❌ Worker name '$name' declared in both $existing and $wfile"
        ERRORS=$((ERRORS + 1))
      fi
    fi
    NAMES="${NAMES}${name}|${wfile}"$'\n'
  fi
done <<< "$WRANGLER_FILES"
echo ""

# --- 3. Cross-config divergence (root ↔ apps/bridge) ---
echo "--- Config Divergence (root ↔ apps/bridge) ---"
if [ -f "./wrangler.toml" ] && [ -f "./apps/bridge/wrangler.toml" ]; then
  ROOT_COMPAT=$(grep -oP 'compatibility_date\s*=\s*"\K[^"]+' ./wrangler.toml || echo "unset")
  BRIDGE_COMPAT=$(grep -oP 'compatibility_date\s*=\s*"\K[^"]+' ./apps/bridge/wrangler.toml || echo "unset")
  if [ "$ROOT_COMPAT" != "$BRIDGE_COMPAT" ]; then
    echo "  ⚠️  compatibility_date divergence: root='$ROOT_COMPAT' vs bridge='$BRIDGE_COMPAT'"
    WARNINGS=$((WARNINGS + 1))
  fi

  ROOT_FLAGS=$(grep 'compatibility_flags' ./wrangler.toml || echo "unset")
  BRIDGE_FLAGS=$(grep 'compatibility_flags' ./apps/bridge/wrangler.toml || echo "unset")
  if [ "$ROOT_FLAGS" != "$BRIDGE_FLAGS" ]; then
    echo "  ⚠️  compatibility_flags divergence:"
    echo "     root:   $ROOT_FLAGS"
    echo "     bridge: $BRIDGE_FLAGS"
    WARNINGS=$((WARNINGS + 1))
  fi

  ROOT_OBS=$(grep -c '\[observability\]' ./wrangler.toml || true)
  BRIDGE_OBS=$(grep -c '\[observability\]' ./apps/bridge/wrangler.toml || true)
  if [ "$ROOT_OBS" != "$BRIDGE_OBS" ]; then
    echo "  ⚠️  [observability] block present in root but missing from apps/bridge"
    WARNINGS=$((WARNINGS + 1))
  fi

  # Check binding parity (KV, D1, R2, Queues)
  for binding_type in "kv_namespaces" "d1_databases" "r2_buckets"; do
    ROOT_BINDINGS=$(grep -A1 "$binding_type" ./wrangler.toml | grep 'binding\s*=' | grep -oP '"\K[^"]+' | sort || true)
    BRIDGE_BINDINGS=$(grep -A1 "$binding_type" ./apps/bridge/wrangler.toml | grep 'binding\s*=' | grep -oP '"\K[^"]+' | sort || true)
    if [ "$ROOT_BINDINGS" != "$BRIDGE_BINDINGS" ]; then
      root_only=$(comm -23 <(echo "$ROOT_BINDINGS") <(echo "$BRIDGE_BINDINGS") | tr '\n' ', ')
      bridge_only=$(comm -13 <(echo "$ROOT_BINDINGS") <(echo "$BRIDGE_BINDINGS") | tr '\n' ', ')
      if [ -n "$root_only" ]; then
        echo "  ⚠️  $binding_type bindings in root only: $root_only"
        WARNINGS=$((WARNINGS + 1))
      fi
      if [ -n "$bridge_only" ]; then
        echo "  ⚠️  $binding_type bindings in bridge only: $bridge_only"
        WARNINGS=$((WARNINGS + 1))
      fi
    fi
  done
fi
echo ""

# --- 4. Cron triggers without scheduled() handler ---
echo "--- Cron / Handler Alignment ---"
while IFS= read -r wfile; do
  HAS_CRON=$(grep -c '\[triggers\]' "$wfile" || true)
  if [ "$HAS_CRON" -gt 0 ]; then
    # Find the main entrypoint
    MAIN=$(grep -oP '^main\s*=\s*"\K[^"]+' "$wfile" || true)
    DIR=$(dirname "$wfile")
    ENTRY="${DIR}/${MAIN}"

    if [ -f "$ENTRY" ]; then
      HAS_SCHEDULED=$(grep -c 'scheduled\s*(' "$ENTRY" || true)
      if [ "$HAS_SCHEDULED" -eq 0 ]; then
        echo "  ⚠️  $wfile defines cron triggers but $ENTRY has no scheduled() handler"
        echo "     Crons will fire but silently no-op, wasting invocations."
        WARNINGS=$((WARNINGS + 1))
      fi
    fi
  fi
done <<< "$WRANGLER_FILES"
echo ""

# --- 5. Env interface ↔ wrangler binding alignment ---
echo "--- Env Interface ↔ Wrangler Bindings ---"
while IFS= read -r wfile; do
  MAIN=$(grep -oP '^main\s*=\s*"\K[^"]+' "$wfile" || true)
  DIR=$(dirname "$wfile")
  ENTRY="${DIR}/${MAIN}"

  if [ ! -f "$ENTRY" ]; then
    continue
  fi

  # Extract binding names from wrangler.toml (active, uncommented)
  WRANGLER_BINDINGS=$(grep -P '^\s*binding\s*=' "$wfile" | grep -oP '"\K[^"]+' | sort -u)

  # Extract Env interface properties from the TypeScript file
  ENV_PROPS=$(awk '
    /^interface Env/ { capture=1; next }
    capture && /^\}/ { capture=0 }
    capture {
      gsub(/^[[:space:]]+/, "")
      split($0, parts, /[[:space:]:]/)
      prop = parts[1]
      if (prop ~ /^[A-Z_][A-Z0-9_]*$/) print prop
    }
  ' "$ENTRY" | sort -u)

  if [ -n "$WRANGLER_BINDINGS" ] && [ -n "$ENV_PROPS" ]; then
    wrangler_only=$(comm -23 <(echo "$WRANGLER_BINDINGS") <(echo "$ENV_PROPS") || true)
    env_only=$(comm -13 <(echo "$WRANGLER_BINDINGS") <(echo "$ENV_PROPS") || true)

    if [ -n "$wrangler_only" ]; then
      echo "  ⚠️  $wfile: bindings in wrangler but not in Env interface:"
      echo "$wrangler_only" | sed 's/^/       /'
      WARNINGS=$((WARNINGS + 1))
    fi
    if [ -n "$env_only" ]; then
      # Filter out non-binding env vars (secrets, vars)
      real_missing=""
      for prop in $env_only; do
        # Check if it's defined as a [vars] entry
        is_var=$(grep -A5 '^\[vars\]' "$wfile" | grep -c "$prop" || true)
        if [ "$is_var" -eq 0 ]; then
          # Could be a secret (set via wrangler secret put) — warn, don't error
          real_missing="${real_missing}${prop} "
        fi
      done
      if [ -n "$real_missing" ]; then
        echo "  ℹ️  $wfile: Env properties not in wrangler bindings (may be secrets):"
        echo "     $real_missing"
      fi
    fi
  fi
done <<< "$WRANGLER_FILES"
echo ""

# --- 6. Summary ---
echo "=== Summary ==="
echo "  Errors:   $ERRORS"
echo "  Warnings: $WARNINGS"

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "❌ FAIL: $ERRORS error(s) found — these will break deploys."
  exit 1
else
  echo ""
  echo "✅ PASS: No blocking errors. $WARNINGS warning(s) logged for review."
fi
