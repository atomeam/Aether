#!/usr/bin/env bash
# Check for duplicate object-literal properties in TypeScript files.
# Catches the TS1117 class of bug (e.g., Devin merge introduced duplicate
# `ended`/`result` properties that broke typecheck).
#
# Approach: parse object literals for repeated property keys on adjacent lines.
# This is a heuristic — not a full TS parser — but catches the exact failure mode.

set -euo pipefail

ERRORS=0

echo "=== Duplicate Property Check ==="

# Find all .ts/.tsx files (excluding node_modules, dist, .git)
while IFS= read -r file; do
  # Use awk to detect duplicate property keys in object literals
  # Looks for `key:` or `key,` patterns within {} blocks
  dupes=$(awk '
    /\{/ { depth++ }
    /\}/ {
      # Check for dupes in current block
      for (k in seen) {
        if (seen[k] > 1) {
          printf "  %s:%d duplicate property \"%s\" (%d occurrences)\n", FILENAME, lines[k], k, seen[k]
          found++
        }
      }
      delete seen
      delete lines
      depth--
    }
    depth > 0 && /^[[:space:]]*[a-zA-Z_$][a-zA-Z0-9_$]*[[:space:]]*[:?,]/ {
      # Extract property name
      match($0, /^[[:space:]]*([a-zA-Z_$][a-zA-Z0-9_$]*)/, arr)
      if (arr[1] != "") {
        key = arr[1]
        # Skip common keywords that look like properties
        if (key != "if" && key != "else" && key != "return" && key != "const" && \
            key != "let" && key != "var" && key != "async" && key != "await" && \
            key != "function" && key != "class" && key != "import" && key != "export" && \
            key != "throw" && key != "new" && key != "case" && key != "break" && \
            key != "continue" && key != "default" && key != "switch" && key != "try" && \
            key != "catch" && key != "finally" && key != "for" && key != "while" && \
            key != "do" && key != "typeof" && key != "delete") {
          seen[key]++
          if (seen[key] == 1) lines[key] = NR
        }
      }
    }
    END {
      # Final block check
      for (k in seen) {
        if (seen[k] > 1) {
          printf "  %s:%d duplicate property \"%s\" (%d occurrences)\n", FILENAME, lines[k], k, seen[k]
          found++
        }
      }
      if (found > 0) exit 1
    }
  ' "$file" 2>/dev/null) && true

  if [ -n "$dupes" ]; then
    echo "$dupes"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find . -name '*.ts' -o -name '*.tsx' | grep -v node_modules | grep -v dist | grep -v '.git/' | sort)

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "❌ FAIL: Found duplicate object properties in $ERRORS file(s)"
  echo "   This is a common merge artifact. Remove the duplicates to fix TS1117."
  exit 1
else
  echo "✅ PASS: No duplicate properties detected"
fi
