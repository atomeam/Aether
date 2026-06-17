# Project Investigation Report: Aether, ALPHA, and ALPHA-1

## Executive Summary

This document summarizes the investigation into three related projects in the AtoMind ecosystem and provides recommendations for consolidation.

## Key Findings

### Project Relationship

These three projects represent **different stages of a consolidation effort**:

1. **Aether** (v1.0.0) - A mature, feature-rich monorepo with 40+ packages
2. **ALPHA** (v0.0.0) - A standalone AI Studio app with crew system and self-modification capabilities
3. **ALPHA-1** (v0.0.0) - The **canonical consolidated monorepo** that merges Aether, ALPHA, and other legacy repos

**ALPHA-1 is the intended future state.** It's explicitly designed to consolidate these projects into a single trust-first ecosystem.

### Project Purposes

| Project | Purpose | Status | Version | Package Manager | Node Version |
|---------|---------|--------|---------|-----------------|--------------|
| **Aether** | ALPHA Stack monorepo with Nexus Gateway, MCP, Neural Bridge, UI curator | Mature/Active | 1.0.0 | npm workspaces | ≥18.0.0 |
| **ALPHA** | AI Studio app with crew system, self-modification, growth engine | Standalone/Experimental | 0.0.0 | npm (single package) | unspecified |
| **ALPHA-1** | **Consolidated monorepo** merging Aether + HomeBase + atomarcade-bridge + Crypto-Cryptids | Phase 0 (skeleton) | 0.0.0 | pnpm 9 workspaces | ≥22 |

### Consolidation Plan

According to `ALPHA-1/docs/MIGRATION.md`, ALPHA-1 explicitly merges:
- `atomeam/Aether` → Nexus Gateway, MCP, Neural Bridge
- `atomeam/HomeBase-` → Alpha loop (Curator/Applier), 8 prompt endpoints
- `atomeam/atomarcade-bridge` → PowerShell bridge, Notion command bus, RetroArch UDP
- `atomeam/Crypto-Cryptids` → Python RPG game (isolated)

## Recommendations

### Immediate Actions

1. **Archive Aether and ALPHA as read-only mirrors**
   - Move to `archive/aether/` and `archive/alpha/` in ALPHA-1
   - Update README to point users to ALPHA-1
   - Rationale: Prevent accidental development in superseded repos

2. **Complete ALPHA-1 Phase 0 skeleton**
   - Verify all workspace tooling (pnpm, Turbo, ESLint, Prettier, husky)
   - Ensure CI/CD pipeline is configured

3. **Document the consolidation in a top-level CONSOLIDATION.md**
   - Explain why three projects exist
   - Map old code to new locations
   - Provide migration guide for any external consumers

### Strategic Recommendation

**ALPHA-1 is the canonical future state** — all development should target it. The automation orchestrator has been configured to monitor all three projects during the transition period.

## Automation Integration

The current automation orchestrator (`automation_consolidation_v2/`) has been configured to:

1. **Monitor all projects** via `project_health_check` workflow
2. **Track service availability** across Aether, ALPHA, ALPHA-1, and HomeBase
3. **Provide unified logging** for all automation tasks
4. **Support gradual migration** through wrapper workflows

This allows for a smooth transition while maintaining operational visibility.

## Next Steps

1. Review ALPHA-1's `MIGRATION.md` for detailed phase roadmap
2. Decide on consolidation strategy (aggressive vs conservative vs hybrid)
3. Begin archiving Aether and ALPHA once ALPHA-1 Phase 1-2 are complete
4. Update automation workflows to target ALPHA-1 endpoints as they become available

---

**Generated**: 2026-05-26  
**Investigation Method**: Automated code analysis and documentation review