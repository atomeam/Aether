# Alpha Loop Hardening Specification

> **Status**: Draft | **Version**: 1.0.0 | **Date**: 2026-05-19

This document specifies safeguards to harden the Alpha autonomous loop against kinetic feedback — runaway self-amplification that could degrade system safety or quality.

---

## 1. Failure Modes

The Alpha loop must resist these failure modes:

| Mode | Description | Detection |
|------|-------------|-----------|
| **Runaway Proposals** | Self-amplifying proposal generation — Alpha proposes changes that trigger more proposals | Proposal chain depth > 5 within single session |
| **Compounding Bad Edits** | Successive edits that degrade code quality (entropy growth) | Per-file edit count > 3 in 1 hour |
| **Hot-Loop Churn** | Rapid cycling between similar proposals without convergence | Same/similar proposal repeated > 3x |
| **Surface-Area Creep** | Expanding codebase surface without corresponding value | Files changed > threshold per cycle |

### Checklists

**Runaway Proposals**
- [ ] Track proposal chain depth per session
- [ ] Block submissions when depth > 5
- [ ] Log chain-breaking events

**Compounding Bad Edits**
- [ ] Monitor per-file edit velocity
- [ ] Flag files with > 3 edits/hour
- [ ] Require human review for flagged files

**Hot-Loop Churn**
- [ ] Deduplicate near-identical proposals
- [ ] Cool-down period after repeated patterns
- [ ] Check Lessons DB before submission

**Surface-Area Creep**
- [ ] Cap files touched per cycle
- [ ] Alert when cap threshold approached

---

## 2. Blast-Radius Caps

Per-cycle limits to contain the blast radius of any single Alpha execution:

| Metric | Cap | Notes |
|--------|-----|-------|
| `MAX_FILES_TOUCHED_PER_CYCLE` | 3 | Hard limit |
| `MAX_SURFACES_WRITTEN_PER_CYCLE` | 3 | Files with write operations |
| `MAX_CYCLES_PER_DAY` | 20 | Daily hard cap (resets midnight UTC) |
| `MAX_CONCURRENT_PROPOSALS` | 2 | Proposals in flight |

### Implementation

```typescript
interface BlastRadiusCaps {
  maxFilesTouchedPerCycle: number;
  maxSurfacesWrittenPerCycle: number;
  maxConcurrentProposals: number;
  maxCyclesPerDay: number;
}

const DEFAULT_CAPS: BlastRadiusCaps = {
  maxFilesTouchedPerCycle: 5,
  maxSurfacesWrittenPerCycle: 3,
  maxConcurrentProposals: 2,
  maxCyclesPerDay: 20,
};
```

### Checklists

- [ ] Enforce maxFilesTouchedPerCycle in Executor
- [ ] Track surfaces written per cycle
- [ ] Queue proposals when maxConcurrentProposals reached
- [ ] Latch at maxCyclesPerDay; require reset

---

## 3. Canaries

Low-stakes surfaces where Alpha applies before broader rollout:

| Canary | Purpose | Location | Wait Time |
|--------|---------|----------|----------|
| **Sandbox Doc** | Text-only validation | `/docs/sandbox/` | 1h (low risk) |
| **Test DB** | Faux data store for integration testing | `./logs/canary.db` | 24h (med+) |

### Tiered Wait by Risk

| Risk Level | Wait Time | Trigger |
|------------|----------|----------|
| Low (0-1) | 1 hour | Files touched ≤ 2 |
| Medium (2) | 4 hours | Files touched = 3 |
| High (3+) | 24 hours | Files touched > 3 or writes to db |

### Canary Flow

```
User Request → Alpha → [CANARY STAGE]
                     ↓
              Apply to sandbox surfaces
                     ↓
              Tiered wait (1h/4h/24h based on risk)
                     ↓
              If no alerts → Promote to production
                     ↓
              If alert → Quarantine + manual review
```

### Checklists

- [ ] Create sandbox doc directory
- [ ] Implement canary detection hooks
- [ ] Add promotion delay (1 hour)
- [ ] Alert on canary failure

---

## 4. Auto-Revert

Rollback signals and mechanism:

### Signals Triggering Revert

> **Decision**: Union — any signal from either threshold set fires revert

| Signal | Threshold | Action |
|--------|-----------|--------|
| **Error Rate** | > 10% errors in last 10 cycles | Soft revert (last cycle) |
| **Curator Denials** | > 5 consecutive denials | Hard stop + review |
| **Lesson-DB Flags** | > 2 collision matches | Reject + quarantine |
| **Canary Alerts** | Any critical alert | Immediate revert |
| **Runtime Drift** | > 3 files differ from checkpoint | Quarantine |

### Revert Mechanism

```typescript
interface RevertSignal {
  type: 'error_rate' | 'curator_denial' | 'lesson_db' | 'canary_alert';
  timestamp: number;
  context: Record<string, unknown>;
}

async function autoRevert(cycleId: string, signal: RevertSignal): Promise<void> {
  // 1. Identify last stable checkpoint
  // 2. Revert files to checkpoint state
  // 3. Log revert event
  // 4. Alert Council
}
```

### Checklists

- [ ] Implement error rate tracking
- [ ] Track Curator denial streaks
- [ ] Query Lesson DB for collision flags
- [ ] Implement revert to last checkpoint
- [ ] Add revert logging

---

## 5. Quarantine

Holding state for proposals/outputs that fail validation:

| State | Description |
|-------|-------------|
| `quarantine` | Failed validation; inspectable but inert |
| `released` | Manually cleared for retry |
| `expired` | Auto-purged after 7 days |

### Quarantine Interface

```typescript
interface QuarantinedItem {
  id: string;
  type: 'proposal' | 'output';
  failedStage: 'preflight' | 'curator' | 'lessons' | 'canary';
  reason: string;
  quarantinedAt: number;
  status: 'quarantine' | 'released' | 'expired';
}
```

### Checklists

- [ ] Implement quarantine storage
- [ ] Add release workflow (manual)
- [ ] Add expiration (7 days)
- [ ] Expose quarantine UI in API

---

## 6. Pre-Flight + Post-Flight Checks

Extending the Curator gate pattern with lifecycle checks:

### Pre-Flight (Before Alpha Executes)

1. **Input Validation**
   - Validate user promptschema
   - Check against risk scoring rules (§4.8)

2. **Blast-Radius Check**
   - Estimate files to be touched
   - Reject if exceeds caps

3. **Lessons Check**
   - Query for similar past proposals
   - Flag if high similarity

### Post-Flight (After Alpha Executes)

1. **Curator Gate**
   - Run curatedActions() on output
   - Reject if not approved

2. **Output Validation**
   - Syntax/semantic checks
   - TypeScript compilation

3. **Canary Injection**
   - If canary enabled, apply to sandbox first
   - Wait for signal before production

### Checklists

**Pre-Flight**
- [ ] Add input schema validation
- [ ] Integrate risk scoring (§4.8)
- [ ] Add blast-radius estimation
- [ ] Add Lessons pre-check

**Post-Flight**
- [ ] Integrate Curator gate in executor
- [ ] Add TypeScript compilation check
- [ ] Implement canary injection

---

## 7. Integration Points

Existing infrastructure to extend:

| Package | Location | Extension Point |
|---------|----------|----------------|
| `@aether/curator` | `packages/curator/src/index.ts` | Pre/post flight checks |
| `@aether/chaos` | `packages/chaos/src/lessons-gate.ts` | Collision detection |
| `@aether/daemon` | `packages/daemon/src/engine.ts` | Daily caps, loop limits |
| `@aether/mcp-tools` | `packages/mcp-tools/src/index.ts` | Tool-level caps |

---

## 8. Open Questions

- [ ] How to persist checkpoint state for revert?
- [ ] What is the right canary promotion delay?
- [ ] How to handle partial revert (some files ok, some bad)?
- [ ] Who has authority to release from quarantine?

---

*End of Spec*