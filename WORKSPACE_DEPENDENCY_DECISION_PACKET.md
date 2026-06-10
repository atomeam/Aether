# Workspace Dependency Resolution - Decision Packet

## Context
Blocker #2: Fix workspace dependency / package-lock debt
Impact: CI checks failing (3 of 4 required) - blocks PR #101, #105, #106

## Option A: npm workspaces with file: dependencies

### Prototype Attempt
- Branch: prototype/npm-file-dependencies
- Change: Replace `workspace:*` with `file:` in apps/aether-verifier/package.json
- Result: FAIL

### Evidence
1. Initial npm install failed with "Unsupported URL Type 'workspace:'"
2. Replaced `workspace:*` with `file:` dependency
3. Removed corrupted package-lock.json
4. npm install still fails with "Cannot read properties of null (reading 'matches')"

### Error Logs
- Line 15: "shrinkwrap failed to load package-lock.json Expected ',' or '}' after property value in JSON at position 60096"
- Line 225: "npm error Cannot read properties of null (reading 'matches')"

### Conclusion
Option A is NOT viable - npm itself is failing with internal errors even after removing corrupted lockfile.

---

## Option B: pnpm workspaces

### Prototype Attempt
- Branch: prototype/pnpm-workspaces (pushed to remote for reviewer access)
- Changes:
  1. Created pnpm-workspace.yaml
  2. Changed packageManager from npm@10.9.8 to pnpm@11.5.1
  3. Removed package-lock.json
  4. Converted file: dependencies to workspace:* in apps/backend, apps/notion-worker, packages/curator
- Result: FAIL

### Evidence
1. Initial pnpm install failed with "This project is configured to use npm"
2. Changed packageManager to pnpm@11.5.1
3. pnpm install failed with "ERR_PNPM_LINKED_PKG_DIR_NOT_FOUND" for file: dependencies
4. Converted file: dependencies to workspace:*
5. pnpm install failed with "ERR_PNPM_FETCH_404" for @aether/chaos (version range dependency)
6. Analysis: All internal dependencies use version ranges (^1.0.0, *) instead of workspace:*
7. Converting all internal dependencies to workspace:* would require changes to 50+ package.json files

### Error Logs
- Line 1: "[ERROR] This project is configured to use npm"
- Line 1: "[ERR_PNPM_LINKED_PKG_DIR_NOT_FOUND] Could not install from 'C:\Users\adamm\Aether\apps\packages\contracts' as it does not exist"
- Line 1: "[ERR_PNPM_FETCH_404] GET https://registry.npmjs.org/@aether%2Fchaos: Not Found - 404"

### Conclusion
Option B is NOT viable without significant refactoring - requires converting 50+ internal dependencies from version ranges to workspace:* format. This is a large-scale change that affects the entire monorepo structure.

---

## Recommendation
**RECOMMEND: Option C (fix npm lockfile corruption)**

### Rationale
1. Option A (npm with file: dependencies) is blocked by npm internal errors
2. Option B (pnpm workspaces) requires converting 50+ internal dependencies to workspace:* format - large-scale refactoring
3. The root cause is package-lock.json corruption (line 15: "Expected ',' or '}' after property value in JSON at position 60096")
4. Fixing the lockfile corruption directly is the smallest change with highest probability of success

### Next Steps
1. Identify the corrupted entry in package-lock.json (position 60096, line 1909)
2. Manually fix the JSON syntax error
3. Run npm install to regenerate lockfile
4. Test CI pipeline with fixed lockfile
5. If successful, commit and create PR

### External Action Required
One-word decision: "fix-lockfile" (to proceed with Option C)

---

## Tool Radar
- npm v11.13.0: Failing with internal errors due to lockfile corruption
- pnpm v11.5.1: Failed due to version range dependencies requiring workspace:* conversion
