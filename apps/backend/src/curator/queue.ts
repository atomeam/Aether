/**
 * Curator Queue Service
 * 
 * FCFS queue for Curator jobs from Tier-1 (PowerShell) and Tier-2 (Node webhook).
 * Uses Redis for cross-process persistence and crash-safety.
 * 
 * Required env vars:
 *   REDIS_URL - Redis connection URL (e.g., redis://localhost:6379)
 *   QUEUE_CLAIM_TTL_MS - Claim timeout in ms (default: 300000 = 5 min)
 */

import * as crypto from 'crypto';

// Load .env if present
const ENV_FILE = '.env';
import * as fs from 'fs';
if (fs.existsSync(ENV_FILE)) {
  const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].trim();
    }
  }
}

const REDIS_URL = process.env.REDIS_URL;
const QUEUE_CLAIM_TTL_MS = parseInt(process.env.QUEUE_CLAIM_TTL_MS || '300000');
const QUEUE_LIST = 'curator:pending';
const CLAIMED_PREFIX = 'curator:claimed:';

interface CuratorJobMeta {
  source: 'tier-1' | 'tier-2';
  receivedAt: string;
  eventId?: string;
}

interface CuratorJob {
  id: string;
  payload: unknown;
  meta: CuratorJobMeta;
}

/**
 * Simple Redis client using native fetch (Node 18+)
 */
class RedisClient {
  private baseUrl: string;
  
  constructor(url: string) {
    this.baseUrl = url.replace('redis://', 'http://');
  }
  
  async lpush(key: string, value: string): Promise<number> {
    const res = await fetch(`${this.baseUrl}/lpush/${key}/${encodeURIComponent(value)}`);
    return parseInt(await res.text());
  }
  
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/lrange/${key}/${start}/${stop}`);
    const text = await res.text();
    if (!text) return [];
    return JSON.parse(`[${text}]`).map((x: string) => x);
  }
  
  async brpoplpush(source: string, dest: string, timeout: number): Promise<string | null> {
    const res = await fetch(`${this.baseUrl}/brpoplpush/${source}/${dest}/${timeout}`);
    const text = await res.text();
    return text || null;
  }
  
  async setex(key: string, ttl: number, value: string): Promise<void> {
    await fetch(`${this.baseUrl}/setex/${key}/${ttl}/${encodeURIComponent(value)}`);
  }
  
  async get(key: string): Promise<string | null> {
    const res = await fetch(`${this.baseUrl}/get/${key}`);
    return res.text();
  }
  
  async del(key: string): Promise<number> {
    const res = await fetch(`${this.baseUrl}/del/${key}`);
    return parseInt(await res.text());
  }
  
  async lrem(key: string, count: number, value: string): Promise<number> {
    const res = await fetch(`${this.baseUrl}/lrem/${key}/${count}/${encodeURIComponent(value)}`);
    return parseInt(await res.text());
  }
}

let redis: RedisClient | null = null;

function getRedis(): RedisClient {
  if (!REDIS_URL) {
    throw new Error('Missing required env: REDIS_URL');
  }
  if (!redis) {
    redis = new RedisClient(REDIS_URL);
  }
  return redis;
}

/**
 * Enqueue a job for Curator evaluation
 */
export async function enqueueCuratorJob(
  payload: unknown,
  meta: CuratorJobMeta,
): Promise<string> {
  const job: CuratorJob = {
    id: crypto.randomUUID(),
    payload,
    meta,
  };
  
  // Derive eventId from content hash if not provided
  if (!meta.eventId) {
    const hash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    meta.eventId = `bodyhash:${hash}`;
  }
  
  const jobJson = JSON.stringify(job);
  
  // LPUSH to pending queue
  const r = getRedis();
  await r.lpush(QUEUE_LIST, jobJson);
  
  console.log('[Queue] ENQUEUED', {
    jobId: job.id,
    source: meta.source,
    eventId: meta.eventId,
    receivedAt: meta.receivedAt,
  });
  
  return job.id;
}

/**
 * Claim the next pending job (for consumer)
 * Blocks until a job is available or timeout
 */
export async function claimNextJob(): Promise<CuratorJob | null> {
  const r = getRedis();
  
  // BRPOPLPUSH: atomic move from pending to claimed
  const jobJson = await r.brpoplpush(QUEUE_LIST, CLAIMED_PREFIX + '*', Math.floor(QUEUE_CLAIM_TTL_MS / 1000));
  if (!jobJson) return null;
  
  const job: CuratorJob = JSON.parse(jobJson);
  
  // Set claim expiry
  await r.setex(
    CLAIMED_PREFIX + job.id,
    Math.floor(QUEUE_CLAIM_TTL_MS / 1000),
    jobJson,
  );
  
  console.log('[Queue] CLAIMED', {
    jobId: job.id,
    source: job.meta.source,
    eventId: job.meta.eventId,
  });
  
  return job;
}

/**
 * Complete a claimed job (success)
 */
export async function completeJob(jobId: string): Promise<void> {
  const r = getRedis();
  
  // Remove from claimed
  await r.del(CLAIMED_PREFIX + jobId);
  
  console.log('[Queue] COMPLETED', { jobId });
}

/**
 * Release a claimed job back to pending (failure/timeout)
 */
export async function releaseJob(jobId: string): Promise<void> {
  const r = getRedis();
  
  // Get the claimed job
  const jobJson = await r.get(CLAIMED_PREFIX + jobId);
  if (!jobJson) {
    console.warn('[Queue] RELEASE_FAILED: job not found', { jobId });
    return;
  }
  
  // Move back to pending
  await r.lpush(QUEUE_LIST, jobJson);
  await r.del(CLAIMED_PREFIX + jobId);
  
  console.log('[Queue] RELEASED', { jobId });
}

/**
 * Reaper: re-queue all expired claims
 * Run on startup and periodically
 */
export async function reaper(): Promise<number> {
  const r = getRedis();
  
  // Scan for expired claims (simplified - iterate keys)
  const keys = await r.lrange(CLAIMED_PREFIX.replace('*', ''), 0, -1);
  let count = 0;
  
  for (const key of keys) {
    if (!key.startsWith(CLAIMED_PREFIX)) continue;
    
    const jobJson = await r.get(key);
    if (!jobJson) continue;
    
    const job: CuratorJob = JSON.parse(jobJson);
    await r.lpush(QUEUE_LIST, jobJson);
    await r.del(key);
    count++;
  }
  
  if (count > 0) {
    console.log('[Queue] REAPER: re-queued', { count });
  }
  
  return count;
}

/**
 * Check if queue service is configured
 */
export function isConfigured(): boolean {
  return !!REDIS_URL;
}