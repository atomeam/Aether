#!/bin/bash
# Branch Consolidation Script
# Automates the consolidation of security branches following the Multi-Agent Coordination Protocol

set -e

echo "=== Branch Consolidation Script ==="
echo "This script automates the consolidation of security branches"
echo ""

# Configuration
TARGET_BRANCH="security-consolidation"
BRANCHES_TO_MERGE=(
    "security-fixes-main"
    "feature/clerk-integration"
    "feature/bridge-auth-lockdown"
    "feat/migrations-0003-runs-ledger"
    "feature/bridge-auth-lockdown-v2"
)

# Step 1: Fetch latest
echo "Step 1: Fetching latest from origin..."
git fetch origin
echo "✓ Fetched latest"
echo ""

# Step 2: Create or reset target branch
echo "Step 2: Setting up target branch..."
if git show-ref --verify --quiet refs/heads/$TARGET_BRANCH; then
    git checkout $TARGET_BRANCH
    git reset --hard origin/main
else
    git checkout -b $TARGET_BRANCH origin/main
fi
echo "✓ Target branch ready: $TARGET_BRANCH"
echo ""

# Step 3: Cherry-pick branches in order
echo "Step 3: Cherry-picking branches in order..."
for branch in "${BRANCHES_TO_MERGE[@]}"; do
    echo "Processing branch: $branch"
    
    # Check if branch exists
    if ! git show-ref --verify --quiet refs/remotes/origin/$branch; then
        echo "⚠ Branch $branch not found in origin, skipping"
        continue
    fi
    
    # Cherry-pick with conflict handling
    if git cherry-pick origin/$branch; then
        echo "✓ Successfully cherry-picked $branch"
    else
        echo "✗ Conflict in $branch, manual resolution required"
        echo "Stopping automation for manual conflict resolution"
        exit 1
    fi
    
    echo ""
done

echo "✓ All branches cherry-picked successfully"
echo ""

# Step 4: Build gate
echo "Step 4: Running build gate..."
npm run build -w @aether/backend
if [ $? -eq 0 ]; then
    echo "✓ Build gate passed"
else
    echo "✗ Build gate failed"
    exit 1
fi
echo ""

# Step 5: Push to origin
echo "Step 5: Pushing to origin..."
git push origin $TARGET_BRANCH --force-with-lease
echo "✓ Pushed to origin: $TARGET_BRANCH"
echo ""

echo "=== Branch Consolidation Complete ==="
echo "Next steps:"
echo "1. Review the consolidated branch: $TARGET_BRANCH"
echo "2. Run runtime tests"
echo "3. Create PR for review"
echo "4. Merge to main after approval"
