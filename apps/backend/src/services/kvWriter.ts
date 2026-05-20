/**
 * KV Writer Service
 * 
 * Writes proposals and lessons snapshots to Cloudflare KV.
 * Used by backend to push data to Bridge KV.
 * 
 * Required env vars:
 *   CF_ACCOUNT_ID - Cloudflare account ID
 *   CF_API_TOKEN - Cloudflare API token
 *   CF_KV_STATE_ID - KV namespace ID for STATE (proposals)
 *   CF_KV_STATE_CACHE_ID - KV namespace ID for STATE_CACHE (lessons)
 */

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_KV_STATE_ID = process.env.CF_KV_STATE_ID || '7319ee9195df4ccf8f4b2c8449dd7930';
const CF_KV_STATE_CACHE_ID = process.env.CF_KV_STATE_CACHE_ID || 'd22e703c3af9451a9942fa2a551a1aa8';

export interface Proposal {
  id: string;
  title: string;
  stage: string;
  source?: string;
  updatedAt?: string;
}

export interface Lesson {
  id: string;
  hash: string;
  title: string;
  source?: string;
  updatedAt?: string;
}

/**
 * Write a value to Cloudflare KV namespace
 */
async function writeToKV(namespaceId: string, key: string, value: unknown): Promise<boolean> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    console.log('[KV] Skipping write - CF credentials not configured');
    return false;
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      console.log(`[KV] Write failed: ${response.status} ${await response.text()}`);
      return false;
    }

    console.log(`[KV] Wrote ${key} to namespace ${namespaceId}`);
    return true;
  } catch (e) {
    console.log(`[KV] Write error: ${e}`);
    return false;
  }
}

/**
 * Write proposals snapshot to STATE KV
 * 
 * @param proposals - Array of proposals to write
 * @returns true if write succeeded
 */
export async function pushProposalsSnapshot(proposals: Proposal[]): Promise<boolean> {
  const snapshot = {
    updatedAt: new Date().toISOString(),
    proposals: proposals.map(p => ({
      id: p.id,
      title: p.title,
      stage: p.stage,
      source: p.source || 'backend-kv-writer',
    })),
  };

  console.log(`[KV] Writing ${proposals.length} proposals to STATE`);
  return writeToKV(CF_KV_STATE_ID, 'proposals:snapshot', JSON.stringify(snapshot));
}

/**
 * Write lessons index to STATE_CACHE KV
 * 
 * @param lessons - Array of lessons to write
 * @returns true if write succeeded
 */
export async function pushLessonsIndex(lessons: Lesson[]): Promise<boolean> {
  const index = {
    updatedAt: new Date().toISOString(),
    lessons: lessons.map(l => ({
      id: l.id,
      hash: l.hash,
      title: l.title,
      source: l.source || 'backend-kv-writer',
    })),
  };

  console.log(`[KV] Writing ${lessons.length} lessons to STATE_CACHE`);
  return writeToKV(CF_KV_STATE_CACHE_ID, 'lessons:index', JSON.stringify(index));
}

/**
 * Check if KV writer is configured
 */
export function isConfigured(): boolean {
  return !!(CF_ACCOUNT_ID && CF_API_TOKEN);
}