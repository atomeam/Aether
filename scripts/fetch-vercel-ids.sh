#!/bin/bash
# fetch-vercel-ids.sh
# Fetches Vercel organization and project IDs for CI setup
# Usage: VERCEL_TOKEN=your_token ./fetch-vercel-ids.sh

set -e

TOKEN="${VERCEL_TOKEN:-}"
if [ -z "$TOKEN" ]; then
  echo "Error: VERCEL_TOKEN not set"
  echo "Usage: VERCEL_TOKEN=your_token ./fetch-vercel-ids.sh"
  exit 1
fi

echo "=== Vercel IDs for GitHub Actions Secrets ==="
echo ""

# Get organization info
echo "Fetching organization info..."
ORG_RESPONSE=$(curl -s "https://api.vercel.com/v2/orgs" \
  -H "Authorization: Bearer $TOKEN")

ORG_ID=$(echo "$ORG_RESPONSE" | jq -r '.orgs[0].id // empty')
ORG_SLUG=$(echo "$ORG_RESPONSE" | jq -r '.orgs[0].slug // empty')

if [ -n "$ORG_ID" ]; then
  echo "VERCEL_ORG_ID: $ORG_ID"
  echo "  (for personal accounts, use @me instead of org ID)"
else
  echo "VERCEL_ORG_ID: <not found - check token permissions>"
fi
echo ""

# Get projects
echo "Fetching projects..."
PROJECTS_RESPONSE=$(curl -s "https://api.vercel.com/v9/projects?teamId=$ORG_ID" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null || \
  curl -s "https://api.vercel.com/v9/projects" \
  -H "Authorization: Bearer $TOKEN")

echo "Available projects:"
echo "$PROJECTS_RESPONSE" | jq -r '.projects[] | "  - \(.name): \(.id)"' 2>/dev/null || echo "  (no projects found or jq not available)"

# Try to find aether project
AETHER_PROJECT=$(echo "$PROJECTS_RESPONSE" | jq -r '.projects[] | select(.name | test("aether|backend|frontend")) | .id' 2>/dev/null | head -1)

if [ -n "$AETHER_PROJECT" ]; then
  echo ""
  echo "VERCEL_PROJECT_ID (aether): $AETHER_PROJECT"
else
  echo ""
  echo "VERCEL_PROJECT_ID: <not found - specify manually from Vercel dashboard>"
fi

echo ""
echo "=== Summary ==="
echo "VERCEL_ORG_ID=${ORG_ID:-<your-org-id>}"
echo "VERCEL_PROJECT_ID=${AETHER_PROJECT:-<your-project-id>}"
echo ""
echo "Add these as GitHub Actions secrets via:"
echo "  gh secret set VERCEL_ORG_ID --body '<value>'"
echo "  gh secret set VERCEL_PROJECT_ID --body '<value>'"