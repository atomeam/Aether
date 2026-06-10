# ALPHA Gate Specification

## §4.5 Shadow Apply (Collision Check)

For `Kind: Lesson` proposals, the "Shadow Apply" phase is defined as a **Collision Check**.

### Procedure
1. The Reflector queries the `Lessons DB` for high-semantic-similarity matches
2. Check for existing `Inputs hash neighborhood` collisions
3. Check for duplicate `Hash neighborhood` prefixes

### Outcome
| Condition | Result |
|-----------|--------|
| Collision detected | Reject with `CUR_DO_NOT_REPEAT` |
| No collision | Approve `Applier` to proceed |

### Reason Code
```
CUR_DO_NOT_REPEAT     // Lesson already exists (collision)
```

This effectively turns "Shadow Apply" into a Gatekeeper step within the existing `LessonsGate` flow.

---

## §4.6 Dual-Field Lessons Matching

### Hash Neighborhood (Prefix Matching)
- **Field:** `Hash neighborhood`
- **Type:** String (prefix hash)
- **Purpose:** Enable prefix-based matching for Lessons lookups
- **Legacy field:** `Inputs hash neighborhood` preserved for historical data

### Matching Logic
```
1. Extract Hash from new proposal files
2. Query Lessons DB for Hash neighborhood prefix match
3. If match found -> apply history pattern
4. If no match -> pass through (zero-match = pass)
```

### Schema
```typescript
interface Lesson {
  'Hash neighborhood': string;  // NEW: prefix for matching
  'Inputs hash neighborhood': string; // LEGACY: preserved
}
```

---

## §4.7 Co-sign Workflow

### APP_OPERATOR_COSIGN_PENDING State

| Stage | Actor | Action |
|-------|------|--------|
| Curator | Evaluates | Approve → flag `APP_OPERATOR_COSIGN_PENDING` |
| Applier | Checks flag | Halt until Operator signature |
| Operator | Signs | Remove flag, proceed to execution |

### State Flow
```
Proposal → Curator → (risk >= 2) → Set FLAG_APP_OPERATOR_COSIGN_PENDING → HALT
                                                        ↓
                                              Operator Signature → CLEAR → Execute
```

### Reason Codes
- `CUR_ZERO_KEY_MISSING` — Auto-approved (risk 0)
- `CUR_ONE_KEY_MISSING` — User co-sign (risk 1)  
- `CUR_TWO_KEY_MISSING` — Operator co-sign (risk 2) ← NEW
- `CUR_THREE_KEY_ESCALATE` — Full council (risk 3)

---

## §4.8 Risk Scoring

| File Category | Score |
|---------------|-------|
| /apps/backend | +2 |
| /packages/governance | +2 |
| /packages/* | +1 |
| security_audit requirement | +2 |
| code_review requirement | +1 |

### Threshold Table
| Risk Score | Required Keys | Reason Code |
|------------|----------------|-------------|
| 0 | 0 | CUR_ZERO_KEY_MISSING |
| 1 | 1 | CUR_ONE_KEY_MISSING |
| 2 | 2 | CUR_TWO_KEY_MISSING |
| 3+ | 3 | CUR_THREE_KEY_ESCALATE |

---

## §4.9 Proposals DB Schema

```typescript
interface Proposal {
  id: string;
  title: string;
  type: 'feature' | 'fix' | 'chore' | 'docs';
  status: 'draft' | 'pending_review' | 'pending_operator_cosign' | 'approved' | 'denied' | 'merged';
  filesOrPagesTouched: string[];
  requires: string[];
  reason?: string; // e.g., CUR_TWO_KEY_MISSING
  summary: string;
  // Operator co-sign fields
  operatorSignedAt?: number;   // timestamp when signed
  operatorSignedBy?: string; // who signed
}
```

---

## §4.10 Lessons DB Schema

```typescript
interface Lesson {
  id: string;
  proposalId?: string;
  'Hash neighborhood': string;      // NEW: prefix matching
  'Inputs hash neighborhood': string; // LEGACY: preserved
  outcome: 'success' | 'failure' | 'partial' | 'pending_operator_cosign';
  filesAffected: string[];
  timestamp: number;
}
```

---

*Spec version: 1.0.0 | Updated: 2026-05-19*