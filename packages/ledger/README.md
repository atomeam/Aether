# @aether/ledger

Shared TypeScript types and Zod schemas for the Aether Runs ledger and RUN-header contract.

## Purpose

This package provides the single source of truth for:
- RUN header contract (for Slack/Notion integration)
- Runs ledger D1 schema
- Task close payload schema
- Registry entry schema

Both `apps/bridge` and `apps/notion-worker` import from this package to ensure type consistency across the coordinated architecture.

## Schemas

### RUN_HEADER_SCHEMA
Defines the standard RUN header format for Slack messages and Notion updates:
```typescript
{
  RUN: string,
  TASK: string,
  TYPE: 'COUNCIL' | 'HUMAN' | 'AUTOMATED' | 'SLACK',
  STARTED: string (ISO datetime),
  OWNER: 'Council' | 'Human',
  STATUS: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED'
}
```

### RUN_ROW_SCHEMA
D1 runs table schema with idempotency on `run_id`.

### TASK_CLOSE_PAYLOAD_SCHEMA
Payload for task auto-close with artifact links.

### REGISTRY_ENTRY_SCHEMA
Automation Center registry entry schema.

## Usage

```typescript
import { RUN_HEADER_SCHEMA, RUN_ROW_SCHEMA } from '@aether/ledger';

// Validate a RUN header
const header = RUN_HEADER_SCHEMA.parse(rawHeader);

// Type inference
type RunHeader = z.infer<typeof RUN_HEADER_SCHEMA>;
```

## D1 Table Schemas

The package exports SQL schemas for:
- `RUNS_TABLE_SCHEMA` - runs table with indexes
- `REGISTRY_TABLE_SCHEMA` - registry table with indexes

Use these for migration files in both workers.
