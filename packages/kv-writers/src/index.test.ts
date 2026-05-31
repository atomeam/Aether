import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InstrumentedKV } from './writer';
import { KVTelemetry } from './telemetry';
import { StateKeys, CacheKeys, MetricsKeys } from './keys';
import { CrewManager } from './crew';

// ─── Mock KVNamespace ────────────────────────────────────────────────
function createMockKV(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
    delete: vi.fn(async (key: string) => { store.delete(key); }),
    list: vi.fn(async () => ({ keys: [], list_complete: true, cacheStatus: null })),
    getWithMetadata: vi.fn(async () => ({ value: null, metadata: null, cacheStatus: null })),
  } as unknown as KVNamespace;
}

// ─── Key Registry Tests ──────────────────────────────────────────────
describe('KV Key Registry', () => {
  it('generates STATE keys correctly', () => {
    expect(StateKeys.usage('1.2.3.4')).toBe('usage:1.2.3.4');
    expect(StateKeys.apiKey('abc123')).toBe('api_key:abc123');
    expect(StateKeys.dailyCount('2026-05-29', 'xyz')).toBe('daily:2026-05-29:xyz');
    expect(StateKeys.agentHeartbeat('viktor')).toBe('agent:heartbeat:viktor');
  });

  it('generates CACHE keys correctly', () => {
    expect(CacheKeys.proposalsSnapshot).toBe('proposals:snapshot');
    expect(CacheKeys.lessonsIndex).toBe('lessons:index');
    expect(CacheKeys.lessonHash('abc')).toBe('lessons:hash:abc');
    expect(CacheKeys.crewSnapshot).toBe('crew:snapshot');
    expect(CacheKeys.crewAgent('devin')).toBe('crew:agent:devin');
  });

  it('generates METRICS keys correctly', () => {
    expect(MetricsKeys.kvOps('bridge', '2026-05-29')).toBe('kv:ops:bridge:2026-05-29');
    expect(MetricsKeys.requests('bridge', '2026-05-29')).toBe('requests:bridge:2026-05-29');
  });
});

// ─── InstrumentedKV Tests ────────────────────────────────────────────
describe('InstrumentedKV', () => {
  let mockKV: KVNamespace;
  let telemetry: KVTelemetry;
  let writer: InstrumentedKV;

  beforeEach(() => {
    mockKV = createMockKV();
    telemetry = new KVTelemetry('test-worker', null);
    writer = new InstrumentedKV(mockKV, telemetry, 'STATE');
  });

  it('get() caches reads in memory', async () => {
    await mockKV.put('key1', 'value1');
    
    const v1 = await writer.get('key1');
    const v2 = await writer.get('key1');
    
    expect(v1).toBe('value1');
    expect(v2).toBe('value1');
    // Second read should be from cache — only 1 KV get call
    expect(mockKV.get).toHaveBeenCalledTimes(1);
  });

  it('get() returns null for missing keys', async () => {
    const v = await writer.get('nonexistent');
    expect(v).toBeNull();
  });

  it('getJSON() parses JSON values', async () => {
    await mockKV.put('json-key', JSON.stringify({ foo: 'bar' }));
    const v = await writer.getJSON<{ foo: string }>('json-key');
    expect(v).toEqual({ foo: 'bar' });
  });

  it('put() writes immediately and updates cache', async () => {
    await writer.put('key1', 'value1');
    
    // Verify KV write
    expect(mockKV.put).toHaveBeenCalledWith('key1', 'value1', undefined);
    
    // Read cache should have the value (no extra KV get)
    const v = await writer.get('key1');
    expect(v).toBe('value1');
    expect(mockKV.get).not.toHaveBeenCalled();
  });

  it('enqueue() batches writes', async () => {
    writer.enqueue('a', '1');
    writer.enqueue('b', '2');
    writer.enqueue('c', '3');
    
    expect(writer.pendingCount).toBe(3);
    // Not written to KV yet
    expect(mockKV.put).not.toHaveBeenCalled();
    
    // But reads-your-writes works
    const v = await writer.get('b');
    expect(v).toBe('2');
  });

  it('flushWrites() sends all pending writes to KV', async () => {
    writer.enqueue('a', '1');
    writer.enqueue('b', '2');
    
    const result = await writer.flushWrites();
    expect(result.flushed).toBe(2);
    expect(result.errors).toEqual([]);
    expect(writer.pendingCount).toBe(0);
  });

  it('delete() removes from KV and cache', async () => {
    await writer.put('key1', 'value1');
    await writer.delete('key1');
    
    expect(mockKV.delete).toHaveBeenCalledWith('key1');
    // Cache should be cleared
    const v = await writer.get('key1');
    expect(v).toBeNull();
  });

  it('records telemetry for all operations', async () => {
    await writer.get('a');
    await writer.put('b', 'v');
    await writer.delete('c');
    await writer.list();
    
    const snap = telemetry.snapshot();
    expect(snap.ops.get).toBe(1);
    expect(snap.ops.put).toBe(1);
    expect(snap.ops.delete).toBe(1);
    expect(snap.ops.list).toBe(1);
  });
});

// ─── Telemetry Tests ─────────────────────────────────────────────────
describe('KVTelemetry', () => {
  it('accumulates op counters', () => {
    const t = new KVTelemetry('test', null);
    t.record('get', 3);
    t.record('put', 2);
    t.recordRequest();
    t.recordError();
    
    const snap = t.snapshot();
    expect(snap.ops.get).toBe(3);
    expect(snap.ops.put).toBe(2);
    expect(snap.totalRequests).toBe(1);
    expect(snap.errors).toBe(1);
    expect(snap.worker).toBe('test');
  });

  it('flush writes to METRICS KV', async () => {
    const mockMetrics = createMockKV();
    const t = new KVTelemetry('bridge', mockMetrics);
    t.record('get', 10);
    t.record('put', 5);
    
    await t.flush();
    
    expect(mockMetrics.put).toHaveBeenCalledTimes(1);
    // Counters reset after flush
    const snap = t.snapshot();
    expect(snap.ops.get).toBe(0);
    expect(snap.ops.put).toBe(0);
  });

  it('skips flush when no ops recorded', async () => {
    const mockMetrics = createMockKV();
    const t = new KVTelemetry('bridge', mockMetrics);
    
    await t.flush();
    
    expect(mockMetrics.put).not.toHaveBeenCalled();
  });
});

// ─── CrewManager Tests ───────────────────────────────────────────────
describe('CrewManager', () => {
  let stateKV: KVNamespace;
  let cacheKV: KVNamespace;
  let crew: CrewManager;
  let telemetry: KVTelemetry;

  beforeEach(() => {
    stateKV = createMockKV();
    cacheKV = createMockKV();
    telemetry = new KVTelemetry('test', null);
    const state = new InstrumentedKV(stateKV, telemetry, 'STATE');
    const cache = new InstrumentedKV(cacheKV, telemetry, 'STATE_CACHE');
    crew = new CrewManager(state, cache);
  });

  it('returns default agents when no heartbeats exist', async () => {
    const agents = await crew.getAllAgents();
    expect(agents.length).toBe(9);
    expect(agents[0].id).toBe('viktor');
    expect(agents[0].name).toBe('Viktor');
  });

  it('heartbeat updates agent status', async () => {
    const updated = await crew.heartbeat('viktor', {
      status: 'active',
      currentTask: 'KV writers + Crew Room',
      leverage: 80,
      prsShipped: 5,
    });

    expect(updated.id).toBe('viktor');
    expect(updated.status).toBe('active');
    expect(updated.currentTask).toBe('KV writers + Crew Room');
    expect(updated.leverage).toBe(80);
    expect(updated.lastHeartbeat).toBeTruthy();
  });

  it('getSnapshot returns aggregate stats', async () => {
    await crew.heartbeat('viktor', { status: 'active', prsShipped: 5, tasksCompleted: 10 });
    await crew.heartbeat('devin', { status: 'on-ice', prsShipped: 1, tasksCompleted: 3 });
    
    const snapshot = await crew.getSnapshot();
    expect(snapshot.agents.length).toBe(9);
    expect(snapshot.totalPRs).toBeGreaterThanOrEqual(6);
    expect(snapshot.totalTasks).toBeGreaterThanOrEqual(13);
  });
});
