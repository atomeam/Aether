import { Client } from '@notionhq/client';
import { RUN_ROW_SCHEMA, TASK_CLOSE_PAYLOAD_SCHEMA, REGISTRY_ENTRY_SCHEMA, } from '@aether/ledger';
// ============================================================================
// Response Helpers
// ============================================================================
function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}
function error(message, status = 500) {
    return json({ error: message }, status);
}
// ============================================================================
// Notion Client Helper
// ============================================================================
function getNotionClient(env) {
    return new Client({ auth: env.NOTION_TOKEN });
}
// ============================================================================
// Auth Helper
// ============================================================================
function verifyInternalAuth(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader)
        return false;
    const expected = `Bearer ${env.INTERNAL_AUTH}`;
    return authHeader === expected;
}
// ============================================================================
// POST /runs - Runs Ledger Writer
// ============================================================================
async function handlePostRuns(request, env) {
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
            await stmt.bind(validated.task_id, validated.run_id, validated.type, validated.started, validated.owner, validated.status, validated.ended || null, validated.result || null, validated.error || null, validated.metadata ? JSON.stringify(validated.metadata) : null, validated.created_at || now, validated.updated_at || now).run();
        }
        catch (dbError) {
            console.error('[POST /runs] DB error:', dbError);
            throw dbError;
        }
        // Mirror to Notion Runs ledger DB
        const notion = getNotionClient(env);
        // TODO: Implement Notion DB mirroring once DB ID is configured
        // For v0, we'll log the intent without actual Notion write
        console.log(`[RUNS] Upserted run ${validated.run_id} for task ${validated.task_id}`);
        return json({ ok: true, run_id: validated.run_id });
    }
    catch (e) {
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
async function handlePostTaskClose(request, env, taskId) {
    try {
        const body = await request.json();
        const validated = TASK_CLOSE_PAYLOAD_SCHEMA.parse(body);
        // Use task_id from URL, ignore payload task_id for flexibility
        const actualTaskId = taskId;
        const notion = getNotionClient(env);
        // Update task status in Notion
        // TODO: Implement Notion task update once page ID mapping is configured
        // For v0, we'll validate the payload structure without actual Notion write
        // Append artifact links block (idempotent)
        if (validated.artifact_links && validated.artifact_links.length > 0) {
            // TODO: Implement Notion block append
            console.log(`[TASK_CLOSE] Would append ${validated.artifact_links.length} artifacts to task ${actualTaskId}`);
        }
        console.log(`[TASK_CLOSE] Processed close for task ${actualTaskId}, run ${validated.run_id}, result ${validated.result}`);
        return json({
            ok: true,
            task_id: actualTaskId,
            run_id: validated.run_id,
            result: validated.result
        });
    }
    catch (e) {
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
async function handlePostRegistryUpsert(request, env) {
    try {
        const body = await request.json();
        const validated = REGISTRY_ENTRY_SCHEMA.parse(body);
        const now = new Date().toISOString();
        // Upsert to registry table using INSERT OR REPLACE
        const stmt = env.DB_RUNS.prepare(`
      INSERT OR REPLACE INTO registry (system_name, system_type, status, health_endpoint, last_heartbeat, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        await stmt.bind(validated.system_name, validated.system_type, validated.status, validated.health_endpoint || null, validated.last_heartbeat || null, validated.metadata ? JSON.stringify(validated.metadata) : null, now, now).run();
        console.log(`[REGISTRY] Upserted system ${validated.system_name} as ${validated.status}`);
        return json({ ok: true, system_name: validated.system_name });
    }
    catch (e) {
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
async function handleGetHealth(env) {
    try {
        // Check D1 connectivity
        const result = await env.DB_RUNS.prepare('SELECT COUNT(*) as count FROM runs').first();
        return json({
            ok: true,
            runs_count: result?.count || 0,
            timestamp: new Date().toISOString(),
        });
    }
    catch (e) {
        console.error('[GET /health]', e);
        return error('Health check failed', 500);
    }
}
// ============================================================================
// Main Worker Handler
// ============================================================================
export default {
    async fetch(request, env) {
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
