/**
 * Tests for /tasks routes with atomic audit_events
 *
 * Verifies:
 * - POST /tasks creates task + TASK_CREATED audit event in batch
 * - PATCH /tasks/:id updates task + TASK_UPDATED audit event in batch
 * - 404 on PATCH nonexistent task (no audit write)
 * - 400 on POST without title
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Mock helpers ───────────────────────────────────────────────

function mockD1Database() {
  const tasks = new Map<string, any>();
  const auditEvents: any[] = [];
  const _batchStmts: any[] = [];

  return {
    tasks,
    auditEvents,
    get batchStatements() { return _batchStmts; },

    prepare(sql: string) {
      let boundParams: any[] = [];

      const stmt = {
        bind(...params: any[]) {
          boundParams = params;
          return stmt;
        },

        async run() {
          if (sql.startsWith('INSERT INTO tasks')) {
            const [id, title, description, status, created_at, updated_at] = boundParams;
            tasks.set(id, { id, title, description, status, created_at, updated_at });
          }
          if (sql.startsWith('INSERT INTO audit_events')) {
            auditEvents.push({
              id: boundParams[0], correlation_id: boundParams[1], event_type: boundParams[2],
              actor_id: boundParams[3], source: boundParams[4], ok: boundParams[5],
              error_code: boundParams[6], error_message: boundParams[7],
              input_json: boundParams[8], output_json: boundParams[9], created_at: boundParams[10]
            });
          }
          if (sql.startsWith('UPDATE tasks')) {
            const taskId = boundParams[boundParams.length - 1];
            const task = tasks.get(taskId);
            if (!task) return { meta: { changes: 0 } };
            const setsMatch = sql.match(/SET (.+?) WHERE/);
            if (setsMatch) {
              const cols = setsMatch[1].split(', ').map(s => s.split(' = ')[0].trim());
              cols.forEach((col, i) => {
                if (col !== 'id') task[col] = boundParams[i];
              });
            }
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        },

        async first() {
          if (sql.includes('tasks')) {
            const idMatch = boundParams[0];
            return tasks.get(idMatch) || null;
          }
          return null;
        },

        async all() {
          if (sql.includes('tasks')) {
            const allTasks = Array.from(tasks.values());
            allTasks.sort((a, b) => b.created_at.localeCompare(a.created_at));
            return { results: allTasks };
          }
          return { results: [] };
        },
      };

      return stmt;
    },

    async batch(stmts: any[]) {
      _batchStmts.length = 0;
      _batchStmts.push(...stmts);
      for (const stmt of stmts) {
        await stmt.run();
      }
    },
  };
}

function mockEnv() {
  const db = mockD1Database();
  return {
    DB: db as any,
    STATE: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    } as any,
    STATE_CACHE: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    } as any,
    MYBROWSER: {} as any,
    NOTION_WEBHOOK_SECRET: 'test-secret',
  };
}

function createRequest(path: string, method: string, body?: any): Request {
  return new Request(`https://aether-bridge.test${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ─── Tests ─────────────────────────────────────────────────────

// We import the worker default export
import worker from './worker';

describe('POST /tasks', () => {
  let env: ReturnType<typeof mockEnv>;

  beforeEach(() => {
    env = mockEnv();
  });

  it('creates a task and writes TASK_CREATED audit event atomically', async () => {
    const req = createRequest('/tasks', 'POST', {
      title: 'Test Task',
      description: 'A test description',
    });

    const res = await worker.fetch(req, env as any, { waitUntil: vi.fn(), passThroughOnException: vi.fn() });
    const body = await res.json() as { ok: boolean; task: { title: string; description: string; status: string; id: string; created_at: string; updated_at: string } };

    expect(res.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.task.title).toBe('Test Task');
    expect(body.task.description).toBe('A test description');
    expect(body.task.status).toBe('pending');
    expect(body.task.id).toBeDefined();
    expect(body.task.created_at).toBeDefined();
    expect(body.task.updated_at).toBeDefined();

    // Verify task stored in DB
    const db = env.DB as any;
    expect(db.tasks.size).toBe(1);

    // Verify audit event written
    expect(db.auditEvents.length).toBe(1);
    const auditEvent = db.auditEvents[0];
    expect(auditEvent.event_type).toBe('TASK_CREATED');
    expect(auditEvent.source).toBe('api');
    expect(auditEvent.actor_id).toBeNull();
    expect(auditEvent.ok).toBe(1);
    expect(auditEvent.correlation_id).toBe(body.task.id);

    const inputJson = JSON.parse(auditEvent.input_json as string);
    expect(inputJson.title).toBe('Test Task');
    expect(inputJson.description).toBe('A test description');

    const outputJson = JSON.parse(auditEvent.output_json as string);
    expect(outputJson.id).toBe(body.task.id);

    // Verify batch was used
    expect(db.batchStatements.length).toBe(2);
  });

  it('returns 400 when title is missing', async () => {
    const req = createRequest('/tasks', 'POST', { description: 'no title' });
    const res = await worker.fetch(req, env as any, { waitUntil: vi.fn(), passThroughOnException: vi.fn() });
    const body = await res.json() as { error: string };

    expect(res.status).toBe(400);
    expect(body.error).toBe('title is required');

    // No audit events written
    const db = env.DB as any;
    expect(db.auditEvents.length).toBe(0);
  });

  it('defaults status to "pending" when not provided', async () => {
    const req = createRequest('/tasks', 'POST', { title: 'Minimal Task' });
    const res = await worker.fetch(req, env as any, { waitUntil: vi.fn(), passThroughOnException: vi.fn() });
    const body = await res.json() as { task: { status: string } };

    expect(res.status).toBe(201);
    expect(body.task.status).toBe('pending');
  });
});

describe('PATCH /tasks/:id', () => {
  let env: ReturnType<typeof mockEnv>;

  beforeEach(async () => {
    env = mockEnv();

    // Create a task first via POST
    const req = createRequest('/tasks', 'POST', { title: 'Original Title' });
    await worker.fetch(req, env as any, { waitUntil: vi.fn(), passThroughOnException: vi.fn() });

    // Reset batch statements tracking for PATCH tests (clear via internal array)
    const db = env.DB as any;
    db.batchStatements.length = 0;
  });

  it('updates a task and writes TASK_UPDATED audit event atomically', async () => {
    const db = env.DB as any;
    const existingTask = Array.from(db.tasks.values())[0] as { id: string };
    const taskId = existingTask.id;

    const req = createRequest(`/tasks/${taskId}`, 'PATCH', {
      title: 'Updated Title',
      status: 'in_progress',
    });

    const res = await worker.fetch(req, env as any, { waitUntil: vi.fn(), passThroughOnException: vi.fn() });
    const body = await res.json() as { ok: boolean; task: { title: string; status: string } };

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.task.title).toBe('Updated Title');
    expect(body.task.status).toBe('in_progress');

    // Verify audit event written
    const auditEvents = db.auditEvents;
    expect(auditEvents.length).toBe(2); // TASK_CREATED + TASK_UPDATED
    const updateAudit = auditEvents[1];
    expect(updateAudit.event_type).toBe('TASK_UPDATED');
    expect(updateAudit.source).toBe('api');
    expect(updateAudit.correlation_id).toBe(taskId);

    const outputJson = JSON.parse(updateAudit.output_json as string);
    expect(outputJson.id).toBe(taskId);
    expect(outputJson.changed_fields).toContain('title');
    expect(outputJson.changed_fields).toContain('status');

    // Verify batch was used
    expect(db.batchStatements.length).toBe(2);
  });

  it('returns 404 when task does not exist (no audit write)', async () => {
    const req = createRequest('/tasks/nonexistent-id', 'PATCH', { title: 'Ghost' });
    const res = await worker.fetch(req, env as any, { waitUntil: vi.fn(), passThroughOnException: vi.fn() });
    const body = await res.json() as { error: string };

    expect(res.status).toBe(404);
    expect(body.error).toBe('Task not found');

    // No new audit events written
    const db = env.DB as any;
    expect(db.auditEvents.length).toBe(1); // Only the original TASK_CREATED
  });

  it('returns 400 when no fields to update', async () => {
    const db = env.DB as any;
    const existingTask = Array.from(db.tasks.values())[0] as { id: string };
    const taskId = existingTask.id;

    const req = createRequest(`/tasks/${taskId}`, 'PATCH', {});
    const res = await worker.fetch(req, env as any, { waitUntil: vi.fn(), passThroughOnException: vi.fn() });
    const body = await res.json() as { error: string };

    expect(res.status).toBe(400);
    expect(body.error).toBe('No fields to update');
  });

  it('tracks changed_fields in audit output_json', async () => {
    const db = env.DB as any;
    const existingTask = Array.from(db.tasks.values())[0] as { id: string };
    const taskId = existingTask.id;

    const req = createRequest(`/tasks/${taskId}`, 'PATCH', {
      description: 'New description only',
    });

    await worker.fetch(req, env as any, { waitUntil: vi.fn(), passThroughOnException: vi.fn() });

    const updateAudit = db.auditEvents[1];
    const outputJson = JSON.parse(updateAudit.output_json as string);
    expect(outputJson.changed_fields).toEqual(['description']);
  });
});

describe('GET /tasks', () => {
  let env: ReturnType<typeof mockEnv>;

  beforeEach(async () => {
    env = mockEnv();
  });

  it('lists all tasks', async () => {
    // Create two tasks
    await worker.fetch(
      createRequest('/tasks', 'POST', { title: 'Task 1' }),
      env as any, { waitUntil: vi.fn(), passThroughOnException: vi.fn() }
    );
    await worker.fetch(
      createRequest('/tasks', 'POST', { title: 'Task 2' }),
      env as any, { waitUntil: vi.fn(), passThroughOnException: vi.fn() }
    );

    const req = createRequest('/tasks', 'GET');
    const res = await worker.fetch(req, env as any, { waitUntil: vi.fn(), passThroughOnException: vi.fn() });
    const body = await res.json() as { ok: boolean; tasks: unknown[]; count: number };

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.tasks.length).toBe(2);
    expect(body.count).toBe(2);
  });

  it('returns single task by id', async () => {
    const createReq = createRequest('/tasks', 'POST', { title: 'Find Me' });
    const createRes = await worker.fetch(createReq, env as any, { waitUntil: vi.fn(), passThroughOnException: vi.fn() });
    const created = await createRes.json() as { task: { id: string } };

    const req = createRequest(`/tasks/${created.task.id}`, 'GET');
    const res = await worker.fetch(req, env as any, { waitUntil: vi.fn(), passThroughOnException: vi.fn() });
    const body = await res.json() as { task: { title: string } };

    expect(res.status).toBe(200);
    expect(body.task.title).toBe('Find Me');
  });
});