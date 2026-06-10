import { Client } from '@notionhq/client';
import {
  RUN_ROW_SCHEMA,
  TASK_CLOSE_PAYLOAD_SCHEMA,
  REGISTRY_ENTRY_SCHEMA,
  RunRow,
  TaskClosePayload,
  RegistryEntry,
} from '@aether/ledger';

// ============================================================================
// Shared Constants
// ============================================================================

const VERSION = '0.1.0';
const SERVICE = 'notion-worker';

// ============================================================================
// Environment Types
// ============================================================================

interface Env {
  DB_RUNS: D1Database;
  NOTION_TOKEN: string;
  INTERNAL_AUTH: string;
  WEBHOOK_SECRET?: string;
  CF_DEPLOYMENT_ID?: string;
}

// ============================================================================
// Response Helpers
// ============================================================================

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function error(message: string, status = 500): Response {
  return json({ error: message }, status);
}

// ============================================================================
// Notion Client Helper
// ============================================================================

function getNotionClient(env: Env): Client {
  return new Client({ auth: env.NOTION_TOKEN });
}

// ============================================================================
// Auth Helper
// ============================================================================

function verifyInternalAuth(request: Request, env: Env): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  
  const expected = `Bearer ${env.INTERNAL_AUTH}`;
  return authHeader === expected;
}

// ============================================================================
// POST /runs - Runs Ledger Writer
// ============================================================================

async function handlePostRuns(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    const validated = RUN_ROW_SCHEMA.parse(body);
    
    const now = new Date().toISOString();
    
    // Idempotent upsert with state transitions using ON CONFLICT
    const stmt = env.DB_RUNS.prepare(`
      INSERT INTO runs (task_id, run_id, type, started, owner, status, ended, result, error, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(run_id) DO UPDATE SET
        status = excluded.status,
        ended = excluded.ended,
        result = excluded.result,
        error = excluded.error,
        metadata = excluded.metadata,
        updated_at = excluded.updated_at
    `);
    
    try {
      await stmt.bind(
        validated.task_id,
        validated.run_id,
        validated.type,
        validated.started,
        validated.owner,
        validated.status,
        validated.ended || null,
        validated.result || null,
        validated.error || null,
        validated.metadata ? JSON.stringify(validated.metadata) : null,
        validated.created_at || now,
        validated.updated_at || now
      ).run();
    } catch (dbError) {
      console.error('[POST /runs] DB error:', dbError);
      throw dbError;
    }
    
    // Mirror to Notion Runs ledger DB
    const notion = getNotionClient(env);
    // For v0, we'll log the intent without actual Notion write
    // Implement Notion DB mirroring once DB ID is configured
    
    console.log(`[RUNS] Upserted run ${validated.run_id} for task ${validated.task_id}`);
    
    return json({ ok: true, run_id: validated.run_id });
  } catch (e) {
    console.error('[POST /runs]', e);
    if (e instanceof Error && e.message.includes('validation')) {
      return error('Invalid request body', 400);
    }
    return error('Failed to upsert run', 500);
  }
}

// ============================================================================
// POST /tasks/:id/close - Task Auto-Close Writer
// ============================================================================

async function handlePostTaskClose(request: Request, env: Env, taskId: string): Promise<Response> {
  try {
    const body = await request.json();
    const validated = TASK_CLOSE_PAYLOAD_SCHEMA.parse(body);
    
    // Use task_id from URL, ignore payload task_id for flexibility
    const actualTaskId = taskId;
    
    const notion = getNotionClient(env);
    
    // Update task status in Notion
    // For v0, we'll validate the payload structure without actual Notion write
    // Implement Notion task update once page ID mapping is configured
    
    // Append artifact links block (idempotent)
    if (validated.artifact_links && validated.artifact_links.length > 0) {
      // Implement Notion block append in future version
      console.log(`[TASK_CLOSE] Would append ${validated.artifact_links.length} artifacts to task ${actualTaskId}`);
    }
    
    console.log(`[TASK_CLOSE] Processed close for task ${actualTaskId}, run ${validated.run_id}, result ${validated.result}`);
    
    return json({ 
      ok: true, 
      task_id: actualTaskId, 
      run_id: validated.run_id,
      result: validated.result 
    });
  } catch (e) {
    console.error('[POST /tasks/:id/close]', e);
    if (e instanceof Error && e.message.includes('validation')) {
      return error('Invalid request body', 400);
    }
    return error('Failed to close task', 500);
  }
}

// ============================================================================
// POST /registry/upsert - Registry Upsert
// ============================================================================

async function handlePostRegistryUpsert(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    const validated = REGISTRY_ENTRY_SCHEMA.parse(body);
    
    const now = new Date().toISOString();
    
    // Upsert to registry table using INSERT OR REPLACE
    const stmt = env.DB_RUNS.prepare(`
      INSERT OR REPLACE INTO registry (system_name, system_type, status, health_endpoint, last_heartbeat, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    await stmt.bind(
      validated.system_name,
      validated.system_type,
      validated.status,
      validated.health_endpoint || null,
      validated.last_heartbeat || null,
      validated.metadata ? JSON.stringify(validated.metadata) : null,
      now,
      now
    ).run();
    
    console.log(`[REGISTRY] Upserted system ${validated.system_name} as ${validated.status}`);
    
    return json({ ok: true, system_name: validated.system_name });
  } catch (e) {
    console.error('[POST /registry/upsert]', e);
    if (e instanceof Error && e.message.includes('validation')) {
      return error('Invalid request body', 400);
    }
    return error('Failed to upsert registry entry', 500);
  }
}

// ============================================================================
// GET /health - Health Check
// ============================================================================

async function handleGetHealth(env: Env): Promise<Response> {
  try {
    // Check D1 connectivity
    const result = await env.DB_RUNS.prepare('SELECT COUNT(*) as count FROM runs').first() as { count: number } | null;
    
    // Get deployment ID from CF environment (if available)
    const deploymentId = env.CF_DEPLOYMENT_ID || 'unknown';
    const deploymentIdShort = deploymentId.length >= 8 ? deploymentId.substring(0, 8) : deploymentId;
    
    return json({
      ok: true,
      version: `${SERVICE}@${VERSION}+${deploymentIdShort}`,
      service: SERVICE,
      runs_count: result?.count || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[GET /health]', e);
    return error('Health check failed', 500);
  }
}

// ============================================================================
// Main Worker Handler
// ============================================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;
    
    // Health check (no auth required)
    if (path === '/health' && method === 'GET') {
      return handleGetHealth(env);
    }
    
    // Verify internal auth for all other endpoints
    if (!verifyInternalAuth(request, env)) {
      return error('Unauthorized', 401);
    }
    
    // POST /runs - Runs ledger writer
    if (path === '/runs' && method === 'POST') {
      return handlePostRuns(request, env);
    }
    
    // POST /tasks/:id/close - Task auto-close writer
    if (path.startsWith('/tasks/') && path.endsWith('/close') && method === 'POST') {
      const taskId = path.slice(7, -6); // Extract task_id from /tasks/{id}/close
      return handlePostTaskClose(request, env, taskId);
    }
    
    // POST /registry/upsert - Registry upsert
    if (path === '/registry/upsert' && method === 'POST') {
      return handlePostRegistryUpsert(request, env);
    }
    
    // 404 for unknown routes
    return error('Not found', 404);
  },
};
