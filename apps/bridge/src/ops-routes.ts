/**
 * Ops Routes - /ops/run-event endpoint
 * Handles deploy, smoke, migration, code_change, investigation events
 * Writes to runs ledger in BRIDGE_DB
 */

interface RunEventPayload {
  run_id: string;
  task_id: string;
  type: 'deploy' | 'smoke' | 'migration' | 'code_change' | 'investigation';
  state: 'running' | 'succeeded' | 'failed' | 'blocked';
  started: string;
  ended?: string;
  actor?: string;
  repo?: string;
  commit_sha?: string;
  ci_run_url?: string;
  evidence?: string;
  required_artifacts_met?: number;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
}

function error(message: string, status = 500): Response {
  return json({ error: message }, status);
}

function verifyOpsAuth(request: Request, env: { OPS_SECRET?: string }): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  
  const expected = `Bearer ${env.OPS_SECRET || ''}`;
  return authHeader === expected;
}

async function handlePostRunEvent(request: Request, env: { BRIDGE_DB: D1Database; OPS_SECRET?: string }): Promise<Response> {
  try {
    // Verify auth
    if (!verifyOpsAuth(request, env)) {
      return error('Unauthorized', 401);
    }

    const body = await request.json() as RunEventPayload;
    
    // Validate required fields
    if (!body.run_id || !body.task_id || !body.type || !body.state || !body.started) {
      return error('Missing required fields: run_id, task_id, type, state, started', 400);
    }

    // Validate type enum
    const validTypes = ['deploy', 'smoke', 'migration', 'code_change', 'investigation'];
    if (!validTypes.includes(body.type)) {
      return error(`Invalid type. Must be one of: ${validTypes.join(', ')}`, 400);
    }

    // Validate state enum
    const validStates = ['running', 'succeeded', 'failed', 'blocked'];
    if (!validStates.includes(body.state)) {
      return error(`Invalid state. Must be one of: ${validStates.join(', ')}`, 400);
    }

    const now = new Date().toISOString();
    
    // Idempotent upsert using INSERT OR REPLACE
    const stmt = env.BRIDGE_DB.prepare(`
      INSERT OR REPLACE INTO runs (
        run_id, task_id, type, state, started, ended, actor, repo, 
        commit_sha, ci_run_url, evidence, required_artifacts_met, 
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    await stmt.bind(
      body.run_id,
      body.task_id,
      body.type,
      body.state,
      body.started,
      body.ended || null,
      body.actor || null,
      body.repo || null,
      body.commit_sha || null,
      body.ci_run_url || null,
      body.evidence || null,
      body.required_artifacts_met || 0,
      now,
      now
    ).run();
    
    console.log(`[OPS] Upserted run ${body.run_id} (${body.type}) for task ${body.task_id} - state: ${body.state}`);
    
    return json({ 
      ok: true, 
      run_id: body.run_id,
      task_id: body.task_id,
      state: body.state 
    });
  } catch (e) {
    console.error('[POST /ops/run-event]', e);
    if (e instanceof Error && e.message.includes('validation')) {
      return error('Invalid request body', 400);
    }
    return error('Failed to upsert run', 500);
  }
}

export { handlePostRunEvent };
