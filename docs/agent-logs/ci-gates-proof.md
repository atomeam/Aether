# CI Gates Proof — Deterministic Failure & Recovery

**PR**: #77  
**Branch**: `devin/1780617015-ci-gates-proof`  
**Date**: 2026-06-04  

---

## Gates Under Test

| # | Gate | CI Job Name | Script / Action |
|---|------|------------|-----------------|
| 1 | **Gitleaks** | `Gitleaks` | `gitleaks/gitleaks-action@v2` + `.gitleaks.toml` |
| 2 | **IaC Drift Check** | `IaC Drift Check` | `scripts/iac-drift-check.sh` + `infra/iac-manifest.json` |
| 3 | **Strategy Metrics Verify** | `Strategy Metrics Verify` | `scripts/strategy-metrics-verify.mjs` + `infra/strategy-metrics.json` |

All three are independent jobs in `.github/workflows/ci.yml`. The `Build` job depends on all five gates (test, typecheck, gitleaks, iac-drift-check, strategy-metrics-verify).

---

## Expected-Fail Commit

**Commit**: `b7fe079` (`test(ci-gates): expected-fail — trigger all three gates`)

### Gate 1: Gitleaks

**Injection**: `tests/ci-gates-expected-fail.env` containing known-safe fake AWS key:
```
AWS_ACCESS_KEY_ID=AKIAQFAKECIGATE12345
```

**CI Failure Evidence** (job `Gitleaks`, job_id `79637679593`):
```
Finding:     AWS_ACCESS_KEY_ID=REDACTED
Secret:      REDACTED
RuleID:      aws-access-token
Entropy:     3.621928
File:        tests/ci-gates-expected-fail.env
Line:        4
...
11:53PM WRN leaks found: 1
##[warning]🛑Leaks detected, see job summary for details
```

### Gate 2: IaC Drift Check

**Injection**: Added `"ACTIONS_DISPATCH"` to `infra/iac-manifest.json` → `workers.aether.required_services`. This binding does not exist in `wrangler.toml`.

**CI Failure Evidence** (job `IaC Drift Check`, job_id `79637679588`):
```
FAIL [aether]: missing service binding 'ACTIONS_DISPATCH' in wrangler.toml
IaC drift-check FAILED with 1 error(s)
##[error]Process completed with exit code 1.
```

### Gate 3: Strategy Metrics Verify

**Injection**: Added `"percentile"` to `infra/strategy-metrics.json` → `required_exports`. This function is not exported by `packages/metrics/src/index.ts`.

**CI Failure Evidence** (job `Strategy Metrics Verify`, job_id `79637679621`):
```
FAIL: missing required export 'percentile'
Strategy metrics verify FAILED with 1 error(s)
##[error]Process completed with exit code 1.
```

---

## Restore-Green Commit

**Commit**: final commit on branch (`ci: restore all gates to green`)

Changes:
1. **Gitleaks**: Deleted `tests/ci-gates-expected-fail.env` (fake token removed)
2. **IaC Drift**: Removed `"ACTIONS_DISPATCH"` from `infra/iac-manifest.json` → manifest matches `wrangler.toml`
3. **Strategy Metrics**: Removed `"percentile"` from `infra/strategy-metrics.json` → config matches actual exports

All three gates pass on this commit.

---

## Summary

Each gate was proven to:
1. **Detect** the specific failure mode it was designed for
2. **Fail deterministically** with a clear, actionable error message
3. **Recover cleanly** when the issue is resolved

No production code was modified. The fake AWS key (`AKIAQFAKECIGATE12345`) is a known-safe pattern that was fully removed in the final commit.
