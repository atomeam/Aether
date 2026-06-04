# Canonical Bindings Map - Aether Bridge

## Worker Configuration
- **Worker Name**: `aether-bridge`
- **Main Entry**: `apps/bridge/src/worker.ts`
- **Compatibility Date**: `2024-12-01`

## D1 Database Bindings

### DB (Council Routing)
- **Binding Name**: `DB`
- **Database Name**: `council-routing-db`
- **Database ID**: `218e0bc6-f955-45d1-b9bf-276d384917c7`
- **Purpose**: Legacy council routing operations
- **Tables**: (legacy routing tables)

### BRIDGE_DB (Primary Operations)
- **Binding Name**: `BRIDGE_DB`
- **Database Name**: `aether-bridge-db`
- **Database ID**: `f29243db-5b7a-407b-aa38-64091c1e0676`
- **Purpose**: Primary operations database
- **Tables**:
  - `events` - Webhook and system events (with event_id for idempotency)
  - `council_logs` - Council conversation logs
  - `tasks` - Task management
  - `audit_events` - Audit trail for task operations

## KV Namespace Bindings

### STATE
- **Binding Name**: `STATE`
- **Namespace ID**: `7319ee9195df4ccf8f4b2c8449dd7930`
- **Purpose**: Primary state storage
- **Usage**: API keys, usage tracking, rate limiting

### STATE_CACHE
- **Binding Name**: `STATE_CACHE`
- **Namespace ID**: `d22e703c3af9451a9942fa2a551a1aa8`
- **Purpose**: Cached snapshots
- **Usage**: Proposals snapshot, lessons index, AI presence

### METRICS
- **Binding Name**: `METRICS`
- **Namespace ID**: `49202b2460a74d2dbd6d747d35dda5b7`
- **Purpose**: Metrics storage
- **Usage**: Latest metrics snapshots

## Queue Bindings

### CURATOR_QUEUE
- **Binding Name**: `CURATOR_QUEUE`
- **Queue Name**: `curator-jobs`
- **Purpose**: Curator job processing
- **Consumer Config**: max_batch_size=1, max_retries=3

### ACTIONS
- **Binding Name**: `ACTIONS`
- **Queue Name**: `bridge-actions`
- **Purpose**: Bridge action queue
- **Consumer Config**: max_batch_size=10, max_retries=3

## R2 Bucket Bindings

### _LOGS
- **Binding Name**: `_LOGS`
- **Bucket Name**: `aether-logs`
- **Purpose**: Log storage
- **Usage**: Structured log archiving

## Service Bindings

### DISPATCHER
- **Binding Name**: `DISPATCHER`
- **Service Name**: `aether`
- **Purpose**: Dispatcher service communication

## Browser Binding

### MYBROWSER
- **Binding Name**: `MYBROWSER`
- **Purpose**: Browser rendering capabilities
- **Status**: Configured but usage decision pending

## Environment Variables

### Required
- `NOTION_WEBHOOK_SECRET` - HMAC verification for Notion webhooks
- `BRIDGE_API_TOKEN` - API authentication token

### Optional
- `SLACK_BOT_TOKEN` - Slack integration
- `GITHUB_TOKEN` - GitHub integration
- `AMPLITUDE_API_KEY` - Amplitude analytics
- `AMPLITUDE_SECRET` - Amplitude analytics
- `SENTRY_DSN` - Error tracking

## Route Mappings

### Core Routes
- `GET /health` - Health check with binding status
- `GET /crew/status` - Crew status with binding validation
- `GET /dashboard` - HTML dashboard

### Webhook Routes
- `POST /webhooks/notion` - Notion webhook receiver (with HMAC verification)

### Proposal Routes
- `GET /proposals` - Get proposals snapshot
- `POST /proposals/write` - Write proposals snapshot

### Lesson Routes
- `GET /lessons` - Get lessons index
- `POST /lessons/write` - Write lessons index
- `POST /lessons/check` - Check for hash collisions

### Task Routes
- `GET /tasks` - List all tasks
- `POST /tasks` - Create task
- `GET /tasks/:id` - Get specific task
- `PATCH /tasks/:id` - Update task

### Council Routes
- `POST /api/council/log` - Log council conversation
- `GET /api/council/history` - Get conversation history
- `GET /api/council/replay` - Event-driven replay
- `GET /api/council/policy-diff` - Policy comparison

### Event Routes
- `GET /api/events` - Query events with filters

### AI Routes
- `GET /api/ai/presence` - Get AI presence status
- `POST /api/ai/heartbeat` - Update AI presence

### Usage Routes
- `GET /api/usage` - Get usage statistics

### Legacy API Routes
- `GET /api/stack` - Legacy stack status
- `POST /api/execute` - Legacy execution endpoint
- `GET /api/execute/status` - Legacy execution status

## Database Schema

### events table
```sql
CREATE TABLE events (
  event_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  kind TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  page_id TEXT,
  database_id TEXT,
  payload TEXT,
  session_id TEXT,
  created_at TEXT NOT NULL
);
```

### council_logs table
```sql
CREATE TABLE council_logs (
  session_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  message_id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL
);
```

### tasks table
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### audit_events table
```sql
CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  correlation_id TEXT,
  event_type TEXT NOT NULL,
  actor_id TEXT,
  source TEXT NOT NULL DEFAULT 'api',
  ok INTEGER NOT NULL DEFAULT 1,
  error_code TEXT,
  error_message TEXT,
  input_json TEXT,
  output_json TEXT,
  created_at TEXT NOT NULL
);
```

## Migration History

### 0001_tasks_audit.sql
- Creates `tasks` table
- Creates `audit_events` table
- Adds indexes for audit_events

### 0002_events_council_logs.sql
- Creates `events` table (with event_id for webhook idempotency)
- Creates `council_logs` table
- Adds indexes for events and council_logs

## Custom Domain
- **Custom Hostname**: `aether.a-to-mind.com`
- **Status**: Locked and configured

## Observability
- **Enabled**: true
- **Log Forwarding**: Decision pending (Logpush vs Tail Worker → Atomind Bridge Logs)

*Last Updated: 2026-05-27*
*Migration: Post-PR BRIDGE_DB binding alignment*
