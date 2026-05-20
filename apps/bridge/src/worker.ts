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
const VERSION = '0.2.0';
const SERVICE = 'aether-bridge';

// Shared helper - returns binding status
function getBindings(env: Env) {
  return {
    DB: !!env.DB,
    STATE: !!env.STATE,
    STATE_CACHE: !!env.STATE_CACHE,
    MYBROWSER: !!env.MYBROWSER,
  };
}

// Cloudflare Workers export
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS
    const url = new URL(request.url);
    
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    
    try {
      const path = url.pathname;
      const method = request.method;
      
      // Use shared helper for /health
      if (path === '/health') {
        return new Response(JSON.stringify({
          ok: true,
          service: SERVICE,
          version: VERSION,
          ts: new Date().toISOString(),
          bindings: getBindings(env),
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Crew status summary
      if (path === '/crew/status' || path === '/crew') {
        const bindings = getBindings(env);
        const bindingsMissing = !bindings.DB || !bindings.STATE || !bindings.STATE_CACHE || !bindings.MYBROWSER;
        
        let proposals = { count: 0, updatedAt: null, items: [] as unknown[] };
        let lessons = { count: 0, updatedAt: null, items: [] as unknown[] };
        
        if (env.STATE) {
          try {
            const raw = await env.STATE.get('proposals:snapshot');
            const parsed = raw ? JSON.parse(raw) : null;
            if (Array.isArray(parsed)) {
              proposals.items = parsed;
            } else if (parsed && Array.isArray(parsed.proposals)) {
              proposals.items = parsed.proposals;
              proposals.updatedAt = parsed.updatedAt ?? null;
            }
            proposals.count = proposals.items.length;
            proposals.updatedAt = proposals.updatedAt || (proposals.count > 0 ? new Date().toISOString() : null);
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
            lessons.updatedAt = lessons.updatedAt || (lessons.count > 0 ? new Date().toISOString() : null);
          } catch { /* ignore */ }
        }
        
        return new Response(JSON.stringify({
          ok: true,
          service: SERVICE,
          version: VERSION,
          ts: new Date().toISOString(),
          bindings,
          bindingsMissing,
          proposals,
          lessons,
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Proposals endpoint - v0.2 contract
      if (path === '/proposals') {
        let proposals: unknown[] = [];
        let updatedAt: string | null = null;
        
        if (env.STATE) {
          try {
            const value = await env.STATE.get('proposals:snapshot');
            const parsed = value ? JSON.parse(value) : null;
            
            // Support both raw array and object snapshot
            if (Array.isArray(parsed)) {
              proposals = parsed;
              updatedAt = proposals.length > 0 ? new Date().toISOString() : null;
            } else if (parsed && Array.isArray(parsed.proposals)) {
              proposals = parsed.proposals;
              updatedAt = parsed.updatedAt ?? (proposals.length > 0 ? new Date().toISOString() : null);
            }
          } catch {
            // Fall through
          }
        }
        
        return new Response(JSON.stringify({
          ok: true,
          proposals,
          updatedAt,
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Lessons endpoint - v0.2 contract
      if (path === '/lessons') {
        let lessons: unknown[] = [];
        let updatedAt: string | null = null;
        
        if (env.STATE_CACHE) {
          try {
            const value = await env.STATE_CACHE.get('lessons:index');
            const parsed = value ? JSON.parse(value) : null;
            
            // Support both raw array and object snapshot
            if (Array.isArray(parsed)) {
              lessons = parsed;
              updatedAt = lessons.length > 0 ? new Date().toISOString() : null;
            } else if (parsed && Array.isArray(parsed.lessons)) {
              lessons = parsed.lessons;
              updatedAt = parsed.updatedAt ?? (lessons.length > 0 ? new Date().toISOString() : null);
            }
          } catch {
            // Fall through
          }
        }
        
        return new Response(JSON.stringify({
          ok: true,
          lessons,
          updatedAt,
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Lessons check - detect hash collisions
      if (path === '/lessons/check' && method === 'POST') {
        let hash = '';
        let collision: unknown | null = null;
        
        try {
          const body = await request.json() as { hash?: string };
          if (typeof body.hash === 'string' && body.hash.length > 0) {
            hash = body.hash;
            
            if (env.STATE_CACHE) {
              const existing = await env.STATE_CACHE.get(`lessons:hash:${hash}`);
              if (existing) {
                collision = JSON.parse(existing);
              }
            }
          } else {
            return new Response(JSON.stringify({
              ok: false,
              error: 'Missing hash',
            }), {
              status: 400,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }
        } catch {
          return new Response(JSON.stringify({
            ok: false,
            error: 'Invalid request body',
          }), {
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
        
        return new Response(JSON.stringify({
          ok: true,
          hash,
          collision,
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Legacy API: /api/stack
      if (path === '/api/stack') {
        return new Response(JSON.stringify({
          status: 'online',
          backend: 'alpha-bridge',
          timestamp: new Date().toISOString()
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Legacy API: /api/execute
      if (path === '/api/execute' && method === 'POST') {
        const body = await request.json();
        return new Response(JSON.stringify({
          success: true,
          result: { message: 'Execution queued' }
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Legacy API: /api/execute/status
      if (path === '/api/execute/status' && method === 'GET') {
        return new Response(JSON.stringify({
          status: 'idle',
          currentStep: 0,
          totalSteps: 0
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // 404
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};

// Types for Cloudflare
interface Env {
  DB: D1Database;
  STATE: KVNamespace;
  STATE_CACHE: KVNamespace;
  MYBROWSER: any;
}

interface ExecutionContext {
  waitUntil(promise: Promise<void>): void;
  passThroughOnException(): void;
}

// Fallback for local dev
if (typeof globalThis !== 'undefined' && !('fetch' in globalThis)) {
  // Development export
  export { default as app };
}