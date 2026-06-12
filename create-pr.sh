#!/usr/bin/env bash
set -euo pipefail
git fetch origin main && git checkout -b ${1:-relocate-billing} origin/main
git add src/billing-handler.js .github/workflows/relocate-billing.yml .github/workflows/wix-publish.yml billing-test-commands.md wix-fallback-integration.md wix/velo/lead-forwarder.js wix/velo/checkout-widget.html tests/billing-handler.test.js health-monitor-delta.md issue-120-wix-rail.md operator-checklist-stripe.md checkout-endpoint.js onboarding-emails.md
git commit -m "Relocate billing handler & add Wix sell-lane" && git push --set-upstream origin $BRANCH
