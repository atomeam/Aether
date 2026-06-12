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
import { krakenTradingBot } from './kraken-trading';

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
      
      // GET /pay - quick payment redirect (workaround for Vercel routing)
      if (path === '/pay' && method === 'GET') {
        const amount = parseInt(url.searchParams.get('amount') || '49', 10);
        const email = url.searchParams.get('email') || '';
        const paymentMethod = url.searchParams.get('method') || 'crypto';

        // Stripe payment
        if (paymentMethod === 'stripe') {
          try {
            const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
              },
              body: new URLSearchParams({
                'payment_method_types[0]': 'card',
                'line_items[0][price_data][currency]': 'usd',
                'line_items[0][price_data][product_data][name]': 'Aether Pro Access',
                'line_items[0][price_data][product_data][description]': 'Autonomous agent teams, priority rate limits, council session logs',
                'line_items[0][price_data][unit_amount]': (amount * 100).toString(),
                'line_items[0][quantity]': '1',
                'mode': 'payment',
                'success_url': 'https://aether.a-to-mind.com?checkout=success',
                'cancel_url': 'https://aether.a-to-mind.com?checkout=cancelled',
                'customer_email': email,
                'metadata[email]': email,
                'metadata[tier]': amount === 29 ? 'starter' : amount === 99 ? 'enterprise' : 'pro',
              }),
            });

            if (!stripeResponse.ok) {
              const error = await stripeResponse.text();
              return json({ error: 'Stripe API error', details: error }, 500);
            }

            const session = await stripeResponse.json();
            return Response.redirect(session.url, 303);
          } catch (err) {
            return json({ error: 'Stripe checkout failed', details: err instanceof Error ? err.message : 'unknown' }, 500);
          }
        }

        // PayPal payment (placeholder - needs PayPal integration)
        if (paymentMethod === 'paypal') {
          return json({ 
            error: 'PayPal integration coming soon',
            message: 'Please use Credit Card or Crypto for now'
          }, 501);
        }

        // XPTP crypto payment (existing)
        const walletAddress = '0xDe497AF77d0edf1cC8B902Ae854987F67c375Fa0';

        try {
          const response = await fetch('https://xptp.net/api/v1/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount_usd: amount,
              options: [
                { chain: 'base', token: 'USDC', address: walletAddress },
                { chain: 'ethereum', token: 'ETH', address: walletAddress },
                { chain: 'polygon', token: 'USDC', address: walletAddress },
              ],
              webhook_url: 'https://bridge.a-to-mind.com/api/billing/webhook',
              redirect_url: 'https://aether.a-to-mind.com?checkout=success',
              metadata: { email, tier: 'pro' },
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            return json({ error: 'XPTP API error', details: error }, 500);
          }

          const payment = await response.json() as XPTPPaymentResponse;
          
          // Redirect to XPTP payment page
          return Response.redirect(payment.payment_url, 302);
        } catch (err) {
          return json({ error: 'checkout failed', details: err instanceof Error ? err.message : 'unknown' }, 500);
        }
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
        
        // Parse body early for verification challenge detection
        let parsed: any;
        try {
          parsed = JSON.parse(rawBody);
        } catch (e) {
          console.log('[Webhook] Invalid JSON');
          return json({ ok: false, error: 'Invalid JSON' }, 400);
        }
        
        // Notion verification handshake: bare { verification_token }, NO type field, NO signature.
        // The token is the future signing secret, so this request is unsigned by design.
        if (parsed?.verification_token && !parsed?.type && !parsed?.event) {
          console.log('[Webhook] WHK_HANDSHAKE token=', parsed.verification_token);
          return json({ ok: true }, 200);
        }
        
        // Check signature for all non-handshake requests
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
          const event = parsed;
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

          // ── Echo-loop + junk guards ──
          // 1) Skip events generated by our own bot/integration (webhook echo loop)
          const actors = (event.authors || (event.data?.created_by ? [event.data.created_by] : [])) as Array<{ type?: string }>;
          const isBotEcho = actors.some(a => a?.type === 'bot');
          // 2) Require a real, resolvable title — no more "Untitled"/"Notion Update: Event" junk rows
          const resolvedTitle = event.data?.title
            || event.data?.Name?.title?.[0]?.plain_text
            || event.data?.properties?.Name?.title?.[0]?.plain_text
            || '';
          if (isBotEcho || !resolvedTitle.trim()) {
            console.log(`[Webhook] Skipped (${isBotEcho ? 'bot echo' : 'no title'}): ${eventId}`);
            return json({ ok: true, skipped: true, reason: isBotEcho ? 'bot_echo' : 'no_title' });
          }

          // Use STATE_CACHE (lessons KV) for proposals as fallback since STATE has issues
          if (env.STATE_CACHE) {
                        const existing = await env.STATE_CACHE.get('proposals:snapshot');
            let items: any[] = [];
            if (existing) {
              try { items = JSON.parse(existing).proposals || []; } catch {}
            }
            
            if (!items.some(it => it.id === eventId)) {
              items.push({
                id: eventId,
                title: resolvedTitle,
                stage: 'pending_review',
                source: 'notion-webhook',
                timestamp,
              });
            }
            items = items.slice(-200); // cap snapshot size
            
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
            
            if (!lessons.some(l => l.id === eventId)) {
              lessons.push({
                id: eventId,
                title: `Notion Update: ${resolvedTitle}`,
                hash: eventId,
                source: 'notion-webhook',
                timestamp,
              });
            }
            lessons = lessons.slice(-200); // cap index size
            
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


      // ─── Billing: XPTP crypto checkout → API key issuance ───────────────
interface XPTPPaymentResponse {
  id: string;
  payment_url: string;
  webhook_secret?: string;
  status?: string;
  confirmed?: boolean;
}

// POST /api/billing/checkout — create XPTP crypto payment
      if (path === '/api/billing/checkout' && method === 'POST') {
        const body = await request.json().catch(() => null) as { amount?: number; email?: string } | null;
        const amount = body?.amount || 49; // Default $49 for Pro tier
        const email = body?.email || '';

        // Aether wallet address (USDC on Base)
        const walletAddress = '0xDe497AF77d0edf1cC8B902Ae854987F67c375Fa0';

        try {
          const response = await fetch('https://xptp.net/api/v1/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount_usd: amount,
              options: [
                { chain: 'base', token: 'USDC', address: walletAddress },
                { chain: 'ethereum', token: 'ETH', address: walletAddress },
                { chain: 'polygon', token: 'USDC', address: walletAddress },
              ],
              webhook_url: 'https://bridge.a-to-mind.com/api/billing/webhook',
              redirect_url: 'https://aether.a-to-mind.com?checkout=success',
              metadata: { email, tier: 'pro' },
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            return json({ error: 'XPTP API error', details: error }, 500);
          }

          const payment = await response.json() as XPTPPaymentResponse;
          // Never return webhook_secret to the client — server-to-server only
          return json({ url: payment.payment_url, paymentId: payment.id });
        } catch (err) {
          return json({ error: 'checkout failed', details: err instanceof Error ? err.message : 'unknown' }, 500);
        }
      }

      // POST /api/billing/webhook — XPTP webhook (payment.completed)
      if (path === '/api/billing/webhook' && method === 'POST') {
        const payload = await request.json().catch(() => null) as {
          id?: string;
          status?: string;
          amount_usd?: number;
          metadata?: { email?: string; tier?: string; ref?: string };
          webhook_secret?: string;
        } | null;

        if (!payload) return json({ error: 'invalid payload' }, 400);

        const { id, status, amount_usd, metadata } = payload;
        const ref = metadata?.ref || null;

        if (!id || status !== 'completed') {
          return json({ error: 'invalid payment status' }, 400);
        }

        // CRITICAL: Verify payment with XPTP's own API before issuing any key.
        // This prevents forged webhook payloads from stealing API keys.
        let verified = false;
        try {
          const verifyRes = await fetch(`https://xptp.net/api/v1/payments/${id}`, {
            headers: { 'Content-Type': 'application/json' },
          });
          if (verifyRes.ok) {
            const verifiedPayment = await verifyRes.json() as XPTPPaymentResponse;
            verified = verifiedPayment.status === 'completed' && verifiedPayment.confirmed === true;
          }
        } catch {
          // Network failure — fail closed (don't issue key)
          return json({ error: 'payment verification failed' }, 500);
        }

        if (!verified) {
          return json({ error: 'payment not verified' }, 400);
        }

        // Idempotency: never double-issue for the same payment
        const seenKey = `billing_evt:${id}`;
        if (await env.STATE.get(seenKey)) return json({ received: true, duplicate: true });
        await env.STATE.put(seenKey, '1', { expirationTtl: 86400 });

        const tier = metadata?.tier || 'pro';
        const email = metadata?.email || null;

        // Generate API key, store only its hash; plaintext retrievable once via payment_id
        const keyBytes = crypto.getRandomValues(new Uint8Array(24));
        const apiKey = 'amk_' + Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const hash = await hashKey(apiKey);
        await env.STATE.put(`api_key:${hash}`, JSON.stringify({
          tier,
          created: new Date().toISOString(),
          payment_id: id,
          amount_usd,
          email,
        }));
        await env.STATE.put(`pending_key:${id}`, apiKey, { expirationTtl: 86400 });

        if (env.BRIDGE_DB) {
          try {
            await env.BRIDGE_DB.prepare('CREATE TABLE IF NOT EXISTS billing_events (id TEXT PRIMARY KEY, type TEXT, tier TEXT, email TEXT, amount_usd REAL, created_at TEXT)').run();
            await env.BRIDGE_DB.prepare('INSERT OR IGNORE INTO billing_events (id, type, tier, email, amount_usd, created_at) VALUES (?, ?, ?, ?, ?, ?)')
              .bind(id, 'xptp_payment', tier, email, amount_usd, new Date().toISOString()).run();
          } catch { /* fail-soft: key issuance already done */ }
        }

        return json({ received: true });
      }

      // GET /api/billing/key?payment_id=... — one-time API key retrieval after payment
      if (path === '/api/billing/key' && method === 'GET') {
        const paymentId = url.searchParams.get('payment_id');
        if (!paymentId) return json({ error: 'payment_id required' }, 400);
        const apiKey = await env.STATE.get(`pending_key:${paymentId}`);
        if (!apiKey) return json({ error: 'not found or already retrieved' }, 404);
        await env.STATE.delete(`pending_key:${paymentId}`);
        return json({ ok: true, api_key: apiKey, note: 'Store this now — it cannot be retrieved again.' });
      }

      // POST /api/proposals/review — transition a stuck proposal (approve/reject)
      if (path === '/api/proposals/review' && method === 'POST') {
        if (!env.STATE_CACHE) return json({ error: 'STATE_CACHE not bound' }, 500);
        // Council-only: require a known agent secret
        const reviewAuth = request.headers.get('x-council-secret') || '';
        const validSecrets = [env.ATOMIND_DEVIN_SECRET, env.ATOMIND_GEMINI_SECRET, env.ATOMIND_VIKTOR_SECRET, env.ADMIN_HMAC_SECRET].filter(Boolean);
        if (!validSecrets.some(sec => sec === reviewAuth)) return json({ error: 'unauthorized' }, 401);
        const body = await request.json().catch(() => null) as { id?: string; action?: string; reviewer?: string } | null;
        if (!body?.id || !['approve', 'reject'].includes(body.action || '')) {
          return json({ error: 'id and action (approve|reject) required' }, 400);
        }
        const raw = await env.STATE_CACHE.get('proposals:snapshot');
        let snapshot: { proposals: any[]; updatedAt?: string } = { proposals: [] };
        if (raw) { try { const parsed = JSON.parse(raw); snapshot.proposals = Array.isArray(parsed) ? parsed : (parsed.proposals || []); } catch {} }
        const item = snapshot.proposals.find((x: any) => x.id === body.id);
        if (!item) return json({ error: 'proposal not found' }, 404);
        item.stage = body.action === 'approve' ? 'approved' : 'rejected';
        item.reviewedAt = new Date().toISOString();
        item.reviewer = (body.reviewer || 'council').toString().slice(0, 100);
        await env.STATE_CACHE.put('proposals:snapshot', JSON.stringify({ proposals: snapshot.proposals, source: 'review', updatedAt: item.reviewedAt }));
        return json({ ok: true, id: item.id, stage: item.stage });
      }

      // POST /api/leads — lead capture from landing page
      if (path === '/api/leads' && method === 'POST') {
        const body = await request.json().catch(() => null) as { email?: string; name?: string; message?: string } | null;
        const email = body && typeof body.email === 'string' ? body.email.trim().slice(0, 200) : '';
        if (!email || !email.includes('@')) return json({ error: 'valid email required' }, 400);
        const name = (body!.name || '').toString().slice(0, 200);
        const message = (body!.message || '').toString().slice(0, 2000);
        await env.BRIDGE_DB.prepare('CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, email TEXT, name TEXT, message TEXT, ip TEXT, created_at TEXT)').run();
        await env.BRIDGE_DB.prepare('INSERT INTO leads (id, email, name, message, ip, created_at) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(crypto.randomUUID(), email, name, message, ip, new Date().toISOString()).run();
        return json({ ok: true });
      }

      // GET /api/leads — health check for leads endpoint
      if (path === '/api/leads' && method === 'GET') {
        return json({ status: 'ready', endpoint: 'POST /api/leads' });
      }

      // POST /api/trading/kraken — autonomous Kraken trading bot
      if (path === '/api/trading/kraken' && method === 'POST') {
        return krakenTradingBot(env);
      }

      // GET /api/trading/kraken — health check for trading endpoint
      if (path === '/api/trading/kraken' && method === 'GET') {
        return json({ 
          status: 'ready', 
          endpoint: 'POST /api/trading/kraken',
          description: 'Autonomous Kraken trading bot with leverage',
          risk_warning: 'Trading with leverage involves significant risk. Only trade with money you can afford to lose.',
          setup: 'Set KRAKEN_API_KEY and KRAKEN_API_SECRET in Cloudflare Workers environment variables'
        });
      }

      // GET /api/trading/balance — check Kraken account balance
      if (path === '/api/trading/balance' && method === 'GET') {
        return krakenTradingBot(env, true);
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

      // POST /atomind/poll - Agent mission polling endpoint
      if (path === '/atomind/poll' && method === 'POST') {
        try {
          console.log('[Atomind] Poll endpoint reached');
          
          // TEMPORARY: Skip signature verification to test Notion integration
          console.log('[Atomind] Skipping signature verification for Notion integration test');
          const agentName = 'Devin'; // Default to Devin for testing

          // Query Notion for pending missions for this agent
          const notionToken = env.NOTION_API_TOKEN;
          const commandsDbId = env.NOTION_BRIDGE_COMMANDS_DB_ID;
          
          const filter = JSON.stringify({
            and: [
              { property: "Status", select: { equals: "Pending" } },
              { property: "Kind", select: { equals: "agent-mission" } },
              { property: "Args", rich_text: { contains: `"agent":"${agentName}"` } }
            ]
          });

          const notionResponse = await fetch(`https://api.notion.com/v1/databases/${commandsDbId}/query`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${notionToken}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ filter })
          });

          if (!notionResponse.ok) {
            const errorText = await notionResponse.text();
            console.error('[Atomind] Notion query failed:', errorText);
            return json({ error: 'Notion query failed', details: errorText }, 500);
          }

          const notionData = await notionResponse.json() as any;
          const missions = notionData.results || [];

          if (missions.length === 0) {
            return json({ ok: true, missions: [], message: 'No pending missions' });
          }

          // Claim the first available mission
          const mission = missions[0];
          const missionId = mission.id;
          
          // Update mission status to Running
          const updateResponse = await fetch(`https://api.notion.com/v1/pages/${missionId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${notionToken}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              properties: {
                'Status': { select: { name: 'Running' } }
              }
            })
          });

          if (!updateResponse.ok) {
            console.error('[Atomind] Failed to claim mission:', await updateResponse.text());
            return json({ error: 'Failed to claim mission' }, 500);
          }

          // Return mission details
          const argsText = mission.properties.Args.rich_text[0].plain_text;
          let args = {};
          try {
            args = JSON.parse(argsText);
          } catch (e) {
            console.error('[Atomind] Failed to parse Args:', argsText);
          }

          return json({
            ok: true,
            mission: {
              id: missionId,
              command: mission.properties.Command.title[0].plain_text,
              args: args,
              claimed_at: new Date().toISOString()
            }
          });

        } catch (e) {
          console.error('[Atomind] Poll error:', e);
          return json({ error: 'Internal error', details: String(e) }, 500);
        }
      }

      // POST /atomind/complete - Agent mission completion endpoint
      if (path === '/atomind/complete' && method === 'POST') {
        try {
          const signature = request.headers.get('X-Atomind-Signature');
          if (!signature) {
            return json({ error: 'Missing X-Atomind-Signature header' }, 401);
          }

          const rawBody = await request.text();
          
          // Verify HMAC signature using Web Crypto API
          let agentName = '';
          let valid = false;
          
          // Try each agent secret
          for (const [agent, secret] of [
            ['Devin', env.ATOMIND_DEVIN_SECRET],
            ['Gemini', env.ATOMIND_GEMINI_SECRET],
            ['Viktor', env.ATOMIND_VIKTOR_SECRET]
          ]) {
            if (!secret) continue;
            
            const encoder = new TextEncoder();
            const keyData = encoder.encode(secret);
            const key = await crypto.subtle.importKey(
              'raw',
              keyData,
              { name: 'HMAC', hash: 'SHA-256' },
              false,
              ['sign']
            );
            
            const signatureData = encoder.encode(rawBody);
            const expectedSig = await crypto.subtle.sign('HMAC', key, signatureData);
            const expectedSigHex = Array.from(new Uint8Array(expectedSig))
              .map(b => b.toString(16).padStart(2, '0'))
              .join('');
            
            const providedSig = signature.replace(/^sha256=/, '');
            
            if (expectedSigHex === providedSig) {
              agentName = agent;
              valid = true;
              break;
            }
          }
          
          if (!valid) {
            return json({ error: 'Invalid signature' }, 401);
          }

          const body = JSON.parse(rawBody) as { mission_id: string; result: unknown; status: string };
          const { mission_id, result, status } = body;

          if (!mission_id) {
            return json({ error: 'Missing mission_id' }, 400);
          }

          // Update mission in Notion
          const notionToken = env.NOTION_API_TOKEN;
          
          const updateResponse = await fetch(`https://api.notion.com/v1/pages/${mission_id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${notionToken}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              properties: {
                'Status': { select: { name: status || 'Completed' } },
                'Result': { rich_text: [{ text: { content: JSON.stringify(result) } }] }
              }
            })
          });

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('[Atomind] Failed to complete mission:', errorText);
            return json({ error: 'Failed to complete mission', details: errorText }, 500);
          }

          return json({ ok: true, message: 'Mission completed', mission_id });

        } catch (e) {
          console.error('[Atomind] Complete error:', e);
          return json({ error: 'Internal error', details: String(e) }, 500);
        }
      }

      // ─── Admin Actuator Endpoints (v0) ───────────────────────────────────────
      // All /admin/* endpoints require HMAC auth with replay protection
      
      if (path.startsWith('/admin/')) {
        const authResult = await verifyAdminAuth(request, env);
        const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
        
        if (!authResult.valid) {
          // Log failed auth attempt
          await logAdminAction(env, {
            requestId: authResult.requestId,
            endpoint: path,
            method: method,
            authStatus: 'FAILURE',
            authFailureReason: authResult.error,
            clientIp,
          });
          
          return json({ error: authResult.error }, 401);
        }
        
        // Auth successful - proceed to endpoint handlers
        console.log(`[Admin] Authenticated request: ${method} ${path} (requestId: ${authResult.requestId})`);
        
        // POST /admin/deploy/trigger - Trigger GitHub workflow dispatch
        if (path === '/admin/deploy/trigger' && method === 'POST') {
          try {
            const body = await request.json() as { branch?: string; ref?: string };
            const branch = body.branch || 'main';
            const ref = body.ref || `refs/heads/${branch}`;
            
            console.log(`[Admin] Triggering deploy for branch: ${branch}`);
            
            const dispatchResponse = await fetch(
              `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/${env.GITHUB_WORKFLOW}/dispatches`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
                  'Accept': 'application/vnd.github.v3+json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ref }),
              }
            );
            
            if (!dispatchResponse.ok) {
              const errorText = await dispatchResponse.text();
              console.error('[Admin] GitHub dispatch failed:', errorText);
              
              await logAdminAction(env, {
                requestId: authResult.requestId,
                endpoint: path,
                method: method,
                authStatus: 'SUCCESS',
                clientIp,
                requestBody: JSON.stringify(body),
                responseStatus: dispatchResponse.status,
                responseBody: errorText,
                metadata: JSON.stringify({ action: 'github_dispatch', branch, error: 'dispatch_failed' }),
              });
              
              return json({ error: 'GitHub dispatch failed', details: errorText }, 500);
            }
            
            // Wait a moment for the workflow to be queued, then get the run
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Get the latest workflow run
            const runsResponse = await fetch(
              `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/${env.GITHUB_WORKFLOW}/runs?branch=${branch}&per_page=1`,
              {
                headers: {
                  'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
                  'Accept': 'application/vnd.github.v3+json',
                },
              }
            );
            
            if (!runsResponse.ok) {
              const errorText = await runsResponse.text();
              console.error('[Admin] Failed to fetch workflow runs:', errorText);
              
              await logAdminAction(env, {
                requestId: authResult.requestId,
                endpoint: path,
                method: method,
                authStatus: 'SUCCESS',
                clientIp,
                requestBody: JSON.stringify(body),
                responseStatus: runsResponse.status,
                responseBody: errorText,
                metadata: JSON.stringify({ action: 'github_dispatch', branch, error: 'fetch_runs_failed' }),
              });
              
              return json({ 
                ok: true, 
                message: 'Dispatch triggered but failed to fetch run details',
                branch,
              });
            }
            
            const runsData = await runsResponse.json() as any;
            const latestRun = runsData.workflow_runs?.[0];
            
            if (!latestRun) {
              await logAdminAction(env, {
                requestId: authResult.requestId,
                endpoint: path,
                method: method,
                authStatus: 'SUCCESS',
                clientIp,
                requestBody: JSON.stringify(body),
                responseStatus: 200,
                metadata: JSON.stringify({ action: 'github_dispatch', branch, error: 'no_run_found' }),
              });
              
              return json({ 
                ok: true, 
                message: 'Dispatch triggered but no run found yet',
                branch,
              });
            }
            
            await logAdminAction(env, {
              requestId: authResult.requestId,
              endpoint: path,
              method: method,
              authStatus: 'SUCCESS',
              clientIp,
              externalRunId: String(latestRun.id),
              externalRunUrl: latestRun.html_url,
              requestBody: JSON.stringify(body),
              responseStatus: 200,
              metadata: JSON.stringify({ action: 'github_dispatch', branch, workflowRunId: latestRun.id }),
            });
            
            return json({
              ok: true,
              message: 'Deploy triggered successfully',
              workflowRunId: latestRun.id,
              runUrl: latestRun.html_url,
              status: latestRun.status,
              branch,
            });
            
          } catch (e) {
            console.error('[Admin] Deploy trigger error:', e);
            
            await logAdminAction(env, {
              requestId: authResult.requestId,
              endpoint: path,
              method: method,
              authStatus: 'SUCCESS',
              clientIp,
              responseStatus: 500,
              responseBody: String(e),
              metadata: JSON.stringify({ action: 'github_dispatch', error: 'exception' }),
            });
            
            return json({ error: 'Internal error', details: String(e) }, 500);
          }
        }
        
        // GET /admin/deploy/status/:workflowRunId - Poll GitHub workflow run status
        if (path.startsWith('/admin/deploy/status/') && method === 'GET') {
          try {
            const workflowRunId = path.split('/').pop();
            
            if (!workflowRunId) {
              return json({ error: 'Missing workflowRunId' }, 400);
            }
            
            console.log(`[Admin] Polling status for workflow run: ${workflowRunId}`);
            
            const response = await fetch(
              `https://api.github.com/repos/${env.GITHUB_REPO}/actions/runs/${workflowRunId}`,
              {
                headers: {
                  'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
                  'Accept': 'application/vnd.github.v3+json',
                },
              }
            );
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('[Admin] Failed to fetch workflow status:', errorText);
              
              await logAdminAction(env, {
                requestId: authResult.requestId,
                endpoint: path,
                method: method,
                authStatus: 'SUCCESS',
                clientIp,
                responseStatus: response.status,
                responseBody: errorText,
                metadata: JSON.stringify({ action: 'github_status', workflowRunId, error: 'fetch_failed' }),
              });
              
              return json({ error: 'Failed to fetch workflow status', details: errorText }, 500);
            }
            
            const runData = await response.json() as any;
            
            await logAdminAction(env, {
              requestId: authResult.requestId,
              endpoint: path,
              method: method,
              authStatus: 'SUCCESS',
              clientIp,
              externalRunId: workflowRunId,
              externalRunUrl: runData.html_url,
              responseStatus: 200,
              metadata: JSON.stringify({ action: 'github_status', workflowRunId, status: runData.status }),
            });
            
            return json({
              ok: true,
              workflowRunId,
              status: runData.status,
              conclusion: runData.conclusion,
              runUrl: runData.html_url,
              createdAt: runData.created_at,
              updatedAt: runData.updated_at,
            });
            
          } catch (e) {
            console.error('[Admin] Deploy status error:', e);
            
            await logAdminAction(env, {
              requestId: authResult.requestId,
              endpoint: path,
              method: method,
              authStatus: 'SUCCESS',
              clientIp,
              responseStatus: 500,
              responseBody: String(e),
              metadata: JSON.stringify({ action: 'github_status', error: 'exception' }),
            });
            
            return json({ error: 'Internal error', details: String(e) }, 500);
          }
        }
        
        // GET /admin/cloudflare/verify-token-scopes - Verify Cloudflare token capability
        if (path === '/admin/cloudflare/verify-token-scopes' && method === 'GET') {
          try {
            console.log('[Admin] Verifying Cloudflare token scopes');
            
            const response = await fetch(
              `https://api.cloudflare.com/client/v4/user/tokens/verify`,
              {
                headers: {
                  'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('[Admin] Cloudflare token verification failed:', errorText);
              
              await logAdminAction(env, {
                requestId: authResult.requestId,
                endpoint: path,
                method: method,
                authStatus: 'SUCCESS',
                clientIp,
                responseStatus: response.status,
                responseBody: errorText,
                metadata: JSON.stringify({ action: 'cf_verify', error: 'verification_failed' }),
              });
              
              return json({ 
                ok: false, 
                error: 'Cloudflare token verification failed',
                details: errorText,
              }, 500);
            }
            
            const tokenData = await response.json() as any;
            const success = tokenData.success === true;
            
            // Check for required scopes (basic Worker deployment scopes)
            const requiredScopes = [
              'account',
              'worker',
              'worker_script',
            ];
            
            const tokenScopes = tokenData.result?.policy?.[0]?.permission?.resources || [];
            const hasRequiredScopes = requiredScopes.some(scope => 
              tokenScopes.some((tokenScope: string) => tokenScope.includes(scope))
            );
            
            await logAdminAction(env, {
              requestId: authResult.requestId,
              endpoint: path,
              method: method,
              authStatus: 'SUCCESS',
              clientIp,
              responseStatus: 200,
              metadata: JSON.stringify({ 
                action: 'cf_verify', 
                success, 
                hasRequiredScopes,
                accountId: env.CLOUDFLARE_ACCOUNT_ID,
              }),
            });
            
            return json({
              ok: true,
              capability: success && hasRequiredScopes ? 'OK' : 'INSUFFICIENT',
              success,
              hasRequiredScopes,
              accountId: env.CLOUDFLARE_ACCOUNT_ID,
              tokenInfo: {
                id: tokenData.result?.id,
                status: tokenData.result?.status,
                policyName: tokenData.result?.policy?.[0]?.name,
              },
            });
            
          } catch (e) {
            console.error('[Admin] Cloudflare verification error:', e);
            
            await logAdminAction(env, {
              requestId: authResult.requestId,
              endpoint: path,
              method: method,
              authStatus: 'SUCCESS',
              clientIp,
              responseStatus: 500,
              responseBody: String(e),
              metadata: JSON.stringify({ action: 'cf_verify', error: 'exception' }),
            });
            
            return json({ error: 'Internal error', details: String(e) }, 500);
          }
        }
        
        // POST /admin/runs/complete - Update Notion Runs ledger with evidence-gated completion
        if (path === '/admin/runs/complete' && method === 'POST') {
          try {
            const body = await request.json() as {
              runId: string;
              finalState: 'succeeded' | 'failed' | 'blocked';
              requiredArtifactsMet: boolean;
              evidence?: Record<string, unknown>;
            };
            
            const { runId, finalState, requiredArtifactsMet, evidence } = body;
            
            if (!runId || !finalState) {
              return json({ error: 'Missing runId or finalState' }, 400);
            }
            
            console.log(`[Admin] Completing run: ${runId}, state: ${finalState}, artifacts: ${requiredArtifactsMet}`);
            
            // Evidence-gated completion: only set Status=Done when succeeded && artifacts met
            const notionStatus = (finalState === 'succeeded' && requiredArtifactsMet) ? 'Done' : 'Failed';
            
            const updateResponse = await fetch(
              `https://api.notion.com/v1/databases/${env.NOTION_RUNS_DB_ID}/query`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${env.NOTION_API_TOKEN}`,
                  'Notion-Version': '2022-06-28',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  filter: {
                    property: 'Run ID',
                    title: {
                      equals: runId,
                    },
                  },
                }),
              }
            );
            
            if (!updateResponse.ok) {
              const errorText = await updateResponse.text();
              console.error('[Admin] Notion query failed:', errorText);
              
              await logAdminAction(env, {
                requestId: authResult.requestId,
                endpoint: path,
                method: method,
                authStatus: 'SUCCESS',
                clientIp,
                requestBody: JSON.stringify(body),
                responseStatus: updateResponse.status,
                responseBody: errorText,
                metadata: JSON.stringify({ action: 'notion_complete', runId, error: 'query_failed' }),
              });
              
              return json({ error: 'Notion query failed', details: errorText }, 500);
            }
            
            const notionData = await updateResponse.json() as any;
            const runPage = notionData.results?.[0];
            
            if (!runPage) {
              await logAdminAction(env, {
                requestId: authResult.requestId,
                endpoint: path,
                method: method,
                authStatus: 'SUCCESS',
                clientIp,
                requestBody: JSON.stringify(body),
                responseStatus: 404,
                metadata: JSON.stringify({ action: 'notion_complete', runId, error: 'not_found' }),
              });
              
              return json({ error: 'Run not found in Notion' }, 404);
            }
            
            // Update the page with completion status
            const patchResponse = await fetch(
              `https://api.notion.com/v1/pages/${runPage.id}`,
              {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${env.NOTION_API_TOKEN}`,
                  'Notion-Version': '2022-06-28',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  properties: {
                    'Status': {
                      select: { name: notionStatus },
                    },
                    'Required artifacts met': {
                      checkbox: requiredArtifactsMet,
                    },
                    'Outcome summary': {
                      rich_text: [
                        {
                          text: {
                            content: JSON.stringify({
                              finalState,
                              requiredArtifactsMet,
                              evidence,
                              completedAt: new Date().toISOString(),
                            }),
                          },
                        },
                      ],
                    },
                  },
                }),
              }
            );
            
            if (!patchResponse.ok) {
              const errorText = await patchResponse.text();
              console.error('[Admin] Notion update failed:', errorText);
              
              await logAdminAction(env, {
                requestId: authResult.requestId,
                endpoint: path,
                method: method,
                authStatus: 'SUCCESS',
                clientIp,
                externalRunId: runId,
                requestBody: JSON.stringify(body),
                responseStatus: patchResponse.status,
                responseBody: errorText,
                metadata: JSON.stringify({ action: 'notion_complete', runId, error: 'update_failed' }),
              });
              
              return json({ error: 'Notion update failed', details: errorText }, 500);
            }
            
            await logAdminAction(env, {
              requestId: authResult.requestId,
              endpoint: path,
              method: method,
              authStatus: 'SUCCESS',
              clientIp,
              externalRunId: runId,
              requestBody: JSON.stringify(body),
              responseStatus: 200,
              metadata: JSON.stringify({ 
                action: 'notion_complete', 
                runId, 
                notionStatus,
                evidenceGated: true,
              }),
            });
            
            return json({
              ok: true,
              message: 'Run completed successfully',
              runId,
              notionStatus,
              evidenceGated: true,
            });
            
          } catch (e) {
            console.error('[Admin] Runs complete error:', e);
            
            await logAdminAction(env, {
              requestId: authResult.requestId,
              endpoint: path,
              method: method,
              authStatus: 'SUCCESS',
              clientIp,
              responseStatus: 500,
              responseBody: String(e),
              metadata: JSON.stringify({ action: 'notion_complete', error: 'exception' }),
            });
            
            return json({ error: 'Internal error', details: String(e) }, 500);
          }
        }
        
        // Unknown admin endpoint
        await logAdminAction(env, {
          requestId: authResult.requestId,
          endpoint: path,
          method: method,
          authStatus: 'SUCCESS',
          clientIp,
          responseStatus: 404,
          metadata: JSON.stringify({ action: 'unknown_endpoint' }),
        });
        
        return json({ error: 'Unknown admin endpoint' }, 404);
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
  NOTION_API_TOKEN: string;
  NOTION_BRIDGE_COMMANDS_DB_ID: string;
  NOTION_BRIDGE_LOGS_DB_ID: string;
  ATOMIND_DEVIN_SECRET: string;
  ATOMIND_GEMINI_SECRET: string;
  ATOMIND_VIKTOR_SECRET: string;
  CURATOR_QUEUE: any; // Cloudflare Queue producer
  DISPATCHER: Fetcher; // service binding → aether worker
  _LOGS: R2Bucket; // R2 bucket for logs
  // Admin actuator secrets
  ADMIN_HMAC_SECRET: string;
  GITHUB_TOKEN: string;
  GITHUB_REPO: string; // format: "owner/repo"
  KRAKEN_API_KEY: string;
  KRAKEN_API_SECRET: string;
  GITHUB_WORKFLOW: string; // workflow filename
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  NOTION_RUNS_DB_ID: string;
  // Stripe keys for payment processing
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  // Stripe (deprecated — billing now via XPTP)
  STRIPE_WEBHOOK_SECRET?: string; // billing: Stripe webhook signing secret
}

// ─── Admin Actuator Auth (HMAC + Replay Protection) ─────────────────────
// Constant-time compare to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Verify HMAC signature with timestamp replay protection (300s window)
async function verifyAdminAuth(
  request: Request,
  env: Env
): Promise<{ valid: boolean; requestId: string; error?: string }> {
  const requestId = crypto.randomUUID();
  const timestamp = request.headers.get('X-Atomind-Timestamp');
  const signature = request.headers.get('X-Atomind-Signature');
  
  // Check required headers
  if (!timestamp) {
    return { valid: false, requestId, error: 'Missing X-Atomind-Timestamp header' };
  }
  if (!signature) {
    return { valid: false, requestId, error: 'Missing X-Atomind-Signature header' };
  }
  
  // Check timestamp freshness (300s window)
  const now = Math.floor(Date.now() / 1000);
  const timestampNum = parseInt(timestamp, 10);
  if (isNaN(timestampNum) || Math.abs(now - timestampNum) > 300) {
    return { valid: false, requestId, error: 'Timestamp expired or invalid' };
  }
  
  // Verify HMAC signature
  const rawBody = await request.text();
  const encoder = new TextEncoder();
  const keyData = encoder.encode(env.ADMIN_HMAC_SECRET);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign timestamp + body for replay protection
  const message = `${timestamp}:${rawBody}`;
  const messageData = encoder.encode(message);
  const expectedSig = await crypto.subtle.sign('HMAC', key, messageData);
  const expectedSigHex = Array.from(new Uint8Array(expectedSig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const providedSig = signature.replace(/^sha256=/, '');
  
  if (!constantTimeCompare(expectedSigHex, providedSig)) {
    return { valid: false, requestId, error: 'Invalid signature' };
  }
  
  return { valid: true, requestId };
}

// Log admin action to D1 audit log
async function logAdminAction(
  env: Env,
  data: {
    requestId: string;
    endpoint: string;
    method: string;
    authStatus: 'SUCCESS' | 'FAILURE';
    authFailureReason?: string;
    clientIp?: string;
    externalRunId?: string;
    externalRunUrl?: string;
    requestBody?: string;
    responseStatus?: number;
    responseBody?: string;
    metadata?: string;
  }
) {
  try {
    await env.BRIDGE_DB.prepare(
      `INSERT INTO admin_audit_log (
        request_id, endpoint, method, auth_status, auth_failure_reason,
        client_ip, external_run_id, external_run_url, request_body,
        response_status, response_body, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      data.requestId,
      data.endpoint,
      data.method,
      data.authStatus,
      data.authFailureReason || null,
      data.clientIp || null,
      data.externalRunId || null,
      data.externalRunUrl || null,
      data.requestBody || null,
      data.responseStatus || null,
      data.responseBody || null,
      data.metadata || null
    ).run();
  } catch (e) {
    console.error('[Admin] Failed to log audit action:', e);
  }
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



