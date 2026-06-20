/**
 * Aether Dashboard Worker
 * 
 * Polls Cloudflare API and writes true infrastructure state to D1.
 * Runs on cron trigger every 5 minutes.
 */

export interface Env {
  DB: D1Database;
  CF_API_TOKEN: string;
  CF_ACCOUNT_ID: string;
}

interface WorkerScript {
  id: string;
  created_on?: string;
  modified_on?: string;
}

interface DnsRecord {
  id: string;
  name: string;
  type: string;
  content: string;
  proxied: boolean;
}

async function fetchWorkerScripts(accountId: string, token: string): Promise<WorkerScript[]> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Scripts fetch failed: ${res.status}`);
  const data = await res.json();
  return (data.result || []) as WorkerScript[];
}

async function fetchDnsRecords(zoneId: string, token: string): Promise<DnsRecord[]> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`DNS fetch failed: ${res.status}`);
  const data = await res.json();
  return (data.result || []) as DnsRecord[];
}

async function fetchZones(accountId: string, token: string): Promise<Array<{ id: string; name: string }>> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Zones fetch failed: ${res.status}`);
  const data = await res.json();
  return (data.result || []) as Array<{ id: string; name: string }>;
}

async function upsertState(db: D1Database, resource: {
  id: string;
  type: string;
  versionId: string | null;
  status: string;
  metadata: Record<string, unknown>;
}) {
  await db.prepare(`
    INSERT INTO infrastructure_state (id, resource_type, current_version_id, last_verified_at, status, metadata)
    VALUES (?, ?, ?, datetime('now'), ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      current_version_id = excluded.current_version_id,
      last_verified_at = excluded.last_verified_at,
      status = excluded.status,
      metadata = excluded.metadata
  `).bind(
    resource.id,
    resource.type,
    resource.versionId || null,
    resource.status,
    JSON.stringify(resource.metadata)
  ).run();
}

async function logAudit(db: D1Database, event: {
  triggeredBy: string;
  actionType: string;
  resourceId: string;
  success: boolean;
  message?: string;
}) {
  await db.prepare(`
    INSERT INTO audit_log (event_id, triggered_by, action_type, resource_id, success, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    crypto.randomUUID(),
    event.triggeredBy,
    event.actionType,
    event.resourceId,
    event.success ? 1 : 0,
    event.message || null
  ).run();
}

async function runComplianceCheck(env: Env): Promise<{ ok: boolean; workers?: number; dns?: number; error?: string }> {
  const { DB, CF_API_TOKEN, CF_ACCOUNT_ID } = env;
  
  let workersCount = 0;
  let dnsCount = 0;
  
  try {
    // 1. Poll Workers
    const scripts = await fetchWorkerScripts(CF_ACCOUNT_ID, CF_API_TOKEN);
    for (const script of scripts) {
      await upsertState(DB, {
        id: `worker:${script.id}`,
        type: 'worker',
        versionId: script.created_on || null,
        status: 'active',
        metadata: { name: script.id, created_on: script.created_on, modified_on: script.modified_on }
      });
      workersCount++;
    }

    // 2. Poll DNS for all zones
    try {
      const zones = await fetchZones(CF_ACCOUNT_ID, CF_API_TOKEN);
      for (const zone of zones) {
        const records = await fetchDnsRecords(zone.id, CF_API_TOKEN);
        for (const record of records) {
          await upsertState(DB, {
            id: `dns:${record.id}`,
            type: 'dns',
            versionId: null,
            status: record.proxied ? 'active' : 'unproxied',
            metadata: { name: record.name, type: record.type, content: record.content, zone: zone.name }
          });
          dnsCount++;
        }
      }
    } catch (dnsErr) {
      console.warn('DNS polling failed:', dnsErr);
    }

    // 3. Log the run
    await logAudit(DB, {
      triggeredBy: 'dashboard-worker',
      actionType: 'compliance_scan',
      resourceId: 'account:aether',
      success: true,
      message: `Scanned ${workersCount} workers, ${dnsCount} DNS records`
    });

    return { ok: true, workers: workersCount, dns: dnsCount };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await logAudit(DB, {
      triggeredBy: 'dashboard-worker',
      actionType: 'compliance_scan',
      resourceId: 'account:aether',
      success: false,
      message: errorMessage
    });
    return { ok: false, error: errorMessage };
  }
}

// JSON helper
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // GET / - health check
    if (url.pathname === '/' && request.method === 'GET') {
      return json({ ok: true, service: 'aether-dashboard-worker', version: '1.0.0' });
    }
    
    // GET /api/state - get all infrastructure state
    if (url.pathname === '/api/state' && request.method === 'GET') {
      if (!env.DB) return json({ error: 'DB not bound' }, 500);
      
      const results = await env.DB.prepare(
        'SELECT * FROM infrastructure_state ORDER BY resource_type, id'
      ).all();
      
      return json({ ok: true, results: results.results });
    }
    
    // GET /api/state/:id - get specific resource
    if (url.pathname.startsWith('/api/state/') && request.method === 'GET') {
      if (!env.DB) return json({ error: 'DB not bound' }, 500);
      
      const id = url.pathname.replace('/api/state/', '');
      const result = await env.DB.prepare(
        'SELECT * FROM infrastructure_state WHERE id = ?'
      ).bind(id).first();
      
      if (!result) return json({ error: 'Not found' }, 404);
      return json({ ok: true, result });
    }
    
    // GET /api/audit - get audit log
    if (url.pathname === '/api/audit' && request.method === 'GET') {
      if (!env.DB) return json({ error: 'DB not bound' }, 500);
      
      const limit = parseInt(url.searchParams.get('limit') || '50', 10);
      const results = await env.DB.prepare(
        'SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?'
      ).bind(limit).all();
      
      return json({ ok: true, results: results.results });
    }
    
    // POST /api/scan - trigger manual scan
    if (url.pathname === '/api/scan' && request.method === 'POST') {
      const result = await runComplianceCheck(env);
      return json(result, result.ok ? 200 : 500);
    }
    
    // Cron trigger
    if (url.pathname === '/_cron/scan') {
      const result = await runComplianceCheck(env);
      return json(result, result.ok ? 200 : 500);
    }
    
    return json({ error: 'Not found' }, 404);
  },
  
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runComplianceCheck(env));
  }
};