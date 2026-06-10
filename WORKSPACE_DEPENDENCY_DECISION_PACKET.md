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
- Branch: prototype/pnpm-workspaces
- Change: Create pnpm-workspace.yaml, migrate lockfile format
- Result: TBD

### Evidence
- Not yet attempted

---

## Recommendation
**RECOMMEND: Option B (pnpm workspaces)**

### Rationale
1. Option A is blocked by npm internal errors
2. pnpm is designed for monorepos and handles workspace dependencies natively
3. pnpm lockfile format is more robust and doesn't have the corruption issues seen with npm
4. pnpm is faster and more disk-efficient for large monorepos

### Next Steps
1. Create pnpm-workspace.yaml configuration
2. Run pnpm install to generate pnpm-lock.yaml
3. Test CI pipeline with pnpm
4. If successful, commit and create PR

### External Action Required
One-word decision: "pnpm" (to proceed with Option B)

---

## Tool Radar
- npm v11.13.0: Failing with internal errors on this monorepo
- pnpm: Not yet tested, but designed for monorepos
