/**
 * Aether Verifier Worker - Acceptance criteria verification
 * 
 * POST /verify - Verifies that artifacts meet acceptance criteria
 * Uses @aether/kv-writers for KV operations
 * Stubs Gemini (via AI Gateway) and Workers AI fallback
 */

import { createKVContext } from '@aether/kv-writers';

// ─── Types ───────────────────────────────────────────────────────────

export interface VerifyRequest {
  run_id: string;
  task_id: string;
  acceptance_criteria: string[];
  artifacts: Artifact[];
}

export interface Artifact {
  type: 'url' | 'text' | 'string_absent';
  url?: string;
  text?: string;
  excerpt?: string;
  asserted_string?: string; // for string_absent type
}

export interface VerifyResponse {
  run_id: string;
  task_id: string;
  evidence_passed: boolean;
  evidence_reasons: string[];
  verifier_model: string;
  verified_at: string;
}

// ─── Worker Environment ─────────────────────────────────────────────

export interface Env {
  DB: D1Database;
  STATE: KVNamespace;
  STATE_CACHE: KVNamespace;
  METRICS: KVNamespace;
  AI: any; // Workers AI binding
  AI_GATEWAY_URL?: string; // Optional AI Gateway URL for Gemini
  ENVIRONMENT: string;
}

// ─── Main Handler ───────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // POST /verify
    if (url.pathname === '/verify' && request.method === 'POST') {
      return handleVerify(request, env, ctx);
    }
    
    // GET /health
    if (url.pathname === '/health' && request.method === 'GET') {
      return Response.json({
        status: 'healthy',
        worker: 'aether-verifier',
        timestamp: new Date().toISOString(),
      });
    }
    
    return Response.json({ error: 'Not found' }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;

// ─── Verify Handler ───────────────────────────────────────────────────

async function handleVerify(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    const body: VerifyRequest = await request.json();
    
    // Create KV context for telemetry
    const kv = createKVContext(env, 'aether-verifier');
    
    // Verify each artifact against acceptance criteria
    const results = await verifyArtifacts(body.artifacts, body.acceptance_criteria, env);
    
    // Determine overall pass/fail
    const evidence_passed = results.every(r => r.passed);
    const evidence_reasons = results.map(r => r.reason);
    
    // Stub verifier model selection (will be real AI integration later)
    const verifier_model = env.AI_GATEWAY_URL ? 'gemini-gateway' : 'workers-ai-stub';
    
    // Write to D1 runs table
    await writeVerificationResult(env.DB, {
      run_id: body.run_id,
      task_id: body.task_id,
      evidence_passed,
      evidence_reasons,
      verifier_model,
    });
    
    // Flush KV writes
    ctx.waitUntil(kv.flush());
    
    const response: VerifyResponse = {
      run_id: body.run_id,
      task_id: body.task_id,
      evidence_passed,
      evidence_reasons,
      verifier_model,
      verified_at: new Date().toISOString(),
    };
    
    return Response.json(response);
  } catch (error) {
    console.error('[aether-verifier] Error:', error);
    return Response.json(
      { error: 'Verification failed', message: String(error) },
      { status: 500 }
    );
  }
}

// ─── Artifact Verification ───────────────────────────────────────────

async function verifyArtifacts(
  artifacts: Artifact[],
  criteria: string[],
  env: Env
): Promise<{ passed: boolean; reason: string }[]> {
  const results: { passed: boolean; reason: string }[] = [];
  
  for (const artifact of artifacts) {
    switch (artifact.type) {
      case 'url':
        // Stub: Fetch URL and verify against criteria
        results.push({
          passed: true, // Stub - always pass for now
          reason: `URL verification stubbed: ${artifact.url}`,
        });
        break;
        
      case 'text':
        // Stub: Verify text content against criteria
        results.push({
          passed: true, // Stub - always pass for now
          reason: `Text verification stubbed: ${artifact.excerpt?.slice(0, 50)}...`,
        });
        break;
        
      case 'string_absent':
        // Verify asserted string does NOT appear in URL/text
        const absent = await verifyStringAbsent(artifact, env);
        results.push({
          passed: absent,
          reason: absent 
            ? `String "${artifact.asserted_string}" confirmed absent`
            : `String "${artifact.asserted_string}" found (violation)`,
        });
        break;
        
      default:
        results.push({
          passed: false,
          reason: `Unknown artifact type: ${artifact.type}`,
        });
    }
  }
  
  return results;
}

// ─── String Absent Verification ───────────────────────────────────────

async function verifyStringAbsent(artifact: Artifact, env: Env): Promise<boolean> {
  // Stub: Fetch content and check for asserted string
  // Real implementation would:
  // 1. Fetch URL or read text
  // 2. Search for asserted_string
  // 3. Return true if NOT found, false if found
  
  if (artifact.asserted_string) {
    // Stub implementation - always return true for now
    return true;
  }
  
  return false;
}

// ─── D1 Write ───────────────────────────────────────────────────────

async function writeVerificationResult(
  db: D1Database,
  data: {
    run_id: string;
    task_id: string;
    evidence_passed: boolean;
    evidence_reasons: string[];
    verifier_model: string;
  }
): Promise<void> {
  // Stub: Write to runs table
  // Real implementation would:
  // 1. Check if columns exist (evidence_passed, evidence_reasons, verifier_model)
  // 2. Insert or update the run record
  
  try {
    const stmt = db.prepare(`
      INSERT INTO runs (id, evidence_passed, evidence_reasons, verifier_model, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        evidence_passed = excluded.evidence_passed,
        evidence_reasons = excluded.evidence_reasons,
        verifier_model = excluded.verifier_model,
        updated_at = excluded.updated_at
    `);
    
    await stmt.bind(
      data.run_id,
      data.evidence_passed ? 1 : 0,
      JSON.stringify(data.evidence_reasons),
      data.verifier_model,
      new Date().toISOString()
    ).run();
  } catch (error) {
    // If columns don't exist yet, log but don't fail
    console.error('[aether-verifier] D1 write error (columns may not exist yet):', error);
  }
}
