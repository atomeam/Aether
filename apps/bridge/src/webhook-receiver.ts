/**
 * Notion Webhook Receiver
 * 
 * Receives webhook events from Notion and dispatches to Curator.
 * Topology: Direct tunnel (Option A)
 * 
 * Required env vars (loaded from .env):
 *   NOTION_WEBHOOK_SECRET - HMAC shared secret
 *   CURATOR_QUEUE_URL - Curator FCFS queue endpoint
 */

import * as fs from 'fs';
import * as crypto from 'crypto';
import express from 'express';

// Load .env if present
const ENV_FILE = '.env';
if (fs.existsSync(ENV_FILE)) {
  const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].trim();
    }
  }
  console.log('[Webhook] Loaded .env configuration');
}

const NOTION_WEBHOOK_SECRET = process.env.NOTION_WEBHOOK_SECRET;
const CURATOR_QUEUE_URL = process.env.CURATOR_QUEUE_URL || 'http://127.0.0.1:8787/curator/dispatch';
const PORT = parseInt(process.env.PORT || '8787');

const app = express();

// Raw body capture for HMAC verification
app.use(express.raw({ type: 'application/json', limit: '10mb' }));

/**
 * Constant-time HMAC comparison to prevent timing attacks
 */
function verifyHmacConstantTime(expected: string, body: Buffer): boolean {
  if (!NOTION_WEBHOOK_SECRET) {
    console.error('[Webhook] NOTION_WEBHOOK_SECRET not configured');
    return false;
  }

  const expectedBuffer = Buffer.from(expected, 'base64');
  const key = crypto.createSecretKey(Buffer.from(NOTION_WEBHOOK_SECRET));
  const hmac = crypto.createHmac('sha256', key);
  
  const signature = hmac.update(body).digest('base64');
  
  // Timing-safe comparison - need both buffers to be same length
  if (expectedBuffer.length !== Buffer.from(signature, 'base64').length) {
    return false;
  }

  // Use crypto.timingSafeEqual for constant-time comparison
  const a = Buffer.from(signature, 'base64');
  const b = expectedBuffer;
  
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    // Node < v14 doesn't have timingSafeEqual, fall back to XOR accumulate
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a[i] ^ b[i];
    }
    return diff === 0;
  }
}

/**
 * Dispatch event to Curator FCFS queue
 */
async function dispatchToCurator(payload: unknown): Promise<boolean> {
  try {
    const response = await fetch(CURATOR_QUEUE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    return response.ok;
  } catch (e) {
    console.error('[Webhook] Curator dispatch failed:', e);
    return false;
  }
}

/**
 * Webhook endpoint - verifies HMAC, then async-dispatches to Curator
 */
app.post('/webhook', async (req, res) => {
  const signature = req.get('X-Notion-Signature');
  const body = req.body as Buffer;
  
  // Check for signature header
  if (!signature) {
    console.warn('[Webhook] CUR_WEBHOOK_BAD_SIG: No signature header');
    return res.status(401).json({ error: 'Missing signature' });
  }
  
  // Verify HMAC
  if (!verifyHmacConstantTime(signature, body)) {
    console.warn('[Webhook] CUR_WEBHOOK_BAD_SIG: Signature mismatch');
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Parse and dispatch to Curator (non-blocking)
  try {
    const payload = JSON.parse(body.toString());
    
    // Async dispatch - don't block the response
    dispatchToCurator(payload).then(success => {
      if (success) {
        console.log('[Webhook] Dispatched to Curator:', payload?.id);
      } else {
        console.error('[Webhook] Curator dispatch failed');
      }
    });
    
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[Webhook] Parse error:', e);
    return res.status(400).json({ error: 'Invalid payload' });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'aether-webhook-receiver' });
});

/**
 * Start server
 */
const server = app.listen(PORT, () => {
  console.log(`[Webhook] Receiver listening on port ${PORT}`);
  console.log(`[Webhook] Curator endpoint: ${CURATOR_QUEUE_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Webhook] Shutting down...');
  server.close(() => process.exit(0));
});

export { app, server };