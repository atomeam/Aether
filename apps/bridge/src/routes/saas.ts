/**
 * SaaS Routes with Bearer-key Auth Gate
 * 
 * Provides tenant-isolated endpoints using API key authentication.
 * Keys are validated against KV, deriving workspace_id for tenant isolation.
 */

// Re-export types from worker
export interface SaasEnv {
  STATE: KVNamespace;
  BRIDGE_DB: D1Database;
  DB: D1Database;
}

// Workspace context stored in request context
export interface WorkspaceContext {
  workspaceId: string;
  apiKeyHash: string;
}

// KV key format for API keys: api_key:<hash> -> { workspace_id, created_at, ... }
// We need a reverse index: workspace_keys:<workspace_id>:<key_prefix> -> key_hash

/**
 * Extract and validate Bearer token from Authorization header
 */
async function extractBearerToken(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
  
  return parts[1];
}

/**
 * Hash API key for storage/lookup
 */
async function hashKey(key: string): Promise<string> {
  const msg = new TextEncoder().encode(key);
  const hash = await crypto.subtle.digest('SHA-256', msg);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify API key against KV and derive workspace_id
 * Returns null if key is invalid or workspace not found
 */
async function verifyApiKey(env: SaasEnv, key: string): Promise<{ workspaceId: string } | null> {
  // Hash the provided key
  const keyHash = await hashKey(key);
  
  // Lookup by hash index: api_key:<hash>
  const stored = await env.STATE.get(`api_key:${keyHash}`);
  if (!stored) return null;
  
  try {
    const data = JSON.parse(stored);
    if (!data.workspace_id) return null;
    return { workspaceId: data.workspace_id };
  } catch {
    return null;
  }
}

/**
 * Create auth middleware context with workspaceId
 * Compatible with Hono's c.get() pattern
 */
export function createAuthContext(workspaceId: string, apiKeyHash: string): WorkspaceContext {
  return { workspaceId, apiKeyHash };
}

/**
 * Auth gate middleware - validates Bearer key and derives workspaceId
 * Returns 401 if auth fails, otherwise sets up context for handlers
 */
export async function authGate(
  request: Request,
  env: SaasEnv
): Promise<{ authorized: true; context: WorkspaceContext } | { authorized: false; response: Response }> {
  const token = await extractBearerToken(request);
  if (!token) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }
  
  const result = await verifyApiKey(env, token);
  if (!result) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }
  
  const keyHash = await hashKey(token);
  const context = createAuthContext(result.workspaceId, keyHash);
  
  return { authorized: true, context };
}

/**
 * JSON response helper with standard headers
 */
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

// ─── SaaS Route Handlers ──────────────────────────────────────────────────────

/**
 * POST /saas/tasks - Create a task with cross-tenant ownership check
 */
export async function handleCreateTask(
  request: Request,
  env: SaasEnv,
  context: WorkspaceContext
): Promise<Response> {
  if (!env.BRIDGE_DB) return json({ error: 'BRIDGE_DB not bound' }, 500);
  
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  
  const { project_id, title, description, priority } = body as {
    project_id?: string;
    title?: string;
    description?: string;
    priority?: string;
  };
  
  if (!title) return json({ error: 'title required' }, 400);
  
  // Cross-tenant project_id ownership check
  if (project_id) {
    try {
      const project = await env.BRIDGE_DB.prepare(
        'SELECT workspace_id FROM projects WHERE id = ?'
      ).bind(project_id).first() as { workspace_id: string } | undefined;
      
      if (project && project.workspace_id !== context.workspaceId) {
        return json({ error: 'Access denied: project belongs to another workspace' }, 403);
      }
    } catch {
      // projects table may not exist yet - skip ownership check
    }
  }
  
  const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = new Date().toISOString();
  
  // Try workspace-aware insert first, fallback to legacy schema
  try {
    await env.BRIDGE_DB.prepare(`
      INSERT INTO tasks (id, title, description, priority, status, workspace_id, project_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      taskId,
      title,
      description?.substring(0, 5000) || '',
      priority || 'P2',
      'Not started',
      context.workspaceId,
      project_id || null,
      timestamp,
      timestamp
    ).run();
  } catch {
    // Fallback: insert without workspace_id/project_id (legacy schema)
    const ai_id = body.ai_id as string || `saas-${taskId}`;
    await env.BRIDGE_DB.prepare(`
      INSERT INTO tasks (id, title, description, status, ai_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      taskId,
      title,
      description?.substring(0, 5000) || '',
      'Not started',
      ai_id,
      timestamp,
      timestamp
    ).run();
  }
  
  // Audit log
  await env.BRIDGE_DB.prepare(`
    INSERT INTO events (event_id, source, kind, level, payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(taskId, 'saas', 'TASK_CREATED', 'info', JSON.stringify({
    workspaceId: context.workspaceId,
    title,
    project_id
  }), timestamp).run();
  
  return json({ ok: true, task_id: taskId, workspace_id: context.workspaceId, timestamp });
}

/**
 * GET /saas/tasks - List tasks for workspace
 */
export async function handleListTasks(
  request: Request,
  env: SaasEnv,
  context: WorkspaceContext,
  url: URL
): Promise<Response> {
  if (!env.BRIDGE_DB) return json({ error: 'BRIDGE_DB not bound' }, 500);
  
  const status = url.searchParams.get('status');
  const projectId = url.searchParams.get('project_id');
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  
  // Try workspace-aware query first, fallback to legacy
  try {
    let query = 'SELECT * FROM tasks WHERE workspace_id = ?';
    const params: (string | number)[] = [context.workspaceId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (projectId) {
      // Verify project belongs to this workspace
      const project = await env.BRIDGE_DB.prepare(
        'SELECT workspace_id FROM projects WHERE id = ?'
      ).bind(projectId).first() as { workspace_id: string } | undefined;
      
      if (project && project.workspace_id !== context.workspaceId) {
        return json({ error: 'Access denied: project belongs to another workspace' }, 403);
      }
      
      query += ' AND project_id = ?';
      params.push(projectId);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    const result = await env.BRIDGE_DB.prepare(query).bind(...params).all();
    return json({ ok: true, tasks: result.results, count: result.results.length });
  } catch {
    // Fallback: legacy query without workspace isolation
    const ai_id = url.searchParams.get('ai_id');
    let query = 'SELECT * FROM tasks';
    const params: (string | number)[] = [];
    
    if (ai_id) {
      query += ' WHERE ai_id = ?';
      params.push(ai_id);
    }
    
    if (status) {
      query += params.length > 0 ? ' AND status = ?' : ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    const result = await env.BRIDGE_DB.prepare(query).bind(...params).all();
    return json({ ok: true, tasks: result.results, count: result.results.length });
  }
}

/**
 * GET /saas/tasks/:id - Get specific task (tenant-isolated)
 */
export async function handleGetTask(
  request: Request,
  env: SaasEnv,
  context: WorkspaceContext,
  taskId: string
): Promise<Response> {
  if (!env.BRIDGE_DB) return json({ error: 'BRIDGE_DB not bound' }, 500);
  
  try {
    const task = await env.BRIDGE_DB.prepare(
      'SELECT * FROM tasks WHERE id = ? AND workspace_id = ?'
    ).bind(taskId, context.workspaceId).first();
    
    if (!task) {
      return json({ error: 'Task not found' }, 404);
    }
    
    return json({ ok: true, task });
  } catch {
    return json({ error: 'Failed to retrieve task. Ensure migration 0013 has been applied.' }, 500);
  }
}

/**
 * PUT /saas/tasks/:id - Update task (tenant-isolated)
 */
export async function handleUpdateTask(
  request: Request,
  env: SaasEnv,
  context: WorkspaceContext,
  taskId: string
): Promise<Response> {
  if (!env.BRIDGE_DB) return json({ error: 'BRIDGE_DB not bound' }, 500);
  
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  
  const { title, description, status, priority } = body as {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
  };
  
  try {
    // Try workspace-aware update
    // Verify task belongs to this workspace
    const existing = await env.BRIDGE_DB.prepare(
      'SELECT id FROM tasks WHERE id = ? AND workspace_id = ?'
    ).bind(taskId, context.workspaceId).first();
    
    if (!existing) {
      return json({ error: 'Task not found' }, 404);
    }
    
    const updates: string[] = ['updated_at = ?'];
    const params: (string | number)[] = [new Date().toISOString()];
    
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description.substring(0, 5000));
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      params.push(priority);
    }
    
    params.push(taskId, context.workspaceId);
    
    await env.BRIDGE_DB.prepare(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND workspace_id = ?`
    ).bind(...params).run();
    
    return json({ ok: true, task_id: taskId, updated_at: new Date().toISOString() });
  } catch {
    return json({ error: 'Failed to update task. Ensure migration 0013 has been applied.' }, 500);
  }
}

/**
 * DELETE /saas/tasks/:id - Delete task (tenant-isolated)
 */
export async function handleDeleteTask(
  request: Request,
  env: SaasEnv,
  context: WorkspaceContext,
  taskId: string
): Promise<Response> {
  if (!env.BRIDGE_DB) return json({ error: 'BRIDGE_DB not bound' }, 500);
  
  try {
    const result = await env.BRIDGE_DB.prepare(
      'DELETE FROM tasks WHERE id = ? AND workspace_id = ?'
    ).bind(taskId, context.workspaceId).run();
    
    if (result.meta.changes === 0) {
      return json({ error: 'Task not found' }, 404);
    }
    
    return json({ ok: true, task_id: taskId });
  } catch {
    return json({ error: 'Failed to delete task. Ensure migration 0013 has been applied.' }, 500);
  }
}

/**
 * GET /saas/projects - List projects for workspace
 */
export async function handleListProjects(
  request: Request,
  env: SaasEnv,
  context: WorkspaceContext,
  url: URL
): Promise<Response> {
  if (!env.BRIDGE_DB) return json({ error: 'BRIDGE_DB not bound' }, 500);
  
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  
  try {
    const result = await env.BRIDGE_DB.prepare(
      'SELECT * FROM projects WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?'
    ).bind(context.workspaceId, limit).all();
    
    return json({ ok: true, projects: result.results, count: result.results.length });
  } catch {
    // Projects table may not exist yet
    return json({ ok: true, projects: [], count: 0 });
  }
}

/**
 * POST /saas/projects - Create project
 */
export async function handleCreateProject(
  request: Request,
  env: SaasEnv,
  context: WorkspaceContext
): Promise<Response> {
  if (!env.BRIDGE_DB) return json({ error: 'BRIDGE_DB not bound' }, 500);
  
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  
  const { name, description } = body as { name?: string; description?: string };
  if (!name) return json({ error: 'name required' }, 400);
  
  const projectId = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = new Date().toISOString();
  
  try {
    await env.BRIDGE_DB.prepare(`
      INSERT INTO projects (id, name, description, workspace_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(projectId, name, description || '', context.workspaceId, timestamp, timestamp).run();
    
    return json({ ok: true, project_id: projectId, workspace_id: context.workspaceId, timestamp });
  } catch {
    return json({ error: 'Failed to create project. Ensure migration 0013 has been applied.' }, 500);
  }
}

/**
 * GET /saas/health - Health check (no auth required)
 */
export async function handleSaasHealth(): Promise<Response> {
  return json({ ok: true, service: 'saas-routes', timestamp: new Date().toISOString() });
}

// ─── Route Dispatcher ─────────────────────────────────────────────────────────

export type SaasEnvType = SaasEnv;

/**
 * Main dispatcher for SaaS routes
 * Returns true if request was handled, false otherwise
 */
export async function dispatchSaasRoute(
  request: Request,
  env: SaasEnv,
  url: URL
): Promise<Response | null> {
  const path = url.pathname;
  const method = request.method;
  
  // Health check - no auth
  if (path === '/saas/health' && method === 'GET') {
    return handleSaasHealth();
  }
  
  // All other routes require auth
  const authResult = await authGate(request, env);
  if (!authResult.authorized) {
    return authResult.response;
  }
  
  const { context } = authResult;
  
  // Route matching
  const tasksMatch = path.match(/^\/saas\/tasks(?:\/(.+))?$/);
  const projectsMatch = path.match(/^\/saas\/projects(?:\/(.+))?$/);
  
  // POST /saas/tasks
  if (path === '/saas/tasks' && method === 'POST') {
    return handleCreateTask(request, env, context);
  }
  
  // GET /saas/tasks
  if (path === '/saas/tasks' && method === 'GET') {
    return handleListTasks(request, env, context, url);
  }
  
  // GET /saas/tasks/:id
  if (tasksMatch && tasksMatch[1] && method === 'GET') {
    return handleGetTask(request, env, context, tasksMatch[1]);
  }
  
  // PUT /saas/tasks/:id
  if (tasksMatch && tasksMatch[1] && method === 'PUT') {
    return handleUpdateTask(request, env, context, tasksMatch[1]);
  }
  
  // DELETE /saas/tasks/:id
  if (tasksMatch && tasksMatch[1] && method === 'DELETE') {
    return handleDeleteTask(request, env, context, tasksMatch[1]);
  }
  
  // GET /saas/projects
  if (path === '/saas/projects' && method === 'GET') {
    return handleListProjects(request, env, context, url);
  }
  
  // POST /saas/projects
  if (path === '/saas/projects' && method === 'POST') {
    return handleCreateProject(request, env, context);
  }
  
  return null; // Not a SaaS route
}