# D1 Schema Audit

**Date**: 2026-05-29  
**Scope**: All D1 schema files in Aether repository  
**Database**: aether-bridge-db (ID: f29243db-5b7a-407b-aa38-64091c1e0676)

---

## Schema Files Analyzed

| Migration File | Tables | Status |
|----------------|--------|--------|
| 0001_tasks_audit.sql | tasks, audit_events | ✅ Analyzed |
| 0002_events_council_logs.sql | events, council_logs | ✅ Analyzed |
| 0003_slack_audit_events.sql | slack_audit_events | ✅ Analyzed |
| 0004_processed_slack_events.sql | processed_slack_events | ✅ Analyzed |
| 0005_artifacts.sql | artifacts | ✅ Analyzed |
| 0006_metrics_snapshots.sql | metrics_snapshots | ✅ Analyzed |
| 0007_schema_migrations_backfill.sql | schema_migrations | ✅ Analyzed |
| 0008_runs_registry.sql | runs, registry | ✅ Analyzed |
| notion-worker/0001_runs_registry.sql | runs, registry | ✅ Analyzed |

---

## Schema Issues Found

### 🔴 High Priority Issues

#### 1. artifacts table - Missing index on correlation_id

**Table**: `artifacts` (migration 0005)  
**Issue**: No index on `correlation_id` column  
**Impact**: Slow queries when filtering by correlation_id for artifact retrieval  
**Recommendation**: Add index on correlation_id

```sql
CREATE INDEX IF NOT EXISTS idx_artifacts_correlation_id ON artifacts(correlation_id);
```

#### 2. metrics_snapshots table - No indexes

**Table**: `metrics_snapshots` (migration 0006)  
**Issue**: No indexes at all on the table  
**Impact**: All queries will be full table scans, performance will degrade as data grows  
**Recommendation**: Add indexes on actor_id, source, created_at

```sql
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_actor ON metrics_snapshots(actor_id);
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_source ON metrics_snapshots(source);
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_created ON metrics_snapshots(created_at);
```

### 🟡 Medium Priority Issues

#### 3. Missing Foreign Key Constraints

**Issue**: Several potential FK relationships are not enforced  
**Impact**: Data integrity not enforced, orphaned records possible  
**Recommendation**: Consider adding FK constraints where appropriate

**Potential FK Relationships**:
- `artifacts.correlation_id` → `audit_events.id`
- `slack_audit_events.run_id` → `runs.run_id`
- `council_logs.session_id` → `events.session_id`
- `runs.task_id` → `tasks.id`

**Note**: D1 has limited FK support compared to traditional databases. This may be intentional design choice.

#### 4. tasks table - Missing performance indexes

**Table**: `tasks` (migration 0001)  
**Issue**: No indexes on status or created_at columns  
**Impact**: Slow queries for filtering by status or date ranges  
**Recommendation**: Add indexes for common query patterns

```sql
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at);
```

### 🟢 Low Priority Issues

#### 5. Nullable columns that could be NOT NULL

**Issue**: Some columns are nullable that might benefit from NOT NULL constraints  
**Impact**: Data quality issues if null values are inappropriate  
**Recommendation**: Review business logic and add NOT NULL where appropriate

**Potentially nullable columns to review**:
- `audit_events.correlation_id` - Should this be NOT NULL for all audit events?
- `audit_events.actor_id` - Should this be NOT NULL for all audit events?
- `events.page_id` - Should this be NOT NULL for page-related events?
- `events.database_id` - Should this be NOT NULL for database-related events?
- `events.session_id` - Should this be NOT NULL for session-related events?
- `slack_audit_events.task_url` - Should this be NOT NULL for all slack events?
- `metrics_snapshots.actor_id` - Should this be NOT NULL for all metrics?

---

## Table-by-Table Analysis

### tasks (0001)

**Columns**:
- id: TEXT PRIMARY KEY ✅
- title: TEXT NOT NULL ✅
- description: TEXT DEFAULT '' ✅
- status: TEXT NOT NULL DEFAULT 'pending' ✅
- created_at: TEXT NOT NULL ✅
- updated_at: TEXT NOT NULL ✅

**Indexes**: None ❌  
**Foreign Keys**: None ❌  
**Issues**: Missing indexes on status, created_at

### audit_events (0001)

**Columns**:
- id: TEXT PRIMARY KEY ✅
- correlation_id: TEXT ⚠️ nullable
- event_type: TEXT NOT NULL ✅
- actor_id: TEXT ⚠️ nullable
- source: TEXT NOT NULL DEFAULT 'api' ✅
- ok: INTEGER NOT NULL DEFAULT 1 ✅
- error_code: TEXT
- error_message: TEXT
- input_json: TEXT
- output_json: TEXT
- created_at: TEXT NOT NULL ✅

**Indexes**: event_type, created_at ✅  
**Foreign Keys**: None ❌  
**Issues**: correlation_id, actor_id nullable (may be intentional)

### events (0002)

**Columns**:
- event_id: TEXT PRIMARY KEY ✅
- source: TEXT NOT NULL ✅
- kind: TEXT NOT NULL ✅
- level: TEXT NOT NULL DEFAULT 'info' ✅
- page_id: TEXT ⚠️ nullable
- database_id: TEXT ⚠️ nullable
- payload: TEXT
- session_id: TEXT ⚠️ nullable
- created_at: TEXT NOT NULL ✅

**Indexes**: source, kind, session_id, created_at ✅  
**Foreign Keys**: None ❌  
**Issues**: page_id, database_id, session_id nullable (may be intentional)

### council_logs (0002)

**Columns**:
- session_id: TEXT NOT NULL ✅
- agent_id: TEXT NOT NULL ✅
- role: TEXT NOT NULL ✅
- content: TEXT NOT NULL ✅
- message_id: TEXT PRIMARY KEY ✅
- timestamp: TEXT NOT NULL ✅

**Indexes**: session_id, timestamp ✅  
**Foreign Keys**: None ❌  
**Issues**: None

### slack_audit_events (0003)

**Columns**:
- id: INTEGER PRIMARY KEY AUTOINCREMENT ✅
- run_id: TEXT NOT NULL UNIQUE ✅
- task_url: TEXT ⚠️ nullable
- result: TEXT NOT NULL ✅
- type: TEXT
- env: TEXT
- owner: TEXT
- started_at: TEXT
- ended_at: TEXT
- slack_ts: TEXT
- thread_ts: TEXT
- created_at: TEXT NOT NULL ✅
- updated_at: TEXT NOT NULL ✅

**Indexes**: run_id, task_url, result ✅  
**Foreign Keys**: None ❌  
**Issues**: task_url nullable (may be intentional)

### processed_slack_events (0004)

**Columns**:
- id: INTEGER PRIMARY KEY AUTOINCREMENT ✅
- event_id: TEXT NOT NULL UNIQUE ✅
- processed_at: TEXT NOT NULL ✅

**Indexes**: event_id, processed_at ✅  
**Foreign Keys**: None ❌  
**Issues**: None

### artifacts (0005)

**Columns**:
- id: TEXT PRIMARY KEY ✅
- correlation_id: TEXT NOT NULL ✅
- kind: TEXT NOT NULL ✅
- url: TEXT NOT NULL ✅
- meta_json: TEXT
- created_at: TEXT NOT NULL ✅

**Indexes**: None ❌  
**Foreign Keys**: None ❌  
**Issues**: Missing index on correlation_id

### metrics_snapshots (0006)

**Columns**:
- id: TEXT PRIMARY KEY ✅
- actor_id: TEXT ⚠️ nullable
- source: TEXT NOT NULL ✅
- metrics_json: TEXT NOT NULL ✅
- observed_at: TEXT
- created_at: TEXT NOT NULL ✅

**Indexes**: None ❌  
**Foreign Keys**: None ❌  
**Issues**: No indexes at all

### schema_migrations (0007)

**Columns**: (tracking table only)  
**Issues**: None (tracking table is fine)

### runs (0008)

**Columns**:
- task_id: TEXT NOT NULL ✅
- run_id: TEXT NOT NULL PRIMARY KEY ✅
- type: TEXT NOT NULL with CHECK ✅
- started: TEXT NOT NULL ✅
- owner: TEXT NOT NULL with CHECK ✅
- status: TEXT NOT NULL DEFAULT 'RUNNING' with CHECK ✅
- ended: TEXT
- result: TEXT with CHECK
- error: TEXT
- metadata: TEXT
- created_at: TEXT NOT NULL DEFAULT datetime('now') ✅
- updated_at: TEXT NOT NULL DEFAULT datetime('now') ✅

**Indexes**: task_id, status, started ✅  
**Foreign Keys**: None ❌  
**Issues**: None

### registry (0008)

**Columns**:
- system_name: TEXT NOT NULL PRIMARY KEY ✅
- system_type: TEXT NOT NULL with CHECK ✅
- status: TEXT NOT NULL DEFAULT 'ACTIVE' with CHECK ✅
- health_endpoint: TEXT ⚠️ nullable
- last_heartbeat: TEXT ⚠️ nullable
- metadata: TEXT
- created_at: TEXT NOT NULL DEFAULT datetime('now') ✅
- updated_at: TEXT NOT NULL DEFAULT datetime('now') ✅

**Indexes**: status, system_type ✅  
**Foreign Keys**: None ❌  
**Issues**: health_endpoint, last_heartbeat nullable (may be intentional)

---

## Recommendations Summary

### Immediate Actions (High Priority)

1. **Add index on artifacts.correlation_id** - Performance critical for correlation queries
2. **Add indexes on metrics_snapshots** - Performance critical for all queries

### Future Improvements (Medium Priority)

3. **Add indexes on tasks.status and tasks.created_at** - Performance improvement
4. **Review nullable columns** - Data quality improvement
5. **Consider FK constraints** - Data integrity improvement (if D1 supports)

### No Action Required

- All tables have appropriate created_at/updated_at columns
- Most tables have appropriate indexes for common query patterns
- CHECK constraints are well-used for data validation
- Primary keys are properly defined

---

## Migration Files to Create

### 0009_artifacts_correlation_index.sql

```sql
-- Migration: Add index on artifacts.correlation_id
-- Improves performance for correlation-based queries

CREATE INDEX IF NOT EXISTS idx_artifacts_correlation_id ON artifacts(correlation_id);
```

### 0010_metrics_snapshots_indexes.sql

```sql
-- Migration: Add indexes on metrics_snapshots
-- Improves performance for all queries on this table

CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_actor ON metrics_snapshots(actor_id);
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_source ON metrics_snapshots(source);
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_created ON metrics_snapshots(created_at);
```

### 0011_tasks_performance_indexes.sql

```sql
-- Migration: Add performance indexes on tasks table
-- Improves performance for status and date range queries

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at);
```

---

*Last Updated: 2026-05-29*  
*Status: AWAITING REVIEW AND APPROVAL FOR INDEX MIGRATIONS*
