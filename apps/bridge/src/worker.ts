/**
 * Cloudflare Worker Entry Point
 * 
 * Aether Bridge v0.2.0 - Provides:
 * - /health - Bridge status and bindings
 * - /proposals - Proposal queue
 * - /lessons - Lesson learned
 * - /crew/status - Summary with all bindings
 * - /api/* - Legacy API compatibility
 */

import { default as app } from './server';

// Shared constants
const VERSION = '0.16.2';
const SERVICE = 'aether-bridge';

// No-store JSON helper - prevents stale cache
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

// Shared helper - returns binding status
function getBindings(env: Env) {
  return {
    DB: !!env.DB,
    BRIDGE_DB: !!env.BRIDGE_DB,
    STATE: !!env.STATE,
    STATE_CACHE: !!env.STATE_CACHE,
    MYBROWSER: !!env.MYBROWSER,
  };
}

// Cloudflare Workers export
// ─── Rate Limiter ────────────────────────────────────────────────────
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;       // requests per minute per IP
const RATE_WINDOW = 60_000;  // 60 seconds

// ─── Usage Tracker (for monetization) ───────────────────────────────
async function trackUsage(env: Env, ip: string, type: 'request' | 'ai_call' | 'd1_query') {
  try {
    const key = `usage:${ip}`;
    const raw = await env.STATE.get(key);
    let usage = { requests: 0, ai_calls: 0, d1_queries: 0 };
    if (raw) {
      try { usage = JSON.parse(raw); } catch { /* ignore malformed JSON */ }
    }
    if (type === 'request') usage.requests++;
    else if (type === 'ai_call') usage.ai_calls++;
    else if (type === 'd1_query') usage.d1_queries++;
    await env.STATE.put(key, JSON.stringify(usage));
  } catch (e) {
    // Silently fail - don't break requests for usage tracking issues
  }
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

// ─── Edge Cache API ───────────────────────────────────────────────
const DEFAULT_TTL = 10; // seconds

async function getCachedOrFetch<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL
): Promise<T> {
  try {
    const cache = caches.default;
    const cacheReq = new Request('https://aether-cache/' + cacheKey);
    const cached = await cache.match(cacheReq);
    
    if (cached) {
      return await cached.json() as T;
    }
    
    const data = await fetcher();
    const response = new Response(JSON.stringify(data), {
      headers: { 
        'Cache-Control': `max-age=${ttlSeconds}`,
        'Content-Type': 'application/json'
      }
    });
    await cache.put(cacheReq, response);
    return data;
  } catch {
    // Fallback to fetch on cache error
    return fetcher();
  }
}

async function invalidateCache(key: string): Promise<void> {
  try {
    const cache = caches.default;
    const cacheReq = new Request('https://aether-cache/' + key);
    await cache.delete(cacheReq);
  } catch {}
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Rate limit
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }
    const url = new URL(request.url);

    // Track request usage
    if (env.STATE) {
      trackUsage(env, ip, 'request');
    }
    
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return json(null, 204);
    }
    
    try {
      const path = url.pathname;
      const method = request.method;
      
      // GET /health - returns v0.2 contract with bindings
      if (path === '/health') {
        return json({
          ok: true,
          service: SERVICE,
          version: VERSION,
          ts: new Date().toISOString(),
          bindings: getBindings(env),
        });
      }
      
      // GET /crew/status - summary with all bindings
      if (path === '/crew/status' || path === '/crew') {
        const bindings = getBindings(env);
        const bindingsMissing = !bindings.DB || !bindings.STATE || !bindings.STATE_CACHE || !bindings.MYBROWSER;
        
        let proposals = { count: 0, updatedAt: null as string | null, items: [] as unknown[] };
        let lessons = { count: 0, updatedAt: null as string | null, items: [] as unknown[] };
        
        if (env.STATE) {
          try {
            const raw = await env.STATE_CACHE.get('proposals:snapshot');
            const parsed = raw ? JSON.parse(raw) : null;
            if (Array.isArray(parsed)) {
              proposals.items = parsed;
            } else if (parsed && Array.isArray(parsed.proposals)) {
              proposals.items = parsed.proposals;
              proposals.updatedAt = parsed.updatedAt ?? null;
            }
            proposals.count = proposals.items.length;
            if (!proposals.updatedAt && proposals.count > 0) {
              proposals.updatedAt = new Date().toISOString();
            }
          } catch { /* ignore */ }
        }
        
        if (env.STATE_CACHE) {
          try {
            const raw = await env.STATE_CACHE.get('lessons:index');
            const parsed = raw ? JSON.parse(raw) : null;
            if (Array.isArray(parsed)) {
              lessons.items = parsed;
            } else if (parsed && Array.isArray(parsed.lessons)) {
              lessons.items = parsed.lessons;
              lessons.updatedAt = parsed.updatedAt ?? null;
            }
            lessons.count = lessons.items.length;
            if (!lessons.updatedAt && lessons.count > 0) {
              lessons.updatedAt = new Date().toISOString();
            }
          } catch { /* ignore */ }
        }
        
        return json({
          ok: true,
          service: SERVICE,
          version: VERSION,
          ts: new Date().toISOString(),
          bindings,
          bindingsMissing,
          proposals,
          lessons,
        });
      }
      
      // GET /proposals - returns proposals from STATE KV
      if (path === '/proposals') {
        let proposals: unknown[] = [];
        let updatedAt: string | null = null;
        
        if (env.STATE) {
          try {
            const rawValue = await env.STATE_CACHE.get('proposals:snapshot');
                    const value = rawValue;
            const parsed = value ? JSON.parse(value) : null;
            if (Array.isArray(parsed)) {
              proposals = parsed;
            } else if (parsed && Array.isArray(parsed.proposals)) {
              proposals = parsed.proposals;
              updatedAt = parsed.updatedAt ?? null;
            }
          } catch { /* ignore */ }
        }
        
        return json({
          ok: true,
          proposals,
          updatedAt,
          count: proposals.length,
        });
      }
      
      // GET /lessons - returns lessons from STATE_CACHE KV
      if (path === '/lessons') {
        let lessons: unknown[] = [];
        let updatedAt: string | null = null;
        
        if (env.STATE_CACHE) {
          try {
            const value = await env.STATE_CACHE.get('lessons:index');
            const parsed = value ? JSON.parse(value) : null;
            if (Array.isArray(parsed)) {
              lessons = parsed;
            } else if (parsed && Array.isArray(parsed.lessons)) {
              lessons = parsed.lessons;
              updatedAt = parsed.updatedAt ?? null;
            }
          } catch { /* ignore */ }
        }
        
        return json({
          ok: true,
          lessons,
          updatedAt,
          count: lessons.length,
        });
      }
      
      // POST /lessons/check - detect hash collisions
      if (path === '/lessons/check' && method === 'POST') {
        let hash = '';
        let collision: unknown | null = null;
        
        try {
          const body = await request.json() as { hash?: string };
          if (typeof body.hash === 'string' && body.hash.length > 0) {
            hash = body.hash;
            if (env.STATE_CACHE) {
              const existing = await env.STATE_CACHE.get(`lessons:hash:${hash}`);
              if (existing) collision = JSON.parse(existing);
            }
          } else {
            return json({ ok: false, error: 'Missing hash' }, 400);
          }
        } catch {
          return json({ ok: false, error: 'Invalid request body' }, 400);
        }
        
        return json({ ok: true, hash, collision });
      }
      
      // POST /proposals/write - write proposals snapshot (workflow writer)
      if (path === '/proposals/write' && method === 'POST' && env.STATE) {
        try {
          const body = await request.json() as { items?: unknown[]; source?: string };
          const items = body.items || [];
          
          const payload = {
            items,
            source: body.source || 'backend-proposals-watcher',
            updatedAt: new Date().toISOString(),
          };
          
          await env.STATE_CACHE.put('proposals:snapshot', JSON.stringify(payload));
          
          return json({ ok: true, updatedAt: payload.updatedAt });
        } catch {
          return json({ ok: false, error: 'Invalid request body' }, 400);
        }
      }
      
      // POST /lessons/write - write lessons index (workflow writer)
      if (path === '/lessons/write' && method === 'POST' && env.STATE_CACHE) {
        try {
          const body = await request.json() as { items?: unknown[]; source?: string };
          const items = body.items || [];
          
          const payload = {
            items,
            source: body.source || 'backend-proposals-watcher',
            updatedAt: new Date().toISOString(),
          };
          
          await env.STATE_CACHE.put('lessons:index', JSON.stringify(payload));
          
          return json({ ok: true, updatedAt: payload.updatedAt });
        } catch {
          return json({ ok: false, error: 'Invalid request body' }, 400);
        }
      }
      

      // POST /webhooks/notion - Notion webhook receiver with HMAC verification
      if (path === '/webhooks/notion' && method === 'POST') {
        const signature = request.headers.get('x-notion-signature') || request.headers.get('x-hub-signature');
        const rawBody = await request.clone().text();
        
        if (signature && env.NOTION_WEBHOOK_SECRET) {
          // HMAC verification using Web Crypto API (B3 fix — no Node.js dependency)
          const enc = new TextEncoder();
          const key = await crypto.subtle.importKey(
            'raw', enc.encode(env.NOTION_WEBHOOK_SECRET),
            { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
          );
          const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
          const expectedHex = Array.from(new Uint8Array(sigBuf))
            .map(b => b.toString(16).padStart(2, '0')).join('');
          const providedHex = signature.replace(/^sha256=/, '');
          
          // Constant-time comparison via double-HMAC
          if (expectedHex.length !== providedHex.length) {
            console.log('[Webhook] HMAC verification FAILED');
            return json({ ok: false, error: 'Invalid signature' }, 401);
          }
          const cmpKey = await crypto.subtle.importKey(
            'raw', enc.encode('hmac-cmp'),
            { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
          );
          const mac1 = new Uint8Array(await crypto.subtle.sign('HMAC', cmpKey, enc.encode(expectedHex)));
          const mac2 = new Uint8Array(await crypto.subtle.sign('HMAC', cmpKey, enc.encode(providedHex)));
          let eq = true;
          for (let i = 0; i < mac1.length; i++) eq = eq && (mac1[i] === mac2[i]);
          if (!eq) {
            console.log('[Webhook] HMAC verification FAILED');
            return json({ ok: false, error: 'Invalid signature' }, 401);
          }
          console.log('[Webhook] HMAC verification PASSED');
        } else if (!env.NOTION_WEBHOOK_SECRET) {
          console.log('[Webhook] WARNING: NOTION_WEBHOOK_SECRET not configured');
        } else {
          console.log('[Webhook] WARNING: No signature header');
        }
        
        try {
          const event = JSON.parse(rawBody);
          console.log('[Webhook] Received Notion event');
          const timestamp = new Date().toISOString();
          const eventId = event.data?.id || event.id || `notion-${Date.now()}`;

          // Deduplication check
        const existingEvent = await env.DB.prepare(
          "SELECT event_id FROM events WHERE event_id = ? LIMIT 1"
        ).bind(eventId).first();
        if (existingEvent) {
          console.log('[Webhook] Duplicate event skipped: ' + eventId);
          return json({ ok: true, duplicate: true });
        }

        // Log to D1 events table for audit trail (idempotent)
          if (env.DB) {
            const pageId = event.data?.id || '';
            const databaseId = event.data?.parent?.database_id || event.data?.parent?.page_id || '';
            // Idempotent insert - ignore if exists
            await env.DB.prepare(
              "INSERT OR IGNORE INTO events (event_id, source, kind, level, page_id, database_id, payload, session_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            ).bind(eventId, 'tier2-webhook', 'WHK_RECEIVED', 'info', pageId, databaseId, rawBody.substring(0, 500), pageId, timestamp).run();
          }

          // Use STATE_CACHE (lessons KV) for proposals as fallback since STATE has issues
          if (env.STATE_CACHE) {
                        const existing = await env.STATE_CACHE.get('proposals:snapshot');
            let items: any[] = [];
            if (existing) {
              try { items = JSON.parse(existing).proposals || []; } catch {}
            }
            
            items.push({
              id: event.data?.id || event.id || `notion-${Date.now()}`,
              title: event.data?.title || event.data?.Name?.title?.[0]?.plain_text || 'Untitled',
              stage: 'pending_review',
              source: 'notion-webhook',
              timestamp,
            });
            
            await env.STATE_CACHE.put('proposals:snapshot', JSON.stringify({
              proposals: items,
              source: 'notion-webhook',
              updatedAt: timestamp,
            }));
                      }
          
          if (env.STATE_CACHE) {
            const existingCache = await env.STATE_CACHE.get('lessons:index');
            let lessons: any[] = [];
            if (existingCache) {
              try { lessons = JSON.parse(existingCache).lessons || []; } catch {}
            }
            
            lessons.push({
              id: event.data?.id || event.id || `notion-${Date.now()}`,
              title: `Notion Update: ${event.data?.title || 'Event'}`,
              hash: event.data?.id || event.id,
              source: 'notion-webhook',
              timestamp,
            });
            
            await env.STATE_CACHE.put('lessons:index', JSON.stringify({
              lessons: lessons,
              source: 'notion-webhook',
              updatedAt: timestamp,
            }));
          }
          
          return json({ ok: true, received: true, timestamp });
        } catch (e) {
          return json({ ok: false, error: 'Invalid JSON' }, 400);
        }
      }

      // Legacy API: /api/stack
      if (path === '/api/stack') {
        return json({
          status: 'online',
          backend: 'alpha-bridge',
          timestamp: new Date().toISOString()
        });
      }
      
      // Legacy API: /api/execute
      if (path === '/api/execute' && method === 'POST') {
        return json({ success: true, result: { message: 'Execution queued' } });
      }
      
      // Legacy API: /api/execute/status
      if (path === '/api/execute/status' && method === 'GET') {
        return json({ status: 'idle', currentStep: 0, totalSteps: 0 });
      }
      

      // GET /api/events - query events from D1
      if (path === '/api/events') {
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
        const source = url.searchParams.get("source");
        const kind = url.searchParams.get("kind");
        const level = url.searchParams.get("level");

        let query = "SELECT * FROM events";
        const conditions: string[] = [];
        const params: any[] = [];

        if (source) { conditions.push("source = ?"); params.push(source); }
        if (kind) { conditions.push("kind = ?"); params.push(kind); }
        if (level) { conditions.push("level = ?"); params.push(level); }

        if (conditions.length > 0) {
          query += " WHERE " + conditions.join(" AND ");
        }
        query += " ORDER BY created_at DESC LIMIT ?";
        params.push(limit);

        const { results } = await env.DB.prepare(query).bind(...params).all();

        return new Response(JSON.stringify({ ok: true, count: results.length, events: results }), {
          headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        });
      }

      // GET /dashboard - HTML dashboard
      if (path === '/dashboard') {
        const { results } = await env.DB.prepare(
          "SELECT * FROM events ORDER BY created_at DESC LIMIT 100"
        ).all();

        const proposalsRaw = await env.STATE_CACHE.get("proposals:snapshot");
        const lessonsRaw = await env.STATE_CACHE.get("lessons:index");
        const proposals = proposalsRaw ? JSON.parse(proposalsRaw) : null;
        const lessons = lessonsRaw ? JSON.parse(lessonsRaw) : null;

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aether Bridge — Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'SF Mono', 'Fira Code', monospace; background: #080808; color: #e0e0e0; padding: 24px; }
    h1 { color: #00ff88; font-size: 18px; margin-bottom: 8px; }
    h2 { color: #4db8ff; font-size: 14px; margin: 20px 0 8px; }
    .meta { color: #888; font-size: 12px; margin-bottom: 20px; }
    .cards { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .card { background: #0d0d0d; border: 1px solid #222; border-radius: 8px; padding: 16px; min-width: 180px; }
    .card .label { color: #888; font-size: 11px; text-transform: uppercase; }
    .card .value { color: #00ff88; font-size: 24px; font-weight: bold; }
    .card .sub { color: #666; font-size: 11px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; color: #888; padding: 8px 12px; border-bottom: 1px solid #222; font-size: 11px; text-transform: uppercase; }
    td { padding: 6px 12px; border-bottom: 1px solid #111; }
    tr:hover { background: #0d0d0d; }
    .kind { color: #4db8ff; }
    .source { color: #f59e0b; }
    .level-info { color: #00ff88; }
    .level-warn { color: #f59e0b; }
    .level-error { color: #ff4444; }
    .ts { color: #666; font-size: 11px; }
    .empty { color: #555; text-align: center; padding: 40px; }
    .refresh { background: none; border: 1px solid #333; color: #888; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 11px; float: right; }
    .refresh:hover { border-color: #00ff88; color: #00ff88; }
  </style>
</head>
<body>
  <h1>AETHER BRIDGE <span style="color:#666">v0.3.0</span></h1>
  <div class="meta">Operator dashboard &middot; ${new Date().toISOString()}</div>

  <div class="cards">
    <div class="card">
      <div class="label">Proposals</div>
      <div class="value">${(proposals as any)?.proposals?.length ?? (proposals as any)?.count ?? 0}</div>
      <div class="sub">${(proposals as any)?.source ?? "—"}</div>
    </div>
    <div class="card">
      <div class="label">Lessons</div>
      <div class="value">${(lessons as any)?.lessons?.length ?? (lessons as any)?.count ?? 0}</div>
      <div class="sub">${(lessons as any)?.source ?? "—"}</div>
    </div>
    <div class="card">
      <div class="label">Events</div>
      <div class="value">${results.length}</div>
      <div class="sub">last 100</div>
    </div>
  </div>

  <h2>Event Log <button class="refresh" onclick="location.reload()">↻ refresh</button></h2>
  ${results.length > 0 ? `<table>
    <tr><th>Time</th><th>Kind</th><th>Source</th><th>Level</th><th>Page ID</th><th>Event ID</th></tr>
    ${(results as any[]).map((e: any) => `<tr>
      <td class="ts">${e.created_at?.slice(11, 19) ?? "—"}</td>
      <td class="kind">${e.kind ?? "—"}</td>
      <td class="source">${e.source ?? "—"}</td>
      <td class="level-${e.level ?? "info"}">${e.level ?? "—"}</td>
      <td>${e.page_id?.slice(0, 12) ?? "—"}${e.page_id?.length > 12 ? "…" : ""}</td>
      <td class="ts">${e.event_id?.slice(0, 12) ?? "—"}…</td>
    </tr>`).join("")}
  </table>` : `<div class="empty">No events recorded yet. Webhook and queue activity will appear here.</div>`}
</body>
</html>`;

        return new Response(html, {
          headers: { "Content-Type": "text/html", "Cache-Control": "no-cache" },
        });
      }


      // GET /api/ai/presence - get AI presence status
      if (path === '/api/ai/presence') {
        if (!env.STATE_CACHE) return json({ error: 'STATE_CACHE not bound' }, 500);
        const rawStr = await env.STATE_CACHE.get('ai:presence');
        let raw: Record<string, unknown> = {};
        if (rawStr) {
          try {
            let parsed = JSON.parse(rawStr);
            if (typeof parsed === 'string') parsed = JSON.parse(parsed);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) raw = parsed as Record<string, unknown>;
          } catch { /* empty */ }
        }
        const aiList = Object.entries(raw);
        if (env.STATE) trackUsage(env, ip, 'ai_call');
        return json({ ok: true, count: aiList.length, ais: Object.fromEntries(aiList) });
      }

      // POST /api/ai/heartbeat - update AI presence
      if (path === '/api/ai/heartbeat' && method === 'POST') {
        if (!env.STATE_CACHE) return json({ error: 'STATE_CACHE not bound' }, 500);
        const body = await request.json() as Record<string, unknown>;
        const { ai_id, name, status = 'active', role } = body as { ai_id?: string; name?: string; status?: string; role?: string };
        if (!ai_id) return json({ error: 'ai_id required' }, 400);

        // Resilient KV parse — handles double-encoded JSON strings
        const rawStr = await env.STATE_CACHE.get('ai:presence');
        let raw: Record<string, unknown> = {};
        if (rawStr) {
          try {
            let parsed = JSON.parse(rawStr);
            // Handle double-encoded values (string after first parse)
            if (typeof parsed === 'string') parsed = JSON.parse(parsed);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) raw = parsed as Record<string, unknown>;
          } catch { /* start fresh if corrupt */ }
        }
        raw[ai_id] = { name: name || ai_id, status, role, last_seen: new Date().toISOString(), expires_at: new Date(Date.now() + 300000).toISOString() };
        await env.STATE_CACHE.put('ai:presence', JSON.stringify(raw));
        return json({ ok: true, ai_id, status });
      }

      // POST /api/council/log - log a conversation message
      if (path === '/api/council/log' && method === 'POST') {
        const body = await request.json() as { session_id: string; agent_id: string; role: string; content: string };
        const { session_id, agent_id, role, content } = body;
        if (!session_id || !agent_id || !role || !content) {
          return json({ error: 'session_id, agent_id, role, content required' }, 400);
        }
        const timestamp = new Date().toISOString();
        const message_id = `${session_id}-${timestamp}-${agent_id}`;
        // Idempotent insert
        await env.DB.prepare(
          "INSERT OR IGNORE INTO council_logs (session_id, agent_id, role, content, message_id, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(session_id, agent_id, role, content.substring(0, 5000), message_id, timestamp).run();
        if (env.STATE) trackUsage(env, ip, 'd1_query');
        return json({ ok: true, timestamp });
      }

      // GET /api/usage - get usage for this IP
      if (path === '/api/usage') {
        if (!env.STATE) return json({ error: 'STATE not bound' }, 500);
        const raw = await env.STATE.get(`usage:${ip}`);
        let usage = { requests: 0, ai_calls: 0, d1_queries: 0 };
        if (raw) {
          try { usage = JSON.parse(raw); } catch {}
        }
        return json({ ok: true, ip, usage });
      }

      // GET /api/council/history - get conversation history
      if (path === '/api/council/history') {
        const session_id = url.searchParams.get('session_id');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
        if (!session_id) {
          return json({ error: 'session_id required' }, 400);
        }
        const { results } = await env.DB.prepare(
          "SELECT * FROM council_logs WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?"
        ).bind(session_id, limit).all();
        return json({ ok: true, count: results.length, messages: results });
      }


      // GET /api/council/replay - deterministic event-driven replay
      if (path === '/api/council/replay') {
        const sessionId = url.searchParams.get('session_id');
        if (!sessionId) {
          return json({ error: 'session_id required' }, 400);
        }

        try {
          // Query structured events (not logs)
          const { results: rawEvents } = await env.DB.prepare(`
            SELECT event_id, kind, level, page_id, database_id, payload, created_at
            FROM events
            WHERE session_id = ? OR page_id = ?
            ORDER BY created_at ASC
          `).bind(sessionId, sessionId).all();

          // Deterministic state reducer
          const state = {
            score: 0,
            flags: [] as string[],
            lane: 'ai-only',
            history: [] as any[]
          };

          for (const e of rawEvents) {
            const eventKind = e.kind;
            const payload = typeof e.payload === 'string' ? JSON.parse(e.payload) : (e.payload || {});

            switch (eventKind) {
              case 'CURATOR_EVALUATED':
                state.score = payload.score || 0;
                payload.flags?.forEach((f: string) => {
                  if (!state.flags.includes(f)) state.flags.push(f);
                });
                break;
              case 'RULE_APPLIED':
                state.score += payload.delta || 0;
                if (payload.flag && !state.flags.includes(payload.flag)) {
                  state.flags.push(payload.flag);
                }
                break;
              case 'LANE_SWITCHED':
                state.lane = payload.lane || 'human-only';
                break;
              case 'QUEUE_ENQUEUED':
                if (payload.lane) state.lane = payload.lane;
                break;
            }

            state.history.push({
              at: e.created_at,
              type: eventKind,
              snapshot: { score: state.score, flags: [...state.flags], lane: state.lane }
            });
          }

          return json({
            session_id: sessionId,
            meta: { total: state.history.length, final_score: state.score, lane: state.lane },
            timeline: state.history
          });
        } catch (err: any) {
          return json({ error: 'Replay failed', details: err.message }, 500);
        }
      }


      // GET /api/council/policy-diff - compare policies on same event stream
      if (path === '/api/council/policy-diff') {
        const sessionId = url.searchParams.get('session_id');
        const policyA = url.searchParams.get('a') || 'curator:v1';
        const policyB = url.searchParams.get('b') || 'curator:v2';
        if (!sessionId) {
          return json({ error: 'session_id required' }, 400);
        }

        try {
          const { results: rawEvents } = await env.DB.prepare(`
            SELECT event_id, kind, level, page_id, database_id, payload, created_at
            FROM events
            WHERE session_id = ? OR page_id = ?
            ORDER BY created_at ASC
          `).bind(sessionId, sessionId).all();

          // Parse events
          const events = rawEvents.map((e: any) => ({
            event_type: e.kind,
            payload: typeof e.payload === 'string' ? JSON.parse(e.payload) : (e.payload || {}),
            created_at: e.created_at
          }));

          // Policy v1 (original rules)
          const reduceV1 = (evts: any[]) => {
            const state = { score: 0, flags: [] as string[], lane: 'ai-only', history: [] as any[] };
            for (const e of evts) {
              if (e.event_type === 'CURATOR_EVALUATED') {
                state.score = e.payload.score || 0;
                (e.payload.flags || []).forEach((f: string) => { if (!state.flags.includes(f)) state.flags.push(f); });
              }
              if (e.event_type === 'RULE_APPLIED') {
                state.score += e.payload.delta || 0;
                if (e.payload.flag && !state.flags.includes(e.payload.flag)) state.flags.push(e.payload.flag);
              }
              if (e.event_type === 'LANE_SWITCHED') state.lane = e.payload.lane || 'human-only';
              if (e.event_type === 'QUEUE_ENQUEUED' && e.payload.lane) state.lane = e.payload.lane;
              state.history.push({ at: e.created_at, type: e.event_type, snapshot: { ...state } });
            }
            return state;
          };

          // Policy v2 (stricter rules)
          const reduceV2 = (evts: any[]) => {
            const state = { score: 0, flags: [] as string[], lane: 'ai-only', history: [] as any[] };
            for (const e of evts) {
              if (e.event_type === 'CURATOR_EVALUATED') {
                state.score = (e.payload.score || 0) * 0.5;  // Stricter scoring
                (e.payload.flags || []).forEach((f: string) => { if (!state.flags.includes(f)) state.flags.push(f); });
              }
              if (e.event_type === 'RULE_APPLIED') {
                state.score += (e.payload.delta || 0) * 0.5;
                if (e.payload.flag && !state.flags.includes(e.payload.flag)) state.flags.push(e.payload.flag);
              }
              if (e.event_type === 'LANE_SWITCHED') state.lane = e.payload.lane || 'human-only';
              if (e.event_type === 'QUEUE_ENQUEUED' && e.payload.lane) state.lane = e.payload.lane;
              state.history.push({ at: e.created_at, type: e.event_type, snapshot: { ...state } });
            }
            return state;
          };

          const a = reduceV1(events);
          const b = reduceV2(events);

          // Compute divergences
          const divergences: any[] = [];
          const maxLen = Math.max(a.history.length, b.history.length);
          for (let i = 0; i < maxLen; i++) {
            const ea = a.history[i];
            const eb = b.history[i];
            const diff: any = {};
            if (ea && eb) {
              if (ea.snapshot.score !== eb.snapshot.score) diff.score = { a: ea.snapshot.score, b: eb.snapshot.score };
              if (ea.snapshot.lane !== eb.snapshot.lane) diff.lane = { a: ea.snapshot.lane, b: eb.snapshot.lane };
              const fa = new Set(ea.snapshot.flags);
              const fb = new Set(eb.snapshot.flags);
              const added = [...fb].filter(f => !fa.has(f));
              const removed = [...fa].filter(f => !fb.has(f));
              if (added.length || removed.length) diff.flags = { added, removed };
            }
            if (Object.keys(diff).length) {
              divergences.push({ index: i, at: ea?.at, event_type: ea?.type || eb?.type, diff });
            }
          }

          return json({
            session_id: sessionId,
            policies: { a: policyA, b: policyB },
            final: { a: { score: a.score, flags: a.flags, lane: a.lane }, b: { score: b.score, flags: b.flags, lane: b.lane } },
            divergences
          });
        } catch (err: any) {
          return json({ error: 'Diff failed', details: err.message }, 500);
        }
      }

      // POST /tasks - create a task and log to BRIDGE_DB audit trail
      if (path === '/tasks' && method === 'POST') {
        if (!env.BRIDGE_DB) return json({ error: 'BRIDGE_DB not bound' }, 500);
        const body = await request.json() as Record<string, unknown>;
        const { ai_id, title, description } = body as { ai_id?: string; title?: string; description?: string };
        if (!ai_id) return json({ error: 'ai_id required' }, 400);
        if (!title) return json({ error: 'title required' }, 400);

        const task_id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const timestamp = new Date().toISOString();

        // Write audit event to BRIDGE_DB
        await env.BRIDGE_DB.prepare(
          "INSERT OR IGNORE INTO events (event_id, source, kind, level, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(task_id, 'api', 'TASK_CREATED', 'info', JSON.stringify({ ai_id, title, description: (description || '').substring(0, 1000) }), timestamp).run();

        if (env.STATE) trackUsage(env, ip, 'd1_query');
        return json({ ok: true, task_id, ai_id, title, timestamp });
      }

      // 404
      return json({ error: 'Not found' }, 404);
      
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  },

  // Queue consumer handler
  async queue(batch: any, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      try {
        const job = message.body as CuratorJob;
        // Queue visibility events
        if (env.DB) {
          await env.DB.prepare(
            "INSERT OR IGNORE INTO events (event_id, source, kind, level, page_id, database_id, payload, session_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(job.id, 'curator-queue', 'QUEUE_DEQUEUED', 'info', job.pageId || '', job.databaseId || '', JSON.stringify(job), job.sessionId || job.pageId, new Date().toISOString()).run();
        }
        
        console.log(JSON.stringify({
          ts: new Date().toISOString(),
          kind: "WHK_QUEUE_CONSUME",
          payload: { jobId: job.id, eventType: job.eventType, pageId: job.pageId },
        }));

        // Process the job - write to KV as processed marker
        if (job.pageId && env.STATE_CACHE) {
          const existingStr = await env.STATE_CACHE.get("lessons:index");
          let existing: { ok: boolean; lessons: Array<Record<string, string>>; source: string; updatedAt: string } = { ok: true, lessons: [], source: "curator-queue", updatedAt: "" };
          if (existingStr) {
            try { existing = JSON.parse(existingStr); } catch {}
          }

          if (!existing.lessons) existing.lessons = [];
          existing.lessons.push({
            id: `curator-${job.id}`,
            source: "curator-queue",
            eventType: job.eventType,
            pageId: job.pageId,
            processedAt: new Date().toISOString(),
          });
          existing.updatedAt = new Date().toISOString();
          existing.source = "curator-queue";

          await env.STATE_CACHE.put("lessons:index", JSON.stringify(existing));
        }

        message.ack();
        console.log(JSON.stringify({
          ts: new Date().toISOString(),
          kind: "WHK_JOB_COMPLETED",
          level: "info",
          source: "curator-consumer",
          payload: { jobId: job.id },
        }));
      } catch (err) {
        console.error(JSON.stringify({
          ts: new Date().toISOString(),
          kind: "WHK_DISPATCH_FAIL",
          level: "error",
          source: "curator-consumer",
          payload: { error: String(err) },
        }));
        message.retry();
      }
    }
  },
};

// Types for Cloudflare
interface Env {
  DB: D1Database;
  BRIDGE_DB: D1Database; // aether-bridge-db — runs, registry, audit
  STATE: KVNamespace;
  STATE_CACHE: KVNamespace;
  METRICS: KVNamespace; // metrics KV store
  MYBROWSER: any;
  NOTION_WEBHOOK_SECRET: string;
  CURATOR_QUEUE: any; // Cloudflare Queue producer
  DISPATCHER: Fetcher; // service binding → aether worker
  _LOGS: R2Bucket; // R2 bucket for logs
}

// API Key + Tier helpers
async function getApiKeyTier(env: Env, auth: string): Promise<{tier: string, key: string} | null> {
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const key = auth.slice(7);
  const hash = await hashKey(key);
  const storedStr = await env.STATE.get(`api_key:${hash}`);
  if (!storedStr) return null;
  try {
    const stored = JSON.parse(storedStr);
    return { tier: stored.tier || 'free', key: hash };
  } catch { return null; }
}

async function hashKey(key: string): Promise<string> {
  const msg = new TextEncoder().encode(key);
  const hash = await crypto.subtle.digest('SHA-256', msg);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const TIER_LIMITS: Record<string, {daily: number}> = {
  free: { daily: 100 },
  pro: { daily: 5000 },
  enterprise: { daily: Infinity }
};

async function checkTierLimit(env: Env, key: string, tier: string): Promise<boolean> {
  const tierConfig = TIER_LIMITS[tier] || TIER_LIMITS.free;
  if (tierConfig.daily === Infinity) return true;
  const today = new Date().toISOString().slice(0, 10);
  const countKey = `daily:${today}:${key}`;
  const raw = await env.STATE.get(countKey);
  const count = raw ? parseInt(raw) : 0;
  return count < tierConfig.daily;
}

async function incrementUsage(env: Env, key: string, endpoint: string, tier: string) {
  const today = new Date().toISOString().slice(0, 10);
  const countKey = `daily:${today}:${key}`;
  const raw = await env.STATE.get(countKey);
  const count = raw ? parseInt(raw) : 0;
  await env.STATE.put(countKey, String(count + 1));
  // Emit usage event to D1
  const timestamp = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO events (type, payload, timestamp) VALUES (?, ?, ?)"
  ).bind('USAGE_RECORDED', JSON.stringify({ key, endpoint, tier }), timestamp).run();
}

// Queue message type
interface CuratorJob {
  id: string;
  eventId: string;
  eventType: string;
  pageId: string;
  databaseId?: string;
  sessionId?: string;
  receivedAt: string;
  raw?: string;
  source?: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<void>): void;
  passThroughOnException(): void;
}



