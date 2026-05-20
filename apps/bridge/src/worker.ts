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
      
      // Proposals endpoint
      if (path === '/proposals') {
        // Try to fetch from KV if bound
        if (env.STATE) {
          try {
            const value = await env.STATE.get('proposals');
            const proposals = value ? JSON.parse(value) : [];
            return new Response(JSON.stringify(proposals), {
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            });
          } catch {
            // Fall through to empty array
          }
        }
        // Return empty if no KV or error
        return new Response(JSON.stringify([]), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Lessons endpoint
      if (path === '/lessons') {
        // Try to fetch from KV if bound
        if (env.STATE) {
          try {
            const value = await env.STATE.get('lessons');
            const lessons = value ? JSON.parse(value) : [];
            return new Response(JSON.stringify(lessons), {
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            });
          } catch {
            // Fall through to empty array
          }
        }
        // Return empty if no KV or error
        return new Response(JSON.stringify([]), {
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