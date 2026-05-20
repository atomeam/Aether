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

export type ProposalSnapshotItem = {
  id: string;
  title: string;
  stage: string;
  source?: string;
  [key: string]: unknown;
};

export type LessonIndexItem = {
  id: string;
  hash: string;
  title: string;
  source?: string;
  [key: string]: unknown;
};

/**
 * Require an environment variable to be set
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

/**
 * Write a value to Cloudflare KV namespace
 */
async function putKv(namespaceId: string, key: string, value: unknown): Promise<void> {
  const accountId = requireEnv('CF_ACCOUNT_ID');
  const apiToken = requireEnv('CF_API_TOKEN');

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`KV write failed for ${key}: ${res.status} ${text}`);
  }
}

/**
 * Write proposals snapshot to STATE KV
 */
export async function pushProposalsSnapshot(proposals: ProposalSnapshotItem[]): Promise<void> {
  const namespaceId = requireEnv('CF_KV_STATE_ID');
  const payload = {
    updatedAt: new Date().toISOString(),
    proposals: proposals.map((p) => ({
      ...p,
      source: p.source ?? 'backend-proposals-watcher',
    })),
  };

  await putKv(namespaceId, 'proposals:snapshot', payload);
  console.info('KV write', {
    key: 'proposals:snapshot',
    count: payload.proposals.length,
    updatedAt: payload.updatedAt,
  });
}

/**
 * Write lessons index to STATE_CACHE KV
 */
export async function pushLessonsIndex(lessons: LessonIndexItem[]): Promise<void> {
  const namespaceId = requireEnv('CF_KV_STATE_CACHE_ID');
  const payload = {
    updatedAt: new Date().toISOString(),
    lessons: lessons.map((l) => ({
      ...l,
      source: l.source ?? 'backend-lessons-index',
    })),
  };

  await putKv(namespaceId, 'lessons:index', payload);
  console.info('KV write', {
    key: 'lessons:index',
    count: payload.lessons.length,
    updatedAt: payload.updatedAt,
  });
}

/**
 * Check if KV writer is configured with credentials
 */
export function isConfigured(): boolean {
  return !!(process.env.CF_ACCOUNT_ID && process.env.CF_API_TOKEN);
}