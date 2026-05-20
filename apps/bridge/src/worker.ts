/**
 * Cloudflare Worker Entry Point
 * 
 * Aether Bridge - Provides:
 * - /health - Bridge status and bindings
 * - /proposals - Proposal queue
 * - /lessons - Lesson learnd
 * - /api/* - Legacy API compatibility
 */

import { default as app } from './server';

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
      
      // Health check - returns bridge status and binding status
      if (path === '/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          worker: 'aether-bridge',
          timestamp: new Date().toISOString(),
          bindings: {
            db: !!env.DB,
            state: !!env.STATE,
            state_cache: !!env.STATE_CACHE,
            mybrowser: !!env.MYBROWSER,
          }
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Health check - returns v0.2 contract
      if (path === '/health') {
        const bindings = {
          DB: !!env.DB,
          STATE: !!env.STATE,
          STATE_CACHE: !!env.STATE_CACHE,
          MYBROWSER: !!env.MYBROWSER,
        };
        return new Response(JSON.stringify({
          ok: true,
          service: 'aether-bridge',
          version: '0.2.0',
          ts: new Date().toISOString(),
          bindings,
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
            proposals = value ? JSON.parse(value) : [];
            updatedAt = proposals.length > 0 ? new Date().toISOString() : null;
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
            lessons = value ? JSON.parse(value) : [];
            updatedAt = lessons.length > 0 ? new Date().toISOString() : null;
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
        let collision: unknown | null = null;
        
        try {
          const { hash } = await request.json() as { hash: string };
          
          if (env.STATE_CACHE) {
            const existing = await env.STATE_CACHE.get(`lessons:hash:${hash}`);
            if (existing) {
              collision = JSON.parse(existing);
            }
          }
        } catch {
          // Ignore parse errors
        }
        
        return new Response(JSON.stringify({
          ok: true,
          hash: '',
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