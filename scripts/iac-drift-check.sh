#!/usr/bin/env bash
# iac-drift-check.sh — Validates wrangler.toml bindings against infra/iac-manifest.json
# Exit 1 on any drift detected.
set -euo pipefail

MANIFEST="infra/iac-manifest.json"
ERRORS=0

if [ ! -f "$MANIFEST" ]; then
  echo "ERROR: IaC manifest not found at $MANIFEST"
  exit 1
fi

# Iterate over each worker in the manifest
for worker in $(jq -r '.workers | keys[]' "$MANIFEST"); do
  toml_file=$(jq -r ".workers[\"$worker\"].file" "$MANIFEST")

  if [ ! -f "$toml_file" ]; then
    echo "FAIL [$worker]: wrangler file $toml_file not found"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  echo "--- Checking worker: $worker ($toml_file) ---"

  # Check required KV bindings
  for kv in $(jq -r ".workers[\"$worker\"].required_kv[]?" "$MANIFEST"); do
    if ! grep -q "binding = \"$kv\"" "$toml_file"; then
      echo "FAIL [$worker]: missing KV binding '$kv' in $toml_file"
      ERRORS=$((ERRORS + 1))
    else
      echo "  OK: KV binding '$kv'"
    fi
  done

  # Check required D1 bindings
  for d1 in $(jq -r ".workers[\"$worker\"].required_d1[]?" "$MANIFEST"); do
    if ! grep -q "binding = \"$d1\"" "$toml_file"; then
      echo "FAIL [$worker]: missing D1 binding '$d1' in $toml_file"
      ERRORS=$((ERRORS + 1))
    else
      echo "  OK: D1 binding '$d1'"
    fi
  done

  # Check required R2 bindings
  for r2 in $(jq -r ".workers[\"$worker\"].required_r2[]?" "$MANIFEST"); do
    if ! grep -q "binding = \"$r2\"" "$toml_file"; then
      echo "FAIL [$worker]: missing R2 binding '$r2' in $toml_file"
      ERRORS=$((ERRORS + 1))
    else
      echo "  OK: R2 binding '$r2'"
    fi
  done

  # Check required queue bindings
  for q in $(jq -r ".workers[\"$worker\"].required_queues[]?" "$MANIFEST"); do
    if ! grep -q "binding = \"$q\"" "$toml_file"; then
      echo "FAIL [$worker]: missing queue binding '$q' in $toml_file"
      ERRORS=$((ERRORS + 1))
    else
      echo "  OK: Queue binding '$q'"
    fi
  done

  # Check required service bindings
  for svc in $(jq -r ".workers[\"$worker\"].required_services[]?" "$MANIFEST"); do
    if ! grep -q "binding = \"$svc\"" "$toml_file"; then
      echo "FAIL [$worker]: missing service binding '$svc' in $toml_file"
      ERRORS=$((ERRORS + 1))
    else
      echo "  OK: Service binding '$svc'"
    fi
  done
done

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "IaC drift-check FAILED with $ERRORS error(s)"
  exit 1
else
  echo "IaC drift-check PASSED — all bindings match manifest"
  exit 0
fi
