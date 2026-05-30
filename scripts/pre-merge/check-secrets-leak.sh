#!/usr/bin/env bash
# Scan for potential hardcoded secrets, API keys, and tokens in source files.
# Only checks tracked files (git ls-files) to avoid node_modules/dist.

set -euo pipefail

ERRORS=0

echo "=== Secrets Leak Check ==="

# Patterns that indicate hardcoded secrets (high confidence)
# Each pattern: regex|description
PATTERNS=(
  'sk-[a-zA-Z0-9]{20,}|OpenAI API key'
  'sk_live_[a-zA-Z0-9]{20,}|Stripe live secret key'
  'sk_test_[a-zA-Z0-9]{20,}|Stripe test secret key'
  'xoxb-[0-9]{10,}-[a-zA-Z0-9]{20,}|Slack bot token'
  'xoxp-[0-9]{10,}-[a-zA-Z0-9]{20,}|Slack user token'
  'ghp_[a-zA-Z0-9]{36}|GitHub personal access token'
  'gho_[a-zA-Z0-9]{36}|GitHub OAuth token'
  'AKIA[0-9A-Z]{16}|AWS access key ID'
  'AIza[0-9A-Za-z\-_]{35}|Google API key'
)

# File extensions to check
EXTENSIONS='ts|tsx|js|jsx|json|yml|yaml|toml|env|md'

# Get list of tracked files
FILES=$(git ls-files 2>/dev/null | grep -P "\.(${EXTENSIONS})$" | grep -v 'package-lock.json' | grep -v 'node_modules' || true)

if [ -z "$FILES" ]; then
  echo "  No trackable files found"
  exit 0
fi

for pattern_desc in "${PATTERNS[@]}"; do
  pattern=$(echo "$pattern_desc" | cut -d'|' -f1)
  desc=$(echo "$pattern_desc" | cut -d'|' -f2)

  matches=$(echo "$FILES" | xargs grep -lnP "$pattern" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    echo "  ❌ Potential $desc found in:"
    echo "$matches" | sed 's/^/       /'
    ERRORS=$((ERRORS + 1))
  fi
done

# Check for .env files that shouldn't be committed
ENV_FILES=$(git ls-files | grep -P '\.env$|\.env\.local$|\.env\.production$' || true)
if [ -n "$ENV_FILES" ]; then
  echo "  ❌ .env file(s) committed to repo:"
  echo "$ENV_FILES" | sed 's/^/       /'
  ERRORS=$((ERRORS + 1))
fi

# Check for wrangler secrets in plaintext (vars that should be secrets)
SECRET_VARS=("API_KEY" "SECRET" "TOKEN" "PASSWORD" "PRIVATE_KEY")
for wfile in $(find . -name 'wrangler.toml' -not -path '*/node_modules/*' 2>/dev/null); do
  for sv in "${SECRET_VARS[@]}"; do
    in_vars=$(awk '/^\[vars\]/,/^\[/' "$wfile" | grep -i "$sv" || true)
    if [ -n "$in_vars" ]; then
      echo "  ⚠️  $wfile: '$sv' pattern found in [vars] section — should this be a secret?"
      echo "     $in_vars"
    fi
  done
done

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "❌ FAIL: Found $ERRORS potential secret leak(s)"
  exit 1
else
  echo "✅ PASS: No hardcoded secrets detected"
fi
